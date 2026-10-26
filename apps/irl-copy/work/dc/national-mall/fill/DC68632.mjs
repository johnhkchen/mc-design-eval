// 2011 R Street NW (Dupont Circle): a red-brick Victorian rowhouse of about 1890-1910, converted to apartments.
// The street front is z=0 (the full row of footprint cells); the rear is z=2 and z=1 is the air-and-floor interior.
// The lidar roof reads 8 over the house, 6 over the step-down, 4 over the lower wing: smoothed into three flat tiers.
// The notch at x=11, z=1..2 is left open as the rear light well.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68632.cells.json", "utf8"));

// tier top (the roof surface, in blocks above y 0) by column, after smoothing the lidar noise
const tierTop = (x) => (x <= 8 ? 8 : x <= 10 ? 6 : 4);
const FLOORS = { 8: [3, 6], 6: [3], 4: [] };          // floor slabs / string courses (solid across the depth)
const WINROWS = { 8: [1, 2, 4, 5], 6: [1, 2], 4: [1, 2] };
const winCol = (x, T) => (T === 8 ? [1, 2, 4, 5, 7, 8].includes(x) : T === 6 ? x === 10 : [11, 12].includes(x));
const DOOR_X = 6;                                      // the entrance sits in a pier of the house front

const g = new Voxels([14, 20, 3]);
const pane = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, ground] of cells) {
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");   // foundation up to the lowest ground (0 here)
  const T = tierTop(x), roofY = T - 1;
  for (let y = ground; y < T; y++) {
    if (z === 0 && x === DOOR_X && y <= 1) {
      g.set(x, y, z, "oak_door", { facing: "north", half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                  // plinth / ground floor slab
    if (y === roofY) {                                                          // roof deck; cornice on the street face
      if (z === 0) g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (z === 1) {                                                              // the air gap behind the glass
      if (FLOORS[T].includes(y)) g.set(x, y, z, "stone_bricks");
      else if (x === 0 || x === 13) g.set(x, y, z, "bricks");                  // the two end walls, closed
      else if (T === 8 && y === 1 && [2, 5, 8].includes(x)) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      else if (T === 8 && y === 4 && [4, 7].includes(x)) g.set(x, y, z, "glowstone");
      continue;
    }
    if (FLOORS[T].includes(y)) { g.set(x, y, z, "stone_bricks"); continue; }     // string course / floor slab
    if (WINROWS[T].includes(y) && winCol(x, T)) { g.set(x, y, z, "glass_pane", pane); continue; }
    if (z === 0 && x === DOOR_X && y === 2) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    g.set(x, y, z, "bricks");                                                   // piers and walls
  }
}

// roof plant: a small stair-and-plant box on the house roof, on the roof deck (y 7)
for (let x = 5; x <= 6; x++) for (let z = 1; z <= 2; z++) {
  for (let y = 8; y <= 9; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68632.nbt"));
