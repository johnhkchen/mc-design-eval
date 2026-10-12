// room: cubiculum W-N (plan x1..8 z9..13, air y2..5): a quiet bedchamber. One red bed on the west wall with its head
// to the wall, a barrel chest at the foot, a standing lamp at the bedside, one potted fern under the window, and a
// second lamp in the far corner so the room is not dark. The door (9, 2..3, 10) and the window (0, 3..4, 11..12) stay clear.
import { BARREL, BED, lamp, pot } from "../vocab.mjs";

export function build(g) {
  // the bed: head against the west wall at (1, z9), foot at (2, z9); facing = the way from foot to head (west)
  g.set(1, 2, 9, BED, { facing: "west", part: "head", occupied: "false" });
  g.set(2, 2, 9, BED, { facing: "west", part: "foot", occupied: "false" });

  // the chest at the foot of the bed
  g.set(3, 2, 9, BARREL, { facing: "up", open: "false" });

  // bedside light, beside the head (the walk to the foot stays open from (2, 10) and along z10)
  lamp(g, 1, 10);

  // one pot, under the window
  pot(g, 1, 12, "fern");

  // second light in the far corner, out of the doorway's line
  lamp(g, 8, 13);

  return g;
}
