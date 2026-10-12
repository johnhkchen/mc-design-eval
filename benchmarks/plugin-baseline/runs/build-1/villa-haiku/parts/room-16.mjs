// villa-haiku: room 16, storeroom E (x24..34, z22..25, inner air y2..5). The door (25, 2..3, 26) opens from the peristyle north walkway onto (25, 2, 25).
// Mirror of storeroom W: barrel stacks along the back wall (z=22), a focal stack in the middle of it, smooth_quartz crates on the side walls, one lamp by the door.
// The floor between the door and the back wall (z23..25, x25..34) stays clear: a 2-high path from the door to every stack.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BARREL, WALL, lamp, pot } from "../vocab.mjs";

export function build(g) {
  // back wall (z=22): barrel stacks two high, x24..25 and x32..34
  for (const [x0, x1] of [[24, 25], [32, 34]]) g.fill([x0, 2, 22], [x1, 3, 22], BARREL, { facing: "up" });

  // focal piece (z=22, x28..30): a three-wide barrel stack capped with a smooth_quartz slab shelf
  g.fill([28, 2, 22], [30, 3, 22], BARREL, { facing: "up" });
  for (let x = 28; x <= 30; x++) g.set(x, 4, 22, ...B.slab("smooth_quartz", "bottom"));

  // smooth_quartz crates beside the focal stack and at the room's east end
  g.set(27, 2, 22, WALL);
  g.set(31, 2, 22, WALL);
  g.set(34, 2, 24, WALL);
  g.set(34, 2, 25, WALL);

  // a potted fern in the gap between the west stack and the focal stack
  pot(g, 26, 22, "fern");

  // a smooth_quartz crate on the west wall, and the one lamp beside the door cell (25, 2, 25)
  g.set(24, 2, 24, WALL);
  lamp(g, 24, 25);

  return g;
}
