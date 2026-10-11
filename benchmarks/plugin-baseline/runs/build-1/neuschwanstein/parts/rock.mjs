// The crag: grey rock heightfield under the whole castle, terraces with stone-brick retaining walls on the cliff edge,
// an approach causeway to the gate, and a few spruces on the lower slopes.
import { hash, B, tree, boulder } from "./shared.mjs";
const rects = [
  // [x0,z0,x1,z1, top y]
  [38, 5, 72, 14, 10], [20, 8, 90, 30, 10],
  [6, 28, 106, 49, 16],
];
export const LOWER = 10, UPPER = 16;
function dist(x, z) {
  let best = { d: 1e9, top: 0 };
  for (const [x0, z0, x1, z1, top] of rects) {
    const d = Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));
    if (d < best.d - 1e-6 || (d === best.d && top > best.top)) best = { d, top };
  }
  return best;
}
export function terrainHeight(x, z) {
  const { d, top } = dist(x, z);
  if (d === 0) return top;
  const n = (hash(x >> 1, z >> 1, 7) - 0.5) * 4 + (hash(x, z, 3) - 0.5) * 1.5;
  const h = top - 3.5 - d * 1.5 - Math.max(0, n) * Math.min(1, d / 3) + n * 0.3;
  return Math.max(1, Math.round(h));
}
const MIX = ["stone", "stone", "andesite", "stone", "cobblestone", "tuff", "andesite", "mossy_cobblestone", "stone", "gravel"];
export function rock(g) {
  const [W, , D] = g.size;
  const H = (x, z) => terrainHeight(Math.min(W - 1, Math.max(0, x)), Math.min(D - 1, Math.max(0, z)));
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const h = H(x, z), { d } = dist(x, z);
    const low = Math.min(H(x - 1, z), H(x + 1, z), H(x, z - 1), H(x, z + 1));
    const slope = Math.max(Math.abs(H(x - 1, z) - h), Math.abs(H(x + 1, z) - h), Math.abs(H(x, z - 1) - h), Math.abs(H(x, z + 1) - h));
    for (let y = 0; y <= h; y++) {
      const top = y >= h - 1;
      let b;
      if (d === 0 && y > low && low < h - 2) b = hash(x, y, z) < 0.12 ? "cracked_stone_bricks" : hash(x, y, z + 3) < 0.1 ? "mossy_stone_bricks" : "stone_bricks";   // retaining wall on the cliff edge
      else if (top && d > 0) b = MIX[Math.floor(hash(x, z, y + 11) * MIX.length)];
      else if (top) b = "stone";
      else b = hash(x, z, y) < 0.25 ? "andesite" : hash(x, z, y + 5) < 0.12 ? "tuff" : "stone";
      if (top && d > 0 && slope <= 1 && h < 9 && hash(x, z, 99) < 0.12) b = "mossy_cobblestone";
      g.set(x, y, z, b);
    }
  }
}
/** Approach causeway of stone-brick stairs to the gate, and spruces on the lower slopes. */
export function approach(g) {
  for (let i = 0; i <= 5; i++) {
    const z = 5 - i, y = 10 - i;
    for (let x = 52; x <= 58; x++) {
      for (let yy = 0; yy < y; yy++) g.set(x, yy, z, yy < y - 2 ? "stone" : "stone_bricks");
      g.set(x, y, z, ...B.stairs("stone_brick", "south"));
    }
    for (const x of [51, 59]) { g.set(x, y, z, "stone_bricks"); g.set(x, y + 1, z, ...B.wall("stone_brick")); }
  }
}
export function trees(g) {
  let n = 0;
  for (let x = 2; x < 110; x += 3) for (let z = 1; z < 51; z += 3) {
    const { d } = dist(x, z), h = terrainHeight(x, z);
    if (d < 2 || d > 12 || h < 2 || h > 9 || hash(x, z, 31) > 0.33) continue;
    if (x > 49 && x < 61 && z < 9) continue;
    const sz = 0.9 + hash(x, z, 8) * 0.7;
    g.set(x, h, z, "mossy_cobblestone");
    tree(g, [x, h + 1, z], "spruce", sz, x * 31 + z); n++;
  }
  return n;
}
/** Rock pinnacles and outcrops on the crag flanks, so the ridge reads steep and ragged. */
export function outcrops(g) {
  const spots = [[11, 8, 13, 6, 9, 5], [101, 8, 13, 6, 10, 5], [29, 5, 3, 4, 5, 3], [82, 5, 3, 4, 5, 3], [20, 6, 40, 3, 9, 6], [96, 5, 4, 3, 7, 3], [4, 9, 36, 3, 8, 5], [108, 9, 38, 3, 8, 5], [8, 6, 22, 4, 6, 4], [104, 6, 22, 4, 6, 4], [56, 3, 1, 5, 3, 2], [25, 8, 51, 5, 6, 2], [90, 8, 51, 6, 6, 2]];
  spots.forEach(([x, y, z, rx, ry, rz], i) => boulder(g, [x, y, z], [rx, ry, rz], { amount: 0.45, moss: 0, seed: i + 2 }));
}
