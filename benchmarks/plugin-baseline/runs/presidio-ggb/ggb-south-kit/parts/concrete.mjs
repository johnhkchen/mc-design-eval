// Plot 1 pylons and anchorage: the S1/S2 Art Deco pylon pairs, their cross beams, the south anchorage (solid body with
// recessed panels on its west, east and south faces), the main cable housings z72..80 and the anchorage deck piers with
// their cap beams. Plan coordinates (x east, z south, y up); y 0 is the water and stays empty.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { pylon, crossBeam, anchoragePanel, cableHousing, deckPier } from "../vocab.mjs";

// main cable height at each housing row (plan.md, cable y at x 8 / x 22); z 80 meets the anchorage top at y 14
const CABLE = [[72, 34], [73, 31], [74, 29], [75, 26], [76, 24], [77, 21], [78, 19], [79, 16], [80, 14]];

export function build(g) {
  // pylon pairs: west x 1..7 and east x 23..29, S1 at z 6..14 and S2 at z 63..71, from y 1 to y 42
  for (const z of [6, 63]) {
    pylon(g, 1, 1, z);
    pylon(g, 23, 1, z, { outer: "east" });
  }

  // cross beams that carry the deck between each pylon pair
  crossBeam(g, 8, 12, { x0: 8, x1: 22, y0: 26, y1: 29 });
  crossBeam(g, 65, 69, { x0: 8, x1: 22, y0: 26, y1: 29 });

  // south anchorage: x 0..30, z 72..112, cut-stone base y 1..2, body, cornice y 12, top y 13, bottom slab y 14
  g.fill([0, 1, 72], [30, 2, 112], "cut_sandstone");
  g.fill([0, 3, 72], [30, 11, 112], "smooth_sandstone");
  g.fill([0, 12, 72], [30, 12, 112], "cut_sandstone");
  g.fill([0, 13, 72], [30, 13, 112], "smooth_sandstone");
  g.fill([0, 14, 72], [30, 14, 112], ...B.slab("smooth_sandstone", "bottom"));
  // full blocks where housings and piers stand on the top course: a bottom slab cannot carry a block above it
  for (const [x0, x1] of [[7, 9], [21, 23]]) for (const [z0, z1] of [[72, 80], [88, 90], [104, 106]]) g.fill([x0, 14, z0], [x1, 14, z1], "smooth_sandstone");

  // Art Deco recessed panels (recess 1, inner recess 2 deep) cut into the body: west x 0, east x 30, south z 112
  const spansEW = [[75, 84], [87, 97], [100, 109]], innerEW = [[77, 82], [89, 95], [102, 107]];
  anchoragePanel(g, "west", 0, { spans: spansEW, inner: innerEW, y: [3, 11], innerY: [5, 9] }, { carve: true });
  anchoragePanel(g, "east", 30, { spans: spansEW, inner: innerEW, y: [3, 11], innerY: [5, 9] }, { carve: true });
  anchoragePanel(g, "south", 112, { spans: [[3, 13], [17, 27]], inner: [[5, 11], [19, 25]], y: [3, 11], innerY: [5, 9] }, { carve: true });

  // main cable housings at x 8 and x 22 (wedges x 7..9 and 21..23), collar at the z 72 mouth; over: the cable at z 80
  // replaces the anchorage's top slab, which is this part's own cell
  for (const [z, y] of CABLE) {
    cableHousing(g, 8, z, y, { collar: z === 72, over: true });
    cableHousing(g, 22, z, y, { collar: z === 72, over: true });
  }

  // anchorage deck piers (3x3, x 7..9 and 21..23, y 15..28) at z 88..90 and 104..106; each pair shares one cap beam at y 29
  deckPier(g, 7, 88, { yLo: 15, yHi: 28, cap: [7, 23] });
  deckPier(g, 21, 88, { yLo: 15, yHi: 28 });
  deckPier(g, 7, 104, { yLo: 15, yHi: 28, cap: [7, 23] });
  deckPier(g, 21, 104, { yLo: 15, yHi: 28 });
}
