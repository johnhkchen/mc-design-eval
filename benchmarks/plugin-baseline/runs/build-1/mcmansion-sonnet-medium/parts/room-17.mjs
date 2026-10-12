// room: Primary bath (interior designer): inner air x36..41, y6..8, z21..23 (plan.md ROOMS).
// Layout, entries and light:
//  - double vanity on the west wall, flanking the closet door (35,6..7,22): counters at (36,21) and (36,23), sinks
//    (cauldrons) on top; the cell (36,22) in front of that door stays clear.
//  - soaking tub under the east window (x42, z21..22): a quartz rim at x40 with two cauldrons at x41 (the focal piece).
//  - walk-in shower in the back-right corner: glass wall at x39 z23 and an iron-trapdoor showerhead above (40,8,23).
//  - towel rail (iron bars) on the back wall under the back window, a flower pot by the door side.
//  - four hanging lanterns on the ceiling plate at y8 (light for the whole floor); nothing over the doorways.
import { B } from "../vocab.mjs";

export function build(g) {
  // vanity: quartz counters and sinks (the closet door at (35,6..7,22) stays in the middle of the wall)
  g.set(36, 6, 21, "quartz_block");
  g.set(36, 6, 23, "quartz_block");
  g.set(36, 7, 21, "cauldron");
  g.set(36, 7, 23, "cauldron");

  // soaking tub under the east window: quartz rim, two cauldron basins
  g.set(40, 6, 21, "quartz_block");
  g.set(40, 6, 22, "quartz_block");
  g.set(41, 6, 21, "cauldron");
  g.set(41, 6, 22, "cauldron");

  // walk-in shower in the back-right corner: open floor bay (x39..41, z23) so it stays walkable, a glass screen
  // header over its mouth and an iron-trapdoor showerhead on the ceiling
  g.set(39, 8, 23, "glass_pane");
  g.set(40, 8, 23, ...B.trapdoor("iron", "north", "top", false));

  // towel rail on the back wall, under the back window
  g.set(37, 7, 23, "iron_bars");
  g.set(38, 7, 23, "iron_bars");

  // a potted plant on the floor by the shower, out of the way of both doors
  g.set(37, 6, 23, "flower_pot");

  // hanging lanterns from the ceiling plate: over each sink, the centre and the tub
  for (const [x, z] of [[37, 21], [37, 23], [38, 22], [41, 22]]) g.set(x, 8, z, ...B.lantern(true));
}
