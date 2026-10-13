// room: C drawing room (interior designer). Mirror of the A drawing room: a tea table with four stair chairs at the
// centre of the room under a hanging lantern (the focal group, on the line from the stair foot to the bay), a window
// bench under the bay opening, a settee on the east wall with a side table, and a desk and shelf in the back corner.
// Inner air box [20,8,13,26,11,23]. The stair well x20..21 z20..23 and the chimney cell x20 z18..19 stay clear, and
// nothing sits in the side-window cells x26 z15 and z21 or in front of the front window at x25.
// Drawn as text: rows run along +z from z13 (x20..26 left to right), one layer per y from y8 up to y11.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const stair = (facing) => ["spruce_stairs", { facing, half: "bottom" }];

const LEGEND = {
  n: stair("north"), // chair with its back to the north: faces the table to the south
  s: stair("south"),
  w: stair("west"),
  e: stair("east"), // settee and chairs with the back on the east wall
  F: "spruce_fence", // table and shelf legs
  L: ["spruce_slab", { type: "bottom" }], // table tops
  p: "potted_poppy",
  c: "potted_cornflower",
  l: ["lantern", { hanging: "false" }], // standing lantern on the desk
  A: ["lantern", { hanging: "true" }], // hanging from the second-floor deck at y12
};

const Y8 = [
  " nn   e", // z13: window bench (x21..22), settee (x26)
  "     Fe", // z14: side table (x25), settee
  "     l ", // z15: floor lamp by the settee (x25); the side-window cell x26 stays clear
  "   n   ", // z16: tea-table chair, north side
  "  wFe  ", // z17: tea table with chairs west and east
  "   s   ", // z18: tea-table chair, south side
  "       ", // z19: lane from the stair foot
  "       ", // z20: stair well x20..21 (not ours to furnish)
  "       ", // z21: clear: side window cell
  "    wFe", // z22: desk with chairs west and east
  "      F", // z23: shelf post in the back corner
];

const Y9 = [
  "       ",
  "     L ", // side-table top
  "       ",
  "       ",
  "   L   ", // tea-table top
  "       ",
  "       ",
  "       ",
  "       ",
  "     L ", // desk top
  "      L", // shelf top
];

const Y10 = [
  "       ",
  "     p ", // poppy on the side table
  "       ",
  "       ",
  "   c   ", // cornflower on the tea table: the focal flower
  "       ",
  "       ",
  "       ",
  "       ",
  "     l ", // standing lantern on the desk
  "      p", // poppy on the shelf
];

const Y11 = [
  "A      ", // hanging lantern over the bay bench
  "       ",
  "       ",
  "       ",
  "   A   ", // hanging lantern over the tea table
  "       ",
  "       ",
  "      A", // hanging lantern by the east side window (x26)
  "       ",
  "       ",
  "       ",
];

export function build(g) {
  layers(g, [20, 8, 13], LEGEND, [Y8, Y9, Y10, Y11]);
}
