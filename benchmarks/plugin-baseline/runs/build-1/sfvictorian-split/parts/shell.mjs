// P1 shell and floors (plan.md PARTS 1; elements 1, 14, 20, 24). Party walls x0/x15 of bricks z7..30 y0..18; front wall z=7
// (stone base y0..3, siding above) and rear wall z=30 (stone base, siding); floor slabs y0/4/9/13 by room (plan ROOMS) and
// the gravel roof deck at y17; stair wells, skylight, the porch mouth, bay opening, every door and window left as air;
// interior partitions. Not built here: porch floor and ceiling, bay floors (P2), roof parapets and cornice (P3), site (P6).
import { BODY, STONE, BRICK, GRAVEL } from "../vocab.mjs";

const PARTITION = "smooth_quartz";      // interior partitions (plan wants white_terracotta, which palette.json does not list)
const OAK = "oak_planks", DARK_OAK = "dark_oak_planks", SPRUCE = "spruce_planks", BIRCH = "birch_planks";

// Air cells in the shell: boxes [x0, x1, y0, y1, z0, z1]. Stair wells and the skylight (plan RESERVED/ROOFS), the openings
// on each face (plan OPENINGS), and the doorways through the partitions (plan ROOMS). Nothing here is written.
const AIR = [
  // stair wells through the floor slabs
  [13, 14, 4, 4, 25, 28], [13, 14, 9, 9, 11, 16], [13, 14, 13, 13, 18, 22],
  // skylight
  [6, 9, 17, 17, 15, 17],
  // north (street) face: porch floor gap, porch mouth, bay opening behind the bay, over-porch windows
  [10, 14, 4, 4, 7, 7], [10, 14, 5, 8, 7, 7], [2, 7, 5, 16, 7, 7], [11, 12, 10, 12, 7, 7], [11, 12, 14, 15, 7, 7],
  // entry door, transom, and the casing cells that the openings part fills
  [10, 10, 5, 8, 10, 10], [11, 12, 5, 8, 10, 10], [13, 13, 5, 8, 10, 10],
  // doorways through the partitions
  [11, 11, 10, 11, 10, 10], [9, 9, 5, 6, 12, 12], [9, 9, 5, 6, 19, 19], [9, 9, 10, 11, 12, 12], [9, 9, 10, 11, 19, 19],
  [4, 5, 5, 6, 16, 16], [11, 11, 5, 6, 23, 23], [4, 5, 5, 6, 23, 23], [11, 11, 10, 11, 23, 23], [6, 6, 14, 15, 23, 23],
  [4, 4, 1, 2, 20, 20], [11, 11, 1, 2, 20, 20],
  // upper stair arrival: the box room's stand (13..14,14,23) is open to the stair well (plan ROOMS, stair notes)
  [13, 14, 14, 16, 23, 23],
  // south (rear) face: kitchen French doors, windows, garage-level window
  [7, 8, 5, 7, 30, 30], [3, 4, 6, 7, 30, 30], [11, 12, 6, 7, 30, 30], [3, 4, 10, 12, 30, 30], [11, 12, 10, 12, 30, 30],
  [3, 4, 14, 15, 30, 30], [11, 12, 14, 15, 30, 30], [3, 4, 3, 3, 30, 30],
];

const isAir = (x, y, z) => AIR.some(([x0, x1, y0, y1, z0, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1);
const span = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/** Place block in every cell of the box that is not air. */
function place(g, [x0, x1, y0, y1, z0, z1], block) {
  for (const x of span(x0, x1)) for (const y of span(y0, y1)) for (const z of span(z0, z1)) {
    if (!isAir(x, y, z)) g.set(x, y, z, block);
  }
}

/** Floor material per cell: garage (y0), main (y4), bedrooms (y9), top rooms (y13), roof deck (y17). Null = not built here. */
function floorAt(x, y, z) {
  if (y === 0) return STONE;                                                        // garage, laundry, cellar
  if (y === 4) {
    if (x >= 10 && z <= 9) return null;                                             // porch floor is P2's
    if (z >= 24) return STONE;                                                      // kitchen
    return x >= 10 && z >= 10 ? DARK_OAK : OAK;                                     // entry hall, parlour and dining
  }
  if (y === 9) {
    if (z >= 23) return SPRUCE;                                                     // back bedroom
    if (x >= 10 && z <= 9) return SPRUCE;                                           // study over the porch
    if (x >= 10) return DARK_OAK;                                                   // landing
    if (z >= 17) return STONE;                                                      // bathroom
    return SPRUCE;                                                                  // front bedroom
  }
  if (y === 13) return BIRCH;                                                       // top room and box room
  if (y === 17) return GRAVEL;                                                      // roof deck
  return null;
}

export function build(g) {
  // party walls: plain brick, full height to the parapet line
  for (const x of [0, 15]) for (const z of span(7, 30)) for (const y of span(0, 18)) g.set(x, y, z, BRICK);

  // front wall z=7 and rear wall z=30: stone base y0..3, siding above, x1..14 between the party walls
  for (const z of [7, 30]) for (const x of span(1, 14)) for (const y of span(0, 17)) {
    if (isAir(x, y, z)) continue;
    g.set(x, y, z, y <= 3 ? STONE : BODY);
  }

  // floor slabs and the roof deck over the interior footprint
  for (const x of span(1, 14)) for (const z of span(8, 29)) for (const y of [0, 4, 9, 13, 17]) {
    const block = floorAt(x, y, z);
    if (block && !isAir(x, y, z)) g.set(x, y, z, block);
  }
  // the bay thresholds: the storey floors run under the bay opening at z=7 (x2..7) so the bedroom and top bays can be
  // walked into. At y4 the front wall's siding is already solid there, so only y9 and y13 need it (room 11, room 17).
  for (const x of span(2, 7)) for (const y of [9, 13]) g.set(x, y, 7, floorAt(x, y, 8));

  // interior partitions (plan ROOMS): x=9 across storeys 1-2 (z8..9 is the porch side wall, left to P2)
  place(g, [9, 9, 5, 8, 10, 22], PARTITION);
  place(g, [9, 9, 10, 12, 10, 22], PARTITION);
  place(g, [1, 8, 5, 8, 16, 16], PARTITION);
  place(g, [1, 8, 10, 12, 16, 16], PARTITION);
  place(g, [1, 14, 5, 8, 23, 23], PARTITION);
  place(g, [1, 14, 10, 12, 23, 23], PARTITION);
  place(g, [1, 14, 14, 16, 23, 23], PARTITION);
  place(g, [10, 14, 5, 8, 10, 10], PARTITION);
  place(g, [10, 14, 10, 12, 10, 10], PARTITION);
  place(g, [13, 14, 14, 16, 7, 17], PARTITION);
  place(g, [1, 14, 1, 3, 20, 20], PARTITION);
}
