// room: Bonus room (over the garage): game and media room in the box [1,6,7,11,8,18] (inner air x1..11, y6..8, z7..18).
// Entered from corridor W through the door at (12,6..7,16): the path runs along z17 and never blocks x11,z16 (door).
// Layout: TV on the south wall (z18, x8..10) with a dark-oak console; a dark-leather sectional (dark_oak_stairs seats,
// black_wool back and arm) faces it from z16; a coffee table of spruce slabs in front; a mini-bar on the west wall;
// two beanbags (spruce slab + carpet on top) and an open play floor by the north windows. Nothing sits in front of a
// window (N x1..3,5..7,9..11 at z7; W x1 z10..12; S x5..7 at z18) or on the door cells.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const BLACK_CONCRETE = "black_concrete", BLACK_WOOL_ID = "black_wool", DARK_OAK_PLANKS = "dark_oak_planks";

// the room's inner air; nothing here writes outside it (walls, windows, door and ceiling belong to other parts)
const BOX = { x0: 1, y0: 6, z0: 7, x1: 11, y1: 8, z1: 18 };
const inBox = (x, y, z) => x >= BOX.x0 && x <= BOX.x1 && y >= BOX.y0 && y <= BOX.y1 && z >= BOX.z0 && z <= BOX.z1;
const put = (g, x, y, z, pair) => { if (inBox(x, y, z)) g.set(x, y, z, ...pair); };
const block = (name) => [name, {}];
const pair = (name, state) => [name, state];

export function build(g) {
  // ---- focal piece: TV on the south wall z18, dark console under it -------------------------------------------------
  for (let x = 8; x <= 10; x++) {
    put(g, x, 6, 18, block(DARK_OAK_PLANKS));
    put(g, x, 7, 18, block(BLACK_CONCRETE));
    put(g, x, 8, 18, block(BLACK_CONCRETE));
  }

  // ---- sectional sofa facing the TV (seats face south, so the stairs' high back is north: facing north) -----------
  for (let x = 6; x <= 10; x++) {
    put(g, x, 6, 16, B.stairs("dark_oak", "north", "bottom"));
    put(g, x, 6, 15, block(BLACK_WOOL_ID));
    put(g, x, 7, 15, block(BLACK_WOOL_ID));
  }
  put(g, 5, 6, 15, block(BLACK_WOOL_ID));
  put(g, 5, 7, 15, block(BLACK_WOOL_ID));
  put(g, 5, 6, 16, block(BLACK_WOOL_ID));                     // arm

  // ---- coffee table: spruce slabs as the top, one candle on it -----------------------------------------------------
  for (let x = 7; x <= 9; x++) put(g, x, 6, 13, B.slab("spruce", "bottom"));
  put(g, 8, 7, 13, pair("white_candle", { candles: "1", lit: "false", waterlogged: "false" }));

  // ---- mini-bar on the west wall: dark oak counter, barrel as the fridge-shelf ----------------------------------------
  for (let z = 14; z <= 16; z++) put(g, 1, 6, z, block(DARK_OAK_PLANKS));
  put(g, 1, 7, 15, pair("barrel", { facing: "up", open: "false" }));

  // ---- beanbags: spruce slab seat with a carpet on top, by the play floor ----------------------------------------------
  for (const x of [3, 5]) {
    put(g, x, 6, 10, B.slab("spruce", "bottom"));
    put(g, x, 7, 10, block("blue_carpet"));
  }

  // ---- toy chest and fern by the north windows (nothing at y7..8 in front of the windows) ------------------------------
  put(g, 11, 6, 8, pair("chest", { facing: "south", type: "single", waterlogged: "false" }));
  put(g, 1, 6, 8, pair("potted_fern", {}));

  // ---- light: hanging lanterns from the y9 ceiling, the brightest one over the TV --------------------------------------
  for (const [x, z] of [[3, 9], [9, 9], [6, 12], [9, 17], [2, 17]]) put(g, x, 8, z, B.lantern(true));
}
