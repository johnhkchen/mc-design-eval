// room: cubiculum W-P (plan ROOMS): a bedchamber on the peristyle. Inner air x1..7, y2..5, z29..38.
// Entered by the door (8, 2..3, 33) on the east wall; the window (0, 3..4, 35..36) is on the west wall.
// Layout: the bed's head against the north wall (z29), foot at z30; a lamp at the headboard; a potted fern by the
// window; a second standing lamp in the middle so the far corners are not dark. The floor is clear from the door to the bed.
import { BED, lamp, pot } from "../vocab.mjs";

export function build(g) {
  // the bed, facing north: the head (z29) is the cell the facing points to from the foot (z30)
  g.set(2, 2, 29, BED, { facing: "north", part: "head", occupied: "false" });
  g.set(2, 2, 30, BED, { facing: "north", part: "foot", occupied: "false" });

  // the lamp at the headboard: quartz_pillar stub at y2, lantern on top
  lamp(g, 1, 29);

  // the pot in front of the window (not over it)
  pot(g, 1, 36, "fern");

  // a second light, a standing lamp in the middle of the room: the far corners would be dark on the headboard lamp alone
  lamp(g, 4, 34);
  return g;
}
