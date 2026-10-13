// Part: room: cottage bedroom. Interior designer's layout for the small bedroom at x77..82 z71..74 (air y2..5), entered
// from the parlour through the door at z70 x80. Focal piece: the bed against the west wall. Lane: x79..82 z71..74 stays clear
// from the door to the bed and the chest. Light: two hanging lanterns from the cottage plate (y6), one candle on the table.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  B: "barrel",
  C: ["chest", { facing: "north" }],
  F: "dark_oak_fence",
  T: ["dark_oak_slab", { type: "top" }],
  L: ["dark_oak_stairs", { facing: "west" }], // chair west of the table, back to the west, seat east
  R: ["dark_oak_stairs", { facing: "east" }], // chair east of the table, back to the east, seat west
  P: "flower_pot",
  c: ["candle", { candles: "2", lit: "true" }],
  l: ["lantern", { hanging: "true" }],
};

export function build(g) {
  // floor row y2 (stand): nightstand barrel NW corner, table fence with two chairs, dresser chest SE corner
  layers(g, [77, 2, 71], LEGEND, [
    ["B.....", // z71
     "......", // z72 (bed foot x78 and head x77 placed below)
     "..LFR.", // z73: chairs x79 and x81, table post x80
     ".....C"], // z74: chest x82
  ]);
  // table top: a top slab on the fence post, at row y3
  layers(g, [77, 3, 71], LEGEND, [
    ["P.....", "......", "...T..", "......"],
  ]);
  // candle on the table top at row y4
  layers(g, [77, 4, 71], LEGEND, [
    ["......", "......", "...c..", "......"],
  ]);
  // hanging lanterns under the cottage plate (y6) at row y5
  layers(g, [77, 5, 71], LEGEND, [
    ["......", "..l...", "......", "...l.."],
  ]);
  // the focal bed: foot at x78 z72, head at x77 (pillow end) toward the west wall
  bed(g, [78, 2, 72], "west", "red");
}
