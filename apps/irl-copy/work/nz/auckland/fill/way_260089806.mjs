// Sale Street Residences: a nine-storey concrete apartment block on a two-storey podium (1970s-80s Auckland flats:
// pale concrete piers and spandrels, recessed glazing, stone-brick plinth, a stepped tower). Massing follows the lidar:
// the smoothed roof height splits the footprint into a tower (roof ~35) and a podium (roof ~8); the tower steps in
// twice as it rises. Windows are recessed one block with a glass pane and an air gap behind it (glowstone in some),
// every storey has a floor line running through the mass, and nothing is built off the footprint or in the air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 32, D = 48, Y = 48;
const PODIUM = 8;          // the low wing's roof (its top layer is 7)
const TOWER_MIN = 20;      // smoothed roof at or above this is tower
const STEP_1 = 24, STEP_2 = 32, TOP = 35;   // tower setbacks: inset 2 blocks from y 24, 4 blocks from y 32; top layer 34

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260089806.cells.json", "utf8"));
const id = (x, z) => x + z * W;
const inF = new Uint8Array(W * D), G = new Int16Array(W * D), R = new Int16Array(W * D);
for (const [x, z, g, r] of cells) { inF[id(x, z)] = 1; G[id(x, z)] = g; R[id(x, z)] = r; }
const F = (x, z) => x >= 0 && z >= 0 && x < W && z < D && inF[id(x, z)] === 1;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the lidar's roof per cell, smoothed to its 3x3 median so the stair-stepped noise becomes clean tiers
const Rs = new Int16Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!F(x, z)) continue;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (F(x + dx, z + dz)) v.push(R[id(x + dx, z + dz)]);
  v.sort((a, b) => a - b); Rs[id(x, z)] = v[v.length >> 1];
}
const T = new Uint8Array(W * D);      // tower cells
for (let c = 0; c < W * D; c++) T[c] = inF[c] && Rs[c] >= TOWER_MIN ? 1 : 0;

// ring: 1 on the tower's outer edge, then counting inward (multi-source BFS through the tower)
const ring = new Int16Array(W * D);
const queue = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = id(x, z); if (!T[c]) continue;
  if (DIRS.some(([dx, dz]) => !(F(x + dx, z + dz) && T[id(x + dx, z + dz)]))) { ring[c] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], c = id(x, z);
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz; if (!F(nx, nz) || !T[id(nx, nz)] || ring[id(nx, nz)]) continue;
    ring[id(nx, nz)] = ring[c] + 1; queue.push([nx, nz]);
  }
}

// the solid mass: foundation below each cell's ground, the podium to y 8, the tower with its two setbacks
function solid(x, z, y) {
  if (!F(x, z) || y < 0 || y >= Y) return false;
  const c = id(x, z);
  if (y < G[c] || y < PODIUM) return true;
  if (!T[c]) return false;
  if (y < STEP_1) return true;
  if (y < STEP_2) return ring[c] >= 3;
  if (y < TOP) return ring[c] >= 5;
  return false;
}
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !solid(x + dx, z + dz, y));

// entrance: the south-most exposed ground face, nearest x 10 (the podium's tip)
let door = null;
for (let z = D - 1; z >= 0 && !door; z--) {
  const xs = [];
  for (let x = 0; x < W; x++) if (solid(x, z, G[id(x, z)]) && !solid(x, z + 1, G[id(x, z)]) && F(x, z)) xs.push(x);
  if (xs.length) door = { x: xs.sort((a, b) => Math.abs(a - 10) - Math.abs(b - 10))[0], z };
}

const over = new Map();     // "x,y,z" -> [block, state] overrides (window recesses, glass, lamps, door)
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => over.set(key(x, y, z), [block, state]);
const air = (x, y, z) => over.set(key(x, y, z), null);

// windows: a face cell at a window row (2 of every 4 along the face), carved one block back, a pane one further in,
// an air gap behind the pane (glowstone in some), with solid mass behind all three so no window opens through the wall
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!F(x, z)) continue;
  for (let y = 4; y < TOP - 1; y++) {
    if (!solid(x, z, y)) continue;
    const ex = exposed(x, z, y);
    if (ex.length !== 1) continue;
    const r = y % 4; if (r === 0 || r === 3) continue;
    const [dx, dz] = ex[0];
    const u = dx !== 0 ? z : x; if (u % 4 === 0 || u % 4 === 3) continue;
    if (![1, 2, 3].every((k) => solid(x - dx * k, z - dz * k, y))) continue;
    air(x, y, z);
    put(x - dx, y, z - dz, "light_blue_stained_glass");
    const lit = r === 2 && (x * 7 + z * 13 + y) % 4 === 0;
    if (lit) put(x - 2 * dx, y, z - 2 * dz, "glowstone"); else air(x - 2 * dx, y, z - 2 * dz);
  }
}

// entrance: a three-high recess at ground, double doors on the back wall, a glowstone lamp over them, a lintel above
if (door) {
  const { x, z } = door, g = G[id(x, z)];
  for (let y = g; y < g + 3; y++) { air(x, y, z); air(x, y, z - 1); }
  put(x, g, z - 1, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, g + 1, z - 1, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, g + 2, z - 1, "glowstone");
  put(x, g + 3, z, "stone_bricks");
}

const v = new Voxels([W, Y, D]);
let count = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!F(x, z)) continue;
  const g = G[id(x, z)];
  for (let y = 0; y < TOP; y++) {
    const o = over.get(key(x, y, z));
    if (o === null) continue;                       // carved to air
    if (o) { v.set(x, y, z, o[0], o[1]); count++; continue; }
    if (!solid(x, z, y)) continue;
    const top = !solid(x, z, y + 1);
    const ex = exposed(x, z, y).length > 0;
    let block;
    if (y < g) block = "stone_bricks";                                  // foundation
    else if (top) block = "stone_bricks";                               // cornice, terraces, podium roof
    else if (y < 4) block = ex && y < g + 2 ? "stone_bricks" : "white_concrete";   // plinth course
    else if (y % 4 === 0) block = "smooth_stone";                       // floor line
    else if (y % 4 === 3) block = "light_gray_concrete";                // spandrel
    else block = "white_concrete";                                      // pier and wall
    v.set(x, y, z, block); count++;
  }
}

// rooftop plant on the tower's top (a pair of air-handling boxes) and shrubs on the terraces
for (const [x, z] of [[12, 14], [13, 14], [12, 15], [13, 15], [19, 22], [20, 22]]) {
  if (solid(x, z, TOP - 1) && ring[id(x, z)] >= 6) v.set(x, TOP, z, "iron_block");
}
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!F(x, z) || (x * 3 + z * 7) % 7 !== 0) continue;
  for (let y = PODIUM; y < TOP; y++) {
    if (solid(x, z, y) && !solid(x, z, y + 1) && y !== TOP - 1 && !over.has(key(x, y + 1, z))) {
      v.set(x, y + 1, z, "oak_leaves", { persistent: "true" }); break;
    }
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260089806.nbt";
console.log(v.save(out), { cells: count, door });
