// WB Building, Auckland (way 104475935): a 1970s-80s concrete-frame office block on a basalt plinth, six storeys over a
// setback podium. Lidar roof heights are median-smoothed and snapped to a 4-block storey grid: a crown of 24 at the core
// (more than 5 blocks in from the edge), a 20 ring, 16 wings, 8 low edges. The facade is a 4-block storey rhythm (white
// band at each floor line, glass ribbon with white piers, light-grey spandrel), basalt plinth at the ground, a dark-oak
// entrance on the north face, glowstone behind some panes. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_104475935.cells.json", "utf8"));
const W = 65, D = 68, TOP = 30;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through footprint
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

// median-smoothed roof, then tiers on the storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z), d = dist[x][z];
  let tier = r >= 22 && d >= 5 ? 24 : r >= 20 ? 20 : r >= 14 ? 16 : 8;
  const floorH = 4 * Math.ceil((G[x][z] + 4) / 4);           // at least two storeys above the ground under the cell
  H[x][z] = Math.max(tier, floorH);
  tierCount[H[x][z]] = (tierCount[H[x][z]] || 0) + 1;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});
// the outward face of an entrance on the north side: the lowest ground at the street, near the middle of the north run
const northEdge = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1) && G[x][z] <= 2 && H[x][z] >= 8) northEdge.push([x, z]);
const mid = northEdge.length ? northEdge[northEdge.length >> 1] : null;
const entrance = new Set();
if (mid) for (const [x, z] of northEdge) if (Math.abs(x - mid[0]) <= 1 && z === mid[1]) entrance.add(`${x},${z}`);

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
  // roof covering on the top of the cell, parapet on the outside ring
  g.set(x, top, z, "smooth_stone");
  if (d === 1) g.set(x, top + 1, z, "white_concrete");

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and the ground floor)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === gr) { g.set(x, y, z, "blackstone"); continue; }     // basalt plinth
    if (entrance.has(`${x},${z}`) && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // floor line
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const face = ex.includes("N") || ex.includes("S") ? ex.find(k => k === "N" || k === "S") : ex[0];
    const u = face === "N" || face === "S" ? x : z;
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }    // spandrel
    if (corner || u % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // pier
    g.set(x, y, z, "light_blue_stained_glass_pane", PANE(ex));
    if ((x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1]]);
  }
}

// warm light behind some panes: an interior air cell next to the glass, standing on the floor slab
for (const [x, y, z] of glowAt) if (inside(x, z) && exposed(x, z, y).length === 0 && y % 4 !== 0) g.set(x, y, z, "glowstone");

// roof plant: screen rings on the top tier's core, and a lift core on the highest interior spot
for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
  if (x % 11 !== 5 || z % 11 !== 5) continue;
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (H[x + dx][z + dz] !== 24 || dist[x + dx][z + dz] < 3) ok = false;
  if (!ok) continue;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (dx === 0 && dz === 0) continue;
    for (let y = 25; y <= 26; y++) g.set(x + dx, y, z + dz, "light_gray_concrete");
  }
}
let lift = null;
for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) {
  let ok = true;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (H[x + dx][z + dz] !== 24 || dist[x + dx][z + dz] < 5) ok = false;
  if (ok && (!lift || dist[x][z] > dist[lift[0]][lift[1]])) lift = [x, z];
}
if (lift) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 25; y <= 27; y++) g.set(lift[0] + dx, y, lift[1] + dz, y === 27 ? "white_concrete" : "light_gray_concrete");

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_104475935.nbt");
console.log(JSON.stringify({ tiers: tierCount, entrance: [...entrance], lift, glow: glowAt.length, ...stats }));
