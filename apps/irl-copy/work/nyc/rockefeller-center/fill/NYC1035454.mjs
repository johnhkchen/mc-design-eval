// 444 Madison Avenue (1931, commercial office). A limestone Art Deco setback tower on a shopfront podium, read off the
// lidar roof per cell: the lidar tiers (45, 57, 63, 69, 75 blocks) become flat storey-aligned setbacks, the tower's core
// (141) steps in to a 135 band and a 129 edge ring, and a copper crown and spire finish it. The shell is one block thick
// with an air gap behind the glass and a floor slab per storey; no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035454.cells.json`, "utf8"));
const W = 26, D = 55, H = 155, STOREY = 3, TOWER = 120;

const F = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, g, r] of cells) F[z][x] = { g, r };
const ok = (x, z) => x >= 0 && z >= 0 && x < W && z < D && F[z][x] !== null;
const med = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NB8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

// 1. Lidar holes (roof <= 1) inside a roofed mass take the median of their roofed neighbours; the rest are open ground.
const R = F.map((row) => row.map((c) => (c ? c.r : null)));
const Rf = R.map((row) => row.slice());
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!ok(x, z) || R[z][x] > 1) continue;
  const n = NB8.filter(([dx, dz]) => ok(x + dx, z + dz) && R[z + dz][x + dx] > 1).map(([dx, dz]) => R[z + dz][x + dx]);
  if (n.length >= 5) Rf[z][x] = med(n);
}

// 2. Storey-aligned tier per cell: a 5x5 median of the roof, rounded to whole storeys. Roof <= 1 is a one-block base.
const T = Array.from({ length: D }, () => Array(W).fill(null));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!ok(x, z)) continue;
  if (Rf[z][x] <= 1) { T[z][x] = 1; continue; }
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const X = x + dx, Z = z + dz;
    if (ok(X, Z) && Rf[Z][X] > 1) v.push(Rf[Z][X]);
  }
  T[z][x] = STOREY * Math.round(med(v) / STOREY);
}

// 3. The tower's setbacks: distance in cells from the tower's edge (outside the footprint or a low tier counts as edge).
const isTower = (x, z) => ok(x, z) && T[z][x] >= TOWER;
const dist = Array.from({ length: D }, () => Array(W).fill(0));
const queue = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!isTower(x, z)) continue;
  if (NB8.some(([dx, dz]) => !isTower(x + dx, z + dz))) { dist[z][x] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of NB8) {
    const X = x + dx, Z = z + dz;
    if (isTower(X, Z) && !dist[Z][X]) { dist[Z][X] = dist[z][x] + 1; queue.push([X, Z]); }
  }
}
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!isTower(x, z)) continue;
  const d = dist[z][x];
  T[z][x] = d === 1 ? 129 : d === 2 ? 135 : 141;
}

// 4. Envelope: a cell column is solid from y 0 to its tier; a block is exterior where a side neighbour is not solid.
const solid = (x, y, z) => ok(x, z) && y < T[z][x];
const exterior = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const lit = (x, y, z) => (x * 31 + y * 17 + z * 7) % 11 === 0;

const g = new Voxels([W, H, D]);
const doorState = (half) => ({ facing: "east", half, hinge: "left", open: "false", powered: "false" });

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!ok(x, z)) continue;
  const t = T[z][x];
  for (let y = 0; y < t; y++) {
    const e = exterior(x, y, z);
    const k = Math.floor(y / STOREY), r = y % STOREY;
    // Entrance on the Madison (east) face: two bronze doors under a granite band.
    if (x === W - 1 && (z === 26 || z === 27) && (y === 1 || y === 2)) {
      g.set(x, y, z, "iron_door", doorState(y === 1 ? "lower" : "upper"));
      continue;
    }
    if (x === W - 1 && z >= 25 && z <= 28 && y === 3) { g.set(x, y, z, "polished_blackstone"); continue; }
    if (e.length) {
      const [dx] = e[0];
      const pos = dx ? z : x;                      // position along the wall, for the bay rhythm
      let b;
      if (y === 0) b = "polished_blackstone";      // granite plinth
      else if (y === t - 1) b = t >= 129 ? "oxidized_copper" : "cut_sandstone";   // cornice; the crown is copper
      else if (r === 0) b = "cut_sandstone";       // string course at each storey line
      else if (k === 0) b = pos % 3 === 0 ? "polished_blackstone" : "glass";   // shopfront piers and glass
      else b = pos % 3 === 0 ? "smooth_sandstone" : "gray_stained_glass";      // limestone piers, dark glazing
      g.set(x, y, z, b);
      // Warm light just inside some windows: glowstone in the air gap behind the glass.
      if ((b === "glass" || b === "gray_stained_glass") && lit(x, y, z)) {
        const [ix, iz] = [x - dx, z - e[0][1]];
        if (ok(ix, iz) && y < T[iz][ix] && !exterior(ix, y, iz).length && y % STOREY !== 0 && y !== T[iz][ix] - 1) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    } else if (y === 0) {
      g.set(x, y, z, "stone");                     // ground slab
    } else if (y === t - 1) {
      g.set(x, y, z, "smooth_stone");              // roof deck
    } else if (y % STOREY === 0) {
      g.set(x, y, z, "stone");                     // floor slab per storey
    }
  }
}

// 5. Crown: a copper spire on the tower core's roof, with a warm light at its tip.
const core = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (ok(x, z) && T[z][x] === 141 && dist[z][x] >= 3) core.push([x, z]);
const cx = core.reduce((s, [x]) => s + x, 0) / core.length, cz = core.reduce((s, [, z]) => s + z, 0) / core.length;
const [sx, sz] = core
  .filter(([x, z]) => NB8.every(([dx, dz]) => T[z + dz]?.[x + dx] === 141))
  .sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz))[0];
for (let y = 141; y < 144; y++) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) g.set(sx + dx, y, sz + dz, "oxidized_copper");
for (let y = 144; y < 147; y++) for (let dz = 0; dz <= 1; dz++) for (let dx = 0; dx <= 1; dx++) g.set(sx + dx, y, sz + dz, "oxidized_copper");
g.set(sx, 147, sz, "oxidized_copper");
g.set(sx, 148, sz, "shroomlight");

// 6. Roof equipment on the lower tiers: a few 2x2 penthouses with a glazed band, set off the edges.
let pent = 0;
for (let z = 1; z < D - 2; z++) for (let x = 1; x < W - 2; x++) {
  if (pent >= 10 || x % 8 !== 3 || z % 9 !== 4) continue;
  const cells4 = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  const t = T[z][x];
  if (![45, 57, 63, 69, 75].includes(t)) continue;
  if (!cells4.every(([X, Z]) => ok(X, Z) && T[Z][X] === t && exterior(X, t - 1, Z).length === 0)) continue;
  for (const [X, Z] of cells4) {
    for (let y = t; y < t + 3; y++) {
      const b = y === t + 2 ? "cut_sandstone" : y === t + 1 ? "gray_stained_glass" : "smooth_sandstone";
      g.set(X, y, Z, b);
    }
  }
  pent++;
}

// 7. Floating check: a block with nothing below it and nothing beside it at its own height is a bug in the massing.
let floating = 0;
for (let y = 1; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!g.get(x, y, z) || g.get(x, y - 1, z)) continue;
  if (!NB8.slice(0, 4).some(([dx, dz]) => g.get(x + dx, y, z + dz))) floating++;
}

const stats = g.save(`${DIR}/NYC1035454.nbt`);
console.log(JSON.stringify({ ...stats, tiers: [...new Set(T.flat().filter((v) => v))].sort((a, b) => a - b), penthouses: pent, floating, spire: [sx, sz] }));
