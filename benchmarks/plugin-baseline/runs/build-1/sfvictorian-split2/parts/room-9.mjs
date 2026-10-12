// Front bedroom (P-room 9, plan.md ROOMS 2nd floor): inner air x2..10 y9..11 z8..15, plus the bay alcove z6 x2..5.
// Master bedroom over the parlour. The double bed (blue_bed) lies head-to-the-west wall, with barrel nightstands
// and lantern bedside lamps; a white carpet rug sits on the spruce floor; a wardrobe backs the south partition; a
// dark_oak writing desk with a chair faces the front window; the bay alcove is a window seat with a blue cushion.
// Lanterns hang from the y12 ceiling so every floor cell is lit. Door (11,9..10,15) and the front window (9,9..11,7)
// are left clear. Curtains are not built: carpet cannot hang on a wall in the palette.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bed, nightstand, wardrobe, desk, chair, rug, BLUE_CARPET } from "../vocab.mjs";

export function build(g) {
  // Double bed: head at (2,9,11) against the west wall, foot at (3,9,11).
  bed(g, 3, 9, 11, "blue", "west");

  // Nightstands either side of the headboard, each with a standing lantern as the bedside lamp.
  nightstand(g, 2, 9, 10);
  nightstand(g, 2, 9, 12);
  g.set(2, 10, 10, ...B.lantern(false));
  g.set(2, 10, 12, ...B.lantern(false));

  // Rug of white carpet across the middle of the floor, between the bed and the desk.
  rug(g, 4, 8, 9, 10, 13, "white");

  // Wardrobe on the south partition (z15), two cells along x, with its barrels and dark_oak trapdoors.
  wardrobe(g, 7, 9, 15, "north");

  // Writing desk in front of the front window (x9, z9..10) with a dark_oak chair on the south side facing it.
  desk(g, 9, 9, 9, 2, "z");
  chair(g, 9, 9, 11, "north");
  g.set(9, 11, 9, ...B.lantern(false));   // desk lamp, standing on the slab top

  // Bay alcove (z6): a birch_slab window seat with a blue carpet cushion under the bay glass.
  for (let x = 2; x <= 3; x++) {
    g.set(x, 9, 6, ...B.slab("birch", "bottom"));
    g.set(x, 10, 6, BLUE_CARPET);
  }

  // Hanging lanterns from the y12 ceiling: one over the bed, one over the rug, one over the alcove.
  g.set(3, 11, 11, ...B.lantern(true));
  g.set(6, 11, 13, ...B.lantern(true));
  g.set(4, 11, 6, ...B.lantern(true));
}
