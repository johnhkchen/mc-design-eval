// facade (plan.md PARTS 5; elements E01 E02 E20 E21 E26): the street approach, the lamps that light the entrance and the
// street, and the pots beside the shop counters. Everything here sits at z <= 0 or on the shop floors beside the counters,
// and writes only into cells no earlier part fills (the pocket is the shell's carved air, so the pocket lamps stand on the
// street instead; see plan.md Notes).
import { streetPaving, lamp, pot, STREET_PAVING, STREET_LAMPS, POCKET_LAMPS } from "../vocab.mjs";

// Pocket lamps: plan.md has them at (16,2,0) and (19,2,0), but the shell carves the pocket (16..19, 2..5, 0) to air, so
// those cells are the shell's and a write there is refused at the merge. They stand on the street paving at z=-1 instead,
// a pillar at y1 with the lantern at y2, flanking the entrance cell [17,1,-1].
const POCKET_LAMPS_STREET = POCKET_LAMPS.map(([x]) => [x, -1]);

export function build(g) {
  // the approach: stone_bricks at y0 with the smooth_stone_slab edge at z=-1
  streetPaving(g, STREET_PAVING);

  // street lamps: pillar at y1 standing on the paving, lantern at y2
  for (const [x, z] of STREET_LAMPS) lamp(g, x, z, 1);

  // pocket lamps: beside the entrance, on the street (see the note above)
  for (const [x, z] of POCKET_LAMPS_STREET) lamp(g, x, z, 1);

  // pots beside the shop counters: W1 at x1 (counter x2..5), E1 at x34 (counter x30..33)
  pot(g, 1, 1, "fern");
  pot(g, 34, 1, "azalea");
  return g;
}
