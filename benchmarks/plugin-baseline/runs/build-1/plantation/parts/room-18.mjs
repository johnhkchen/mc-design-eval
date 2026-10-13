// Part: room: west upper corridor. Upstairs passage from the hall (x44) to the west bedrooms, box x27..43 x z51..52.
// Lane: the north row z51 stays clear (a red runner from x31 to x39), so every doorway front is open: z51 at x29, x30,
// x40, x41 (z50 doors) and z52 at x29, x30, x36, x41, x42 (z53 doors), plus x43 at the hall opening.
// Focal piece at the west end (the cell the hall looks down to): a dark oak console (fence legs, top slab) with a
// standing lantern and a candle, a dark oak chair facing it. Along the south wall: a bench of two stairs, a barrel
// side table with a flower pot, a barrel stand with a standing lantern, a barrel with a candle.
// Lights: standing lanterns at (27,13,52) and (38,12,52), hanging lanterns at (31,16,51) and (39,16,51).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [27, 11, 51];

const LEGEND = {
  c: ["dark_oak_stairs", { facing: "north", half: "bottom" }], // chair at the console, back to the north wall
  f: "dark_oak_fence", // console legs
  S: ["dark_oak_slab", { type: "top" }], // console top, on the fence tops
  b: ["dark_oak_stairs", { facing: "south", half: "bottom" }], // bench seats, back to the south wall
  B: "barrel", // side tables and stands
  r: "red_carpet", // runner along the lane
  P: "flower_pot", // on the side table
  L: ["lantern", { hanging: "false" }], // standing lantern
  H: ["lantern", { hanging: "true" }], // hanging lantern under the ceiling plate
  k: ["candle", { candles: "3", lit: "true" }], // candle
};

// y11 (floor row): chair, console legs, bench, barrels, runner
const Y11 = [
  "c   rrrrrrrrr    ",
  "ff   bb B  B B   ",
];
// y12: console top, pot, lantern and candle on the barrels
const Y12 = [
  "                 ",
  "SS      P  L k   ",
];
// y13: lantern and candle on the console top
const Y13 = [
  "                 ",
  "Lk               ",
];
const EMPTY = ["                 ", "                 "];
// y16: hanging lanterns under the ceiling plate (y17)
const Y16 = [
  "    H       H    ",
  "                 ",
];

// Layers from y11: floor furniture, console top, console lantern and candle, then two empty rows, then the hanging lanterns.
export function build(g) {
  layers(g, ORIGIN, LEGEND, [Y11, Y12, Y13, EMPTY, EMPTY, Y16]);
}
