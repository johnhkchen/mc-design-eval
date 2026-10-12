// Room 13: primary bathroom, inner air [17,6,19]..[21,8,24]; door from the closet at (16,6..7,22).
// Layout (x across, z down; north = the vanity wall at z19, back wall with the high window at z25):
//   z19 vanity: quartz counter with two sinks (water cauldrons) at x18 and x20; hanging lanterns above them.
//   x21 z20..22: soaking tub (three water cauldrons), lantern hung over its middle as the focal light.
//   x17 z23..24: toilet (quartz tank at the back corner, stair seat in front of it), beside the glass shower.
//   x19..20 z23..24: glass shower (glass on the west x18, east x21 and north-west x19 z22), opening at (20,22).
// Clear 2-high path: door (17,22) -> (17,20..21) -> (18..20,20..21) -> to the tub, sinks and the shower opening.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);
const WATER = (level = "3") => ["water_cauldron", { level }];

export function build(g) {
  // Floor is white_concrete (shell). Vanity counter along z19, sinks at x18 and x20.
  put(g, 17, 6, 19, B.block("smooth_quartz"));
  put(g, 18, 6, 19, WATER());
  put(g, 19, 6, 19, B.block("smooth_quartz"));
  put(g, 20, 6, 19, WATER());
  put(g, 21, 6, 19, B.block("smooth_quartz"));
  put(g, 18, 8, 19, B.chain("y"));
  put(g, 18, 7, 19, B.lantern(true));
  put(g, 20, 8, 19, B.chain("y"));
  put(g, 20, 7, 19, B.lantern(true));

  // Soaking tub along the east wall, z20..22, with a quartz rim cell at its north end.
  for (let z = 20; z <= 22; z++) put(g, 21, 6, z, WATER());
  put(g, 21, 8, 21, B.chain("y"));
  put(g, 21, 7, 21, B.lantern(true));

  // Toilet in the SW corner: quartz tank against the west and back walls, stair bowl in front, facing south.
  put(g, 17, 6, 24, B.block("smooth_quartz"));
  put(g, 17, 6, 23, B.stairs("quartz", "south", "bottom"));

  // Glass shower in the SE corner, floor x18..21 z23..24 is shower floor (air); glass on west x18, north-east x19 z22,
  // east x21. The opening is (20,22), left clear as the way in.
  for (let y = 6; y <= 8; y++) {
    put(g, 18, y, 23, B.pane());
    put(g, 18, y, 24, B.pane());
    put(g, 19, y, 22, B.pane());
    put(g, 21, y, 23, B.pane());
    put(g, 21, y, 24, B.pane());
  }

  // Bath rug and a hanging lantern over the path for light.
  put(g, 19, 6, 21, B.block("white_carpet"));
  put(g, 18, 8, 21, B.chain("y"));
  put(g, 18, 7, 21, B.lantern(true));
}
