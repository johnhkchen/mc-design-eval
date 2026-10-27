// Science Centre 303, Auckland (way 155771484): a 1970s-80s concrete-frame institutional block on a basalt plinth, a stepped
// tower over lower wings. Lidar roofs are median-smoothed and snapped to the 4-block storey grid, so the massing is a run of
// flat terraces (8 at the edges, 20-24 wings, 28-52 stepping up the core, a crown of 56). Facade: basalt base course, a
// smooth-stone floor line every storey, light-grey spandrels, white concrete piers every 4 cells, tinted blue glass panes
// with glowstone behind some of them. The lowest boundary cell with a run of three on its face takes a three-wide entrance
// (door, glazed flanks, a concrete lintel as the canopy). Roof plant: 3x3 louvre boxes on the core with a shroomlight crown.
// Foundations are solid stone from y 0 up to each cell's ground; interiors are air with a slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_155771484.cells.json", "utf8"));
const W = 116, D = 85, TOP = 68;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
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

// median-smoothed roof, snapped to the storey grid; at least one storey above the cell's own ground
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const snap4 = (v) => 4 * Math.round(v / 4);
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const h = Math.max(8, snap4(median(x, z)), 4 * Math.ceil((G[x][z] + 4) / 4));
  H[x][z] = h;
}
// lidar peaks one or two cells wide read as spikes: a tower cell stays at its tier only while two of its neighbours stand
// at least a storey as high; otherwise it steps down a storey (never below its ground + a storey), until the tiers hold
const floorOf = (x, z) => 4 * Math.ceil((G[x][z] + 4) / 4);
for (let pass = 0, changed = true; changed && pass < 20; pass++) {
  changed = false;
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    if (!inside(x, z) || H[x][z] < 28) continue;
    const h = H[x][z];
    const held = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => inside(x + dx, z + dz) && H[x + dx][z + dz] >= h - 4).length;
    if (held < 2 && h - 4 >= floorOf(x, z)) { H[x][z] = h - 4; changed = true; }
  }
}
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) tierCount[H[x][z]] = (tierCount[H[x][z]] || 0) + 1;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});
// the entrance: a boundary cell (with two boundary neighbours along the same face) at the lowest ground
const faceOf = (x, z) => Object.keys(DIRS).filter(k => !inside(x + DIRS[k][0], z + DIRS[k][1]));
let entry = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || H[x][z] < 8) continue;
  const faces = faceOf(x, z); if (!faces.length) continue;
  const k = faces[0], along = k === "N" || k === "S" ? [1, 0] : [0, 1];
  const ok = [1, -1].every(s => inside(x + s * along[0], z + s * along[1]) && faceOf(x + s * along[0], z + s * along[1]).includes(k));
  if (!ok) continue;
  const score = G[x][z] * 100 + H[x][z];
  if (!entry || score < entry.score) entry = { x, z, k, along, score };
}
const entryRole = new Map();
if (entry) {
  entryRole.set(`${entry.x},${entry.z}`, "door");
  for (const s of [1, -1]) entryRole.set(`${entry.x + s * entry.along[0]},${entry.z + s * entry.along[1]}`, "flank");
}

const g = new Voxels([W, TOP, D]);
const PANE = (dirs) => (dirs.includes("N") || dirs.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glowAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z];
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // roof slab on the top of the cell; a parapet wherever the roof edge is open (outside, or a lower terrace beside it)
  g.set(x, top, z, "smooth_stone");
  const openEdge = Object.keys(DIRS).some(k => !inside(x + DIRS[k][0], z + DIRS[k][1]) || H[x + DIRS[k][0]][z + DIRS[k][1]] < top);
  if (openEdge) g.set(x, top + 1, z, "light_gray_concrete");

  const role = entryRole.get(`${x},${z}`);
  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and the ground floor)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (role === "door" && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "dark_oak_door", { facing: FACING[entry.k], half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (role && (y === gr || y === gr + 1)) { g.set(x, y, z, "light_blue_stained_glass_pane", PANE([entry.k])); continue; }   // door flanks: glazed
    if (role && y === gr + 2) { g.set(x, y, z, "white_concrete"); continue; }                                                  // canopy lintel over the entrance
    if (y === gr) { g.set(x, y, z, "blackstone"); continue; }     // basalt plinth course
    if (y % 4 === 0) { g.set(x, y, z, "smooth_stone"); continue; }   // floor line
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }   // spandrel
    const ns = ex.find(k => k === "N" || k === "S");
    const corner = ns && ex.some(k => k === "E" || k === "W");
    const face = ns || ex[0];
    const u = ns ? x : z;
    if (corner || u % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // concrete pier
    g.set(x, y, z, "light_blue_stained_glass_pane", PANE(ex));
    if ((x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1]]);
  }
}

// warm light behind some panes: an interior air cell next to the glass, standing off the floor slab
for (const [x, y, z] of glowAt) if (inside(x, z) && exposed(x, z, y).length === 0 && y % 4 !== 0) g.set(x, y, z, "glowstone");

// roof plant: 3x3 louvred boxes on the core tiers (all nine cells on the same roof), with a shroomlight crown
let plant = 0;
for (let x = 4; x < W - 4; x += 1) for (let z = 4; z < D - 4; z += 1) {
  if (x % 9 !== 4 || z % 9 !== 4) continue;
  const hc = H[x][z];
  if (hc < 44) continue;
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (H[x + dx][z + dz] !== hc || dist[x + dx][z + dz] < 3) ok = false;
  if (!ok) continue;
  plant++;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    g.set(x + dx, hc + 1, z + dz, "light_gray_concrete");
    g.set(x + dx, hc + 2, z + dz, dx === 0 && dz === 0 ? "iron_block" : "light_gray_concrete");
  }
  g.set(x, hc + 3, z, "shroomlight");
}

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_155771484.nbt");
console.log(JSON.stringify({ tiers: tierCount, entry: entry && { x: entry.x, z: entry.z, face: entry.k }, plant, glow: glowAt.length, ...stats }));
