// 1101 K St NW (Commercial-Office-Large), 26 x 29 footprint. Read as a 1980s-era downtown office: granite plinth,
// pale stone piers over light-grey spandrels, tinted glass between, a shopfront ground storey with a recessed entrance,
// a low podium wing (lidar roof 5), a main block (roof 18) and a core two blocks higher (roof 20) with roof plant.
// The lidar roofs snap to three tiers (5 / 18 / 20); the storeys are fixed rows (floors at 5, 9, 13, 17), so every
// tier stands on the slab below it and only the perimeter is solid (an air gap behind the glass, a slab per storey).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78414.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78414.nbt";

const SLABS = [5, 9, 13, 17];           // storey floor rows (solid across the footprint)
const LOW = 5, MAIN = 18, CORE = 20;    // the three roof tiers
const tierOf = (r) => (r <= LOW ? LOW : r >= 19 ? CORE : MAIN);

// footprint: ground g and snapped roof tier t, then a 3x3 majority so isolated lidar cells fall into their tier
const raw = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, t: tierOf(r) }]));
const cell = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  if (c.t === LOW) { cell.set(k, { g: c.g, t: LOW }); continue; }
  let hi = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const m = raw.get(`${x + dx},${z + dz}`);
    if (m && m.t !== LOW) { n++; if (m.t === CORE) hi++; }
  }
  const t = hi * 2 > n ? CORE : hi * 2 < n ? MAIN : c.t;
  cell.set(k, { g: c.g, t });
}
const inFoot = (x, z) => cell.has(`${x},${z}`);
const G = (x, z) => cell.get(`${x},${z}`).g;
const T = (x, z) => cell.get(`${x},${z}`).t;
// solid at height y: anything under the roof tier (foundation fill included); outside the footprint is air
const solid = (x, z, y) => inFoot(x, z) && y < T(x, z);
const exposedX = (x, z, y) => !solid(x - 1, z, y) || !solid(x + 1, z, y);
const exposedZ = (x, z, y) => !solid(x, z - 1, y) || !solid(x, z + 1, y);
const exterior = (x, z, y) => exposedX(x, z, y) || exposedZ(x, z, y);

// the lobby: a one-cell recess on the north face (z 15) with iron doors set behind it at z 16
const ENTRY_X = [16, 17];
const isRecess = (x, z, y) => z === 15 && ENTRY_X.includes(x) && (y === G(x, z) + 1 || y === G(x, z) + 2);
const isDoor = (x, z, y) => z === 16 && ENTRY_X.includes(x) && (y === G(x, z) + 1 || y === G(x, z) + 2);

// roof plant: two boxes on the main roof, one on the lower terrace, a lantern on top
const PLANT = [[3, 3], [4, 3], [3, 4], [4, 4], [23, 19], [24, 19], [23, 20], [24, 20]];
const isPlant = (x, z, y) => PLANT.some(([px, pz]) => px === x && pz === z) && (y === MAIN || y === MAIN + 1);
const isLantern = (x, z, y) => x === 23 && z === 19 && y === CORE;

// the ground storey: shopfront glass under a spandrel at row 4; upper storeys: two glass rows under a spandrel
const bandY = (y, g) => (y < 5 ? y - g : y - Math.max(...SLABS.filter((s) => s < y))); // row within its storey band
const spandrelRow = (y, g) => (y < 5 ? y === 4 : bandY(y, g) === 3);

// exterior face: piers on the columns of each face (every third cell), glass between, spandrel above the glass
const wallBlock = (x, z, y) => {
  const g = G(x, z), t = T(x, z);
  if (y >= t) return null;
  if (y < g) return ["stone_bricks"];
  if (y === t - 1) return [exterior(x, z, y) ? "smooth_quartz" : "smooth_stone"];          // cornice / roof membrane
  if (y === g || SLABS.includes(y)) {                                                        // plinth / floor slab
    if (!exterior(x, z, y)) return ["smooth_stone"];
    return [y === g ? "polished_granite" : "smooth_quartz"];
  }
  if (!exterior(x, z, y)) return null;                                                        // air behind the glass
  if (spandrelRow(y, g)) return ["light_gray_concrete"];
  const piered = (exposedZ(x, z, y) && x % 3 === 0) || (exposedX(x, z, y) && z % 3 === 0);
  return piered ? ["quartz_block"] : ["light_blue_stained_glass"];
};

const v = new Voxels([26, 32, 29]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

// pass 1: the shell, the recess and the entrance, the roof plant
const glazedCells = [];
for (const k of cell.keys()) {
  const [x, z] = k.split(",").map(Number);
  const g = G(x, z), t = T(x, z);
  for (let y = 0; y < t; y++) {
    if (isRecess(x, z, y)) continue;
    if (isDoor(x, z, y)) { put(x, y, z, "iron_door", { facing: "north", hinge: x === 16 ? "left" : "right", half: y === g + 1 ? "lower" : "upper", open: "false", powered: "false" }); continue; }
    if (z === 16 && ENTRY_X.includes(x) && y === 4) { put(x, y, z, "light_gray_concrete"); continue; }   // canopy over the lobby
    if (isPlant(x, z, y)) { put(x, y, z, "gray_concrete"); continue; }
    if (isLantern(x, z, y)) { put(x, y, z, "lantern", { hanging: "false" }); continue; }
    const b = wallBlock(x, z, y);
    if (b) put(x, y, z, b[0]);
    if (b && b[0] === "light_blue_stained_glass" && (x * 7 + z * 13 + y * 5) % 23 === 0) glazedCells.push([x, y, z]);
  }
}

// pass 2: warm light just behind some windows (the inner cell, one step in from the glass)
for (const [x, y, z] of glazedCells) {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inFoot(nx, nz) && !exterior(nx, nz, y) && y < T(nx, nz) && v.get(nx, y, nz) === null && !isDoor(nx, nz, y) && !isRecess(nx, nz, y)) {
      put(nx, y, nz, "glowstone");
      break;
    }
  }
}

const stats = v.save(OUT);
console.log(`wrote ${OUT}: ${stats.blocks} blocks, palette ${stats.palette}`);
