import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453477000";
const W = 55, H = 81, D = 33;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
let base = 0;
for (const [x, z, g] of cells) {
  ground.set(key(x, z), g);
  base = Math.max(base, g);
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const inFp = (x, z) => ground.has(key(x, z));

// Storeys: 14 x 5 blocks. Tower is full footprint up to storey 9,
// then a stepped setback tier (inset 8 blocks) for storeys 10..13.
const STOREYS = 14;
const STOREY_H = 5;
const SETBACK_FROM = 10;
const tier = (s, x, z) => {
  if (!inFp(x, z)) return false;
  if (s < SETBACK_FROM) return true;
  return x >= 8 && x <= 46 && z >= 8 && z <= 24;
};
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exterior = (s, x, z) => NB.some(([dx, dz]) => !tier(s, x + dx, z + dz));
const cornerCount = (s, x, z) => NB.filter(([dx, dz]) => !tier(s, x + dx, z + dz)).length;

// 1. Foundation and plinth: solid from y0 up to the common datum (max ground).
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");
}

// 2. Storeys.
for (let s = 0; s < STOREYS; s++) {
  const yb = base + STOREY_H * s;

  for (const [x, z] of cells.map(([x, z]) => [x, z])) {
    if (tier(s, x, z)) {
      // Floor slab for this storey.
      put(x, yb, z, s === 0 ? "polished_andesite" : "white_concrete");

      if (exterior(s, x, z)) {
        const corner = cornerCount(s, x, z) >= 2;
        for (let yy = yb + 1; yy <= yb + 4; yy++) {
          if (yy === yb + 4) {
            // Spandrel / storey line.
            put(x, yy, z, "white_concrete");
          } else if (corner || (x + z) % 3 === 0) {
            // Mullion / frame.
            put(x, yy, z, "white_concrete");
          } else {
            // Green-tinted curtain-wall glass (Taipei 101 era).
            put(x, yy, z, "cyan_stained_glass");
          }
        }
      }
    } else if (s > 0 && tier(s - 1, x, z)) {
      // Terrace on top of the storey below, where the tower steps back.
      put(x, yb, z, "light_gray_concrete");
    }
  }
}

// 3. Warm lights behind the glass: glowstone on the inner floor next to the facade.
for (let s = 0; s < STOREYS; s++) {
  const yb = base + STOREY_H * s;
  for (const [x, z] of cells.map(([x, z]) => [x, z])) {
    if (!tier(s, x, z) || exterior(s, x, z)) continue;
    if (!exterior(s, x, z) && NB.some(([dx, dz]) => tier(s, x + dx, z + dz) && exterior(s, x + dx, z + dz))) {
      if ((x * 31 + z * 17 + s * 13) % 29 === 0) put(x, yb + 1, z, "glowstone");
    }
  }
}

// 4. Ground-floor entrance on the street (north, z = 0) face.
const yb0 = base;
for (let x = 26; x <= 27; x++) {
  const hinge = x === 26 ? "left" : "right";
  put(x, yb0 + 1, 0, "oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  put(x, yb0 + 2, 0, "oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}
// Canopy over the entrance, inside the footprint.
for (let x = 22; x <= 32; x++) {
  for (let z = 0; z <= 1; z++) {
    if (tier(0, x, z)) put(x, yb0 + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
// Entrance lobby: white floor at the entry, glass on either side already present.

// 5. Roof on the top tier.
const top = STOREYS - 1;
const yRoof = base + STOREY_H * (top + 1);
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (tier(top, x, z)) put(x, yRoof, z, "light_gray_concrete");
}

// 6. Crown / mechanical penthouse and the tapering mast.
const crown = (x, z) => x >= 21 && x <= 33 && z >= 12 && z <= 20;
for (let y = yRoof + 1; y <= yRoof + 3; y++) {
  for (let x = 21; x <= 33; x++) {
    for (let z = 12; z <= 20; z++) {
      if (!crown(x, z)) continue;
      const edge = x === 21 || x === 33 || z === 12 || z === 20;
      if (edge) put(x, y, z, "smooth_quartz");
      else if (y === yRoof + 3) put(x, y, z, "smooth_quartz");
    }
  }
}
// Warm lamps inside the crown band.
put(24, yRoof + 2, 14, "sea_lantern");
put(30, yRoof + 2, 18, "sea_lantern");

// Antenna mast on the crown.
for (let y = yRoof + 4; y <= yRoof + 8; y++) put(27, y, 16, "iron_bars");

g.save(`${DIR}/${ID}.nbt`);
