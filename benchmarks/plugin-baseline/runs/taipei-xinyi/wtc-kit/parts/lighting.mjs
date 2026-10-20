// Dusk lighting (all plots): sea_lantern roof lights on a 12-block grid over every roof and terrace, so no roof is dark.
// Each light stands on the deck's top cell (roof_light's support), centred in its box so the grid is even.
// Window backing is NOT placed here: the shells already filled every backing cell with black_concrete, and runParts
// refuses a later part's write into an earlier part's cell, so the lit/dark scatter needs the shells to leave those
// cells as air (plan Notes). Street lamps only stand on the hall's porch forecourt: the rest of the Xinyi Road frontage
// lies off the site grid.
import { readFileSync } from "node:fs";
import { roof_light, lamp_post } from "../vocab/h2.mjs";

const GRID = 12;

// [x0, z0, x1, z1, deckY]: a roof or terrace box and the y of its top surface (lights go at deckY + 1)
const DECKS = [
  // plot 0: International Trade Building
  [0, 0, 89, 91, 4],          // plaza
  [22, 12, 59, 19, 15],       // lobby podium
  [18, 20, 67, 69, 182],      // shaft top under the crown
  [20, 22, 65, 67, 190],      // crown step 1
  [24, 26, 61, 63, 197],      // crown step 2
  [34, 36, 51, 53, 202],      // penthouse
  // plot 1: TWTC Exhibition Hall 1
  [156, 35, 365, 258, 40],    // main hall deck
  [212, 0, 372, 34, 36],      // north block
  [163, 259, 365, 265, 24],   // arcade canopy
  [240, 259, 281, 272, 26],   // entrance porch
  [135, 35, 155, 258, 12],    // west fringe bays
  [366, 35, 386, 258, 12],    // east fringe bays
  // plot 2: Grand Hyatt Taipei
  [403, 16, 554, 100, 24],    // podium terrace
  [418, 48, 429, 70, 103],    // west step 1
  [408, 52, 417, 66, 87],     // west step 2
  [531, 48, 542, 70, 103],    // east step 1
  [543, 52, 552, 66, 87],     // east step 2
  [460, 52, 500, 66, 123],    // penthouse
  [450, 101, 510, 112, 16],   // porte-cochere canopy
  [391, 44, 402, 67, 14],     // west wing
  [555, 16, 566, 115, 10],    // south-east terrace wall
  [455, 0, 514, 7, 9],        // north pavilion
  // plot 3: TICC
  [598, 32, 713, 95, 6],      // terrace
  [600, 32, 703, 95, 61],     // roof slab
  [606, 38, 697, 89, 67],     // attic
  [638, 0, 689, 31, 28],      // north annex
  [582, 56, 597, 95, 18],     // west wing
  [610, 96, 713, 111, 16],    // south wing
];

// n grid positions at spacing GRID across [a, b], centred in the span (every position inside a..b)
function spread(a, b) {
  const n = Math.floor((b - a) / GRID) + 1;
  const start = a + Math.floor((b - a - (n - 1) * GRID) / 2);
  return Array.from({ length: n }, (_, i) => start + i * GRID);
}

// lamp posts on the hall's south forecourt (z 268): only where the site footprint is solid, standing on its ground
const LAMP_Z = 268, LAMP_X = [244, 256, 268, 280];
function forecourtLamps(g) {
  const plot = JSON.parse(readFileSync(new URL("../site.json", import.meta.url), "utf8")).plots[1];
  let lamps = 0;
  for (const x of LAMP_X) {
    const r = Math.floor(LAMP_Z / plot.cell), c = Math.floor((x - plot.x0) / plot.cell);
    const h = plot.ground[r]?.[c] || 0;
    if (plot.footprint[r]?.[c] !== "#" || !h) continue;
    if (lamp_post(g, x, h, LAMP_Z).ok) lamps++;
  }
  return lamps;
}

export function build(g) {
  let placed = 0, skipped = 0;
  for (const [x0, z0, x1, z1, deckY] of DECKS) {
    for (const x of spread(x0, x1)) for (const z of spread(z0, z1)) {
      const r = roof_light(g, x, deckY + 1, z);
      if (r.ok) placed++; else skipped++;
    }
  }
  console.log(`lighting: ${placed} roof lights placed, ${skipped} grid cells skipped (blocked or unsupported)`);
  console.log(`lighting: ${forecourtLamps(g)} forecourt lamp posts placed`);
}
