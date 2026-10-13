// Part "shopfronts" (parts/shopfronts.mjs): the street face of the shop row at z 19 (out = +1, toward the street, z 20).
// The shell leaves the fascia cells (x 5..11, 13..19 y 10..12), the console cells (x 4, 12, 20) and the end pilaster
// columns (x 3, 21, y 6..12) open, so the helpers below write into air. Two tenants, BAKER (unit 1, x 4..12) and
// GROCER (unit 2, x 12..20), named as in the concept. Also the shop cornice at y 13 and the eaves cornice at y 23.
// Never touches the keep-clear shop opening (x 4..20, y 7..9, z 19..20) or the socket boxes.
import { pilaster, console as shopConsole, hangingSign, cornice } from "../vocab.mjs";
import { plaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// The fascia: a dark prismarine board with the shop name as banner letters on the wall. The banner cloth takes the
// dye nearest the board (dark prismarine is gray, and the palette has no gray banner), so the plaque is given a white
// board to match: white cloth, black letters, both from the palette's white banners.
function fascia(g, x0, x1, z, name) {
  g.fill([x0, 10, z], [x1, 12, z], "dark_prismarine");
  plaque(g, name, { at: [x0, 10, z], face: "south", width: x1 - x0 + 1, height: 3, material: null, wall: "white_concrete", letter: "black_concrete" });
}

export function build(g) {
  // End pilasters, one each side of the row (x 3 and x 21), shared with the stair bay on the east.
  pilaster(g, 3, 19);
  pilaster(g, 21, 19);

  // Consoles dividing the fascias: at the ends of each shop unit and between them (x 4, 12, 20).
  for (const x of [4, 12, 20]) shopConsole(g, x, 19);

  // Fascia boards with the shop names (banner letters, white on dark prismarine).
  fascia(g, 5, 11, 19, "BAKER");
  fascia(g, 13, 19, 19, "GROCER");

  // Hanging sign on a dark_oak bracket at each outer end of the row, over the pavement.
  hangingSign(g, 4, 19, "BAKER");
  hangingSign(g, 20, 19, "GROCER");

  // Shop cornice across the whole row above the fascias (y 13, carries the oriel corbels), and the eaves cornice (y 23).
  cornice(g, 13, 19, 3, 26);
  cornice(g, 23, 19, 3, 26);
}
