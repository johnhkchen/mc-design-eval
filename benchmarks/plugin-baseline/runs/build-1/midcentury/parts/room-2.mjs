// ROOM kitchen (interior designer): galley along the north wall with a breakfast bar on the south side.
// Inner air x=11..15, z=9..13, standing y=2..4. Ways in: gallery at x=16 z=9..10, utility door (10,10) west,
// open to dining along z=14. Walkable lanes: the z=10 aisle (gallery to utility door) and the x=11 and x=15 columns
// (down to the dining opening); the stools and bar leave both ends clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const put = (g, x, y, z, block, state) => g.set(x, y, z, block, state);

export function build(g) {
  // North run (z=9): counter slabs, cooking hob (smoker), sink (cauldron), fridge (iron block) at x=15.
  put(g, 11, 2, 9, ...B.slab("smooth_quartz", "bottom"));
  put(g, 12, 2, 9, "cauldron", {});
  put(g, 13, 2, 9, "smoker", { facing: "south", lit: "false" });
  put(g, 14, 2, 9, ...B.slab("smooth_quartz", "bottom"));
  put(g, 15, 2, 9, "iron_block", {});
  put(g, 15, 3, 9, "iron_block", {});

  // Orange backsplash above the counters (the bold accent) and spruce upper cabinets at y=4.
  for (const x of [11, 12, 13, 14]) put(g, x, 3, 9, "orange_concrete", {});
  for (const x of [11, 12, 13, 14]) put(g, x, 4, 9, ...B.trapdoor("spruce", "south", "top", false));

  // Second counter run (z=11) on the aisle side: barrel storage, quartz worktop, potted cactus, lantern.
  put(g, 11, 2, 11, "barrel", { facing: "up", open: "false" });
  for (const x of [12, 13, 14]) put(g, x, 2, 11, ...B.slab("smooth_quartz", "bottom"));
  put(g, 13, 3, 11, "potted_cactus", {});
  put(g, 11, 3, 11, "lantern", { hanging: "false", waterlogged: "false" });

  // Breakfast bar on the south side (z=13), birch stools on the room side (z=12, facing the bar).
  for (const x of [12, 13, 14]) put(g, x, 2, 13, "spruce_fence", {});
  for (const x of [12, 13, 14]) put(g, x, 3, 13, ...B.slab("spruce", "bottom"));
  for (const x of [12, 13, 14]) put(g, x, 2, 12, ...B.stairs("birch", "south", "bottom"));

  // Light: pendant over the bar (the focal spot) and one over the aisle.
  put(g, 13, 4, 13, "lantern", { hanging: "true", waterlogged: "false" });
  put(g, 12, 4, 10, "lantern", { hanging: "true", waterlogged: "false" });
}
