// villa-haiku: room 1, the fauces (plan.md ROOMS; elements E20, E21). Inner air x16..19, y2..5, z2..7.
// Layout: the two-wide walk (x17..18) stays clear from the door (z=1) to the atrium opening (z=8). A lamp pair stands
// on the side columns (x16, x19) mid-passage, lighting the walk without blocking it; a fern pot at each back corner
// frames the opening onto the atrium. The mosaic floor is the shell's.
import { lamp, pot } from "../vocab.mjs";

export function build(g) {
  lamp(g, 16, 3);
  lamp(g, 19, 3);
  pot(g, 16, 7, "fern");
  pot(g, 19, 7, "fern");
  return g;
}
