// Part 1: massing and shell. Plinth (polished_andesite y0..1, so y2 stays the ground-storey sill row for the facade part),
// and a hollow black_concrete core wall 4 cells in from every exposed face (depth 4), leaving depths 0..3 free for the
// facade skin (face, glass at 1-2, lights at 3). Roof decks (y 62/67/15) are the roof part's.
import { SIZE, plinth, blackConcrete } from "../vocab.mjs";

// [id, x0, x1, z0, z1, top(parapet)]; masses taller win the shared cells
const M = [
  ["M2", 81, 125, 27, 35, 17], ["M3", 45, 105, 36, 54, 64], ["T1", 27, 44, 36, 62, 69], ["T2", 106, 125, 36, 54, 69],
  ["M4", 36, 55, 63, 116, 64], ["M4a", 36, 44, 55, 62, 69], ["M5", 106, 125, 55, 116, 64], ["M6", 45, 179, 117, 134, 64],
  ["T3", 27, 44, 117, 152, 69], ["T3a", 18, 26, 126, 134, 64], ["T4", 180, 197, 117, 152, 69], ["M7", 63, 134, 135, 242, 69],
  ["M8", 18, 62, 162, 215, 64], ["M9", 135, 179, 162, 215, 64], ["T5", 180, 197, 162, 215, 69], ["M10", 45, 179, 233, 251, 64],
  ["T6", 27, 44, 225, 251, 69], ["T6a", 18, 26, 243, 251, 64], ["T7", 180, 197, 225, 251, 69], ["T7a", 198, 202, 243, 251, 64],
  ["M11", 36, 55, 252, 314, 64], ["M12", 106, 125, 252, 314, 64], ["M13", 45, 105, 315, 332, 64], ["T8", 27, 44, 315, 332, 69],
  ["T9", 106, 125, 315, 332, 69], ["M14a", 72, 125, 333, 341, 17], ["M14b", 81, 125, 342, 350, 17],
];
const SPURS = [["M1", 81, 89, 0, 26, 12], ["M15", 81, 89, 351, 374, 12]];
// openings the core wall must not close: [x0,y0,z0,x1,y1,z1]
const OPEN = [
  [18, 2, 176, 30, 12, 201],            // entrance hall
  [49, 2, 84, 61, 4, 85], [100, 2, 84, 112, 4, 85], [49, 2, 282, 61, 4, 283], [100, 2, 282, 112, 4, 283], // court doors
  [187, 2, 186, 197, 5, 191],           // east entry
  [100, 2, 346, 105, 5, 350], [100, 2, 27, 105, 5, 31], // podium entrances
];
const inOpen = (x, y, z) => OPEN.some(([a, b, c, d, e, f]) => x >= a && x <= d && y >= b && y <= e && z >= c && z <= f);

export function build(g) {
  const W = SIZE[0], D = SIZE[2];
  const H = Array.from({ length: W }, () => new Int16Array(D));
  for (const [, x0, x1, z0, z1, top] of M)
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (top > H[x][z]) H[x][z] = top;

  // plinth under every mass (replaces the ground it stands on), spurs only y0 (their floor is y1)
  for (const [, x0, x1, z0, z1] of M) plinth(g, [x0, 0, z0, x1, 1, z1], { replace: true });
  for (const [, x0, x1, z0, z1] of SPURS) plinth(g, [x0, 0, z0, x1, 0, z1], { replace: true });

  // core wall: cells whose Manhattan distance to the nearest non-solid cell is exactly 4, per height tier
  const tops = [...new Set(M.map((m) => m[5]))].sort((a, b) => a - b);
  let prev = 1;
  for (const top of tops) {
    const wallTop = top - 3;       // deck is top-2, the roof part owns it
    const lo = prev + 1;
    prev = wallTop;
    const solid = (x, z) => x >= 0 && z >= 0 && x < W && z < D && H[x][z] >= top;
    const dist = Array.from({ length: W }, () => new Int16Array(D));
    const INF = 99;
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
      if (!solid(x, z)) { dist[x][z] = 0; continue; }
      let d = INF;
      if (x > 0) d = Math.min(d, dist[x - 1][z] + 1); else d = 1;
      if (z > 0) d = Math.min(d, dist[x][z - 1] + 1); else d = 1;
      dist[x][z] = d;
    }
    for (let x = W - 1; x >= 0; x--) for (let z = D - 1; z >= 0; z--) {
      if (!solid(x, z)) continue;
      let d = dist[x][z];
      d = Math.min(d, x < W - 1 ? dist[x + 1][z] + 1 : 1, z < D - 1 ? dist[x][z + 1] + 1 : 1);
      dist[x][z] = d;
    }
    // the tier's wall spans y lo..wallTop only for cells whose own height is this tier (taller cells are done in their tier)
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
      if (!solid(x, z) || dist[x][z] !== 5) continue;   // dist 1 = face cell, so 5 = depth 4
      const own = H[x][z];
      const y1 = Math.min(wallTop, own - 3);
      for (let y = lo; y <= y1; y++) if (!inOpen(x, y, z)) g.set(x, y, z, blackConcrete);
    }
  }
}
