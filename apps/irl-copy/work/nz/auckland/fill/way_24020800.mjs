// GE House: a low, wide, concrete-framed office block of the 1970s, three storeys with a fourth on its roofs' high
// ground, read from the lidar: the roof runs 11 to 18 blocks above y 0 (about 9 to 15 m), so the massing is 1 to 3
// storeys of 4 blocks each, stepped where the smoothed roof steps (a 7x7 median, so the lidar's noise becomes flat
// tiers). Light-grey concrete piers and floor lines frame bands of blue-tinted glass, with darker spandrels between
// them; a polished andesite plinth stands on a stone foundation down to each cell's ground. Two entrances sit on the
// longest street face, one third and two thirds along it, under a hanging lantern. Some windows have a glowstone a
// block behind the glass; the rest of each storey is air, with a floor slab under it. Plant boxes stand on the roof
// slab where the tallest tier is wide enough, and a parapet caps the outline up to the lidar's roof height.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24020800.cells.json", "utf8"));
const W = 94, D = 167, H = 24, FLOOR0 = 4, STOREY = 4;

const ground = Array.from({ length: W }, () => Array(D).fill(-1));
const roof = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, g, r] of cells) { ground[x][z] = g; roof[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// depth: 1 on the outline, 2 one cell in, and so on (a breadth-first walk in from outside the footprint)
const depth = Array.from({ length: W }, () => Array(D).fill(0));
let frontier = [];
for (const [x, z] of cells) if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz))) { depth[x][z] = 1; frontier.push([x, z]); }
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of DIRS) {
    const a = x + dx, b = z + dz;
    if (inside(a, b) && !depth[a][b]) { depth[a][b] = d + 1; next.push([a, b]); }
  }
  frontier = next;
}

// smoothed roof: the median of the footprint's roof heights within 3 cells, then whole storeys under it
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const rs = Array.from({ length: W }, () => Array(D).fill(0));
const N = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z] of cells) {
  const v = [];
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (inside(x + dx, z + dz)) v.push(roof[x + dx][z + dz]);
  rs[x][z] = median(v);
  N[x][z] = Math.max(1, Math.floor((rs[x][z] - FLOOR0) / STOREY));
}
const topOf = (x, z) => FLOOR0 + STOREY * N[x][z];

// the faces of a cell at storey k: each neighbour outside the footprint, or one with no storey k
const outward = (x, z, k) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || N[x + dx][z + dz] <= k);
// along a face, the bay: a pier every 4th block, windows between
const along = (x, z, [dx]) => (dx !== 0 ? z : x);
const isPier = (x, z, dir) => ((along(x, z, dir) % 4) + 4) % 4 === 0;

const LIGHT = "light_gray_concrete", SPAN = "white_concrete", GLASS = "light_blue_stained_glass";
const BASE = "polished_andesite", CAP = "smooth_stone";

const g = new Voxels([W, H, D]);

// foundation (stone down to each cell's ground), plinth, floor slabs and the roof slab, then the facade
for (const [x, z, gr] of cells) {
  const n = N[x][z], top = topOf(x, z);
  for (let y = 0; y < FLOOR0; y++) g.set(x, y, z, y < gr ? "stone" : BASE);
  for (let k = 0; k <= n; k++) g.set(x, FLOOR0 + STOREY * k, z, LIGHT);
  for (let k = 0; k < n; k++) {
    const outs = outward(x, z, k);
    if (!outs.length) continue;
    const b = FLOOR0 + STOREY * k, dir = outs[0];
    for (let y = b + 1; y <= b + 3; y++) {
      g.set(x, y, z, isPier(x, z, dir) ? LIGHT : (y === b + 3 ? SPAN : GLASS));
    }
  }
  if (depth[x][z] === 1) {
    const p = Math.min(3, Math.max(0, Math.round(rs[x][z]) - top));
    for (let y = top + 1; y <= top + p; y++) g.set(x, y, z, CAP);
  }
}

// the street face: the side with the most storey-0 faces; two entrances on its piers, a third and two thirds along
const counts = {};
for (const [x, z] of cells) for (const [dx, dz] of outward(x, z, 0)) counts[`${dx},${dz}`] = (counts[`${dx},${dz}`] || 0) + 1;
const [bestKey] = Object.entries(counts).sort((p, q) => q[1] - p[1])[0];
const [bdx, bdz] = bestKey.split(",").map(Number);
const cand = cells
  .filter(([x, z]) => outward(x, z, 0).some(([dx, dz]) => dx === bdx && dz === bdz))
  .map(([x, z]) => ({ x, z, a: along(x, z, [bdx, bdz]), pier: isPier(x, z, [bdx, bdz]) }));
const piers = cand.filter((c) => c.pier).sort((p, q) => p.a - q.a);
const lo = cand.reduce((m, c) => Math.min(m, c.a), Infinity), hi = cand.reduce((m, c) => Math.max(m, c.a), -Infinity);
const doors = [];
for (const t of [lo + (hi - lo) / 3, lo + (2 * (hi - lo)) / 3]) {
  const pool = (piers.length ? piers : cand).filter((c) => !doors.includes(c));
  pool.sort((p, q) => Math.abs(p.a - t) - Math.abs(q.a - t));
  if (pool[0]) doors.push(pool[0]);
}
const FACE = FACING[`${-bdx},${-bdz}`];   // a door faces inward: the player stood outside it
for (const { x, z } of doors) {
  g.set(x, FLOOR0 + 1, z, "dark_oak_door", { facing: FACE, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, FLOOR0 + 2, z, "dark_oak_door", { facing: FACE, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, FLOOR0 + 3, z, "lantern", { hanging: "true" });   // hangs from the storey-1 floor slab
}

// warm windows: a glowstone one block behind some glass (the cell inside the face, not itself a face at that storey)
let lamps = 0;
for (const [x, z] of cells) {
  for (let k = 0; k < N[x][z]; k++) {
    const outs = outward(x, z, k);
    if (!outs.length) continue;
    const dir = outs[0];
    if (isPier(x, z, dir) || (along(x, z, dir) + 3 * k) % 11 !== 5) continue;
    const ix = x - dir[0], iz = z - dir[1];
    if (!inside(ix, iz) || N[ix][iz] <= k || outward(ix, iz, k).length) continue;
    if (doors.some((d) => d.x === x && d.z === z)) continue;
    g.set(ix, FLOOR0 + STOREY * k + 1, iz, "glowstone");
    lamps++;
  }
}

// plant boxes on the roof slab, on a 10-block grid where the 3x3 around the centre is one flat tier, clear of the parapet
let plant = 0;
for (const [x, z] of cells) {
  if (x % 10 !== 5 || z % 10 !== 5) continue;
  const n = N[x][z];
  let ok = true;
  for (let dx = -1; dx <= 1 && ok; dx++) for (let dz = -1; dz <= 1 && ok; dz++) {
    const a = x + dx, b = z + dz;
    if (!inside(a, b) || N[a][b] !== n || depth[a][b] < 2) ok = false;
  }
  if (!ok) continue;
  const top = topOf(x, z), h = rs[x][z] >= top + 1 ? Math.min(2, Math.round(rs[x][z]) - top) : 1;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    for (let y = top + 1; y <= top + h; y++) g.set(x + dx, y, z + dz, LIGHT);
  }
  plant++;
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24020800.nbt");
const storeys = {};
for (const [x, z] of cells) storeys[N[x][z]] = (storeys[N[x][z]] || 0) + 1;
console.log(JSON.stringify({ cells: cells.length, storeys, doors: doors.length, lamps, plant, ...out }));
