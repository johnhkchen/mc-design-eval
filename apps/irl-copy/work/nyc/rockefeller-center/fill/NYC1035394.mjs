// 366 Madison Avenue (1921), a Commercial & Office building on the Madison frontage: a granite base and shopfronts,
// red brick shafts with limestone storey lines and brick piers, a stepped massing from the lidar roof tiers
// (48 / 51 / 54 / 57 blocks), a tar-roof deck with a calcite parapet, and a brick penthouse on the south wing.
// The street is east (x = 16, Madison). Every column is solid from the foundation up; windows sit in the wall plane
// with a one-block air gap behind, lit in some bays by glowstone.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035394.cells.json`, "utf8"));
const W = 17, D = 27;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D;

const GRANITE = "polished_granite", LIME = "calcite", BRICK = "bricks", CORE = "bricks";
const GLASS = "glass", GLOW = "glowstone", ROOF = "stone_bricks", PAVING = "smooth_stone", AWNING = "black_concrete";

// --- lidar cleanup: raw roof per cell, courts (roof at ground, in a cluster), holes, then clean tiers
const raw = Array.from({ length: D }, () => Array(W).fill(0));
const inFp = Array.from({ length: D }, () => Array(W).fill(false));
for (const [x, z, , r] of cells) { inFp[z][x] = true; raw[z][x] = r; }
const nb = (x, z) => N4.map(([dx, dz]) => [x + dx, z + dz]).filter(([a, b]) => inside(a, b));

const court = Array.from({ length: D }, () => Array(W).fill(false));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++)
  if (inFp[z][x] && raw[z][x] <= 2 && nb(x, z).some(([a, b]) => inFp[b][a] && raw[b][a] <= 2)) court[z][x] = true;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++)          // a low ring cell walled in by the court is court too
  if (inFp[z][x] && !court[z][x] && raw[z][x] <= 49 && nb(x, z).filter(([a, b]) => court[b][a]).length >= 3) court[z][x] = true;

const roof = raw.map((row) => row.slice());
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {         // lidar holes: take the neighbours' median
  if (!inFp[z][x] || court[z][x] || raw[z][x] >= 40) continue;
  const vals = nb(x, z).filter(([a, b]) => inFp[b][a] && !court[b][a] && raw[b][a] >= 40).map(([a, b]) => raw[b][a]).sort((p, q) => p - q);
  roof[z][x] = vals.length ? vals[vals.length >> 1] : 53;
}

const snap = (r) => (r >= 56 ? 57 : r >= 53 ? 54 : r >= 50 ? 51 : 48);   // top heights, all on storey lines (y % 3)
const T0 = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++)
  if (inFp[z][x] && !court[z][x]) T0[z][x] = snap(roof[z][x]);
// one majority pass over the 3 x 3 so the tiers are flat (ties keep the cell's own tier)
const T = T0.map((row) => row.slice());
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!T0[z][x]) continue;
  const cnt = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const a = x + dx, b = z + dz; if (!inside(a, b) || !T0[b][a]) continue;
    cnt.set(T0[b][a], (cnt.get(T0[b][a]) || 0) + 1);
  }
  const best = [...cnt].sort((p, q) => q[1] - p[1])[0];
  if (best && best[1] > cnt.get(T0[z][x]) && best[1] >= 5) T[z][x] = best[0];
}
const top = (x, z) => (inside(x, z) ? T[z][x] : 0);
const exposed = (x, z, y) => N4.filter(([dx, dz]) => top(x + dx, z + dz) <= y);   // directions where the air is at height y

// --- the envelope: storey lines on y % 3 == 1, window rows on 2, spandrels on 0; a granite base on 0..3
function facade(x, z, y, [dx]) {
  const along = dx ? z : x, last = dx ? D - 1 : W - 1;
  const pier = along === 0 || along === last || along % 3 === 1;
  if (y <= 3) return y === 2 ? (pier ? GRANITE : GLASS) : GRANITE;
  const rel = y % 3;
  if (rel === 1) return LIME;
  if (rel === 2) return pier ? BRICK : GLASS;
  return BRICK;
}

const H = 61;
const g = new Voxels([W, H, D]);
const glass = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (court[z][x]) { g.set(x, 0, z, PAVING); continue; }
  const t = T[z][x];
  if (!t) continue;
  for (let y = 0; y < t; y++) {
    if (y === 0) { g.set(x, y, z, GRANITE); continue; }             // foundation
    if (y === t - 1) { g.set(x, y, z, ROOF); continue; }            // tar-roof deck over every tier
    const dirs = exposed(x, z, y);
    if (!dirs.length) { g.set(x, y, z, CORE); continue; }
    const m = facade(x, z, y, dirs[0]);
    g.set(x, y, z, m);
    if (m === GLASS) glass.push([x, y, z, dirs[0]]);
  }
  if (exposed(x, z, t - 1).length) g.set(x, t, z, LIME);            // calcite parapet on the envelope
}

// --- an air gap behind every window; some bays lit warm behind the glass
for (const [x, y, z, [dx, dz]] of glass) {
  const ix = x - dx, iz = z - dz;
  if (exposed(ix, iz, y).length) continue;                           // only a core cell can be the gap
  const lit = (x * 7 + y * 5 + z * 3) % 6 === 0;
  g.set(ix, y, iz, lit ? GLOW : "air");
}

// --- entrances on Madison (east, x = 16) and the south street (z = 26): recessed-looking doors under an awning band
const door = (x, y, z, facing) => {
  const st = { facing, hinge: "left", open: "false", powered: "false" };
  g.set(x, y, z, "iron_door", { ...st, half: "lower" });
  g.set(x, y + 1, z, "iron_door", { ...st, half: "upper" });
};
door(16, 1, 13, "east");
g.set(16, 3, 13, LIME);
for (const z of [12, 13, 14]) g.set(16, 4, z, AWNING);
door(5, 1, 26, "south");
g.set(5, 3, 26, LIME);
for (const x of [4, 5, 6]) g.set(x, 4, 26, AWNING);

// --- roof: a 2-storey penthouse on the south wing, glass band between brick, calcite cap
for (let z = 24; z <= 25; z++) for (let x = 9; x <= 11; x++) {
  g.set(x, 57, z, BRICK); g.set(x, 58, z, GLASS); g.set(x, 59, z, BRICK); g.set(x, 60, z, LIME);
}

g.save(`${DIR}/NYC1035394.nbt`);
const tiers = {}; for (const row of T) for (const t of row) if (t) tiers[t] = (tiers[t] || 0) + 1;
console.log(JSON.stringify({ blocks: g.count(), palette: g.palette.length, tiers, glass: glass.length }));
