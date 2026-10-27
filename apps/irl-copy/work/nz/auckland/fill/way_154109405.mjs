// Oxford Apartments (way 154109405), Auckland: a 1970s-80s concrete-frame apartment tower, 13-14 storeys on a
// 35 x 48 footprint, read from the lidar roof. Roof heights are median-smoothed and snapped to a 4-block storey grid:
// a 56 crown (the high core), a 52 slab over the west and centre, a 40 and 32 setback, 24 and 16 shoulders, 12 wings.
// Each footprint cell is a solid column from y 0 to its roof (foundation below its ground), so every tier stands on
// what is below. The lowest 8 blocks of a tall cell are a stone-brick podium with a shopfront on the ground storey.
// Facades: a 4-block storey rhythm (white concrete floor lines, light-grey lintels, glass panes between white piers
// every 3 blocks), a parapet on the roof edge, dark-oak double doors on the north face, glowstone behind some panes.
// Interiors are air with a floor slab per storey; the roof membrane and small plant boxes sit on the lower tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154109405.cells.json", "utf8"));
const W = 35, D = 48, TOP = 56;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];

// edge distance (1 on the outside ring), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz))) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed roof, snapped to storey tiers (the crown reads as the setback core, the 12s as wings)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (r) => r >= 55 ? 56 : r >= 46 ? 52 : r >= 36 ? 40 : r >= 28 ? 32 : r >= 20 ? 24 : r >= 15 ? 16 : r >= 11 ? 12 : 8;
const T = Array.from({ length: W }, () => Array(D).fill(0));
const footprint = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) { T[x][z] = tierOf(median(x, z)); footprint.push([x, z]); }

// faces of a cell exposed at height y: outside the footprint first, then beside a neighbour whose roof stops below y
const exposed = (x, z, y) => {
  const out = [], low = [];
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inside(nx, nz)) out.push([dx, dz]);
    else if (T[nx][nz] <= y) low.push([dx, dz]);
  }
  return [...out, ...low];
};
// storey floor lines: the ground, then every 4 blocks that leaves a full storey above the ground floor
const floors = (x, z) => {
  const g = G[x][z], t = T[x][z], f = [g];
  for (let k = 4; k <= t - 4; k += 4) if (k >= g + 4) f.push(k);
  return f;
};
const storey = (x, z, y) => {
  const F = floors(x, z), t = T[x][z];
  let i = 0;
  while (i + 1 < F.length && F[i + 1] <= y) i++;
  const f = F[i], next = F[i + 1] ?? t;
  return { f, h: next - f, rel: y - f, ground: i === 0 };
};

// the block list: one entry per voxel, { x, y, z, b, axis?, out?, st? }
const B = new Map();
const k = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, b, o = {}) => B.set(k(x, y, z), { x, y, z, b, ...o });
const has = (x, y, z) => B.has(k(x, y, z));

for (const [x, z] of footprint) {
  const g = G[x][z], t = T[x][z];
  for (let y = 0; y < g; y++) put(x, y, z, "polished_basalt");
  const parapetEdge = exposed(x, z, t - 1).length > 0;
  for (let y = g; y < t; y++) {
    if (y === t - 1) { put(x, y, z, parapetEdge ? "smooth_quartz" : "gray_concrete"); continue; }
    const ex = exposed(x, z, y);
    const perimeter = dist[x][z] === 1;
    if (!perimeter && ex.length === 0) {
      if (floors(x, z).includes(y)) put(x, y, z, "smooth_stone");    // a floor slab, air between
      continue;
    }
    const [dx, dz] = ex[0];
    const axis = dz !== 0 ? "x" : "z";                              // the wall runs along x on a north or south face
    const u = axis === "x" ? x : z;                                  // position along the wall, piers every 3 blocks
    const { h, rel, ground } = storey(x, z, y);
    const podium = t >= 40 && y < 8;
    const glass = { axis, out: perimeter ? [dx, dz] : null };
    if (rel === 0) put(x, y, z, ground ? "polished_basalt" : "white_concrete");
    else if (rel === h - 1) put(x, y, z, "light_gray_concrete");
    else if (podium && !(ground && u % 3 !== 0)) put(x, y, z, "stone_bricks");
    else if (u % 3 === 0) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", glass);
  }
}

// the two-leaf entrance on the north face, in the ground storey's glass
{
  const eg = G[4][0];
  const st = (half, hinge) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
  put(4, eg + 1, 0, "dark_oak_door", { st: st("lower", "left") });
  put(4, eg + 2, 0, "dark_oak_door", { st: st("upper", "left") });
  put(5, eg + 1, 0, "dark_oak_door", { st: st("lower", "right") });
  put(5, eg + 2, 0, "dark_oak_door", { st: st("upper", "right") });
}

// plant boxes on the lower roofs: a 2 x 2 light-grey box with a stone cap, clear of the parapet
for (const [x, z] of footprint) {
  const t = T[x][z];
  if (t > 40 || dist[x][z] < 3 || x % 8 !== 5 || z % 8 !== 5) continue;
  const cluster = [[x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!cluster.every(([a, c]) => inside(a, c) && T[a][c] === t && dist[a][c] >= 3)) continue;
  for (const [a, c] of [[x, z], ...cluster]) { put(a, t, c, "light_gray_concrete"); put(a, t + 1, c, "smooth_stone"); }
}

// warm light behind some outward panes: a glowstone in the room one step in, on its floor slab
for (const e of [...B.values()]) {
  if (!e.axis || !e.out || e.y !== storey(e.x, e.z, e.y).f + 1) continue;
  const ix = e.x - e.out[0], iz = e.z - e.out[1];
  if (!inside(ix, iz) || has(ix, e.y, iz) || !B.get(k(ix, e.y - 1, iz))) continue;
  if ((e.x * 7 + e.y * 13 + e.z * 3) % 5 === 0) put(ix, e.y, iz, "glowstone");
}

// glass panes connect to their neighbours along the wall (piers, panes, doors excluded)
for (const e of B.values()) {
  if (!e.axis) continue;
  const nb = e.axis === "x" ? [[e.x - 1, e.z], [e.x + 1, e.z]] : [[e.x, e.z - 1], [e.x, e.z + 1]];
  const link = ([a, c]) => { const n = B.get(k(a, e.y, c)); return n && n.b !== "dark_oak_door" ? "true" : "false"; };
  const [a, b] = nb.map(link);
  e.st = e.axis === "x"
    ? { north: "false", east: b, south: "false", west: a, waterlogged: "false" }
    : { north: a, east: "false", south: b, west: "false", waterlogged: "false" };
}

const g = new Voxels([W, TOP, D]);
for (const e of B.values()) g.set(e.x, e.y, e.z, e.b, e.st);
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154109405.nbt";
const r = g.save(out);
console.log(`way_154109405: ${r.blocks} blocks, palette ${r.palette}, footprint ${footprint.length} cells, tiers ${[...new Set(footprint.map(([x, z]) => T[x][z]))].sort((p, q) => p - q).join("/")}`);
