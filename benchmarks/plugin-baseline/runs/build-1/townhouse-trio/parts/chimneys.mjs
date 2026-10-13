// chimneys and hearths (part 4): the two stacks from their own footings to y=28 (band, stepped cap, lit campfires at the
// top), and the four fireboxes that open from the stacks' side faces into the rooms (plan.md RESERVED: (10|12|18|20,
// 3..4, 18..19)). The flues (x=11 and x=19, y5..27) and the footings stay as the shell and roofs left them.
import { CHIMNEY_AB, CHIMNEY_BC, chimneyStack, hearth } from "../vocab.mjs";

export function build(g) {
  // Fireboxes go first: their lintels (y=5, upside-down brick stairs) are the top of the stack's face cells, so the
  // stack's masonry from y=5 must not take them. Stack A/B: west face x=10 opens into A (room lies west), east face
  // x=12 opens into B (room lies east). Stack B/C: x=18 opens into B, x=20 into C.
  const [abX, , abZ] = CHIMNEY_AB;
  const [bcX, , bcZ] = CHIMNEY_BC;
  const fires = [
    ["hearth A", hearth(g, abX, abZ, "west")],
    ["hearth B", hearth(g, abX + 2, abZ, "east")],
    ["hearth B (2)", hearth(g, bcX, bcZ, "west")],
    ["hearth C", hearth(g, bcX + 2, bcZ, "east")],
  ];
  const stacks = [["stack A/B", chimneyStack(g, abX, abZ)], ["stack B/C", chimneyStack(g, bcX, bcZ)]];

  for (const [name, r] of [...fires, ...stacks]) {
    if (r && r.skipped) console.warn(`chimneys: ${name} skipped ${r.skipped} cells`);
  }
}
