// Room "P7 upper hall" (interior designer's part): the one-cell landing hall x120, z14..20, feet y6. The partitions and
// doorways are the neighbouring rooms' (x119, x121) and stay as they are. The hall is a 1-wide lane, so nothing stands
// on its floor: a red runner carpet (walkable) runs its length, and two lanterns hang from the ceiling block above at
// y8, leaving y6..7 clear for the 2-high path. The lanterns light the lane to 8+ at the feet.
import { porchLantern } from "../vocab.mjs";

export function build(g) {
  // runner: carpet on the floor layer, walkable, leaves the lane open
  g.fill([120, 6, 14], [120, 6, 20], "red_carpet");

  // two hanging lanterns down the centre line, under the ceiling block at y9
  porchLantern(g, { x: 120, y: 8, z: 15 });
  porchLantern(g, { x: 120, y: 8, z: 19 });
}
