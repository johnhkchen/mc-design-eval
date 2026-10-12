// villa-haiku: room: storeroom SE (plan.md ROOMS, air x25..34 z42..46 y2..5; door (25, 2..3, 41) from the peristyle south walkway).
// Storage on the two outer walls: east (x34) and south (z46). Barrel stacks alternate with smooth_quartz crate stacks.
// The lamp takes the far corner (34, 46). The door's way in (25, 42) and the centre of the room stay clear.
import { BARREL, WALL, lamp } from "../vocab.mjs";

const barrel = (g, x, y, z) => g.set(x, y, z, BARREL, { facing: "up" });

export function build(g) {
  // east wall x=34, z42..45: barrel stack, quartz crate stack, barrel stack, single barrel
  barrel(g, 34, 2, 42);
  barrel(g, 34, 3, 42);
  g.fill([34, 2, 43], [34, 3, 43], WALL);
  barrel(g, 34, 2, 44);
  barrel(g, 34, 3, 44);
  barrel(g, 34, 2, 45);

  // south wall z=46, x25..33: the lamp corner at x34 closes the row
  barrel(g, 25, 2, 46);
  barrel(g, 26, 2, 46);
  barrel(g, 26, 3, 46);
  g.fill([27, 2, 46], [27, 3, 46], WALL);
  g.fill([31, 2, 46], [31, 3, 46], WALL);
  barrel(g, 32, 2, 46);
  barrel(g, 32, 3, 46);
  barrel(g, 33, 2, 46);

  // one lamp: a quartz_pillar stub at (34, 2, 46) with a lantern on top
  lamp(g, 34, 46);
  return g;
}
