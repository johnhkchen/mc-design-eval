// Part: room: Loft (interior furnisher + lamplighter). Box [5,6,10,17,8,15]; floor y=6, origin [5,6,10] (x east, z south).
// Lamps stand on furniture (no roof block sits over the room to hang from): the table lamp, a lamp on the barrel stack,
// a bedside lamp on the chest, and a standing lantern by the west window. Layout: the lane runs along z=14 from the landing (5,6,15) to the east end. North of it: the hands' bed and the stores
// and tool bench. South of it: the stores and the foreman's bed (focal, under the east gable window). Hanging lanterns
// on the centre line, one standing lantern by the west window. Tall pieces (stacked barrels) only at z=11..14.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  b: ["barrel", { facing: "up" }],          // stores: sacks and barrels
  c: ["chest", { facing: "north" }],        // tool and ledger chests
  T: "crafting_table",                      // tool bench
  H: ["red_bed", { facing: "west", part: "head" }],   // hands' bed, head against the west gable
  F: ["red_bed", { facing: "west", part: "foot" }],
  E: ["red_bed", { facing: "east", part: "foot" }],   // foreman's bed (focal), head against the east gable
  G: ["red_bed", { facing: "east", part: "head" }],
  s: ["spruce_stairs", { facing: "west", half: "bottom" }],  // chair facing the table
  t: "spruce_fence",                        // table leg
  p: ["spruce_slab", { type: "bottom" }],   // table top
  n: ["lantern", { hanging: "false" }],     // standing on the floor
};

// Rows are z=10..15 (north to south); columns x=5..17.
const FLOOR = [
  "bbb.c.T....n.", // z=10: stores along the north wall, ledger chest, tool bench, lamp on the floor in the NE corner
  ".....bb......", // z=11
  "HF.....st....", // z=12: hands' bed under the west window, table with a chair
  "n............", // z=13: standing lantern by the west window
  ".............", // z=14: the lane, kept clear
  ".bbb.c....cEG", // z=15: stores, bedside chest, foreman's bed under the east window
];
const STACK = [
  ".............",
  ".....b.......", // z=11: barrel stacked on the store (tall piece, z=11..14 only)
  "........p....", // z=12: table top
  ".............",
  ".............",
  "..........n..", // z=15: bedside lamp on the chest
];
const LAMPS = [
  ".............",
  ".....n.......", // z=11: lamp on the stacked barrel
  "........n....", // z=12: table lamp on the table top
  ".............",
  ".............",
  ".............",
];

export function build(g) {
  return layers(g, [5, 6, 10], LEGEND, [FLOOR, STACK, LAMPS]);
}
