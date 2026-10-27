// Ironbank, Auckland (way 162152704): a 1980s steel-frame office tower on a stone-brick foundation, a basalt base course
// and a shopfront ground storey, over a setback podium. The lidar roof is median-smoothed and snapped to a 4-block storey
// grid: a 36 tower (nine storeys, parapet at 37, the 38 of the record) in the middle of the footprint, 32 and 24 tiers
// stepping down to the north and the edges, 12 and 4 wings at the low south-west shed. Facade: iron mullion piers on a
// 3-cell rhythm, cyan tinted glass panes, white floor lines and light-grey spandrels, a dark-oak entrance on the north
// face under an iron fascia, warm glowstone and shroomlight behind some panes. Interiors are air with a floor slab per
// storey; every column is solid from y 0 to its roof, so nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152704.cells.json", "utf8"));
const W = 41, D = 62, TOP = 50;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  if (edge) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed roof, snapped to clean tiers on the 4-block storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (r) => (r >= 33 ? 36 : r >= 27 ? 32 : r >= 18 ? 24 : r >= 8 ? 12 : 4);
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  // at least one storey above the ground under the cell, so a sloped lot never leaves a cell roofed at its own foundation
  const floorH = 4 * Math.ceil((G[x][z] + 4) / 4);
  H[x][z] = Math.max(tierOf(median(x, z)), floorH);
  tierCount[H[x][z]] = (tierCount[H[x][z]] || 0) + 1;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});
// the entrance: the middle of the north frontage (the front row, z 0 to 3; its ground is raised, so the door sits on the foundation)
const northEdge = [];
for (let x = 0; x < W; x++) for (let z = 0; z <= 3; z++) if (inside(x, z) && !inside(x, z - 1) && H[x][z] >= 8) { northEdge.push([x, z]); break; }
const mid = northEdge.length ? northEdge[northEdge.length >> 1] : null;
const entrance = new Set();
if (mid) entrance.add(`${mid[0]},${mid[1]}`);

const g = new Voxels([W, TOP, D]);
const PANE = (dirs) => (dirs.includes("N") || dirs.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glowAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // roof slab on the top of the cell, parapet on the outside ring
  g.set(x, top, z, "gray_concrete");
  if (d === 1) g.set(x, top + 1, z, "white_concrete");

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and the ground floor)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (entrance.has(`${x},${z}`) && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === gr) { g.set(x, y, z, "polished_andesite"); continue; }   // base course
    if (y % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // floor line
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }   // spandrel
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const face = ex.includes("N") || ex.includes("S") ? ex.find(k => k === "N" || k === "S") : ex[0];
    const u = face === "N" || face === "S" ? x : z;
    if (corner || u % 3 === 0) { g.set(x, y, z, "iron_block"); continue; }   // steel mullion
    g.set(x, y, z, "cyan_stained_glass_pane", PANE(ex));
    if ((x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1], y < gr + 4]);
  }
}

// entrance fascia over the door (iron, on the street wall) and two hanging lanterns beside it
if (mid) {
  const [mx, mz] = mid, my = G[mx][mz] + 3;
  for (let dx = -2; dx <= 2; dx++) if (inside(mx + dx, mz)) g.set(mx + dx, my, mz, "iron_block");
  for (const dx of [-2, 2]) if (inside(mx + dx, mz)) g.set(mx + dx, my - 1, mz, "lantern", { hanging: "true", waterlogged: "false" });
}

// warm light behind some panes: an interior air cell next to the glass; shroomlight at the shopfronts, glowstone above
for (const [x, y, z, shop] of glowAt) if (inside(x, z) && exposed(x, z, y).length === 0 && y % 4 !== 0) g.set(x, y, z, shop ? "shroomlight" : "glowstone");

// roof plant: 3x3 screen rings on the interior of each tier (the 24, 32 and 36 roofs), and a lift core with a mast on the tower
for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) {
  if (x % 9 !== 4 || z % 9 !== 4) continue;
  const t = H[x][z];
  if (![24, 32, 36].includes(t)) continue;
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (H[x + dx][z + dz] !== t || dist[x + dx][z + dz] < 3) ok = false;
  if (!ok) continue;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (dx === 0 && dz === 0) continue;
    for (let y = t + 1; y <= t + 2; y++) g.set(x + dx, y, z + dz, "light_gray_concrete");
  }
}
let lift = null;
for (let x = 3; x < W - 3; x++) for (let z = 3; z < D - 3; z++) {
  let ok = true;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (H[x + dx][z + dz] !== 36 || dist[x + dx][z + dz] < 4) ok = false;
  if (ok && (!lift || dist[x][z] > dist[lift[0]][lift[1]])) lift = [x, z];
}
if (lift) {
  const [lx, lz] = lift;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 37; y <= 39; y++) g.set(lx + dx, y, lz + dz, y === 39 ? "iron_block" : "light_gray_concrete");
  for (let y = 40; y <= 44; y++) g.set(lx, y, lz, "lightning_rod", { facing: "up", powered: "false" });
}

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152704.nbt");
console.log(JSON.stringify({ tiers: tierCount, entrance: mid, lift, glow: glowAt.length, ...stats }));
