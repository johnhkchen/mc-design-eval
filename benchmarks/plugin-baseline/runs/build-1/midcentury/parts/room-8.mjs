// ROOM bath 1 (interior designer): hall bathroom, white quartz, windowless. Inner air [26,2,14,27,4,16]: two cells
// wide, three deep. The door is at (25,2..3,15) on the west wall, so the row z=15 is the walkway and every fixture sits
// on a wall-side row: tub on the north row (z=14), basin and WC on the south row (z=16).
// The vault over z=14..16 is open (no y=5 ceiling), so every light stands on a block: a sea_lantern on the tub's far
// corner (the focal piece) and a lantern on the cistern. The tub is a solid white quartz box, not water: a water cell is
// a standable floor the walker cannot reach from the walkway, so it reads as partly blocked. bath_fit (vocab) puts its
// water on z=15, which would block the only walkway, so the tub is built here.
import { CAULDRON, GLASS_PANE, LANTERN, SEA_LANTERN, SMOOTH_QUARTZ, SMOOTH_QUARTZ_STAIRS } from "../vocab.mjs";

export function build(g) {
  // tub: a white quartz box on the north row, two cells high, with a sea_lantern standing on its far corner
  for (const x of [26, 27]) for (const y of [2, 3]) g.set(x, y, 14, SMOOTH_QUARTZ);
  g.set(26, 4, 14, SEA_LANTERN);
  // basin: cauldron on the south row with a mirror pane above it
  g.set(26, 2, 16, CAULDRON);
  g.set(26, 3, 16, GLASS_PANE);
  g.set(26, 4, 16, GLASS_PANE);
  // WC: quartz stairs with the seat facing into the room (north), a cistern block above it, a lantern standing on the cistern
  g.set(27, 2, 16, SMOOTH_QUARTZ_STAIRS, { facing: "north", half: "bottom" });
  g.set(27, 3, 16, SMOOTH_QUARTZ);
  g.set(27, 4, 16, LANTERN, { hanging: "false" });
}
