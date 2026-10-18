// Room "P5 attic south bedroom" (interior designer's part): one bed against the west wall (head on x84, the wall at
// x83), a two-barrel dresser beside its foot, a chest at the east end, a rug down the middle lane, and two standing
// lanterns on the barrel and chest tops as the light. The door (90,6..7,18) opens onto (90,6,19), which stays clear;
// the flue at x88 z18 is in the partition, outside this box.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // the bed: foot at (85,6,19), head at (84,6,19), against the west wall
  bed(g, [85, 6, 19], "west", "red");

  // origin (84,6,19): rows along +x (x84..91), successive rows along +z (z19, z20); layer y6 then layer y7
  layers(g, [84, 6, 19], {
    "c": ["chest", { facing: "west", type: "single" }],
    "b": ["barrel", { facing: "up", open: "false" }],
    "r": "red_carpet",
    "l": ["lantern", { hanging: "false" }],
    "f": "flower_pot",
  }, [
    [
      "..rr....", // y6, z19: rug in the middle lane, clear of the chimney masonry at x88; bed foot and head are placed by bed()
      "bb.....c", // y6, z20: barrels under the bed's foot, chest at the east end
    ],
    [
      "........", // y7, z19: kept clear above the bed
      "lf.....l", // y7, z20: lantern on the barrel, flower pot, lantern on the chest
    ],
  ]);
}
