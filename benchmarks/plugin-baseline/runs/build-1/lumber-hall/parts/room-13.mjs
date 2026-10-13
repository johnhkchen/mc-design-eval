// Room: South store (interior designer's part). The timber store's south half: log racks along the north partition
// (x 7..18 and 23..38, two logs high), barrel stock with standing lanterns in two rows (z 26 and z 31), and the receiving
// table in front of the doorway as the focal piece (fence legs, slab top, ledger chest and lantern). Lanes stay open on
// z 25 and z 27 from the doorway to every way out; stair 2's foot and head (x 3..4, z 24..30) stay clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// inner air box x 3..39, z 24..32, y 13..17; the plan's floor grid origin
const X0 = 3, Z0 = 24, Z1 = 32;
const W = 37, D = Z1 - Z0 + 1;

const LEGEND = {
  L: ["stripped_dark_oak_log", { axis: "x" }],   // log rack
  B: ["barrel", { facing: "up" }],                // stock
  k: ["lantern", { hanging: "false" }],           // light on a barrel
  F: "dark_oak_fence",                            // table leg
  S: ["dark_oak_slab", { type: "bottom" }],       // table top
  C: ["chest", { facing: "north" }],              // ledger chest on the table
  l: ["lantern", { hanging: "false" }],           // light on the table
};

// three layers (y 13, 14, 15), each D rows of W cells; ' ' is left as it is
const cells = { 13: blank(), 14: blank(), 15: blank() };

function blank() {
  return Array.from({ length: D }, () => Array(W).fill(" "));
}

const put = (y, x, z, ch) => { cells[y][z - Z0][x - X0] = ch; };
const span = (y, xa, xb, z, ch) => { for (let x = xa; x <= xb; x++) put(y, x, z, ch); };

// log rack against the north partition: two logs high, the stair foot's side (x 5..6) left open
span(13, 7, 18, 24, "L"); span(14, 7, 18, 24, "L");
span(13, 23, 38, 24, "L"); span(14, 23, 38, 24, "L");

// barrel stock with a standing lantern on each: the north row at z 26, the south row at z 31 (z 32 stays open)
for (const x of [5, 9, 17, 25, 33, 39]) { put(13, x, 26, "B"); put(14, x, 26, "k"); }
for (const x of [5, 13, 21, 29, 37]) { put(13, x, 31, "B"); put(14, x, 31, "k"); }

// receiving table, the focal piece in front of the doorway (x 19..22, z 28..29)
for (const [x, z] of [[19, 28], [22, 28], [19, 29], [22, 29]]) put(13, x, z, "F");
for (let x = 19; x <= 22; x++) for (const z of [28, 29]) put(14, x, z, "S");
put(15, 19, 28, "C");
put(15, 22, 29, "l");

export function build(g) {
  const rows = (y) => cells[y].map((r) => r.join(""));
  layers(g, [X0, 13, Z0], LEGEND, [rows(13), rows(14), rows(15)]);
}
