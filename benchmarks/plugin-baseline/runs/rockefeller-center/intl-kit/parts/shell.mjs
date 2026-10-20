// Part 1, massing shell (plan.md SITE tables): a heightmap of masses per plot. Each mass is solid from the ground to its deck
// EXCEPT a 3-deep skin along every exposed face (face plane, recess -1, behind -2), left as air for the facade part's piers,
// glass and lit backs. Deck = smooth_stone course at the top y (left as AIR on garden/ledge tops 22 and 26, which the roof
// part plants); an edge parapet course at the top y and a smooth_sandstone_slab coping above it on every open edge.
import { PLOT_ORIGIN, PLOT_SIZE, onLot, groundAt, LIMESTONE, TRIM, LIMESTONE_SLAB, ROOF_DECK } from "../vocab/base.mjs";

// [x0, x1, z0, z1, topY] local boxes per plot; the max over covering boxes is a cell's top
const M0 = [
  [0, 61, 18, 37, 141], [0, 39, 12, 17, 131], [0, 39, 38, 43, 131], [40, 47, 12, 17, 104], [40, 47, 38, 43, 104],
  [48, 53, 12, 17, 58], [48, 53, 38, 43, 58], [14, 47, 22, 33, 147],
  [4, 29, 0, 3, 6], [0, 19, 4, 7, 6], [0, 23, 8, 11, 35], [0, 23, 44, 45, 35], [20, 23, 46, 47, 35],
  [30, 83, 0, 11, 22], [20, 29, 4, 11, 22], [62, 83, 12, 19, 22], [20, 83, 44, 54, 22], [62, 83, 36, 43, 22],
  [32, 81, 2, 11, 26], [22, 31, 6, 11, 26], [62, 81, 12, 17, 26],
  [62, 81, 38, 43, 26], [26, 81, 44, 49, 26], [32, 81, 50, 52, 26],
  [24, 57, 8, 11, 28], [24, 57, 44, 47, 28], [58, 62, 20, 35, 17],
];
const M12 = [
  [0, 53, 0, 18, 22], [26, 51, 2, 16, 26], [26, 33, 5, 13, 30], [0, 25, 2, 16, 33], [0, 25, 4, 14, 36],
];
const MASSES = [M0, M12, M12];

// cells the shell leaves empty (portal, lobby, entrance recess), as [x0, x1, z0, z1, y0, y1]
const RESERVED = [
  [[58, 62, 20, 35, 2, 18], [50, 59, 22, 33, 2, 16]],
  [[51, 53, 6, 12, 3, 17]],
  [[51, 53, 6, 12, 3, 17]],
];

export function build(g) {
  for (let p = 0; p < 3; p++) {
    const [ox, oz] = PLOT_ORIGIN[p], [sx, sz] = PLOT_SIZE[p];
    const top = new Int16Array(sx * sz).fill(-1);
    for (let x = 0; x < sx; x++) for (let z = 0; z < sz; z++) if (onLot(p, x, z)) top[x * sz + z] = groundAt(p, x, z);
    for (const [x0, x1, z0, z1, h] of MASSES[p])
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++)
        if (onLot(p, x, z) && top[x * sz + z] < h) top[x * sz + z] = h;
    const H = (x, z) => (x < 0 || z < 0 || x >= sx || z >= sz ? -1 : top[x * sz + z]);
    const reserved = (x, y, z) => RESERVED[p].some(([a, b, c, d, e, f]) => x >= a && x <= b && z >= c && z <= d && y >= e && y <= f);
    const put = (x, y, z, b) => { if (!reserved(x, y, z)) g.set(ox + x, y, oz + z, b); };
    const DIR = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    // is the cell within 3 of open air at height y (a neighbour cell whose top is below y)?
    const skin = (x, y, z) => {
      for (const [dx, dz] of DIR)
        for (let k = 1; k <= 3; k++) {
          if (H(x + dx * k, z + dz * k) < y) return true;
          if (H(x + dx * k, z + dz * k) < 0) return true;
        }
      return false;
    };
    // the soffit course of a lower mass runs on into a taller wall beside it (keeps the cornice ring attached)
    const soffit = (x, y, z) => DIR.some(([dx, dz]) => [1, 2, 3].some((k) => H(x + dx * k, z + dz * k) === y + 1));
    for (let x = 0; x < sx; x++)
      for (let z = 0; z < sz; z++) {
        const h = H(x, z), gr = groundAt(p, x, z);
        if (h < 0 || h <= gr) continue;
        const edge = DIR.some(([dx, dz]) => H(x + dx, z + dz) < h);
        const open = h === 22 || h === 26;   // garden/ledge tops: the roof part plants them
        for (let y = gr + 1; y < h; y++) if (y === h - 1 || soffit(x, y, z) || !skin(x, y, z)) put(x, y, z, LIMESTONE);
        // GS's north edge row (z 38) carries tree crowns at x 71..73, y 28: a full course there, not a bottom slab, so they stand on it
        const crownEdge = h === 26 && z === 38 && x >= 71 && x <= 73;
        if (edge) { put(x, h, z, h === 22 ? TRIM : LIMESTONE); if (crownEdge) g.set(ox + x, h + 1, oz + z, LIMESTONE); else g.set(ox + x, h + 1, oz + z, LIMESTONE_SLAB, { type: "bottom" }); }
        else if (!open) put(x, h, z, ROOF_DECK);
      }
  }
}
