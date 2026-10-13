// SPDX-License-Identifier: AGPL-3.0-or-later
// Shopfront: pilasters, cornice, fascia and BUTCHER letters, awning, hanging sign, lobby hood, sockets.json display and wood.
// Everything sits on the street face z 3..5, above the keep-clear (x 10..18 y 6..8 z 4..5), and only into air.
// The machines' display blocks (the butcher's product) go in sockets.json, not the grid: the installer puts them on the
// counters, so this part only records them.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bannerLetter } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/brush-sign.mjs";
import {
  pilaster, cornice, awning, hangingSign, hood, setDisplay, FASCIA,
} from "../vocab.mjs";

const AIR = /(^|:)(cave_|void_)?air$/;
const airy = (g, x, y, z) => AIR.test(g.blockAt(x, y, z));

export function build(g) {
  // the shop's product, shown on the counters and headers by the installer (plan: pork, baked chicken, steak)
  setDisplay("A1", "pink_terracotta");
  setDisplay("A2", "pink_terracotta,brown_mushroom_block,red_terracotta");

  // pilasters on the wall lines' street face: the shop's east end (x 19) and the shop's west end (x 9, over the lobby bay)
  pilaster(g, 9, 4);
  pilaster(g, 19, 4);

  // name board: one continuous 9 x 4 red_nether_bricks board (x 10..18, y 9..12, z 5), air-only
  for (let x = 10; x <= 18; x++) for (let y = 9; y <= 12; y++) if (airy(g, x, y, 5)) g.set(x, y, 5, FASCIA);

  // BUTCHER in banner letters on the board's street face (z 4, y 10): white cloth (the palette's white banners),
  // black letters, one banner per character, hung on the board. Centred on the 9 cells (x 11..17).
  const word = "BUTCHER";
  const x0 = 10 + Math.floor((9 - word.length) / 2);
  [...word].forEach((ch, i) => {
    const pats = bannerLetter(ch, "black", "white");
    // facing north, the street sees x run right to left: the first letter goes at the high-x end
    const x = x0 + word.length - 1 - i;
    if (!pats || !airy(g, x, 10, 4)) return;
    g.set(x, 10, 4, ...B.banner("white", pats, { wall: true, facing: "north" }));
  });

  // striped awning over the shop front (red / white by column) and its valance at z 3
  awning(g, 10, 18, 4, 9, "red", "white");

  // cornice over the fascias and pilasters, into the wall at z 5
  cornice(g, 4, 19, 4, 13, "south");

  // hanging shop sign on its bracket, off the east pilaster (outside the keep-clear)
  hangingSign(g, 20, 3, 10, "BUTCHER");

  // lobby hood over the home door (door x 6..7 z 5, y 6..7); lanterns hang under its inner cells
  hood(g, 5, 8, 9, 4, "north");
}
