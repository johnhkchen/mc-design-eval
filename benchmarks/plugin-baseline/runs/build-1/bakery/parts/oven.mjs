// Part 3, Oven and chimney (plan.md PARTS 3; elements.md: brick bread oven, chimney, smoke).
// Builds the bread oven (cobbled plinth, brick body round the air chamber x=18..20 z=23..25, y=2..3, brick barrel vault
// y=4..5 with the flue (19,4,24) left air), the lit campfire on the chamber floor (19,2,24), the smoker beside the mouth
// (18,2,21), and the chimney x=19..20 z=24..25 from y=4 to the top ring at y=17 (deepslate_bricks band at y=12, lit
// campfire smoking at (19,17,24)). Writes only into air: the wing's south wall (z=22) and the oven mouth are left to P1.
import { ovenVault, chimneyStack } from "../vocab.mjs";

export function build(g) {
  ovenVault(g);     // plinth, body ring, chamber fire and smoker, vault courses and crown
  chimneyStack(g);  // flue shaft to y=16, band, top ring of slabs and the smoking campfire
}
