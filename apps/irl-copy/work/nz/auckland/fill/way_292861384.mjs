// Citylife Auckland (way 292861384): a late-1990s glass-and-concrete office tower on a basalt plinth, stepped down
// through a podium to wings. Lidar roof heights are median-smoothed over each cell's footprint neighbours (the 0s and
// 50s are noise at the edges) and snapped to three tiers on the 4-block storey grid: a 104 tower core, a 96 podium
// round it, 84 wings at the edges. Every exterior cell is a solid facade column from its ground to its tier's roof, so
// nothing floats on the slope; white-concrete piers frame light-blue glass panes between light-grey spandrels at each
// floor line; a basalt plinth and shopfront at street level, a dark-oak entrance with a lintel canopy on the longest
// straight face; glowstone on the floor behind some panes; plant boxes on the podium and tower roofs. Interiors are air
// with a floor slab per storey and a roof slab under each tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861384.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861384.nbt";
const W = 40, D = 32, H = 116;

const PLINTH = "polished_basalt", PIER = "white_concrete", SPAND = "light_gray_concrete", ROOF = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane", LAMP = "glowstone", DOOR = "dark_oak_door", PLANT = "light_gray_concrete";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const G = Array.from({ length: W }, () => Array(D).fill(null));     // { g, r } per footprint cell
for (const [x, z, g, r] of cells) G[x][z] = { g, r };
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] !== null;

// lidar roof: median over the footprint neighbours (3x3), ignoring the 0 and near-0 noise cells
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
const smoothRoof = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (inside(x + dx, z + dz) && G[x + dx][z + dz].r >= 20) v.push(G[x + dx][z + dz].r);
  }
  return v.length ? median(v) : 84;
};
// three tiers on the 4-block grid: tower 104, podium 96, wings 84 (and low annexes at their own snapped height)
const tierOf = (s, g) => Math.max(s >= 100 ? 104 : s >= 90 ? 96 : s >= 70 ? 84 : 4 * Math.round(s / 4), g + 4);

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const INWARD = { n: "s", s: "n", w: "e", e: "w" };                   // the side of a cell that faces into the building
const C = Array.from({ length: W }, () => Array(D).fill(null));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  C[x][z] = { x, z, g: G[x][z].g, T: tierOf(smoothRoof(x, z), G[x][z].g) };
}
const cellList = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (C[x][z]) cellList.push(C[x][z]);

// a cell is exterior when a side faces off the footprint or onto a lower tier: its whole column is facade
for (const c of cellList) {
  c.out = [], c.low = [];
  for (const k of ["n", "s", "w", "e"]) {
    const [dx, dz] = DIRS[k], nx = c.x + dx, nz = c.z + dz;
    if (!inside(nx, nz)) c.out.push(k);
    else if (C[nx][nz].T < c.T) c.low.push(k);
  }
  c.exp = [...c.out, ...c.low];
  c.ext = c.exp.length > 0;
  c.corner = c.exp.length >= 2;
  c.dir = c.out[0] ?? c.low[0];                                    // the face the pattern runs along
  c.wallX = c.dir === "n" || c.dir === "s";                        // a north/south face runs along x
}

// the entrance: the longest straight run of single-sided cells on the footprint's edge, its middle cell
const runs = new Map();
for (const c of cellList) {
  if (c.out.length !== 1 || c.low.length) continue;
  const d = c.out[0], along = d === "n" || d === "s" ? c.x : c.z, line = d === "n" || d === "s" ? c.z : c.x;
  const key = `${d}:${line}`;
  if (!runs.has(key)) runs.set(key, []);
  runs.get(key).push({ c, along });
}
let best = null;
for (const [key, list] of runs) {
  list.sort((a, b) => a.along - b.along);
  let start = 0;
  for (let i = 1; i <= list.length; i++) {
    if (i === list.length || list[i].along !== list[i - 1].along + 1) {
      const len = i - start;
      if (!best || len > best.len) best = { len, mid: list[start + Math.floor(len / 2)].c, d: key[0] };
      start = i;
    }
  }
}
const entrance = best.mid;
entrance.entrance = true;

// the facade of one exterior cell at height y
function facade(c, y) {
  const { g, T } = c;
  if (c.entrance && (y === g || y === g + 1)) return { block: DOOR, state: { facing: best.d === "n" ? "north" : best.d === "s" ? "south" : best.d === "w" ? "west" : "east", half: y === g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  if (y === T - 1) return { block: PIER };                       // parapet
  if (y === T - 2) return { block: SPAND };                      // cornice
  if (y < 4) {
    if (y === g) return { block: PLINTH };                       // basalt base course
    if (y === 3) return { block: SPAND };                        // ground-floor transom
    if (c.corner) return { block: PIER };
    const along = c.wallX ? c.x : c.z;
    return along % 3 === 0 ? { block: PLINTH } : glass(c);       // shopfront: basalt piers, glazed bays
  }
  if (y % 4 === 0 || y % 4 === 3) return { block: SPAND };       // floor line and head spandrel
  if (c.corner) return { block: PIER };
  const along = c.wallX ? c.x : c.z;
  return along % 3 === 0 ? { block: PIER } : glass(c);            // window bay: piers of 1, panes of 2
}
// a pane connects along its wall to its neighbours
function glass(c) {
  const s = c.wallX
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  return { block: GLASS, state: { ...s, waterlogged: "false" } };
}

const size = [W, H, D];
const v = new Voxels(size);
const put = (x, y, z, b) => { if (b.block) v.set(x, y, z, b.block, b.state); };

// every footprint cell: basalt foundation up to its ground, then the facade (exterior) or the air-and-slabs interior
for (const c of cellList) {
  const { x, z, g, T } = c;
  for (let y = 0; y < g; y++) v.set(x, y, z, PLINTH);
  for (let y = g; y < T; y++) {
    if (c.ext) { put(x, y, z, facade(c, y)); continue; }
    if (y === T - 1) v.set(x, y, z, ROOF);
    else if (y === g || (y % 4 === 0 && y > g)) v.set(x, y, z, SPAND);      // a floor slab per storey
  }
}

// warm light: glowstone on the floor just inside some window bays (the bay's floor slab is under it)
let lamps = 0;
for (const c of cellList) {
  if (!c.ext || c.corner || c.exp.length !== 1) continue;
  for (let y = 5; y < c.T - 2; y += 4) {
    const along = c.wallX ? c.x : c.z;                             // y is the bay's lower row: the lamp stands on the slab at y - 1
    if (along % 3 === 0 || c.entrance) continue;
    if (((along + (y >> 2) * 5) % 13) !== 0) continue;             // about one bay in thirteen, not a rash of them
    const [ix, iz] = DIRS[INWARD[c.exp[0]]];
    const ax = c.x + ix, az = c.z + iz;
    if (!inside(ax, az) || C[ax][az].ext || C[ax][az].T <= y) continue;
    v.set(ax, y, az, LAMP); lamps++;
  }
}

// roof plant: two small boxes on the podium roof, one 3x3 box on the tower roof (each sits on its roof slab)
const interiorAt = (x, z, T) => inside(x, z) && C[x][z].T === T && !C[x][z].ext;
const clearSquare = (x, z, r, T) => { for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (!interiorAt(x + dx, z + dz, T)) return false; return true; };
const plant = (T, r, h, pickNear) => {
  const picks = [];
  for (const c of cellList) if (clearSquare(c.x, c.z, r, T)) picks.push(c);
  if (!picks.length) return [];
  const [ax, az] = pickNear;
  picks.sort((a, b) => Math.hypot(a.x - ax, a.z - az) - Math.hypot(b.x - ax, b.z - az));
  const p = picks[0];
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) for (let k = 0; k < h; k++) v.set(p.x + dx, T + k, p.z + dz, PLANT);
  return [p];
};
const centroid = (T) => { const l = cellList.filter((c) => c.T === T); return [l.reduce((s, c) => s + c.x, 0) / l.length, l.reduce((s, c) => s + c.z, 0) / l.length]; };
plant(104, 1, 2, centroid(104));
plant(96, 0, 1, [W / 2, D / 2]);

v.save(OUT);
const tiers = {};
for (const c of cellList) tiers[c.T] = (tiers[c.T] || 0) + 1;
console.log(JSON.stringify({ cells: cellList.length, tiers, exterior: cellList.filter((c) => c.ext).length, entrance: [entrance.x, entrance.z, best.d], lamps }));
