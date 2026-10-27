// Forte Apartments, Auckland (way 154109409): a late-1990s/2000s concrete-frame apartment tower, fifteen storeys of 4 blocks
// on a basalt plinth, over a two-storey podium on the low wings. The lidar roof is median-smoothed (3x3) and snapped to the
// storey grid: a 60 crown in the core (the penthouse storey, at least 3 cells in from the edge), a 56 slab over most of the
// plan, 40 on the lower wings, 8 on the low edges. The facade is a 4-block storey rhythm: a quartz floor line, two rows of
// glass in light-blue panes between quartz piers, a grey spandrel, a dark-oak entrance on the north face with a glass lobby,
// glowstone behind some panes. Interiors are air with a floor slab per storey; roof plant sits on the crown.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154109409.cells.json", "utf8"));
const W = 37, D = 33, TOP = 73;
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

// median-smoothed roof, then flat tiers on the storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));   // top of the cell's roof covering (y)
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const m = median(x, z), d = dist[x][z];
  const tier = m >= 58 && d >= 3 ? 60 : m >= 50 ? 56 : m >= 30 ? 40 : 8;
  H[x][z] = Math.max(tier, 4 * Math.ceil((G[x][z] + 4) / 4));   // at least one storey above the ground under the cell
  tierCount[H[x][z]] = (tierCount[H[x][z]] || 0) + 1;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});
// the entrance: the middle of the north run of street-level cells on the tower's full-height side
const northEdge = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1) && G[x][z] <= 1 && H[x][z] >= 40) northEdge.push([x, z]);
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
  // foundation: solid from y 0 up to the ground, so nothing floats on the slope
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // roof covering on the top of the cell; a parapet on the outer ring
  g.set(x, top, z, "smooth_stone");
  if (d === 1) g.set(x, top + 1, z, "quartz_block");

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and the ground floor)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === gr) { g.set(x, y, z, "polished_blackstone_bricks"); continue; }   // basalt plinth
    if (entrance.has(`${x},${z}`) && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (entrance.has(`${x},${z}`) && y === gr + 2) { g.set(x, y, z, "quartz_block"); continue; }   // door head
    if (y % 4 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }     // floor line
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const face = ex.includes("N") || ex.includes("S") ? ex.find(k => k === "N" || k === "S") : ex[0];
    const u = face === "N" || face === "S" ? x : z;
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }     // spandrel
    if (corner || u % 3 === 0) { g.set(x, y, z, "quartz_pillar", { axis: "y" }); continue; }   // pier
    g.set(x, y, z, "light_blue_stained_glass_pane", PANE(ex));
    if ((x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1]]);
  }
}

// warm light behind some panes: an interior air cell beside the glass, above the floor slab
for (const [x, y, z] of glowAt) if (inside(x, z) && exposed(x, z, y).length === 0 && y % 4 !== 0) g.set(x, y, z, "glowstone");

// roof plant on the crown: a 3 x 3 lift overrun on the highest interior spot, and air-handling boxes around it
let lift = null;
for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) {
  let ok = true;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (!inside(x + dx, z + dz) || H[x + dx][z + dz] !== 60 || dist[x + dx][z + dz] < 3) ok = false;
  if (ok && (!lift || dist[x][z] > dist[lift[0]][lift[1]])) lift = [x, z];
}
if (lift) {
  const [lx, lz] = lift;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 61; y <= 63; y++) g.set(lx + dx, y, lz + dz, y === 63 ? "smooth_stone" : "light_gray_concrete");
  for (const [dx, dz] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) {
    const x = lx + dx, z = lz + dz;
    if (inside(x, z) && H[x][z] === 60) for (let y = 61; y <= 62; y++) g.set(x, y, z, y === 62 ? "iron_bars" : "light_gray_concrete");
  }
}
for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
  if (x % 7 !== 3 || z % 7 !== 3 || !inside(x, z) || H[x][z] !== 60 || dist[x][z] < 4) continue;
  if (lift && Math.abs(x - lift[0]) <= 4 && Math.abs(z - lift[1]) <= 4) continue;
  g.set(x, 61, z, "light_gray_concrete");
}

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154109409.nbt");
console.log(JSON.stringify({ tiers: tierCount, entrance: [...entrance], lift, glow: glowAt.length, ...stats }));
