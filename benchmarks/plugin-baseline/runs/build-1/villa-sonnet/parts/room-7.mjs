// Room 7: Cubiculum C1 (NW), inner air [1,2,10,8,5,14], off the atrium through the doorway (9,2..3,12); window (0,3..4,12).
// Designer's layout (plan E18: a small quiet bedroom, bed + chest + small lamp + pot):
//   - focal piece: a red_bed on the north wall (head against the wall at z10, foot at z11), centred on x4
//   - bedside: a standing bronze lampStand at (3,10) beside the bed head
//   - chest: a chest against the north wall in the NE corner (7,10), its front to the room
//   - pot: a potted fern on a pedestal in the NW corner (1,10), beside the window wall
//   - rug: a 2x2 red_carpet in front of the bed (x3..4, z13..14), leaving z12 clear for the path
//   - light: a hanging lamp over the middle of the room (5,12), so the room is not dark
// The path from the doorway (8,12) runs west along z12 to the bed foot (4,11); nothing stands over the doorway or window.
import { CHEST, RED_BED, RED_CARPET } from "../vocab.mjs";
import { hangLamp, lampStand, pot } from "../vocab.mjs";

export function build(g) {
  // the bed: foot then head, both facing north (foot -> head), head against the north wall
  g.set(4, 2, 11, RED_BED, { facing: "north", part: "foot", occupied: "false" });
  g.set(4, 2, 10, RED_BED, { facing: "north", part: "head", occupied: "false" });

  // bedside lamp, between the bed head and the NW pot
  lampStand(g, 3, 10);

  // chest in the NE corner, front facing into the room
  g.set(7, 2, 10, CHEST, { facing: "south", type: "single", waterlogged: "false" });

  // potted fern in the NW corner
  pot(g, 1, 10, "fern");

  // small rug in front of the bed
  for (const x of [3, 4]) for (const z of [13, 14]) g.set(x, 2, z, RED_CARPET);

  // hanging lamp over the middle of the room
  hangLamp(g, 5, 12);
}
