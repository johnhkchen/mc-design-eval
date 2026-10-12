// room: Primary bedroom (plan ROOMS, E38): a calm suite in warm neutrals. Inner air x34..42, y6..8, z13..21.
// King bed on the east wall (two white beds side by side, heads at x42) under a chain-hung lantern; nightstands with
// bedside lanterns; a dresser run of barrels on the north and west walls; a sitting area by the shuttered front windows
// (stair seats round a slab table, a standing lamp); a brown rug; a hanging lantern over the table. Every way in (double
// door x33 z16..17, closet x36 and bath x40 on z22) keeps a 2-high clear path to the bed and to the sitting area.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const put = (x, y, z, block, state = {}) => g.set(x, y, z, block, state);
  const barrel = (x, y, z) => put(x, y, z, "barrel", { facing: "up", open: "false" });
  const lantern = (x, y, z, hanging = false) => put(x, y, z, ...B.lantern(hanging));
  const chain = (x, y, z) => put(x, y, z, ...B.chain("y"));
  const bedCell = (x, z, part) => put(x, 6, z, "white_bed", { facing: "east", part, occupied: "false" });

  // king bed: headboard on the east wall, feet toward the room; each white bed is 2 long (x41 foot, x42 head)
  for (const z of [16, 17]) {
    bedCell(41, z, "foot");
    bedCell(42, z, "head");
  }
  // chandelier-style hanging lantern over the bed: a chain from the ceiling, the lantern below it
  chain(41, 8, 16);
  lantern(41, 7, 16, true);

  // nightstands with bedside lanterns (a lantern stands on the barrel)
  for (const z of [15, 18]) {
    barrel(42, 6, z);
    lantern(42, 7, z);
  }

  // dresser run on the north wall (between the windows) and the west wall (beside the closet path)
  for (const x of [37, 38, 39]) barrel(x, 6, 13);
  lantern(37, 7, 13);
  put(38, 7, 13, "potted_azalea_bush");
  barrel(34, 6, 19);
  barrel(34, 6, 20);
  put(34, 7, 19, "potted_fern");

  // sitting area by the shuttered front windows: stair seats round a low slab table, a standing lamp by the window
  put(34, 6, 14, ...B.stairs("dark_oak", "south"));
  put(35, 6, 14, ...B.stairs("dark_oak", "south"));
  put(36, 6, 15, ...B.stairs("dark_oak", "west"));
  put(35, 6, 15, ...B.slab("dark_oak", "bottom"));
  lantern(34, 6, 13);
  put(36, 6, 13, "potted_fern");
  chain(35, 8, 15);
  lantern(35, 7, 15, true);

  // soft rug between the sitting area and the bed (carpet is walkable; the door route at z16..17 stays clear)
  for (let x = 36; x <= 39; x++)
    for (let z = 16; z <= 19; z++) put(x, 6, z, "brown_carpet");
}
