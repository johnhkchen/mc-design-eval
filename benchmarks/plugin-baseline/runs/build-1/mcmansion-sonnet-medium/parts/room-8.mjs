// Room: Garage (interior designer). Inner air x2..16, y1..4, z8..17; entered from the three carriage doors (z=7)
// and the mudroom door (15,1..2,18). The three car bays (x3..6, x8..11, x13..16, z8..13) stay clear as parking floor;
// the working side is the back row (z16..17): a workbench under a pegboard wall, shelving on the west wall, and
// hanging lanterns over the bench and the bays. Nothing sits over the carriage doors or the west window (x1, z12..13).
import { B } from "../vocab.mjs";

export function build(g) {
  // ---- shelving on the west wall, z8..11: oak posts with flower pots as paint and supply tins ----
  for (let z = 8; z <= 11; z++) {
    g.set(2, 1, z, "oak_planks");
    g.set(2, 2, z, "oak_planks");
    g.set(2, 3, z, "flower_pot");
  }

  // ---- workbench (focal piece): stone-brick base, oak top, along the back row x3..6, z16..17 ----
  for (let x = 3; x <= 6; x++) {
    for (let z = 16; z <= 17; z++) {
      g.set(x, 1, z, "stone_bricks");
      g.set(x, 2, z, "oak_planks");
    }
  }
  g.set(3, 3, 17, "iron_bars");                 // bench vise
  g.set(6, 3, 16, "cauldron");                  // paint and solvent tins
  g.set(5, 3, 17, "flower_pot");                // rag tin

  // ---- pegboard on the west wall beside the bench, z14..17 (tools hang on the bars) ----
  for (let z = 14; z <= 17; z++) {
    g.set(2, 2, z, "iron_bars");
    g.set(2, 3, z, "iron_bars");
  }

  // ---- hanging lanterns: over the bench, over the middle bay, over the bay at the east, and at the mudroom door ----
  const lanterns = [[4, 16], [9, 10], [14, 10], [14, 15]];
  for (const [x, z] of lanterns) {
    g.set(x, 4, z, ...B.chain("y"));
    g.set(x, 3, z, ...B.lantern(true));
  }

  // ---- standing lanterns on the floor in the dividers between the bays, lighting the dim bay corners ----
  for (const [x, z] of [[7, 12], [12, 12]]) g.set(x, 1, z, ...B.lantern(false));
}
