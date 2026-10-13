// Room: P0 front room (v2: a sleeping front room). Inner air x 4..7, y 3..6, z 10..12; front door x 5..6 at z 9 and the open
// partition door x 5 at z 13. Two beds head to the front wall, one on each side (x 4 and x 7, z 10..11), the lane x 5..6 stays
// clear door to door; a barrel with a candle and a poppy at x 4 z 12. The smoker at (7,3,12) belongs to the hearths part.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  bed(g, [4, 3, 11], "north", "red");
  bed(g, [7, 3, 11], "north", "white");
  layers(g, [4, 3, 12], { B: ["barrel", { facing: "up" }], L: ["lantern", { hanging: "false" }] }, [["B..."], ["L..."]]);
}
