import { porchLantern } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Part: room: parlour library (interior designer + lamplighter). Inner air x27..43 x z43..49, floor y4, ceiling y9.
// Layout (origin [27,4,43], rows along +z, 17 columns along +x):
//   - bookshelf wall on the west (x27) and north (z43) walls, the windows' cells in front of them kept clear
//   - focal: the reading group in front of the east face of the chimney stack (x33..34 z46..47): a table with
//     two stair chairs, a candle on the table, a red carpet under it
//   - a second reading table with two chairs in the west nook, a lectern by the front window
//   - a barrel in the south-west corner; the hall door (x44 z46..47) and the corridor doors (z50) stay clear
//   - two hanging lanterns from iron_chain on the ceiling (lamplighter)
// Not built yet: mansion shell fills every interior cell of the house (x27..68 z43..60 y4..16) with air, and runParts
// locks every cell an earlier part wrote, air included. Every cell of this room is therefore refused, so the layout
// below stays as data until the shell leaves the room's air open (or the room is given its own cells).

const LEGEND = {
  B: "bookshelf",
  r: "red_carpet",
  f: "dark_oak_fence",
  T: ["dark_oak_slab", { type: "top" }],
  W: ["dark_oak_stairs", { facing: "west", half: "bottom" }],
  E: ["dark_oak_stairs", { facing: "east", half: "bottom" }],
  L: ["lectern", { facing: "east" }],
  h: "barrel",
  k: ["candle", { candles: "2", lit: "true" }],
  g: ["lantern", { hanging: "false" }],
};

// y4: floor furniture (bookshelves, carpet, tables and chairs, lectern, barrel)
const Y4 = [
  "B  BBBB  BBBB  BB", // z43
  "BL               ", // z44
  "  g     rrrrr    ", // z45
  "  WfE   rrWfEr   ", // z46
  "B       rrrgrr   ", // z47
  "B       rrrrr    ", // z48
  "h                ", // z49
];

// y5: second tier of bookshelves, and the two table tops (top slabs)
const Y5 = [
  "B  BBBB  BBBB  BB", // z43
  "B                ", // z44
  "                 ", // z45
  "   T       T     ", // z46
  "B                ", // z47
  "B                ", // z48
  "                 ", // z49
];

// y6: a standing lantern on the west table, a lit candle on the east one
const Y6 = [
  "                 ",
  "                 ",
  "                 ",
  "   g       k     ",
  "                 ",
  "                 ",
  "                 ",
];

// Intended writes, once the room is open to its designer: layers(g, [27, 4, 43], LEGEND, [Y4, Y5, Y6]) and two hanging
// lanterns from porchLantern(g, 31, 9, 45) and porchLantern(g, 39, 9, 48) (lamplighter, over the reading groups).
// Lamplighter: the two chain lanterns over the reading groups, and a standing lantern in the north-east corner (41,4,44)
// that lifts the last dim floor cell at (43,44) to 8+. Added after the furniture (none built yet, see above). Measured
// on a scratch copy with the designer's standing lanterns (29,4,45), (30,6,46), (38,4,47) present: min 8, 0 dim.
// The bare-room measure of the chains alone is min 4, 64 dim, so the standing lanterns are needed.
export function build(g) {
  porchLantern(g, 31, 9, 45);
  porchLantern(g, 39, 9, 48);
  g.set(41, 4, 44, ...B.lantern(false));
}
