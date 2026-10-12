// ROOM gallery (interior designer): a one-cell-deep entrance strip at z=10, x=16..22, y=2..4 (plan ROOMS).
// Every cell of the strip is a route: the front door (19,9), the kitchen opening (x=16) and the corridor opening (x=22)
// all sit at its ends, and the atrium doors (19..20, z=11) open off its middle. So no floor furniture fits without
// breaking the 2-high path. The room is lit and kept clear; the lanterns hang from the ceiling above the route, the
// middle one over the front door as the focal light.
import { hung_lantern } from "../vocab.mjs";

export function build(g) {
  // hung lanterns under the ceiling (y=5 is the beam at x=16/19/22 and the spruce ceiling elsewhere)
  hung_lantern(g, 17, 10, 4);
  hung_lantern(g, 19, 10, 4);
  hung_lantern(g, 21, 10, 4);
}
