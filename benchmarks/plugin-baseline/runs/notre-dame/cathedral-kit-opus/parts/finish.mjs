// P6 Glass, light and ground (plan.md PARTS): glass in every window plane, shroomlight glow behind it, ochre floodlights
// at the pier feet, lanterns on set-offs / parapet posts / tower decks, the smooth_stone strip round the walls.
// The openings are FOUND, not retyped: in each window band an opening cell is an air cell whose air run up the column
// is closed by masonry just below (the sill) and just above (the head) and no taller than the window. So the glazing
// follows whatever the shell (and P3/P4 in the merged build) actually left open, and never fills open sky.
import {
  inFootprint, mirrorZ, CHEVET_CENTRE, glazeLancet, glowBehind, floodlight, pierLantern, paveStrip,
} from "../vocab.mjs";
import { groundAt } from "../vocab/base.mjs";

const [CX, CZ] = CHEVET_CENTRE;
const NAVE_PIERS = [32, 40, 48, 56, 64, 72, 80], CHOIR_PIERS = [112, 120, 128, 136, 144];

// The opening cells in a band: columns (x, z) passing `inBand`, rows y0..y1, air runs bounded by solid both ends.
function openings(g, { xs, zs, y0, y1, inBand = () => true }) {
  const cells = [];
  for (const x of xs) for (const z of zs) {
    if (!inFootprint(x, z) || !inBand(x, z)) continue;
    let y = y0;
    while (y <= y1) {
      if (!g.isAir(x, y, z)) { y++; continue; }
      let t = y; while (t + 1 <= y1 + 1 && g.isAir(x, t + 1, z)) t++;
      const closed = !g.isAir(x, y - 1, z) && g.inBounds(x, t + 1, z) && !g.isAir(x, t + 1, z);
      if (closed && t <= y1) for (let k = y; k <= t; k++) cells.push([x, k, z]);
      y = t + 1;
    }
  }
  return cells;
}

// Group cells into windows (4-connected in their plane) so each gets its own glow.
function windows(cells) {
  const key = (c) => c.join(","), left = new Map(cells.map((c) => [key(c), c])), out = [];
  for (const c of cells) {
    if (!left.has(key(c))) continue;
    const grp = [], q = [c]; left.delete(key(c));
    while (q.length) {
      const [x, y, z] = q.pop(); grp.push([x, y, z]);
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
        const k = `${x + dx},${y + dy},${z + dz}`;
        if (left.has(k)) { q.push(left.get(k)); left.delete(k); }
      }
    }
    out.push(grp);
  }
  return out;
}

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const towardC = (x, z) => {                     // nearest axis facing pointing from (x, z) toward C
  const dx = CX - x, dz = CZ - z;
  return Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? "east" : "west") : (dz > 0 ? "south" : "north");
};

function glazeAndGlow(g, cells, inwardOf) {
  if (!cells.length) return;
  glazeLancet(g, { cells });
  for (const w of windows(cells)) glowBehind(g, { cells: w, inward: inwardOf(w[0]), d: 1, bracket: false });
}

export function build(g) {
  const flankX = range(23, 151);
  // ---- straight flanks: chapel (z 65 / 11), tribune (z 58 / 18), clerestory (z 48 / 28) glass planes ----
  for (const [zS, y0, y1] of [[65, 6, 17], [58, 26, 28], [48, 38, 45]]) {
    for (const z of [zS, mirrorZ(zS)]) {
      const cells = openings(g, { xs: flankX, zs: [z], y0, y1 });
      glazeAndGlow(g, cells, () => (z > 38 ? "north" : "south"));
    }
  }
  // ---- transept triforium (plane z 66 / 10) ----
  for (const z of [66, 10]) glazeAndGlow(g, openings(g, { xs: range(88, 100), zs: [z], y0: 28, y1: 31 }), () => (z > 38 ? "north" : "south"));
  // ---- roses: P3/P4 set their glass; the glow behind them is here (2 inside each disc's plane) ----
  for (const [x, y, z, inward] of [[94, 40, 66, "north"], [94, 40, 10, "south"], [3, 39, 38, "east"]])
    for (const [a, b] of [[-7, 0], [7, 0], [0, -7], [-5, 5], [5, 5]]) {
      const [gx, gz] = inward === "east" ? [x + 2, z + a] : [x + a, z + (inward === "north" ? -1 : 1)];
      const gy = y + b;
      if (g.isAir(gx, gy, gz)) g.set(gx, gy, gz, "shroomlight");
    }

  // ---- the chevet: apse clerestory (r 8..11.6, y 38..45), tribune ring (r 17..19.6, y 24..30), chapels (r 25..30) ----
  const r = (x, z) => Math.hypot(x + 0.5 - (CX + 0.5), z + 0.5 - (CZ + 0.5));
  const chev = { xs: range(152, 184), zs: range(4, 72) };
  for (const [r0, r1, y0, y1] of [[8, 11.6, 38, 45], [16.5, 19.8, 24, 30], [24.5, 30.5, 5, 16]]) {
    const cells = openings(g, { ...chev, y0, y1, inBand: (x, z) => r(x, z) >= r0 && r(x, z) <= r1 });
    glazeAndGlow(g, cells, ([x, , z]) => towardC(x, z));
  }
  // ---- sacristy windows: south and east faces (y 5..9) ----
  const sac = openings(g, { xs: range(115, 150), zs: range(68, 108), y0: 4, y1: 10 });
  glazeAndGlow(g, sac, ([x, , z]) => (z >= 106 ? "north" : x >= 148 ? "west" : z >= 99 ? "north" : "west"));

  // ---- floodlights: ochre_froglight flush in the ground course ----
  const flood = (x, z) => {
    if (!inFootprint(x, z)) return;
    const y = groundAt(x, z) - 1;
    if (y >= 0 && g.isAir(x, y + 1, z)) floodlight(g, { x, z, y });
  };
  for (const p of [...NAVE_PIERS, ...CHOIR_PIERS]) { flood(p - 1, 69); flood(p + 2, 69); }   // south piers, both sides of the foot
  for (const a of [-54, -18, 18, 54, 90]) {                                                    // chevet piers, 1 out radially
    const t = (a * Math.PI) / 180;
    flood(Math.round(CX + 34 * Math.cos(t)), Math.round(CZ + 34 * Math.sin(t)));
  }
  for (let x = 26; x <= 150; x += 6) flood(x, 6);                                              // north, every 6
  for (let z = 15; z <= 61; z += 6) flood(0, z);                                               // west, every 6

  // ---- lanterns ----
  const fullTop = (x, y, z) => !g.isAir(x, y, z) && !/stairs|slab|wall|bars|lantern/.test(g.blockAt(x, y, z));
  for (const p of [...NAVE_PIERS, ...CHOIR_PIERS]) lantern: for (const x of [p, p + 1])          // south set-offs (y 20): on a full top face only
    for (const y of [21, 22]) if (g.isAir(x, y, 69) && fullTop(x, y - 1, 69)) { pierLantern(g, { x, y, z: 69 }); break lantern; }
  // parapet posts (P4's end_stone_brick_wall posts) at y 48 (gutter walk) and y 20 (aisle balustrade): every 4th one
  for (const yPost of [48, 20]) {
    let n = 0;
    for (const z of range(4, 72)) for (const x of range(23, 184))
      if (/end_stone_brick_wall/.test(g.blockAt(x, yPost, z)) && g.isAir(x, yPost + 1, z) && n++ % 4 === 0)
        pierLantern(g, { x, y: yPost + 1, z });
  }
  // tower decks: standing ON the deck (y 95) at y 96, inside the parapet
  for (const [z0, z1] of [[11, 29], [47, 65]]) for (const x of [6, 12, 18]) for (const z of [z0 + 3, z1 - 3])
    if (g.isAir(x, 96, z) && !g.isAir(x, 95, z)) pierLantern(g, { x, y: 96, z });

  // ---- the light grid (no dark walkable cell): open ground gets a flush froglight every 6, the covered interior floors
  // (nave, aisles, chapels, sacristy: a lit void) a shroomlight standing on the floor every 6 ----
  const lightAt = (x, z) => {
    if (!g.inBounds(x, 0, z) || !inFootprint(x, z)) return false;
    const y = groundAt(x, z) - 1;
    if (y < 0) return false;
    const coveredFrom = (k0) => { for (let k = k0; k < g.size[1]; k++) if (!g.isAir(x, k, z)) return true; return false; };
    if (/grass_block|dirt/.test(g.blockAt(x, y, z)) && g.isAir(x, y + 1, z) && g.isAir(x, y + 2, z) && !coveredFrom(y + 2)) {
      floodlight(g, { x, z, y }); return true;
    }
    let f = y; while (f + 1 < 8 && !g.isAir(x, f + 1, z)) f++;                     // the floor top (up to y 7)
    if (f + 1 < 8 && g.isAir(x, f + 1, z) && g.isAir(x, f + 2, z)) { g.set(x, f + 1, z, "shroomlight"); return true; }
    return false;
  };
  for (let x0 = 3; x0 < g.size[0]; x0 += 6) for (let z0 = (x0 % 12 === 3 ? 3 : 6); z0 < g.size[2]; z0 += 6)
    [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1], [2, 0], [0, 2]].some(([a, b]) => lightAt(x0 + a, z0 + b));

  // upper floors (tribunes and the ambulatory tribune at feet 21, tower chambers 31 / 58 / 63): a shroomlight every 6
  const upper = (x, y, z) => g.inBounds(x, y + 1, z) && !g.isAir(x, y - 1, z) && g.isAir(x, y, z) && g.isAir(x, y + 1, z)
    && (g.set(x, y, z, "shroomlight"), true);
  for (const y of [21]) for (let x0 = 24; x0 <= 175; x0 += 6) for (let z0 = 4; z0 <= 72; z0 += 6)
    [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]].some(([a, b]) => inFootprint(x0 + a, z0 + b) && upper(x0 + a, y, z0 + b));
  for (const y of [31, 58, 63]) for (const [z0, z1] of [[12, 28], [48, 64]]) for (let x = 7; x <= 19; x += 6) for (let z = z0 + 3; z <= z1; z += 6)
    upper(x, y, z);

  // ---- paving strip: natural ground cells touching a wall/plinth of the build ----
  const GROUNDY = /grass_block|dirt/;
  const pave = [];
  for (let x = 0; x < g.size[0]; x++) for (let z = 0; z < g.size[2]; z++) {
    if (!inFootprint(x, z)) continue;
    const y = groundAt(x, z) - 1;
    if (y < 0 || !GROUNDY.test(g.blockAt(x, y, z)) || !g.isAir(x, y + 1, z)) continue;
    const touches = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) =>
      g.inBounds(x + dx, y + 1, z + dz) && !g.isAir(x + dx, y + 1, z + dz) && !GROUNDY.test(g.blockAt(x + dx, y + 1, z + dz)));
    if (touches) pave.push([x, y, z]);
  }
  if (pave.length) paveStrip(g, { cells: pave });
}
