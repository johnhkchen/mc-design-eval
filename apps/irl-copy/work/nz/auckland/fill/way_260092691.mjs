// WB Building, Auckland (way 260092691): a 1930s-50s brick-and-concrete commercial block of four storeys on a basalt
// plinth, with a tower core rising to the 20-block roof over a stepped setback ring and 12/16 wings. Lidar roof heights
// are median-smoothed and snapped to a 4-block storey grid (>=19 crown, >=14 16-block wing, >=10 12-block podium), and
// the crown steps back to 16 in its outer two cells. Ground floor: a shopfront of glass with brick piers on the basalt
// plinth, the entrance on the north face with a hood band over the door. Upper floors: brick piers, glass panes in
// the middle rows, a tuff spandrel and a smooth-stone string course at each floor line, a smooth-stone cornice under
// a brick parapet. Glowstone sits on some floor slabs behind the glass; the roof carries a plant room and a lift core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260092691.cells.json", "utf8"));
const W = 40, D = 45, TOP = 28;
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

// median-smoothed roof, snapped to the storey grid; the crown steps back to the 16 wing in its outer two rings
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z), d = dist[x][z];
  let tier = r >= 19 ? 20 : r >= 14 ? 16 : r >= 10 ? 12 : 8;
  if (tier === 20 && d <= 2) tier = 16;                       // setback terrace round the crown
  const floorH = 4 * Math.ceil((G[x][z] + 4) / 4);             // at least one storey above the ground under the cell
  H[x][z] = Math.max(tier, floorH);
  tierCount[H[x][z]] = (tierCount[H[x][z]] || 0) + 1;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});

// the entrance: the middle of the north run at street level, one door cell with glazing either side
const northEdge = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1) && G[x][z] <= 2 && H[x][z] >= 8) northEdge.push([x, z]);
const mid = northEdge.length ? northEdge[northEdge.length >> 1] : null;
const door = mid ? `${mid[0]},${mid[1]}` : null;
const bay = new Set();
if (mid) for (const [x, z] of northEdge) if (Math.abs(x - mid[0]) <= 1 && z === mid[1]) bay.add(`${x},${z}`);

const g = new Voxels([W, TOP, D]);
// pane connections follow the wall: a north/south face runs east-west
const PANE = (dirs) => (dirs.includes("N") || dirs.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glowAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // roof surface on top of the cell; a brick parapet on the outside ring
  g.set(x, top, z, "smooth_stone");
  if (d === 1) g.set(x, top + 1, z, "bricks");

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab at each storey line (and the ground floor)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const key = `${x},${z}`;
    if (y === gr) { g.set(x, y, z, "polished_blackstone"); continue; }          // basalt plinth
    if (key === door && (y === gr + 1 || y === gr + 2)) {                        // the door, two cells high on the plinth
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (bay.has(key) && y === gr + 3) { g.set(x, y, z, "smooth_stone"); continue; }   // hood band across the entrance bay
    if (y === top - 1) { g.set(x, y, z, "smooth_stone"); continue; }             // cornice under the roof
    if (y % 4 === 0) { g.set(x, y, z, "smooth_stone"); continue; }             // string course at each floor line
    if (y % 4 === 3) { g.set(x, y, z, "tuff"); continue; }                     // spandrel
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const face = ex.includes("N") || ex.includes("S") ? ex.find(k => k === "N" || k === "S") : ex[0];
    const u = face === "N" || face === "S" ? x : z;
    if (corner || u % 3 === 0) { g.set(x, y, z, "bricks"); continue; }          // piers and the mullions
    g.set(x, y, z, "light_blue_stained_glass_pane", PANE(ex));
    // a warm light on the floor slab, one cell in behind some panes (row 1 of the storey, so it stands on the slab)
    if (y % 4 === 1 && (x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1]]);
  }
}

// warm light behind some panes: an interior air cell standing on its floor slab
for (const [x, y, z] of glowAt) if (inside(x, z) && exposed(x, z, y).length === 0) g.set(x, y, z, "glowstone");

// roof: a plant room (a 3x3 tuff box with a lid) on the crown, and a lift core on its deepest interior spot
let plant = null;
for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
  if (x % 9 !== 4 || z % 9 !== 4) continue;
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (H[x + dx][z + dz] !== 20 || dist[x + dx][z + dz] < 3) ok = false;
  if (ok) { plant = [x, z]; break; }
}
if (plant) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
  g.set(plant[0] + dx, 21, plant[1] + dz, "tuff");
  if (dx || dz) g.set(plant[0] + dx, 22, plant[1] + dz, "tuff");
  g.set(plant[0] + dx, 23, plant[1] + dz, "smooth_stone");                    // the lid
}
let lift = null;
for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) {
  let ok = true;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (H[x + dx][z + dz] !== 20 || dist[x + dx][z + dz] < 5) ok = false;
  if (ok && (!lift || dist[x][z] > dist[lift[0]][lift[1]])) lift = [x, z];
}
if (lift && !(plant && Math.abs(lift[0] - plant[0]) < 4 && Math.abs(lift[1] - plant[1]) < 4)) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (dx === 0 && dz === 0) continue;                                       // the core is an open shaft with a lid
    for (let y = 21; y <= 23; y++) g.set(lift[0] + dx, y, lift[1] + dz, "bricks");
  }
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) g.set(lift[0] + dx, 24, lift[1] + dz, "smooth_stone");
}

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260092691.nbt");
console.log(JSON.stringify({ tiers: tierCount, door, plant, lift, glow: glowAt.length, ...stats }));
