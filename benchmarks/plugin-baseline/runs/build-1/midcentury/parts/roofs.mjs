// PART 3 roofs, beams and fireplace stack (plan.md PARTS 3): the four stepped slab bands of the low gable with their
// dark_oak_slab fascia and atrium hole edge, a dark_oak_log beam on every beam line (x=10..31, z=5..28), the gable-end
// and atrium-ring glass at y=6 under band C, and the freestanding fireplace stack at x=20..21, z=21..22.
// Coordinates are plan.md's absolute ones. Writes go through g.set and the vocab helpers.
import { BEAM_XS, GLASS_PANE, roof_band, fascia_ring, beam_line, fireplace_stack } from "../vocab.mjs";

export function build(g) {
  // ROOFS: band A (eaves) and B at y=6, band C and the ridge at y=7 (plan.md ROOFS table)
  roof_band(g, 6, 10, 6, "bottom");
  roof_band(g, 23, 27, 6, "bottom");
  roof_band(g, 11, 13, 6, "top");
  roof_band(g, 20, 22, 6, "top");
  roof_band(g, 14, 15, 7, "bottom");
  roof_band(g, 18, 19, 7, "bottom");
  roof_band(g, 16, 17, 7, "top");
  // fascia: the outer ring and the atrium hole edge, dark_oak_slab at each band's half (after the bands)
  fascia_ring(g);

  // BEAMS: dark_oak_log axis=z at y=5 on every beam line, the wall lines x=10 and x=31 included
  for (const x of BEAM_XS) beam_line(g, x);

  // GLASS under band C (the raised vault): gable-end clerestory on x=10 and x=31, atrium ring on x=16 and x=22
  for (let z = 14; z <= 19; z++) {
    g.set(10, 6, z, GLASS_PANE);
    g.set(31, 6, z, GLASS_PANE);
  }
  for (let z = 14; z <= 17; z++) {
    g.set(16, 6, z, GLASS_PANE);
    g.set(22, 6, z, GLASS_PANE);
  }

  // FIREPLACE: freestanding stack at x=20..21, z=21..22, y=1..8
  fireplace_stack(g);
}
