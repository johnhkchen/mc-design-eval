// Plot 1 Sky Tower crown: observatory (The Sky Taipei) y344..371 with its rib cage to y376, stepped glass hip y372..384,
// mast y385..396 and the red aircraft light y397..398. Plot-local coordinates (plan.md).
import { observatory, glassHip, mast, aircraftLight } from "../vocab.mjs";

const OBS = { x0: 4, x1: 52, y0: 344, y1: 371, z0: 69, z1: 118 };
const HIP_TOP = { x0: 6, x1: 50, y0: 372, y1: 372, z0: 71, z1: 116 };
const HIP_BOTTOM = { x0: 18, x1: 38, y0: 384, y1: 384, z0: 83, z1: 104 };
const MAST = [28, 385, 93];
const LAMP = [28, 397, 93];

export function build(g) {
  // ---- observatory: decks y344 / y358, ceiling lights y357 / y371, glass inside the ring, rib cage to y376
  observatory(g, OBS);

  // ---- glass hip: 13 courses y372..384, stepping in 1 per course from the observatory ring to the mast plate
  glassHip(g, HIP_TOP, HIP_BOTTOM, 372, 384);

  // ---- bridge: the hip's first course starts 2 in from the rib cage, so a one-cell glass ring at y372 (x5/x51, z70/z117)
  // ties the roof to the observatory's inner glass, which is face-connected to the shell. Air only.
  for (let x = OBS.x0 + 1; x <= OBS.x1 - 1; x++) {
    for (let z = OBS.z0 + 1; z <= OBS.z1 - 1; z++) {
      const ring = x === OBS.x0 + 1 || x === OBS.x1 - 1 || z === OBS.z0 + 1 || z === OBS.z1 - 1;
      if (ring && g.isAir(x, 372, z)) g.set(x, 372, z, "white_stained_glass");
    }
  }

  // ---- mast on the hip's top plate, then the red aircraft light on the rod
  mast(g, MAST);
  aircraftLight(g, LAMP);
}
