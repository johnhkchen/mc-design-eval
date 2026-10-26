// DC55080: 2119 S St NW, a two-bay Victorian rowhouse in red brick over a stone plinth, stepped up toward the rear
// (the lot falls 2 blocks front to back). Storey lines at y 2 and y 4; windows in white-trimmed glass; a raised stoop
// door at the front; a cornice on every tier; two brick chimneys. Interiors are a 1-cell air gap behind the glass.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55080.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..3, z 0..10

const g = new Voxels([4, 19, 11]);
const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const inFoot = (x, z) => ground.has(key(x, z));

// Smoothed massing: the lidar's roof steps (5 at the front, 6 mid, 7 at the rear and its ell) become three flat tiers.
const roofTier = (z) => (z <= 3 ? 5 : z <= 7 ? 6 : 7);

// Window and door positions on the exterior faces (x, z on the cell's own face; y rows handled below).
const isWindow = (x, z) =>
  (z === 0 && (x === 1 || x === 2)) ||           // front bays
  (x === 0 && [2, 4, 6, 8].includes(z)) ||       // west flank
  (x === 2 && [2, 4, 6].includes(z)) ||          // east flank, under the wing
  (x === 3 && z === 9) ||                        // ell's east face
  (z === 10 && x === 1);                         // rear
const glassState = (x, z) => (z === 0 || z === 10 ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const [x, z, gr] of cells) {
  const H = roofTier(z);
  const exterior = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inFoot(x + dx, z + dz));
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");                     // foundation to the lowest ground under it
  if (!exterior) {                                                                 // interior: floors solid, an air gap behind the glass
    for (let y = gr; y < H; y++) {
      if (y === 3 || (y === 5 && H - 1 > 5)) continue;                              // air rows
      g.set(x, y, z, y === H - 1 ? "smooth_stone" : "bricks");
    }
    // warm light in the air gap behind a few windows
    if ((x === 1 && z === 1) || (x === 1 && z === 6)) g.set(x, 3, z, "glowstone");
    if (x === 1 && z === 9) g.set(x, 5, z, "shroomlight");                          // rear ell's upper storey
    if (x === 1 && z === 6) g.set(x, H, z, "bricks");                               // chimney on the mid roof
    if (x === 1 && z === 9) { g.set(x, H, z, "bricks"); g.set(x, H + 1, z, "bricks"); }
    continue;
  }
  // exterior shell
  for (let y = gr; y < H; y++) {
    if (y === H - 1) { g.set(x, y, z, "smooth_stone"); continue; }                 // cornice / flat roof edge
    if (x === 0 && z === 0 && (y === 2 || y === 3)) {                               // front door, hinged left, facing out
      g.set(x, y, z, "oak_door", { facing: "south", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === 2 || y === 4 || y < 2) {                                              // base course and storey lines
      g.set(x, y, z, y === 2 && isWindow(x, z) ? "white_terracotta" : "stone_bricks");
      continue;
    }
    if ((y === 3 || y === 5) && isWindow(x, z)) { g.set(x, y, z, "glass_pane", glassState(x, z)); continue; }
    g.set(x, y, z, "bricks");
  }
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55080.nbt");
console.log("DC55080 saved", g.count(), "blocks");
