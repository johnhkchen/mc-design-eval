// Room 13: Triclinium (dining room), inner air x26..34, y2..5, z23..30. Designer-owned furniture only; the floor mosaic,
// walls, ceiling and doorway/window openings are P1's. Layout: three couches in a U (W, N, E) around a central table on
// the emblem, open to the south opening (27..28, z31). Entry from the tablinum doorway (25,2..3,27) lands on (26,27);
// the W couch stops at z26 so that row stays a clear 2-high path into the room. Lamps and pots sit in the corners.
import {
  couch, table, hangLamp, lampStand, pot, DECORATED_POT,
} from "../vocab.mjs";

export function build(g) {
  // couches: red beds with dark_oak_slab rails on the wall side (rail cell = bed cell pushed back toward the wall)
  couch(g, 28, 23, "east", 4);   // W couch: beds x28, z23..26; rail x27
  couch(g, 29, 24, "south", 4);  // N couch: beds z24, x29..32; rail z23
  couch(g, 32, 25, "west", 4);   // E couch: beds x32, z25..28; rail x33

  // low table on the emblem (x29..31, z25..27); top surface at y4
  table(g, 29, 26, 3, 2);
  g.set(30, 4, 27, DECORATED_POT);

  // bronze light: one hanging lamp over the table, one over the NE corner; standing lamps flank the south opening
  hangLamp(g, 30, 29);
  hangLamp(g, 33, 23);
  lampStand(g, 26, 30);
  lampStand(g, 34, 30);

  // potted plants in the back corners
  pot(g, 26, 23, "fern");
  pot(g, 34, 23, "azalea");
}
