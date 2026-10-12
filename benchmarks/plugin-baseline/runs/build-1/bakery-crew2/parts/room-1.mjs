// Room part, shop (Verkaufsraum): the sales floor inside the box [7,2,10,15,5,15].
// Layout (floor grid from `mcd plan`, x 7..15, z 10..15):
//   z=10  bench (7..8) by the west window; front door approach (11,10) kept clear
//   z=11  customers' aisle, bread rack on the west wall (x=7, z=11..13)
//   z=12  the focal counter: planks with cakes, two runs (9..10, 13..14) with a gap (11..12) for the archway lane
//   z=13  staff side: open floor between the counter and the archway
//   z=14..15  flour-sack corner (13..14); stair housing (7..8) stays solid; landing (15,2,15) and archway (11..12,15) clear
// Lanterns hang from the upper floor (y=6) over the aisle; the wing lane x=15 stays open z=11..15.
import { shopCounter, breadRack, flourStore, benchRun, hangingLantern } from "../vocab.mjs";

export function build(g) {
  // the counter (focal piece), facing the door across the aisle
  shopCounter(g, 9, 10, 2, 12);
  shopCounter(g, 13, 14, 2, 12);

  // bread rack along the west wall, behind the aisle
  breadRack(g, 7, 2, 11, "z", 3);

  // small bench by the west window, sitter looks north at the street
  benchRun(g, 7, 8, 10, 2, "north");

  // flour and hay corner, south-east, clear of the wing lane (x=15) and the landing
  flourStore(g, 13, 2, 14);
  flourStore(g, 14, 2, 15);

  // hanging lanterns from the upper floor
  hangingLantern(g, 9, 5, 11);
  hangingLantern(g, 14, 5, 11);
  hangingLantern(g, 12, 5, 14);
}
