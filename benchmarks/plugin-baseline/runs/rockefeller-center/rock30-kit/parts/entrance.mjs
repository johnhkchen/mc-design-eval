// Part 6: East entrance, marquee and flags. Three portals under the WISDOM relief, the glass-block screen, the
// inscription band, the north marquee over the tower entrance, and flag rows.
import { box, portal, glassScreen, wisdomPanel, marquee, flagRow } from "../vocab.mjs";
import { bannerWord } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const EAST = { side: "east", line: 144 };     // door plane x144; x145 is the recess and the relief

export function build(g) {
  // East main portals: z21..23, z26..29, z32..34, y3..9 (centred on a = 22, 27, 33).
  portal(g, EAST, 22, 3, 3, 7);
  portal(g, EAST, 27, 3, 4, 7);
  portal(g, EAST, 33, 3, 3, 7);

  // Glass-block screen over the portals (y10..13), then the black inscription board (y14..16).
  glassScreen(g, 144, 20, 35, 10, 13);
  box(g, [144, 14, 20, 144, 16, 35], "black_terracotta");
  bannerWord(g, "WISDOM", { center: [145, 15, 27], face: "east" });

  // WISDOM relief: yellow_terracotta sky on x144, gold/quartz/terracotta relief on x145, z20..35, y17..27.
  wisdomPanel(g, EAST, 20, 17);

  // North tower entrance marquee.
  marquee(g, [68, 12, 0, 79, 15, 3], "north");

  // North entrance flags: the row hangs on a bronze transom bar at z2 (under the marquee, y11), facing out to z1.
  // The east flags have no room: the relief and the board fill x144..145 at the transom, so none are hung there.
  box(g, [69, 11, 2, 77, 11, 2], "polished_blackstone");
  flagRow(g, { side: "north", line: 2 }, 73, 11, { depth: 1 });
}
