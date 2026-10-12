// Room 6: interior designer, mudroom [26,2,19,28,4,24]. A 3x6 drop zone off the garage. Entries: kitchen (25,2..3,21),
// garage (29,2..3,22), yard (27,2..3,25). Layout: a birch bench along the north wall (z19) under a hanging lantern and
// chain hooks (the focal piece); barrel cubbies and a potted fern on the east side; washer (cauldron) and dryer (smoker)
// in the SW corner. The 2-high path runs x27 z21..24 and (26,21), (28,22) so every door reaches the bench and washer.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);

export function build(g) {
  // Bench: three birch stairs as seats, high side to the north (the wall at its back), open to the room.
  for (let x = 26; x <= 28; x++) put(g, x, 2, 19, B.stairs("birch", "north", "bottom"));

  // Coat hooks: iron chains hanging from the ceiling over the bench; the centre chain carries the lantern.
  for (const x of [26, 28]) put(g, x, 4, 19, B.chain("y"));
  put(g, 27, 4, 19, B.chain("y"));
  put(g, 27, 3, 19, B.lantern(true));

  // Barrel cubbies on the east side (opening west into the room), a lantern and a potted fern on top.
  put(g, 28, 2, 20, ["barrel", { facing: "west", open: "false" }]);
  put(g, 28, 3, 20, ["barrel", { facing: "west", open: "false" }]);
  put(g, 28, 4, 20, B.lantern(false));
  put(g, 28, 2, 21, ["barrel", { facing: "west", open: "false" }]);
  put(g, 28, 3, 21, B.block("potted_fern"));

  // Laundry corner SW: washer (water cauldron) at the wall, dryer (smoker) beside it, both facing the room.
  put(g, 26, 2, 23, ["water_cauldron", { level: "3" }]);
  put(g, 26, 2, 24, ["smoker", { facing: "east", lit: "false" }]);
}
