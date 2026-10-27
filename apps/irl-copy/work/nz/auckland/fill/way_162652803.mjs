// University of Otago House, Auckland (way 162652803): a 1970s-80s concrete-frame institutional office block on a basalt
// plinth, about thirteen storeys (the lidar roof sits 53 blocks above its lowest ground; a storey is 4 blocks, 3.3 m). Lidar
// roof heights are median-snapped to the storey grid and mode-filtered over a 5x5 window, so each tier is one flat level: a tower
// core stepping down through setback tiers to a podium, then low wings. The facade is a 4-block storey rhythm (white floor
// line, glass ribbon between white piers, light-grey spandrel), a full-glass shopfront on the ground storey, a basalt base
// course, a stone-faced entrance on the lowest street side, parapets on every roof edge, and roof plant on the tiers.
// Glowstone behind some panes. Interiors are air with a floor slab per storey; nothing is placed without a block under it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162652803.cells.json", "utf8"));
const W = 71, D = 55, TOP = 66;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, gr, r] of cells) { G[x][z] = gr; R[x][z] = r; }
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

// massing: snap each cell's lidar roof to the storey grid, then the mode of the 3x3 window (ties to the taller), so each
// tier is one flat level; never less than two storeys above the ground under the cell
const snap = (r) => Math.max(8, 4 * Math.round(r / 4));
const mode = (x, z) => {
  const n = new Map();
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) {
    const v = snap(R[x + dx][z + dz]); n.set(v, (n.get(v) || 0) + 1);
  }
  let best = 0, bc = -1;
  for (const [v, c] of n) if (c > bc || (c === bc && v > best)) { best = v; bc = c; }
  return best;
};
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  H[x][z] = Math.max(mode(x, z), 4 * Math.ceil((G[x][z] + 8) / 4));
  tierCount[H[x][z]] = (tierCount[H[x][z]] || 0) + 1;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
// the faces a cell shows at height y: outside the footprint, or beside a neighbour whose column stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] < y;
});

// the entrance: the street face with the lowest ground (at least three tall cells along it), its middle cell and the
// two beside it
const faceCells = { N: [], S: [], W: [], E: [] };
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && H[x][z] >= 12)
  for (const k of Object.keys(DIRS)) { const [dx, dz] = DIRS[k]; if (!inside(x + dx, z + dz)) faceCells[k].push([x, z]); }
const along = (k, [x, z]) => (k === "N" || k === "S" ? x : z);
let door = null, doorFace = null;
for (const k of Object.keys(faceCells)) {
  const list = faceCells[k]; if (list.length < 3) continue;
  const avg = list.reduce((s, [x, z]) => s + G[x][z], 0) / list.length;
  if (!door || avg < door.avg) { door = { k, avg, list }; }
}
const doorSet = new Set();
if (door) {
  const sorted = [...door.list].sort((a, b) => along(door.k, a) - along(door.k, b));
  const mid = sorted[sorted.length >> 1];
  for (const c of sorted) if (Math.abs(along(door.k, c) - along(door.k, mid)) <= 1) doorSet.add(`${c[0]},${c[1]},${door.k}`);
  doorFace = door.k;
}
const isDoor = (x, z, k) => doorSet.has(`${x},${z},${k}`);

const g = new Voxels([W, TOP, D]);
const PANE = (ex) => (ex.includes("N") || ex.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glowAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the ground; roof cap on top of the column
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, top, z, "light_gray_concrete");
  // parapet on every roof edge: outside the footprint, or beside a neighbour whose column stops lower
  const roofEdge = Object.keys(DIRS).some(k => { const [dx, dz] = DIRS[k]; return !inside(x + dx, z + dz) || H[x + dx][z + dz] < top; });
  if (roofEdge) g.set(x, top + 1, z, "white_concrete");
  const firstLine = 4 * Math.ceil((gr + 1) / 4);     // the ground storey runs from gr to the next floor line

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and the ground floor)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const face = ex.find(k => k === "N" || k === "S") || ex[0];
    const doorHere = ex.find(k => isDoor(x, z, k));
    if (doorHere) {
      if (y === gr) { g.set(x, y, z, "dark_oak_door", { facing: FACING[doorHere], half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 1) { g.set(x, y, z, "dark_oak_door", { facing: FACING[doorHere], half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 2) { g.set(x, y, z, "white_concrete"); continue; }    // lintel over the doors
    }
    if (y === gr) { g.set(x, y, z, "polished_blackstone_bricks"); continue; }     // basalt base course
    if (y % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }            // floor line
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const u = face === "N" || face === "S" ? x : z;
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }      // spandrel
    if (corner || u % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; } // pier
    if (y < firstLine) { g.set(x, y, z, "light_blue_stained_glass"); continue; } // ground storey: full-glass shopfront bays
    g.set(x, y, z, "light_blue_stained_glass_pane", PANE(ex));
    const [dx, dz] = DIRS[face];
    glowAt.push([x - dx, y, z - dz, x * 31 + z * 17 + y * 7]);
  }
}

// warm light behind some panes: an interior air cell beside the glass, standing on a floor slab (or the ground)
let glow = 0;
for (const [x, y, z, h] of glowAt) {
  if (h % 9 !== 0 || !inside(x, z) || y % 4 !== 1 || y - 1 < G[x][z]) continue;
  if (exposed(x, z, y).length !== 0) continue;
  g.set(x, y, z, "glowstone"); glow++;
}

// roof plant on the top tier: 3x3 screen plant with a lift core
const topTier = Math.max(...Object.keys(tierCount).map(Number));
for (const T of [topTier]) {
  for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) {
    if (x % 9 !== 4 || z % 9 !== 4) continue;
    let ok = true;
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (H[x + dx][z + dz] !== T || dist[x + dx][z + dz] < 3) ok = false;
    if (!ok) continue;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue;
      for (let y = T + 1; y <= T + 2; y++) g.set(x + dx, y, z + dz, y === T + 2 ? "white_concrete" : "light_gray_concrete");
    }
    for (let y = T + 1; y <= T + 4; y++) g.set(x, y, z, y === T + 4 ? "white_concrete" : "light_gray_concrete");
  }
}

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162652803.nbt");
console.log(JSON.stringify({ tiers: tierCount, entrance: doorFace, doors: doorSet.size, glow, ...stats }));
