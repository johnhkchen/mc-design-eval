// Part: room: Registry bay (parts/room-3.mjs). Interior designer: the records counter is the focal piece, set on the
// axis of the hall doorway (x 12..16). Bookshelves and barrels line the back wall, a clerk's chair sits behind the
// counter, a red runner lies in front of it, and lanterns and candles light the room.
// Drawn as text: origin [11, y, 11] is the room's top-left floor cell (x 11, z 11); rows run along +x, then +z.
// Only the characters in the legend are placed; '.' is left as it is.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const legend = {
  b: "bookshelf",
  p: "flower_pot",
  c: "dark_oak_planks",
  s: ["dark_oak_slab", { type: "bottom" }],
  L: ["lectern", { facing: "south", has_book: "true" }],
  r: ["barrel", { facing: "up", open: "false" }],
  h: ["dark_oak_stairs", { facing: "north", half: "bottom", shape: "straight" }],
  w: "red_carpet",
  k: ["candle", { candles: "2", lit: "true" }],
  n: ["lantern", { hanging: "true" }],
  l: ["lantern", { hanging: "false" }],
};

export function build(g) {
  // Floor level y 4: back wall shelves and barrels, the clerk's chair, the counter, the runner.
  layers(g, [11, 4, 11], legend, [
    "bbrhrbb", // z 11: shelves, barrels and the chair on the back wall
    "lccccc.", // z 12: a floor lantern at the corner, the records counter at x 12..16
    "..www..", // z 13: the red runner in front of the counter
  ]);
  // y 5: flower pots on the shelf ends, slab counter top, the lectern (register book) on the centre.
  layers(g, [11, 5, 11], legend, [
    "p.....p", // z 11
    ".ssLss.", // z 12
  ]);
  // y 6: lit candles on the counter, on the slab tops.
  layers(g, [11, 6, 11], legend, [
    "", // z 11
    ".k...k.", // z 12
  ]);
  // y 9: hanging lanterns from the ceiling over the patron's lane.
  layers(g, [11, 9, 11], legend, [
    "", // z 11
    "", // z 12
    ".n...n.", // z 13
  ]);
}
