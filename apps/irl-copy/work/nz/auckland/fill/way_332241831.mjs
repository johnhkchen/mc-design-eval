// Mt Eden / Newton, Auckland: a 1960s concrete commercial block on the lower slope. A one-storey shopfront body (plastered
// concrete over a basalt-rubble foundation, flat roof at y 10) with a five-storey office slab on its east edge (the lidar's
// 22-23 tier). The tower stands on the body's roof line; its glazing is blue-tinted, the shop glazing clear. Storeys run
// from each cell's own ground so the floor lines step with the hill; the foundation fills from y 0, and the downhill
// (south) cells show basement windows. Each window has an air gap behind it, floor slabs per storey, and warm lights.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const NAME = "way_332241831";
const cells = JSON.parse(readFileSync(`${DIR}/${NAME}.cells.json`, "utf8"));

const X = 35, Y = 35, Z = 34;
const BODY_TOP = 10;     // flat tier of the shopfront body (lidar roof 9-10, and the stray 14-19 cells read as body)
const TOWER_TOP = 23;    // the east tower's tier (lidar 22-23)
const BAY = 3;           // glass bays between concrete piers
const TOWER_MIN = 20;    // a cell whose lidar roof reads 20+ is tower

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const G = Array.from({ length: X }, () => Array(Z).fill(null));
for (const [x, z, ground, roof] of cells) G[x][z] = { ground, roof };
const inF = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && G[x][z] !== null;
const gnd = (x, z) => G[x][z].ground;
const isTower = (x, z) => G[x][z].roof >= TOWER_MIN;
const top = (x, z) => (isTower(x, z) ? TOWER_TOP : BODY_TOP);
const solid = (x, y, z) => inF(x, z) && y >= 0 && y < top(x, z);
// the sides of (x, y, z) that face air: outside the footprint, or a neighbour that is not solid at y
const exposedDirs = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const key = (x, y, z) => `${x},${y},${z}`;
const winBand = (rel) => rel % 4 === 1 || rel % 4 === 2;     // two window rows per storey, then a spandrel
const relOf = (x, y, z) => (y < gnd(x, z) ? y : y - gnd(x, z));  // below grade: keyed from y 0 (the lower storeys)
// glass piers: a wall running along x is barred every BAY in x, one along z every BAY in z; a diagonal face uses x+z
const isPier = (x, z, E) => {
  const alongX = E.some(([, dz]) => dz !== 0), alongZ = E.some(([dx]) => dx !== 0);
  const i = alongX && alongZ ? x + z : alongX ? x : z;
  return i % BAY === 0;
};
const isWindow = (x, y, z, E) => E.length > 0 && y < top(x, z) - 1 && winBand(relOf(x, y, z)) && !isPier(x, z, E);

// ---- the entrance: the middle of the body's west wall, two blocks high on the street level ----------------------------
const westWall = [];
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z) || isTower(x, z)) continue;
  const E = exposedDirs(x, gnd(x, z), z);
  if (E.length === 1 && E[0][0] === -1) westWall.push([x, z]);
}
westWall.sort((a, b) => a[1] - b[1]);
const [DOOR_X, DOOR_Z] = westWall[Math.floor(westWall.length / 2)];
const isDoor = (x, y, z) => x === DOOR_X && z === DOOR_Z && (y === gnd(x, z) || y === gnd(x, z) + 1);
const doorLintel = (x, y, z) => x === DOOR_X && z === DOOR_Z && y === gnd(x, z) + 2;

// ---- air gaps: the cell inward of each window (and the entrance hall) is air; warm lights sit in some of them ----------
const airAt = new Map();
const lightFor = (x, y, z) => {
  const h = (x * 7 + y * 13 + z * 5) % 9;
  if (h !== 0 && h !== 4) return null;
  return isTower(x, z) ? { block: "glowstone" } : { block: "lantern", state: { hanging: "false", waterlogged: "false" } };
};
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  for (let y = 0; y < top(x, z); y++) {
    const E = exposedDirs(x, y, z);
    if (E.length === 0) continue;
    if (isDoor(x, y, z)) {
      const [dx, dz] = E[0];
      const ix = x - dx, iz = z - dz;
      if (inF(ix, iz) && exposedDirs(ix, y, iz).length === 0) airAt.set(key(ix, y, iz), null);
      continue;
    }
    if (!isWindow(x, y, z, E)) continue;
    const [dx, dz] = E[0];
    const ix = x - dx, iz = z - dz;
    if (!solid(ix, y, iz) || exposedDirs(ix, y, iz).length) continue;   // a one-cell wall has no room behind the glass
    airAt.set(key(ix, y, iz), lightFor(x, y, z));
  }
}

// glass panes connect along the wall they sit in (a wall along x joins east and west, along z north and south)
const paneState = (E) => {
  const alongX = E.some(([, dz]) => dz !== 0), alongZ = E.some(([dx]) => dx !== 0);
  return { north: String(alongZ), south: String(alongZ), east: String(alongX), west: String(alongX), waterlogged: "false" };
};

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// ---- fill: foundation from y 0 to each cell's ground, then the storeys to its tier --------------------------------------
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const gr = gnd(x, z), T = top(x, z), tower = isTower(x, z);
  for (let y = 0; y < T; y++) {
    const E = exposedDirs(x, y, z);
    const outer = E.length > 0;
    if (isDoor(x, y, z)) {
      const up = y === gr + 1;
      put(x, y, z, "dark_oak_door", { facing: "west", half: up ? "upper" : "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (doorLintel(x, y, z)) { put(x, y, z, "stone_bricks"); continue; }
    if (airAt.has(key(x, y, z))) {
      const light = airAt.get(key(x, y, z));
      if (light) put(x, y, z, light.block, light.state);
      continue;
    }
    if (y < gr) {                                   // below grade: basement storeys on the downhill side
      if (outer && winBand(y) && !isPier(x, z, E)) put(x, y, z, tower ? "light_blue_stained_glass_pane" : "glass_pane", paneState(E));
      else if (outer && y % 4 === 0) put(x, y, z, "stone_bricks");
      else put(x, y, z, "cobblestone");
      continue;
    }
    const rel = y - gr;
    if (y === T - 1) { put(x, y, z, outer ? "smooth_stone" : "light_gray_concrete"); continue; }   // parapet / roof
    if (rel === 0) { put(x, y, z, outer ? "stone_bricks" : "white_concrete"); continue; }        // base course / floor slab
    if (rel % 4 === 0) { put(x, y, z, "white_concrete"); continue; }                             // storey string course
    if (rel % 4 === 3) { put(x, y, z, outer ? "smooth_stone" : "light_gray_concrete"); continue; } // spandrel
    if (winBand(rel)) {
      if (outer && !isPier(x, z, E)) {
        const clear = !tower || y < BODY_TOP;
        put(x, y, z, clear ? "glass_pane" : "light_blue_stained_glass_pane", paneState(E));
      } else put(x, y, z, "white_concrete");                                                   // pier / core
      continue;
    }
    put(x, y, z, "light_gray_concrete");
  }
}

// ---- roof: the shopfront's plant units on its flat roof; the tower's parapet and a lift overrun -----------------------
for (let x = 0; x < X - 1; x++) for (let z = 0; z < Z - 1; z++) {
  // a 2 x 2 x 2 plant unit where the four roof cells are interior body cells, one in every eight-by-eight block
  if (x % 8 !== 2 || z % 8 !== 2) continue;
  const block = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!block.every(([a, b]) => inF(a, b) && !isTower(a, b) && exposedDirs(a, BODY_TOP - 1, b).length === 0)) continue;
  for (const [a, b] of block) for (const y of [BODY_TOP, BODY_TOP + 1]) put(a, y, b, "light_gray_concrete");
  put(x, BODY_TOP + 2, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
}
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z) || !isTower(x, z)) continue;
  if (exposedDirs(x, TOWER_TOP - 1, z).length) put(x, TOWER_TOP, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
let overrun = null;
for (let x = 0; x < X - 1 && !overrun; x++) for (let z = 0; z < Z - 1 && !overrun; z++) {
  const block = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (block.every(([a, b]) => inF(a, b) && isTower(a, b) && exposedDirs(a, TOWER_TOP - 1, b).length === 0)) overrun = block;
}
if (overrun) for (const [a, b] of overrun) for (const y of [TOWER_TOP, TOWER_TOP + 1]) put(a, y, b, "light_gray_concrete");

const out = `${DIR}/${NAME}.nbt`;
const stats = g.save(out);
console.log(`door at (${DOOR_X}, ${DOOR_Z}); ${stats.blocks} blocks, ${stats.palette} palette entries -> ${out}`);
