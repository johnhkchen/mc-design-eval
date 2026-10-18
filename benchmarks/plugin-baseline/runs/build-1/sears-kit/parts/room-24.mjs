// Room "P3 dining room" (interior designer's part): inner air x58..60, y2..4, z14..17 (plan.md FLOORS, rooms.json).
// Layout: the dining table is the focal piece, on the middle column x59 with a chair at each end (north and south).
// The east column x60 holds a barrel dresser at z14..15 and stays clear at z16..17, and the west column x58 is the
// lane from the cased opening (x57) and round to the kitchen door (59,18), so every cell stays reachable.
// Light: one lantern hangs over the table (the focal piece sits in the brightest light), one over the west lane.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // legend: one character per block; '.' is left as it is (free floor)
  const legend = {
    c: ["oak_stairs", { facing: "north", half: "bottom" }], // chair north of the table, back to the north wall
    s: ["oak_stairs", { facing: "south", half: "bottom" }], // chair south of the table, back to the south
    f: "oak_fence", // table leg (the post)
    t: ["oak_slab", { type: "top" }], // table top, sits on the post at y3
    k: "barrel", // dresser on the east wall
    p: "potted_poppy", // on the dresser's top face
    L: ["lantern", { hanging: "true" }], // hangs from the upper floor's block at y5
  };
  layers(g, [58, 2, 14], legend, [
    // y2: floor layer of the furniture (rows z14..17, columns x58..60)
    [".ck", ".fk", ".s.", "..."],
    // y3: table top and the pot on the dresser
    ["..p", ".t.", "...", "..."],
    // y4: lanterns (rows z14..17)
    ["...", ".L.", "L..", "..."],
  ]);
}
