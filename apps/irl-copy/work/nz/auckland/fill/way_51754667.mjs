// Auckland, a 1970s concrete-framed office block: a 6-storey wing with a 9-storey tower stepping back from its outer edges.
// The lidar roof is smoothed (5x5 median) and snapped to 4-block storeys from a datum at y 5 (the highest ground under the
// footprint). A solid plinth runs from each cell's ground to the datum (the base course); the facade is a 1-block skin of
// concrete piers, cream spandrels and glass, a 1-block air gap behind it, a solid core, and a floor slab on every storey.
// Each storey lies inside the one below, so setbacks stand on the storey under them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_51754667.cells.json", "utf8"));

const W = 77, D = 30, H = 55, N = W * D;
const DATUM = 5;                                   // the ground floor slab
const SETBACK = { 6: 3, 8: 2 };                    // tower (9 storeys): steps in 3 at the 7th storey, 2 more at the 9th
const idx = (x, z) => z * W + x;
const inGrid = (x, z) => x >= 0 && z >= 0 && x < W && z < D;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const hh = (...a) => { let h = 2166136261; for (const v of a) h = Math.imul(h ^ v, 16777619); return h >>> 0; };

const inF = new Uint8Array(N), G = new Int32Array(N), R = new Int32Array(N);
for (const [x, z, g, r] of cells) { const i = idx(x, z); inF[i] = 1; G[i] = g; R[i] = r; }

// 1. the lidar roof: a 5x5 median over footprint cells, so single noisy cells do not make spikes
const Rm = new Int32Array(N);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i]) continue;
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const nx = x + dx, nz = z + dz; if (inGrid(nx, nz) && inF[idx(nx, nz)]) v.push(R[idx(nx, nz)]);
  }
  v.sort((a, b) => a - b); Rm[i] = v[v.length >> 1];
}

// 2. tiers: NS storeys of 4 blocks above the datum; the roof snaps to the tier, a remainder of up to 3 is a parapet
const NS = new Int32Array(N), PARA = new Int32Array(N);
for (let i = 0; i < N; i++) if (inF[i]) {
  const r0 = Math.max(Rm[i], DATUM + 4);
  NS[i] = clamp(Math.floor((r0 - DATUM + 1) / 4), 1, 9);
  PARA[i] = clamp(r0 - (DATUM + 4 * NS[i]), 0, 3);
}
// the tiers are then median-smoothed again, so the roof edges step in clean flats rather than lidar bumps
{
  const NS1 = Int32Array.from(NS), PARA1 = Int32Array.from(PARA);
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const i = idx(x, z); if (!inF[i]) continue;
    const a = [], p = [];
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, nz = z + dz; if (inGrid(nx, nz) && inF[idx(nx, nz)]) { a.push(NS1[idx(nx, nz)]); p.push(PARA1[idx(nx, nz)]); }
    }
    a.sort((u, v) => u - v); p.sort((u, v) => u - v);
    NS[i] = a[a.length >> 1]; PARA[i] = p[p.length >> 1];
  }
}

// Steps from each member cell to the nearest non-member (the grid edge counts as outside): 1 = facade, 2 = air gap.
function distMap(mem) {
  const dist = new Int32Array(N).fill(-1), q = [];
  for (let i = 0; i < N; i++) if (!mem[i]) { dist[i] = 0; q.push(i); }
  for (let i = 0; i < N; i++) if (mem[i] && (i % W === 0 || i % W === W - 1 || Math.floor(i / W) === 0 || Math.floor(i / W) === D - 1)) { dist[i] = 1; q.push(i); }
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % W, z = Math.floor(i / W);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz; if (!inGrid(nx, nz)) continue;
      const j = idx(nx, nz);
      if (mem[j] && dist[j] < 0) { dist[j] = dist[i] + 1; q.push(j); }
    }
  }
  return dist;
}

// 3. storeys: each is a subset of the one below; E is how many storeys a cell keeps
const mem = [Uint8Array.from(inF)], E = new Int32Array(N);
for (let i = 0; i < N; i++) if (inF[i]) E[i] = 1;
for (let j = 1; j < 9; j++) {
  const prev = mem[j - 1], dist = distMap(prev), next = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const inset = NS[i] >= 8 ? (SETBACK[j] ?? 0) : 0;
    if (prev[i] && NS[i] > j && dist[i] > inset) { next[i] = 1; E[i] = j + 1; }
  }
  mem.push(next);
}
const dist = mem.map(distMap);
const TOPY = new Int32Array(N);                    // the top row of each cell + 1 (the roof surface)
for (let i = 0; i < N; i++) if (inF[i]) TOPY[i] = E[i] === NS[i] ? DATUM + 4 * NS[i] + PARA[i] : DATUM + 4 * E[i];

const inM = (j, x, z) => inGrid(x, z) && mem[j][idx(x, z)] === 1;
// a facade cell's pier or glass bay: piers every third block along a wall, corners are piers
function facadeOf(j, x, z) {
  const oz = !inM(j, x, z - 1) || !inM(j, x, z + 1), ox = !inM(j, x - 1, z) || !inM(j, x + 1, z);
  if (oz && ox) return { pier: true, side: 2, bay: 0 };
  if (oz) return { pier: x % 3 === 0, side: 0, bay: Math.floor(x / 3) };
  return { pier: z % 3 === 0, side: 1, bay: Math.floor(z / 3) };
}

const g = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i]) continue;
  const gr = G[i], e = E[i], top = TOPY[i];
  for (let y = 0; y < top; y++) {
    let b = null;
    if (y < gr) b = "stone_bricks";                                  // foundation, down to the ground
    else if (y < DATUM) b = "polished_andesite";                     // the base course, at grade up to the datum
    else if (y === top - 1) {                                        // the cap: cornice on the facade, roof paving inside
      b = e < NS[i] && dist[e - 1][i] >= 2 ? "stone_bricks" : "smooth_stone";
    }
    else if (y >= DATUM + 4 * e) b = "light_gray_concrete";          // parapet above the top storey
    else {
      const j = Math.floor((y - DATUM) / 4), r = (y - DATUM) % 4, d = dist[j][i];
      if (r === 0) b = d === 1 ? (j === 0 ? "polished_andesite" : "white_concrete") : "light_gray_concrete";   // floor slab, storey line
      else if (d === 1) {
        const f = facadeOf(j, x, z);
        if (f.pier) b = j === 0 ? "polished_andesite" : "light_gray_concrete";
        else b = j > 0 && hh(f.bay, j, f.side) % 9 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass";
      }
      else if (d === 2) b = r === 1 && hh(x, z, j) % (j === 0 ? 4 : 9) === 0 ? "glowstone" : null;   // air gap, lamps on the floor
      else b = "light_gray_concrete";                                // solid core
    }
    if (b) g.set(x, y, z, b);
  }
}

// the entrance: a door in the middle of the north facade's run, on a glass bay, under a lintel canopy
const run = [];
for (let x = 0; x < W; x++) if (inF[idx(x, 0)]) run.push(x);
let xd = run[run.length >> 1];
while (xd % 3 !== 1 || !inF[idx(xd + 1, 0)]) xd++;
for (const x of [xd, xd + 1]) {
  g.set(x, 6, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: x === xd ? "left" : "right", open: "false", powered: "false" });
  g.set(x, 7, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: x === xd ? "left" : "right", open: "false", powered: "false" });
}
for (let x = xd - 1; x <= xd + 2; x++) for (const z of [0, 1]) if (inF[idx(x, z)]) g.set(x, 8, z, "smooth_stone");

// roof plant on the tower: a 7 x 3 block of plant rooms with an iron louvre cap, set on the tower's roof surface
const tower = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (mem[8][idx(x, z)] && dist[8][idx(x, z)] >= 3) tower.push([x, z]);
const med = (a) => a.slice().sort((p, q) => p - q)[a.length >> 1];
const cx = med(tower.map(([x]) => x)), cz = med(tower.map(([, z]) => z));
let plant = 0;
for (const [x, z] of tower) if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 1) {
  const t = TOPY[idx(x, z)];
  g.set(x, t, z, "light_gray_concrete"); g.set(x, t + 1, z, "light_gray_concrete"); g.set(x, t + 2, z, "iron_block");
  plant++;
}

// every solid cell above the ground must stand on a solid cell or be held by a solid neighbour
let loose = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 1; y < H; y++) {
  if (!g.val(x, y, z) || g.val(x, y - 1, z)) continue;
  if (!(g.val(x + 1, y, z) || g.val(x - 1, y, z) || g.val(x, y, z + 1) || g.val(x, y, z - 1))) loose++;
}

const out = g.save(DIR + "way_51754667.nbt");
const tops = {}; for (let i = 0; i < N; i++) if (inF[i]) tops[TOPY[i]] = (tops[TOPY[i]] || 0) + 1;
console.log(JSON.stringify({ blocks: out.blocks, palette: out.palette, door: xd, plantCells: plant, looseCells: loose, roofSurfaces: tops }));
