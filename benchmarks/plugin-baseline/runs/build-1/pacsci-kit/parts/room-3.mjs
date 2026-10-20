// Part "room: planetarium and labs": the interior designer's furnishing of ROOM_BOX.planetarium (x 41..134, y 19..25,
// z 25..58). Focal piece: the planetarium projector at the centre, a glowing sea-lantern globe on an iron-ringed
// pedestal, ringed by stair-seats facing it. Lab benches in two rows to the west, stools on their open side. Light:
// sea lanterns in the ceiling on a 6-cell grid (under the deck at y 26), standing lanterns on the benches.
// The stair joiner's flight (x 41..44, z 25..34) and the doorway lanes stay clear: nothing is built there.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { ROOM_BOX } from "../vocab.mjs";

const FLOOR = 19;
const [, , , x1, , z1] = ROOM_BOX.planetarium;

export function build(g) {
  // Projector: iron ring on the floor, a quartz column in the middle, a 3x3 sea-lantern globe at y 22.
  const cx = 88, cz = 41;
  g.fill([cx - 1, FLOOR, cz - 1], [cx + 1, FLOOR, cz + 1], "iron_block");
  for (let y = FLOOR; y <= FLOOR + 2; y++) g.set(cx, y, cz, ...B.pillar("quartz_pillar", "y"));
  g.fill([cx - 1, FLOOR + 3, cz - 1], [cx + 1, FLOOR + 3, cz + 1], "sea_lantern");

  // Seats: stairs whose full back is away from the projector (facing = the back side), in two rows and two columns.
  for (let x = cx - 3; x <= cx + 3; x++) {
    g.set(x, FLOOR, cz - 3, ...B.stairs("smooth_quartz", "north", "bottom"));
    g.set(x, FLOOR, cz + 3, ...B.stairs("smooth_quartz", "south", "bottom"));
  }
  for (let z = cz - 1; z <= cz + 1; z++) {
    g.set(cx - 3, FLOOR, z, ...B.stairs("smooth_quartz", "west", "bottom"));
    g.set(cx + 3, FLOOR, z, ...B.stairs("smooth_quartz", "east", "bottom"));
  }

  // Lab benches: a light-grey block run, a standing lantern on each bench, stools on the open side.
  const benches = [
    { z: 30, stool: 29, facing: "north" },
    { z: 47, stool: 48, facing: "south" },
  ];
  for (const { z, stool, facing } of benches) {
    g.fill([50, FLOOR, z], [58, FLOOR, z], "light_gray_concrete");
    for (const x of [52, 56]) g.set(x, FLOOR + 1, z, ...B.lantern(false));
    for (const x of [51, 54, 57]) g.set(x, FLOOR, stool, ...B.stairs("smooth_quartz", facing, "bottom"));
  }

  // Ceiling lights: sea lanterns in the ceiling (y 25, under the deck), on a 6-cell grid east of the stair.
  for (let x = 47; x <= x1 - 3; x += 6) {
    for (let z = 28; z <= z1 - 2; z += 6) g.set(x, 25, z, "sea_lantern");
  }
  // Extra ceiling lights for the west wall, which the grid misses: the stair's cells (x 41..44, z 25..34) stay clear.
  for (const [x, z] of [[45, 26], [45, 38], [41, 46], [42, 56]]) g.set(x, 25, z, "sea_lantern");
  // The south row (the wall side of z 58) is out of the grid's reach too: a lamp every 8 along z 57.
  for (let x = 47; x <= x1 - 3; x += 8) g.set(x, 25, 57, "sea_lantern");
}
