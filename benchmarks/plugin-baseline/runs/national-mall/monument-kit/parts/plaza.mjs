// Part 3, plaza and pavilion (plan.md PARTS 3, elements 10-12): the round plaza on the summit at y 5 with its polished
// andesite bands and the ring round the obelisk, the 8 seating-wall arcs at y 6 with their lanterns, and the screening
// pavilion on the east face of the obelisk. Imports from vocab/h1.mjs directly: vocab.mjs re-exports h1 and h2, and
// their same-named helpers (plazaDisc, pavilionBox, ...) make the star export ambiguous.
import { seatingArc, pavilionBox } from "../vocab/h1.mjs";
import { CENTRE, PLAZA_Y, PLAZA_R, PLAZA_BANDS, OBELISK, PAVILION, FLOODLIGHTS } from "../vocab/base.mjs";

const { x: cx, z: cz } = CENTRE;

// Cells the flag part's floodlights take in place of the paving (plan RESERVED): left unwritten here, so the
// flag part's writes are not refused by this part's lock.
const reserved = new Set(FLOODLIGHTS.map(([x, y, z]) => `${x},${y},${z}`));

// Obelisk surround: the cells one block out from the 7x7 footprint (a ring of 9x9 less the 7x7), minus the pavilion,
// which keeps its own smooth stone floor.
const inPavilion = (x, z) => x >= PAVILION.x0 && x <= PAVILION.x1 && z >= PAVILION.z0 && z <= PAVILION.z1;
const touchesObelisk = (x, z) =>
  x >= OBELISK.x0 - 1 && x <= OBELISK.x1 + 1 && z >= OBELISK.z0 - 1 && z <= OBELISK.z1 + 1 &&
  !(x >= OBELISK.x0 && x <= OBELISK.x1 && z >= OBELISK.z0 && z <= OBELISK.z1);

// Paint one paving cell at PLAZA_Y over the ground's grass (the ground is laid before the parts, so it may be replaced).
// Skips the reserved floodlight cells. Returns 1 when written.
const paveCell = (g, x, z, block) => {
  if (reserved.has(`${x},${PLAZA_Y},${z}`)) return 0;
  g.set(x, PLAZA_Y, z, block);
  return 1;
};

// Paving disc: every cell with r0 <= distance from the centre < r1, painted with block.
const disc = (g, r0, r1, block, keep = () => true) => {
  let n = 0;
  const reach = Math.ceil(r1);
  for (let x = cx - reach; x <= cx + reach; x++) for (let z = cz - reach; z <= cz + reach; z++) {
    const r = Math.hypot(x - cx, z - cz);
    if (r >= r0 && r < r1 && keep(x, z)) n += paveCell(g, x, z, block);
  }
  return n;
};

export function build(g) {
  // Element 10: round plaza, smooth stone field, with the banding rings and the obelisk surround in polished andesite.
  let n = disc(g, 0, PLAZA_R, "smooth_stone");
  for (const [r0, r1] of PLAZA_BANDS) n += disc(g, r0, r1, "polished_andesite");
  n += disc(g, 0, PLAZA_R, "polished_andesite", (x, z) => touchesObelisk(x, z) && !inPavilion(x, z));

  // Element 11: 8 seating-wall arcs on the ring 9.5 <= r < 10.5 at y 6, with lanterns at the arc ends.
  n += seatingArc(g, cx, cz, PLAZA_Y + 1);

  // Element 12: screening pavilion on the east face of the obelisk, floor on the plaza at y 5, walls y 6..7, roof y 8.
  n += pavilionBox(g, PAVILION.x0, PLAZA_Y + 1, PAVILION.z0, "east");

  return n;
}
