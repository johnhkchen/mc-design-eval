// PART 3 roofs, beams and fireplace stack: the stepped slab roof (4 bands + fascia ring round the atrium and chimney holes),
// beam lines on every x=10,13,...,31 at y=5 (z=5..28), gable-end glass at y=6 (x=10 and x=31, z=14..19), ring glass at
// y=6 under band C (x=16 and x=22, z=14..17), and the freestanding fireplace stack at x=20..21, z=21..22.
import { roof_band, fascia_ring, beam_line, glass_bay, fireplace_stack, BEAM_X } from "../vocab.mjs";

// the atrium hole (x=17..21, z=12..17) and the chimney hole (x=20..21, z=21..22) stay open in the roof
const HOLES = [
  { x0: 17, z0: 12, x1: 21, z1: 17 },
  { x0: 20, z0: 21, x1: 21, z1: 22 },
];

export function build(g) {
  // roof bands: A eaves (y=6 bottom), B (y=6 top), C (y=7 bottom), ridge (y=7 top)
  roof_band(g, 6, 10, 6, "bottom");
  roof_band(g, 23, 27, 6, "bottom");
  roof_band(g, 11, 13, 6, "top");
  roof_band(g, 20, 22, 6, "top");
  roof_band(g, 14, 15, 7, "bottom");
  roof_band(g, 18, 19, 7, "bottom");
  roof_band(g, 16, 17, 7, "top");

  // fascia: the outermost ring and each hole edge become dark_oak_slab, same half as their band
  fascia_ring(g, { x0: 9, x1: 32, z0: 6, z1: 27, holes: HOLES }, 6, 7);

  // exposed beams on every beam line, through the header and out past the eaves
  for (const x of BEAM_X) beam_line(g, x, 5, 28, 5);

  // gable-end glass clerestories (west and east walls, under band C) and the atrium ring glass under band C
  glass_bay(g, 14, 19, 10, 6, 6, { axis: "z" });
  glass_bay(g, 14, 19, 31, 6, 6, { axis: "z" });
  glass_bay(g, 14, 17, 16, 6, 6, { axis: "z" });
  glass_bay(g, 14, 17, 22, 6, 6, { axis: "z" });

  // freestanding fireplace stack (y=1..8)
  fireplace_stack(g, 20, 21);
}
