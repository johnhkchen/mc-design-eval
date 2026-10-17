// Part: room: owner upper bedrooms. Interior: x 86..91, z 10..14, floor stand y 7, air to y 10.
// Keep clear (built by others): the flight's landing and headroom at x 86 z 10..12 and the rail at x 87 z 11..12; the
// balcony doorway's first cells x 86..87 z 14 (y 7..8). The lane runs x 88 (z 10..14), then x 89 north-south, so the
// stair landing, the balcony doors and every bed foot are joined. Beds (plan: 4) come to 3 here: the plan's south bed at
// x 88 z 13..14 walls the balcony doors off, so it moves to x 90 z 13..14 (see plan.md Notes).
// Light: a standing lantern on the dresser (focal, in the window's view), a standing lantern on the work table, a lit
// candle by the back bed. Nothing over the east windows at x 92 z 11 and z 13 (y 8..9).
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Floor level (y 7): barrels (dresser, pocket), the table post, the chair. Rows run along +x (x 86..91), z 10..14.
  layers(g, [86, 7, 10], {
    "s": ["pale_oak_stairs", { facing: "east", half: "bottom", shape: "straight" }],
    "f": "pale_oak_fence",
    "b": "barrel",
  }, [
    "      ",   // z 10: landing and lane
    "    bb",   // z 11: dresser barrels under the east window (x 90..91)
    "      ",   // z 12: lane
    "sf   b",   // z 13: chair (x 86), table post (x 87), pocket barrel (x 91)
    "     b",   // z 14: pocket barrel (x 91)
  ]);

  // Top level (y 8): the table top slab, the dresser lantern, the lit candle on the pocket barrel.
  layers(g, [86, 8, 10], {
    "t": ["smooth_stone_slab", { type: "top" }],
    "L": ["lantern", { hanging: "false" }],
    "c": ["candle", { candles: "2", lit: "true" }],
  }, [
    "      ",
    "    L ",   // z 11: lantern on the dresser barrel (x 90), nothing in front of the window (x 91)
    "      ",
    " t    ",   // z 13: table top (x 87)
    "     c",   // z 14: lit candle on the pocket barrel (x 91)
  ]);

  // Light on the table top (y 9): the table lantern stands on the top slab.
  layers(g, [86, 9, 10], {
    "L": ["lantern", { hanging: "false" }],
  }, [
    "      ",
    "      ",
    "      ",
    " L    ",   // z 13: lantern on the table top (x 87)
    "      ",
  ]);

  // Beds: whole, heads against solid walls. East beds: heads at x 91 against x 92 (z 10, z 12).
  // South bed: foot z 13, head z 14 against the back wall z 15.
  bed(g, [90, 7, 10], "east", "red");
  bed(g, [90, 7, 12], "east", "blue");
  bed(g, [90, 7, 13], "south", "white");
}
