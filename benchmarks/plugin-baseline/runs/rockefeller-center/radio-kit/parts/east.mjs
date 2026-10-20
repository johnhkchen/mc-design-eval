// East end shell (P3, plot 2): the base E-A on the ground, then the towers and setbacks stacked on its decks.
// Order matters: the party strip E-B first, then the base, then everything that stands on the base's deck. Every
// helper writes only into air, so a later mass is refused where an earlier one stands. Ground course is y0 (sidewalk),
// walking level y1 on ground 0 (x < 127) and y2 on the raised ground (x >= 127, sidewalk at y1).
import { limestone_mass, frieze_band, setback_deck, pier_wall, garden_bed, vent_box } from "../vocab.mjs";
import { carve } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const DECK = "light_gray_concrete";
const OVER = ["smooth_sandstone"];

// A solid mass from yb to deck-2, a cut_sandstone frieze row at deck-1 and the flat deck at deck with its parapet.
function stacked(g, [x0, z0, x1, z1], { yb, deck, plinth = false }) {
  limestone_mass(g, [x0, yb, z0, x1, deck - 2, z1], { plinth });
  frieze_band(g, [x0, deck - 1, z0, x1, deck - 1, z1]);
  setback_deck(g, [x0, z0, x1, z1], { y: deck, ground: DECK });
}

// Piers and dark strips on one exposed face of a mass (phase 8 is the plot 2 storey rhythm).
function piers(g, face, at, from, to, y0, y1) {
  pier_wall(g, { face, at, from, to, y0, y1, phase: 8, over: OVER });
}

export function build(g) {
  // E-B: the party strip against the Music Hall stage, a blind wall to y33.
  limestone_mass(g, [105, 1, 0, 106, 33, 17]);
  limestone_mass(g, [105, 1, 38, 106, 33, 53]);

  // E-A: the base, 105..155 by 0..53 (the light well and the Plaza notch are cut out below). Ground 0 west of x127.
  limestone_mass(g, [105, 1, 0, 126, 16, 53]);
  limestone_mass(g, [127, 2, 0, 155, 16, 53], { plinth: true });
  frieze_band(g, [105, 17, 0, 155, 17, 53]);
  setback_deck(g, [105, 0, 155, 53], { y: 18, ground: DECK });
  carve(g, [151, 2, 16], [155, 19, 37]);      // Rockefeller Plaza forecourt, open to the street
  carve(g, [153, 2, 14], [155, 19, 15]);      // plaza bit, north
  carve(g, [153, 2, 38], [155, 19, 41]);      // plaza bit, south
  carve(g, [117, 1, 38], [126, 19, 39]);      // light well, open to the sky
  // 50th and 51st Street and the east face: shopfront storeys (y1..5), carved for the facade part.
  carve(g, [107, 1, 0], [126, 5, 0]);
  carve(g, [127, 2, 0], [154, 5, 0]);
  carve(g, [107, 1, 53], [126, 5, 53]);
  carve(g, [127, 2, 53], [154, 5, 53]);
  carve(g, [155, 2, 1], [155, 5, 12]);
  carve(g, [155, 2, 38], [155, 5, 52]);
  piers(g, "north", 0, 107, 155, 7, 16);
  piers(g, "south", 53, 107, 155, 7, 16);
  piers(g, "east", 155, 1, 12, 7, 16);
  piers(g, "east", 155, 42, 52, 7, 16);      // z38..41 is the Plaza notch, open to the sky

  // E-C: the west wing, deck 44, rising from the base at x105..124.
  stacked(g, [105, 18, 124, 37], { yb: 19, deck: 44 });
  piers(g, "north", 18, 105, 124, 20, 42);
  piers(g, "south", 37, 105, 124, 20, 42);

  // E-E: the west step, split around the light well (z38..39), deck 54.
  stacked(g, [125, 10, 126, 37], { yb: 19, deck: 54 });
  stacked(g, [125, 40, 126, 43], { yb: 19, deck: 54 });

  // E-F and E-G: the north and south setbacks, deck 51, parapet 52.
  stacked(g, [127, 4, 150, 9], { yb: 19, deck: 51 });
  stacked(g, [127, 46, 150, 51], { yb: 19, deck: 51 });
  piers(g, "north", 4, 127, 150, 20, 49);
  piers(g, "east", 150, 4, 9, 20, 49);
  piers(g, "south", 51, 127, 150, 20, 49);
  piers(g, "east", 150, 46, 51, 20, 49);

  // E-D: the tower, deck 62, parapet 63; piers run up the east face to the crown.
  stacked(g, [127, 10, 150, 45], { yb: 19, deck: 62 });
  piers(g, "north", 10, 127, 150, 53, 60);
  piers(g, "south", 45, 127, 150, 53, 60);
  piers(g, "east", 150, 16, 37, 20, 60);

  // E-D' east returns framing the recessed Plaza front, solid to y63.
  limestone_mass(g, [151, 19, 10, 152, 63, 15]);
  limestone_mass(g, [151, 19, 38, 152, 63, 45]);

  // E-H: the east crown, deck 66, parapet 67, on the tower's deck.
  stacked(g, [145, 14, 150, 43], { yb: 63, deck: 66 });

  // E-I: mechanical penthouse, y63..64, with four vent boxes on its roof.
  limestone_mass(g, [131, 63, 22, 142, 64, 33]);
  vent_box(g, { x: 133, y: 65, z: 25 });
  vent_box(g, { x: 139, y: 65, z: 25 });
  vent_box(g, { x: 133, y: 65, z: 30 });
  vent_box(g, { x: 139, y: 65, z: 30 });

  // Roof gardens: two on the base deck (y18), one on the west wing deck (y44).
  garden_bed(g, [107, 2, 125, 12], { y: 19 });
  garden_bed(g, [107, 40, 125, 52], { y: 19 });
  garden_bed(g, [107, 20, 122, 35], { y: 45 });
}
