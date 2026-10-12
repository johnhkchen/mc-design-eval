// Part 3, Oven and chimney (plan.md: BREAD OVEN and CHIMNEY, FLOORS/RESERVED for the oven mouth and flue).
// Builds the brick bread oven at x=17..21 z=23..26 (plinth y=1, body y=2..3, barrel vault y=4..5 via ovenVault),
// the lit campfire in its chamber (19,2,24), the smoker beside the mouth (18,2,21), and the 2x2 chimney on
// x=19..20 z=24..25 from y=4 up to the smoking top ring at y=17 (chimneyStack, band at y=12). The flue (19,4..16,24)
// stays air. Writes only into air: the wing's south wall (z=22) and the mouth (19,2..3,22) belong to P1 and stay open.
import { ovenVault, chimneyStack } from "../vocab.mjs";

export function build(g) {
  ovenVault(g, 17, 1, 23, "north");
  chimneyStack(g, 19, 24, 4, 17, 12);
  g.set(18, 2, 21, "smoker", { facing: "south", lit: "false" });
}
