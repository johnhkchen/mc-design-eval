// Part: room: carriage bay (carriage house ground floor, inner box x77..90 y1..5 z41..52).
// Focal piece: an open landau carriage on the chassis at x80..86 z44..48, its seats stairs and its hood posts fence,
// parked square to the three arched doors on the north wall. Hay and barrels on the west wall, tack chest, candle and
// cauldron on the east wall. Hanging lanterns under the loft floor (y6), the brightest one over the carriage.
// Lanes stay clear: the door first cells z41 at x77..79, 82..85, 88..90, the personal door cells x90 z46..47, and the
// ladder foot x90 z52 with its neighbours.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 77;
const Z0 = 41;

const legend = {
  H: "hay_block",
  B: "barrel",
  F: "dark_oak_fence",
  P: "dark_oak_planks",
  S: ["dark_oak_stairs", { facing: "north", half: "bottom" }],
  T: ["dark_oak_stairs", { facing: "south", half: "bottom" }],
  R: "red_carpet",
  C: ["chest", { facing: "west" }],
  N: ["candle", { candles: "2", lit: "true" }],
  K: "cauldron",
  M: ["lantern", { hanging: "false" }],
};

// Rows run along +x (x77..90, 14 cells), successive rows along +z (z41..52, 12 rows).
const LAYERS = {
  // y1: floor-standing pieces (the floor is smooth_stone at y0)
  1: [
    "..............", // z41 door first cells stay clear
    "HH..........BB", // z42 hay on the west wall, barrels on the east
    "H........M...C", // z43 hay, lantern on the floor, tack chest
    "...F.....F....", // z44 carriage wheels (fence)
    "...PPPPPPP....", // z45 chassis
    "...PPPPPPP....", // z46 chassis
    "...PPPPPPP....", // z47 chassis
    "...F.....F....", // z48 carriage wheels
    "B..........K..", // z49 barrel west, cauldron east
    "B...........B.", // z50 barrels west and east
    ".BM...........", // z51 lantern on the floor by the barrel
    "..............", // z52 ladder foot at x90 stays clear
  ],
  // y2: seats, carpet, hood posts, hay top, candle on the chest
  2: [
    "..............", // z41
    "HM...........B", // z42 hay stack top with a lantern, barrel stack on the east
    ".............N", // z43 candle on the tack chest
    "..............", // z44
    "...FSSSSSF....", // z45 seat backs facing north, hood posts at x80 and x86
    "....RRRRR.....", // z46 carpet on the chassis
    "...FTTTTTF....", // z47 seat backs facing south
    "..............", // z48
    "..............", // z49
    "M...........M.", // z50 lanterns on the barrels, west and east
    ".M............", // z51 lantern on the west barrel
    "..............", // z52
  ],
  // y3: hood posts above the seats
  3: [
    "..............", // z41
    "..............", // z42
    "..............", // z43
    "..............", // z44
    "...F.....F....", // z45 hood post
    "..............", // z46
    "...F.....F....", // z47 hood post
    "..............", // z48
    "..............", // z49
    "..............", // z50
    "..............", // z51
    "..............", // z52
  ],
  // y4: lanterns standing on the tops of the carriage's hood posts (fence at y3 on the seats)
  4: [
    "..............", // z41
    "..............", // z42
    "..............", // z43
    "..............", // z44
    "...M.....M....", // z45 (x80, x86)
    "..............", // z46
    "...M.....M....", // z47 (x80, x86)
    "..............", // z48
    "..............", // z49
    "..............", // z50
    "..............", // z51
    "..............", // z52 ladder foot x90 clear
  ],
};

export function build(g) {
  for (const [y, rows] of Object.entries(LAYERS)) {
    layers(g, [X0, Number(y), Z0], legend, rows);
  }
}
