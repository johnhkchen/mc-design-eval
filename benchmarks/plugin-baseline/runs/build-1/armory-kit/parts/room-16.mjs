// Interior furnisher for "Pavilion D event cafe" (room 16): an upper café and event room in white and light gray.
// The bar is the focal piece at the east end, in line with the stair; two rows of tables with quartz-stair chairs run
// across the floor under hanging lanterns. The stair (x140..141 z99..105) and the aisle from it stay clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const QUARTZ = "smooth_quartz";
const CONCRETE = "light_gray_concrete";
const TABLE_X = [150, 162, 174, 186];
const TABLE_Z = [102, 112];

export function build(g) {
  // tables: an oak fence post with a top slab on it; a standing lantern on each top; chairs north and south of it
  for (const x of TABLE_X) {
    for (const z of TABLE_Z) {
      g.set(x, 8, z, ...B.fence("oak"));
      g.set(x, 9, z, ...B.slab(QUARTZ, "top"));
      g.set(x, 10, z, ...B.lantern(false));
      g.set(x, 8, z - 1, ...B.stairs(QUARTZ, "north"));
      g.set(x, 8, z + 1, ...B.stairs(QUARTZ, "south"));
    }
  }
  // the bar: a quartz counter at x199 with a staff lane at x200 and a light-gray back bar at x201 (3 high)
  g.fill([199, 8, 101], [199, 8, 111], QUARTZ);
  g.fill([201, 8, 101], [201, 10, 111], CONCRETE);
  g.set(199, 9, 103, ...B.lantern(false));
  g.set(199, 9, 109, ...B.lantern(false));
  for (const z of [102, 104, 109, 111]) g.set(197, 8, z, ...B.stairs(QUARTZ, "west"));
  // hanging light: over each table row, the aisle, and the bar
  for (const x of TABLE_X) {
    for (const z of [102, 107, 112]) g.set(x, 13, z, ...B.lantern(true));
  }
  // floor lamps in the corners the hanging rows do not reach (the stair end and the east corners)
  for (const [x, z] of [[139, 116], [144, 98], [203, 116], [203, 99], [139, 108]]) g.set(x, 8, z, ...B.lantern(false));
  g.set(200, 13, 103, ...B.lantern(true));
  g.set(200, 13, 109, ...B.lantern(true));
}
