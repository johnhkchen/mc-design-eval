// Part "room: N1 north hall": the interior designer's furniture and lamps inside ROOM_BOX.n1_hall (x 85..130, y 1..9, z 1..22).
// Ground hall of the north block: a reception counter faces the north door (the focal piece), exhibit pedestals along the
// side walls, visitor stools, and chain-hung lanterns on a grid. Only palette blocks (palette.json): no fences, barrels or
// carpets exist in it, so tables are quartz pillars with a block top and seats are smooth_quartz_stairs.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { ROOM_BOX } from "../vocab/base.mjs";

const [X0, Y0, Z0, X1, , Z1] = ROOM_BOX.n1_hall;   // 85, 1, 1, 130, 9, 22
const W = X1 - X0 + 1;                              // 46 columns along x
const D = Z1 - Z0 + 1;                              // 22 rows along z

// A blank text layer over the room floor; put(rows, x, z, ch) draws one cell (x, z absolute).
const blank = () => Array.from({ length: D }, () => Array(W).fill(" "));
const put = (rows, x, z, ch) => { rows[z - Z0][x - X0] = ch; };
const text = (rows) => rows.map((r) => r.join(""));

const LEGEND = {
  C: "smooth_quartz",                                       // counter, pedestal and table tops
  P: "quartz_pillar",                                       // counter legs and pedestal shafts
  S: ["smooth_quartz_stairs", { facing: "south", half: "bottom" }], // visitor stools, back to the south, facing the counter
  L: ["lantern", { hanging: "false" }],                     // standing lanterns on tops
};

// y 1: the counter's front half, pedestal shafts, table legs, stools
const y1 = blank();
// y 2: the counter's top course and the pedestal tops
const y2 = blank();
// y 3: standing lanterns on the counter and on the pedestal tops
const y3 = blank();

// Focal reception counter across x 103..112 on z 8..9, facing the north door (x 106..109 at z 0).
for (let x = 103; x <= 112; x++) for (const z of [8, 9]) { put(y1, x, z, "C"); put(y2, x, z, "C"); }
put(y3, 104, 8, "L"); put(y3, 111, 8, "L");

// Visitor stools on the south side of the counter, z 10, back to the south: they face the counter.
for (const x of [104, 107, 110]) put(y1, x, 10, "S");

// Exhibit pedestals (pillar shaft, block top, lantern) along the west and east halls, clear of the two doorways.
const pedestals = [[88, 3], [88, 19], [127, 3], [127, 19]];
for (const [x, z] of pedestals) { put(y1, x, z, "P"); put(y2, x, z, "C"); put(y3, x, z, "L"); }

// Two low tables in the middle of the hall: a pillar leg under a block top, clear lanes around them.
for (const [x, z] of [[116, 14], [98, 14]]) { put(y1, x, z, "P"); put(y2, x, z, "C"); }

// Lantern chains: a column of chain from the ceiling (y 9..5), the lantern hanging at y 4 under it.
const LANTERN_X = [88, 94, 100, 106, 112, 118, 124];
const LANTERN_Z = [4, 10, 16, 21];

export function build(g) {
  layers(g, [X0, Y0, Z0], LEGEND, [text(y1), text(y2), text(y3)]);
  for (const x of LANTERN_X) for (const z of LANTERN_Z) {
    for (let y = 5; y <= 9; y++) g.set(x, y, z, "chain", { axis: "y" });
    g.set(x, 4, z, "lantern", { hanging: "true" });
  }
}
