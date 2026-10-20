// Part 1: Massing and shell. The union of the plan's boxes as a voxel set: a sealed 1-thick inner wall (layer -3, 4th cell in
// from the exterior) and a roof course for the deep interior, so the facade parts own layers 0..-2 and the ledge decks own
// the outer ring of every roof. Lobby/shop floors are the ground itself (solid to walk level).
import { LIMESTONE, inLot, groundLevel, CAP_Y } from "../vocab.mjs";

const T = [ // x0,x1,z0,z1,top
  [56,131,16,39,216],[60,131,16,39,222],[76,123,16,39,224],[76,119,18,37,228],[80,135,24,31,232],
  [68,111,12,43,212],[68,111,14,41,218],[112,119,12,43,196],[120,127,12,43,153],[128,131,12,43,110],
  [132,139,12,15,41],[132,139,40,43,41],[132,139,16,39,202],[132,143,24,31,209],[140,143,16,39,163],
  [144,145,16,39,113],[144,145,24,31,170],[140,145,12,15,11],[140,145,40,43,11],
  [0,23,4,47,58],[4,19,8,43,63],[8,15,16,39,66],[24,87,4,51,41],[44,55,8,39,45],[28,35,32,47,50],
  [88,111,4,11,36],[88,111,44,51,36],[112,131,4,11,23],[112,131,44,51,23],[132,143,4,11,10],[132,143,44,51,10],
  [20,143,0,3,11],[68,79,0,3,15],[0,7,48,53,12],[60,67,36,39,12],
];
const W = 146, D = 54;

export function build(g) {
  const H = Array.from({ length: W }, () => new Array(D).fill(-1));
  for (const [x0, x1, z0, z1, top] of T)
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++)
      if (inLot(x, z) && top > H[x][z]) H[x][z] = top;
  const occ = (x, y, z) => x >= 0 && z >= 0 && x < W && z < D && y <= H[x][z];
  const depth = (x, y, z) => { // cells to the nearest exterior, horizontally (face cell = 1)
    let best = 99;
    for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      let n = 1; while (n < 6 && occ(x + dx * n, y, z + dz * n)) n++;
      if (n < best) best = n;
    }
    return best;
  };
  const reserved = (x, y, z) => x >= 144 && z >= 20 && z <= 35 && y >= 3 && y <= 27;
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const top = H[x][z]; if (top < 0) continue;
    const y0 = groundLevel(x, z);
    for (let y = y0; y <= Math.min(top, CAP_Y); y++) {
      if (reserved(x, y, z)) continue;
      const d = depth(x, y, z);
      if (d === 4 && y < top) g.set(x, y, z, LIMESTONE);
      else if (d >= 5 && y === top) g.set(x, y, z, LIMESTONE);
      else if (d >= 5 && y === y0 && y0 > 0) g.set(x, y, z, "smooth_stone"); // floor
    }
  }
  // thin or shallow cells (narrow boxes under 8 across) get no inner wall; give them a roof at their top so they are sealed
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const top = H[x][z]; if (top < 0 || top > CAP_Y) continue;
    if (depth(x, top, z) <= 3) continue;
  }
  // east entrance: backing wall x143 and reveals z19, z36
  for (let y = 3; y <= 27; y++) {
    for (let z = 20; z <= 35; z++) g.set(143, y, z, LIMESTONE);
    for (const z of [19, 36]) for (const x of [144, 145]) g.set(x, y, z, LIMESTONE);
  }
}
