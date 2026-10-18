// Room "P5 attic north bedroom" (interior designer's part): x84..91, z15..17, feet y6 (floor block y5).
// Two beds on the west gable wall (heads at x84, against x83), a brown rug between them and the door, a barrel dresser
// with a potted poppy on the north wall, a chest by the doorway side, and two standing lanterns on fence posts for the
// night light. Door lane: x91 z15..17 and the row z16 stay clear. Dormer cheeks may sit at x85..87 and x89..91 y7..8,
// so nothing at y7 is placed there.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const NO_CONNECT = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };

export function build(g) {
  // the beds: foot at x85, head one step west at x84, against the gable wall x83
  bed(g, [85, 6, 15], "west", "red");
  bed(g, [85, 6, 17], "west", "blue");

  // the furniture by height, drawn over the room's footprint (x84..91 across, z15..17 down)
  const legend = {
    r: "brown_carpet",
    b: "barrel",
    c: ["chest", { facing: "south", type: "single", waterlogged: "false" }],
    p: ["oak_fence", NO_CONNECT],
    f: ["spruce_fence", NO_CONNECT],
    q: "potted_poppy",
    l: ["lantern", { hanging: "false", waterlogged: "false" }],
  };
  layers(g, [84, 6, 15], legend, [
    [
      "  rrb c ",   // z15: carpet, barrel dresser on the north wall, chest beside the door lane
      "p  rr   ",   // z16: post for the west lantern, carpet, the lane
      "  rr  f ",   // z17: carpet, post for the east lantern (x90, clear of the x87..89 chimney)
    ],
    [
      "    q   ",    // y7: pot on the barrel
      "l       ",    // y7: west lantern on its post
      "      l ",    // y7: east lantern on its post (x90)
    ],
  ]);
}
