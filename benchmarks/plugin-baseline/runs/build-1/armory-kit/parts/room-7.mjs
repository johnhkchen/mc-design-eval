// Interior designer for "South glass hall" (room 7): the Armory's south hall behind the curtain wall. Café tables in
// rows down the hall (oak fence pedestal, quartz slab top, stair chairs facing the table), a window bench of stairs
// along the glass (facing the Space Needle), and lamp posts (fence + lantern) between the rows for light.
// Inside the box x2..121, y1..27, z132..142 only; the lanes between the rows are 1 wide and the vestibule lane at
// x9..111 is kept open to the north.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const TABLE_Z = 136;
const TABLE_X = [12, 20, 28, 36, 44, 52, 60, 68, 76, 84, 92, 100, 108];
const LAMP_ROWS = [133, 139];

export function build(g) {
  // café tables: an oak fence pedestal at y1, a quartz slab top at y2 (its top face is at the fence's top)
  for (const x of TABLE_X) {
    g.set(x, 1, TABLE_Z, "oak_fence");
    g.set(x, 2, TABLE_Z, ...B.slab("smooth_quartz", "bottom"));
    // two chairs: north of the table facing south (back to the north), south of it facing north
    g.set(x, 1, TABLE_Z - 1, ...B.stairs("polished_andesite", "north", "bottom"));
    g.set(x, 1, TABLE_Z + 1, ...B.stairs("polished_andesite", "south", "bottom"));
  }
  // window bench along the glass: stairs facing north (back to the north, seat facing the view); gaps every 12 keep
  // the lanes from the vestibule open
  for (let x = 10; x <= 110; x++) {
    if ((x - 10) % 12 >= 9) continue;
    g.set(x, 1, 141, ...B.stairs("polished_andesite", "north", "bottom"));
  }
  // lamp posts between the rows: a fence post at y1 and y2, a standing lantern on top at y3. The shell's solid masonry
  // fills the row at z 133 east of x 103, so a post whose column is not all air is left out, not written over.
  for (const z of LAMP_ROWS) {
    for (const x of TABLE_X) {
      const lx = x + 4;
      if (![1, 2, 3].every((y) => g.isAir(lx, y, z))) continue;
      g.set(lx, 1, z, "oak_fence");
      g.set(lx, 2, z, "oak_fence");
      g.set(lx, 3, z, ...B.lantern(false));
    }
  }
}
