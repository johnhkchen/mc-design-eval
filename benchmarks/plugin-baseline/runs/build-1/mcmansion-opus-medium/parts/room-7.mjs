// Room 7: garage (plan.md ROOMS, box [30,1,14,40,4,24]). Interior designer's layout:
// - three bays clear behind the carriage doors (x30..32, x34..36, x38..40, z14..18): nothing parked-over, nothing placed
// - shelves, a workbench and bins along the back wall z24; the workbench is the focal piece, centred on the middle door
// - hanging lanterns in the gaps between the bays (x33, x37) and one over the bench (the brightest spot), lit at night
// - the step (30,1,22) and its approach (31,1..2,22), (30,2..3,22) stay clear for the mudroom door (29,2..3,22)
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BARREL, BOOKSHELF, DARK_OAK_PLANKS, hangLamp } from "../vocab.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);

export function build(g) {
  // Back wall z24: bins and shelves at the ends, workbench in the middle (x34..36), focal piece under the hanging lamp.
  put(g, 30, 1, 24, [BARREL, { facing: "up" }]);
  put(g, 31, 1, 24, B.block(BOOKSHELF));
  put(g, 32, 1, 24, B.block(BOOKSHELF));
  put(g, 33, 1, 24, [BARREL, { facing: "up" }]);
  for (let x = 34; x <= 36; x++) put(g, x, 1, 24, B.block(DARK_OAK_PLANKS));
  put(g, 34, 2, 24, ["water_cauldron", { level: "3" }]);
  put(g, 37, 1, 24, [BARREL, { facing: "up" }]);
  put(g, 38, 1, 24, B.block(BOOKSHELF));
  put(g, 39, 1, 24, B.block(BOOKSHELF));
  put(g, 40, 1, 24, [BARREL, { facing: "up" }]);

  // East wall x40, south of the bays: a bin run.
  put(g, 40, 1, 19, B.block(BOOKSHELF));
  put(g, 40, 1, 20, [BARREL, { facing: "up" }]);
  put(g, 40, 1, 21, B.block(BOOKSHELF));

  // West wall x30, north of the mudroom approach (z21..23 stay clear).
  put(g, 30, 1, 19, [BARREL, { facing: "up" }]);

  // Light: hanging lamps in the bay gaps and over the workbench (chain y4 from the bonus floor, lantern y3).
  hangLamp(g, 33, 4, 17);
  hangLamp(g, 33, 4, 21);
  hangLamp(g, 37, 4, 17);
  hangLamp(g, 37, 4, 21);
  hangLamp(g, 35, 4, 23);
}
