// 145 West 45th Street (NYC 1022634), Commercial & Office, 1911. A Renaissance Revival loft-office: a 3-block
// storey rhythm of red brick piers and glass bays, a calcite belt course at each floor line, a stone cornice and a
// parapet, a granite base with a shopfront and two entrances under black awnings. The lidar roof gives three tiers:
// the main roof at 42, a block of 46 on the east half and a 48 crown on the north-east corner (setbacks by the data).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${HERE}/NYC1022634.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 19, D = 25, H = 60;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Footprint, ground and raw lidar roof. The roof is cleaned by a 3x3 median (kills the lone 1, 6, 10, 25 spikes),
// then snapped to the three tiers the data shows.
const GROUND = Array.from({ length: W }, () => Array(D).fill(null));
const RAW = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, ground, roof] of cells) { GROUND[x][z] = ground; RAW[x][z] = roof; }
const has = (x, z) => x >= 0 && z >= 0 && x < W && z < D && GROUND[x][z] !== null;
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (has(x + dx, z + dz)) v.push(RAW[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (v) => (v < 44.5 ? 42 : v < 47 ? 46 : 48);
const TIER = Array.from({ length: W }, () => Array(D).fill(null));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (has(x, z)) TIER[x][z] = tierOf(median(x, z));

// Storey rhythm: belt course at y = 1, 4, ..., 37 (3-block storeys), windows on the two rows above each belt.
// Upper tiers: slab 41, windows 42-43, deck 44 (46 tier); slab 45, frieze 45, deck 46 (48 tier).
const slabRow = (y, t) => (y >= 1 && y <= 37 && y % 3 === 1) || y === 40 || (t >= 46 && (y === 41 || y === 44)) || (t === 48 && (y === 45 || y === 46));
const winRow = (y, t) => (y >= 2 && y <= 39 && (y % 3 === 2 || y % 3 === 0)) || (t >= 46 && (y === 42 || y === 43));
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz) || TIER[x + dx][z + dz] <= y);

// Facade skin: base, belts, cornice, parapet, quoins, then windows in piers of period 3 (glass between).
function facade(x, y, z, t, ex) {
  const corner = ex.length >= 2;
  if (y <= 1) return "polished_granite";
  if (y === t - 1) return "stone_bricks";                                                 // parapet
  if (y === 40 || (t >= 46 && y === 44) || (t === 48 && y === 46)) return "calcite";     // cornice
  if (t === 48 && y === 45) return "polished_andesite";                                   // crown frieze
  if ((y % 3 === 1 && y <= 37) || (t >= 46 && y === 41)) return "calcite";                // belt course
  if (corner) return "calcite";                                                           // quoins
  if (winRow(y, t)) {
    const alongX = ex.some(([, dz]) => dz !== 0);
    const u = alongX ? x : z;
    if (u % 3 === 0) return y <= 3 ? "polished_granite" : "bricks";                       // piers (granite at shopfront)
    return "glass_pane";
  }
  return "bricks";
}

// Build the cell-level block map: every solid block (x, y, z) -> [block, state].
const M = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => M.set(key(x, y, z), { block, state });
const facadeAt = new Map();   // key -> outward direction(s), for windows and their backing
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!has(x, z)) continue;
  const t = TIER[x][z];
  const depth = Math.min(x, W - 1 - x, z, D - 1 - z);
  for (let y = 0; y < t; y++) {
    const ex = exposed(x, z, y);
    const shell = depth <= 1 || ex.length > 0;
    if (!(y === 0 || slabRow(y, t) || shell)) continue;
    if (ex.length) {
      put(x, y, z, facade(x, y, z, t, ex));
      facadeAt.set(key(x, y, z), ex);
    } else if (shell) {
      put(x, y, z, y === t - 2 ? "blackstone" : "bricks");     // backing wall; deck top is tar roof
    } else if (y === 0) {
      put(x, y, z, "stone_bricks");
    } else {
      put(x, y, z, y === t - 2 ? "blackstone" : "smooth_stone"); // floor slab / deck inside
    }
  }
}

// Entrances: double doors on the street face (z 24) and a second pair on the north face (z 0), black awnings above.
const DOORS = [
  { x: 7, z: 24, facing: "south", hinge: "left" }, { x: 8, z: 24, facing: "south", hinge: "right" },
  { x: 10, z: 0, facing: "north", hinge: "left" }, { x: 11, z: 0, facing: "north", hinge: "right" },
];
for (const d of DOORS) {
  const inward = d.z === 24 ? d.z - 1 : d.z + 1;
  for (const y of [2, 3]) {
    put(d.x, y, d.z, "iron_door", { facing: d.facing, half: y === 2 ? "lower" : "upper", hinge: d.hinge, open: "false", powered: "false" });
    M.delete(key(d.x, y, inward));    // a lobby cell behind each door
  }
}
for (let x = 6; x <= 9; x++) put(x, 4, 24, "black_concrete");
for (let x = 9; x <= 12; x++) put(x, 4, 0, "black_concrete");

// Glass: air gap behind each pane (the backing cell goes), warm glowstone in some lower-row bays.
for (const [k, ex] of facadeAt) {
  const [x, y, z] = k.split(",").map(Number);
  if (!M.has(k) || M.get(k).block !== "glass_pane") continue;
  const [dx, dz] = ex[0];
  const back = key(x - dx, y, z - dz);
  M.delete(back);
  const lit = y % 3 === 2 && ((x * 7 + y * 3) % 11 === 0 || (y <= 3 && x % 2 === 0));
  if (lit) M.set(back, { block: "glowstone", state: undefined });
}

// Water tank on the main roof: stone pedestal, spruce tank, slab cap.
for (let x = 2; x <= 4; x++) for (let z = 10; z <= 12; z++) {
  put(x, 41, z, "stone_bricks");
  for (let y = 42; y <= 45; y++) put(x, y, z, "spruce_planks");
  put(x, 46, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}

// Glass panes connect to neighbouring solid blocks and panes in their plane (east/west on a street face).
const isPane = (x, y, z) => M.get(key(x, y, z))?.block === "glass_pane";
for (const [k, v] of M) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const ex = facadeAt.get(k) ?? [[0, 1]];
  const alongX = ex.some(([, dz]) => dz !== 0);
  const side = (dx, dz) => (M.has(key(x + dx, y, z + dz)) ? "true" : "false");
  v.state = alongX
    ? { north: side(0, -1), east: "false", south: side(0, 1), west: "false", waterlogged: "false" }
    : { north: "false", east: side(1, 0), south: "false", west: side(-1, 0), waterlogged: "false" };
}

// Write the structure.
const g = new Voxels([W, H, D]);
for (const [k, v] of M) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save(`${HERE}/NYC1022634.nbt`);

// Checks: nothing unsupported (no air below and no neighbour in the same course), tiers as found.
let floating = 0;
for (const [k] of M) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 0 || M.has(key(x, y - 1, z))) continue;
  if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => M.has(key(x + dx, y, z + dz)))) continue;
  floating++;
}
const tiers = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (has(x, z)) tiers[TIER[x][z]] = (tiers[TIER[x][z]] ?? 0) + 1;
console.log(JSON.stringify({ blocks: out.blocks, palette: out.palette, floating, tiers }));
