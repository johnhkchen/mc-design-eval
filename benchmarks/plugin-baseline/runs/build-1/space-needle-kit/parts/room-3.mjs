// room: The Loupe (P10), the ring restaurant under the saucer. Inner air box [9,213,9,55,217,55], floor y212 (saucer),
// ceiling the deck floor at y218. Entered from the core through the doorway x31..33 z29 y213..215; the lane from there
// runs north (x31..33, z<=28) and stays clear. Built only into air: tables are a white_concrete post with a bottom
// smooth_quartz_slab on top (vocab table), chairs are smooth_quartz_stairs facing the table (the back is on the far
// side), the service counter flanks the lane, and sea lanterns stand on the floor as lamps (a floor lamp lights 8+ within
// 7 blocks; a ceiling lamp at y217 would only reach 8+ within 3, so the lamps stand).
import { table } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FLOOR_Y = 213;          // first air layer of the room
const CORE = { x0: 29, x1: 35, z0: 29, z1: 35 };
const LANE = { x0: 31, x1: 33, zMax: 28 };     // the way in from the core doorway, kept clear
const R_MAX = 22.5;                            // inside the glass ring (r 24)

// Tables: a chair west and east of each table; chairs back away from the table.
const TABLES = [
  [24, 14], [40, 14],
  [18, 24], [18, 32], [18, 40], [46, 24], [46, 32], [46, 40],
  [24, 24], [40, 24], [24, 40], [40, 40],
  [24, 48], [40, 48], [32, 48],
];

// Service counter: two runs flanking the lane (x31..33 stays open), at z 21.
const COUNTER = [[26, 30, 21], [34, 38, 21]];

// Floor lamp sites, on a diagonal lattice (steps of 7 along x±z, so each lamp's reach overlaps its neighbours');
// a site that falls on furniture, the lane or the core is moved to the nearest free cell.
const LAMP_LATTICE = [];
for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) LAMP_LATTICE.push([32 + 7 * (a + b), 32 + 7 * (a - b)]);

const taken = new Set();
const key = (x, z) => `${x},${z}`;

function inCore(x, z) {
  return x >= CORE.x0 && x <= CORE.x1 && z >= CORE.z0 && z <= CORE.z1;
}
function inLane(x, z) {
  return x >= LANE.x0 && x <= LANE.x1 && z <= LANE.zMax;
}
function freeFloor(x, z) {
  if (x < 9 || x > 55 || z < 9 || z > 55) return false;
  if (Math.hypot(x - 32, z - 32) > R_MAX) return false;
  return !inCore(x, z) && !inLane(x, z) && !taken.has(key(x, z));
}

// The nearest free floor cell to (x, z), searched in rings of growing radius.
function nearestFree(x, z) {
  for (let r = 0; r <= 4; r++) {
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
      if (freeFloor(x + dx, z + dz)) return [x + dx, z + dz];
    }
  }
  return null;
}

export function build(g) {
  // Tables and their chairs.
  for (const [x, z] of TABLES) {
    table(g, x, FLOOR_Y, z);
    g.set(x - 1, FLOOR_Y, z, ...B.stairs("smooth_quartz", "west"));
    g.set(x + 1, FLOOR_Y, z, ...B.stairs("smooth_quartz", "east"));
    for (const c of [[x, z], [x - 1, z], [x + 1, z]]) taken.add(key(...c));
  }

  // Service counter: crisp white base, a bottom slab top.
  for (const [x0, x1, z] of COUNTER) {
    for (let x = x0; x <= x1; x++) {
      g.set(x, FLOOR_Y, z, "white_concrete", {});
      g.set(x, FLOOR_Y + 1, z, ...B.slab("smooth_quartz", "bottom"));
      taken.add(key(x, z));
    }
  }

  // Floor lamps: sea lanterns standing on the floor, placed on free cells near the lattice.
  for (const [lx, lz] of LAMP_LATTICE) {
    const cell = nearestFree(lx, lz);
    if (!cell) continue;
    const [x, z] = cell;
    g.set(x, FLOOR_Y, z, "sea_lantern", {});
    taken.add(key(x, z));
  }
}
