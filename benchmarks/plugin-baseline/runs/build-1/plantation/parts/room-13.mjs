// Part: room: upper hall and porch landing. Interior furnisher's layout inside the box x45..50 z43..60 (floor y11).
// Focal piece: the hall table on the south wall (z60), where the runner from the upper porch door looks.
// Runner: red_carpet x47..48 from the porch door to the landing at z53 (the stair's entry, kept clear).
// Settees: stairs facing north on z44 (NW, NE). Plant stands: barrels with lanterns at the north corners.
// Side tables: fence + top slab with a lantern, at the mid-hall walls (x45, x50 at z49).
// Card table: fence + top slab at (49,56) with three chairs (stairs); the east side x50 stays open as the walk south.
// Chandelier: iron_chain + hanging lantern at (48,15..16,49), over the carpet.
// Layers are y11..y16 in order; rows run along +x (x45..50) and then +z (z43..60).
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  b: "barrel",
  N: ["dark_oak_stairs", { facing: "north", half: "bottom" }],
  W: ["dark_oak_stairs", { facing: "west", half: "bottom" }],
  U: ["dark_oak_stairs", { facing: "south", half: "bottom" }],
  r: "red_carpet",
  f: "dark_oak_fence",
  t: ["dark_oak_slab", { type: "top" }],
  L: "lantern",
  H: ["lantern", { hanging: "true" }],
  C: ["iron_chain", { axis: "y" }],
  p: "flower_pot",
};

const BLANK = ["......", "......", "......", "......", "......", "......", "......", "......", "......",
  "......", "......", "......", "......", "......", "......", "......", "......", "......"];

// y11 floor level, z43..60 (18 rows of x45..50)
const Y11 = [
  "b.rr.b", // z43
  "NNrrNN", // z44
  "b.rr.b", // z45
  "..rr..", // z46
  "..rr..", // z47
  "..rr..", // z48
  "f.rr.f", // z49
  "..rr..", // z50
  "..rr..", // z51
  "..rr..", // z52
  "......", // z53 landing (kept clear)
  "......", // z54 (x47 is the stair rail, already built)
  "....N.", // z55 card table, north chair
  "...Wf.", // z56 west chair, table
  "....U.", // z57 south chair
  "......", // z58
  "......", // z59
  "...fff", // z60 hall table on the south wall
];

// y12 and y13 are sparse: cells as [z index (0 = z43), x index (0 = x45), char]; rows are built from them.
function sheet(cells) {
  const rows = BLANK.map((r) => r.split(""));
  for (const [zi, xi, c] of cells) rows[zi][xi] = c;
  return rows.map((r) => r.join(""));
}

// y12: table tops, and the lanterns on the barrels at z45
const Y12 = sheet([
  [2, 0, "L"], [2, 5, "L"], // plant stands: barrels at y11, lanterns on top (z45)
  [6, 0, "t"], [6, 5, "t"], // side tables at z49
  [13, 4, "t"], // card table top at z56
  [17, 3, "t"], [17, 4, "t"], [17, 5, "t"], // hall table top at z60
]);

// y13: lanterns and the pot standing on the table tops
const Y13 = sheet([
  [6, 0, "L"], [6, 5, "L"], // side table lanterns
  [13, 4, "L"], // card table lantern
  [17, 3, "L"], [17, 4, "p"], // focal: lantern and flower pot
]);

// y14: clear
const Y14 = BLANK;

// y15: hanging lantern under the chain; y16: chain from the plate
const Y15 = BLANK.map((row, i) => (i === 6 ? "...H.." : row));
const Y16 = BLANK.map((row, i) => (i === 6 ? "...C.." : row));

// The shell leaves this hall unclaimed, so the layout is placed.
const FURNISH = true;

// Lamplighter: standing lanterns on the floor row (y11, on the y10 floor), in the cells the layout above leaves free:
// flanking the runner at mid-hall, at the north corners, and in the south half. Not on the runner, the settees, the
// doorways (x44 and x51 at z46..47 and z51..52), or the landing at z53. The south-west cells over the grand stair's
// hole (x45..46 z54..57, no y10 floor) and its rail (x47) can't take a lamp; (46,59) is the lit end by the hall table.
const LAMPS = [
  [46, 47], [49, 47], // flanking the runner, mid-hall
  [46, 43], [49, 43], // north corners, between the barrels and the settees
  [46, 59], [49, 52], // south end by the hall table, and east of the runner's end
];

export function build(g) {
  if (FURNISH) layers(g, [45, 11, 43], LEGEND, [Y11, Y12, Y13, Y14, Y15, Y16]);
  for (const [x, z] of LAMPS) g.set(x, 11, z, ...B.lantern(false));
}
