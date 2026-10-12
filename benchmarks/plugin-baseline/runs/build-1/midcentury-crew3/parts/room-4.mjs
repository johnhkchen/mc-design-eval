// ROOM living (interior designer): the show room. Inner air x=11..21, z=19..24; standing y=2 (floor slab y=1 from the shell).
// The sunken pit x=13..17 z=20..23 (floor y=0 from the shell; quartz rim and orange carpet at y=1). The fireplace at
// x=20..21 z=21..22 belongs to the roof part: its cells are left alone. Every write goes into air only.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { conversation_pit, sofa_low, egg_chair, sideboard, hung_lantern } from "../vocab.mjs";

// One block spec into air, the way the vocab helpers do it. Returns 1 if placed.
function put(g, x, y, z, spec) {
  if (!g.isAir(x, y, z)) return 0;
  g.set(x, y, z, ...spec);
  return 1;
}

export function build(g) {
  // the sunken conversation pit: smooth_quartz stair rim, orange carpet, spruce coffee table in the middle
  conversation_pit(g, 13, 20, 17, 23);
  // two low orange sofas: west one backed on the wall column, south one backed on the garden glass
  sofa_low(g, 12, 20, 2, "z", "east");
  sofa_low(g, 16, 24, 3, "x", "north");
  // egg chair by the atrium glass: sits facing the atrium (north), high back toward the room
  egg_chair(g, 18, 19, "south");
  // birch sideboard on the fireplace side, a potted cactus on top
  sideboard(g, 21, 23, 2, "z", "west");
  // floor lamp in the south-west corner: spruce fence post with an end rod on top
  put(g, 11, 2, 24, B.block("spruce_fence"));
  put(g, 11, 3, 24, ["end_rod", { facing: "up" }]);
  // hung lanterns under the beams and ceiling: over the pit, the fireplace side, the entry lane and the east corner
  for (const [x, z] of [[13, 19], [15, 21], [19, 21], [13, 24], [19, 24], [19, 19], [21, 20]]) hung_lantern(g, x, z);
  return g;
}
