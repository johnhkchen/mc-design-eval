// Bedroom 4 (kid's room): inner air x19..22, y6..8, z21..24. Door (21,6..7,20) on the north wall; window (20..21,6..8,25).
// Bunk frame along the west wall, a small desk with a chair on the east side, two hanging lanterns for the light.
// Beds, carpet, barrels and chests are not in palette.json, so the bunk is a plank-and-fence frame and the toy chest
// is left out (see plan.md Notes).
import { B } from "../vocab.mjs";

export function build(g) {
  // bunk frame: lower platform, posts, upper platform (west wall, z22..23)
  g.set(19, 6, 22, "oak_planks");
  g.set(19, 6, 23, "oak_planks");
  g.set(19, 7, 22, ...B.fence("oak"));
  g.set(19, 7, 23, ...B.fence("oak"));
  g.set(19, 8, 22, "oak_planks");
  g.set(19, 8, 23, "oak_planks");

  // small desk on the east wall (z23): fence leg at floor, plank top at y7, flower pot on top, stair chair west of it
  g.set(22, 6, 23, ...B.fence("oak"));
  g.set(22, 7, 23, "oak_planks");
  g.set(22, 8, 23, "flower_pot");
  g.set(21, 6, 23, ...B.stairs("oak", "east", "bottom"));

  // a potted flower by the door as the only toy-room decoration the palette allows
  g.set(22, 6, 21, "flower_pot");

  // light: two hanging lanterns under the ceiling (y9), one over the bunk, one over the desk
  g.set(20, 8, 22, ...B.lantern(true));
  g.set(22, 8, 21, ...B.lantern(true));
}
