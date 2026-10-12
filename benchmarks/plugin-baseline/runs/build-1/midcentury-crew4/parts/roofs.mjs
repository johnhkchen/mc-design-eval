// PART 3 roofs, beams and fireplace stack (plan.md ROOFS, FACADES ring glass, RESERVED chimney).
// The stepped slab roof is hand built: four bands, ridge along x. Band A (eaves) and C sit one half apart; the
// fascia ring and the two holes (atrium, chimney) are dark_oak_slab. Beams run along z on every beam line, and the
// gable ends and the atrium ring take glass at y=6 under band C. Writes only into air, so the shell's header and the
// walls below stay as they are.
import { roof_band, fascia_ring, beam_line, glass_bay, fireplace_stack, BEAM_LINES } from "../vocab.mjs";

const ROOF = [9, 6, 32, 27]; // [x0, z0, x1, z1] of the main roof including overhangs
const ATRIUM_HOLE = [17, 12, 21, 17];
const CHIMNEY_HOLE = [20, 21, 21, 22];

export function build(g) {
  // the four bands (plan.md ROOFS): A eaves, B, C, ridge; each band is the same slab on the whole span
  roof_band(g, 6, 10, 6, "bottom");   // band A, eaves (north)
  roof_band(g, 23, 27, 6, "bottom");  // band A, eaves (south)
  roof_band(g, 11, 13, 6, "top");     // band B (north)
  roof_band(g, 20, 22, 6, "top");     // band B (south)
  roof_band(g, 14, 15, 7, "bottom");  // band C (north)
  roof_band(g, 18, 19, 7, "bottom");  // band C (south)
  roof_band(g, 16, 17, 7, "top");     // ridge

  // dark fascia on the outer ring and round both holes
  fascia_ring(g, ROOF, { hole: ATRIUM_HOLE, yLo: 6, yHi: 7 });
  fascia_ring(g, ROOF, { hole: CHIMNEY_HOLE, yLo: 6, yHi: 7 });

  // beam ends on every beam line, including the wall lines x=10 and x=31 (exposed tails at z=5 and z=28)
  for (const x of BEAM_LINES) beam_line(g, x);

  // gable-end glass in the vault under band C (x=10 and x=31, z=14..19, y=6)
  glass_bay(g, 14, 19, 10, 6, 6, { axis: "z" });
  glass_bay(g, 14, 19, 31, 6, 6, { axis: "z" });

  // glass across the atrium ring where it crosses band C (x=16 and x=22, z=14..17, y=6)
  glass_bay(g, 14, 17, 16, 6, 6, { axis: "z" });
  glass_bay(g, 14, 17, 22, 6, 6, { axis: "z" });

  // freestanding fireplace stack, x=20..21 z=21..22, y=1..8 (campfire firebox on the west column)
  fireplace_stack(g, 20, 21);
}
