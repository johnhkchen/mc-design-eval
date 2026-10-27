// Barclay Suites, Auckland (way 292660676): a 24-storey apartment-hotel tower over a two-storey basalt podium, a
// 26 x 35 footprint, roof 98 blocks above its lowest ground. Lidar roofs are median-smoothed and snapped to clean tiers
// on the 4-block storey grid: a 96 tower (24 storeys) on the north, its ring stepped down two storeys (a crown ledge),
// 80 and 64 setbacks on the east edge, a 32 midrise on the south-west, an 8 basalt podium on the low south. Facade: a
// polished-basalt base course, white floor bands, light-blue glass between white piers, light-grey spandrels, a
// smooth-quartz cornice under each roof, a parapet on the outer ring. The ground storey is a shopfront with clear glass.
// The entrance is on the south edge where the ground is lowest: a dark-oak door, a cantilevered canopy on two posts,
// a hanging lantern. Glowstone stands behind some panes on the floor slab. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292660676.cells.json", "utf8"));
const W = 26, D = 35, TOP = 110;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1), R = grid(0);                                 // ground (foundation height), -1 = not footprint; lidar roof
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// edge distance (1 on the outside ring), BFS through the footprint
const dist = grid(0), queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (Object.values(DIRS).some(([dx, dz]) => !inside(x + dx, z + dz))) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of Object.values(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed roof, snapped to clean tiers; a 2-storey crown ledge rings the tower's outer edge
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (r) => (r >= 88 ? 96 : r >= 76 ? 80 : r >= 60 ? 64 : r >= 24 ? 32 : 8);
const H = grid(0);
const tiers = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  let h = tierOf(median(x, z));
  if (h === 96 && dist[x][z] === 1) h = 88;
  H[x][z] = h; tiers[h] = (tiers[h] || 0) + 1;
}

// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops at or below y
const exposed = (x, z, y) => Object.keys(DIRS).filter((k) => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});
// glass panes: a pane on a north or south face runs east-west, on an east or west face north-south
const PANE = (dirs) => (dirs.includes("N") || dirs.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// entrance: the lowest ground on the south edge, the middle of that run
const southRun = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z + 1)) southRun.push([x, z]);
const minG = Math.min(...southRun.map(([x, z]) => G[x][z]));
const lowRun = southRun.filter(([x, z]) => G[x][z] === minG);
const [ex, ez] = lowRun[lowRun.length >> 1];
const gr0 = G[ex][ez];
const doorCells = new Set([`${ex},${gr0},${ez}`, `${ex},${gr0 + 1},${ez}`]);

const g = new Voxels([W, TOP, D]);
const glowAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z];

  // foundation: solid from y 0 up to the ground under the cell, so nothing floats on the slope
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_basalt");

  // roof covering on the top of the cell; a parapet on the outer ring and on any edge that drops to a lower neighbour
  g.set(x, top, z, "smooth_stone");
  const lowerNb = Object.values(DIRS).some(([dx, dz]) => inside(x + dx, z + dz) && H[x + dx][z + dz] < top);
  if (dist[x][z] === 1 || lowerNb) g.set(x, top + 1, z, "white_concrete");

  for (let y = gr; y < top; y++) {
    const ex_ = exposed(x, z, y);
    if (ex_.length === 0) {
      // interior: air, with a floor slab per storey (and on the ground)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === top - 1) { g.set(x, y, z, "smooth_quartz"); continue; }      // cornice under the roof
    if (y < 4) { g.set(x, y, z, "polished_basalt"); continue; }            // basalt base course
    if (y % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }       // floor band
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }  // spandrel
    const corner = (ex_.includes("N") || ex_.includes("S")) && (ex_.includes("W") || ex_.includes("E"));
    const face = ex_.find((k) => k === "N" || k === "S") ?? ex_[0];
    const u = face === "N" || face === "S" ? x : z;
    const shop = y < 8;                                                    // ground storey: a shopfront
    if (corner || u % 3 === 0) { g.set(x, y, z, shop ? "polished_basalt" : "white_concrete"); continue; }
    g.set(x, y, z, shop ? "glass_pane" : "light_blue_stained_glass_pane", PANE(ex_));
    if (!shop && (x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1], y]);
  }
}

// the entrance: a dark-oak door at ground level, a canopy cantilevered from the wall on two posts, a lantern under it
for (const k of doorCells) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, ez, "dark_oak_door", { facing: "south", half: y === gr0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
}
const outside = (x, z) => !inside(x, z);
const canopyY = gr0 + 3;
for (let dx = -1; dx <= 1; dx++) for (let dz = 1; dz <= 2; dz++) {
  const cx = ex + dx, cz = ez + dz;
  if (outside(cx, cz)) g.set(cx, canopyY, cz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}
for (const dx of [-1, 1]) {
  const px = ex + dx, pz = ez + 2;
  if (outside(px, pz)) for (let y = 0; y <= gr0 + 2; y++) g.set(px, y, pz, "dark_oak_log", { axis: "y" });
}
if (outside(ex, ez + 2)) g.set(ex, gr0 + 2, ez + 2, "lantern", { hanging: "true", waterlogged: "false" });

// warm light behind some panes: an interior air cell next to the glass, standing on the floor slab
for (const [x, y, z] of glowAt) {
  if (!inside(x, z) || exposed(x, z, y).length !== 0 || y % 4 !== 1) continue;
  if (!g.get(x, y - 1, z)) continue;
  g.set(x, y, z, "glowstone");
}

// roof plant: a lift core on the tower's top (3 x 3, cleared of the crown ledge), screens on the setback roofs
let core = null;
for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
  let ok = true, minD = Infinity;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!inside(x + dx, z + dz) || H[x + dx][z + dz] !== 96) { ok = false; break; }
    minD = Math.min(minD, dist[x + dx][z + dz]);
  }
  if (ok && minD >= 2 && (!core || minD > core.d)) core = { x, z, d: minD };
}
if (core) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
  g.set(core.x + dx, 97, core.z + dz, "light_gray_concrete");
  g.set(core.x + dx, 98, core.z + dz, "light_gray_concrete");
  g.set(core.x + dx, 99, core.z + dz, "smooth_quartz");
}
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || dist[x][z] < 2) continue;
  const h = H[x][z];
  if (h === 64 && x % 4 === 1 && z % 3 === 1) { g.set(x, h + 1, z, "light_gray_concrete"); g.set(x, h + 2, z, "light_gray_concrete"); }
  if (h === 80 && x % 5 === 2 && z % 4 === 2) { g.set(x, h + 1, z, "light_gray_concrete"); }
  if (h === 8 && (x + z) % 4 === 0) g.set(x, h + 1, z, "moss_carpet");
}

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292660676.nbt");
console.log(JSON.stringify({ tiers, entrance: [ex, ez, gr0], glow: glowAt.length, ...stats }));
