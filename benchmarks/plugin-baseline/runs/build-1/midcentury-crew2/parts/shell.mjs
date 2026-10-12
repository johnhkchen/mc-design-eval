// PART 1 house shell and ground: the bedding, the house floor slab, the perimeter and atrium ring walls (stucco body,
// dark header course skipping the beam lines), the interior partitions with their doorways, and the spruce ceiling
// between the beams. Every OPENINGS cell and every cell a later part glazes or posts (south wall, clerestory, corner
// posts, atrium ring body, entry niche) is left as air. Writes are air-only, except the pit floor at y=0, which
// replaces the ground dirt that build.mjs lays there.
import {
  DIRT, QUARTZ, SPRUCE_PLANKS, STUCCO, PAVING, BEAM_X, BEDDING_Y, PIT, ATRIUM, CHIMNEY, ROOM_BOX, inPool,
  header_course, terrazzo_floor,
} from "../vocab.mjs";

const inBox = (x, z, [x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const inRoomBox = (x, z, b) => x >= b[0] && x <= b[3] && z >= b[2] && z <= b[5];
const isRing = (x, z) => ((x === 16 || x === 22) && z >= 11 && z <= 18) || ((z === 11 || z === 18) && x >= 16 && x <= 22);
const isHole = (x, z) =>
  inBox(x, z, [PIT.x0, PIT.z0, PIT.x1, PIT.z1]) ||
  inBox(x, z, [ATRIUM.x0, ATRIUM.z0, ATRIUM.x1, ATRIUM.z1]) ||
  inBox(x, z, [CHIMNEY.x0, CHIMNEY.z0, CHIMNEY.x1, CHIMNEY.z1]);
const BEDROOMS = ["bedroom 1", "bedroom 2", "master bedroom"];
const BATHS = ["bath 1", "bath 2"];

export function build(g) {
  // writes only into air; the one exception is the pit floor below
  const put = (x, y, z, block) => { if (g.isAir(x, y, z)) g.set(x, y, z, block, {}); };
  const roomOf = (x, z) => Object.entries(ROOM_BOX).find(([, b]) => inRoomBox(x, z, b))?.[0];

  // 1. bedding under the lot (y=-1 is below the grid: build.mjs drops and counts these writes)
  for (let x = 0; x <= 33; x++) for (let z = 0; z <= 33; z++) if (!inPool(x, z)) g.set(x, BEDDING_Y, z, DIRT, {});

  // 2. pit floor at y=0: smooth_quartz over the ground dirt
  for (let x = PIT.x0; x <= PIT.x1; x++) for (let z = PIT.z0; z <= PIT.z1; z++) g.set(x, 0, z, QUARTZ, {});

  // 3. house floor slab y=1 over x=10..31, z=8..25; none in the pit, the atrium or the chimney
  for (let x = 10; x <= 31; x++) for (let z = 8; z <= 25; z++) {
    if (isHole(x, z)) continue;
    const perimeter = x === 10 || x === 31 || z === 8 || z === 25 || isRing(x, z);
    if (perimeter) { put(x, 1, z, PAVING); continue; }
    const room = roomOf(x, z);
    if (BEDROOMS.includes(room)) put(x, 1, z, SPRUCE_PLANKS);
    else if (BATHS.includes(room)) put(x, 1, z, QUARTZ);
    else terrazzo_floor(g, [x, 1, z, x, 1, z]);
  }

  // 4. north wall z=8 (street): blank stucco; the entry niche x=18..20 and the clerestory row y=4 (x=22..30) are air;
  //    x=17 is the stone reveal of the niche; the corners x=10 and x=31 are left for part 4's posts
  for (let x = 11; x <= 30; x++) {
    if (x >= 18 && x <= 20) continue;
    if (x === 17) { for (let y = 2; y <= 4; y++) put(x, y, 8, PAVING); continue; }
    for (let y = 2; y <= 4; y++) {
      if (x >= 22 && x <= 30 && y === 4) continue;
      put(x, y, 8, STUCCO);
    }
  }

  // 5. west wall x=10 (carport side): utility door z=10 (y=2..3), dining window z=14..16 (y=3..4)
  for (let z = 9; z <= 24; z++) for (let y = 2; y <= 4; y++) {
    if (z === 10 && y <= 3) continue;
    if (z >= 14 && z <= 16 && y >= 3) continue;
    put(10, y, z, STUCCO);
  }

  // 6. east wall x=31 (garden side): bedroom 1 window z=10..12 (y=3..4), bath clerestory z=15..16 (y=4), master glass z=21..23
  for (let z = 9; z <= 24; z++) for (let y = 2; y <= 4; y++) {
    if (z >= 10 && z <= 12 && y >= 3) continue;
    if (z >= 15 && z <= 16 && y === 4) continue;
    if (z >= 21 && z <= 23) continue;
    put(31, y, z, STUCCO);
  }

  // 7. south wall z=25 (garden) and the atrium ring body are left as air: part 4 glazes them and sets the posts.

  // 8. entry door wall z=9: stucco at x=17 and x=21; x=18..20 are air (orange panels, door and transom come in part 4)
  for (const x of [17, 21]) for (let y = 2; y <= 4; y++) put(x, y, 9, STUCCO);

  // 9. interior partitions (white_concrete, y=2..4) with the doorways of ROOMS
  // z=13 for x=25..30 (bedroom 1 / bath zone)
  for (let x = 25; x <= 30; x++) for (let y = 2; y <= 4; y++) put(x, y, 13, STUCCO);
  // x=25 for z=9..21, doorways at z=10 (bed 1), 15 (bath 1), 19 (bed 2) at y=2..3
  for (let z = 9; z <= 21; z++) for (let y = 2; y <= 4; y++) {
    if ((z === 10 || z === 15 || z === 19) && y <= 3) continue;
    put(25, y, z, STUCCO);
  }
  // z=17 for x=26..30, bath 2 door at x=29 (y=2..3)
  for (let x = 26; x <= 30; x++) for (let y = 2; y <= 4; y++) {
    if (x === 29 && y <= 3) continue;
    put(x, y, 17, STUCCO);
  }
  // x=28 for z=14..16 (between the baths)
  for (let z = 14; z <= 16; z++) for (let y = 2; y <= 4; y++) put(28, y, z, STUCCO);
  // z=21 for x=25..30 (bedroom 2 / master)
  for (let x = 25; x <= 30; x++) for (let y = 2; y <= 4; y++) put(x, y, 21, STUCCO);
  // x=22 for z=19..24, living doorway at z=19..20 (air, y=2..4)
  for (let z = 19; z <= 24; z++) for (let y = 2; y <= 4; y++) {
    if (z <= 20) continue;
    put(22, y, z, STUCCO);
  }

  // 10. header course y=5: dark_oak_planks along the north and south walls and the ring's north and south rows,
  //     skipping every beam-line x (the roof part lays the beams there)
  header_course(g, 10, 31, 8, 8);
  header_course(g, 10, 31, 25, 25);
  header_course(g, 16, 22, 11, 11);
  header_course(g, 16, 22, 18, 18);

  // 11. ceiling spruce_planks y=5 between the beams over the rooms at z=9..13 and z=20..24 (open vault at z=14..19)
  for (let x = 11; x <= 30; x++) {
    if (BEAM_X.includes(x)) continue;
    for (const z of [...range(9, 13), ...range(20, 24)]) {
      if (isHole(x, z)) continue;
      put(x, 5, z, SPRUCE_PLANKS);
    }
  }
}

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
