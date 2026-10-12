// ROOM bedroom 1 (interior designer): guest/child room in sea-blue. Air box x=26..30, y=2..4, z=9..12 (plan.md);
// doorway (25,2..3,10) on the west wall; window x=31 z=10..12 (nothing placed on x=31, nothing over the window).
// Layout (x = 26..30 across, z = 9..12 down; the walk runs doorway -> (28,10) -> north row -> east corner):
//   z=9   . l . . .      hung lantern at (27,9) over the north walk row
//   z=10  . . . B .      bed foot at (29,10); reach it from (28,10) or (29,9)
//   z=11  W W n H n      wardrobe planks x=26, fronts x=27; nightstands (28,11) and (30,11) beside the head (29,11)
//   z=12  W W . h .      headboard (29,12) spruce against the south wall
import { bed_double, wardrobe, hung_lantern, LANTERN, POTTED_CACTUS } from "../vocab.mjs";

export function build(g) {
  // focal piece: sea-blue double bed, spruce headboard on the south wall, birch nightstands on spruce fences either side
  bed_double(g, 29, 10, "south", "light_blue");
  // wardrobe on the west wall beside the doorway: spruce planks with open trapdoor fronts facing east
  wardrobe(g, 26, 11, 2, "z");
  // bedside light on the west nightstand (standing lantern on the slab top), potted cactus on the east one
  g.set(28, 4, 11, LANTERN, { hanging: "false", waterlogged: "false" });
  g.set(30, 4, 11, POTTED_CACTUS);
  // ceiling lantern over the north walk row, lighting the doorway and the wardrobe
  hung_lantern(g, 27, 9, 4);
}
