// SkyCity Grand Hotel (Auckland, 1990s): a concrete and tinted-glass hotel tower on a lower podium, on a 93 x 93 block footprint.
// Massing follows the lidar roof, median-smoothed over a 5 x 5 window and quantized to 4-block storeys (floors at F + 4k).
// The plinth fills from y 0 to the floor level F (the highest ground under the footprint), so the downhill side shows its
// extra storeys and nothing floats on the slope. Each storey: a floor slab, two rows of glass, a spandrel line. No interiors:
// air behind the glass, with a column grid holding every floor, and glowstone just inside some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_609071943.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_609071943.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const W = 93, D = 93, HY = 109, N = W * D;
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const at = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? -1 : z * W + x);
const inFp = new Uint8Array(N), GR = new Int16Array(N), R = new Int16Array(N);
for (const [x, z, ground, roof] of cells) { const i = at(x, z); inFp[i] = 1; GR[i] = ground; R[i] = roof; }
const F = Math.max(...cells.map((c) => c[2]));          // the floor level: the highest ground under the footprint

// storeys from the lidar roof, then a median over a 5 x 5 window of footprint cells: flat tiers, no noise
const nRaw = new Int16Array(N).fill(-1);
for (let i = 0; i < N; i++) if (inFp[i]) nRaw[i] = Math.max(1, Math.round((R[i] - F) / 4));
const T = new Int16Array(N).fill(-1);                    // roof row of each cell (-1 outside the footprint)
const cellsIn = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = at(x, z); if (!inFp[i]) continue;
  cellsIn.push([x, z]);
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const j = at(x + dx, z + dz); if (j >= 0 && inFp[j]) v.push(nRaw[j]); }
  v.sort((a, b) => a - b);
  T[i] = F + 4 * v[v.length >> 1];
}
// setbacks: above the podium the tower steps in as it rises, its cap 8 blocks higher for each cell inset from the edge
const dist = new Int32Array(N).fill(1e9), queue = [];
const isIn = (x, z) => { const j = at(x, z); return j >= 0 && inFp[j] === 1; };
for (const [x, z] of cellsIn) if (DIRS.some(([dx, dz]) => !isIn(x + dx, z + dz))) { dist[at(x, z)] = 1; queue.push([x, z]); }
for (let q = 0; q < queue.length; q++) {
  const [x, z] = queue[q], d = dist[at(x, z)];
  for (const [dx, dz] of DIRS) if (isIn(x + dx, z + dz) && dist[at(x + dx, z + dz)] > d + 1) { dist[at(x + dx, z + dz)] = d + 1; queue.push([x + dx, z + dz]); }
}
for (const [x, z] of cellsIn) { const i = at(x, z); if (T[i] > 64) T[i] = Math.min(T[i], 56 + 8 * dist[i]); }
const maxT = Math.max(...T);

const topOf = (x, z) => { const i = at(x, z); return i < 0 || !inFp[i] ? -1 : T[i]; };
const ground = (x, z) => GR[at(x, z)];
// a face at row y is exposed where the neighbour is outside the footprint or its roof is below y
const exposed = (x, z, y) => DIRS.some(([dx, dz]) => topOf(x + dx, z + dz) < y);
const outside = (x, z, dx, dz) => topOf(x + dx, z + dz) === -1;
const pillar = (x, z) => x % 4 === 2 && z % 4 === 2;

// entrance: a three-cell front on the street, on the highest ground so the door needs no steps
let ent = null;
for (const minG of [F - 1, 0]) {
  for (const [x, z] of cellsIn) {
    if (ent) break;
    for (const [dx, dz, name] of DIRS) {
      if (!outside(x, z, dx, dz)) continue;
      const [tx, tz] = dx ? [0, 1] : [1, 0];
      const ok = [-1, 0, 1].every((s) => {
        const cx = x + s * tx, cz = z + s * tz;
        return inFp[at(cx, cz)] && outside(cx, cz, dx, dz) && ground(cx, cz) >= minG;
      });
      if (ok) { ent = { x, z, name, dx, dz, tx, tz }; break; }
    }
  }
  if (ent) break;
}
console.error(`floor F=${F} maxT=${maxT} entrance=${ent ? `${ent.x},${ent.z} ${ent.name}` : "none"}`);

const g = new Voxels([W, HY, D]);
for (const [x, z] of cellsIn) {
  const t = T[at(x, z)], podium = t <= 48;
  const wall = podium ? "light_gray_concrete" : "white_concrete";

  // plinth: from y 0 up to the floor level F, a base course on top
  for (let y = 0; y < F; y++) g.set(x, y, z, y === F - 1 ? "polished_andesite" : "stone_bricks");

  for (let y = F; y <= t; y++) {
    if (y === t) { g.set(x, y, z, "smooth_stone"); continue; }     // roof slab
    const k = (y - F) % 4, storey = Math.floor((y - F) / 4), ground0 = storey === 0;
    if (!exposed(x, z, y)) {                                       // interior: air, a floor slab per storey, a column grid
      if (k === 0) g.set(x, y, z, "smooth_stone");
      else if (pillar(x, z)) g.set(x, y, z, "white_concrete");
      continue;
    }
    // façade: k 0 floor line, 1-2 glass (mullion every third block), 3 spandrel
    const mull = (x + z) % 3 === 0;
    if (k === 0) g.set(x, y, z, ground0 ? "stone_bricks" : wall);
    else if (k === 3) g.set(x, y, z, "light_gray_concrete");
    else if (ground0) g.set(x, y, z, mull ? "polished_andesite" : "light_blue_stained_glass");
    else g.set(x, y, z, mull ? wall : "light_blue_stained_glass_pane");

    // warm light just inside some windows, on the interior floor slab
    if (!mull && (k === 1 || k === 2) && (x * 5 + z * 3 + y) % 13 === 0) {
      for (const [dx, dz] of DIRS) {
        const nx = x + dx, nz = z + dz;
        if (topOf(nx, nz) > y && !exposed(nx, nz, y) && !pillar(nx, nz)) { g.set(nx, y, nz, "glowstone"); break; }
      }
    }
  }

  // parapet on the outer edge of the roof
  if (DIRS.some(([dx, dz]) => outside(x, z, dx, dz))) g.set(x, t + 1, z, "stone_brick_wall");

  // roof plant: a 2 x 2 box of three blocks on the top tier, set in from the edge
  if (t === maxT && x % 12 === 4 && z % 12 === 4 && [[1, 0], [0, 1], [1, 1]].every(([dx, dz]) => topOf(x + dx, z + dz) === maxT)) {
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (let y = t + 1; y <= t + 3; y++) g.set(x + dx, y, z + dz, "light_gray_concrete");
  }
}

// entrance: glass doors (dark oak) on the middle cell, glazing either side, a lintel over the three
if (ent) {
  const { x, z, name, tx, tz } = ent;
  const cx = [x - tx, x, x + tx], cz = [z - tz, z, z + tz];
  for (let j = 0; j < 3; j++) for (let k = 1; k <= 2; k++) g.set(cx[j], F + k, cz[j], "light_blue_stained_glass");
  g.set(x, F + 1, z, "dark_oak_door", { facing: name, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, F + 2, z, "dark_oak_door", { facing: name, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let j = 0; j < 3; j++) g.set(cx[j], F + 3, cz[j], "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const stats = g.save(OUT);
console.error(`saved ${OUT}: ${stats.blocks} blocks, ${stats.palette} palette entries`);
