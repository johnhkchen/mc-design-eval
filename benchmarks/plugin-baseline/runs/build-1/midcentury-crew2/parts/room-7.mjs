// ROOM bedroom 1 (interior designer): guest/child room in blue-teal. Inner air x 26..30, y 2..4, z 9..12; doorway (25,10)
// on the west wall; east window x=31 z=10..12. Layout (x 26..30 across, z 9..12 down; y=2 floor level):
//   z=9   . . H T W      H = headboard (28,9)     T = wardrobe front trapdoor (29,9), W = wardrobe back (30,9)
//   z=10  D . N B N .    B = bed head (28,10)     N = nightstand (27,10), (29,10); D = doorway (25,10)
//   z=11  . . F . .      F = bed foot (28,11)     lantern hung over (30,11)
//   z=12  . . . . .      lantern hung over (26,12)
// The bed is the focal piece, on the north wall with its headboard under the ceiling beam at x=28; the wardrobe is the
// one-cell cabinet on the east side, so every free cell stays on a route from the doorway.
import { bed_double, wardrobe, hung_lantern } from "../vocab.mjs";

export function build(g) {
  // focal piece: cyan (blue-teal) double bed, facing north: head at (28,10), foot at (28,11), headboard (28,9)
  bed_double(g, 28, 11, "north", "cyan");
  // one-cell spruce wardrobe on the east wall (back (30,9), trapdoor fronts (29,9) facing west), two high
  wardrobe(g, 30, 9, 1, "z", "west");
  // light: a lantern hung from the ceiling beam above the bed head, a second in the south-west corner, and a potted
  // cactus on the nightstand. Nothing sits over the doorway (25,10) or the window (x=31).
  hung_lantern(g, 28, 10, 4);
  hung_lantern(g, 26, 12, 4);
  hung_lantern(g, 30, 11, 4);   // lifts the dim cell behind the wardrobe, (30,10)
  g.set(27, 4, 10, "potted_cactus");
}
