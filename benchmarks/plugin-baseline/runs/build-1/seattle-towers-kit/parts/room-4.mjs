// Room 4, KOMO E east offices (interior designer): desk rows in four-row groups (chair, desk, chair, lane) along the
// east half, a focal conference table in the middle, filing cabinets on the east wall, hanging lanterns over it all.
// Floor walk level y 8, room air y 8..11, the entry lane from core x60..67 z30..37 stays clear at x 68..73.
// Desk tops are full blocks (no slab under decor), legs are oak fences standing in the walk row.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FLOOR_Y = 8;
const DESK_Y = 9;
const LAMP_Y = 11;

// desk row: legs under the top every 4 blocks, top quartz blocks, the two desks split at x 83..85
const DESK_A = [74, 82];
const DESK_B = [86, 96];
const LEGS = [74, 78, 82, 86, 90, 96];

// four-row groups: chair row z0 (back north), desk row z0+1, chair row z0+2 (back south), lane z0+3
const GROUPS = [8, 12, 16, 30, 34, 38, 42];

export function build(g) {
  const put = (x, y, z, ...b) => g.set(x, y, z, ...b);
  for (const z0 of GROUPS) {
    for (const [a, b] of [DESK_A, DESK_B]) {
      for (let x = a; x <= b; x++) put(x, DESK_Y, z0 + 1, "smooth_quartz");
    }
    for (const x of LEGS) put(x, FLOOR_Y, z0 + 1, ...B.fence("oak"));
    for (const [a, b] of [DESK_A, DESK_B]) {
      for (let x = a + 1; x <= b; x += 2) {
        put(x, FLOOR_Y, z0, ...B.stairs("smooth_quartz", "north"));
        put(x, FLOOR_Y, z0 + 2, ...B.stairs("smooth_quartz", "south"));
      }
    }
  }
  // focal conference table at the room's centre line, chairs on both long sides
  for (let x = 81; x <= 89; x++) put(x, DESK_Y, 25, "smooth_quartz");
  for (const x of [81, 85, 89]) put(x, FLOOR_Y, 25, ...B.fence("oak"));
  for (const x of [82, 84, 86, 88]) {
    put(x, FLOOR_Y, 24, ...B.stairs("smooth_quartz", "north"));
    put(x, FLOOR_Y, 26, ...B.stairs("smooth_quartz", "south"));
  }
  // filing cabinets against the east wall (two columns of light grey, two high)
  for (const z of [9, 10, 36, 37]) {
    put(99, FLOOR_Y, z, "light_gray_concrete");
    put(99, DESK_Y, z, "light_gray_concrete");
  }
  // hanging lanterns from the ceiling, over the lanes and the focal table
  for (const x of [73, 85, 97]) {
    for (const z of [12, 22, 32, 42]) put(x, LAMP_Y, z, ...B.lantern(true));
  }
  return g;
}
