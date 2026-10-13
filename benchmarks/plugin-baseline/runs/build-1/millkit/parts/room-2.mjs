// Room: P0 back room (v2: two beds). Inner air x4..7, y3..6, z14..16; partition door (5,13), back door (6,17).
// Beds: west bed (head at x4, foot x5, z15) and east bed (foot x7 z14, head x7 z15, pillow at the back). The walk column x6 and the
// doorway cell (5,14) stay clear. A chest and a potted poppy at x7 z16, a fence-post stand with a lantern at x4 z16.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  bed(g, [5, 3, 15], "west", "red");
  bed(g, [7, 3, 14], "south", "white");
  layers(g, [4, 3, 16], {
    "C": ["chest", { facing: "west", type: "single" }],
    "F": "oak_fence",
    "L": ["lantern", { hanging: "false" }],
    "P": "potted_poppy",
  }, [
    ["F..C"],
    ["L..P"],
  ]);
  layers(g, [4, 3, 14], { L: ["lantern", { hanging: "false" }] }, [["L"]]);
}
