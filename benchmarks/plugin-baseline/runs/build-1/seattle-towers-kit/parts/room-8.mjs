// Room 8, KOMO W bow lobby (interior designer): a reception counter facing the north door as the focal piece, four
// waiting groups (oak table on a fence post, quartz-stair chairs round it), two planters in the corners, hanging
// lanterns on the centre line and over the counter. Inside the box [112,1,16,142,6,49] only; the core stair at x124..125
// z37 is left alone and its cells kept clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { planter } from "../vocab.mjs";

// one oak table (fence post + top slab) with chairs (quartz stairs, backs turned away from the table)
function waitingGroup(g, x, z) {
  g.set(x, 1, z, ...B.fence("oak"));
  g.set(x, 2, z, ...B.slab("oak", "top"));
  g.set(x - 1, 1, z, ...B.stairs("smooth_quartz", "west"));
  g.set(x + 1, 1, z, ...B.stairs("smooth_quartz", "east"));
  g.set(x, 1, z - 1, ...B.stairs("smooth_quartz", "north"));
  g.set(x, 1, z + 1, ...B.stairs("smooth_quartz", "south"));
}

export function build(g) {
  // focal piece: reception counter across the room, a one-block quartz counter facing the north door (no top slab:
  // the walk tool read a slab top as an unreachable floor)
  for (let x = 121; x <= 132; x++) {
    g.set(x, 1, 20, "smooth_quartz");
  }

  // waiting groups, in the lanes either side of the centre line
  waitingGroup(g, 117, 29);
  waitingGroup(g, 117, 39);
  waitingGroup(g, 137, 29);
  waitingGroup(g, 137, 39);

  // planters in the corners, kerb and moss with azaleas (the helper keeps to air)
  planter(g, [113, 1, 17, 115, 2, 19]);
  planter(g, [138, 1, 17, 140, 2, 19]);
  planter(g, [113, 1, 45, 115, 2, 47]);
  planter(g, [138, 1, 45, 140, 2, 47]);

  // hanging lanterns from the ceiling: over the counter, then down the centre line
  // corners and side aisles are dark in the first light map, so lanterns also hang over them
  for (const [x, z] of [[124, 18], [130, 18], [124, 33], [130, 33], [124, 45], [116, 24], [116, 36], [136, 24], [136, 36], [116, 44], [136, 44]]) {
    g.set(x, 6, z, ...B.lantern(true));
  }
}
