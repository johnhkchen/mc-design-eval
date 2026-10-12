// Room part, Backstube (prep and proofing room): interior designer, box [7,2,17,15,5,21].
// Layout (x 7..15 across, z 17..21 down; walk level y=2; S = the stair housing the shell built, keep clear):
//   z17  S  S  F  .  .  .  R  .  R      F flour store (9,17); R bread rack (13..15,17) on the north wall
//   z18  S  S  .  .  .  T  T  T  .      T kneading trough (12..14,19), seats at z=18 and z=20 (focal, south of the archway)
//   z19  .  .  .  .  .  T  T  T  .      archway from the shop at (11..12,16); the lane runs down x=11
//   z20  .  .  .  .  .  T  T  T  P      P peel wall on the east wall (x=15, z=20)
//   z21  .  D  W  W  W  .  .  .  .      W work table (9..11,21) on the south wall; D back door (8,22)
// Lanes: archway -> x=11 -> z=19 -> west along z=19..20 to x=8 -> the back door at (8,21); the stair foot at (7..8,19).
import { flourStore, breadRack, kneadingTrough, workTable, peelWall, hangingLantern } from "../vocab.mjs";

export function build(g) {
  // Flour store: two barrels and a hay bale, against the north wall beside the stair housing.
  flourStore(g, 9, 2, 17);

  // Bread rack: a 3-wide baker's shelf on the north wall, east of the archway.
  breadRack(g, 13, 2, 17, "x", 3);

  // Focal piece: the kneading trough, straight south of the archway (cauldrons at y=2, seats on both long sides).
  kneadingTrough(g, 12, 2, 19, 3);

  // Work table on the south wall, west of the trough; its planks row sits at y=2 with the crafting table on the west end.
  workTable(g, 9, 2, 21, 3);

  // Peel wall: tools on the east wall, beside the trough's east end.
  peelWall(g, 15, 2, 20, "east");

  // Hanging lanterns from the upper floor's underside, over the trough, the lane and the work table.
  hangingLantern(g, 13, 5, 19);
  hangingLantern(g, 9, 5, 18);
  hangingLantern(g, 11, 5, 21);
}
