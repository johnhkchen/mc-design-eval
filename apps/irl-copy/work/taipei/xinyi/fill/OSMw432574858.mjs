import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw432574858";
const W = 24, H = 23, D = 105;

// Record: roof about 11 blocks above lowest ground, footprint 24 x 105.
// Reads as a two-storey, 1980s-style reinforced-concrete commercial block:
// flat roof with a parapet, pale smooth-quartz facade, light-blue tinted glazing,
// shopfronts on the ground storey, a recessed entrance on the west face, and a
// rooftop plant room and water tank.
const ROOF_SLAB = 10;   // top floor slab (roof deck)
const PARAPET = 11;     // parapet course on the outer ring
const ENTRY_Z = 52;     // entrance position along the west face

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gmin = Math.min(...raw.map((c) => c[2]));
const cells = raw.map(([x, z, gr]) => [x, z, Math.round(gr - gmin)]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));

// Outward face of an exterior cell. Returns null for interior cells.
function faceInfo(x, z) {
  if (!has(x - 1, z)) return { face: "west", dx: 1, dz: 0, u: z };
  if (!has(x + 1, z)) return { face: "east", dx: -1, dz: 0, u: z };
  if (!has(x, z - 1)) return { face: "north", dx: 0, dz: 1, u: x };
  if (!has(x, z + 1)) return { face: "south", dx: 0, dz: -1, u: x };
  return null;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: at the ground, at storey lines 5 and 10 (roof deck).
  const floors = new Set([gr, 5, 10].filter((l) => l >= gr && l <= 10));
  for (const l of floors) {
    put(x, l, z, l === ROOF_SLAB ? "gray_concrete" : "light_gray_concrete");
  }

  const f = faceInfo(x, z);
  if (!f) continue; // interior: air between slabs, no interior fit-out

  for (let y = gr; y <= ROOF_SLAB; y++) {
    // Recessed entrance on the west face: dark oak door, two blocks high.
    if (f.face === "west" && z === ENTRY_Z && gr + 2 <= 3 && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "west",
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (floors.has(y)) {
      // Base course sits on the ground line of the outer ring.
      if (y === gr) put(x, y, z, "stone_bricks");
      continue;
    }

    // Storey beams at y 4 and 9.
    if (y === 4 || y === 9) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Ground-storey bulkhead under the shopfront glazing.
    if (y === 1) {
      put(x, y, z, "polished_andesite");
      continue;
    }

    // Default wall: smooth quartz.
    put(x, y, z, "smooth_quartz");

    const pier = f.u % 4 === 0;
    const band = (y >= 2 && y <= 3) || (y >= 6 && y <= 8);
    if (band && !pier) {
      put(x, y, z, "light_blue_stained_glass_pane");
      // Air gap behind the glass, with a warm light in some upper-storey bays.
      const ix = x + f.dx, iz = z + f.dz;
      if (has(ix, iz) && y === 7 && f.u % 8 === 2) {
        put(ix, y, iz, "shroomlight");
      }
    }
  }

  // Parapet course on the outer ring.
  if (gr <= ROOF_SLAB) put(x, PARAPET, z, "smooth_quartz");
}

// Rooftop plant room: walls at y 11..13, roof slab at y 14, only over real roof cells.
const roofOK = (x, z) => has(x, z) && G.get(key(x, z)) <= ROOF_SLAB;
for (let x = 6; x <= 17; x++) {
  for (let z = 40; z <= 64; z++) {
    if (!roofOK(x, z)) continue;
    const wall = x === 6 || x === 17 || z === 40 || z === 64;
    for (let y = 11; y <= 13; y++) {
      if (wall) put(x, y, z, "smooth_quartz");
    }
    put(x, 14, z, "light_gray_concrete");
  }
}

// Rooftop water tank: solid cube on the roof deck.
for (let x = 19; x <= 21; x++) {
  for (let z = 20; z <= 22; z++) {
    if (!roofOK(x, z)) continue;
    for (let y = 11; y <= 13; y++) put(x, y, z, "white_concrete");
    put(x, 14, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
