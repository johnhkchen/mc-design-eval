// PART 1 house shell and ground: floor, perimeter walls, door wall, atrium ring, partitions, ceiling. All OPENINGS stay air.
import { header_course, STUCCO, BASE, QUARTZ, SPRUCE_PLANKS, HEADER, JOINT, rng, PIT, ATRIUM, CHIMNEY } from "../vocab.mjs";

const inBox = (x, z, [x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const BEDROOMS = [[26, 9, 30, 12], [26, 18, 30, 20], [23, 22, 30, 24]];
const BATHS = [[26, 14, 27, 16], [29, 14, 30, 16]];
const BEAMS = [10, 13, 16, 19, 22, 25, 28, 31];

export function build(g) {
  const fill = (x0, y0, z0, x1, y1, z1, b) => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) g.set(x, y, z, b);
  };
  // pit floor
  fill(PIT.x0, 0, PIT.z0, PIT.x1, 0, PIT.z1, QUARTZ);

  // floor slab y=1 over the footprint, except pit, atrium, chimney
  const r = rng(7);
  const pit = [13, 20, 17, 23], atr = [ATRIUM.x0, ATRIUM.z0, ATRIUM.x1, ATRIUM.z1], chi = [CHIMNEY.x0, CHIMNEY.z0, CHIMNEY.x1, CHIMNEY.z1];
  for (let x = 10; x <= 31; x++) for (let z = 8; z <= 25; z++) {
    if (inBox(x, z, pit) || inBox(x, z, atr) || inBox(x, z, chi)) continue;
    let b;
    const ring = (x >= 16 && x <= 22 && z >= 11 && z <= 18) && (x === 16 || x === 22 || z === 11 || z === 18);
    if (x === 21 && z === 8) b = STUCCO;
    else if (x === 10 || x === 31 || z === 8 || z === 25 || ring) b = BASE;
    else if (BATHS.some((q) => inBox(x, z, q))) b = QUARTZ;
    else if (BEDROOMS.some((q) => inBox(x, z, q))) b = SPRUCE_PLANKS;
    else { const t = r(); b = t < 0.12 ? JOINT : t < 0.18 ? STUCCO : BASE; }
    g.set(x, 1, z, b);
  }

  // perimeter base course y=1 (skipped above only where floor was; perimeter cells are in the footprint, so overlay is by order: base laid first would win)
  // north wall z=8 and south wall z=25: body
  for (let x = 10; x <= 31; x++) {
    // north: body y=2..4, niche x=18..20 and clerestory x=22..30 (y=4) stay air; corners left for posts
    if (x !== 10 && x !== 31 && !(x >= 18 && x <= 20)) {
      const top = x >= 22 ? 3 : 4;
      fill(x, 2, 8, x, top, 8, STUCCO);
    }
  }
  fill(17, 1, 8, 17, 4, 8, BASE); // reveal
  // door wall z=9
  fill(17, 2, 9, 17, 4, 9, STUCCO); fill(21, 2, 9, 21, 4, 9, STUCCO);
  // west x=10 / east x=31
  for (let z = 9; z <= 24; z++) {
    // west
    const wOpen = (z === 10) ? [2, 3] : (z >= 14 && z <= 16) ? [3, 4] : null;
    for (let y = 2; y <= 4; y++) if (!(wOpen && y >= wOpen[0] && y <= wOpen[1])) g.set(10, y, z, STUCCO);
    // east
    for (let y = 2; y <= 4; y++) {
      if (z >= 10 && z <= 12 && y >= 3) continue;
      if (z >= 15 && z <= 16 && y === 4) continue;
      if (z >= 21 && z <= 23) continue;
      g.set(31, y, z, STUCCO);
    }
  }
  // base course y=1 is part of the floor loop for the footprint's inside; the perimeter ring is smooth_stone
  // (floor already placed there, so only the cells not yet set matter: none). Re-lay by writing base where the floor chose terrazzo is impossible (locked), so perimeter is handled below in `ring_base`.

  // atrium ring: base y=1, body air, header y=5
  // (ring cells at y=1 sit inside the atrium floor hole only at x=17..21; ring lines x=16,22 / z=11,18 are floor cells)
  header_course(g, 10, 8, 31, 8, 5);
  header_course(g, 10, 25, 31, 25, 5);
  header_course(g, 17, 11, 21, 11, 5);
  header_course(g, 17, 18, 21, 18, 5);

  // partitions (white_concrete y=2..4)
  const part = (x0, z0, x1, z1, gaps = []) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = 2; y <= 4; y++) {
      if (gaps.some(([gx, gz, y0, y1]) => gx === x && gz === z && y >= y0 && y <= y1)) continue;
      g.set(x, y, z, STUCCO);
    }
  };
  part(25, 9, 25, 21, [[25, 10, 2, 3], [25, 15, 2, 3], [25, 19, 2, 3]]);
  part(26, 13, 30, 13);
  part(26, 17, 30, 17, [[29, 17, 2, 3]]);
  part(28, 14, 28, 16);
  part(26, 21, 30, 21);
  part(22, 19, 22, 24, [[22, 19, 2, 4], [22, 20, 2, 4]]);

  // ceiling y=5 spruce between beams: z=9..13 and z=20..24, not over atrium ring/hole or chimney
  for (let x = 11; x <= 30; x++) {
    if (BEAMS.includes(x)) continue;
    for (const z of [9, 10, 11, 12, 13, 20, 21, 22, 23, 24]) {
      if (inBox(x, z, atr) || inBox(x, z, chi)) continue;
      if (z === 11 && x >= 16 && x <= 22) continue;
      g.set(x, 5, z, SPRUCE_PLANKS);
    }
  }
}
