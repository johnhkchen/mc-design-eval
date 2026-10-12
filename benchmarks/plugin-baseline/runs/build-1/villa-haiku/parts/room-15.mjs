/*
You are the INTERIOR DESIGNER of the storeroom W: Store room: barrel and smooth quartz stacks against the back wall, one lamp.. Its inner air is the box [1,2,22,11,5,25] (x0,y0,z0,x1,y1,z1); it is entered through door (10, 2..3, 26) to the peristyle north walkway. Design it for its purpose and build it, inside that box only: a layout that reads at a glance (a focal piece, furniture grouped by use), real blocks with correct states (stairs as seats, slabs and trapdoors as tables and shelves, beds with facing and part, barrels, lanterns, carpets, flower pots, item frames are not blocks), light so it isn't dark, nothing over the doorways or windows. Keep it WALKABLE: a 2-high clear path from every way in across the room and up to every bed, table and workstation; check with `$MCD walk build.nbt --rooms rooms.json` that your room reads ok.
*/

import { BARREL, WALL, lamp } from "../vocab.mjs";

// storeroom W: x1..11, z22..25, air y2..5. The door is at (10, 2..3, 26) on the south wall, so the
// front rows z23..25 stay clear as the walk from the door across the room. The stacks stand against
// the back wall (z22): barrels on the west half, smooth quartz on the east half, one open cell between
// them. The one lamp stands mid-room at (6, 2, 24), off the walk.
export function build(g) {
  // barrels: a row of five on the west half at y2, with a second barrel stacked on x2 and x4
  for (let x = 1; x <= 5; x++) g.set(x, 2, 22, BARREL, { facing: "up", open: "false" });
  for (const x of [2, 4]) g.set(x, 3, 22, BARREL, { facing: "up", open: "false" });

  // smooth quartz stacks on the east half: a block at y2 along x7..11, a second block stacked on x8 and x10
  g.fill([7, 2, 22], [11, 2, 22], WALL);
  for (const x of [8, 10]) g.set(x, 3, 22, WALL);

  // the one lamp, mid-room, off the walk
  lamp(g, 6, 24);
  return g;
}
