// Interior designer for "Galleria cafe" (room 21): a 12 x 2 café nook in the galleria bump, open along both long sides.
// Row z128 (north, the hall side) stays a clear lane with two chairs; row z129 holds the two tables and the counter.
// Focal piece: the white counter at the east end, its sea_lantern and standing lantern facing the openings. The nook
// has no solid wall (every side is a doorway), so nothing hangs on a wall. Lanterns stand on the table tops (top
// slabs on oak fence legs) and light the whole nook (min 10 at the feet).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // origin = the box's (x0, y, z0) corner: rows run along +x (x110..121), successive rows along +z (z128, z129)
  const origin = (y) => [110, y, 128];
  const legend = {
    c: ["smooth_quartz_stairs", { facing: "north" }], // chairs, backs to the hall, seats facing the tables
    f: "oak_fence", // table legs
    t: ["smooth_stone_slab", { type: "top" }], // table tops (top slab: things stand on its top face)
    q: "smooth_quartz", // counter
    l: ["lantern", { hanging: "false" }], // standing lanterns on the tops
    S: "sea_lantern", // counter light, the focal glow
  };
  layers(g, origin(1), legend, [
    ["..c...c.....", "..f...f...qq"],
  ]);
  layers(g, origin(2), legend, [
    ["............", "..t...t...qq"],
  ]);
  layers(g, origin(3), legend, [
    ["............", "..l...l...lS"],
  ]);
}
