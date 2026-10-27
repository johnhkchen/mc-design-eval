// Citigroup Centre, Auckland CBD (OSM way 154089916): a 1980s glass-and-precast office tower on a plinth.
// Massing follows the lidar roof: a 3-storey base over the whole footprint, setbacks at 7, 11, 15 and an 18-storey crown
// over the core. Every storey is a floor plate on the storey below; the facade is the outer ring of cells only, so the
// interior is air (an air gap behind the glass) with a column grid and one floor plate per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089916.cells.json", "utf8"));
const W = 46, H = 88, D = 58;
const STOREY = 4;                                     // 4 blocks = 3.3 m at 1.2 blocks a metre
const TIERS = [3, 7, 11, 15, 18];                     // storeys of each massing tier (setbacks)
const COLUMN_GRID = 6;                                // interior columns every 6 cells
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, g, R] of cells) foot.set(key(x, z), { x, z, g, R });
const cellAt = (x, z) => foot.get(key(x, z));
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };

// 1. lidar roof: 3x3 median over the footprint, then snapped to the nearest massing tier (storeys = (R - 2) / 4)
for (const c of foot.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = cellAt(c.x + dx, c.z + dz); if (n) vals.push(n.R); }
  c.Rs = median(vals);
}
const snap = (R) => {
  const raw = (R - 2) / STOREY; let best = TIERS[0];
  for (const t of TIERS) if (Math.abs(t - raw) < Math.abs(best - raw) - 1e-9) best = t;
  return best;
};
for (const c of foot.values()) c.n = snap(c.Rs);

// 2. two majority passes over the footprint's 3x3 neighbourhoods (ties go taller): clean tiers, no single-cell notches
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const c of foot.values()) {
    const count = new Map();
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = cellAt(c.x + dx, c.z + dz); if (n) count.set(n.n, (count.get(n.n) ?? 0) + 1); }
    let best = c.n, bc = -1;
    for (const [t, k] of count) if (k > bc || (k === bc && t > best)) { best = t; bc = k; }
    next.set(key(c.x, c.z), best);
  }
  for (const c of foot.values()) c.n = next.get(key(c.x, c.z));
}

// A neighbour outside the footprint, or one with no storey k, leaves the cell exposed at storey k (facade).
const nAt = (x, z) => cellAt(x, z)?.n ?? 0;
const exposed = (c, k) => Object.values(DIRS).some(([dx, dz]) => nAt(c.x + dx, c.z + dz) <= k);
const exposedAxisCoord = (c, k) => {
  // the wall's coordinate along its face: bays and mullions count along the face, not across it
  const alongX = Object.values(DIRS).some(([dx, dz]) => dz !== 0 && nAt(c.x + dx, c.z + dz) <= k);
  const alongZ = Object.values(DIRS).some(([dx, dz]) => dx !== 0 && nAt(c.x + dx, c.z + dz) <= k);
  if (alongX && !alongZ) return c.z;                  // a face across x: its cells run along z
  if (alongZ && !alongX) return c.x;
  return c.x + c.z;                                   // corner: pick a stable number
};
const isColumn = (x, z) => x % COLUMN_GRID === 0 && z % COLUMN_GRID === 0;

// 3. the entrance: the longest run of footprint cells on any face (at least three), its middle cell is the lobby door
let entrance = null;
for (const [name, [dx, dz]] of Object.entries(DIRS)) {
  const face = [...foot.values()].filter((c) => nAt(c.x + dx, c.z + dz) === 0);
  const lines = new Map();
  for (const c of face) { const f = dx !== 0 ? c.x : c.z; const a = dx !== 0 ? c.z : c.x; if (!lines.has(f)) lines.set(f, []); lines.get(f).push({ c, a }); }
  for (const [, list] of lines) {
    list.sort((p, q) => p.a - q.a);
    let run = [];
    const flush = () => { if (run.length >= 3 && (!entrance || run.length > entrance.run.length)) entrance = { run, name, dx, dz, mid: run[run.length >> 1].c }; run = []; };
    for (const e of list) { if (run.length && e.a !== run[run.length - 1].a + 1) flush(); run.push(e); }
    flush();
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

// 4. the plinth (y 0 under every footprint cell, so nothing floats on a slope), then the storeys
const glowCandidates = [];
for (const c of foot.values()) {
  put(c.x, 0, c.z, "polished_granite");
  const n = c.n;
  for (let k = 0; k < n; k++) {
    const floor = 1 + STOREY * k;
    put(c.x, floor, c.z, "light_gray_concrete");                         // the floor plate of this storey
    const ex = exposed(c, k);
    if (ex) {
      const coord = exposedAxisCoord(c, k);
      put(c.x, floor + 1, c.z, "white_concrete");                       // sill: spandrel
      put(c.x, floor + 3, c.z, "white_concrete");                       // head: spandrel band
      if (coord % 3 === 0) {
        put(c.x, floor + 2, c.z, "white_concrete");                     // mullion
      } else {
        const bay = Math.floor(coord / 3);
        put(c.x, floor + 2, c.z, (bay + k) % 4 === 0 ? "gray_stained_glass" : "light_blue_stained_glass");
        glowCandidates.push({ c, k });
      }
    } else if (isColumn(c.x, c.z)) {
      for (let y = floor + 1; y <= floor + 3; y++) put(c.x, y, c.z, "white_concrete");   // structural column in the air gap
    }
  }
  // the roof: a flat plate on top of the cell, a parapet on its exposed edges
  put(c.x, 1 + STOREY * n, c.z, "gray_concrete");
  if (exposed(c, n)) put(c.x, 2 + STOREY * n, c.z, "smooth_quartz");
}

// 5. warm light behind about one window in nine: glowstone on the first open interior cell inside the glass
for (const { c, k } of glowCandidates) {
  if ((c.x * 7 + c.z * 3 + k * 5) % 9 !== 0) continue;
  for (const [dx, dz] of Object.values(DIRS)) {
    const nb = cellAt(c.x + dx, c.z + dz);
    if (!nb || nb.n <= k || exposed(nb, k) || isColumn(nb.x, nb.z)) continue;
    put(nb.x, 3 + STOREY * k, nb.z, "glowstone");
    break;
  }
}

// 6. the entrance: oak doors in the lobby cell (outward facing), a stone pier above them, a canopy fascia across the front;
//    the two storefront cells beside it are glass under the same fascia
if (entrance) {
  const { mid, name, dx, dz, run } = entrance;
  const ex = mid.x, ez = mid.z;
  const along = dx !== 0 ? [0, 1] : [1, 0];           // the face's own axis
  const shop = [-1, 1].map((s) => [ex + along[0] * s, ez + along[1] * s]);
  for (const [sx, sz] of shop) {
    if (!cellAt(sx, sz)) continue;
    put(sx, 1, sz, "light_gray_concrete");
    put(sx, 2, sz, "polished_granite");
    put(sx, 3, sz, "light_blue_stained_glass");
    put(sx, 4, sz, "polished_andesite");
  }
  put(ex, 1, ez, "oak_door", { facing: name, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, 2, ez, "oak_door", { facing: name, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, 3, ez, "stone_bricks");
  put(ex, 4, ez, "polished_andesite");
}

// 7. roof plant: a low plant room over the crown's core, a mast on top
const crown = [...foot.values()].filter((c) => c.n === TIERS[TIERS.length - 1]);
if (crown.length) {
  const cx = Math.round(crown.reduce((s, c) => s + c.x, 0) / crown.length);
  const cz = Math.round(crown.reduce((s, c) => s + c.z, 0) / crown.length);
  const top = TIERS[TIERS.length - 1];
  for (const c of crown) {
    if (Math.abs(c.x - cx) > 2 || Math.abs(c.z - cz) > 1 || exposed(c, top)) continue;
    put(c.x, 2 + STOREY * top, c.z, "light_gray_concrete");
    put(c.x, 3 + STOREY * top, c.z, "light_gray_concrete");
  }
  put(cx, 4 + STOREY * top, cz, "lightning_rod");
  put(cx, 5 + STOREY * top, cz, "lightning_rod");
}

const saved = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089916.nbt");
console.log(`way_154089916: ${saved.blocks} blocks, ${saved.palette} palette entries, entrance ${entrance ? entrance.name : "none"}`);
