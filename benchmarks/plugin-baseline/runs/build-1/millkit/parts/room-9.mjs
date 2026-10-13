// Room: Coop nest room (interior designer's part). Inner air x64..67, y2..4, z13..15 (rooms.json box [64,2,13,67,4,15]).
// The nest row (hay_block and barrels facing up, along z15 at y2) is the coop shell's and already stands in the room, so
// it is the focal piece here: this part only adds the light. One standing lantern on the barrel at x65, z15 (level 10+
// over the whole room, min 10 at the feet). The floor is the coop shell's spruce at y1, so no straw is laid on y2: a full
// block there would take the walk height from y2 to y3.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // y3 layer, origin x64 z13: rows run along +x, successive rows along +z. Lantern at x65, z15, standing on the barrel.
  layers(g, [64, 3, 13], {
    l: ["lantern", { hanging: "false" }],
  }, [
    ["    ", "    ", " l  "],
  ]);
}
