// Part 7: Roof gardens and grounds. Gardens on the W2 wing roof (top y41), the N1 50th St podium roof (top y11) and the
// LC light court (top y12); the 49th St forecourt (FC) paving and its lamp posts. A bed's base is the course above its roof
// (the roof's top block is the course below). Where no earlier part left a deck under a bed, a smooth_stone deck is laid
// there, so nothing floats; where a wing or the massing already built one, it is left alone.
import { gardenBed, paving, lampPost, groundLevel, inLot } from "../vocab.mjs";

// [x0, z0, x1, z1] and the base y (roof top + 1)
const W2 = 41, N1 = 11;
const BEDS = [
  // W2 central wing: four patches (plan E18)
  { rect: [28, 8, 39, 19], y: W2 + 1 },
  { rect: [60, 44, 79, 49], y: W2 + 1 },
  { rect: [28, 20, 43, 27], y: W2 + 1 },
  // N1 50th St podium: one 8-wide bed every 12 blocks, none under the north marquee (x68..79, y12..15)
  ...[22, 34, 46, 58, 82, 94, 106, 118, 130].map((x0) => ({ rect: [x0, 0, x0 + 7, 3], y: N1 + 1 })),
  // LC light court (x60..67 z36..39, y12) is NOT built here: it lies inside the tower's hollow mass, its garden deck
  // touches nothing and floats (check: FLOATING 80 cells 60,12,36 -> 67,14,39). The tower/lobby part must own the court.
];

// FC paving at each cell's ground skin (walk level - 1; y0 where the forecourt is at grade), and posts at the walk line.
const FC = [[8, 48, 23, 51], [8, 52, 15, 53]];
const POSTS = [[8, 51], [23, 51], [8, 53], [15, 53]];

export function build(g) {
  for (const { rect: [x0, z0, x1, z1], y } of BEDS) {
    // a deck under the bed wherever the earlier parts left air
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      if (inLot(x, z) && g.isAir(x, y - 1, z)) g.set(x, y - 1, z, "smooth_stone");
    }
    gardenBed(g, [x0, z0, x1, z1], y);
  }
  for (const [x0, z0, x1, z1] of FC) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      if (!inLot(x, z)) continue;
      paving(g, [x, z, x, z], Math.max(groundLevel(x, z) - 1, 0), { over: true });
    }
  }
  for (const [x, z] of POSTS) lampPost(g, x, Math.max(groundLevel(x, z), 1), z);
}
