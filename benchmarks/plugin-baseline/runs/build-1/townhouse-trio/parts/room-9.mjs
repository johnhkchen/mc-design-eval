// room: C ground (interior designer + lamplighter): the parlour at the front (bay side, one table with four chairs,
// hanging lanterns), the kitchen at the back (counter in front of the hearth on the party wall at x=20, z18..19), a
// back table with two chairs. The stair well x20..21 z20..23 and the hearth cells stay clear; x25 is the lane from
// the front door (25,3..4,12) to the back door (25,3..4,24), kept clear end to end.
// Palette only (palette.json): no barrel, bed, carpet or candle in it, so the furniture is stairs, fence, slab,
// stone brick counter, flower pots and lanterns.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Rows run along +x (x20..26), successive rows along +z (z13..23).
export function build(g) {
  // y=3: chairs (stairs facing the table), table legs, counter, pot
  layers(g, [20, 3, 13], {
    n: ["spruce_stairs", { facing: "north" }],
    s: ["spruce_stairs", { facing: "south" }],
    e: ["spruce_stairs", { facing: "east" }],
    w: ["spruce_stairs", { facing: "west" }],
    T: "spruce_fence",
    C: "stone_bricks",
    p: "potted_poppy",
  }, [
    "......p", // z13: pot by the bay, away from the lane
    "...n...", // z14: parlour chair, north of the table
    "..wTe..", // z15: parlour table, chairs west and east
    "...s...", // z16: parlour chair, south of the table
    "..CCC..", // z17: kitchen counter across the back of the parlour
    "..C....", // z18: counter on the party side; hearth front at x21 kept clear
    "..C....", // z19
    ".......", // z20: stair well x20..21 is the stair joiner's
    "..wTe..", // z21: back table, chairs west and east
    "...s...", // z22: back chair, south
    ".......", // z23
  ]);

  // y=4: table tops and counter tops
  layers(g, [20, 4, 13], {
    S: ["spruce_slab", { type: "bottom" }],
    K: ["stone_brick_slab", { type: "bottom" }],
  }, [
    ".......",
    ".......",
    "...S...", // z15
    ".......",
    "..KKK..", // z17
    "..K....",
    "..K....",
    ".......",
    ".......",
    "...S...", // z21
    ".......",
  ]);

  // y=6: hanging lanterns under the first-floor deck (y=7); none over the stair well
  layers(g, [20, 6, 13], {
    L: ["lantern", { hanging: "true" }],
  }, [
    "..L....", // z13: bay light
    ".......",
    "...L...", // z15: over the parlour table
    ".L.....", // z17: over the hearth front, lifts the hearth corner
    ".....L.", // z18: over the lane, between kitchen and parlour
    ".......",
    ".......",
    "...L...", // z21: over the back table
    "..L...L", // z22: over both back corners, the west one just clear of the stair well (x22)
    ".......",
  ]);
}
