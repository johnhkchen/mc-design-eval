// ROOM master bedroom (interior designer): box [23,2,22,30,4,24]. The orange bed is the focal piece, set in the middle row
// between a wardrobe on the west wall and an egg chair in the east glass corner. Row z=22 stays clear as the lane from the
// corridor opening (x=23..24) to the slider (x=26..27, z=25 via x=27). One bedside lantern, three hung lanterns.
import { ORANGE_BED, SPRUCE_PLANKS, BIRCH_PLANKS, LANTERN, POTTED_CACTUS, egg_chair, wardrobe, hung_lantern } from "../vocab.mjs";

export function build(g) {
  // wardrobe wall on the west partition (x=23, z=23..24), open fronts facing east
  wardrobe(g, 23, 23, 2, "z");

  // orange bed: foot at x=25, head at x=26, spruce headboard behind the head at x=27
  g.set(25, 2, 23, ORANGE_BED, { facing: "east", part: "foot" });
  g.set(26, 2, 23, ORANGE_BED, { facing: "east", part: "head" });
  g.set(27, 2, 23, SPRUCE_PLANKS);

  // bedside table on the south side of the head: birch_planks with a standing lantern on top
  g.set(26, 2, 24, BIRCH_PLANKS);
  g.set(26, 3, 24, LANTERN, { hanging: "false" });

  // egg chair reading corner: seat at x=29 facing west, high back against the east glass at x=30
  egg_chair(g, 29, 23, "west");
  g.set(30, 2, 24, POTTED_CACTUS);

  // hung lanterns at y=4 under the ceiling: over the bed, over the lane, over the wardrobe end (not over a doorway)
  hung_lantern(g, 26, 23);
  hung_lantern(g, 29, 22);
  hung_lantern(g, 23, 24);
}
