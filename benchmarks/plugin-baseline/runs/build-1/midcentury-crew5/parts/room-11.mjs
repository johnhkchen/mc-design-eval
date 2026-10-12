// ROOM master bedroom (interior designer): master suite, orange accents, spruce floor (the shell lays it at y=1).
// Inner air x=23..30, y=2..4, z=22..24. Entry from the corridor at (23..24, 22) on the north side (z=21).
//
//   floor grid (rows z=22, 23, 24; columns x=23..30):
//     z22  . . . W W W . E        W = wardrobe planks (fronts at z=23), E = egg chair side plate, p = potted cactus
//     z23  b b . f f f e S        b = bed (head 23, foot 24 at x=23..24), f = wardrobe fronts, e = egg chair back, S = seat
//     z24  n c . . . . . E        n = nightstand, c = orange carpet (bed side)
//
// Walk: the entry cells (23..24, 22) open onto a 2-wide lane at x=25 (z=22..24), and the slider cells (26..27, 24)
// stay clear for the south glass. The egg chair faces east to the east glass (x=31, z=21..23).
import { wardrobe, egg_chair, hung_lantern } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // bed: foot at (24,23), head at (23,23) against the west wall, orange spread
  g.set(24, 2, 23, "orange_bed", { facing: "west", part: "foot" });
  g.set(23, 2, 23, "orange_bed", { facing: "west", part: "head" });

  // nightstand on the south side of the head: spruce fence post, birch slab top, lantern on it (bedside light)
  g.set(23, 2, 24, ...B.fence("spruce"));
  g.set(23, 3, 24, ...B.slab("birch", "bottom"));
  g.set(23, 4, 24, ...B.lantern(false));

  // rug at the bed's foot
  g.set(24, 2, 24, "orange_carpet");

  // wardrobe wall on the north partition: planks 2 high with open trapdoor fronts facing the room (south)
  wardrobe(g, 26, 22, 3, "x", "south");

  // egg-chair reading corner: seat at (30,23) facing west, so the sitter looks east to the glass
  egg_chair(g, 30, 23, "west");

  // flower pot in the pocket behind the egg chair's side plate (keeps the dead corner furnished)
  g.set(29, 2, 22, "potted_cactus");

  // hung lanterns: one over the bed's approach, one over the slider side, one over the egg chair
  hung_lantern(g, 24, 4, 22);
  hung_lantern(g, 28, 4, 24);
  hung_lantern(g, 30, 4, 23);
}
