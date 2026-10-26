// FR245184605: a commercial block on the Île de la Cité, built on the lidar footprint (15 x 50). Pale limestone walls
// (calcite) with stone-brick string courses and cornices, a dark-oak shopfront fascia on the ground floor, glass bays
// with an air gap behind each pane and a stone slab per storey, deepslate-tile roofs behind parapets, mansard eaves on the
// tall tiers. Lidar roofs are median-smoothed and snapped to storey tiers of 5 blocks (1 to 4 storeys).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184605.cells.json`, "utf8"));

const W = 15, H = 35, D = 50;
const TIERS = [5, 10, 15, 20];                      // roof heights: 1 to 4 storeys
const FLOOR = 5;                                    // storey height in blocks
const MANSARD = 15;                                 // tiers at or above this get a sloped eave

const fp = new Map();                               // "x,z" -> { g, lidar, T }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, lidar: r, T: 0 });
const at = (x, z) => fp.get(`${x},${z}`);
const topAt = (x, z) => at(x, z)?.T ?? 0;           // no cell: open air
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const INWARD = { north: "south", south: "north", west: "east", east: "west" };   // a stair or door faces into the building

// Smooth the lidar: 3x3 median, then snap to the nearest storey tier (kills the noisy edge cells and the stepped roof).
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) vals.push(n.lidar); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.T = TIERS.reduce((best, t) => (Math.abs(t - med) < Math.abs(best - med) ? t : best));
}

// The faces of a cell at height y that look onto air (no building cell beside it that reaches that row).
const exposed = (x, z, y) => NEI.filter(([, dx, dz]) => topAt(x + dx, z + dz) <= y);

// Entrances: on each long (east and west) face, the middle of the ground-floor run of that face.
const DOORS = new Set();
for (const name of ["west", "east"]) {
  const run = [];
  for (const [key, c] of fp) {
    const [x, z] = key.split(",").map(Number);
    if (c.g !== 1 || c.T < FLOOR) continue;
    const ex = exposed(x, z, 1);
    if (ex.length === 1 && ex[0][0] === name) run.push([x, z]);
  }
  if (!run.length) continue;
  run.sort((a, b) => a[1] - b[1]);
  const [x, z] = run[Math.floor(run.length / 2)];
  DOORS.add(`${x},${z},${name}`);
}

// The building's blocks: key "x,y,z" -> { block, state }. Air is an absent key.
const B = new Map();
const key3 = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => B.set(key3(x, y, z), { block, state });
const FACADE = new Set();                           // cells on the outer skin
const AIR = [];                                     // [x, y, z, lit] cells behind a window (the recess; lit: a lamp inside)

for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.g; y++) put(x, y, z, "stone_bricks");        // plinth under the cell, nothing floats on a slope
  for (let y = c.g; y < c.T; y++) {
    const ex = exposed(x, z, y);
    if (!ex.length) { put(x, y, z, y === c.T - 1 ? "deepslate_tiles" : "stone"); continue; }
    FACADE.add(key3(x, y, z));
    const [name, dx, dz] = ex[0];
    const along = dx ? z : x;                       // position along the face
    const s = Math.floor(y / FLOOR), r = y % FLOOR;  // storey index and the row within it
    const top = y === c.T - 1;
    const winRow = s === 0 ? r >= 1 && r <= 3 : r === 2 || r === 3;   // shopfront glass, or upper-floor windows
    let block = "calcite";
    if (ex.length > 1) block = "chiseled_stone_bricks";                  // quoins at the corners
    else if (top || r === 0) block = "stone_bricks";                    // cornice and string course
    else if (s === 0 && r === 4) block = "dark_oak_planks";             // shopfront fascia
    else if (winRow && along % 3 !== 0) block = "glass";                // two panes to a bay, a pier between
    else block = "calcite";                                             // piers, sills and lintels
    if (DOORS.has(`${x},${z},${name}`) && y <= c.g + 1 && y >= c.g) {
      // the entrance: a dark oak door (two halves) under a fascia lintel
      const f = INWARD[name];
      if (y === c.g) put(x, y, z, "dark_oak_door", { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "dark_oak_door", { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (DOORS.has(`${x},${z},${name}`) && y === c.g + 2) { put(x, y, z, "dark_oak_planks"); continue; }
    put(x, y, z, block);
    if (block === "glass" && ex.length === 1) {
      AIR.push([x - dx, y, z - dz, ((x * 5 + y * 3 + z * 7) % 9 === 0)]);
    }
  }
}

// Recesses: the air behind each window, one cell in from the glass. Some hold a lamp (glowstone behind the pane).
for (const [x, y, z, lit] of AIR) {
  const k = key3(x, y, z);
  if (!at(x, z) || FACADE.has(k)) continue;
  if (lit) put(x, y, z, "glowstone"); else B.delete(k);
}

// The parapet on the top edge (a mansard eave on the tall tiers), and roof chimneys on the flat tops.
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposed(x, z, c.T - 1);
  if (ex.length) {
    if (c.T >= MANSARD) put(x, c.T, z, "deepslate_tile_stairs", { facing: INWARD[ex[0][0]], half: "bottom", shape: "straight", waterlogged: "false" });
    else put(x, c.T, z, "stone_brick_wall");
  } else if (c.T === TIERS[TIERS.length - 1] && x % 5 === 2 && z % 8 === 3) {
    put(x, c.T, z, "bricks"); put(x, c.T + 1, z, "bricks");
  }
}

const g = new Voxels([W, H, D]);
for (const [k, { block, state }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/FR245184605.nbt`);
console.log(`FR245184605: ${out.blocks} blocks, ${out.palette} palette entries`);
