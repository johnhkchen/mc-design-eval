// Room 11: primary bedroom, inner air [3,6,19,11,8,24]. Plush and grey: a king bed (two light grey beds, headboard on the
// west wall) with barrel nightstands and lanterns, a light grey rug, a sitting area (smooth quartz stair seats facing a
// black TV panel on the east wall), a barrel dresser under the back windows. Hall door (9,6..7,18), closet door (12,6..7,22):
// both kept clear, with a 2-high path from each door to the bed.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hangLamp } from "../vocab.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);
const rect = ([x0, z0], [x1, z1], fn) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) fn(x, z);
};

// Bed: head on the west (x3), foot east (x4). Facing = direction from foot to head.
function bedAt(g, x, z, colour) {
  put(g, x, 6, z, [`${colour}_bed`, { facing: "west", part: "head", occupied: "false" }]);
  put(g, x + 1, 6, z, [`${colour}_bed`, { facing: "west", part: "foot", occupied: "false" }]);
}

export function build(g) {
  // King bed on the west wall: two 1x2 light grey beds side by side (z20 and z21), headboard at x3.
  bedAt(g, 3, 20, "light_gray");
  bedAt(g, 3, 21, "light_gray");

  // Nightstands flank the headboard: barrel tables with a standing lantern each (the bedside lamps).
  for (const z of [19, 22]) {
    put(g, 3, 6, z, B.block("barrel"));
    put(g, 3, 7, z, B.lantern(false));
  }

  // Plant in the south-west corner.
  put(g, 3, 6, 24, B.block("potted_fern"));

  // Light grey rug at the foot of the bed and under the sitting area (the sofa and coffee table sit on the gaps).
  rect([5, 19], [6, 23], (x, z) => put(g, x, 6, z, B.block("light_gray_carpet")));
  rect([9, 19], [10, 23], (x, z) => {
    if (!(x === 10 && z === 21)) put(g, x, 6, z, B.block("light_gray_carpet"));
  });

  // Sitting area: a three-seat sofa of smooth quartz stairs facing east (back on the west), its backrest at x7,
  // a dark oak slab coffee table at (10,6,21) and the TV panel on the east wall (black concrete 3 wide x 2 high).
  for (const z of [20, 21, 22]) {
    put(g, 8, 6, z, B.stairs("smooth_quartz", "east", "bottom", "straight"));
    put(g, 7, 6, z, B.block("smooth_quartz"));
  }
  put(g, 10, 6, 21, B.slab("dark_oak", "bottom"));
  rect([11, 19], [11, 21], (x, z) => {
    put(g, x, 6, z, B.block("black_concrete"));
    put(g, x, 7, z, B.block("black_concrete"));
  });

  // Dresser: two barrels under the back windows' side, a lantern standing on the east one.
  put(g, 7, 6, 24, B.block("barrel"));
  put(g, 8, 6, 24, B.block("barrel"));
  put(g, 8, 7, 24, B.lantern(false));

  // Ceiling lanterns (chain at y8, hanging lantern at y7): one over the rug, one over the TV side.
  hangLamp(g, 6, 8, 21);
  hangLamp(g, 10, 8, 23);
}
