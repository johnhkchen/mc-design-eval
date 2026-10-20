import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245226";
const W = 33, H = 52, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup and common floor level (max ground under the footprint).
const inFp = new Set();
let L = 0;
for (const [x, z, gr] of cells) {
  inFp.add(`${x},${z}`);
  if (gr > L) L = gr;
}
const has = (x, z) => inFp.has(`${x},${z}`);

// Only writes inside the volume and on footprint cells.
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!has(x, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // +z is the front (street) face
const isPerim = (x, z) => has(x, z) && DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
const outwardOf = (x, z) => DIRS.find(([dx, dz]) => !has(x + dx, z + dz));

// Storeys of 5 blocks: as many as fit under the 52-block volume (with roof plant),
// capped at 8 (about 40 blocks above the common floor).
const S = Math.max(1, Math.min(8, Math.floor((47 - L) / 5)));
const top = L + 5 * S;

// Foundation: solid from y 0 up to the common floor under every footprint cell.
for (const [x, z] of cells) {
  for (let y = 0; y < L; y++) {
    if (y === L - 1 && isPerim(x, z)) put(x, y, z, "polished_granite");
    else put(x, y, z, "stone_bricks");
  }
}

// Storeys.
for (let s = 0; s < S; s++) {
  const yb = L + 5 * s;
  for (const [x, z] of cells) {
    const perim = isPerim(x, z);

    // Floor slab (interior) / string course (perimeter).
    put(x, yb, z, perim ? "white_concrete" : "light_gray_concrete");
    if (!perim) continue;

    const out = outwardOf(x, z);
    const [dx, dz] = out;
    const u = dz !== 0 ? x : z; // bay index along the face
    const isFront = dz === 1;
    const isEntranceBay = isFront && s === 0 && x >= 15 && x <= 17;

    // Window zone: rows yb+1..yb+3.
    for (let dy = 1; dy <= 3; dy++) {
      const y = yb + dy;
      if (isEntranceBay) {
        if (x === 16) {
          if (dy === 1) {
            put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          } else if (dy === 2) {
            put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          } else {
            put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
          }
        } else {
          put(x, y, z, "white_concrete");
        }
        continue;
      }
      if (u % 3 === 0) {
        put(x, y, z, "white_concrete"); // mullion / pier
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }

    // Warm lights behind some glass (interior cell just inside the facade).
    const h = (x * 31 + s * 13 + z * 7) % 9;
    if (!isEntranceBay && u % 3 !== 0 && h === 0) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz)) {
        put(ix, yb + 2, iz, (x + z + s) % 2 ? "glowstone" : "shroomlight");
      }
    }

    // Spandrel / storey line under the next slab.
    put(x, yb + 4, z, "smooth_quartz");
  }
}

// Roof slab, cornice and parapet.
for (const [x, z] of cells) {
  const perim = isPerim(x, z);
  put(x, top, z, perim ? "smooth_quartz" : "light_gray_concrete");
  if (perim) {
    put(x, top + 1, z, "smooth_quartz");
    put(x, top + 2, z, "white_concrete");
  }
}

// Roof plant: a central box with a rod on top, if the volume allows.
if (top + 4 <= H - 1) {
  for (let x = 11; x <= 21; x++) {
    for (let z = 5; z <= 10; z++) {
      if (!has(x, z)) continue;
      const edge = x === 11 || x === 21 || z === 5 || z === 10;
      for (let dy = 1; dy <= 3; dy++) {
        put(x, top + dy, z, edge ? "light_gray_concrete" : "stone_bricks");
      }
      put(x, top + 3, z, "smooth_quartz");
    }
  }
  put(16, top + 4, 8, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
