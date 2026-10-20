// Deck lamps, pier and fender lanterns, walkway lamps (plan.md Lighting). Every position comes from vocab/base.mjs.
// Plot 1's deck lamps are drawn at the plot's grid origin (PLOT_X.deck); plot 0 positions are already absolute.
import { deckLamp, lanternAt, PLOT_X, DECK_LAMP_X, DECK_LAMP_Z, WALKWAY_LAMPS, PIER_LANTERNS, FENDER_LANTERNS } from "../vocab.mjs";

export function build(g) {
  // plot 1: one lamp pair at z 8 (the deck section repeats every 16 along z, so the pair repeats with it)
  for (const x of DECK_LAMP_X) deckLamp(g, PLOT_X.deck + x, DECK_LAMP_Z);
  // plot 1 seam: the pair at z 8 leaves the road centre dark at z 15..16 (the tile join, mobs spawn there), so one
  // standing lantern on the sidewalk at x 2, z 15 of every tile lights it (plan.md Notes)
  lanternAt(g, PLOT_X.deck + 2, 39, 15);

  // plot 0: walkway lamps on the cantilevered walkways (standing on the platform at y 38)
  for (const [x, z] of WALKWAY_LAMPS) deckLamp(g, x, z);

  // plot 0: lanterns standing on the pier top (y 5) and the fender top (y 3)
  for (const [x, z] of PIER_LANTERNS) lanternAt(g, x, 6, z);
  for (const [x, z] of FENDER_LANTERNS) lanternAt(g, x, 4, z);
}
