// Part: room: Clock room (parts/room-10.mjs). Interior of the clock tower shaft, inside the box x19..21, y11..30, z11..13.
// The ladder at x21 z13 is the way in and up (the shell builds it). Focal piece: the clock works of dark oak, chain and
// trapdoors on the back of the north clock face (z11, y28..30), lit by a lantern on a chain below the belfry floor.
// Floor furniture is a clerk's desk in the west corner (lectern, chair, reader's spot) and a barrel with a candle in the
// east corner. A chain-hung lantern at the floor's edge lights the lane. Everything is drawn as text and placed by layers().
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [19, 11, 11]; // the room's first interior cell: x19, y11, z11 (rows along +z, columns along +x)
const FLOOR_Y = 11;
const CEIL_Y = 30;

// One 3 x 3 layer per y (rows z11..z13, columns x19..x21). Characters not in the legend stay as they are.
const legend = {
  L: ["lectern", { facing: "east", has_book: "false" }], // the clerk's desk, read from the east
  C: ["dark_oak_stairs", { facing: "south", half: "bottom" }], // the chair, its back to the south
  B: ["barrel", { facing: "up", open: "false" }], // spare parts and oil
  c: ["candle", { candles: "3", lit: "true" }], // on the barrel, the room's first light
  G: ["dark_oak_log", { axis: "z" }], // axles at the corners of the works
  T: ["dark_oak_trapdoor", { facing: "south", half: "bottom", open: "true" }], // escapement plates, against the face
  I: ["iron_chain", { axis: "z" }], // the linkage between the plates
  P: "dark_oak_planks", // the backboard hub of the works
  K: ["iron_chain", { axis: "y" }], // the chains that hang the lanterns
  a: ["lantern", { hanging: "true" }], // the lane lantern at the floor's edge
  A: ["lantern", { hanging: "true" }], // the lantern that lights the works
};

// Build the stack of layers from FLOOR_Y to CEIL_Y as text.
const rows = [];
for (let y = FLOOR_Y; y <= CEIL_Y; y++) rows.push(["...", "...", "..."]);
const at = (y) => rows[y - FLOOR_Y];

// Floor furniture (y11): desk in the west, barrel in the east corner.
at(11)[0] = "L.B"; // z11: lectern at x19, reader's spot at x20, barrel at x21
at(11)[1] = "C.."; // z12: chair at x19; x20 and x21 are the lane
// Candle on the barrel at y12.
at(12)[0] = "..c";

// The lane lantern, hung on a chain from the belfry floor down to y13 at x19 z13.
for (let y = 14; y <= CEIL_Y; y++) at(y)[2] = "K..";
at(13)[2] = "a..";

// The clock works behind the north face (z11), y28..30, with the pendulum chain and lantern at x20 z12.
at(27)[1] = ".A.";
at(28)[0] = "GTG";
at(28)[1] = ".K.";
at(29)[0] = "IPI";
at(29)[1] = ".K.";
at(30)[0] = "GTG";
at(30)[1] = ".K.";

export function build(g) {
  layers(g, ORIGIN, legend, rows);
}
