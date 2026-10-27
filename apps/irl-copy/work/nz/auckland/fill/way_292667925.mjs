// way 292667925: a 1970s concrete mid-rise on the Mt Eden side of the CBD ridge, 6 storeys with a 7th on the two towered
// masses, a 3-storey wing at the north-west corner, a shopfront ground floor, and a 1-block shell with an air gap behind
// the glass and a floor slab per storey. Roof heights are snapped to three flat tops: 14 (wing), 27 (body), 30 (towers).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292667925.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292667925.nbt";
const X = 38, Y = 42, Z = 77;

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const FP = new Map();                       // "x,z" -> { g: ground, t: roof surface (the block row above the top solid row) }
for (const [x, z, g, r] of cells) {
  const t = r <= 20 ? 14 : r <= 28 ? 27 : 30;   // lidar noise snapped to flat tiers
  FP.set(`${x},${z}`, { g, t });
}
const cell = (x, z) => FP.get(`${x},${z}`);
const DIRS = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];

// a neighbour is absent at row y when it is outside the footprint or its roof is at or below y: those faces are facades
const absent = (x, z, y) => { const n = cell(x, z); return !n || y >= n.t; };
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => absent(x + dx, z + dz, y));
const present = (x, z, y) => { const c = cell(x, z); return !!c && y >= Math.max(c.g, 2) && y < c.t; };

const v = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);
const glassAt = [];                         // window glass cells in the storey rows, for doors, lamps and glow

for (const [key, { g, t }] of FP) {
  const [x, z] = key.split(",").map(Number);
  const base = Math.max(g, 2);
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");       // foundation and plinth, solid up to the ground
  for (let y = base; y < t; y++) {
    const ex = exposed(x, z, y);
    const rel = (y - 2) % 4;                // storey: band, two window rows, spandrel
    if (y === t - 1) { put(x, y, z, ex.length ? "light_gray_concrete" : "gravel"); continue; }   // cornice, then gravel roof
    if (!ex.length) { if (rel === 0) put(x, y, z, "white_concrete"); continue; }  // interior: floor slab, air otherwise
    if (rel === 0) { put(x, y, z, y === 2 ? "polished_andesite" : "light_gray_concrete"); continue; }  // base course and storey lines
    if (rel === 3) { put(x, y, z, "white_concrete"); continue; }
    const along = ex[0][1] !== 0 ? z : x;   // the coordinate that runs along the face
    if (ex.length > 1 || along % 4 === 0) { put(x, y, z, "white_concrete"); continue; }  // corner and pier
    const ground = y < 6;
    put(x, y, z, ground ? "light_blue_stained_glass" : "gray_stained_glass");
    glassAt.push({ x, y, z, ex: ex[0], ground });
  }
}

// entrances: a door in the ground-floor glass of the two longest outward runs, lamps either side, a stone hood above
const runs = new Map();
for (const c of glassAt) {
  if (!c.ground || c.y !== 3) continue;
  const key = c.ex[0];
  if (!runs.has(key)) runs.set(key, []);
  runs.get(key).push(c);
}
const doorCells = new Set();
const ranked = [...runs.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 2);
for (const [dir, list] of ranked) {
  const along = (c) => (dir === "east" || dir === "west" ? c.z : c.x);
  list.sort((a, b) => along(a) - along(b));
  const mid = list[Math.floor(list.length / 2)];
  const { x, z } = mid;
  const st = (half) => ({ facing: dir, half, hinge: "left", open: "false", powered: "false" });
  put(x, 3, z, "dark_oak_door", st("lower"));
  put(x, 4, z, "dark_oak_door", st("upper"));
  doorCells.add(`${x},${z}`);
  const ew = dir === "east" || dir === "west";
  for (const side of [-1, 0, 1]) put(ew ? x : x + side, 5, ew ? z + side : z, "polished_andesite");   // hood over the bay
  for (const side of [-1, 1]) {
    const sx = ew ? x : x + side, sz = ew ? z + side : z;
    if (!list.some((c) => c.x === sx && c.z === sz)) continue;          // only a glass cell takes a lamp
    put(sx, 3, sz, "lantern", { hanging: "false" });
    doorCells.add(`${sx},${sz}`);
  }
}

// warm light: lit windows get a glowstone (shroomlight on the ground floor) in the air gap behind the glass
let lit = 0;
for (const c of glassAt) {
  if (doorCells.has(`${c.x},${c.z}`) || (c.y - 2) % 4 !== 1) continue;   // first window row of each storey
  if ((c.x * 7 + c.z * 13 + c.y * 5) % 5 !== 0) continue;
  const [, dx, dz] = c.ex;
  const ix = c.x - dx, iz = c.z - dz;
  if (!present(ix, iz, c.y) || exposed(ix, iz, c.y).length) continue;   // only the air gap, never a wall
  put(ix, c.y, iz, c.ground ? "shroomlight" : "glowstone");
  lit++;
}

// roof plant: a 4 x 3 plant room on each tower (rows 30-31, iron vent on top), two air-handling units on the body roof
const towers = [...FP.entries()].filter(([, c]) => c.t === 30).map(([k]) => k.split(",").map(Number));
for (const half of [(p) => p[1] < 18, (p) => p[1] >= 18]) {
  const set = towers.filter(half);
  if (!set.length) continue;
  const cx = set.reduce((s, p) => s + p[0], 0) / set.length, cz = set.reduce((s, p) => s + p[1], 0) / set.length;
  let best = null;
  for (let x0 = 0; x0 <= X - 4; x0++) for (let z0 = 0; z0 <= Z - 3; z0++) {
    let ok = true;
    for (let dx = 0; dx < 4 && ok; dx++) for (let dz = 0; dz < 3 && ok; dz++) {
      const c = cell(x0 + dx, z0 + dz); ok = !!c && c.t === 30 && !exposed(x0 + dx, z0 + dz, 29).length;
    }
    if (!ok) continue;
    const d = Math.hypot(x0 + 1.5 - cx, z0 + 1 - cz);
    if (!best || d < best.d) best = { x0, z0, d };
  }
  if (!best) continue;
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 3; dz++) {
    const x = best.x0 + dx, z = best.z0 + dz;
    put(x, 30, z, "light_gray_concrete");
    const edge = dx === 0 || dx === 3 || dz === 0 || dz === 2;
    put(x, 31, z, edge ? "light_gray_concrete" : "iron_block");
  }
}
let acUnits = 0;
for (const [key, c] of FP) {
  if (c.t !== 27 || acUnits >= 2) continue;
  const [x, z] = key.split(",").map(Number);
  if ((x + z) % 9 !== 0) continue;
  let ok = true;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const k = cell(x + dx, z + dz); ok = ok && !!k && k.t === 27 && !exposed(x + dx, z + dz, 26).length; }
  if (!ok) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(x + dx, 27, z + dz, "iron_block");
  acUnits++;
}

// check: every solid block stands on a solid below or joins one beside it (floor slabs span the shell)
let hanging = 0;
for (let y = 1; y < Y; y++) for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!v.val(x, y, z)) continue;
  if (v.val(x, y - 1, z)) continue;
  const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => v.val(x + dx, y, z + dz));
  if (!side) hanging++;
}
const res = v.save(OUT);
console.log(JSON.stringify({ footprint: FP.size, lit, acUnits, hanging, ...res }));
