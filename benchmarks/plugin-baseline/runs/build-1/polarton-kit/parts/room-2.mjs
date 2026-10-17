// Part: room: gin machine room. A clear bay for the owner's Create gin (plan RESERVED: NO furniture, posts or decor).
// Light only: two lanterns hung from the loft floor (y 6) over the bay at x 3 and x 8, z 14. Each floor cell in
// x 2..9, z 13..15 is 8 or more (Manhattan distance to a lantern at y 5 is 4 + dx + dz, light 15 less that).
// The shaft hole (7, 6, 14) is in the loft floor above, so neither lantern sits under it.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  g.set(3, 5, 14, ...B.lantern(true));
  g.set(8, 5, 14, ...B.lantern(true));
}
