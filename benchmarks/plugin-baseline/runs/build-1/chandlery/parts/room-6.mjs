// Room: West bedchamber (interior designer's part, box [6,7,14,10,10,16]).
// Small, quiet bedroom. The focal piece is the white bed, head to the west wall (6,7,15), foot at (7,7,15), its white
// carpet in front of it. The bedside table is a dark oak fence with a top slab, carrying a candle cluster. The chest sits
// in the south-east corner under a shelf of top slabs on the east wall, which holds a candle cluster and a potted poppy.
// A standing lantern on the floor lights the room from the south-east corner. The doorway (8,7..8,13) opens onto the
// clear lane (8,14) -> (7,14) -> the bed's foot, so nothing stands in the doorway's first cell.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bed } from "../vocab.mjs";

export function build(g) {
  // the bed, the focal piece: foot (7,7,15) facing west, head at (6,7,15) against the west wall
  bed(g, 7, 7, 15, "west", "white");

  // the furniture drawn as text. origin (6,7,14): x 6..10 along the row, z 14..16 down the rows. '.' is left alone.
  //   F dark_oak_fence (bedside post)   S dark_oak_slab top (table top and shelf)
  //   C candle cluster (bedside, lit)   K candle cluster on the shelf (lit)
  //   P potted_poppy on the shelf       L lantern standing on the floor
  //   H chest facing west               W white_carpet (rug before the bed)
  const legend = {
    F: "dark_oak_fence",
    S: ["dark_oak_slab", { type: "top" }],
    C: ["candle", { candles: 2, lit: true }],
    K: ["candle", { candles: 3, lit: true }],
    P: "potted_poppy",
    L: ["lantern", { hanging: false }],
    H: ["chest", { facing: "west", type: "single" }],
    W: "white_carpet",
  };
  const floor = [
    "F....", // z=14: bedside post at (6,7,14)
    "..W..", // z=15: rug at (8,7,15), the bed is placed above
    "...LH", // z=16: lantern at (9,7,16), chest at (10,7,16)
  ];
  const table = [
    "S....", // (6,8,14): the bedside table top
    ".....",
    ".....",
  ];
  const lamp = [
    "C...S", // (6,9,14): candle on the table top; (10,9,14): shelf on the east wall
    "....S", // (10,9,15)
    "....S", // (10,9,16): over the chest
  ];
  const shelfTop = [
    "....K", // (10,10,14): candles on the shelf
    "....P", // (10,10,15): potted poppy on the shelf
    ".....",
  ];
  layers(g, [6, 7, 14], legend, [floor, table, lamp, shelfTop]);
}
