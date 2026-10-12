// ROOM master bedroom (interior designer): the master suite, inside its air box [23,2,22,30,4,24].
// Layout (x 23..30 across, z 22..24 deep; the corridor enters at x=23..24 on z=21, the slider is at x=26..27 on z=25):
//   - orange bed on the north side, its head against the partition at z=21, nightstands either side of the head;
//   - a wardrobe wall on the west, against the entry (x=23..24, z=23..24), its open fronts facing east;
//   - an egg-chair seat (orange stairs) by the east glass at x=30, z=23, sitter facing the glass;
//   - orange carpet on the slider's path; three hanging lanterns over the bed, the path and the chair.
// Rows along +z (z=22,23,24), columns along +x (x=23..30).
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { wardrobe, hung_lantern } from "../vocab.mjs";

const legend = {
  f: "spruce_fence",                                                    // nightstand post
  b: ["birch_slab", { type: "bottom" }],                                // nightstand top
  H: ["orange_bed", { facing: "north", part: "head" }],                 // bed head, against the partition
  F: ["orange_bed", { facing: "north", part: "foot" }],                 // bed foot, toward the room
  S: ["smooth_red_sandstone_stairs", { facing: "east", half: "bottom", shape: "straight" }], // egg-chair seat
  c: "orange_carpet",                                                   // rug on the slider path
  p: "potted_cactus",                                                   // nightstand plant
};

export function build(g) {
  // the wardrobe wall: spruce back at x=23 and open trapdoor fronts at x=24, z=23..24, y=2..3 (its helper writes)
  wardrobe(g, 23, 23, 2, "z", "east");
  // lanterns hang from the ceiling over the bed head, the middle path and the reading chair (y=4)
  hung_lantern(g, 24, 23, 4);
  hung_lantern(g, 27, 22, 4);
  hung_lantern(g, 30, 24, 4);

  // floor level (y=2) and nightstand tops (y=3), drawn as text with the origin [23,2,22]
  const y2 = [
    "...fHf..",   // z=22: nightstand, bed head, nightstand (x=26..28)
    "....F..S",   // z=23: bed foot (x=27), egg-chair seat (x=30)
    "...ccc..",   // z=24: orange rug at the slider (x=26..28)
  ];
  const y3 = [
    "...b.b..",   // z=22: the two nightstand tops
    "........",
    "........",
  ];
  // a potted cactus on each nightstand top (y=4) keeps the slab tops from reading as walkable floor
  const y4 = [
    "...p.p..",   // z=22: pots on the nightstand tops (x=26, x=28)
    "........",
    "........",
  ];
  layers(g, [23, 2, 22], legend, [y2, y3, y4]);
}
