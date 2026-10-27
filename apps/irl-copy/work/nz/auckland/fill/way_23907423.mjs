// way 23907423: a 1960s-70s concrete-framed office and apartment block (Newton / Eden Terrace edge), 7 storeys on a
// flat slab with an 8-storey core set in the middle and a 9-storey stair tower at the south-west corner.
// Frontage assumed on the north (z = 0) edge: stone base, shopfront glass, the entrance at x = 5.
// Massing follows the lidar roof: slab 28-30 -> cap 29, core 31-33 -> cap 33 (a clean rectangle), tower 34-35 -> cap 37.
// Storeys are 4 blocks: floor line (light grey), two rows of glass in concrete piers, spandrel (white concrete).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_23907423.cells.json`, "utf8"));
const SIZE = [26, 48, 39];

const SLAB = 29, CORE = 33, TOWER = 37;
const PANE = "light_blue_stained_glass_pane";
const inCore = (x, z) => x >= 11 && x <= 18 && z >= 21 && z <= 30;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the footprint: each cell with its roof cap R; faces toward neighbours that are outside or lower (exposed from yLo up)
const fp = new Map();
for (const [x, z, , r] of cells) {
  const R = r >= 34 ? TOWER : inCore(x, z) ? CORE : SLAB;
  fp.set(`${x},${z}`, { x, z, R, faces: [] });
}
const at = (x, z) => fp.get(`${x},${z}`);
for (const c of fp.values()) {
  for (const [dx, dz] of DIRS) {
    const n = at(c.x + dx, c.z + dz);
    if (!n) c.faces.push({ dx, dz, yLo: 1, outside: true });
    else if (n.R < c.R) c.faces.push({ dx, dz, yLo: n.R + 1, outside: false });
  }
  c.outside = c.faces.some((f) => f.outside);
}

const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => B.has(`${x},${y},${z}`);
const wallAt = (c, y) => c.faces.some((f) => y >= f.yLo);
const paneAxis = new Map();
const glassFaces = [];

for (const c of fp.values()) {
  const { x, z, R } = c;
  put(x, 0, z, "stone_bricks");                                             // base course
  for (let y = 1; y < R; y += 4) put(x, y, z, "light_gray_concrete");      // floor slab per storey (interior too)
  for (let y = 1; y < R; y++) {
    const act = c.faces.filter((f) => y >= f.yLo);
    if (!act.length) continue;
    const rel = (y - 1) % 4;
    if (rel === 0) continue;
    if (rel === 3) { put(x, y, z, "white_concrete"); continue; }
    const corner = act.some((f) => f.dx !== 0) && act.some((f) => f.dz !== 0);
    const onZFace = act.some((f) => f.dz !== 0);                           // a wall running along x
    const pier = corner || (onZFace ? x % 3 === 0 : z % 3 === 0);
    const ground = y <= 3;
    if (pier) { put(x, y, z, ground ? "stone_bricks" : "white_concrete"); continue; }
    put(x, y, z, PANE);
    paneAxis.set(`${x},${y},${z}`, onZFace ? "x" : "z");
    glassFaces.push({ c, y, act });
  }
  // roof: a light cornice course on the exposed edge, plain roof elsewhere; a coping slab on the outer edge
  put(x, R, z, c.faces.length ? "light_gray_concrete" : "gray_concrete");
  if (c.outside) put(x, R + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  // interior structure: columns on a 4-cell grid carry the storey slabs (no interior, just structure)
  if (!c.faces.length && x % 4 === 2 && z % 4 === 2) for (let y = 0; y < R; y++) put(x, y, z, "white_concrete");
  // roof equipment: plant boxes on the slab terrace and on the core roof
  const plant = (x >= 6 && x <= 8 && z >= 9 && z <= 11) || (x >= 17 && x <= 19 && z >= 33 && z <= 34) || (x >= 13 && x <= 14 && z >= 24 && z <= 25);
  if (!c.faces.length && plant && !(x % 4 === 2 && z % 4 === 2)) { put(x, R + 1, z, "light_gray_concrete"); put(x, R + 2, z, "light_gray_concrete"); }
}

// warm light: glowstone on the floor just inside some window rows (the air gap behind the glass)
for (const { c, y, act } of glassFaces) {
  if ((y - 1) % 4 !== 1 || (c.x * 3 + c.z * 5 + y) % 4 !== 0) continue;
  const f = act[0];
  const n = at(c.x - f.dx, c.z - f.dz);
  if (!n || n.R <= y || wallAt(n, y) || (!n.faces.length && n.x % 4 === 2 && n.z % 4 === 2)) continue;
  put(n.x, y, n.z, "glowstone");
}

// the entrance on the north edge (x 5): stone step up, iron door, lintel; shopfront glass beside it
put(5, 0, 0, "stone_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" });
put(5, 2, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(5, 3, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
paneAxis.delete("5,2,0");
paneAxis.delete("5,3,0");

// glass panes connect along their wall to neighbours in that plane (so the frames read as one run)
for (const [key, axis] of paneAxis) {
  const [x, y, z] = key.split(",").map(Number);
  const arms = axis === "x"
    ? { east: has(x + 1, y, z) ? "true" : "false", west: has(x - 1, y, z) ? "true" : "false", north: "false", south: "false" }
    : { east: "false", west: "false", north: has(x, y, z - 1) ? "true" : "false", south: has(x, y, z + 1) ? "true" : "false" };
  B.get(key).state = { ...arms, waterlogged: "false" };
}

const g = new Voxels(SIZE);
for (const [key, { block, state }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/way_23907423.nbt`);
console.log(`way_23907423.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
