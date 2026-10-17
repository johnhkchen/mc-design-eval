// Part: room: classroom (interior designer). Inner air x 14..21, y 2..6, z 13..16 (plan.md FLOORS / rooms.json).
// Layout: a double desk pair each side of the centre aisle (x 16 and x 21 kept clear), the doorway lane x 17..18
// runs straight to the teacher's desk under the chalkboard on the back wall (the focal piece). Stove in the west
// corner, desk lanterns and candles along the rows. The cartographer table (21, 2, 16) is hearths.mjs's, not ours.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    C: ["spruce_stairs", { facing: "north" }], // chair, back to the door, seat to the desk
    F: "spruce_fence", // desk legs
    S: ["spruce_slab", { type: "top" }], // desk tops
    A: "andesite", // chalkboard panel on the back wall
    L: ["lantern", { hanging: "false" }], // standing on a desk top
    c: ["candle", { candles: "2", lit: "true" }], // on a desk top
    U: ["furnace", { facing: "east", lit: "true" }], // stove in the west corner
  };
  // Layers y 2, 3, 4, 5; each layer is rows z 13..16, columns x 14..21 (the '.' cells are left as they are).
  const rows = [
    // y 2: chairs, desks, stove, teacher's desk legs
    [
      "CC...CC.",
      "FF...FF.",
      "........",
      "U..FF...",
    ],
    // y 3: desk tops
    [
      "........",
      "SS...SS.",
      "........",
      "...SS...",
    ],
    // y 4: lanterns and candles on the desks, the board's lower course
    [
      "........",
      "Lc...cL.",
      "........",
      "..AAAA..",
    ],
    // y 5: the board's upper course
    [
      "........",
      "........",
      "........",
      "..AAAA..",
    ],
  ];
  return layers(g, [14, 2, 13], legend, rows);
}
