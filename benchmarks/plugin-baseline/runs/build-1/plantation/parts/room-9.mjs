// Part: room: butler's pantry (interior: service pantry and passage to the kitchen).
// A cooper's store: barrels along the west wall, a potted-shelf row, a work counter with cauldron, smoker and anvil at the
// south-east end (the focal piece, seen from the north door), and standing lanterns on the barrels and the counter.
// Inner air x52..60 z54..60, floor row y4. Lanes kept clear: north door (56,54), east doors (60,56..57), south doors (52..55,60).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [52, 4, 54];

const LEGEND = {
  B: ["barrel", { facing: "up", open: "false" }],
  S: ["chest", { facing: "south" }],
  P: "dark_oak_planks",
  C: "cauldron",
  K: ["smoker", { facing: "north" }],
  A: ["anvil", { facing: "east" }],
  T: "flower_pot",
  L: ["lantern", { hanging: "false" }],
};

// y4: floor-level furniture. Rows z54..z60, columns x52..x60.
const FLOOR = [
  "BBL...SS.", // z54: barrels on the west wall, a lantern on the floor, chest dresser at the north-east
  "B........", // z55: barrel, lantern on top
  "B........", // z56: barrel
  ".........", // z57: east-west lane
  ".....PPPP", // z58: work counter (focal), south-east
  ".....PPPP", // z59: counter, second course
  "........B", // z60: barrel at the south-east corner
];

// y5: things standing on the furniture's top faces.
const TOPS = [
  "T........", // z54: pot on a barrel
  "L........", // z55: standing lantern on a barrel (the room's light)
  "T........", // z56: pot on a barrel
  ".........",
  ".....C.KA", // z58: cauldron, smoker, anvil on the counter
  ".....L...", // z59: lantern on the counter
  "........T", // z60: pot on the corner barrel
];

// The shell leaves the main-block interior unclaimed, so the layout above is placed.
const HOLD_LAYOUT = false;

export function build(g) {
  if (!HOLD_LAYOUT) layers(g, ORIGIN, LEGEND, [FLOOR, TOPS]);
}
