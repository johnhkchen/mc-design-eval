// Room 14, Hyatt annex meeting rooms (interior designer): a conference room above the open passage.
// Box [153,8,57]..[170,11,62]. Focal piece: the long conference table on the centre line (z 59..60), with chairs
// (quartz stairs) on both flanks and a presentation screen at the east end. A sideboard on the west wall. Light:
// three hanging lanterns over the table, the stair flight (x 156..160, z 61) is the joiner's and is kept clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 153;
const Z0 = 57;
const WIDTH = 18;   // x 153..170
const DEPTH = 6;    // z 57..62

// One row of the layer: cells maps an x to a character; everything else is air (".").
const row = (cells) => {
  const a = Array(WIDTH).fill(".");
  for (const [x, c] of cells) a[x - X0] = c;
  return a.join("");
};

// Rows for z 57..62 of one layer, from a per-z list of [x, char] pairs.
const layer = (byZ) => [57, 58, 59, 60, 61, 62].map((z) => row(byZ[z] ?? []));

// Table: posts at x 157, 160, 163, 166 on z 59 and 60 (y 8), top slab across x 157..166 (y 9).
const POSTS = [157, 160, 163, 166];
const TABLE = [157, 158, 159, 160, 161, 162, 163, 164, 165, 166];

const legend = {
  F: "oak_fence",
  T: ["smooth_quartz_slab", { type: "top" }],
  N: ["quartz_stairs", { facing: "north", half: "bottom" }],   // chairs north of the table, back to the north
  S: ["quartz_stairs", { facing: "south", half: "bottom" }],   // chairs south of the table, back to the south
  Q: "smooth_quartz",                                          // sideboard on the west wall
  W: "white_concrete",                                         // presentation screen at the east end
  L: ["lantern", { hanging: "true" }],
};

// Floor furniture, y 8: chairs, table posts, sideboard, screen.
const y8 = layer({
  58: [...[157, 159, 161, 163, 165].map((x) => [x, "N"]), [154, "Q"], [169, "W"]],
  59: [...POSTS.map((x) => [x, "F"]), [154, "Q"], [169, "W"]],
  60: [...POSTS.map((x) => [x, "F"]), [154, "Q"], [169, "W"]],
  61: [...[162, 164, 166].map((x) => [x, "S"])],
});

// Screen height and table top, y 9: the top slab over the table, the screen's second course.
const y9 = layer({
  59: [...TABLE.map((x) => [x, "T"]), [169, "W"]],
  60: [...TABLE.map((x) => [x, "T"]), [169, "W"]],
  58: [[169, "W"]],
});

// y 10: the screen's top course only.
const y10 = layer({
  58: [[169, "W"]],
  59: [[169, "W"]],
  60: [[169, "W"]],
});

// y 11: three hanging lanterns over the table, under the ceiling at y 12.
const y11 = layer({
  59: [[156, "L"], [162, "L"], [168, "L"]],
});

export function build(g) {
  layers(g, [X0, 8, Z0], legend, [y8, y9, y10, y11]);
}
