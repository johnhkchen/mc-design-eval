// Part "shells plots 0-3": walls, plinth, y3 decks and arcade piers for plots 0-3 (plan.md MASSES tables).
import { wallBox, floorDeck, WHITE_CONCRETE, SMOOTH_SANDSTONE, POLISHED_ANDESITE, STONE_BRICKS, CUT_SANDSTONE, QUARTZ_BLOCK, SMOOTH_SANDSTONE as SS } from "../vocab.mjs";

// Walls round the UNION of rects (no partition where two masses touch): every cell of the union with a
// 4-neighbour outside it is wall, y0..y1; y0 in plinth, string = [y, block] a course in another block.
function unionWalls(g, rects, y0, y1, mat, plinth, string) {
  const inU = (x, z) => rects.some(([a, b, c, d]) => x >= a && x <= c && z >= b && z <= d);
  const done = new Set();
  for (const [a, b, c, d] of rects)
    for (let x = a; x <= c; x++) for (let z = b; z <= d; z++) {
      if (done.has(x + "," + z) || !inU(x, z)) continue;
      done.add(x + "," + z);
      if (inU(x - 1, z) && inU(x + 1, z) && inU(x, z - 1) && inU(x, z + 1)) continue;
      for (let y = y0; y <= y1; y++) {
        const blk = y === y0 ? plinth : string && y === string[0] ? string[1] : mat;
        g.set(x, y, z, blk);
      }
    }
}

export function build(g) {
  // ---- plot 0 warehouse
  unionWalls(g, [[8, 2, 17, 11], [8, 12, 21, 17], [2, 18, 23, 25], [16, 26, 25, 35]], 1, 5, WHITE_CONCRETE, POLISHED_ANDESITE);
  wallBox(g, [12, 0, 15, 1], 1, 4, WHITE_CONCRETE, POLISHED_ANDESITE); // vestibule V
  const lean0 = [[4, 4, 7, 7], [6, 8, 7, 13], [18, 8, 19, 11], [4, 16, 7, 17], [0, 18, 1, 23], [24, 22, 25, 25],
    [2, 26, 9, 27], [12, 26, 15, 27], [14, 28, 15, 33], [26, 28, 27, 35], [16, 36, 23, 37]];
  for (const r of lean0) wallBox(g, r, 1, 3, WHITE_CONCRETE, POLISHED_ANDESITE);

  // ---- plot 1 army admin: A + A1 + A3 as one shell, cut_sandstone string at y3
  unionWalls(g, [[31, 4, 54, 17], [47, 0, 52, 3], [33, 18, 42, 21]], 1, 4, SMOOTH_SANDSTONE, STONE_BRICKS, [3, CUT_SANDSTONE]);
  for (const r of [[29, 6, 30, 13], [55, 12, 56, 17], [31, 18, 32, 19], [43, 18, 48, 19], [33, 22, 34, 22]])
    wallBox(g, r, 1, 2, SMOOTH_SANDSTONE, STONE_BRICKS);
  for (const [a, b, c, d] of [[32, 5, 53, 16], [48, 1, 51, 2], [34, 19, 41, 20]]) floorDeck(g, [a, b, c, d], 3);
  for (const x of [39, 42, 45, 46]) for (const z of [2, 3]) for (const y of [1, 2]) g.set(x, y, z, SS);

  // ---- plot 2 army housing: white siding, quartz band at y3
  unionWalls(g, [[57, 2, 82, 15]], 1, 4, WHITE_CONCRETE, STONE_BRICKS, [3, QUARTZ_BLOCK]);
  for (const r of [[59, 16, 82, 17], [59, 18, 68, 19]]) wallBox(g, r, 1, 2, WHITE_CONCRETE, STONE_BRICKS);
  floorDeck(g, [58, 3, 81, 14], 3);

  // ---- plot 3 storehouse
  unionWalls(g, [[86, 0, 93, 7], [86, 8, 95, 25], [88, 26, 97, 35]], 1, 3, SMOOTH_SANDSTONE, POLISHED_ANDESITE);
  for (const r of [[84, 0, 85, 5], [96, 22, 97, 25]]) wallBox(g, r, 1, 2, SMOOTH_SANDSTONE, POLISHED_ANDESITE);
}
