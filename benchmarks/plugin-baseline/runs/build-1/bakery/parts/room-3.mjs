// Room part, bakehouse (Backhaus): interior designer fills the box [18,2,14,20,7,21].
// Layout: x=19 is a clear walking spine from the shop doorway (18,2,15) to the oven mouth (19,2,21); flour and
// kneading on the west column (x=18), flour stores, wood and the peel on the east column (x=20). The smoker
// beside the oven mouth (18,2,21) belongs to the oven part, so this part leaves that cell alone. Lanterns stand on
// the barrels and counter.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND_Y2 = {
  b: ["barrel", { facing: "up" }], // flour barrel
  h: "hay_block", // flour sacks
  w: ["water_cauldron", { level: "3" }], // kneading trough
  p: "spruce_planks", // dough counter
  g: ["spruce_log", { axis: "x" }], // wood stack by the side door
  f: "spruce_fence", // peel post
};

const LEGEND_Y3 = {
  l: ["lantern", { hanging: "false" }], // standing on a barrel or the counter
  c: "cake", // bread loaves on the counter
  t: ["spruce_slab", { type: "top" }], // peel head on the post
};

export function build(g) {
  // y=2 floor-level furniture; rows run along +z from z=14, columns are x=18,19,20
  layers(g, [18, 2, 14], LEGEND_Y2, [
    "b h", // z=14: flour barrel west, flour sacks east
    "   ", // z=15: shop doorway row, keep clear
    "w  ", // z=16: kneading trough
    "w  ", // z=17: kneading trough (side door row, east cell clear)
    "p g", // z=18: dough counter, wood stack
    "p g", // z=19: dough counter, wood stack
    "p  ", // z=20: dough counter
    "  f", // z=21: smoker (18,2,21) is the oven part's; peel post
  ]);
  layers(g, [18, 3, 14], LEGEND_Y3, [
    "l  ", // z=14: lantern on the barrel
    "   ",
    "   ",
    "   ",
    "c  ", // z=18: loaf on the counter
    "l  ", // z=19: lantern on the counter
    "c  ", // z=20: loaf on the counter
    "  t", // z=21: peel head
  ]);
}
