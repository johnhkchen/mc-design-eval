// Room: Coop nest room (v2 hen house). Inner air x 65..68, y 3..5, z 12..15 on the raised floor y 2. The nest row (hay_block and
// barrels along z 15 at y 3), the roost log at y 5 and the walls are the henhouse's (parts/coop.mjs); this part adds the light:
// one standing lantern on the barrel at x 65, z 15.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  layers(g, [65, 4, 15], { l: ["lantern", { hanging: "false" }] }, [["l"]]);
  layers(g, [67, 4, 15], { l: ["lantern", { hanging: "false" }] }, [["l"]]);
}
