// Crown and spire (P5): stepped roof, drum band, dome and spire. plan.md ROOFS: saucer roof steps y223..226 (discs r22/20/18/16,
// each outer ring smooth_quartz_stairs facing inward), drum disc r12 at y227 with the orange band at y228..229, a shallow
// smooth_quartz dome base y230 apex y235, and the spire on the axis: white_concrete y236..239, end_rods y240..257, sea
// lantern y258. Everything is written into air only (earlier parts' cells are refused, never overwritten).
import { roofStep, drumBand, spire } from "../vocab.mjs";
import { exposedLamps } from "./lamps.mjs";
import { dome } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const CENTRE = [32, 32];

export function build(g) {
  // Stepped saucer roof: each level one block higher-stepped inward (r 22 -> 16).
  for (const [y, r] of [[223, 22], [224, 20], [225, 18], [226, 16]]) roofStep(g, y, r, { centre: CENTRE });

  // Drum: white floor disc r12 at y227, orange band y228..229.
  drumBand(g, CENTRE[0], CENTRE[1], 227, 12);

  // Shallow dome on the drum: base y230, apex y235 (the brush's height counts its base layer, so 6 layers: 230..235).
  dome(g, { center: [CENTRE[0], 230, CENTRE[1]], radius: 12, height: 6, profile: "shallow", block: "smooth_quartz", edge: "stairs" });

  // Hidden lamps in the exposed flats of the roof steps and the dome (every 5 cells), so no roof top is dark.
  exposedLamps(g, [8, 223, 8], [56, 235, 56], { step: 5 });

  // Spire on the axis: white_concrete base y236..239, end rods up to y257, sea lantern tip y258.
  spire(g, { axis: CENTRE, base: 236, top: 258 });
}
