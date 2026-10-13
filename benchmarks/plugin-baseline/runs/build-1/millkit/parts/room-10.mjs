// Room: Store sales floor (interior designer's part). Inner air x 86..93, y 3..7, z 10..12, entered from the double door
// at x 89..90 z 9 and the counter gap at z 13. Focal piece: the stocked dry-goods shelf of barrels, chests and pots on
// the west side. The centre (x 89..90) and the back row (z 12) stay clear so both ways in reach each other and the room.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  b: ["barrel", { facing: "up" }],          // goods barrel on the floor
  h: ["chest", { facing: "east" }],         // stock chest on the west wall
  H: ["chest", { facing: "west" }],         // stock chest on the east wall
  p: "potted_poppy",                        // display pot on a barrel top
  l: ["lantern", { hanging: "false" }],     // standing lantern on a barrel top, lights the shop window
};

// Floor layer y 3: rows z 10, 11, 12; columns x 86..93.
const FLOOR = [
  "bb....bb",   // z 10: goods under the shop windows (x 86..87, 92..93); x 89..90 door lane clear
  "h......H",   // z 11: stock chests against the side walls
  "........",   // z 12: clear lane in front of the counter gap
];

// Shelf layer y 4: pots and lanterns standing on the barrel tops.
const SHELF = [
  "pl....lp",   // z 10
  "........",   // z 11
  "........",   // z 12
];

export function build(g) {
  layers(g, [86, 3, 10], LEGEND, [FLOOR, SHELF]);
}
