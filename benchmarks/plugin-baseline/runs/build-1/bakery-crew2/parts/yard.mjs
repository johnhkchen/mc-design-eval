// Part 5: yard and street furniture. The yard ground (grass with podzol flecks, coarse dirt round the trees and the
// wheat), the rear and side fences with their gates, the bench on the west side, the woodpile for the oven, the wheat
// patch, two small spruces, the prop yard by the oven, and the dirt paths from the back door and the wing door to the
// gates. Writes only into air above the ground row, and into the ground row (y=0) which part 1 leaves as grass.
import {
  scatterBlend, yardFence, benchRun, woodpile, wheatPatch, smallSpruce, propCluster,
} from "../vocab.mjs";

// Coarse dirt in a 3x3 round a tree's foot, so the roots sit in bare soil and not in the lawn.
function treeFoot(g, x, z) {
  g.fill([x - 1, 0, z - 1], [x + 1, 0, z + 1], "coarse_dirt");
}
// A lamp post: a spruce fence at y=1 with a standing lantern on its head (y=2).
function lampPost(g, x, z) {
  g.set(x, 1, z, "spruce_fence", {});
  g.set(x, 2, z, "lantern", { hanging: false });
}

export function build(g) {
  // Ground: grass across the back yard and both side strips, podzol flecks (about one cell in eight).
  scatterBlend(g, 0, 23, 0, 23, 31, "grass_block", "podzol", 0.12);
  scatterBlend(g, 0, 5, 0, 10, 22, "grass_block", "podzol", 0.12);
  scatterBlend(g, 22, 23, 0, 10, 22, "grass_block", "podzol", 0.12);

  // Paths: from the back door (8,2,22) south to the yard fence, from the wing side door (21,2,17) east, and from the
  // west gate (1,1,20) up along the lot edge to the sidewalk.
  g.fill([8, 0, 23], [8, 0, 30], "dirt_path");
  g.fill([22, 0, 17], [23, 0, 17], "dirt_path");
  g.fill([0, 0, 8], [0, 0, 20], "dirt_path");

  // Fences: west (x=1) and east (x=23) runs along z 10..30, the back run along z=30; the gates sit in the west and east
  // runs at (1,20) and (23,16) and swing across the line.
  yardFence(g, [[1, 10, 1, 30], [23, 10, 23, 30], [1, 30, 23, 30]], {
    y: 1,
    gates: [[1, 20, "east"], [23, 16, "east"]],
  });

  // Lamps for the paths and courts: a post at each street corner on the kerb line, and lanterns on the west and back
  // fence lines. Without them the light report left 64 dark cells on the walking surface.
  lampPost(g, 1, 3);
  lampPost(g, 22, 3);
  g.set(1, 2, 14, "lantern", { hanging: false });
  g.set(6, 2, 30, "lantern", { hanging: false });
  g.set(18, 2, 30, "lantern", { hanging: false });

  // Bench against the west fence, facing the street.
  benchRun(g, 2, 4, 10, 1, "north");

  // Oven fuel: the woodpile by the back path, its lid of spruce slab on top.
  woodpile(g, 7, 10, 24, 25, 1);

  // Wheat patch on farmland, west of the back path, with a coarse dirt border on the ground row.
  wheatPatch(g, 2, 5, 24, 28, { ground: true, y: 0 });

  // Two small spruces at the west and south-west of the yard; coarse dirt at each foot.
  treeFoot(g, 2, 15);
  smallSpruce(g, 2, 15, 9);
  treeFoot(g, 3, 29);
  smallSpruce(g, 3, 29, 8);

  // Prop yard by the bakehouse: barrels, hay, composter, grindstone.
  propCluster(g, 12, 24, 1);
}
