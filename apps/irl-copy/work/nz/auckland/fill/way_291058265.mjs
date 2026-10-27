// Sugartree Prima, Auckland (way 291058265): a late-20th-century concrete-frame office block on a stone plinth, with a
// ground-floor shopfront and an 11-storey crown (44 blocks, 4-block storeys). Lidar roof heights are median-smoothed and
// snapped to a storey grid: a 44 core, a 40 shoulder on the outer ring (the core steps back above it), a 32 and 24 wing,
// a 16 low edge. The facade is a 4-block storey rhythm: quartz floor bands, grey spandrels, tinted glass panes between
// white concrete piers, a polished andesite plinth, a dark-oak entrance with hanging lanterns under a lintel, glowstone
// behind some panes. Roof plant on the core and a lift core. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058265.cells.json", "utf8"));
const W = 84, D = 69, TOP = 60;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
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

// median-smoothed roof, then tiers on the 4-block storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z), d = dist[x][z];
  let tier = r >= 43 ? 44 : r >= 35 ? 40 : r >= 27 ? 32 : r >= 19 ? 24 : 16;
  if (d <= 2 && tier === 44) tier = 40;                        // the outer two rings stop one storey short: the core steps back above them
  const floorH = 4 * Math.ceil((G[x][z] + 8) / 4);              // at least two storeys above the ground under the cell
  H[x][z] = Math.max(tier, floorH);
  tierCount[H[x][z]] = (tierCount[H[x][z]] || 0) + 1;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});
// the entrance: the lowest ground on the north-facing edge, three cells wide
const northEdge = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1) && G[x][z] <= 2 && H[x][z] >= 16) northEdge.push([x, z]);
const mid = northEdge.length ? northEdge[northEdge.length >> 1] : null;
const entrance = new Set();
if (mid) for (const [x, z] of northEdge) if (Math.abs(x - mid[0]) <= 1 && z === mid[1]) entrance.add(`${x},${z}`);
const entranceMid = mid ? `${mid[0]},${mid[1]}` : null;

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
  // roof slab on the top of the cell, a parapet on the outside ring
  g.set(x, top, z, "smooth_stone");
  if (d === 1) g.set(x, top + 1, z, "smooth_quartz");

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and the ground floor)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === gr) { g.set(x, y, z, "polished_andesite"); continue; }        // stone plinth
    const key = `${x},${z}`;
    if (entrance.has(key) && y === gr + 2) { g.set(x, y, z, "smooth_quartz"); continue; }  // lintel over the entrance
    if (entrance.has(key) && y <= gr + 1) {
      if (key === entranceMid) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (y === gr + 1) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });  // hangs from the lintel
      } else {
        g.set(x, y, z, "polished_andesite");
      }
      continue;
    }
    if (y % 4 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }        // floor band
    if (y % 4 === 3) { g.set(x, y, z, "gray_concrete"); continue; }        // spandrel
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const face = ex.includes("N") || ex.includes("S") ? ex.find(k => k === "N" || k === "S") : ex[0];
    const u = face === "N" || face === "S" ? x : z;
    const shopfront = y < gr + 4;                                          // ground storey: shopfront glazing
    if (corner || u % 3 === 0) { g.set(x, y, z, shopfront ? "polished_andesite" : "white_concrete"); continue; }  // piers
    g.set(x, y, z, shopfront ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane", PANE(ex));
    if ((x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1]]);
  }
}

// warm light behind some panes: an interior air cell next to the glass, above the floor slab
for (const [x, y, z] of glowAt) if (inside(x, z) && exposed(x, z, y).length === 0 && y % 4 !== 0) g.set(x, y, z, "glowstone");

// roof plant: 3x3 screen blocks on the core (a 2-high plant room, each on a flat core roof), and a lift core
for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
  if (x % 9 !== 4 || z % 9 !== 4) continue;
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!inside(x + dx, z + dz) || H[x + dx][z + dz] !== 44 || dist[x + dx][z + dz] < 3) ok = false;
  if (!ok) continue;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    for (let y = 45; y <= 46; y++) g.set(x + dx, y, z + dz, y === 46 ? "smooth_quartz" : "light_gray_concrete");
  }
}
let lift = null;
for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) {
  let ok = true;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (!inside(x + dx, z + dz) || H[x + dx][z + dz] !== 44 || dist[x + dx][z + dz] < 5) ok = false;
  if (ok && (!lift || dist[x][z] > dist[lift[0]][lift[1]])) lift = [x, z];
}
if (lift) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 45; y <= 47; y++) g.set(lift[0] + dx, y, lift[1] + dz, y === 47 ? "smooth_quartz" : "light_gray_concrete");

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058265.nbt");
console.log(JSON.stringify({ tiers: tierCount, entrance: [...entrance], lift, glow: glowAt.length, ...stats }));
