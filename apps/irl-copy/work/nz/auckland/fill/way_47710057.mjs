// Auckland, Mt Eden side (way 47710057): a 1970s-80s concrete-frame office block, nine storeys on a stone plinth. The lidar
// roof is median-smoothed over 5x5 and stepped into four tiers (1, 3, 5 and 9 storeys). The nine-storey tower is set back:
// its outer two cells step down to an eighth-storey terrace, and the core rises to 38 with a plant room and a mast on top.
// Storeys are 4 blocks: a floor line, two rows of glazing between white piers, a spandrel. The massing is solid concrete
// with one block of air behind each window, and some windows hold a glowstone lamp. A recessed entrance faces the longest
// street-facing run of wall.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_47710057.cells.json", "utf8"));
const X = 64, Y = 52, Z = 79;

// ground and lidar roof per footprint cell
const G = Array.from({ length: X }, () => Array(Z).fill(-1));
const R = Array.from({ length: X }, () => Array(Z).fill(-1));
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inF = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && G[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const kk = (x, z) => x * Z + z;

// roof tiers: lidar heights median-smoothed over 5x5, then whole storeys (the top of each tier is the roof row + 1)
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const tierTop = (s) => (s <= 9 ? 5 : s <= 16 ? 13 : s <= 35 ? 21 : 38);
const T = Array.from({ length: X }, () => Array(Z).fill(0));
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inF(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  T[x][z] = tierTop(median(v));
}

// the nine-storey tower: distance in from its edge (cells that are not tower count as the edge); the outer two cells
// step down to the eighth storey as a terrace, the core stays at 38
const isTower = (x, z) => inF(x, z) && T[x][z] === 38;
const dist = new Map(), queue = [];
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (isTower(x, z) && DIRS.some(([dx, dz]) => !isTower(x + dx, z + dz))) { dist.set(kk(x, z), 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(kk(x, z));
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (isTower(nx, nz) && !dist.has(kk(nx, nz))) { dist.set(kk(nx, nz), d + 1); queue.push([nx, nz]); }
  }
}
const dOf = (x, z) => dist.get(kk(x, z)) ?? 0;
for (const [x, z] of queue) if (dOf(x, z) <= 2) T[x][z] = 34;

const top = (x, z) => (inF(x, z) ? T[x][z] : 0);
const exposed = (x, z) => DIRS.filter(([dx, dz]) => top(x + dx, z + dz) < T[x][z]);
// the outward direction of a facade cell: a north or south face if it has one, so the along-face coordinate is x there
const prim = (x, z) => { const e = exposed(x, z); return e.length ? (e.find(([, dz]) => dz !== 0) ?? e[0]) : null; };

// full glass blocks read blue at dusk where thin panes read as grey wall; the light concrete piers and spandrels frame them
const BASE = "stone_bricks", FLOOR = "light_gray_concrete", PIER = "white_concrete", SPAN = "light_gray_concrete";
const CORNICE = "polished_andesite", ROOF = "smooth_stone", GLASS = "light_blue_stained_glass";
const CORE = "light_gray_concrete";

const g = new Voxels([X, Y, Z]);

// massing: solid from 0 to the tier top, the foundation to each cell's ground, a roof deck on the top row
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const t = T[x][z], base = Math.max(G[x][z], 1);
  for (let y = 0; y < t; y++) g.set(x, y, z, y < base ? BASE : y === t - 1 ? ROOF : CORE);
}

// facades: storey lines, glazing between piers, a cornice under the roof deck; each window's inner cell is air (or a lamp)
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const p = prim(x, z); if (!p) continue;
  const t = T[x][z], base = Math.max(G[x][z], 1);
  const u = p[1] !== 0 ? x : z, bay = Math.floor(u / 3), faceZ = p[1] !== 0 ? 0 : 1;
  const ix = x - p[0], iz = z - p[1];          // the cell inside the wall
  for (let y = base; y <= t - 2; y++) {
    const r = y % 4, storey = Math.floor(y / 4);
    if (y === t - 2) g.set(x, y, z, CORNICE);
    else if (r === 1) g.set(x, y, z, y === 1 ? BASE : FLOOR);
    else if (r === 0) g.set(x, y, z, SPAN);
    else if (u % 3 === 0) g.set(x, y, z, storey === 0 ? BASE : PIER);
    else {
      g.set(x, y, z, GLASS);
      if (inF(ix, iz) && !prim(ix, iz) && T[ix][iz] > y) {
        const lit = storey === 0 ? bay % 2 === 0 : (bay + storey * 2 + faceZ) % 5 === 0;
        g.set(ix, y, iz, lit ? "glowstone" : "air");
      }
    }
  }
}

// entrance: the longest run of wall facing north (-z), a three-wide recess at its middle, a double oak door
const runs = [];
for (let z = 0; z < Z; z++) {
  let start = -1;
  for (let x = 0; x <= X; x++) {
    const on = x < X && inF(x, z) && prim(x, z) && prim(x, z)[1] === -1;
    if (on && start < 0) start = x;
    if (!on && start >= 0) { runs.push({ z, x0: start, n: x - start }); start = -1; }
  }
}
runs.sort((a, b) => b.n - a.n);
const run = runs[0], uc = run.x0 + Math.floor(run.n / 2), zc = run.z;
for (const dx of [-1, 0, 1]) for (const y of [2, 3]) g.set(uc + dx, y, zc, "air");
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(uc, 2, zc, "oak_door", { ...door, half: "lower" });
g.set(uc, 3, zc, "oak_door", { ...door, half: "upper" });

// roof: the tower's plant room on the core (a solid box two storeys high, its top a roof), a lightning-rod mast on it
const core = [];
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (isTower(x, z) && dOf(x, z) >= 5) core.push([x, z]);
const cx = Math.round(core.reduce((s, [x]) => s + x, 0) / core.length), cz = Math.round(core.reduce((s, [, z]) => s + z, 0) / core.length);
for (const [x, z] of core) {
  if (Math.abs(x - cx) > 7 || Math.abs(z - cz) > 6) continue;
  g.set(x, 38, z, CORE); g.set(x, 39, z, CORE); g.set(x, 40, z, ROOF);
}
if (g.get(cx, 40, cz)) for (let y = 41; y <= 44; y++) g.set(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// the ring terrace's outer edge has a parapet; the four-storey wings carry a few roof boxes
for (const [x, z] of queue) if (dOf(x, z) === 1) g.set(x, 34, z, PIER);
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (inF(x, z) && T[x][z] === 21 && !prim(x, z) && x % 9 === 4 && z % 9 === 4) { g.set(x, 21, z, FLOOR); g.set(x, 22, z, FLOOR); }
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_47710057.nbt");
console.log(JSON.stringify({ ...out, entrance: [uc, zc] }));
