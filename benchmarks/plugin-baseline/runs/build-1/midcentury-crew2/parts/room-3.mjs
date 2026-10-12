// ROOM dining (interior designer): the dining box x=11..15, z=14..18, y=2..4 under the raised vault.
// Layout, by use: sideboard on the west wall under the window (x=11, z=14..16) with a potted cactus; a 2x2 table
// (x=13..14, z=15..16) on four spruce fences with a spruce slab top at y=3; six birch-stair chairs, two per side
// (west, north, south). The east column (x=15) stays open as the through path from the kitchen doorway (z=13) to
// the living doorway (z=19). Light: a lantern hung from the beam at x=13 over the table (the focal piece) and a
// floor lantern in the south-west corner. Rows run along +x, successive rows along +z, from the origin [11, 2, 14].
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [11, 2, 14];
const LEGEND = {
  S: "birch_planks",                        // sideboard body
  B: B.slab("birch", "bottom"),             // sideboard top
  P: "potted_cactus",                       // sideboard ornament
  F: B.fence("spruce"),                     // table legs
  T: B.slab("spruce", "bottom"),            // table top
  N: B.stairs("birch", "north", "bottom"),  // chair at the north end (back to the north, faces the table)
  U: B.stairs("birch", "south", "bottom"),  // chair at the south end
  W: B.stairs("birch", "west", "bottom"),   // chair on the west side
  L: B.lantern(false),                      // floor lantern
  H: B.lantern(true),                       // pendant lantern, hung from the beam at x=13, y=5
};

// y=2 (standing level): sideboard body, table legs, chairs, floor lantern
const Y2 = [
  "S.NN.",
  "SWFF.",
  "SWFF.",
  "..UU.",
  "L....",
];
// y=3: sideboard top slabs with the cactus pot between them, table top
const Y3 = [
  "B....",
  "P.TT.",
  "B.TT.",
  ".....",
  ".....",
];
// y=4: the pendant lantern over the table centre
const Y4 = [
  ".....",
  "..H..",
  ".....",
  ".....",
  ".....",
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, [Y2, Y3, Y4]);
}
