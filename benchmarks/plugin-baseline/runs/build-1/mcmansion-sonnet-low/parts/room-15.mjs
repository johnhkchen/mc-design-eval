// Room 15: Primary bathroom, interior designer. Inner air x36..39 z24..27 (chimney chase x40..42 z24..26 reserved),
// y7..9. Entry: door at z23 (x38..39, y7..8) from the closet. Window in the back wall z28 (x37..39).
// Layout: double vanity on the west wall (x36, z24..26) with a toilet at the back-left corner; a soaking tub under
// the window (x38..39 z27) as the focal piece; a walk-in shower in the east corner (glass screen on x38 z25..26);
// lanterns on the vanity and on the tub. Column x37 is the clear 2-high path from the door to every fixture.
// Palette only: smooth_quartz, white_concrete, glass_pane, lantern.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SMOOTH_QUARTZ = "smooth_quartz";
const WHITE_CONCRETE = "white_concrete";
const GLASS_PANE = "glass_pane";

export function build(g) {
  // Double vanity: a three-cell counter on the west wall, mirror above it, one lantern between the basins.
  g.fill([36, 7, 24], [36, 7, 26], SMOOTH_QUARTZ);
  g.fill([36, 8, 24], [36, 8, 24], GLASS_PANE);
  g.fill([36, 8, 26], [36, 8, 26], GLASS_PANE);
  g.fill([36, 9, 24], [36, 9, 26], GLASS_PANE);
  g.set(36, 8, 25, ...B.lantern(false));

  // Toilet: a quartz seat at the back-left corner, its tall back against the west wall (facing west).
  g.set(36, 7, 27, ...B.stairs(SMOOTH_QUARTZ, "west", "bottom"));

  // Soaking tub under the window: the focal piece, lit by a lantern on its rim.
  g.fill([38, 7, 27], [39, 7, 27], WHITE_CONCRETE);
  g.set(38, 8, 27, ...B.lantern(false));

  // Walk-in shower: quartz tray in the east corner, glass screen on its west side (x38, z25..26).
  g.fill([39, 7, 25], [39, 7, 26], SMOOTH_QUARTZ);
  g.fill([38, 7, 25], [38, 9, 26], GLASS_PANE);
}
