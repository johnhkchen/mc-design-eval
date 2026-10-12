/*
You are the INTERIOR DESIGNER of the shop E2: Shuttered trade room, mirror of W2: counter at the front, shelves on the side wall, one pot.. Its inner air is the box [21,2,1,26,5,7] (x0,y0,z0,x1,y1,z1); it is entered through street opening (22..25, 2..4, z=0). Design it for its purpose and build it, inside that box only: a layout that reads at a glance (a focal piece, furniture grouped by use), real blocks with correct states (stairs as seats, slabs and trapdoors as tables and shelves, beds with facing and part, barrels, lanterns, carpets, flower pots, item frames are not blocks), light so it isn't dark, nothing over the doorways or windows. Keep it WALKABLE: a 2-high clear path from every way in across the room and up to every bed, table and workstation; check with `$MCD walk build.nbt --rooms rooms.json` that your room reads ok.
*/
// shop E2 (box x21..26, y2..5, z1..7). The shell's counter sits at z=1, x22..25 (y2); the trader works behind it at z2..7.
// Layout: the shelved wall is the east side wall (x=26): bookshelves two high at z2..5 (the focal piece, facing the street).
// Stock barrels line the west wall (x=21, z3..5). One pot on the counter's east corner (26,2,1), as W1 and E1 have theirs.
// Two standing lamps in the back corners light the room. The x22..25 z2..7 floor stays clear as the walkway.
import { lamp, pot } from "../vocab.mjs";

export function build(g) {
  for (let z = 2; z <= 5; z++) for (let y = 2; y <= 3; y++) g.set(26, y, z, "bookshelf");
  for (let z = 3; z <= 5; z++) g.set(21, 2, z, "barrel", { facing: "up", open: "false" });
  pot(g, 26, 1, "fern");
  lamp(g, 21, 7);
  lamp(g, 26, 7);
  return g;
}
