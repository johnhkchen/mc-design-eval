// Part: room: I-house stair hall. Interior of box [29,3,10,30,6,15]; the flight at x30 z10..14 is the joiner's.
// The hall is two cells wide and the stair takes x30 at z10..13, so x29 is the lane from the front door (z9) to the
// back door (z16) and to the west door at z11; the east door (x31) is reached from x30 z14, under the stair's foot.
// Nothing goes on x29 or x30 z14; the furniture sits in the corner cell x30 z15 and the light hangs over the lane
// at y6, above head height.
import { hanging_lantern } from "../vocab/h2.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Coat stand: a fence post with a standing lantern on top, the focal piece of the hall, seen down the stair
  // from the front door at the far corner by the back door.
  g.set(30, 3, 15, ...B.fence("spruce"));
  g.set(30, 4, 15, ...B.lantern(false));

  // Hanging lantern under the upper floor over the lane (x29 z12): the hall's light, clear of the head room.
  hanging_lantern(g, 29, 6, 12);
}
