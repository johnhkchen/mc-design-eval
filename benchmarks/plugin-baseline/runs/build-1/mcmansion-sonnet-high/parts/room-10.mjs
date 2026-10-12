// room: Upper hall / gallery (plan ROOMS, box [20,6,14,25,8,22]): a bright landing over the foyer.
// Focal piece = a console with art on the east wall, first seen from the stair top. A runner runs south down the
// middle; a seat nook sits by the west wall; a two-seat gallery bench faces the rail over the foyer; plants and
// lanterns fill the corners. The stair top (20..22,6,14), the corridor and bedroom door cells, and the south
// window cells stay clear, so there is a 2-high path from every way in to every seat and table.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);
const block = (name) => [name, {}];

export function build(g) {
  // runner: red carpet down the middle, from the stair top south (the stair top itself stays clear)
  for (let z = 15; z <= 21; z++) put(g, 22, 6, z, block("red_carpet"));

  // focal console on the east side: fence legs + slab top (table), with a lantern and a potted fern on it
  for (let z = 18; z <= 21; z++) {
    put(g, 24, 6, z, block("dark_oak_fence"));
    put(g, 24, 7, z, B.slab("dark_oak", "top"));
  }
  put(g, 24, 8, 19, B.lantern(false));
  put(g, 24, 8, 21, block("potted_fern"));

  // art: a framed canvas on the east wall, above the console (dark oak frame, white canvas)
  for (const y of [7, 8]) {
    put(g, 25, y, 18, block("dark_oak_planks"));
    put(g, 25, y, 21, block("dark_oak_planks"));
    put(g, 25, y, 19, block("white_wool"));
    put(g, 25, y, 20, block("white_wool"));
  }

  // gallery bench: two stair seats facing the rail over the foyer. The bench end (25,6..8,15) stays clear: it is the
  // approach to the bedroom 3 door at (26,6..7,14), so no side table goes there.
  for (let x = 23; x <= 24; x++) put(g, x, 6, 15, B.stairs("oak", "south", "bottom"));

  // seat nook by the west wall: two stair seats looking east at the focal piece; a plant in the corner
  for (const z of [18, 19]) put(g, 20, 6, z, B.stairs("oak", "west", "bottom"));
  put(g, 20, 6, 15, block("potted_fern"));

  // south corner plant (beside the arched window, not in front of it) and a floor lantern by the bedroom 4 door
  put(g, 25, 6, 22, block("potted_azalea_bush"));
  put(g, 20, 6, 22, block("potted_fern"));
  put(g, 20, 6, 21, B.lantern(false));

  // hanging lanterns from the ceiling (y9) give the landing its light; none over a doorway or window
  for (const [x, z] of [[21, 16], [23, 17], [21, 20], [23, 21]]) put(g, x, 8, z, B.lantern(true));
}
