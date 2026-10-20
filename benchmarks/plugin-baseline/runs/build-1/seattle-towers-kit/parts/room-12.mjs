// Room 12, Hyatt wedge breakfast hall (interior designer): a long dining hall along the wedge, inner air x190..198, z14..60,
// y1..6. Entered from the north (the tip lobby). Focal piece: the breakfast buffet at the south end (quartz counter, cake
// and candles, a lit smoker behind it), where the entrance looks. Tables in two columns of oak fence posts with top oak
// slabs, oak stairs as chairs, one clear lane down the middle (x194) and the passage round the counter at x190 / x198.
// Light: candles on every table and a hanging lantern every 6 blocks down the lane.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 190, X1 = 198, Z0 = 14, Z1 = 60;
const TABLE_Z = [18, 22, 26, 30, 34, 38, 42, 46, 50];   // one table per 4 blocks in each column
const LANTERN_Z = [16, 22, 28, 34, 40, 46, 52, 58];     // hanging down the centre lane
const COUNTER_Z = 55;                                   // the buffet counter, x191..197 (passage at x190 and x198)

const LEGEND = {
  F: "oak_fence",
  W: ["quartz_stairs", { facing: "west", half: "bottom" }],   // chair west of a table, back to the west (palette stand-in for oak stairs)
  E: ["quartz_stairs", { facing: "east", half: "bottom" }],    // chair east of a table, back to the east
  T: ["oak_slab", { type: "top" }],                           // table top
  k: ["lantern", { hanging: "false" }],                       // candle on a table (standing lantern stands in)
  Q: "smooth_quartz",
  q: ["smooth_quartz_slab", { type: "top" }],                  // counter top
  C: ["smooth_quartz_slab", { type: "bottom" }],              // cake on the counter (low quartz slab stands in)
  P: ["azalea_leaves", { persistent: "true" }],               // flower pot (azalea stands in)
  B: ["oak_log", { axis: "y" }],                              // barrel (oak log stands in)
  S: "sea_lantern",                                           // the lit focal light, behind the buffet (smoker stands in)
  H: "birch_planks",                                          // chest (birch planks stand in)
  L: ["lantern", { hanging: "true" }],
};

// One row of 9 cells (x190..198) for a z, from a list of [x, char] pairs.
const row = (cells) => {
  const s = Array(X1 - X0 + 1).fill(" ");
  for (const [x, ch] of cells) s[x - X0] = ch;
  return s.join("");
};

// Rows for z14..60, built from a per-z list of cells.
const rowsFor = (cellsAt) => {
  const rows = [];
  for (let z = Z0; z <= Z1; z++) rows.push(row(cellsAt(z)));
  return rows;
};

const tableCells = (z) => (TABLE_Z.includes(z) ? [
  [191, "W"], [192, "F"], [193, "E"], [195, "W"], [196, "F"], [197, "E"],
] : []);

const floorCells = (z) => {
  const c = [...tableCells(z)];
  if (z === COUNTER_Z) for (let x = 191; x <= 197; x++) c.push([x, "Q"]);
  if (z === COUNTER_Z + 1) c.push([191, "B"], [194, "S"], [197, "B"]);
  if (z === COUNTER_Z + 2) c.push([196, "H"]);
  return c;
};

const topCells = (z) => {
  const c = [];
  if (z === COUNTER_Z) for (let x = 191; x <= 197; x++) c.push([x, "q"]);
  if (TABLE_Z.includes(z)) c.push([192, "T"], [196, "T"]);
  return c;
};

const itemCells = (z) => {
  const c = [];
  if (z === COUNTER_Z) c.push([191, "P"], [193, "C"], [195, "k"], [197, "P"]);
  if (TABLE_Z.includes(z)) c.push([192, "k"], [196, "k"]);
  return c;
};

const lampCells = (z) => (LANTERN_Z.includes(z) ? [[194, "L"]] : []);

export function build(g) {
  layers(g, [X0, 1, Z0], LEGEND, rowsFor(floorCells));   // floor level: chairs, fence posts, counter, barrels, smoker
  layers(g, [X0, 2, Z0], LEGEND, rowsFor(topCells));     // table and counter tops
  layers(g, [X0, 3, Z0], LEGEND, rowsFor(itemCells));    // cake, candles, pots on the tops
  layers(g, [X0, 6, Z0], LEGEND, rowsFor(lampCells));    // hanging lanterns down the lane
}
