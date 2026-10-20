// Monorail (plan.md "Monorail"): the two light-grey beams the full length of the plot, seven T-pylons under them, and the
// white-and-red train on beam E inside the building under the bridge lobe. Writes only into air; the corridor
// (x43..51, y8..17) is this part's own, so nothing else may stand there.
import { beamRun, monorailTrain, tPylon } from "../vocab.mjs";

// Pylon z's from plan.md (each pylon is 2 deep: z..z+1)
const PYLON_Z = [5, 29, 53, 77, 101, 125, 147];

export function build(g) {
  // Beam W x44..45 and beam E x48..49 (gap x46..47 between), y9..10, z0..152
  beamRun(g, { x0: 44, x1: 49, z0: 0, z1: 152, y: 9, h: 2 });

  // Seven T-pylons: column x46..47 y1..7 with the polished_andesite cap x43..50 at y8
  for (const z of PYLON_Z) tPylon(g, { x: 46, z });

  // The train on beam E: x47..50, y9..16, z70..87 (under the bridge lobe; the z77..78 pylon stands below it)
  monorailTrain(g, { x0: 47, y0: 9, z0: 70, z1: 87 });
}
