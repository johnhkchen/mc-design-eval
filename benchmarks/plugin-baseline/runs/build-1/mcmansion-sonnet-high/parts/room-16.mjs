// room: Bedroom 4 (plan ROOMS): oak_planks, green hobby/guest room. Inner air x13..18, y6..8, z19..22.
// Door (19,6..7,20) on the east wall; windows S (14..16,7..8,23) and W (12,7..8,21..22).
// Layout: bed on the west wall (head north, foot z20); bedside fern on a fence; bookshelves in the north-east corner;
// a fence-and-slab desk under the south window with a stair chair; a moss-carpet rug; a barrel by the door corner;
// two hanging lanterns (over the bed and the desk) so the room is lit at night. Walk path: row z20 from the door.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);
const block = (name) => [name, {}];

export function build(g) {
  // bed: head against the north wall, foot toward the room (facing = foot -> head)
  put(g, 13, 6, 19, ["white_bed", { facing: "north", part: "head", occupied: "false" }]);
  put(g, 13, 6, 20, ["white_bed", { facing: "north", part: "foot", occupied: "false" }]);
  // bedside table: fence post with a potted fern on top
  put(g, 14, 6, 19, B.fence("oak"));
  put(g, 14, 7, 19, block("potted_fern"));

  // north-east bookshelves (2 high), clear of the door cell (18,6..7,20)
  for (const y of [6, 7]) for (const x of [17, 18]) put(g, x, y, 19, block("bookshelf"));

  // desk under the south window: fence legs, oak slab top; chair (stair) facing the desk
  for (const x of [14, 15, 16]) {
    put(g, x, 6, 22, B.fence("oak"));
    put(g, x, 7, 22, B.slab("oak", "bottom"));
  }
  put(g, 15, 6, 21, B.stairs("oak", "south", "bottom"));

  // green rug (moss carpet) between bed and door, off the walking row
  for (const x of [16, 17]) for (const z of [20, 21]) put(g, x, 6, z, block("moss_carpet"));

  // storage barrel in the south-east corner
  put(g, 18, 6, 22, ["barrel", { facing: "up", open: "false" }]);

  // light: two hanging lanterns from the ceiling (bed side, desk side)
  put(g, 14, 8, 20, B.lantern(true));
  put(g, 17, 8, 22, B.lantern(true));
}
