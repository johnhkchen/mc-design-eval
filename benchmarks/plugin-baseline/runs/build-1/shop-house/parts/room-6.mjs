// SPDX-License-Identifier: AGPL-3.0-or-later
// Room: Dining room (first floor, inner air x 9..18, y 14..17, z 16..21; the wall at x 9 is the shell's, so the free
// floor is x 10..18). Furnished around a family table: oak-slab top on fence legs, oak stair benches on both long
// sides (north and south), a barrel sideboard on the east wall with flower pots, lanterns hung from the y 18 floor.
// Doorway x 9 z 18 (west) and the rear windows at z 22 stay clear; the lane runs round the table by the z 16 row.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hangLantern } from "../vocab.mjs";

// Legend: f oak fence (table leg), t oak slab bottom (table top), n/s oak stairs (benches facing north / south),
// r red carpet (rug under the table), b barrel (sideboard), P flower pot.
const LEGEND_Y14 = {
  "f": "oak_fence",
  "n": ["oak_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" }],
  "s": ["oak_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" }],
  "r": "red_carpet",
  "b": "barrel",
  "P": "flower_pot",
};
const LEGEND_Y15 = {
  "t": ["oak_slab", { type: "bottom", waterlogged: "false" }],
  "P": "flower_pot",
};

// Rows run along +x from x 10 (the first column) to x 18; successive rows along +z from z 16 to z 21.
const FLOOR_Y14 = [
  "P........",   // z 16  north lane (the flower pot stands by the door-side corner)
  "..nnnnn..",   // z 17  north benches
  "..frrrf..",   // z 18  table, rug under it (table row)
  "..frrrf.b",   // z 19  table, barrel sideboard on the east wall
  "..sssss.b",   // z 20  south benches
  "........b",   // z 21  rear row, clear in front of the windows
];
const FLOOR_Y15 = [
  ".........",   // z 16
  ".........",   // z 17
  "..ttttt..",   // z 18  table top
  "..ttttt.P",   // z 19  table top, flower pot on the sideboard
  ".........",   // z 20
  "........P",   // z 21  flower pot on the sideboard
];

export function build(g) {
  // the table legs and benches stand on the floor (y 14); the table top and sideboard pots sit at y 15
  layers(g, [10, 14, 16], LEGEND_Y14, [FLOOR_Y14]);
  layers(g, [10, 15, 16], LEGEND_Y15, [FLOOR_Y15]);
  // lanterns hang from the y 18 floor, over the table and in the two corners of the room
  hangLantern(g, 14, 17, 18);
  hangLantern(g, 11, 17, 17);
  hangLantern(g, 17, 17, 17);
  hangLantern(g, 12, 17, 21);
}
