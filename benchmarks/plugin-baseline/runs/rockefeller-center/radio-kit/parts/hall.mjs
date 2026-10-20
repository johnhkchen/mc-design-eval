// Music Hall shell (P2, plot 1): the auditorium's stepped limestone masses, their frieze rows, decks and parapets, the
// broad hall deck with its skylight strips and vent boxes, and the stage house raised over it. Openings, marquee,
// roundels and the stage-door canopy are left to later parts.
// Ground: the sidewalk course is y0 across the site and y1 east of RAISED, so each mass stands on it: its plinth is at
// y1 on ground 0 and at y2 on ground 1 (put() never overwrites the sidewalk course).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { limestone_mass, frieze_band, setback_deck, skylight_strip, vent_box, PLOT1_RAISED_FROM, DECK_DARK, GLOWSTONE } from "../vocab.mjs";

const RAISED = PLOT1_RAISED_FROM;   // ground 1 from this x east

// Limestone on the footprint [x0, z0, x1, z1], solid up to y `top`. Split at RAISED so each span starts on its own ground.
function mass(g, [x0, z0, x1, z1], top) {
  const spans = [[x0, Math.min(x1, RAISED - 1), 1], [Math.max(x0, RAISED), x1, 2]];
  for (const [a, b, bottom] of spans) if (a <= b) limestone_mass(g, [a, bottom, z0, b, top, z1]);
}

// A stepped tier: limestone to the cut_sandstone frieze row (deck - 1), then the deck at `deck` (sea lanterns every 6)
// with its parapet one block above on the outer ring.
function tier(g, [x0, z0, x1, z1], deck) {
  mass(g, [x0, z0, x1, z1], deck - 2);
  frieze_band(g, [x0, deck - 1, z0, x1, deck - 1, z1]);
  setback_deck(g, [x0, z0, x1, z1], { y: deck, ground: DECK_DARK, lightEvery: 6 });
}

// H-E, the 50th Street front over the marquee: limestone from y11 (the marquee runs below it), frieze at y23, deck y24.
function frontTier(g) {
  limestone_mass(g, [40, 11, 50, 100, 22, 51], { plinth: false });
  frieze_band(g, [40, 23, 50, 100, 23, 51]);
  setback_deck(g, [40, 50, 100, 51], { y: 24, ground: DECK_DARK, lightEvery: 6 });
}

// H-C, the auditorium: one solid block of limestone to y30 under the broad deck at y31 (parapet y32), with the alley wall
// x38..39 z14..23 at the same height. The three skylight strips go in before the deck, since the helpers write into air
// only; their glowstone is set into the top course of the hall below them.
function hall(g) {
  mass(g, [40, 14, 100, 49], 30);
  mass(g, [38, 14, 39, 23], 30);
  for (const z0 of [22, 30, 38]) skylight_strip(g, { x0: 50, x1: 74, z0, depth: 2, y: 31, glow: false });
  for (const z0 of [22, 30, 38]) for (let x = 50; x <= 74; x++) for (const z of [z0, z0 + 1]) g.set(x, 30, z, GLOWSTONE);
  setback_deck(g, [40, 14, 100, 49], { y: 31, ground: DECK_DARK, lightEvery: 6 });
  setback_deck(g, [38, 14, 39, 23], { y: 31, ground: DECK_DARK, lightEvery: 6 });
  for (const z of [18, 44]) for (const x of [46, 58, 70, 82]) vent_box(g, { x, y: 32, z });
}

// H-D, the stage house: one block of limestone at y32 raised over the hall deck, deck at y33, parapet y34, and a
// fly-loft vent row of closed iron trapdoors on the deck along x92..93.
function stageHouse(g) {
  limestone_mass(g, [88, 32, 16, 97, 32, 39], { plinth: false });
  setback_deck(g, [88, 16, 97, 39], { y: 33, ground: DECK_DARK, lightEvery: 6 });
  for (let z = 18; z <= 36; z += 3) for (const x of [92, 93]) g.set(x, 34, z, ...B.trapdoor("iron", "north", "bottom", false));
}

export function build(g) {
  tier(g, [40, 0, 83, 3], 24);     // H-A, the 51st Street strip
  tier(g, [84, 0, 100, 3], 33);    // H-B, north band east end
  tier(g, [38, 4, 65, 13], 32);    // H-B, north band west
  tier(g, [66, 4, 100, 13], 33);   // H-B, north band east
  hall(g);                          // H-C, the auditorium and its hall deck
  stageHouse(g);                    // H-D, the stage house
  frontTier(g);                     // H-E, the 50th Street front
}
