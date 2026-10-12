// PART 1 house shell and ground (plan.md: SITE bedding, MAIN HOUSE shell, ROOMS partitions, FLOORS, OPENINGS).
// Writes only into air (runParts), so every opening the later parts need is left as air here:
//   - the south wall (z=25) is glazed by part 4 at y=2..4, so its body is air, corners included;
//   - the other wall corners (10/31, z=8) and the atrium ring body are posts/glass for part 4, so they stay air;
//   - the entry niche (x=18..20, z=8), the door cells (z=9), the utility door, window, clerestory and slider cells
//     are air. The door wall's reveals (x=17 and x=21) are stone and stucco as the facades part expects.
import {
  BEAM_LINES, POOL_CELLS,
  WHITE_CONCRETE, SMOOTH_STONE, SMOOTH_QUARTZ, SPRUCE_PLANKS, DIRT, BEDDING_Y,
  header_course, terrazzo_floor,
} from "../vocab.mjs";

const SEED = 1;

// set only into air, so nothing an earlier part placed is touched
function put(g, x, y, z, block) {
  if (y < 0) return; // the bedding is dropped by the grid proxy; still counted there
  if (g.isAir(x, y, z)) g.set(x, y, z, block);
}

function fill(g, x0, z0, x1, z1, y, block) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(g, x, y, z, block);
}

// Rows of the perimeter, interior and atrium openings: a set of cell keys that stay air in the walls.
const key = (x, y, z) => `${x},${y},${z}`;
const OPEN = new Set();
const open = (x, y, z) => OPEN.add(key(x, y, z));
const openBox = (x0, y0, x1, y1, z0, z1) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) open(x, y, z); };

// Entry niche, door cells (door wall z=9), utility door, dining window, bedroom 1 window, bath clerestory, master glass
openBox(18, 2, 20, 4, 8, 8);
openBox(18, 2, 20, 4, 9, 9);
openBox(10, 2, 10, 3, 10, 10); // utility door, carport to kitchen
openBox(10, 3, 10, 4, 14, 16); // dining window (sill y=2 stays stucco)
openBox(31, 3, 31, 4, 10, 12); // bedroom 1 window
openBox(31, 4, 31, 4, 15, 16); // bath clerestory
openBox(31, 2, 31, 4, 21, 23); // master bedroom glass
openBox(22, 4, 30, 4, 8, 8);   // north clerestory strip (y=4 only)
openBox(22, 2, 22, 4, 19, 20); // living doorway (partition x=22)
openBox(22, 2, 22, 4, 9, 10);  // gallery to corridor opening
openBox(16, 2, 16, 4, 9, 10);  // kitchen to gallery opening
// south wall: all glazed by part 4 (y=2..4 and corners), so air here
openBox(10, 2, 31, 4, 25, 25);
// the atrium ring body: glass and posts from part 4 (air here), doors at x=19..20
openBox(16, 2, 22, 4, 11, 11);
openBox(16, 2, 22, 4, 18, 18);
openBox(16, 2, 16, 4, 11, 18);
openBox(22, 2, 22, 4, 11, 18);
// corners of the house (posts from part 4)
openBox(10, 2, 10, 4, 8, 8);
openBox(31, 2, 31, 4, 8, 8);
openBox(10, 2, 10, 4, 25, 25);
openBox(31, 2, 31, 4, 25, 25);
// sliders on the south wall
// (already covered: the whole south wall is air above the base)

// ---- 1. bedding and ground --------------------------------------------------------------------------------------
export function build(g) {
  // bedding: dirt at y=-1 over the lot, except the pool (the grid drops y<0 and counts it)
  const inPool = (x, z) => (POOL_CELLS[z] ?? []).some(([a, b]) => x >= a && x <= b);
  for (let x = 0; x <= 33; x++) for (let z = 0; z <= 33; z++) if (!inPool(x, z)) g.set(x, BEDDING_Y, z, DIRT);
  // dirt y=0 under the house footprint and atrium is already laid by build.mjs (ground), so nothing to do here.

  // ---- 2. floor slab y=1 (the house) -----------------------------------------------------------------------------
  // public rooms: terrazzo, rectangles that skip the pit (x13..17 z20..23), the chimney (x20..21 z21..22)
  // and the atrium (x17..21 z12..17, open to the sky)
  const terrazzo = [
    [11, 9, 15, 13], // kitchen
    [11, 14, 15, 18], // dining
    [16, 9, 22, 10], // gallery and its openings
    [23, 9, 24, 21], // corridor
    [25, 9, 25, 21], // corridor side of the partition at x=25
    [11, 19, 21, 19], // living, first row
    [11, 20, 12, 24], // living, west of the pit
    [18, 20, 19, 23], // living, east of the pit
    [20, 20, 21, 20], // living, north of the chimney
    [20, 23, 21, 23], // living, south of the chimney
    [13, 24, 22, 24], // living, south row
    [22, 19, 22, 24], // living doorway and partition column
  ];
  for (const [x0, z0, x1, z1] of terrazzo) terrazzo_floor(g, x0, z0, x1, z1, { y: 1, seed: SEED });
  // bedrooms: spruce planks
  for (const [x0, z0, x1, z1] of [[26, 9, 30, 12], [26, 13, 30, 13], [26, 17, 30, 17], [26, 18, 30, 20], [25, 21, 30, 21], [23, 22, 30, 24]]) {
    fill(g, x0, z0, x1, z1, 1, SPRUCE_PLANKS);
  }
  // baths: smooth quartz
  fill(g, 26, 14, 30, 16, 1, SMOOTH_QUARTZ);
  // the atrium, the pit and the chimney have no slab at y=1 (the pit floor is y=0 below)
  // pit floor at y=0 (smooth_quartz) over the sunken conversation pit
  fill(g, 13, 20, 17, 23, 0, SMOOTH_QUARTZ);

  // ---- 3. perimeter walls: base y=1, body y=2..4, header y=5 ----------------------------------------------------
  // base (slab edge) along the whole perimeter
  for (let x = 10; x <= 31; x++) { put(g, x, 1, 8, SMOOTH_STONE); put(g, x, 1, 25, SMOOTH_STONE); }
  for (let z = 8; z <= 25; z++) { put(g, 10, 1, z, SMOOTH_STONE); put(g, 31, 1, z, SMOOTH_STONE); }
  // the entry reveals: stone on the west side, stucco on the east side (plan.md: x=17 stone, x=21 stucco)
  for (let y = 1; y <= 4; y++) { put(g, 17, y, 8, SMOOTH_STONE); put(g, 21, y, 8, WHITE_CONCRETE); }

  // body: white stucco on every perimeter cell that is not an opening
  const body = (x, z) => {
    for (let y = 2; y <= 4; y++) if (!OPEN.has(key(x, y, z))) put(g, x, y, z, WHITE_CONCRETE);
  };
  for (let x = 11; x <= 30; x++) { body(x, 8); body(x, 25); }
  for (let z = 9; z <= 24; z++) { body(10, z); body(31, z); }

  // header course under the eave: dark_oak_planks at y=5, beam lines skipped (the roof part lays logs there)
  header_course(g, 11, 8, 30, 8);
  header_course(g, 11, 25, 30, 25);
  header_course(g, 17, 9, 21, 9); // door wall header over the entry
  // the x=10 and x=31 walls are beam lines in full: the roof part's logs cover their header

  // ---- 4. interior door wall, atrium ring and partitions -------------------------------------------------------
  // door wall z=9 x=17..21: reveals stay as partition, the door cells x=18..20 stay air for part 4
  for (let y = 2; y <= 4; y++) { put(g, 17, y, 9, WHITE_CONCRETE); put(g, 21, y, 9, WHITE_CONCRETE); }

  // atrium ring: body air (glass and posts from part 4), dark header at y=5, stone base at y=1 (ring cells)
  for (let x = 16; x <= 22; x++) { put(g, x, 1, 11, SMOOTH_STONE); put(g, x, 1, 18, SMOOTH_STONE); }
  for (let z = 12; z <= 17; z++) { put(g, 16, 1, z, SMOOTH_STONE); put(g, 22, 1, z, SMOOTH_STONE); }
  header_course(g, 16, 11, 22, 11); // ring header along z=11
  header_course(g, 16, 18, 22, 18); // ring header along z=18

  // partitions (white_concrete y=2..4) with their doorways (y=2..3 air, y=4 lintel)
  const partition = (cells, doors = []) => {
    for (const [x, z] of cells) {
      const isDoor = doors.some(([dx, dz]) => dx === x && dz === z);
      for (let y = 2; y <= 4; y++) {
        if (isDoor && y <= 3) continue;
        put(g, x, y, z, WHITE_CONCRETE);
      }
    }
  };
  const line = (x0, z0, x1, z1) => {
    const cells = [];
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) cells.push([x, z]);
    return cells;
  };
  partition(line(25, 9, 25, 21), [[25, 10], [25, 15], [25, 19]]); // corridor to bedrooms, bath 1 and bed 2 doors
  partition(line(25, 13, 30, 13)); // bedroom 1 south wall
  partition(line(26, 17, 30, 17), [[29, 17]]); // bath 2 door from bedroom 2
  partition(line(28, 14, 28, 16)); // between the baths
  partition(line(25, 21, 30, 21)); // master bedroom north wall
  partition(line(22, 21, 22, 24)); // living east wall (the doorway at z=19..20 is air)

  // ---- 5. ceiling y=5 (spruce) between beams, over the closed rooms -------------------------------------------
  // z=9..13 and z=20..24, not on beam lines, not over the atrium or chimney (both are open)
  for (let x = 11; x <= 30; x++) {
    if (BEAM_LINES.includes(x)) continue;
    for (const z of [9, 10, 11, 12, 13, 20, 21, 22, 23, 24]) {
      if (x >= 17 && x <= 21 && z >= 12 && z <= 17) continue; // atrium
      if (x >= 20 && x <= 21 && z >= 21 && z <= 22) continue; // chimney
      put(g, x, 5, z, SPRUCE_PLANKS);
    }
  }
}
