// Room part, bakehouse (Backhaus): interior designer fills the inner box [18,2,14,20,7,21].
// Layout: the kneading trough (cauldrons) runs along the west wall, the long work table along the east wall, flour
// barrels and sacks at the north and south ends, the wood stack by the side door, and the lit smoker beside the oven
// mouth. Column x=19 stays clear as the lane from the shop doorway (18,2,15) to the oven mouth and the side door.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Floor level y=2 (rows z=14..21, columns x=18..20).
const FLOOR = {
  B: ["barrel", { facing: "up" }],
  C: "cauldron",
  L: ["lantern", { hanging: "false" }],
  T: "spruce_fence",
  W: ["spruce_log", { axis: "z" }],
};
const FLOOR_ROWS = [
  "B.B", // z14: flour barrel by the north wall, barrel at the east corner
  "..T", // z15: shop doorway at (18,2,15) stays clear; table leg
  "L.T", // z16: standing lantern by the doorway; table leg
  "C..", // z17: kneading trough (west), side door cell (20,2,17) clear
  "C.W", // z18: trough; wood stack by the side door
  "C.W", // z19: trough; wood stack
  "B.W", // z20: flour barrel; wood stack
  "..L", // z21: the smoker at (18,2,21) is P3's, left as built; lantern for the glow
];

// Slab tops of the work table at y=3 (rows z=14..21).
const TABLE_TOP = {
  s: ["spruce_slab", { type: "bottom" }],
  h: "hay_block",
  w: ["spruce_log", { axis: "z" }],
};
const TABLE_ROWS = [
  "h..", // z14: flour sack on the barrel
  "..s", // z15: work-table top
  "..s", // z16: work-table top
  "...", // z17
  "..w", // z18: wood stack, second course
  "..w", // z19: wood stack, second course
  "h..", // z20: flour sack on the barrel
  "...", // z21
];

export function build(g) {
  layers(g, [18, 2, 14], FLOOR, [FLOOR_ROWS]);
  layers(g, [18, 3, 14], TABLE_TOP, [TABLE_ROWS]);
}
