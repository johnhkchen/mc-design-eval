// Part 1: Shell and massing. Plinth, floors, outer walls of the garage, main block and entry sides, the turret bay,
// interior partitions, ceilings at y10 and the main staircase. Every OPENINGS cell stays air for later parts, and so
// does the chimney chase. The lawn is laid by build.mjs.
import {
  BIRCH_PLANKS, COBBLESTONE, OAK_PLANKS, POLISHED_ANDESITE, SMOOTH_QUARTZ, SPRUCE_PLANKS, STONE_BRICKS,
  CHIMNEY, bay, mainStair,
} from "../vocab.mjs";

// Inclusive boxes [x0, x1, y0, y1, z0, z1] that the shell leaves empty (plan.md OPENINGS).
const OPENING_BOXES = [
  // garage front (z5): three carriage doors and the bonus-room windows
  [2, 5, 1, 4, 5, 5], [7, 10, 1, 4, 5, 5], [12, 15, 1, 4, 5, 5],
  [2, 4, 7, 9, 5, 5], [7, 9, 7, 9, 5, 5], [12, 14, 7, 9, 5, 5],
  // garage east wall (x18): mudroom door, bonus arch, pantry and bedroom 4 windows
  [18, 18, 2, 3, 17, 18], [18, 18, 7, 9, 14, 15], [18, 18, 3, 5, 23, 25], [18, 18, 7, 9, 23, 25],
  // main front (z7): door and fanlight, office and bedroom 3 windows, foyer high window, bay mouth
  [30, 31, 2, 5, 7, 7], [21, 23, 3, 5, 7, 7], [21, 23, 7, 9, 7, 7], [29, 32, 7, 9, 7, 7],
  [38, 40, 2, 5, 7, 7], [38, 40, 7, 9, 7, 7],
  // main east (x43): dining, family room and primary windows
  [43, 43, 3, 5, 11, 13], [43, 43, 3, 5, 19, 21], [43, 43, 7, 9, 11, 13],
  // main back (z28): slider, kitchen, bedroom 2 and primary bath windows
  [37, 39, 2, 4, 28, 28], [29, 31, 3, 5, 28, 28], [29, 31, 7, 9, 28, 28], [37, 39, 7, 9, 28, 28],
  // ground-floor doors and arches
  [26, 26, 2, 3, 11, 11], [26, 26, 2, 3, 15, 15], [26, 26, 2, 3, 18, 18], [26, 26, 2, 3, 24, 24],
  [35, 35, 2, 4, 11, 12], [30, 31, 2, 4, 16, 16],
  // upper doors and arches
  [22, 22, 7, 8, 13, 13], [22, 22, 7, 8, 16, 16], [30, 30, 7, 8, 16, 16], [39, 39, 7, 8, 16, 16],
  [38, 39, 7, 8, 23, 23], [35, 35, 7, 9, 14, 15],
];
const OPEN = new Set();
for (const [x0, x1, y0, y1, z0, z1] of OPENING_BOXES) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) OPEN.add(`${x},${y},${z}`);
}

const isOpen = (x, y, z) => OPEN.has(`${x},${y},${z}`);
const inChase = (x, z) => x >= CHIMNEY.x0 && x <= CHIMNEY.x1 && z >= CHIMNEY.z0 && z <= CHIMNEY.z1;
// the foyer is double height: no floor-2 blocks over x27..34 z8..13, except the stair landing at x27..28 z13
const inFoyerVoid = (x, z) => x >= 27 && x <= 34 && z >= 8 && z <= 13 && !(z === 13 && x <= 28);

/** Places a block unless the cell is an opening (left air for later parts). */
function place(g, x, y, z, block) {
  if (!isOpen(x, y, z)) g.set(x, y, z, block);
}

/** Cells of the perimeter of the inclusive box x0..x1, z0..z1. */
function perimeter(x0, x1, z0, z1) {
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x === x0 || x === x1 || z === z0 || z === z1) cells.push([x, z]);
  }
  return cells;
}

/** Plinth: cobblestone at y0 under every outer wall (garage, main, entry sides, turret bay). */
function plinth(g) {
  for (const [x, z] of perimeter(0, 18, 5, 22)) g.set(x, 0, z, COBBLESTONE);
  for (const [x, z] of perimeter(18, 43, 7, 28)) g.set(x, 0, z, COBBLESTONE);
  for (const x of [26, 35]) for (const z of [5, 6]) g.set(x, 0, z, COBBLESTONE);
  for (const [x, z] of perimeter(37, 41, 4, 7)) g.set(x, 0, z, COBBLESTONE);
}

/** Floors: garage y0 and bonus floor y6, main floor y1, upper floor y6 with the foyer void; ceilings y10. */
function floors(g) {
  for (let x = 1; x <= 17; x++) for (let z = 6; z <= 21; z++) {
    g.set(x, 0, z, POLISHED_ANDESITE);
    g.set(x, 6, z, OAK_PLANKS);
    g.set(x, 10, z, SMOOTH_QUARTZ);
  }
  for (let x = 19; x <= 42; x++) for (let z = 8; z <= 27; z++) {
    g.set(x, 1, z, SPRUCE_PLANKS);
    if (!inChase(x, z) && !inFoyerVoid(x, z)) g.set(x, 6, z, OAK_PLANKS);
    if (!inChase(x, z)) g.set(x, 10, z, SMOOTH_QUARTZ);
  }
}

/** Outer walls y1..10: the garage ring, the main ring, and the entry's side walls; stone veneer y1..3 on the front. */
function walls(g) {
  for (const [x0, x1, z0, z1] of [[0, 18, 5, 22], [18, 43, 7, 28]]) {
    for (const [x, z] of perimeter(x0, x1, z0, z1)) {
      const front = z === z0 && x !== x0 && x !== x1;
      for (let y = 1; y <= 10; y++) {
        place(g, x, y, z, front && y <= 3 ? STONE_BRICKS : BIRCH_PLANKS);
      }
    }
  }
  for (const x of [26, 35]) for (const z of [5, 6]) {
    for (let y = 1; y <= 10; y++) place(g, x, y, z, BIRCH_PLANKS);
  }
}

/** Interior partitions (birch), full storey height, openings left out by place(). */
function partitions(g) {
  const solid = (x0, x1, y0, y1, z0, z1) => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) place(g, x, y, z, BIRCH_PLANKS);
  };
  // main floor, y2..5
  solid(26, 26, 2, 5, 8, 28);
  solid(35, 35, 2, 5, 8, 16);
  solid(27, 42, 2, 5, 16, 16);
  solid(19, 25, 2, 5, 13, 13);
  solid(19, 25, 2, 5, 20, 20);
  // upper floor, y7..9
  solid(26, 26, 7, 9, 8, 13);
  solid(26, 26, 7, 9, 16, 27);
  solid(35, 35, 7, 9, 8, 13);
  solid(35, 35, 7, 9, 16, 27);
  solid(19, 25, 7, 9, 13, 13);
  solid(19, 42, 7, 9, 16, 16);
  solid(36, 42, 7, 9, 23, 23);
}

/** The massing: plinth, floors, outer walls, partitions and ceilings; then the turret bay and the main staircase. */
export function build(g) {
  plinth(g);
  floors(g);
  walls(g);
  partitions(g);
  bay(g);
  mainStair(g);
}
