// Room "P7 living room" (interior designer's part): Craftsman living room, inner air x115..124, z14..17, feet y2.
// Layout (plan view, x across, z down; stair column x115 z15..17 is left clear for the stair joiner's flight):
//   z14  sideboard of barrels (116,117) with a pot and a candle, chest (118) with a candle
//   z15  rug (119..120), armchair north of the table (122), lanterns (120, 123) hung (z14 y4 is the earlier part's trapdoor row)
//   z16  rug (119..120), armchair west (121) / table (122) / armchair east (123), lantern on the table, lantern hung (117)
//   z17  armchair south of the table (122), lantern hung over the hearth front (124)
// The lane from the front door (119,2,14) runs down x119..120 to the south doorway (120,2,18): the rug is walkable.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// a chair: a stair whose full-height back is on `back`, so the seat looks the other way (the table is in the middle)
const chair = (facing) => [`spruce_stairs`, { facing, half: "bottom", shape: "straight", waterlogged: "false" }];

const LEGEND_FLOOR = {                       // feet layer (y2)
  b: ["barrel", { facing: "up", open: "false" }],
  c: ["chest", { facing: "south", type: "single", waterlogged: "false" }],
  r: ["brown_carpet", {}],
  f: ["spruce_fence", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" }],
  W: chair("west"),
  E: chair("east"),
  N: chair("north"),
  U: chair("south"),
};

const LEGEND_SHELF = {                       // y3: things on top faces (barrel, chest, table top)
  p: ["flower_pot", {}],
  q: ["candle", { candles: "1", lit: "true", waterlogged: "false" }],
  t: ["spruce_slab", { type: "top", waterlogged: "false" }],
};

const LEGEND_CEILING = {                     // y4: lanterns, hung from the upper floor, or standing on the table top
  H: ["lantern", { hanging: "true", waterlogged: "false" }],
  L: ["lantern", { hanging: "false", waterlogged: "false" }],
};

// rows run along +x from x115 to x124 (10 cells), successive rows along +z from z14 to z17
const FEET = [
  " bbc      ",   // z14
  "    rr N  ",   // z15
  "    rrWfE ",   // z16
  "       U  ",   // z17
];
const SHELF = [
  " pqq      ",   // z14
  "          ",   // z15
  "       t  ",   // z16
  "          ",   // z17
];
const CEILING = [
  "          ",   // z14 (the earlier part's spruce_trapdoor row is here at y4: no lantern)
  "     H  H ",   // z15
  "  H    L  ",   // z16
  "         H",   // z17
];

export function build(g) {
  layers(g, [115, 2, 14], LEGEND_FLOOR, [FEET]);
  layers(g, [115, 3, 14], LEGEND_SHELF, [SHELF]);
  layers(g, [115, 4, 14], LEGEND_CEILING, [CEILING]);
}
