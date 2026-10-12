// ROOM gallery (interior designer): the entrance hall inside the box [16,2,10,22,4,10]. The box is one cell deep (z=10),
// so the whole room is the walking line from the front door (19,9) to the kitchen opening (x=16) and the corridor
// opening (x=22). Nothing solid may stand on that line: the bench is bottom slabs (walkable), the light is hung.
// The lantern hangs over the bench (the focal spot). Item frames are entities, not blocks, so the north-wall art is left out.
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    b: B.slab("birch", "bottom"), // low birch bench, seat cells x=17..18 (walkable)
    L: B.lantern(true), // hung lantern over the bench, on the ceiling at y=5
  };
  // origin [16,2,10]; x runs 16..22 along the row, y=2 (feet), y=3 (head), y=4 (hung light)
  layers(g, [16, 2, 10], legend, [
    [".bb...."], // y=2: bench seat
    ["......."], // y=3: headroom kept clear
    ["..L...."], // y=4: lantern at x=18 over the bench
  ]);
}
