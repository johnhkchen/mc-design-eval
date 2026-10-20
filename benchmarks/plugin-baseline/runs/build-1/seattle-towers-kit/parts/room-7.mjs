// Room 7 (KOMO E south wing offices, production offices): interior furnisher + lamplighter.
// Inner air x 58..101, z 50..113, walking surface y 13. Furniture uses palette blocks only: fence-post legs, top
// slabs for desk and table tops, quartz stairs as chairs (facing = the back, away from the desk), standing and hanging
// lanterns. The stair joiner's flight (x 59..63, z 51, y 13..17) and its foot and head stay clear.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// one desk pod: two-cell top along x at (x0..x0+1, z), fence legs at the ends, a chair north and south of it
function pod(g, x0, z) {
  for (const x of [x0, x0 + 1]) g.set(x, 14, z, ...B.slab("oak", "top"));
  g.set(x0, 13, z, ...B.fence("oak"));
  g.set(x0 + 1, 13, z, ...B.fence("oak"));
  g.set(x0, 15, z, ...B.lantern(false));
  g.set(x0 + 1, 13, z - 1, ...B.stairs("smooth_quartz", "north", "bottom"));
  g.set(x0, 13, z + 1, ...B.stairs("smooth_quartz", "south", "bottom"));
}

export function build(g) {
  // focal production table: a 5 x 13 top of quartz slabs on fence legs, down the middle of the room
  const [tx0, tx1, tz0, tz1] = [78, 82, 76, 88];
  for (let x = tx0; x <= tx1; x++) for (let z = tz0; z <= tz1; z++) g.set(x, 14, z, ...B.slab("smooth_quartz", "top"));
  for (const x of [tx0, 80, tx1]) for (const z of [tz0, 80, 84, tz1]) g.set(x, 13, z, ...B.fence("oak"));
  g.set(80, 15, 78, ...B.lantern(false));
  g.set(80, 15, 86, ...B.lantern(false));
  for (const x of [79, 81]) {
    g.set(x, 13, tz0 - 1, ...B.stairs("smooth_quartz", "north", "bottom"));
    g.set(x, 13, tz1 + 1, ...B.stairs("smooth_quartz", "south", "bottom"));
  }
  for (const z of [79, 83]) {
    g.set(tx0 - 1, 13, z, ...B.stairs("smooth_quartz", "west", "bottom"));
    g.set(tx1 + 1, 13, z, ...B.stairs("smooth_quartz", "east", "bottom"));
  }
  // desk pods along the rows, clear of the stair corner (x 57..65, z 49..55)
  for (const [x0, z] of [[68, 58], [92, 58], [68, 104], [92, 104], [61, 92], [98, 92]]) pod(g, x0, z);
  // lamp grid: hanging lanterns from the floor above, one every 8 blocks (every floor cell reads 4 or more)
  for (const x of [62, 70, 78, 86, 94]) for (const z of [54, 62, 70, 78, 86, 94, 102, 110]) {
    if (x >= 76 && x <= 84 && z >= 74 && z <= 90) continue;   // the focal table's own light stands above
    g.set(x, 16, z, ...B.lantern(true));
  }
}
