// Part "room: E wing upper halls": the interior designer's furniture and lamps inside ROOM_BOX.e_upper
// (x 61..130, y 11..17, z 77..158). Quiet gallery: one display table at the centre (the focal piece, its lanterns
// standing on it), chairs of smooth_quartz_stairs around it, two reading tables, benches on the south side, and
// a grid of hanging lanterns from the deck at y 18. The stair joiner's flight at x 128..130 z 77..90 is left alone.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FLOOR = 11; // walk y of the room (floor block y 10)

// A seat: a smooth_quartz_stairs on the floor, its full-height back on the side away from the table.
function chair(g, x, z, facing) {
  g.set(x, FLOOR, z, ...B.stairs("smooth_quartz", facing, "bottom"));
}

// A two-by-two reading table: quartz pillar legs at y 11, a solid smooth_quartz top at y 12.
function readingTable(g, x, z) {
  g.fill([x, FLOOR, z], [x + 1, FLOOR, z + 1], "quartz_pillar");
  g.fill([x, FLOOR + 1, z], [x + 1, FLOOR + 1, z + 1], "smooth_quartz");
}

export function build(g) {
  // Focal piece: the display table at the room's centre, 4 x 6, two blocks high, a standing lantern on each end.
  g.fill([94, FLOOR, 116], [97, FLOOR, 121], "quartz_pillar");
  g.fill([94, FLOOR + 1, 116], [97, FLOOR + 1, 121], "smooth_quartz");
  g.set(94, FLOOR + 2, 116, ...B.lantern(false));
  g.set(97, FLOOR + 2, 121, ...B.lantern(false));

  // Eight chairs round the focal table: two each side.
  chair(g, 93, 117, "west");
  chair(g, 93, 120, "west");
  chair(g, 98, 117, "east");
  chair(g, 98, 120, "east");
  chair(g, 95, 115, "north");
  chair(g, 96, 115, "north");
  chair(g, 95, 122, "south");
  chair(g, 96, 122, "south");

  // Two reading tables in the north half, a chair each side of each.
  readingTable(g, 76, 84);
  chair(g, 75, 84, "west");
  chair(g, 75, 85, "west");
  chair(g, 78, 84, "east");
  chair(g, 78, 85, "east");
  g.set(76, FLOOR + 2, 84, ...B.lantern(false));

  readingTable(g, 110, 84);
  chair(g, 109, 84, "west");
  chair(g, 109, 85, "west");
  chair(g, 112, 84, "east");
  chair(g, 112, 85, "east");
  g.set(110, FLOOR + 2, 84, ...B.lantern(false));

  // Benches along the south side, seats facing north, backs to the south wall run.
  for (let x = 70; x <= 76; x++) chair(g, x, 147, "south");
  for (let x = 103; x <= 109; x++) chair(g, x, 147, "south");

  // Hanging lanterns from the deck at y 18: a grid 8 apart, so no floor cell is dark.
  for (const x of [65, 73, 81, 89, 97, 105, 113, 121]) {
    for (const z of [81, 89, 97, 105, 113, 121, 129, 137, 145, 153]) {
      g.set(x, FLOOR + 6, z, ...B.lantern(true));
    }
  }
}
