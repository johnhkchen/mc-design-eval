// Part 6: Chimney, dormers and details. Stone chimney shaft with its cap and pots (element 14), the three gabled dormers
// (element 5), hip finials on the flat roof decks, and two planters on the back deck. Builds only into air: the roof
// holes P2 leaves for the chimney and dormers are the cells it fills.
import { chimney, dormer, LIGHTNING_ROD, DORMERS } from "../vocab.mjs";

// Hip finials: a lightning rod on the centre of each flat hip deck (garage deck x2..16 z7..20, main deck x20..41 z9..26).
const HIP_FINIALS = [[9, 14, 13], [30, 14, 17]];

// Deck planters: a rose bush and a peony, two-block plants on the deck planks at y2..3, clear of the rails.
const PLANTERS = [
  { block: "rose_bush", x: 31, z: 29 },
  { block: "peony", x: 41, z: 29 },
];

export function build(g) {
  // Chimney shaft x40..42 z24..26, y2..13 in stone brick, y14 cap with the two pots at (40,25) and (42,25).
  chimney(g);

  // Gabled dormers: two on the street slope, one on the rear slope (dz -1 walks back toward the rear wall).
  for (const d of DORMERS) dormer(g, d.x, d.z, d.dz, d.depth);

  for (const [x, y, z] of HIP_FINIALS) g.set(x, y, z, LIGHTNING_ROD, { facing: "up", powered: "false" });

  for (const p of PLANTERS) {
    g.set(p.x, 2, p.z, p.block, { half: "lower" });
    g.set(p.x, 3, p.z, p.block, { half: "upper" });
  }
}
