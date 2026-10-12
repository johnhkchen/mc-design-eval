// Cubiculum C5 (SW of court): a small bedroom off the peristyle. Inner air x1..5, y2..5, z32..37 (box [1,2,32,5,5,37]).
// Doorway (6,2..3,35) from the colonnade on the east wall; window (0,3..4,35) on the west wall. Layout:
//   north wall (z=31): the red bed, head against the wall, its bedside lampstand beside it (the focal group);
//   west corner (SW): the chest, against the west wall, clear of the window cell (0,3..4,35);
//   NE corner: a potted fern on a stone_bricks pedestal;
//   a red_carpet rug in front of the bed; one hanging bronze lamp over the middle of the room.
// The 2-high walkway runs straight from the doorway (x5, z35) to the bed foot (3,33) and the chest, nothing over the
// doorway or the window.
import { RED_BED, CHEST, RED_CARPET, hangLamp, lampStand, pot } from "../vocab.mjs";

export function build(g) {
  // Sleeping group on the north wall: the bed runs north-south, head at z32 against the wall, foot at z33.
  // facing = the way the head lies from the foot, so the head part faces north.
  g.set(3, 2, 32, RED_BED, { facing: "north", part: "head" });
  g.set(3, 2, 33, RED_BED, { facing: "north", part: "foot" });
  // Bedside small lamp on the west side of the head.
  lampStand(g, 2, 32);
  // Rug at the foot of the bed (carpet is walkable), two cells wide.
  for (const x of [2, 3, 4]) g.set(x, 2, 34, RED_CARPET);

  // Storage group on the west wall, SW corner: chest facing east into the room, beside the window's inner side.
  g.set(1, 2, 36, CHEST, { facing: "east", type: "single" });

  // Plant in the NE corner (pedestal + pot).
  pot(g, 5, 32, "fern");

  // Light: one hanging bronze lamp over the centre (chain y5, lantern y4).
  hangLamp(g, 3, 35);
}
