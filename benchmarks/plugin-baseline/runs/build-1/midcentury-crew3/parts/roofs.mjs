// PART 3 roofs, beams and fireplace stack (plan.md ROOFS, OPENINGS, RESERVED; Part 3 spec in the brief).
// Every write goes through the vocab helpers, which place only into air, so nothing an earlier part built is replaced.
import { roof_band, beam_line, fireplace_stack } from "../vocab.mjs";
import { glass_bay_z } from "../vocab.mjs";

// the two holes in the roof: the atrium (open sky) and the freestanding chimney (plan.md ROOFS)
const HOLES = [
  { x0: 17, x1: 21, z0: 12, z1: 17, edge: true }, // atrium
  { x0: 20, x1: 21, z0: 21, z1: 22, edge: true }, // chimney
];

// beam lines: x = 10, 13, ..., 31 (plan.md structural rhythm); each runs z=5..28 at y=5
const BEAM_XS = [10, 13, 16, 19, 22, 25, 28, 31];

export function build(g) {
  // the stepped slab roof, four bands (plan.md ROOFS table); each band is a z-run on both sides of the ridge.
  // roof_band puts the fascia on the outer ring (x=9, x=32, z=6, z=27) and on the hole rims, at the band's half.
  const opts = { holes: HOLES, fascia: true };
  roof_band(g, 6, 10, 6, "bottom", opts); // A, eaves
  roof_band(g, 23, 27, 6, "bottom", opts);
  roof_band(g, 11, 13, 6, "top", opts); // B
  roof_band(g, 20, 22, 6, "top", opts);
  roof_band(g, 14, 15, 7, "bottom", opts); // C
  roof_band(g, 18, 19, 7, "bottom", opts);
  roof_band(g, 16, 17, 7, "top", opts); // ridge

  // exposed beams on every beam line, through the header and out past the eave at z=5 and z=28
  for (const x of BEAM_XS) beam_line(g, x, 5, 28, 5);

  // glass under band C at y=6: the two gable-end clerestories (x=10, x=31) and the atrium ring where it crosses C
  glass_bay_z(g, 10, 14, 19, 6, 6);
  glass_bay_z(g, 31, 14, 19, 6, 6);
  glass_bay_z(g, 16, 14, 17, 6, 6);
  glass_bay_z(g, 22, 14, 17, 6, 6);

  // freestanding fireplace: mud_bricks base and lintel, lit campfire in the west firebox, black_concrete flue, cap
  fireplace_stack(g, 20, 21);
}
