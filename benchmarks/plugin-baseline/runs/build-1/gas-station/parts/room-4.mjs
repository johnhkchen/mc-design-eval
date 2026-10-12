// Part "room: Hall" (parts/room-4.mjs): the one-wide corridor x28, z26..28, y1..7. The hall is a lane: nothing stands on
// the floor (every doorway opens into it, so the three floor cells stay clear). Its one fitting is a hanging lantern on
// the centre line at the junction of the three doorways (x28, z27), hung from the roof deck at y8. It sits over no
// doorway (x27/x29 at z27 and z25/z29 at x28 stay clear) and is the brightest spot in the hall.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // hanging lantern under the roof deck (y8): y7 is the only air above the lane's 2-high clearance
  if (g.blockAt(28, 8, 27) !== "minecraft:air") {
    g.set(28, 7, 27, ...B.lantern(true));
    return;
  }
  // no deck above (the roof part did not build it): a hanging lantern would float, so set a sea lantern flush in the
  // ceiling line instead. It is held by the side walls at x27 and x29 (y7), not by anything above, and sits above the
  // lane's 2-high clearance.
  g.set(28, 7, 27, ...B.block("sea_lantern"));
}
