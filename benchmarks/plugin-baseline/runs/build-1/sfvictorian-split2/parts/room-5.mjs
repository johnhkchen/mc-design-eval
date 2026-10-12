// room: Entry hall (plan.md ROOMS: inner air [10,5,11,13,7,23], floor dark_oak_planks at y4).
// Warm Victorian hall: a red runner down the walkway (x10..11), a coat stand by the front door corner,
// a console table with a lamp post as the focal group on the east side (x12..13, z15..20), a barrel
// umbrella stand, and hanging lanterns on the y8 ceiling for light. The stair (x12..13 z12..14) and
// the well shaft (x12..13 z21..23) are the architect's: nothing is placed on them. Walkways stay clear:
// x10 at the parlour door z14..15, the dining door z19..20, and the hall-kitchen door approach z23.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { chair, lampPost, rug, table } from "../vocab.mjs";

const NO_LINKS = { north: "false", south: "false", east: "false", west: "false" };

export function build(g) {
  // Runner: red carpet down the walkway, x10..11 from the front door to the z20 row (the railing starts at z21).
  rug(g, 10, 11, 5, 11, 20, "red");

  // Coat stand: a two-high birch post in the east corner inside the front door (x13 z11), clear of the door at x11..12.
  g.set(13, 5, 11, "birch_fence", NO_LINKS);
  g.set(13, 6, 11, "birch_fence", NO_LINKS);

  // Potted fern on the floor by the stair foot.
  g.set(13, 5, 15, "potted_fern");

  // Focal group, east side: a lamp post, the console table, one chair facing it, a barrel umbrella stand.
  lampPost(g, 13, 5, 16);
  table(g, 13, 5, 17);
  chair(g, 12, 5, 17, "east");
  g.set(12, 5, 20, "barrel", { facing: "up", open: "false" });

  // Hanging lanterns from the y8 ceiling: the lantern lights the hall as a room at night.
  g.set(10, 7, 13, ...B.lantern(true));
  g.set(11, 7, 18, ...B.lantern(true));
  g.set(10, 7, 22, ...B.lantern(true));
}
