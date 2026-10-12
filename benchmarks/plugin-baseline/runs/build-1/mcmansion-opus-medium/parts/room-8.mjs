// Room 8: upper hall and gallery (plan.md ROOMS). A quiet 2-wide landing, x3..28 z16..17 at y6..8, kept clear: furniture
// only at the dead ends (west: bench + potted fern under a hanging lantern, the focal spot; east: a storage barrel).
// White runner on the floor, hanging lanterns along the spine so no floor cell is dark. Pictures are item frames
// (entities, not blocks), so none are placed; the railing over the foyer is P1's (birch fence at (13..17,6,15)).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hangLamp, WHITE_CARPET, POTTED_FERN, BARREL } from "../vocab.mjs";

export function build(g) {
  const put = (x, y, z, pair) => g.set(x, y, z, ...pair);

  // white runner over the landing floor (x4..27); the dead end at x3 stays bare for the bench and fern
  for (let x = 4; x <= 27; x++) for (let z = 16; z <= 17; z++) put(x, 6, z, [WHITE_CARPET, {}]);

  // west dead end: bench (stairs as a seat, back to the wall, facing the room), fern pot, lantern above (focal, brightest)
  put(3, 6, 17, B.stairs("dark_oak", "east", "bottom"));
  put(3, 6, 16, [POTTED_FERN, {}]);
  hangLamp(g, 3, 8, 16);

  // spine lights: each hangs at y7 on the z17 row, so the z16 row stays 2-high clear (lanterns skip the door cells x9, x25)
  for (const x of [6, 14, 22, 27]) hangLamp(g, x, 8, 17);

  // east dead end: storage barrel
  put(28, 6, 17, [BARREL, { facing: "up", open: "false" }]);
}
