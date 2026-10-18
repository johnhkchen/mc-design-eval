// Planters, figures, niches (plan.md PARTS 5): the two open planter boxes on plots 1 and 2 with their four weeping figures
// each, the closing pier's parapet and its two niches, and the walkway's hanging lanterns. Figures go before their box:
// a figure's arm cell sits on the box corner, and planterBox only writes into air, so the arm stays as the corner block.
// Niches are carved by not placing (plan.md RESERVED); the pier body belongs to the peristyle part, which must skip them.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { planterBox, weepingFigure, niche } from "../vocab.mjs";

// The four weeping figures of one box: each stands on the cornice deck just off a box corner and leans toward it.
const FIGURES_PLOT1 = [
  [66, 3, "se"], [77, 3, "sw"], [66, 14, "ne"], [77, 14, "nw"],
];
const FIGURES_PLOT2 = [
  [90, 3, "sw"], [90, 14, "nw"], [80, 3, "se"], [80, 14, "ne"],
];

export function build(g) {
  // Figures first, then the boxes (see the header).
  for (const [x, z, arm] of [...FIGURES_PLOT1, ...FIGURES_PLOT2]) weepingFigure(g, x, z, arm);

  // Planter boxes: outer x 67..76 (plot 1) and x 80..89 (plot 2), z 4..13, floor y 25.
  planterBox(g, 67, 76, 4, 13, { y: 25 });
  planterBox(g, 80, 89, 4, 13, { y: 25 });

  // Closing pier parapet east of the plot 2 box (x 91..94, z 3..14), capped with a bottom cut slab at y 27.
  for (let x = 91; x <= 94; x++) for (let z = 3; z <= 14; z++) {
    for (let y = 25; y <= 26; y++) g.set(x, y, z, "smooth_sandstone");
    g.set(x, 27, z, ...B.slab("cut_sandstone", "bottom"));
  }

  // End-pier niches (carved 2 deep, the sill at y 3, a lantern standing on it).
  niche(g, "north", [91, 3, 2, 93, 12, 3]);
  niche(g, "east", [93, 3, 7, 94, 12, 9]);

  // Hanging lanterns under the peristyle soffit (y 21) at the walkway centre and the bay seams.
  for (const [x, z] of [[71, 8], [64, 9], [80, 9]]) g.set(x, 20, z, ...B.lantern(true));
}
