// NYC1076173: Americas Tower Offices, 1177 Avenue of the Americas (1988). A stepped glass office tower on a granite
// podium, a paved forecourt on the Fifth Avenue side with two doors, and a penthouse on the crown. Tiers come from the
// lidar roof (snapped and mode-filtered); storeys sit on an absolute 3-block grid from a 2-block granite base.
// Outer wall cells carry glass with mullions and spandrels; a 1-cell air gap sits behind the glass with glowstone in
// some windows; floors are solid slabs; the core is solid concrete.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 54, D = 49, H = 197;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1076173.cells.json`, "utf8"));

// Lidar roof -> flat tiers. Roof <= 4 is the ground-level forecourt (paved to y 2).
const tierOf = (r) => (r <= 4 ? 2 : r < 60 ? 26 : r < 130 ? 112 : r < 160 ? 152 : r < 170 ? 164 : r < 178 ? 174 : 185);

let T = Array.from({ length: D }, () => Array(W).fill(-1));
for (const [x, z, , r] of cells) T[z][x] = tierOf(r);

// Majority of the 3x3 around each cell, twice: lidar noise becomes clean setbacks.
for (let pass = 0; pass < 2; pass++) {
  const N = T.map((row) => row.slice());
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (T[z][x] < 0) continue;
    const n = new Map();
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, nz = z + dz;
      if (nx < 0 || nz < 0 || nx >= W || nz >= D || T[nz][nx] < 0) continue;
      n.set(T[nz][nx], (n.get(T[nz][nx]) || 0) + 1);
    }
    let best = T[z][x], bc = n.get(best) || 0;
    for (const [v, c] of n) if (c > bc) { best = v; bc = c; }
    N[z][x] = best;
  }
  T = N;
}

// The crown penthouse: the central 185 block rises six more blocks (a mechanical floor with its own walls).
for (let z = 18; z <= 31; z++) for (let x = 25; x <= 39; x++) if (T[z][x] === 185) T[z][x] = 191;

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && T[z][x] >= 0;
// Faces open to the air at height y: outside the footprint, or onto a neighbour whose roof is below y.
const outer = (x, z, y) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz) || T[z + dz][x + dx] <= y);
// A wall cell has an outside or lower neighbour at some height (its column is the shell).
const isWall = (x, z) => T[z][x] > 2 && DIRS.some(([dx, dz]) => !inF(x + dx, z + dz) || T[z + dz][x + dx] < T[z][x]);
// A gap cell is interior and touches a wall: the air behind the glass.
const isGap = (x, z) => !isWall(x, z) && T[z][x] > 2 && DIRS.some(([dx, dz]) => inF(x + dx, z + dz) && isWall(x + dx, z + dz));
const mullion = (x, z, ex) => ex.some(([dx]) => (dx === 0 ? x % 3 === 0 : z % 3 === 0));
const warm = (x, y, z) => (x * 73 + y * 151 + z * 37) % 9 === 0;
const key = (x, y, z) => `${x},${y},${z}`;

// Warm lights: glowstone in the air gap behind some lower-row windows (row 1 of each storey, sitting on the floor).
const lamps = new Set();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!isWall(x, z)) continue;
  const t = T[z][x];
  for (let y = 2; y <= t - 3; y++) {
    if ((y - 2) % 3 !== 1) continue;
    const ex = outer(x, z, y);
    if (!ex.length || mullion(x, z, ex) || !warm(x, y, z)) continue;
    const [dx, dz] = ex[0];
    const ix = x - dx, iz = z - dz;
    if (!inF(ix, iz) || !isGap(ix, iz) || T[iz][ix] <= y) continue;
    lamps.add(key(ix, y, iz));
  }
}

function blockAt(x, y, z) {
  const t = T[z][x];
  if (t < 0 || y >= t) return null;
  if (t === 2) return y === 0 ? "stone" : ((x >> 2) + (z >> 2)) % 2 ? "stone_bricks" : "smooth_stone";
  if (y < 2) return "polished_granite";                                  // base course, all the way round
  const ex = outer(x, z, y);
  const spandrel = t <= 30 ? "polished_granite" : "light_gray_concrete"; // podium is granite, the tower precast
  if (y === t - 1) return ex.length ? "polished_granite" : "stone";      // parapet on the edge, roof terrace inside
  if (y === t - 2 && ex.length) return "polished_granite";               // cornice
  if ((y - 2) % 3 === 0) return spandrel;                                // storey floor / spandrel line
  if (ex.length) return mullion(x, z, ex) ? "gray_concrete" : t <= 30 ? "gray_stained_glass" : "light_blue_stained_glass";
  if (isGap(x, z)) return lamps.has(key(x, y, z)) ? "glowstone" : null;  // air behind the glass
  return "light_gray_concrete";                                          // core and shell infill
}

const g = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  for (let y = 0; y < T[z][x]; y++) {
    const b = blockAt(x, y, z);
    if (b) g.set(x, y, z, b);
  }
}

// Entrances on the Fifth Avenue side: a wall cell beside the forecourt, nearest the tower's middle.
const door = [];
for (let z = 0; z < D - 1; z++) for (let x = 0; x < W - 1; x++) {
  if (T[z][x] >= 100 && T[z][x + 1] === 2 && isWall(x, z) && T[z + 1][x] >= 100 && T[z + 1][x + 1] === 2 && isWall(x, z + 1))
    door.push([x, z]);
}
const [dx0, dz0] = door.sort((a, b) => Math.abs(a[1] + 0.5 - 26) - Math.abs(b[1] + 0.5 - 26))[0];
const fx = (x, y, z, block, state) => g.set(x, y, z, block, state);
for (const [z, hinge] of [[dz0, "left"], [dz0 + 1, "right"]]) {
  const doorState = { facing: "east", hinge, open: "false", powered: "false" };
  fx(dx0, 3, z, "dark_oak_door", { ...doorState, half: "lower" });
  fx(dx0, 4, z, "dark_oak_door", { ...doorState, half: "upper" });
  fx(dx0 + 1, 2, z, "polished_granite_stairs", { facing: "east", half: "bottom", shape: "straight", waterlogged: "false" });
}
fx(dx0 - 1, 3, dz0, "glowstone");                                        // lobby light behind the doors
fx(dx0 - 1, 3, dz0 + 1, "glowstone");

// Roof equipment on the podium and the 152 terraces (boxes on the cap), and lanterns on the penthouse corners.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const t = T[z][x];
  if (t === 26 && x % 6 === 2 && z % 6 === 2) for (let y = 26; y < 28; y++) fx(x, y, z, "light_gray_concrete");
  if (t === 152 && x % 8 === 4 && z % 8 === 4) for (let y = 152; y < 154; y++) fx(x, y, z, "light_gray_concrete");
}
const pen = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (T[z][x] === 191) pen.push([x, z]);
const xs = pen.map((p) => p[0]), zs = pen.map((p) => p[1]);
for (const x of [Math.min(...xs), Math.max(...xs)]) for (const z of [Math.min(...zs), Math.max(...zs)])
  fx(x, 191, z, "lantern", { hanging: "false", waterlogged: "false" });

const saved = g.save(`${DIR}/NYC1076173.nbt`);

// Checks: every shell and core block must stand on something (only gap floors and doors may sit over air).
let hanging = 0, blocks = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 1; y < T[z][x]; y++) {
  if (!g.get(x, y, z)) continue;
  blocks++;
  if (!g.get(x, y - 1, z) && !isGap(x, z)) hanging++;
}
console.log(JSON.stringify({ door: [dx0, dz0], penthouse: pen.length, tiers: [...new Set(T.flat().filter((v) => v >= 0))].sort((a, b) => a - b), lamps: lamps.size, blocks: saved.blocks, palette: saved.palette, hangingOutsideGap: hanging }));
