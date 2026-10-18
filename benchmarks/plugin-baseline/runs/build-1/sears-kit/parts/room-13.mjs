// Room "P1 upper hall" (interior designer's part): a landing in the Alhambra's upper floor. The focal piece is a barrel
// dresser under the north windows, lit by a lantern and topped with a potted poppy; a red rug runs down the middle; a
// reading corner in the south-west has a fence table with a lantern and two stair chairs. The lanes from the stair top
// (22,6,18) to the west door (21,17) and both east doors (26,15), (26,19) stay clear, and so do the doorways' first cells.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// origin: the room's north-west floor cell (x22, feet y6, z14); rows run along +x (x22..25), successive rows along +z
const LEGEND = {
  b: "barrel",
  r: "red_carpet",
  f: "oak_fence",
  t: ["oak_slab", { type: "top" }],
  w: ["oak_stairs", { facing: "west" }],
  n: ["oak_stairs", { facing: "north" }],
  l: "lantern",
  p: "potted_poppy",
};

// y6: the floor furniture (barrels, rug, the table and its two chairs)
// y7: what stands on the barrels and the table top (lantern, pot, table slab)
// y8: the lantern on the table, above its slab
const FLOOR = [
  ".bb.", // z14 dresser under the north windows
  "....", // z15 clear: first cell of the east door (26,15)
  ".rr.", // z16 rug
  ".rr.", // z17 rug
  "....", // z18 clear: stair top and lane
  ".n..", // z19 chair, back to the north
  "wf..", // z20 chair, back to the west; table post
];
const SHELF = [
  ".lp.", // z14 lantern and pot on the dresser
  "....",
  "....",
  "....",
  "....",
  "....",
  ".t..", // z20 table top slab
];
const LAMP = [
  "....",
  "....",
  "....",
  "....",
  "....",
  "....",
  ".l..", // z20 lantern on the table
];

// Nothing is written yet. The shell (parts/shell-west.mjs house()) carves the whole interior to air from y2 to the wall
// top, and runParts locks every cell an earlier part placed, air included, so all 13 writes here were refused. The
// furniture goes in once the shell leaves this room's cells unbuilt; until then the layout above is kept as the record.
export function build(g) {
  // layers(g, [22, 6, 14], LEGEND, [FLOOR, SHELF, LAMP]);
}
