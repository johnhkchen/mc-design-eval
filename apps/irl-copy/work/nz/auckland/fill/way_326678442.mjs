// Phoenix Gardens: a 1980s concrete-frame tower on a shopfront base (14 storeys, 4 blocks each). Ground floor is retail
// glass, the storeys above are glazed bands between precast spandrels, the outer ring steps down to 46 and 54, the core
// rises to 62, and a plant box sits on the roof. Foundation and plinth are stone; the walls stand on the plinth and
// every floor slab rests on a column grid, so nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326678442.cells.json", "utf8"));

const W = 49, H = 74, D = 54;
const PLINTH = 6;           // the ground floor's level: above the lowest lidar ground (5) so one storey line serves every cell
const STOREY = 4;
const TOP_CAP = 62;          // the core's roof (lidar max 61, the request's 62)
const RING_1 = 46, RING_2 = 54;   // setbacks: the outer ring stops at 46, the second ring at 54
const COLUMN_GRID = 6;       // interior structural columns, so every floor stands on something

const key = (x, z) => `${x},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const fp = new Map();                       // "x,z" -> { ground, roof }
for (const [x, z, g, r] of cells) fp.set(key(x, z), { ground: g, roof: r });

// lidar roof -> whole storey lines (PLINTH + n * STOREY), capped at the core's top
const storeyLine = (r) => Math.min(TOP_CAP, PLINTH + STOREY * Math.round((r - PLINTH) / STOREY));

// distance in cells from the outside edge (1 = on the edge): drives the setbacks
const dist = new Map();
let frontier = [];
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => !fp.has(key(x + dx, z + dz)))) { dist.set(k, 1); frontier.push([x, z]); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of DIRS) {
    const k2 = key(x + dx, z + dz);
    if (fp.has(k2) && !dist.has(k2)) { dist.set(k2, d + 1); next.push([x + dx, z + dz]); }
  }
  frontier = next;
}

// each column's top (exclusive): the storey line under its lidar roof, stepped in at the rim
const top = new Map();
for (const [k, { roof }] of fp) {
  const d = dist.get(k);
  let t = storeyLine(roof);
  if (d === 1) t = Math.min(t, RING_1);
  else if (d === 2) t = Math.min(t, RING_2);
  top.set(k, t);
}
const inside = (x, y, z) => {
  const k = key(x, z);
  return top.has(k) && y >= PLINTH && y < top.get(k);
};
const outward = (x, y, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, y, z + dz));

// the entrance: the middle two cells of the +z (south) edge's ground floor
const southEdgeX = [];
for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  if (dist.get(k) === 1 && !fp.has(key(x, z + 1))) southEdgeX.push(x);
}
southEdgeX.sort((a, b) => a - b);
const midX = southEdgeX[Math.floor(southEdgeX.length / 2)];
const doorXs = [midX - 1, midX].filter((x) => southEdgeX.includes(x));
const doorZ = Math.max(...[...fp.keys()].filter((k) => k.startsWith(`${midX},`)).map((k) => Number(k.split(",")[1])));

const g = new Voxels([W, H, D]);
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// 1. foundation (below each cell's ground) and plinth (ground up to the storey line)
for (const [k, { ground }] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < PLINTH; y++) g.set(x, y, z, y < ground ? "stone" : "stone_bricks");
}

// 2. the building, storey row by storey row
const LIGHT_MATS = ["glowstone", "shroomlight"];
for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  // the tier's edge: a neighbour that is off the footprint or stops below this column's top
  const edge = DIRS.some(([dx, dz]) => !top.has(key(x + dx, z + dz)) || top.get(key(x + dx, z + dz)) <= t);
  for (let y = PLINTH; y < t; y++) {
    const rel = (y - PLINTH) % STOREY;
    const ground = y < PLINTH + STOREY;                          // the shopfront storey
    const out = outward(x, y, z);
    const isWall = out.length > 0;
    if (y === t - 1) {                                            // the roof cap, the top row of every column
      g.set(x, y, z, isWall && ground ? "stone_bricks" : "light_gray_concrete");
      continue;
    }
    if (!isWall) {
      // interior: a floor slab per storey on a column grid; air between
      const onGrid = x % COLUMN_GRID === 0 && z % COLUMN_GRID === 0;
      if (onGrid) g.set(x, y, z, "light_gray_concrete");
      else if (rel === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    // exterior: the face's material by row
    if (out.length === 2) { g.set(x, y, z, "white_concrete"); continue; }   // a corner pier
    const [nx, nz] = out[0];
    const along = nx !== 0 ? z : x;                               // the coordinate that runs along the face
    if (ground) {
      if (rel === 0) g.set(x, y, z, "polished_andesite");          // base course
      else if (rel === 3) g.set(x, y, z, "stone_bricks");          // fascia
      else g.set(x, y, z, along % 3 === 0 ? "stone_bricks" : "glass");   // shopfront glass
    } else if (rel === 0 || rel === 3) {
      g.set(x, y, z, "light_gray_concrete");                       // spandrel, storey line
    } else {
      if (along % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // mullion
      g.set(x, y, z, "light_blue_stained_glass");
    }
  }
  // a parapet course on the edge of every tier, and the warm light for some windows
  if (edge) g.set(x, t, z, "stone_brick_wall");
}

// warm light behind some upper windows: the cell just inside the glass (air in the cavity)
for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  for (let y = PLINTH + STOREY + 1; y < t - 1; y++) {
    const rel = (y - PLINTH) % STOREY;
    if (rel !== 1 && rel !== 2) continue;
    const out = outward(x, y, z);
    if (out.length !== 1) continue;
    const h = hash(x, y, z);
    if (h % 11 !== 0) continue;
    const [nx, nz] = out[0];
    const [ix, iz] = [x - nx, z - nz];
    if (!inside(ix, y, iz) || ix % COLUMN_GRID === 0 && iz % COLUMN_GRID === 0) continue;
    g.set(ix, y, iz, LIGHT_MATS[(h >>> 7) % 2]);
  }
}

// 3. the entrance: a pair of dark oak doors on the south face, lanterns in the lobby
for (const x of doorXs) {
  const hinge = x === doorXs[0] ? "left" : "right";
  for (const [y, half] of [[PLINTH + 1, "lower"], [PLINTH + 2, "upper"]]) {
    g.set(x, y, doorZ, "dark_oak_door", { facing: "south", half, hinge, open: "false", powered: "false" });
  }
  g.set(x, PLINTH + 1, doorZ - 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// 4. roof plant: a box on the core, stood on the 62 roof, with louvres on its sides
const core = [...top].filter(([, t]) => t === TOP_CAP).map(([k]) => k.split(",").map(Number));
let plant = null;
for (const size of [4, 3]) {
  for (const [cx, cz] of core) {
    const ok = [];
    for (let dx = -size; dx <= size; dx++) for (let dz = -size; dz <= size; dz++) ok.push(top.get(key(cx + dx, cz + dz)) === TOP_CAP);
    if (ok.every(Boolean)) { plant = { cx, cz, size }; break; }
  }
  if (plant) break;
}
if (plant) {
  const { cx, cz, size } = plant;
  for (let dx = -size; dx <= size; dx++) for (let dz = -size; dz <= size; dz++) {
    const x = cx + dx, z = cz + dz, edgeCell = Math.abs(dx) === size || Math.abs(dz) === size;
    for (let y = TOP_CAP; y < TOP_CAP + 3; y++) {
      if (!edgeCell) continue;
      const louvre = (dx + dz + y) % 2 === 0 && (Math.abs(dx) !== size || Math.abs(dz) !== size);
      g.set(x, y, z, louvre ? "iron_bars" : "light_gray_concrete");
    }
    g.set(x, TOP_CAP + 3, z, "light_gray_concrete");              // the plant roof
  }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326678442.nbt");
console.log("Phoenix Gardens", stats, { entrance: doorXs, plant });
