// Way 292660655: a 1970s concrete-framed office block on Mt Eden's flank, as the lidar reads it. Four storeys
// (roof 16 blocks) over most of the plan, with a six-storey core (roof 24) on the north-east and southern tail.
// Massing: the lidar roof is smoothed over each cell's 3x3 neighbourhood and quantised to 4-block storeys, so the
// setbacks are flat tiers. Facade: stone base, white precast piers and spandrels, grey tinted glazing in 2-row
// windows, light-grey string courses on each storey line, a cornice at the top of every tier. Interior is air
// behind the glass with a floor slab per storey, so each tier stands on the slabs and walls below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292660655.cells.json", "utf8"));
const W = 53, D = 60, H = 37;

// per-cell ground (gnd) and lidar roof (raw), -1 outside the footprint
const gnd = Array.from({ length: D }, () => new Int16Array(W).fill(-1));
const raw = Array.from({ length: D }, () => new Float32Array(W));
for (const [x, z, g, r] of cells) { gnd[z][x] = g; raw[z][x] = r; }
const inFp = (x, z) => x >= 0 && x < W && z >= 0 && z < D && gnd[z][x] >= 0;

// smoothed roof, quantised to 4-block storeys between a 2-storey wing and the 6-storey core; never below ground + 1 storey
const top = Array.from({ length: D }, () => new Int16Array(W).fill(-1));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z)) continue;
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) { s += raw[z + dz][x + dx]; n++; }
  const q = Math.min(24, Math.max(8, Math.round(s / n / 4) * 4));
  top[z][x] = Math.max(q, gnd[z][x] + 4);
}

const DIRS = [{ dx: 0, dz: -1, n: "north" }, { dx: 0, dz: 1, n: "south" }, { dx: -1, dz: 0, n: "west" }, { dx: 1, dz: 0, n: "east" }];
// a side is exposed at height y when the cell beside it is off the footprint or stands lower than y
const exposed = (x, z, y, d) => !inFp(x + d.dx, z + d.dz) || y >= top[z + d.dz][x + d.dx];
const exposedDirs = (x, z, y) => DIRS.filter((d) => exposed(x, z, y, d));

const g = new Voxels([W, H, D]);
const lit = (x, y, z) => (x * 7 + y * 13 + z * 5) % 9 === 0;   // about one window in nine carries a light behind it

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z)) continue;
  const gg = gnd[z][x], t = top[z][x];
  // a cell that stands above a neighbour is a solid shear wall from the ground up, so the tier above has something under it
  const stepped = DIRS.some((d) => inFp(x + d.dx, z + d.dz) && top[z + d.dz][x + d.dx] < t);
  for (let y = 0; y < t; y++) {
    if (y < gg) { g.set(x, y, z, "stone"); continue; }                        // foundation up to the lowest ground
    const ex = exposedDirs(x, z, y), shell = ex.length > 0 || stepped;
    if (shell && !ex.length && y % 4 !== 0 && y !== t - 1) { g.set(x, y, z, "white_concrete"); continue; }   // a shear wall under a setback: solid, unseen
    if (y === gg) { g.set(x, y, z, shell ? "stone_bricks" : "light_gray_concrete"); continue; }   // base course / floor slab
    if (y === t - 1) { g.set(x, y, z, shell ? "smooth_stone" : "light_gray_concrete"); continue; } // cornice / roof deck
    if (y % 4 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }    // storey line, floor slab in the interior
    if (!shell) continue;                                                     // air behind the glass
    const xs = ex.find((d) => d.dx !== 0), zs = ex.find((d) => d.dz !== 0);
    if (xs && zs) { g.set(x, y, z, "white_concrete"); continue; }            // corner pier
    const face = xs || zs, along = xs ? z : x;
    const ground = y < gg + 4;
    if (along % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }     // mullion pier every third bay
    if (!ground && y % 4 === 3) { g.set(x, y, z, "white_concrete"); continue; }   // spandrel panel
    // a pane: east/west links on a north or south face, north/south links on an east or west face
    const links = face.dz === 0 ? { east: "true", west: "true", north: "false", south: "false" }
      : { east: "false", west: "false", north: "true", south: "true" };
    g.set(x, y, z, "gray_stained_glass_pane", links);
    const bx = x - face.dx, bz = z - face.dz;
    if (lit(x, y, z) && inFp(bx, bz) && g.val(bx, y, bz) === 0) g.set(bx, y, bz, "glowstone");
  }
}

// the front door on the northern edge, a lintel above and two hanging lanterns either side of it
let zMin = Infinity; for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inFp(x, z) && z < zMin) zMin = z;
const frontXs = []; for (let x = 0; x < W; x++) if (inFp(x, zMin)) frontXs.push(x);
const xd = frontXs[Math.floor(frontXs.length / 2)], gd = gnd[zMin][xd];
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g.set(xd, gd + 1, zMin, "iron_door", doorState("lower"));
g.set(xd, gd + 2, zMin, "iron_door", doorState("upper"));
for (const dx of [-1, 0, 1]) g.set(xd + dx, gd + 3, zMin, "smooth_stone");
for (const dx of [-1, 1]) g.set(xd + dx, gd + 2, zMin, "lantern", { hanging: "true" });

// roof plant: a 3 x 3 plant room, two blocks high, on the top tier
let plant = null;
for (let z = 1; z < D - 1 && !plant; z++) for (let x = 1; x < W - 1 && !plant; x++) {
  let ok = true;
  for (let dz = -1; dz <= 1 && ok; dz++) for (let dx = -1; dx <= 1 && ok; dx++) if (top[z + dz][x + dx] !== 24) ok = false;
  if (ok) plant = { x, z };
}
if (plant) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) for (const y of [24, 25]) g.set(plant.x + dx, y, plant.z + dz, "white_concrete");

// every block must be carried down to the ground by blocks it touches (no floating tier or course)
const seen = new Uint8Array(W * H * D), queue = [];
const idx = (x, y, z) => (z * H + y) * W + x;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (g.val(x, 0, z)) { seen[idx(x, 0, z)] = 1; queue.push([x, 0, z]); }
const steps = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
for (let q = 0; q < queue.length; q++) {
  const [x, y, z] = queue[q];
  for (const [a, b, c] of steps) {
    const nx = x + a, ny = y + b, nz = z + c;
    if (nx < 0 || ny < 0 || nz < 0 || nx >= W || ny >= H || nz >= D || seen[idx(nx, ny, nz)] || !g.val(nx, ny, nz)) continue;
    seen[idx(nx, ny, nz)] = 1; queue.push([nx, ny, nz]);
  }
}
let loose = 0; const looseAt = [];
g.forEachCell((i, v) => { if (!seen[i]) { loose++; if (looseAt.length < 12) looseAt.push(`${i % W},${Math.floor(i / W) % H},${Math.floor(i / (W * H))} ${g.palette[v].block}`); } });
if (loose) console.warn(`${loose} blocks not carried to the ground: ${looseAt.join("; ")}`);

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292660655.nbt";
const { blocks, palette } = g.save(out);
console.log(`saved ${out}: ${blocks} blocks, ${palette} palette entries, ${queue.length} supported, ${loose} loose`);
