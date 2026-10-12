// ROOM corridor (interior designer): calm spruce-and-white corridor along the atrium's east glass to the bedrooms.
// Inner air box [23,2,9,24,4,21]. Two cells wide: x=23 is the furniture side (against the atrium glass), x=24 stays open as
// the walking lane, so every doorway in the east partition (x=25, z=10/15/19) and both west openings (z=9..10, z=19..20)
// keep a clear 2-high path. Light: hung lanterns under the spruce ceiling (z=9..13, 20..24), and a standing lantern on a
// birch pedestal (the focal point) in the open z=14..19 stretch, where no ceiling exists to hang from.
// Terrazzo floor and the ceiling are the shell's (part 1); item-frame art is an entity and is not placed here.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hung_lantern, sideboard } from "../vocab.mjs";

export function build(g) {
  // east-side sideboard: birch cabinet fronts toward the walking lane, z=11..13 at x=23
  sideboard(g, 23, 11, 3, "z", "east");

  // floor-level planting and the focal pedestal, drawn as text: origin (23,2,9), rows along +z, columns x=23,24
  const legend = {
    P: "potted_cactus",                                  // flower pots on the floor by the glass
    B: ["birch_slab", { type: "bottom" }],               // pedestal under the focal lantern
  };
  const floor = [
    "..", // z=9   gallery threshold, clear
    "..", // z=10  bed 1 doorway approach, clear
    "..", // z=11  sideboard (placed above)
    "..", // z=12  sideboard
    "..", // z=13  sideboard
    "..", // z=14
    "P.", // z=15  potted cactus, bath 1 doorway approach at x=24 stays clear
    "B.", // z=16  focal pedestal
    "P.", // z=17  potted cactus
    "..", // z=18
    "..", // z=19  living doorway approach, clear
    "..", // z=20  living doorway, clear
    "..", // z=21  open to the master bedroom, clear
  ];
  // y=3 layer: the standing lantern on the pedestal (the brightest light in the corridor)
  const head = [
    "..", "..", "..", "..", "..", "..", "..",
    "L.", // z=16 focal lantern on the pedestal
    "..", "..", "..", "..", "..",
  ];
  layers(g, [23, 2, 9], { ...legend, L: ["lantern", { hanging: "false" }] }, [floor, head]);

  // hung lanterns in the lane's headroom (y=4): the ceiling at y=5 is spruce_planks over z=9..13 and z=20..24
  hung_lantern(g, 24, 4, 10);
  hung_lantern(g, 24, 4, 13);
  hung_lantern(g, 24, 4, 20);
}
