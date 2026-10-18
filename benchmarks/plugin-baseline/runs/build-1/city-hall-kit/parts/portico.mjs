// P5 portico front: the three arched doorways, the pediment and its relief (plan elements 16-22).
// Plot 1 is written through the north face frame: u = x, d = z (plot z0 = 0). Every write is air-only, so the
// openings left empty by the front shell (x 86..89, 94..97, 102..105 at y 1..8, z 0..3) take these blocks and nothing else.
import { faceFrame, archedDoorway, pediment, pedimentRelief } from "../vocab.mjs";
import { PLOTS } from "../vocab/base.mjs";

// The three arches on the portico's base storey (plan OPENINGS: doors at z 3, y 2..3, landings at y 1).
const ARCHES = [86, 94, 102];

export function build(g) {
  const { x0, z0, x1, z1 } = PLOTS.portico;
  const F = faceFrame("north", [x0, z0, x1, z1]);
  for (const u0 of ARCHES) archedDoorway(g, F, u0, 1);
  pediment(g, F);
  pedimentRelief(g, { x0, z: 1 });
}
