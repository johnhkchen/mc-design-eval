// Interior designer for "Galleries cafe" (room 29): the café at the south step, inside [263,1,94,294,8,101].
// Focal piece: the glass blossom on the north-east, seen from the garden door. Counter along the west wall (customers
// come in from the east), one block high so its top is a step, not a shelf. Four two-seat tables (fence post + top
// slab) with stair chairs whose backs face outward. Lanterns stand on the table tops, the counter and a lamp post
// in the south-east corner (nothing hangs: the G3 deck is not in this copy). Lanes: the north row (z 94) and the
// garden door column (x 280..283) stay clear.
import { glassBlossom } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // counter: one smooth_quartz block along the west wall, its top a row of standing lanterns
  for (let z = 96; z <= 100; z++) g.set(263, 1, z, "smooth_quartz");
  g.set(263, 2, 96, ...B.lantern(false));
  g.set(263, 2, 100, ...B.lantern(false));

  // tables: oak fence post at y1 with a top slab at y2 (surface y3), two chairs each side
  const tables = [
    { x: 267, z: 96, lamp: true },
    { x: 267, z: 100, lamp: true },
    { x: 276, z: 98, lamp: true },
    { x: 286, z: 100, lamp: true },
  ];
  for (const t of tables) {
    g.set(t.x, 1, t.z, ...B.fence("oak"));
    g.set(t.x, 2, t.z, ...B.slab("smooth_quartz", "top"));
    if (t.lamp) g.set(t.x, 3, t.z, ...B.lantern(false));
  }
  // chairs: stair back faces away from the table
  const chairs = [
    [266, 96, "west"], [268, 96, "east"],
    [266, 100, "west"], [268, 100, "east"],
    [275, 98, "west"], [277, 98, "east"],
    [285, 100, "west"], [287, 100, "east"],
  ];
  for (const [x, z, facing] of chairs) {
    g.set(x, 1, z, ...B.stairs("smooth_sandstone", facing, "bottom"));
  }

  // focal piece: the glass blossom, north-east, in view of the garden door
  glassBlossom(g, { x: 289, z: 95, h: 3, colors: ["red", "yellow"] });

  // lamp post in the south-east corner, lit for the dark end of the room
  g.set(292, 1, 99, ...B.fence("oak"));
  g.set(292, 2, 99, ...B.lantern(false));
}
