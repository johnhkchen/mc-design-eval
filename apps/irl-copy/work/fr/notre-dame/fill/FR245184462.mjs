// FR245184462: an Industriel, agricole ou commercial block on the Île de la Cité, two storeys over a stone plinth with a
// low attic and a flat roof, its lidar tiers (7, 12, 14, 16 blocks) smoothed from a 3x3 median and stepped in clean
// setbacks. A courtyard sits in its east half (the lidar's 10-11 block well). Cream smooth-sandstone walls on a
// stone-brick plinth, string courses at every floor line and a stone cornice on each top, pilasters every third
// cell, and glazed windows set one block back with an air gap behind each pane (a few glowstone lamps replace the
// air). The entrance face gets a commercial shopfront of glass with a dark-oak fascia, a dark-oak door under a
// canopy on posts, and a single stoop step; flat roofs carry a parapet and a few brick chimneys.
// Y 0 is the ground under the footprint; every column is solid from y 0 to its top, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const CELLS = `${DIR}/FR245184462.cells.json`;
const OUT = `${DIR}/FR245184462.nbt`;

const W = 48, H = 32, D = 37;
const PLINTH = 2, FLOORS = [2, 7, 12];
const WALL = "smooth_sandstone", STONE = "stone_bricks", PIER = "stone_bricks", ROOF = "deepslate_tiles";
const PARAPET = "stone_brick_slab",CHIMNEY = "bricks", CAP = "stone_brick_slab", FASCIA = "dark_oak_planks";
const GLOW = "glowstone", GLASS = "glass", DOOR = "dark_oak_door", POST = "dark_oak_fence", CANOPY = "dark_oak_slab";
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];   // dx, dz, facing name

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));

// Lidar tiers: a 3x3 median of the roof heights, then quantized to the four flat levels the massing steps between.
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (raw.has(key(x + dx, z + dz))) v.push(raw.get(key(x + dx, z + dz)));
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (v) => (v <= 9 ? 7 : v <= 12 ? 12 : v <= 14 ? 14 : 16);
const top = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) top.set(key(x, z), tierOf(median(x, z)));
const inFp = (x, z) => top.has(key(x, z));
const topAt = (x, z) => top.get(key(x, z)) ?? 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// 1. Solid massing, course by course: plinth, wall, string course at each floor, cornice on each top.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const T = topAt(x, z);
  for (let y = 0; y < T; y++) {
    let b = WALL;
    if (y < PLINTH) b = STONE;
    else if (FLOORS.includes(y)) b = STONE;
    else if (y === T - 1) b = STONE;
    put(x, y, z, b);
  }
}

// Exposure: a face of (x, z) toward dir is open at height y if the cell beyond it is outside the footprint or lower than y.
const exposedDirs = (x, z, y) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz) || topAt(x + dx, z + dz) <= y);

// 2. Windows: each floor's three-row zone (f+1..f+3) where it fits under the cornice. Piers every third cell on a face,
// corners solid. Panes sit on the wall face with an air gap (or a glowstone lamp) one block behind.
const entranceDir = (() => {  // the face with the longest run of open ground-floor cells: the street front
  let best = null, bestRun = -1;
  for (const [dx, dz, name] of DIRS) {
    let run = 0, maxRun = 0;
    for (const [x, z] of cells.map(([x, z]) => [x, z]).sort((a, b) => a[0] - b[0] || a[1] - b[1])) {
      if (exposedDirs(x, z, 3).some(([ex, ez]) => ex === dx && ez === dz)) run++; else run = 0;
      maxRun = Math.max(maxRun, run);
    }
    if (maxRun > bestRun) { bestRun = maxRun; best = [dx, dz, name]; }
  }
  return best;
})();
const [edx, edz, eName] = entranceDir;

const windowCells = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const T = topAt(x, z);
  for (const f of FLOORS) {
    if (f + 5 > T) continue;                              // the zone must fit under the cornice
    for (let y = f + 1; y <= f + 3; y++) {
      const open = exposedDirs(x, z, y);
      if (open.length !== 1) continue;                    // corners and inner faces stay solid
      const [dx, dz, name] = open[0];
      const along = dz !== 0 ? x : z;
      if (along % 3 === 0) continue;                      // pier
      windowCells.push({ x, y, z, dx, dz, name, f });
    }
  }
}
for (const w of windowCells) {
  const isStreet = w.dx === edx && w.dz === edz && w.y <= 5;
  const pane = (w.dz !== 0)
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  put(w.x, w.y, w.z, isStreet ? GLASS : "glass_pane", isStreet ? undefined : pane);
}
// The air gap behind each window: only where the cell behind is buried (a closed pocket), so nothing opens into the rooms.
for (const w of windowCells) {
  const bx = w.x - w.dx, bz = w.z - w.dz;
  if (!inFp(bx, bz) || topAt(bx, bz) <= w.y) continue;
  const buried = DIRS.every(([ddx, ddz]) => inFp(bx + ddx, bz + ddz) && topAt(bx + ddx, bz + ddz) > w.y);
  if (!buried) continue;
  const lamp = (w.x * 7 + w.z * 13 + w.y * 5) % 11 === 0 || (w.f === 2 && w.dx === edx && w.dz === edz && (w.x + w.z) % 4 === 0);
  put(bx, w.y, bz, lamp ? GLOW : "air");
}

// 3. Entrance: a dark-oak door in the middle of the street face's longest open run, lintel and fascia above the shopfront,
// a stone stoop, and a canopy on two posts.
const streetCells = cells.map(([x, z]) => [x, z]).filter(([x, z]) => exposedDirs(x, z, 3).some(([dx, dz]) => dx === edx && dz === edz));
const alongOf = ([x, z]) => (edz !== 0 ? x : z);
streetCells.sort((a, b) => alongOf(a) - alongOf(b));
let run = [], runs = [];
for (const c of streetCells) {
  if (run.length && alongOf(c) !== alongOf(run[run.length - 1]) + 1) { runs.push(run); run = []; }
  run.push(c);
}
if (run.length) runs.push(run);
const mainRun = runs.reduce((a, b) => (b.length > a.length ? b : a));
const [doorX, doorZ] = mainRun[Math.floor(mainRun.length / 2)];
// Dark-oak fascia along the shopfront; the shopfront glass stays in the windows, the door's own lintel is stone.
for (const [x, z] of mainRun) put(x, 6, z, FASCIA);
put(doorX, 4, doorZ, STONE);
put(doorX, 5, doorZ, STONE);
put(doorX, 2, doorZ, DOOR, { facing: eName, half: "lower", hinge: "left", open: "false", powered: "false" });
put(doorX, 3, doorZ, DOOR, { facing: eName, half: "upper", hinge: "left", open: "false", powered: "false" });
// Canopy outside the door: the stoop at the door's foot, two posts and a slab roof over the door.
const outX = doorX + edx, outZ = doorZ + edz;
const sideX = edz !== 0 ? 1 : 0, sideZ = edx !== 0 ? 1 : 0;
put(outX, 0, outZ, STONE);
put(outX, 1, outZ, "stone_brick_stairs", { facing: eName, half: "bottom", shape: "straight", waterlogged: "false" });
for (const s of [-1, 1]) {
  for (let y = 0; y <= 4; y++) put(outX + s * sideX, y, outZ + s * sideZ, POST);
}
for (const s of [-1, 0, 1]) put(outX + s * sideX, 5, outZ + s * sideZ, CANOPY, { type: "bottom", waterlogged: "false" });

// 4. Roofs: a flat roof tile field inside, a stone-brick parapet on every edge that drops off, brick chimneys on the big tier.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const T = topAt(x, z);
  const edge = DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz) || topAt(x + dx, z + dz) < T);
  if (edge) put(x, T, z, PARAPET, { type: "bottom", waterlogged: "false" });
  else put(x, T, z, ROOF);
}
const chimneys = cells.map(([x, z]) => [x, z]).filter(([x, z]) => topAt(x, z) === 14 && x % 8 === 4 && z % 8 === 4 &&
  DIRS.every(([dx, dz]) => inFp(x + dx, z + dz) && topAt(x + dx, z + dz) >= 14));
for (const [x, z] of chimneys) {
  for (let y = 14; y <= 16; y++) put(x, y, z, CHIMNEY);
  put(x, 17, z, CAP, { type: "bottom", waterlogged: "false" });
}

const stats = g.save(OUT);
console.log(`built FR245184462: ${stats.blocks} blocks, ${stats.palette} palette entries, street face ${eName}, door at ${doorX},${doorZ}, ${chimneys.length} chimneys`);
