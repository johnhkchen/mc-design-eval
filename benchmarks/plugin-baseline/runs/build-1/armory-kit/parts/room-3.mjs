// Interior designer for "Armory classrooms 3F" (room 3): four rows of classroom desks facing a black board on the
// south wall (teacher's table in front of it), and a theatre green room in the north-east corner (vanity counter,
// seats, prop cabinets). Hanging lanterns from the 4F floor light the room; the F3 stair cells stay clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FLOOR = 15; // the air cell just above the 3F floor block (y 14)
const TOP = 16; // desk and counter tops sit on a fence post in FLOOR, a top slab in this cell
const LAMP_Y = 19; // hanging lanterns, chained from the 4F floor at y 21

// classroom rows: [seat z, desk z]; students sit north of their desk and face the board (south)
const ROWS = [[11, 12], [14, 15], [17, 18], [20, 21]];
const TABLES = [20, 28, 36, 44, 52, 60, 68, 76];

export function build(g) {
  // black board on the south wall, quartz frame, chalk ledge
  g.fill([36, 16, 33], [66, 18, 33], "black_concrete");
  g.fill([35, 19, 33], [67, 19, 33], "smooth_quartz");
  g.fill([35, 16, 33], [35, 18, 33], "smooth_quartz");
  g.fill([67, 16, 33], [67, 18, 33], "smooth_quartz");
  g.fill([36, FLOOR, 32], [66, FLOOR, 32], ...B.slab("smooth_quartz", "bottom"));

  // teacher's table in front of the board
  for (const x of [49, 50, 51]) {
    g.set(x, FLOOR, 29, ...B.fence("oak"));
    g.set(x, TOP, 29, ...B.slab("smooth_quartz", "top"));
  }

  // student desks: three posts and a top slab per table, two seats each
  for (const [zs, zd] of ROWS) {
    for (const x0 of TABLES) {
      for (const x of [x0, x0 + 2, x0 + 4]) g.set(x, FLOOR, zd, ...B.fence("oak"));
      for (let x = x0; x <= x0 + 4; x++) g.set(x, TOP, zd, ...B.slab("smooth_quartz", "top"));
      g.set(x0 + 1, FLOOR, zs, ...B.stairs("smooth_sandstone", "north", "bottom"));
      g.set(x0 + 3, FLOOR, zs, ...B.stairs("smooth_sandstone", "north", "bottom"));
    }
  }

  // theatre green room, north-east: vanity counter along z 8, two seats facing it
  for (let x = 86; x <= 94; x++) {
    g.set(x, FLOOR, 8, ...B.fence("oak"));
    g.set(x, TOP, 8, ...B.slab("smooth_quartz", "top"));
  }
  g.set(88, FLOOR, 10, ...B.stairs("polished_andesite", "south", "bottom"));
  g.set(92, FLOOR, 10, ...B.stairs("polished_andesite", "south", "bottom"));

  // prop cabinets against the east wall and the west wall, with a top slab for a shelf
  g.fill([104, FLOOR, 9], [104, TOP, 13], "smooth_stone");
  g.fill([104, TOP + 1, 9], [104, TOP + 1, 13], ...B.slab("smooth_stone", "top"));
  g.fill([2, FLOOR, 24], [2, TOP, 30], "smooth_quartz");
  g.fill([2, TOP + 1, 24], [2, TOP + 1, 30], ...B.slab("smooth_quartz", "top"));

  // hanging lanterns on chains from the 4F floor, spaced so no floor cell goes dark
  for (const x of [12, 20, 28, 36, 44, 52, 60, 68, 76, 84, 92, 100]) {
    for (const z of [10, 18, 26, 31]) {
      g.set(x, LAMP_Y + 1, z, ...B.chain("y", false));
      g.set(x, LAMP_Y, z, ...B.lantern(true));
    }
  }
}
