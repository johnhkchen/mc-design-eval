// P3 wraparound porch: interior air x37..42, z7..8, y3..5. The front leg is two cells deep, so the lane runs along z8
// (and x41..42 stays clear from the steps to the double door). The swing hangs from the beam on the z7 row between
// the posts at x37 and x40. Light: a standing lantern on the deck in the west corner (it reaches every floor cell at
// 8+ on its own, so the porch does not depend on the ceiling), plus two hanging lanterns under the roof.
import { swing_seat, hanging_lantern } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Swing seat: spruce slab top at y3, iron chains up to the beam at y6 (x38..39, z7).
  swing_seat(g, 38, 39, 3, 7, { beamY: 6 });
  // Standing lantern on the deck (y2) in the west corner, off the lane (x38 stays open for the west-leg door).
  if (g.isAir(37, 3, 8)) g.set(37, 3, 8, ...B.lantern(false));
  // Hanging lanterns hang from the beam or the roof above; they place nothing where there is no ceiling to hang from.
  hanging_lantern(g, 38, 5, 8);
  hanging_lantern(g, 41, 5, 7);
}
