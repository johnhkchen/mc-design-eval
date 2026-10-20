// Interior designer for "West aisle 3F" (room 11): a long third-floor gallery. Inner air x6..19, y15..20, z36..131.
// The doorway (x12..13, z35) looks straight down a clear 2-wide lane (x12..13) to the focal piece at the far end.
// Furniture stands only along the walls: stained-glass pedestals on the west side (x7..8), benches on the rail side
// (x19, seats facing west into the room). Hanging lanterns run down both sides of the lane under the 4F floor (y21).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FEET = 15; // floor surface at y14; feet stand at y15

export function build(g) {
  // West side: display pedestals, each a full smooth_quartz block with a 2-high stained-glass column and an end rod
  const columns = ["red_stained_glass", "yellow_stained_glass", "orange_stained_glass"];
  [40, 56, 72, 88, 104, 120].forEach((z, i) => {
    g.set(8, FEET, z, "smooth_quartz");
    g.set(8, FEET + 1, z, columns[i % 3]);
    g.set(8, FEET + 2, z, columns[(i + 1) % 3]);
    g.set(8, FEET + 3, z, "end_rod", { facing: "up" });
  });

  // Rail side: benches, two polished_andesite stair seats side by side in z, back against the rail (facing east)
  [44, 60, 76, 92, 108].forEach((z) => {
    g.set(19, FEET, z, ...B.stairs("polished_andesite", "east"));
    g.set(19, FEET, z + 1, ...B.stairs("polished_andesite", "east"));
  });

  // Focal piece at the lane's end: a 8-wide smooth_quartz plinth at z126 with three glass columns and a sea lantern core
  for (let x = 9; x <= 16; x++) g.set(x, FEET, 126, "smooth_quartz");
  const flower = [
    [10, "red_stained_glass", "orange_stained_glass"],
    [13, "yellow_stained_glass", "red_stained_glass"],
    [15, "orange_stained_glass", "yellow_stained_glass"],
  ];
  for (const [x, a, b] of flower) {
    g.set(x, FEET + 1, 126, a);
    g.set(x, FEET + 2, 126, b);
    g.set(x, FEET + 3, 126, "shroomlight");
  }
  g.set(12, FEET + 1, 126, "sea_lantern");

  // Lighting: hanging lanterns from the 4F floor (y21), every 8 along two lines beside the lane, clear of the walk
  for (let z = 40; z <= 122; z += 8) {
    g.set(12, 20, z, ...B.lantern(true));
    g.set(17, 20, z, ...B.lantern(true));
  }
  g.set(10, 20, 126, ...B.lantern(true));
  g.set(15, 20, 126, ...B.lantern(true));
}
