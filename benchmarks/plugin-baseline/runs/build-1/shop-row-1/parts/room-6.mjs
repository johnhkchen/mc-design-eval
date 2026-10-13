// Part "room: corridor 2" (parts/room-6.mjs): second-floor corridor, interior box x 4..20, y 19..22, z 3..4.
// Plan: the lane runs along the north row (z 3) from the stair door (21,3) to the west end; the south row (z 4) holds
// the furniture, leaving the cells in front of the flat doors at x 8 and x 16 free. Focal piece: a hall table with a
// potted plant at the west end, where the stair door looks. A bench of two stair seats sits mid-run. Lanterns stand on
// dark_oak_fence posts along the furniture row (the ceiling is not in this part's reach, so nothing hangs).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    F: "dark_oak_fence",                          // table post, lantern posts
    S: ["dark_oak_slab", { type: "bottom" }],     // table top
    P: "flower_pot",                              // corner plant at the west end
    T: ["dark_oak_stairs", { facing: "south", half: "bottom" }], // bench seat, back to the flat wall
    l: ["lantern", { hanging: "false" }],         // standing on a post, or on the table top
  };
  // Rows run along +x from x 4 to x 20 (17 cells); the first row is z 3 (the lane), the second is z 4 (furniture side).
  layers(g, [4, 19, 3], legend, [
    [ // y 19: corner plant, table post, bench seats, lantern posts
      ".................",
      "PF....F.TT.F...F.",
    ],
    [ // y 20: table top, lanterns on the posts
      ".................",
      ".S....l....l...l.",
    ],
    [ // y 21: the lantern on the table, the focal light
      ".................",
      ".l...............",
    ],
  ]);
}
