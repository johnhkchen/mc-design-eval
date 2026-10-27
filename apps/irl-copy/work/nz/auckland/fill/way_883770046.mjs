// Way 883770046, Mt Eden (Maungawhau view): a 1930s brick-and-plaster commercial block, three storeys on its east
// main mass with a two-storey wing on the west. The footprint and roof heights are the lidar record (cells [x, z,
// ground, roof]); the roofs are smoothed into two flat tiers, 8 (two storeys) and 12 (three storeys), so the massing
// steps in cleanly. Storeys are 4 blocks: a string course, two glazed rows, then a brick lintel. Interiors are air,
// with a floor slab per storey and a roof deck; windows sit in the skin with air behind them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_883770046.cells.json`, "utf8"));
const W = 68, D = 50, H = 25;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// the smoothed tier of each footprint cell: 0 outside the footprint
const tier = Array.from({ length: W }, () => new Array(D).fill(0));
for (const [x, z, ground, roof] of cells) {
  if (ground !== 0) throw new Error(`cell ${x},${z} has ground ${ground}: foundations not built here`);
  tier[x][z] = roof >= 10 ? 12 : 8;
}
const tierOf = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : tier[x][z]);
// the faces of a cell at height y that look onto air: outside the footprint, or above a lower neighbour's roof
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => { const t = tierOf(x + dx, z + dz); return !t || y >= t; });
// a glazed bay in the upper storeys is two blocks of glass between piers; the ground floor is a shopfront
const windowAt = (u, y) => (y < 4 ? u % 8 !== 0 : u % 4 === 1 || u % 4 === 2);
// a pane joins the panes beside it along its own wall
const glassState = (dx) => (dx !== 0
  ? { north: "true", east: "false", south: "true", west: "false", waterlogged: "false" }
  : { north: "false", east: "true", south: "false", west: "true", waterlogged: "false" });

// the side a block looks onto. The lidar outline is stepped, so a block exposed on two sides is common: it faces
// the side whose wall runs on longest (both neighbours along it inside the footprint), not a quoin
const wallDir = (x, z, e) => {
  if (e.length < 2) return e[0];
  const runOn = ([dx]) => (dx ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]]).filter(([a, b]) => tierOf(x + a, z + b) > 0).length;
  return e.reduce((best, d) => (runOn(d) > runOn(best) ? d : best));
};

// the skin of one block: its block and state, or null for air (interior), with floor slabs and the roof deck
function skin(x, y, z, T, e) {
  if (y === 0) return ["stone_bricks"];                       // plinth course, and the ground floor's floor
  if (!e.length) {                                             // interior: a floor slab per storey, a roof deck on top
    if (y % 4 === 0) return ["oak_planks"];
    return y === T - 1 ? ["gray_concrete"] : null;
  }
  if (y === T - 1) return ["smooth_quartz"];                   // cornice under the parapet
  const rel = y % 4;
  if (rel === 0) return ["smooth_quartz"];                     // storey string course
  if (rel === 3) return ["bricks"];                            // brick lintel
  const [dx] = wallDir(x, z, e), u = dx ? z : x;
  return windowAt(u, y) ? ["glass_pane", glassState(dx)] : ["bricks"];
}

const g = new Voxels([W, H, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const T = tier[x][z]; if (!T) continue;
  for (let y = 0; y < T; y++) { const s = skin(x, y, z, T, exposed(x, y, z)); if (s) g.set(x, y, z, s[0], s[1]); }
  if (exposed(x, T - 1, z).length) g.set(x, T, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // parapet cap
}

// everything laid over the skin, in order (a later entry replaces an earlier one)
const extra = [];

// two entrances on the two largest street-facing runs of the ground floor, each with a dark canopy over its bay
const runs = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!tier[x][z]) continue;
  const e = exposed(x, 1, z);
  if (e.length === 1) (runs[FACING[e[0]]] ??= []).push([x, z, e[0][0], e[0][1]]);
}
const byRun = Object.entries(runs).sort((a, b) => b[1].length - a[1].length).slice(0, 2);
for (const [face, run] of byRun) {
  const [dx] = run[0].slice(2);
  const along = (c) => (dx ? c[1] : c[0]);
  run.sort((a, b) => along(a) - along(b));
  const mid = run[Math.floor(run.length / 2)], u0 = along(mid);
  const doorState = (half) => ({ facing: face, half, hinge: "left", open: "false", powered: "false" });
  extra.push([mid[0], 1, mid[1], "oak_door", doorState("lower")], [mid[0], 2, mid[1], "oak_door", doorState("upper")]);
  for (const c of run) if (Math.abs(along(c) - u0) <= 1) extra.push([c[0], 3, c[1], "dark_oak_planks"]);
}

// warm light: a glowstone on the floor just inside about one window in five
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const T = tier[x][z]; if (!T) continue;
  for (let y = 1; y < T; y += 4) {
    const e = exposed(x, y, z);
    if (e.length !== 1) continue;
    const [dx, dz] = e[0], u = dx ? z : x;
    if (!windowAt(u, y) || (x * 7 + z * 13 + y) % 5 !== 0) continue;
    const ix = x - dx, iz = z - dz;
    if (tierOf(ix, iz) <= y || exposed(ix, y, iz).length) continue;
    extra.push([ix, y, iz, "glowstone"]);
  }
}

// roof plant: a stair-and-lift housing on the middle of the top tier, and two plant units beside it
const top = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (tierOf(x, z) === 12) top.push([x, z]);
const cx = top.reduce((s, [x]) => s + x, 0) / top.length, cz = top.reduce((s, [, z]) => s + z, 0) / top.length;
const roofable = (x0, z0, n) => {
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (tierOf(x0 + i, z0 + j) !== 12 || exposed(x0 + i, 11, z0 + j).length) return false;
  }
  return true;
};
function spot(n, tx, tz, taken) {
  let best = null, bd = Infinity;
  for (let x0 = 0; x0 + n <= W; x0++) for (let z0 = 0; z0 + n <= D; z0++) {
    if (!roofable(x0, z0, n)) continue;
    if (taken.some(([a, b, m]) => x0 < a + m + 1 && a < x0 + n + 1 && z0 < b + m + 1 && b < z0 + n + 1)) continue;
    const d = Math.hypot(x0 + n / 2 - tx, z0 + n / 2 - tz);
    if (d < bd) { bd = d; best = [x0, z0, n]; }
  }
  return best;
}
const house = spot(4, cx, cz, []);
const plant1 = spot(2, cx + 10, cz + 6, [house]);
const plant2 = spot(2, cx - 10, cz - 6, [house, plant1]);
if (house) {
  const [hx, hz] = house;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const ring = i === 0 || i === 3 || j === 0 || j === 3;
    for (let y = 12; y <= 14; y++) if (ring) extra.push([hx + i, y, hz + j, "bricks"]);
    extra.push([hx + i, 15, hz + j, "smooth_quartz"]);
  }
  for (const i of [1, 2]) {
    extra.push([hx + i, 13, hz, "glass_pane", glassState(0)], [hx + i, 13, hz + 3, "glass_pane", glassState(0)]);
  }
}
for (const p of [plant1, plant2]) if (p) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) extra.push([p[0] + i, 12, p[1] + j, "iron_block"]);

for (const [x, y, z, block, state] of extra) g.set(x, y, z, block, state);

// no block may float: each one (above the ground) rests on a block below it or beside it at its own height
let floating = 0;
for (let x = 0; x < W; x++) for (let y = 1; y < H; y++) for (let z = 0; z < D; z++) {
  if (!g.val(x, y, z) || g.val(x, y - 1, z)) continue;
  const side = DIRS.some(([dx, dz]) => g.val(x + dx, y, z + dz));
  if (!side) floating++;
}
const result = g.save(`${DIR}/way_883770046.nbt`);
console.log(JSON.stringify({ ...result, floating, entrances: byRun.map(([f, r]) => [f, r.length]), house, plant1, plant2 }));
