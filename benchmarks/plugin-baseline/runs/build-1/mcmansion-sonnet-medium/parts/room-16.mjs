// Primary sitting nook: the turret window seat, inner air x39..41 z9..11 y6..8, entered from the arch at z=12.
// Window bench (oak stairs, open side to the glass) along the front and both side windows, one hanging lantern over
// the bench as the focal light, a quartz slab table with a lantern between the side seats, a flower pot in the corner.
import { B } from "../vocab.mjs";

export function build(g) {
  // L-shaped window bench: three seats along the front window (40,6..8,8) and one each along the side windows
  // (38,6..8,10) and (42,6..8,10). Stairs face the open side toward the glass.
  for (let x = 39; x <= 41; x++) g.set(x, 6, 9, ...B.stairs("oak", "north", "bottom"));
  g.set(39, 6, 10, ...B.stairs("oak", "west", "bottom"));
  g.set(41, 6, 10, ...B.stairs("oak", "east", "bottom"));

  // focal light: hanging lantern from the top plate over the middle of the bench
  g.set(40, 8, 9, ...B.lantern(true));

  // side table between the two side seats: bottom quartz slab, table lantern on top
  g.set(40, 6, 10, ...B.slab("quartz", "bottom"));
  g.set(40, 7, 10, ...B.lantern(false));

  // flower pot in the south-east corner; the south-west corner and the centre front stay open for the walk
  g.set(41, 6, 11, "flower_pot");
}
