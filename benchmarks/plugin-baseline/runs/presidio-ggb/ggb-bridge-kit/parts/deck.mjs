// Plot 1 deck section (z 0..15, tiling along z at x 48) and the plot 0 deck through the tower with its walkways.
// Lamps (deck pair at z 8, walkway lamps) belong to the lights and trim part, not here.
import { PLOT_X, TOWER_DECK_X, deckSection, walkway } from "../vocab.mjs";

export function build(g) {
  // plot 1: one full section, x 0..14 in its own frame (plot origin added), z 0..15 tiling end to end
  deckSection(g, PLOT_X.deck, 0, 15);

  // plot 0: the deck through the tower, full section at both ends of the plot, road and floor beams through the portal
  deckSection(g, TOWER_DECK_X, 0, 7);
  deckSection(g, TOWER_DECK_X, 16, 23);
  deckSection(g, TOWER_DECK_X, 8, 15, { portal: true });

  // cantilevered walkways beside each leg, with corbels and the edge girder and railing outline
  walkway(g, "west");
  walkway(g, "east");
}
