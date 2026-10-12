// Room 2: Under-gallery hall, interior designer. Inner air x27..34, y2..5, z14..15 (foyer open to the north, mudroom door
// on the west wall at z15, great-room arch in the south wall at x30..31). Layout, by use:
//   - focal console on the south wall (x32..34, z15): spruce slab top on spruce fence legs, lit by a hanging lantern;
//   - bench of two spruce stairs (x28..29, z15) facing the console, seats against the south wall;
//   - coat pegs: a spruce fence post on the east wall (x34, z14), clear of every path;
//   - hanging lanterns from the gallery floor (y6) light the room; the cells in front of each doorway stay clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SPRUCE_FENCE } from "../vocab.mjs";

export function build(g) {
  // focal console: legs at y2, top slab at y3 across x32..34 on the south wall
  for (const x of [32, 33, 34]) g.set(x, 2, 15, SPRUCE_FENCE);
  for (const x of [32, 33, 34]) g.set(x, 3, 15, ...B.slab("spruce", "bottom"));

  // bench: two stair seats, backs against the south wall, fronts facing the foyer
  for (const x of [28, 29]) g.set(x, 2, 15, ...B.stairs("spruce", "south", "bottom"));

  // coat pegs on the east wall, beside the foyer opening
  g.set(34, 2, 14, SPRUCE_FENCE);
  g.set(34, 3, 14, SPRUCE_FENCE);

  // lighting: lanterns hang from the gallery floor at y6 (y5 cell), the focal lantern over the console
  g.set(27, 5, 14, ...B.lantern(true));
  g.set(28, 5, 14, ...B.lantern(true));
  g.set(31, 5, 14, ...B.lantern(true));
  g.set(33, 5, 15, ...B.lantern(true));
}
