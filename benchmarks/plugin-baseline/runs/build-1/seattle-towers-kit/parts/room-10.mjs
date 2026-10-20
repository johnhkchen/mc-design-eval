// Room 10 (KOMO W podium studio, interior designer): a small radio/TV studio. Inner air x 107..149, y 1..6, z 54..59.
// The focal piece is the anchor desk in front of a blue backdrop at the south wall; the control room sits west, a
// green room east. The door is assumed on the podium's north face at x 129..130 (the plan's grid shows every wall
// cell as open until the shell is built): the lane runs from it straight to the desk. Rows j = z - 54, columns i = x - 107.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 107, Y0 = 1, Z0 = 54;
const W = 43, D = 6, H = 6;                                  // interior size: columns, rows (z), storeys of air (y 1..6)

// Palette-only furniture: chairs and sofa are stairs, desks are fences under top slabs, equipment racks are blocks.
const LEGEND = {
  F: "oak_fence",                                             // desk and table post
  T: ["smooth_quartz_slab", { type: "top" }],                 // desk top, a top face to stand things on
  n: ["smooth_quartz_stairs", { facing: "north" }],           // chair, back north, seat faces south
  s: ["smooth_quartz_stairs", { facing: "south" }],           // chair, back south, seat faces north
  w: ["smooth_quartz_stairs", { facing: "west" }],            // chair, back west, seat faces east
  e: ["smooth_quartz_stairs", { facing: "east" }],            // chair, back east, seat faces west
  d: ["quartz_stairs", { facing: "south" }],                  // sofa run against the south wall
  B: "polished_andesite",                                     // equipment racks
  U: "blue_concrete",                                         // backdrop
  W: "white_concrete",                                        // backdrop cap
  L: ["lantern", { hanging: "false" }],                       // table lamp, stands on a top face
  O: ["lantern", { hanging: "true" }],                        // ceiling lantern, hangs from the shell's ceiling
};

export function build(g) {
  // One character grid per storey (y 1..6), every cell "." (free) until furniture is painted in.
  const L = Array.from({ length: H }, () => Array.from({ length: D }, () => Array(W).fill(".")));
  const put = (y, i, j, ch) => { L[y - 1][j][i] = ch; };
  const rect = (y, i0, i1, j, ch) => { for (let i = i0; i <= i1; i++) put(y, i, j, ch); };

  // Control room, west: a console desk with operators' chairs behind it, equipment racks along the back.
  rect(1, 2, 8, 2, "F"); rect(2, 2, 8, 2, "T");
  for (const i of [3, 5, 7]) put(1, i, 3, "s");
  put(3, 5, 2, "L");
  for (const i of [2, 3, 4]) put(1, i, 5, "B");

  // Studio, middle: the anchor desk (focal piece, straight ahead of the door), guest chairs in front, the presenter's
  // chair behind, a backdrop along the south wall and two equipment racks.
  rect(1, 18, 26, 2, "F"); rect(2, 18, 26, 2, "T");
  put(3, 22, 2, "L");
  for (const i of [20, 25]) put(1, i, 1, "n");
  put(1, 22, 3, "s");
  put(1, 14, 4, "B"); put(1, 30, 4, "B");
  for (const y of [1, 2, 3]) rect(y, 13, 31, 5, "U");
  rect(4, 13, 31, 5, "W");

  // Green room, east: a round table with four chairs, a lamp on it, a sofa against the south wall.
  put(1, 36, 2, "F"); put(2, 36, 2, "T"); put(3, 36, 2, "L");
  put(1, 36, 1, "n"); put(1, 36, 3, "s"); put(1, 35, 2, "w"); put(1, 37, 2, "e");
  rect(1, 34, 38, 5, "d");

  // Ceiling lanterns, hung from the shell's ceiling at y 6 every 6 blocks down the room's centre line.
  for (const [i, j] of [[4, 2], [10, 2], [16, 2], [22, 2], [28, 2], [34, 2], [40, 2], [1, 5], [13, 0], [31, 0], [41, 5]]) put(6, i, j, "O");

  const rows = L.map((layer) => layer.map((r) => r.join("")));
  layers(g, [X0, Y0, Z0], LEGEND, rows);
}
