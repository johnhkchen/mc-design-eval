// villa-haiku: peristyle (plan.md PARTS 3, elements E08..E13). The garden court's colonnade, hedges, path legs, beds, fountain and statues.
// The court floor (grass) and the walkway mosaic come from the shell part; the bed, basin and path-leg cells at y1 are left
// unclaimed there for us, so this part lays their floors too.
import { PATH, QUARTZ_BLOCK, column, hedge, bed, fountain, statue, FOUNTAIN } from "../vocab.mjs";

export function build(g) {
  // colonnade (E09): N row z29, S row z38, W column x11, E column x24
  for (const x of [11, 14, 21, 24]) { column(g, x, 29); column(g, x, 38); }
  for (const z of [32, 35]) { column(g, 11, z); column(g, 24, z); }

  // low hedges round the court (E11), gap at the axis x17..18
  hedge(g, [12, 30, 16, 30]);
  hedge(g, [19, 30, 23, 30]);
  hedge(g, [12, 37, 16, 37]);
  hedge(g, [19, 37, 23, 37]);
  hedge(g, [12, 31, 12, 36]);
  hedge(g, [23, 31, 23, 36]);

  // path legs (E09 walks): smooth_stone at y1 across the walkway, x17..18, north and south of the court
  g.fill([17, 1, 27], [18, 1, 29], PATH);
  g.fill([17, 1, 38], [18, 1, 40], PATH);

  // formal beds (E10): the statues stand in them, so they are set after the beds
  bed(g, [13, 31, 14, 36]);
  bed(g, [21, 31, 22, 36]);

  // fountain (E12): basin 6x6 in the court's centre, jet on the column top
  fountain(g, FOUNTAIN);
  g.fill([17, 1, 33], [18, 1, 34], QUARTZ_BLOCK);        // the jet's column stands on a quartz base, not on the basin's water

  // statues (E13): plinth, copper figure, cap; in the beds
  statue(g, 13, 33);
  statue(g, 22, 33);
  return g;
}
