// Hiwa: a 1980s concrete-framed office block on a podium, with a stepped core rising to nine storeys.
// The lidar roof reads as tiers (37 podium, 41-43 core, a low rim); each cell's storey count is the median-smoothed
// roof in 4-block storeys, the core is set back from the podium edge so the podium reads as a terrace, and the
// downhill (north-east) side shows a plinth of extra storey rows. The shell is a 1-block facade, a 1-block air gap
// behind the glass, a solid core and a floor slab per storey, so every storey rests on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_23894045.cells.json", "utf8"));

const W = 103, D = 109, H = 56, N = W * D;
const DATUM = 5;                                  // the ground floor slab: the highest ground under the footprint
const idx = (x, z) => z * W + x;
const inGrid = (x, z) => x >= 0 && z >= 0 && x < W && z < D;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// a deterministic hash for the scattered details (which windows are lit, which glass is tinted, where the units sit)
const hh = (...a) => { let h = 2166136261; for (const v of a) h = Math.imul(h ^ v, 16777619); return h >>> 0; };

const inF = new Uint8Array(N), G = new Int32Array(N), R = new Int32Array(N);
for (const [x, z, g, r] of cells) { const i = idx(x, z); inF[i] = 1; G[i] = g; R[i] = r; }

// 1. Smooth the lidar roof: a 5x5 median over footprint cells, so single noisy cells do not make spikes.
const Rm = new Int32Array(N);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i]) continue;
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const nx = x + dx, nz = z + dz; if (inGrid(nx, nz) && inF[idx(nx, nz)]) v.push(R[idx(nx, nz)]);
  }
  v.sort((a, b) => a - b); Rm[i] = v[v.length >> 1];
}

// 2. Storeys: a roof at 4n+5 for n storeys of 4 blocks (slab + 3 rows). 37 = 8 storeys; 41-43 = 9 storeys + parapet.
const NO = new Int32Array(N), PARA = new Int32Array(N);
for (let i = 0; i < N; i++) if (inF[i]) {
  NO[i] = clamp(Math.round((Rm[i] - 6) / 4), 1, 9);
  PARA[i] = clamp(Rm[i] - (4 * NO[i] + 5), 0, 2);
}

// Steps (4-neighbour) from each member cell to the nearest non-member: a diagonal wall stays one cell thick (the grid edge counts as outside): 1 = facade, 2 = air gap.
function distMap(mem) {
  const dist = new Int32Array(N).fill(-1), q = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const i = idx(x, z);
    if (!mem[i]) { dist[i] = 0; q.push(i); }
    else if (x === 0 || z === 0 || x === W - 1 || z === D - 1) { dist[i] = 1; q.push(i); }
  }
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % W, z = (i / W) | 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz; if (!inGrid(nx, nz)) continue;
      const j = idx(nx, nz);
      if (mem[j] && dist[j] < 0) { dist[j] = dist[i] + 1; q.push(j); }
    }
  }
  return dist;
}

// 3. Setbacks: each storey is a subset of the one below. The core (9th storey) steps in 5 blocks from the podium edge.
const SETBACK = { 9: 5 };
const NE = new Int32Array(N);                     // effective storey count per cell
let S = Uint8Array.from(inF);
for (let i = 0; i < N; i++) if (inF[i]) NE[i] = 1;
for (let L = 2; L <= 9; L++) {
  const dist = distMap(S), next = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (S[i] && NO[i] >= L && dist[i] > (SETBACK[L] ?? 0)) { next[i] = 1; NE[i] = L; }
  S = next;
}

// membership of each storey j (cells with more than j storeys) and its facade distance
const mem = [], dist = [];
for (let j = 0; j < 9; j++) {
  const m = new Uint8Array(N);
  for (let i = 0; i < N; i++) m[i] = inF[i] && NE[i] > j ? 1 : 0;
  mem.push(m); dist.push(distMap(m));
}
const inM = (m, x, z) => inGrid(x, z) && m[idx(x, z)] === 1;
const facesOf = (m, x, z) => {
  const f = [];
  if (!inM(m, x, z - 1)) f.push("N");
  if (!inM(m, x, z + 1)) f.push("S");
  if (!inM(m, x - 1, z)) f.push("W");
  if (!inM(m, x + 1, z)) f.push("E");
  return f;
};
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const OUTWARD = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
// The facade face of a ring cell. On a stepped edge a cell can touch two outside faces: the face with the longer run of
// outside cells is the wall it belongs to; a tie (a 45-degree step, or a corner) is split by hash so the glass does not
// stripe. null (a pier) only for a cell with no outside face.
const primaryFace = (m, x, z) => {
  const f = facesOf(m, x, z);
  if (f.length <= 1) return f[0] ?? null;
  const run = (face) => { let n = 0, cx = x + OUTWARD[face][0], cz = z + OUTWARD[face][1]; while (n < 4 && !inM(m, cx, cz)) { n++; cx += OUTWARD[face][0]; cz += OUTWARD[face][1]; } return n; };
  const r = f.map((face) => [face, run(face)]).sort((a, b) => b[1] - a[1]);
  if (r[0][1] > r[1][1]) return r[0][0];
  const tied = r.filter((e) => e[1] === r[0][1]).map((e) => e[0]);
  return tied[hh(x, z, 3) % tied.length];
};

// 4. The entrance: the face with the most single-face ground-storey cells; the door sits at the median bay of it.
const runs = { N: [], S: [], W: [], E: [] };
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i] || dist[0][i] !== 1) continue;
  const face = primaryFace(mem[0], x, z); if (!face) continue;
  runs[face].push(face === "N" || face === "S" ? x : z);
}
let doorFace = null, doorU = null;
for (const f of Object.keys(runs)) if (!doorFace || runs[f].length > runs[doorFace].length) doorFace = f;
if (doorFace && runs[doorFace].length) { const us = runs[doorFace].sort((a, b) => a - b); doorU = us[us.length >> 1]; }

// Helper: every block write goes through here.
const out = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => out.set(x, y, z, block, state);
const GLASS_STATE = (face) => (face === "N" || face === "S")
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// A ring-1 facade cell in a window row (k = 1 or 2) of storey j. Piers on every third bay, glass between, a door on the entrance.
// Some windows get a warm light in the air gap behind them.
function facadeRow(x, z, y, j, k, m, dd) {
  const face = primaryFace(m, x, z);
  if (!face) { put(x, y, z, "white_concrete"); return; }
  const u = face === "N" || face === "S" ? x : z;
  if (j === 0 && face === doorFace && u === doorU) {
    put(x, y, z, "dark_oak_door", { facing: FACING[face], half: k === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    return;
  }
  if (u % 3 === 0) { put(x, y, z, "white_concrete"); return; }
  const tint = j === 0 ? "light_blue_stained_glass_pane" : hh(x, z, j, 7) % 6 === 0 ? "cyan_stained_glass_pane" : "gray_stained_glass_pane";
  put(x, y, z, tint, GLASS_STATE(face));
  const [dx, dz] = INWARD[face];
  const bx = x + dx, bz = z + dz;
  if (inGrid(bx, bz) && m[idx(bx, bz)] && dd[idx(bx, bz)] === 2 && hh(x, z, j, k) % 9 === 0) {
    put(bx, y, bz, hh(x, z, j, k) % 2 ? "shroomlight" : "glowstone");
  }
}

// 5. Columns.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i]) continue;
  const g = clamp(G[i], 0, DATUM), n = NE[i];

  // foundation under the ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone");

  // the plinth: rows from the ground up to the ground floor slab, where the north-east side is lower
  if (g < DATUM) {
    const d = dist[0][i];
    for (let y = g; y < DATUM; y++) {
      if (y === g) put(x, y, z, d === 1 ? "stone_bricks" : "stone");
      else if (y >= DATUM - 2) put(x, y, z, d === 1 ? "light_gray_concrete" : "stone");   // head and slab rows
      else if (d === 1) facadeRow(x, z, y, 1, y - g, mem[0], dist[0]);
      else if (d === 2) { /* air gap */ }
      else put(x, y, z, "stone");
    }
  }

  // storeys: slab, two window rows, head row
  for (let j = 0; j < n; j++) {
    const b = DATUM + 4 * j, top = j === n - 1, d = dist[j][i];
    for (let k = 0; k < 4; k++) {
      const y = b + k;
      if (k === 0) {                                                       // floor slab (the base course on the ground floor)
        put(x, y, z, j === 0 && d === 1 ? "stone_bricks" : "light_gray_concrete");
      } else if (k === 1 || k === 2) {
        if (d === 1) facadeRow(x, z, y, j, k, mem[j], dist[j]);
        else if (d === 2) { /* air gap behind the glass */ }
        else put(x, y, z, "stone");
      } else {                                                             // head row: a fascia on the ground floor, a cornice on the top
        if (j === 0 && d === 1 && n > 1) {
          const face = primaryFace(mem[0], x, z);
          const nearDoor = face === doorFace && Math.abs((face === "N" || face === "S" ? x : z) - doorU) <= 1;
          put(x, y, z, nearDoor ? "black_concrete" : "gray_concrete");
        } else if (top && d === 1) put(x, y, z, "white_concrete");
        else put(x, y, z, "light_gray_concrete");
      }
    }
  }

  // parapet above the top storey's cornice, on the facade only, where the lidar says it rises above the storey
  if (NE[i] === NO[i] && PARA[i] > 0 && dist[n - 1][i] === 1) {
    for (let p = 1; p <= PARA[i]; p++) put(x, DATUM + 4 * (n - 1) + 3 + p, z, "white_concrete");
  }
}

// 6. Roof equipment: a plant room on the core roof, and small units on the podium terrace.
let tx = 0, tz = 0, tn = 0;
for (let i = 0; i < N; i++) if (inF[i] && NE[i] === 9) { tx += i % W; tz += (i / W) | 0; tn++; }
if (tn) {
  tx = Math.round(tx / tn); tz = Math.round(tz / tn);
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const i = idx(x, z);
    if (!inF[i] || NE[i] !== 9 || dist[8][i] < 4) continue;
    if (Math.abs(x - tx) > 7 || Math.abs(z - tz) > 7) continue;
    put(x, 41, z, "light_gray_concrete");
    put(x, 42, z, "light_gray_concrete");
  }
}
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z);
  if (!inF[i] || NE[i] !== 8 || (hh(x, z, 11) % 61) !== 0) continue;
  let nearCore = false;
  for (let dz = -2; dz <= 2 && !nearCore; dz++) for (let dx = -2; dx <= 2; dx++) {
    if (inGrid(x + dx, z + dz) && NE[idx(x + dx, z + dz)] === 9) { nearCore = true; break; }
  }
  if (nearCore || dist[7][i] < 2) continue;
  put(x, 37, z, "gray_concrete");
  put(x, 38, z, "gray_concrete");
}

const stats = out.save(DIR + "way_23894045.nbt");
const tiers = {};
for (let i = 0; i < N; i++) if (inF[i]) tiers[NE[i]] = (tiers[NE[i]] || 0) + 1;
console.log("saved way_23894045.nbt", stats, "storeys", JSON.stringify(tiers), "door", doorFace, doorU);
