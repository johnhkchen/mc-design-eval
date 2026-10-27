// Wherescape, Auckland CBD (way 160068967): a 1980s-style concrete-frame office block, eight storeys at the top of a
// 61 x 94 footprint, with lower wings. The lidar roof is median-smoothed, snapped to a 4-block storey grid (4 to 32) and
// mode-filtered, so the massing reads as clean flat tiers: the tall core, setbacks stepping down to the wings, a one-storey
// annex on the low edges. Facade: a 4-block storey rhythm (white belt at each floor line, glass ribbon between white
// piers every 4 blocks, light-grey spandrel), a basalt-grey plinth, a full-height shopfront on the ground storey with a
// lintel, a dark-oak entrance on the street face, a grey membrane roof with a white parapet on the outer ring, and a lift
// core and plant screens on the top tier. Glowstone behind some panes. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_160068967.cells.json", "utf8"));
const W = 61, D = 94, TOP = 45;
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

// lidar: 3 x 3 median, then snapped to the storey grid (4 blocks, 4 to 32 high)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
let T = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z))
  T[x][z] = Math.min(32, Math.max(4, 4 * Math.round(median(x, z) / 4)));

// mode filter over the 3 x 3 neighbourhood (ties keep the cell's own tier): clean flat tiers, no single-cell speckle
for (let pass = 0; pass < 2; pass++) {
  const next = T.map(col => col.slice());
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
    const count = new Map();
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) {
      const t = T[x + dx][z + dz]; count.set(t, (count.get(t) || 0) + 1);
    }
    let best = T[x][z];
    for (const [t, n] of count) if (n > (count.get(best) || 0)) best = t;
    next[x][z] = best;
  }
  T = next;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || T[nx][nz] <= y;
});

// the street entrance: a north-facing edge near the middle of the footprint, at the lowest ground
let entrance = null;
{
  const cand = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++)
    if (inside(x, z) && !inside(x, z - 1) && G[x][z] <= 1 && T[x][z] >= 8) cand.push([x, z]);
  if (cand.length) {
    const xs = cand.map(c => c[0]).sort((a, b) => a - b), mid = xs[xs.length >> 1];
    entrance = cand.reduce((best, c) => (Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best));
  }
}
const entranceKey = entrance ? `${entrance[0]},${entrance[1]}` : null;

const g = new Voxels([W, TOP, D]);
const PANE = (face) => (face === "N" || face === "S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glowAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = T[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_andesite");

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    // roof membrane on the top course of every column
    if (y === top - 1) { g.set(x, y, z, "gray_concrete"); continue; }
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and the ground floor)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const face = ex.includes("N") || ex.includes("S") ? ex.find(k => k === "N" || k === "S") : ex[0];
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const u = face === "N" || face === "S" ? x : z;
    const ground = y < 4;                                   // the shopfront storey
    if (y === gr && !ground) { g.set(x, y, z, "polished_andesite"); continue; }   // plinth course above the foundation
    if (ground && y === gr && entranceKey === `${x},${z}`) {
      g.set(x, y, z, "dark_oak_door", { facing: face === "N" ? "north" : face === "S" ? "south" : face === "E" ? "east" : "west", half: "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (ground && y === gr + 1 && entranceKey === `${x},${z}`) {
      g.set(x, y, z, "dark_oak_door", { facing: face === "N" ? "north" : face === "S" ? "south" : face === "E" ? "east" : "west", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (ground) {
      if (y === 3) { g.set(x, y, z, "polished_andesite"); continue; }   // lintel over the shopfront
      if (corner || u % 4 === 0) { g.set(x, y, z, "gray_concrete"); continue; }   // shopfront piers
      g.set(x, y, z, "light_blue_stained_glass_pane", PANE(face));
      continue;
    }
    if (y % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }    // floor belt
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }   // spandrel
    if (corner || u % 4 === 1) { g.set(x, y, z, "white_concrete"); continue; }   // pier
    g.set(x, y, z, "light_blue_stained_glass_pane", PANE(face));
    if ((x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1], x, y, z]);
  }

  // parapet on the outer ring, standing on the roof membrane
  if (d === 1 && top < TOP) g.set(x, top, z, "white_concrete");
}

// warm light behind some panes: an interior air cell next to the glass, off the floor slab
for (const [x, y, z] of glowAt) if (inside(x, z) && y % 4 !== 0 && exposed(x, z, y).length === 0) g.set(x, y, z, "glowstone");

// roof plant: a lift core on the highest interior spot of the top tier, and screens over the top tier's other cores
let lift = null;
for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) {
  let ok = true;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (T[x + dx][z + dz] !== 32 || dist[x + dx][z + dz] < 4) ok = false;
  if (ok && (!lift || dist[x][z] > dist[lift[0]][lift[1]])) lift = [x, z];
}
if (lift) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 32; y <= 34; y++) {
  g.set(lift[0] + dx, y, lift[1] + dz, y === 34 ? "white_concrete" : "light_gray_concrete");
}
// one plant plate: a 6 x 4 block of screened plant on the top tier, two courses high with a white cap, clear of the lift
let plant = null;
for (let x = 2; x < W - 6 && !plant; x++) for (let z = 2; z < D - 4 && !plant; z++) {
  let ok = true;
  for (let dx = 0; dx < 6 && ok; dx++) for (let dz = 0; dz < 4 && ok; dz++)
    if (T[x + dx][z + dz] !== 32 || dist[x + dx][z + dz] < 4) ok = false;
  if (ok && lift && Math.abs(x + 2 - lift[0]) <= 4 && Math.abs(z + 1 - lift[1]) <= 4) ok = false;
  if (ok) plant = [x, z];
}
if (plant) for (let dx = 0; dx < 6; dx++) for (let dz = 0; dz < 4; dz++) {
  g.set(plant[0] + dx, 32, plant[1] + dz, "light_gray_concrete");
  g.set(plant[0] + dx, 33, plant[1] + dz, (dx + dz) % 2 ? "light_gray_concrete" : "white_concrete");
}

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) tierCount[T[x][z]] = (tierCount[T[x][z]] || 0) + 1;
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_160068967.nbt");
console.log(JSON.stringify({ tiers: tierCount, entrance, lift, plant, glow: glowAt.length, ...stats }));
