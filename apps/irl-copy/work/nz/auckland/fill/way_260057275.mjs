// Hotel Grand Chancellor, Auckland (way 260057275): a 1980s-era concrete-frame hotel tower, about 13 storeys (4-block
// storeys) over a quartz-and-basalt base. The lidar roof sits at 54-55 blocks almost everywhere (smoothed by a 3x3 median
// and tiered), so the massing is one slab on the storey grid: a lower 48 wing on the few cells that read 49-50, and a
// 12-block lobby block where the lidar's single low cell sits. Facade: basalt plinth, blue-glass ribbon with white
// concrete piers, quartz floor lines, grey spandrels, a three-bay recessed entrance on the north face with a quartz lintel
// and lanterns, glowstone behind some panes. Roof: a parapet ring, plant screens and a lift core on the top tier.
// Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260057275.cells.json", "utf8"));
const W = 44, D = 48, TOP = 68;
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

// median-smoothed roof, then tiers on the storey grid: the tower slab (54), a 48 wing, a 12 lobby block
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const m = median(x, z);
  const tier = m >= 52 ? 54 : m >= 45 ? 48 : 12;
  H[x][z] = Math.max(tier, 8);                                   // at least the two-storey base
  tierCount[H[x][z]] = (tierCount[H[x][z]] || 0) + 1;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});

// the north entrance: the middle of the north run at street level (lowest ground, outside edge)
const northEdge = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1) && G[x][z] <= 2 && H[x][z] >= 48) northEdge.push([x, z]);
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
  // roof slab on the top of the cell; a parapet on the outside ring of the tower
  g.set(x, top, z, "smooth_stone");
  if (d === 1 && top === 54) { g.set(x, top, z, "white_concrete"); g.set(x, top + 1, z, "white_concrete"); }

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and the ground floor)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === gr) { g.set(x, y, z, "blackstone"); continue; }                // basalt plinth
    if (entrance.has(`${x},${z}`)) {
      if (y === gr || y === gr + 1) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === gr + 2) { g.set(x, y, z, "smooth_quartz"); continue; }   // lintel over the three-bay entrance
      if (y === gr + 3) { g.set(x, y, z, "smooth_quartz_slab", { type: "top" }); continue; }
    }
    if (y % 4 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }       // floor line
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const face = ex.includes("N") || ex.includes("S") ? ex.find(k => k === "N" || k === "S") : ex[0];
    const u = face === "N" || face === "S" ? x : z;
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }  // pale spandrel (the dark one read as black stripes)
    if (corner || u % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // concrete pier
    if (y < gr + 4 && d === 1) { g.set(x, y, z, "light_blue_stained_glass"); continue; }   // shopfront glass on the base
    g.set(x, y, z, "light_blue_stained_glass_pane", PANE(ex));
    if ((x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1], face]);
  }
}

// warm light behind some panes: an interior air cell next to the glass, standing on the floor slab
for (const [x, y, z] of glowAt) if (inside(x, z) && exposed(x, z, y).length === 0 && y % 4 !== 0) g.set(x, y, z, "glowstone");

// the entrance's two lanterns stand on the foyer floor either side of the door, inside the footprint
if (mid) {
  for (const dx of [-2, 2]) {
    const lx = mid[0] + dx, lz = mid[1] + 1;
    if (inside(lx, lz) && G[lx][lz] <= 2) g.set(lx, G[lx][lz] + 1, lz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// roof plant: screen rings on the top tier's core, and a lift core on the highest interior spot
for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
  if (x % 11 !== 5 || z % 11 !== 5) continue;
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (H[x + dx][z + dz] !== 54 || dist[x + dx][z + dz] < 3) ok = false;
  if (!ok) continue;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (dx === 0 && dz === 0) continue;
    for (let y = 55; y <= 56; y++) g.set(x + dx, y, z + dz, "light_gray_concrete");
  }
}
let lift = null;
for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) {
  let ok = true;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (H[x + dx][z + dz] !== 54 || dist[x + dx][z + dz] < 5) ok = false;
  if (ok && (!lift || dist[x][z] > dist[lift[0]][lift[1]])) lift = [x, z];
}
if (lift) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 55; y <= 57; y++) g.set(lift[0] + dx, y, lift[1] + dz, y === 57 ? "white_concrete" : "light_gray_concrete");

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260057275.nbt");
console.log(JSON.stringify({ tiers: tierCount, entrance: [...entrance], lift, glow: glowAt.length, ...stats }));
