// A single-storey 1920s brick shop block on Mt Eden's lower slope: a red-brick body on a basalt-stone plinth, a
// cream rendered cornice and parapet, a gravel flat roof with an iron plant on it, and a shopfront of glass panes
// between brick piers every four cells. The lidar roof is 6 blocks above y 0 (5 on the eastern fringe) and the lidar
// jitter is smoothed into those two flat tiers. Glass sits in front of a one-block air gap; glowstone lamps in some
// of the gaps. The recessed door sits on the lowest street edge with a stone lintel over it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const NAME = "way_382846313";
const cells = JSON.parse(readFileSync(`${DIR}/${NAME}.cells.json`, "utf8"));

const X = 21, Y = 19, Z = 28;
const BAY = 4;           // a pier every four cells along a wall; the three between are glass
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const key = (x, y, z) => `${x},${y},${z}`;

// ---- footprint and smoothed roof tiers ------------------------------------------------------------
const G = Array.from({ length: X }, () => Array(Z).fill(null));
for (const [x, z, ground, roof] of cells) G[x][z] = { ground, roof };
const inF = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && G[x][z] !== null;
const ground = (x, z) => G[x][z].ground;

// Each cell takes the mean roof of its footprint 3x3 and snaps to the 5 or 6 tier: one flat roof with a lower wing.
const T = Array.from({ length: X }, () => Array(Z).fill(0));
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!inF(x + dx, z + dz)) continue;
    s += G[x + dx][z + dz].roof; n++;
  }
  T[x][z] = s / n >= 5.5 ? 6 : 5;
}
const top = (x, z) => T[x][z];
const h = (x, z) => top(x, z) - ground(x, z);

// The sides of cell (x, y, z) that face air: outside the footprint, or a neighbour whose roof stops below y.
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz) || top(x + dx, z + dz) <= y);
// Facade piers: a wall running along z is barred every BAY cells in z, one running along x every BAY in x; corners
// are always piers.
const isPier = (x, z, ex) => {
  const ax = ex.some(([dx]) => dx !== 0), az = ex.some(([, dz]) => dz !== 0);
  if (ax && az) return true;
  return (ax ? z : x) % BAY === 0;
};

// Window rows: above the plinth (row 0) up to the row under the cornice; the cornice and parapet are the top two.
const isWindow = (x, y, z) => {
  if (!inF(x, z) || y < ground(x, z) || y >= top(x, z)) return false;
  const rel = y - ground(x, z);
  if (rel < 1 || rel > h(x, z) - 3) return false;
  const ex = exposed(x, y, z);
  return ex.length > 0 && !isPier(x, z, ex);
};

// ---- the entrance: a single-sided ground-floor cell on the lowest street edge, nearest the middle of the front ----
let door = null;
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z) || ground(x, z) !== 0) continue;
  const ex = exposed(x, 1, z);
  if (ex.length !== 1 || ex[0][1] !== 1 || isPier(x, z, ex)) continue;
  const score = Math.abs(x - 10);
  if (!door || score < door.score) door = { x, z, score, facing: FACING["0,1"] };
}

// ---- air gaps behind the glass, and the lamps in some of them ----------------------------------
const windows = new Set();
const gaps = new Set();
const lit = new Set();
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  for (let y = 0; y < top(x, z); y++) {
    if (!isWindow(x, y, z)) continue;
    windows.add(key(x, y, z));
    const [dx, dz] = exposed(x, y, z)[0];
    const ix = x - dx, iz = z - dz;
    if (!inF(ix, iz) || exposed(ix, y, iz).length) continue;
    gaps.add(key(ix, y, iz));
    if (y - ground(x, z) === 1 && (x + 2 * z) % 5 === 0) lit.add(key(ix, y, iz));
  }
}

// ---- the solid body, cell by cell -----------------------------------------------------------------
const v = new Voxels([X, Y, Z]);
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const g = ground(x, z), r = top(x, z);
  for (let y = 0; y < r; y++) {
    const k = key(x, y, z);
    if (gaps.has(k)) { if (lit.has(k)) v.set(x, y, z, "glowstone"); continue; }
    const ex = exposed(x, y, z);
    let block;
    if (!ex.length) block = y === r - 1 ? "gravel" : "stone";         // roof surface and solid core
    else if (y === r - 1 || y === r - 2) block = "quartz_block";       // cream plaster parapet cap and cornice
    else if (y < g) block = "stone";                                   // basalt foundation under the plinth
    else if (y === g) block = "stone_bricks";                          // plinth course
    else if (windows.has(k)) block = "glass_pane";
    else block = "bricks";
    v.set(x, y, z, block);
  }
}

// Panes join their neighbours along the wall plane only; the air gap side is left open.
for (const k of windows) {
  const [x, y, z] = k.split(",").map(Number);
  const ax = exposed(x, y, z).some(([dx]) => dx !== 0);
  const link = (dx, dz) => (v.get(x + dx, y, z + dz) !== null ? "true" : "false");
  v.set(x, y, z, "glass_pane", {
    north: ax ? link(0, -1) : "false",
    south: ax ? link(0, 1) : "false",
    east: ax ? "false" : link(1, 0),
    west: ax ? "false" : link(-1, 0),
    waterlogged: "false",
  });
}

// ---- the entrance: a recessed door under a stone lintel -------------------------------------------
if (door) {
  const { x, z, facing } = door;
  const state = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  v.set(x, 0, z, "dark_oak_door", state("lower"));
  v.set(x, 1, z, "dark_oak_door", state("upper"));
  v.set(x, 2, z, "stone_bricks");
}

// ---- roof plant: a 2x2 iron air-handling unit on the flat roof, nearest the middle of the footprint -----------
let plant = null;
for (let x = 0; x < X - 1; x++) for (let z = 0; z < Z - 1; z++) {
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!quad.every(([a, b]) => inF(a, b) && top(a, b) === 6 && !exposed(a, 5, b).length)) continue;
  const score = Math.abs(x - 10) + Math.abs(z - 13);
  if (!plant || score < plant.score) plant = { quad, score };
}
if (plant) for (const [a, b] of plant.quad) v.set(a, 6, b, "iron_block");

v.save(`${DIR}/${NAME}.nbt`);
