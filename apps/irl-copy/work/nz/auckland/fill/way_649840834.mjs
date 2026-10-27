// 59 France, Newton: a 1970s reinforced-concrete office block on a basalt plinth (the lidar roof is 36-42 blocks,
// 8 storeys of 4 blocks over a 6-block plinth, with a stepped setback on the north-west and a plant room on the core).
// Lidar roofs are median-smoothed then quantised into storey tiers; the shell is hollow (slabs per storey, air between).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_649840834.cells.json", "utf8"));

const W = 68, D = 61, H = 55;
const F = 6, STOREY = 4;                       // datum (the highest ground under the footprint) and storey height
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const at = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? -1 : z * W + x);

const inFP = new Uint8Array(W * D), G = new Int32Array(W * D), R = new Int32Array(W * D);
for (const [x, z, g, r] of cells) { const i = at(x, z); inFP[i] = 1; G[i] = g; R[i] = r; }

// Median of the lidar roof over a 5 x 5 patch of footprint cells: the 36 / 40 speckle becomes one tier.
const RS = new Int32Array(W * D);
for (const [x, z] of cells) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = at(x + dx, z + dz); if (n >= 0 && inFP[n]) vals.push(R[n]); }
  vals.sort((a, b) => a - b);
  RS[at(x, z)] = vals[Math.floor(vals.length / 2)];
}

// Each cell's tier: T = top of its roof slab, P = top of its parapet (2 blocks where the lidar shows one).
const T = new Int32Array(W * D), P = new Int32Array(W * D), ANNEX = new Uint8Array(W * D);
for (const [x, z, g] of cells) {
  const i = at(x, z), r = RS[i];
  if (r < F + STOREY) { ANNEX[i] = 1; T[i] = Math.max(Math.round(r), g + 2, F + 2); P[i] = T[i]; }
  else { const k = Math.floor((r - F) / STOREY); T[i] = F + STOREY * k; P[i] = T[i] + Math.min(2, r - T[i]); }
}

// Exposed horizontally at height y: the neighbour is outside, or it is lower than this cell's wall at y.
// Above the cell's own roof only a lower neighbour exposes the parapet (equal-tier neighbours share a roof).
function exposures(x, y, z) {
  const c = at(x, z), Tc = T[c], out = [];
  for (const [dx, dz] of DIRS) {
    const n = at(x + dx, z + dz);
    if (n < 0 || !inFP[n]) { out.push([dx, dz]); continue; }
    if (y < Tc ? T[n] <= y : T[n] < Tc) out.push([dx, dz]);
  }
  return out;
}

// What solid this voxel is, or null for air. The plinth is solid below F; above it the shell is walls on the
// exposed faces, a roof cap, a slab per storey, parapets; the interior between slabs stays air.
function kindAt(x, y, z) {
  const c = at(x, z);
  if (c < 0 || !inFP[c] || y < 0) return null;
  const g = G[c], Tc = T[c], Pc = P[c];
  if (y < g) return "found";
  if (y < F) return "plinth";
  if (y >= Pc) return null;
  if (y >= Tc) return exposures(x, y, z).length ? "parapet" : null;
  if (y === Tc - 1) return "cap";
  if (exposures(x, y, z).length) return "wall";
  if ((y - F) % STOREY === 0) return "slab";
  return null;
}

const v = new Voxels([W, H, D]);
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Entrance: the ground-floor face on the high (g = F) side, outward to the south if there is one; canopy on posts.
let door = null;
for (const [x, z, g] of cells) {
  if (g !== F) continue;
  for (const [dx, dz] of exposures(x, F, z)) {
    if (!(dx === 0 && dz === 1) && door) continue;
    const score = Math.abs(x - 34) + (dz === 1 ? 0 : 100);
    if (!door || score < door.score) door = { x, z, dx, dz, score };
  }
}

function facadeMaterial(x, y, z, exps, i, j, g) {
  const p = exps[0][0] !== 0 ? z : x;   // along the face
  const pier = p % 3 === 0;
  if (i === -1) {                       // the lower storey shows on the downhill side (plinth band)
    if (j === 1 || j === 2) return pier ? "polished_andesite" : (g <= F - 4 ? "gray_stained_glass" : "polished_andesite");
    return "polished_andesite";
  }
  if (i === 0) {                        // shopfront
    if (j === 0) return "polished_andesite";
    if (j === 3) return "light_gray_concrete";
    return pier ? "white_concrete" : "light_blue_stained_glass";
  }
  if (j === 0) return "light_gray_concrete";
  if (j === 3) return "white_concrete";
  return pier ? "white_concrete" : "gray_stained_glass";
}

const MATERIAL = { found: "stone", cap: "light_gray_concrete", parapet: "white_concrete", slab: "light_gray_concrete" };
const lit = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = at(x, z); if (!inFP[c]) continue;
  for (let y = 0; y < H; y++) {
    const k = kindAt(x, y, z); if (!k) continue;
    const g = G[c];
    let block;
    if (k === "wall" || k === "plinth") {
      const exps = exposures(x, y, z);
      const i = Math.floor((y - F) / STOREY), j = ((y - F) % STOREY + STOREY) % STOREY;
      block = exps.length ? facadeMaterial(x, y, z, exps, i, j, g) : "polished_andesite";
      if (k === "plinth" && !exps.length) block = "polished_andesite";
    } else block = MATERIAL[k];
    v.set(x, y, z, block);
  }
}

// Warm lights behind some of the glass: the interior air cell inside each lit window.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = at(x, z); if (!inFP[c]) continue;
  for (let y = F + 1; y < T[c] - 1; y++) {
    if (kindAt(x, y, z) !== "wall") continue;
    const j = (y - F) % STOREY;
    if (j !== 1 && j !== 2) continue;
    const exps = exposures(x, y, z);
    if (!exps.length) continue;
    const [dx, dz] = exps[0], p = dx !== 0 ? z : x;
    if (p % 3 === 0 || lit(x, y, z) % 9 !== 0) continue;   // a pier is never glass; about one window in nine is lit
    const ix = x - dx, iz = z - dz;
    if (kindAt(ix, y, iz) === null && inFP[at(ix, iz)] && v.val(ix, y, iz) === 0) v.set(ix, y, iz, "glowstone");
  }
}

// Entrance: a door in the ground-floor face with a lantern and a canopy on two posts.
if (door) {
  const { x, z, dx, dz } = door, face = FACING[`${dx},${dz}`];
  const lat = dz !== 0 ? [1, 0] : [0, 1];   // the face's along-direction (x for a south/north face)
  v.set(x, F, z, "oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(x, F + 1, z, "oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let s = -1; s <= 1; s++) for (let o = 1; o <= 2; o++) v.set(x + lat[0] * s + dx * o, F + 2, z + lat[1] * s + dz * o, "smooth_stone");
  for (const s of [-1, 1]) for (let y = F; y <= F + 1; y++) v.set(x + lat[0] * s + dx * 2, y, z + lat[1] * s + dz * 2, "polished_andesite");
  v.set(x + dx, F + 1, z + dz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Roof plant: a 9 x 9 plant room, 3 high, set on the core's top tier at least 3 cells in from its edges.
const TOP = Math.max(...cells.map(([x, z]) => T[at(x, z)]));
const dist = new Int32Array(W * D).fill(-1), queue = [];
for (const [x, z] of cells) { const i = at(x, z); if (T[i] !== TOP) { dist[i] = 0; queue.push(i); } }
for (let q = 0; q < queue.length; q++) {
  const i = queue[q], x = i % W, z = Math.floor(i / W);
  for (const [dx, dz] of DIRS) { const n = at(x + dx, z + dz); if (n >= 0 && inFP[n] && dist[n] < 0) { dist[n] = dist[i] + 1; queue.push(n); } }
}
const core = cells.filter(([x, z]) => dist[at(x, z)] >= 3);
if (core.length) {
  const cx = Math.round(core.reduce((s, [x]) => s + x, 0) / core.length), cz = Math.round(core.reduce((s, [, z]) => s + z, 0) / core.length);
  const inPlant = (x, z) => Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 4 && dist[at(x, z)] >= 3;
  for (let z = cz - 4; z <= cz + 4; z++) for (let x = cx - 4; x <= cx + 4; x++) {
    if (!inPlant(x, z)) continue;
    const ring = Math.abs(x - cx) === 4 || Math.abs(z - cz) === 4;
    for (let y = TOP; y < TOP + 3; y++) if (ring) v.set(x, y, z, y === TOP + 1 && lit(x, y, z) % 2 ? "iron_bars" : "light_gray_concrete");
    v.set(x, TOP + 3, z, "smooth_stone");
  }
}

const stats = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_649840834.nbt");
console.log(JSON.stringify({ footprint: cells.length, top: TOP, door, ...stats }));
