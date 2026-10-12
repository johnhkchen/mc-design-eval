// room: cubiculum E-P (plan.md ROOMS): the bedchamber on the peristyle, mirror of W-P. Inner air x28..34, y2..5, z29..38.
// Entered from the walkway by the door at (27, 2..3, 33); window in the east wall at z35..36. Nothing over the door or window.
// Layout: the bed on the east wall, head to the wall; the clothes chest (barrel) at its foot; a lamp beside the head
// and one at the north-west corner for light; a red rug in the south-east quarter; one pot in the far corner.
// The walk from the door runs along z=33 to the foot of the bed, clear of every piece.
import { BARREL, BED, CUSHION, lamp, pot } from "../vocab.mjs";

export function build(g) {
  // the bed: the head is one cell east of the foot (facing east), so the head sits against the east wall
  g.set(33, 2, 31, BED, { facing: "east", occupied: "false", part: "foot" });
  g.set(34, 2, 31, BED, { facing: "east", occupied: "false", part: "head" });

  // the clothes chest at the foot of the bed
  g.set(32, 2, 31, BARREL, { facing: "up", open: "false" });

  // light: the bedside lamp, and one at the north-west corner
  lamp(g, 34, 30);
  lamp(g, 28, 30);

  // a small red rug, walkable, clear of the window and the door
  g.fill([30, 2, 35], [31, 2, 36], CUSHION);

  // one pot in the south-east corner
  pot(g, 34, 37, "fern");

  return g;
}
