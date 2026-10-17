// Part: room: farmhouse living room (interior designer). Inner air x 26..33, y 2..5, z 11..13 (plan.md ROOMS/FLOORS).
// Focal piece: the lit furnace stove on the back wall (z 14, the hearth wall), in the brightest light. Table and two chairs
// in the middle of the west half, a barrel dresser with a candle, a settle on the east wall, hanging lanterns from the loft floor.
// Lanes kept clear: the front door cells (29..30, 11), the kitchen door lane x 31 z 11..13, and the flight's foot z 12 x 26..30.
// Only air is written: layers() goes through g.set, so the shell and the locked flight are never touched by a clear '.' cell.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    B: "barrel",
    T: "spruce_planks",
    N: ["spruce_stairs", { facing: "north" }],
    E: ["spruce_stairs", { facing: "east" }],
    F: ["furnace", { facing: "north", lit: "true" }],
    c: ["candle", { candles: "1", lit: "true" }],
    L: ["lantern", { hanging: "false" }],
    h: ["lantern", { hanging: "true" }],
  };
  // Layers y 2..5 (rows along +x from x 26, successive rows along +z from z 11). '.' is left as it is.
  const y2 = [
    "BN....BE", // z 11: barrel dresser, chair, front lane (29..30), barrel, settle on the east wall
    ".TE.....", // z 12: table, chair east of it, lane
    ".......F", // z 13: flight foot x 26..30 (not drawn); kitchen lane x 31; stove on the hearth wall
  ];
  const y3 = [
    "c.....L.", // candle on the barrel, standing lantern on the barrel's far end
    ".c......", // candle on the table
    "........",
  ];
  const y4 = ["........", "........", "........"];
  const y5 = [
    "........",
    "...h..h.", // hanging lanterns under the loft floor
    "........",
  ];
  return layers(g, [26, 2, 11], legend, [y2, y3, y4, y5]);
}
