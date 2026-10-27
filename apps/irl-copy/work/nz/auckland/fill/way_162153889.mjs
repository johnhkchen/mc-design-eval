// The Beresford (way 162153889), Auckland: a 1930s reinforced-concrete apartment block, seven storeys over a basalt plinth,
// cream plaster and steel windows with terracotta string courses. Lidar roof heights are median-smoothed and snapped to a
// 4-block storey grid on a datum at y 8 (above the highest ground under the footprint): a 36 main roof, a 40 crown on the
// core (3+ cells in from the edge, stepped in from the 36 roof), a 42 lift overrun over the core's middle, and low terraces
// where the lidar is near ground. The facade is a 4-block storey rhythm (terracotta band, two glass rows, spandrel) with
// quartz piers and a parapet on the edge; the entrance is on the north face under a timber canopy, and glowstone sits
// behind some panes. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153889.cells.json", "utf8"));
const W = 65, D = 32, DATUM = 8;
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

// median-smoothed roof, then flat tiers on the storey grid (top = first empty y)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const TOP = Array.from({ length: W }, () => Array(D).fill(0));
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z), d = dist[x][z];
  let top;
  if (r >= 41 && d >= 4) top = 42;                                          // lift overrun on the core
  else if (r >= 37 && d >= 3) top = 40;                                     // crown, stepped in from the edge
  else if (r < 12) top = DATUM;                                             // terrace at the datum
  else top = DATUM + 4 * Math.round((Math.min(r, 36) - DATUM) / 4);        // 12..36 on the storey grid
  TOP[x][z] = top;
  tierCount[top] = (tierCount[top] || 0) + 1;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || TOP[nx][nz] <= y;
});

// the entrance: a bay of three cells on the north face, near the middle of that face, at street level
let entrance = null;
{
  const north = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1)) north.push([x, z]);
  const mean = north.reduce((s, [x]) => s + x, 0) / north.length;
  const ok = ([x, z]) => inside(x - 1, z) && inside(x + 1, z) && !inside(x - 1, z - 1) && !inside(x, z - 1) && !inside(x + 1, z - 1)
    && G[x][z] <= 4 && TOP[x][z] >= 16;
  for (const c of north.filter(ok).sort((a, b) => Math.abs(a[0] - mean) - Math.abs(b[0] - mean))) { entrance = c; break; }
}
const inBay = (x, z) => entrance && z === entrance[1] && Math.abs(x - entrance[0]) <= 1;
const entry = (x, y, z) => inBay(x, z) && y < DATUM + 4;                 // the ground storey's shopfront bay

const PANE = (face) => face === "N" || face === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const isWindowRow = (y) => (y - DATUM) % 4 === 1 || (y - DATUM) % 4 === 2;
const glowAt = [];

const g = new Voxels([W, 55, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = TOP[x][z];
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  for (let y = 0; y < top; y++) {
    if (y < gr) { g.set(x, y, z, "blackstone"); continue; }                  // foundation under the ground
    if (y < DATUM) { g.set(x, y, z, y === top - 1 ? "smooth_stone" : "polished_blackstone_bricks"); continue; }   // basalt plinth / paving
    const ex = exposed(x, z, y);
    if (y === top - 1) { g.set(x, y, z, ex.length ? "stone_bricks" : "light_gray_concrete"); continue; }   // cornice / roof membrane
    if (ex.length) {
      const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
      const face = ex.includes("N") || ex.includes("S") ? ex.find(k => k === "N" || k === "S") : ex[0];
      const u = face === "N" || face === "S" ? x : z;
      const rel = (y - DATUM) % 4;
      if (rel === 0) { g.set(x, y, z, "terracotta"); continue; }                // string course at each floor line
      if (rel === 3) { g.set(x, y, z, face === "N" && entry(x, y, z) ? "dark_oak_planks" : "smooth_quartz"); continue; }   // spandrel; timber canopy over the entrance
      if (face === "N" && entry(x, y, z) && x === entrance[0]) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (corner || (u % 3 === 0 && !entry(x, y, z))) { g.set(x, y, z, "quartz_pillar"); continue; }   // piers
      g.set(x, y, z, "light_blue_stained_glass_pane", PANE(face));
      if ((x * 31 + z * 17 + y * 7) % 9 === 0 && !entry(x, y, z)) glowAt.push([x - DIRS[face][0], z - DIRS[face][1], y]);
      continue;
    }
    if ((y - DATUM) % 4 === 0) g.set(x, y, z, "light_gray_concrete");        // interior floor slab, air above it
  }
  // parapet on the outer edge of the taller tiers
  if (top >= 16 && edge) g.set(x, top, z, "stone_brick_wall");
}

// warm light behind some panes: an interior air cell next to the glass, standing on the floor slab
let glow = 0;
for (const [x, z, y] of glowAt) {
  if (!inside(x, z) || TOP[x][z] - 1 <= y || exposed(x, z, y).length || (y - DATUM) % 4 === 0) continue;
  g.set(x, y, z, "glowstone"); glow++;
}

// roof plant: 2x2x2 air-conditioning boxes on the 36 roof, well in from the edge
let plant = 0;
for (let x = 1; x < W - 2; x++) for (let z = 1; z < D - 2; z++) {
  if (x % 10 !== 4 || z % 8 !== 3) continue;
  let ok = true;
  for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) if (!inside(x + dx, z + dz) || TOP[x + dx][z + dz] !== 36 || dist[x + dx][z + dz] < 3) ok = false;
  if (!ok) continue;
  for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) for (let y = 36; y <= 37; y++) g.set(x + dx, y, z + dz, "light_gray_concrete");
  plant++;
}

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153889.nbt");
console.log(JSON.stringify({ tiers: tierCount, entrance, glow, plant, ...stats }));
