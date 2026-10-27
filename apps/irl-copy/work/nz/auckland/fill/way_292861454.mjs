// Way 292861454: a 1980s concrete-and-glass office block on the Mt Eden / CBD fringe (7 storeys of white-banded
// glazing, a 9-storey stepped tower on its north-east corner, a plant room on the main roof). Massing follows the
// lidar roof, quantised to flat tiers: open ≤4, low wing 12, mid 20, main 28, tower 40 with a 34 setback ring.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861454.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861454.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const W = 32, D = 24, H = 53;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const M = {
  found: "stone_bricks",          // foundation below each cell's ground
  pave: "smooth_stone",           // open forecourt / light-court paving
  slab: "light_gray_concrete",    // interior floor slabs and roof deck
  band: "white_concrete",         // storey lines and mullions
  spandrel: "light_gray_concrete",
  glass: "light_blue_stained_glass",
  stone: "stone_bricks",          // base course, cornice, piers, parapet
  fascia: "smooth_stone",
  canopy: "dark_oak_planks",
  plant: "gray_concrete",
  plantTop: "smooth_stone",
};

const tierOf = (r) => (r <= 4 ? 0 : r <= 13 ? 12 : r <= 24 ? 20 : r <= 31 ? 28 : 40);
const col = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, ground, roof] of cells) col[x][z] = { g: ground, T: tierOf(roof) };
const at = (x, z) => (x >= 0 && z >= 0 && x < W && z < D ? col[x][z] : null);

// too shallow to hold a storey counts as open
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { const c = col[x][z]; if (c && c.T && c.T < c.g + 4) c.T = 0; }

// setbacks: a tower cell is the 40 core only if at least three of its four neighbours are tower too (the tower is
// only two to four cells deep, so a full ring of neighbours would leave it as fins); its edge steps down to 34
const step = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const c = col[x][z]; if (c && c.T === 40 && DIRS.filter(([dx, dz]) => at(x + dx, z + dz)?.T === 40).length < 3) step.push(c);
}
for (const c of step) c.T = 34;

// lidar fins: a tall cell with fewer than two tall neighbours is noise, not a tower; it drops to the main roof
const tall = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const c = col[x][z]; if (c && c.T >= 34 && DIRS.filter(([dx, dz]) => (at(x + dx, z + dz)?.T ?? 0) >= 28).length < 2) tall.push(c);
}
for (const c of tall) c.T = 28;

const body = (c, y) => !!c && c.T > 0 && y >= c.g && y < c.T;
const occ = (x, z, y) => { const c = at(x, z); return !!c && (y < c.g || body(c, y)); };
const wallAt = (x, z, y) => DIRS.some(([dx, dz]) => !occ(x + dx, z + dz, y));
const interiorAir = (x, z, y) => { const c = at(x, z); return body(c, y) && y % 4 !== 0 && y % 4 !== 3 && y !== c.g && y !== c.T - 1 && !wallAt(x, z, y); };

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// shell: foundation, storeys, glazing, cornice
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const c = col[x][z]; if (!c) continue;
  if (c.T === 0) {
    if (c.g === 0) put(x, 0, z, M.pave);
    else { for (let y = 0; y < c.g - 1; y++) put(x, y, z, M.found); put(x, c.g - 1, z, M.pave); }
    continue;
  }
  for (let y = 0; y < c.g; y++) put(x, y, z, M.found);
  for (let y = c.g; y < c.T; y++) {
    const wall = wallAt(x, z, y), u = x + z;
    let b = null;
    if (y === c.T - 1) b = wall ? M.stone : M.slab;                       // roof deck, cornice on the outside
    else if (!wall) b = y % 4 === 0 || y === c.g ? M.slab : null;          // interior: slabs only, air gap between
    else if (y === c.g) b = M.stone;                                       // base course
    else if (y < 4) b = y === 3 ? M.fascia : u % 3 === 0 ? M.stone : M.glass;   // shopfront
    else if (y % 4 === 0) b = M.band;                                      // storey line
    else if (y % 4 === 3) b = M.spandrel;
    else b = u % 3 === 0 ? M.band : M.glass;                               // window grid: mullion every 3
    if (b) put(x, y, z, b);
  }
  // parapet one course above the roof where the edge drops away
  if (DIRS.some(([dx, dz]) => !occ(x + dx, z + dz, c.T - 1))) put(x, c.T, z, M.stone);
}

// warm lights behind some glass, one block inside the wall
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const c = col[x][z]; if (!c || c.T === 0) continue;
  for (let y = c.g; y < c.T; y++) {
    if (y % 4 === 0 || y % 4 === 3 || y === c.g || !wallAt(x, z, y)) continue;
    if ((x * 7 + z * 3 + y * 5) % 11 !== 0) continue;
    for (const [dx, dz] of DIRS) {
      if (interiorAir(x + dx, z + dz, y)) { put(x + dx, y, z + dz, (x + z) % 2 ? "shroomlight" : "glowstone"); break; }
    }
  }
}

// entrance: a pair of double doors on the south (+z) face, the first run of exposed ground-floor cells nearest the middle
const southExposed = (x, z) => { const c = at(x, z); return !!c && c.T > 0 && c.g <= 1 && !occ(x, z + 1, c.g + 1); };
let door = null;
for (let z = D - 1; z >= 0 && !door; z--) {
  let bestX = null;
  for (let x = 0; x < W - 1; x++) if (southExposed(x, z) && southExposed(x + 1, z)) {
    if (bestX === null || Math.abs(x + 0.5 - 16) < Math.abs(bestX + 0.5 - 16)) bestX = x;
  }
  if (bestX !== null) door = { x: bestX, z };
}
if (door) {
  const { x, z } = door, gy = at(x, z).g;
  const hinge = [["left", x], ["right", x + 1]];
  for (const [h, dx] of hinge) {
    put(dx, gy + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: h, open: "false", powered: "false" });
    put(dx, gy + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: h, open: "false", powered: "false" });
  }
  for (let dx = x - 1; dx <= x + 2; dx++) if (body(at(dx, z), gy + 3)) put(dx, gy + 3, z, M.canopy);
  if (interiorAir(x, z - 1, gy + 3)) put(x, gy + 3, z - 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// roof plant: a 5 x 4 box on the main roof's deep interior (every cell within 2 is main roof)
const deep = (x, z) => { for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (at(x + dx, z + dz)?.T !== 28) return false; return true; };
let plant = null;
for (let x0 = 0; x0 + 4 < W; x0++) for (let z0 = 0; z0 + 3 < D; z0++) {
  let ok = true;
  for (let x = x0; x <= x0 + 4 && ok; x++) for (let z = z0; z <= z0 + 3 && ok; z++) ok = deep(x, z);
  if (!ok) continue;
  const d = Math.hypot(x0 + 2 - 16, z0 + 1.5 - 12);
  if (!plant || d < plant.d) plant = { x0, z0, d };
}
if (plant) {
  for (let x = plant.x0; x <= plant.x0 + 4; x++) for (let z = plant.z0; z <= plant.z0 + 3; z++) {
    for (let y = 28; y <= 30; y++) put(x, y, z, M.plant);
    put(x, 31, z, M.plantTop);
  }
}

const info = g.save(OUT);
console.log(JSON.stringify({ out: OUT, door, plant, ...info }));
