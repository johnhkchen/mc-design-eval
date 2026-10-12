// Room 6, Mehlboden (flour loft): interior designer's part. Inner air box [9,12,9,13,16,21]; walk y=12.
// Focal piece: the stair-step stack (spruce stairs north, planks under each step) up to the open loft door at (11,15,8),
// lit by a lantern on a fence post at its foot. Flour stores (barrels, hay sacks) along the west and south-east, a
// sifting table with two seats mid-room, a lantern on the south flour stack. Lanes: from the attic stair's landing
// (10,12,18) west to x=9 and east to x=11, and x=12 from z=13 north to the stair foot (11,12,13). All drawn with layers().
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Columns x=9..13, rows z=9..21 (y=12 walk level; stairs and planks carry the stack up to the deck at y=14).
const LEGEND = {
  b: ["barrel", { facing: "up" }],                         // flour barrels
  h: "hay_block",                                          // hay sacks
  p: "spruce_planks",                                      // stair supports and the deck (11,14,9)
  s: ["spruce_stairs", { facing: "north", half: "bottom" }], // the stair-step stack, rising north
  q: ["spruce_stairs", { facing: "west", half: "bottom" }],  // seat west of the table, looks east
  r: ["spruce_stairs", { facing: "east", half: "bottom" }],  // seat east of the table, looks west
  f: "spruce_fence",                                       // table leg; lantern post at (13,12,9)
  t: ["spruce_slab", { type: "bottom" }],                  // table top
  L: ["lantern", { hanging: false }],                      // standing lanterns (on the post, the hay, the barrel)
};

export function build(g) {
  layers(g, [9, 12, 9], LEGEND, [
    [ // y=12
      "bbp.f", // z=9
      "b.p..", // z=10
      "..p..", // z=11
      "..s..", // z=12
      ".....", // z=13
      "h....", // z=14
      "b....", // z=15
      "h....", // z=16
      "..qfr", // z=17
      ".....", // z=18
      "....b", // z=19
      "....b", // z=20
      ".....", // z=21
    ],
    [ // y=13
      "b.p.L", // z=9
      "..p..", // z=10
      "..s..", // z=11
      ".....", // z=12
      ".....", // z=13
      "L....", // z=14
      ".....", // z=15
      ".....", // z=16
      "..t..", // z=17
      ".....", // z=18
      ".....", // z=19
      "....L", // z=20
      ".....", // z=21
    ],
    [ // y=14
      "h.p..", // z=9
      "..s..", // z=10
      ".....", // z=11
      ".....", // z=12
      ".....", // z=13
      ".....", // z=14
      ".....", // z=15
      ".....", // z=16
      ".....", // z=17
      ".....", // z=18
      ".....", // z=19
      ".....", // z=20
      ".....", // z=21
    ],
  ]);
}
