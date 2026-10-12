// villa-haiku part 4: the atrium's centre. The rain pool (impluvium, E04 E05) at the centre, the four standing lamps at the
// atrium corners and the potted plants at the peristyle walkway ends. Nothing goes over the doorways. The shell leaves the
// pool's y1 cells unclaimed (LATER_FLOOR), so the basin lands here. Ticks E04 E05 E20 E21.
import { IMPLUVIUM, ATRIUM_LAMPS, WALKWAY_POTS, impluvium, lamp, pot } from "../vocab.mjs";

export function build(g) {
  impluvium(g, IMPLUVIUM);
  for (const [x, z] of ATRIUM_LAMPS) lamp(g, x, z);
  WALKWAY_POTS.forEach(([x, z], i) => pot(g, x, z, i % 2 ? "azalea" : "fern"));
}
