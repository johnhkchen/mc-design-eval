// Room "P2 loft west bedroom" (interior designer's part): under the roof, bed heads on the west wall x35 (the room's
// west face), two beds whole via bed(), a barrel dresser on the north knee wall with a lantern and a pot on it, a small
// table with a chair by the door side, and a second lantern on a barrel in the south-east corner. Air box x36..40,
// y6..8, z14..18; the door is on the east wall (41,6..7,16) and its inner cell (40,6,16) stays clear.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// the furniture drawn as text (origin [36, 6, 14]): rows run along +x (x36..x40), successive rows along +z (z14..z18)
const LEGEND = {
  B: "barrel",
  F: "oak_fence",
  T: ["oak_slab", { type: "top" }],
  c: ["spruce_stairs", { facing: "west", half: "bottom" }],
  L: ["lantern", { hanging: "false" }],
  P: "flower_pot",
};

// feet level (y6): flower pot on the floor, the dresser barrels, table post, chair, the corner barrel
const FLOOR = [
  "..PBB", // z14: pot on the floor at x38, dresser on the north knee wall
  ".....", // z15: the lane from the door to both beds
  "..cF.", // z16: chair and table post, the door cell x40 stays clear
  ".....", // z17
  "....B", // z18: corner barrel
];

// the top layer (y7): the table top slab only (nothing stands on a barrel top, so the walk reaches every cell)
const TOP = [
  ".....", // z14
  ".....", // z15
  "...T.", // z16: top slab on the table post
  ".....", // z17
  ".....", // z18
];

// the lantern (y8) stands on the table top: one source lights the room, 8+ in every corner
const LAMP = [
  ".....", // z14
  ".....", // z15
  "...L.", // z16
  ".....", // z17
  ".....", // z18
];

export function build(g) {
  // beds: foot at x37, head at x36 against the west wall (facing west), both halves via bed()
  bed(g, [37, 6, 14], "west", "red");
  bed(g, [37, 6, 17], "west", "blue");   // z17: its head at (36,17) is on the solid wall behind the flue, not the window pair at z18..19
  layers(g, [36, 6, 14], LEGEND, [FLOOR, TOP, LAMP]);
}
