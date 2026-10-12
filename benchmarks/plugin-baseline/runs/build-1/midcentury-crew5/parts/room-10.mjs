// ROOM bedroom 2 (interior designer): small yellow-accented bedroom, box [26,2,18,30,4,20], spruce floor.
// Entered from the corridor doorway (25,19) on the west and from the en-suite door (29,17) on the north.
// Layout (x 26..30 across, z 18..20 down; the row z=19 stays clear as the walk from the west door to the bed):
//   wardrobe on the north-west (26..27,18), desk and birch-stair chair on the south-west (26..28,20),
//   yellow bed on the east wall (foot 29,19, head 30,19) with a nightstand each side of the head.
// Light: a lantern on each nightstand and one on the desk, so every floor cell in the box is lit.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  W: "spruce_planks", // wardrobe body
  T: "flower_pot", // pot on the wardrobe top
  F: "spruce_fence", // desk legs and nightstand posts
  S: ["spruce_slab", { type: "bottom" }], // desk top
  N: ["birch_slab", { type: "bottom" }], // nightstand tops
  L: ["lantern", { hanging: false }], // standing lanterns (light)
  P: "potted_cactus", // plant on the second nightstand
  Q: "yellow_carpet", // yellow accent rug in front of the bed
  C: ["birch_stairs", { facing: "east", half: "bottom" }], // desk chair, back to the east, faces the desk
  Y: ["yellow_bed", { facing: "east", part: "foot" }], // bed foot (29,19)
  H: ["yellow_bed", { facing: "east", part: "head" }], // bed head (30,19), against the east wall
};

export function build(g) {
  // y=2: standing layer (wardrobe body, bed, chair, desk legs, nightstand posts)
  layers(g, [26, 2, 18], LEGEND, [
    "WW..F",
    ".QQYH",
    "FFCF.",
  ]);
  // y=3: wardrobe top, desk top, nightstand tops
  layers(g, [26, 3, 18], LEGEND, [
    "WW..N",
    ".....",
    "SS..N",
  ]);
  // y=4: pot, lanterns, cactus
  layers(g, [26, 4, 18], LEGEND, [
    "T...L",
    ".....",
    "L...P",
  ]);
}
