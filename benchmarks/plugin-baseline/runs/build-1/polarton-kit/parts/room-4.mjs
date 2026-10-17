// Part: room: schoolhouse cloakroom (interior designer). Inner air x16..19, y2..4, z10..11 (rooms.json box).
// Layout: the two doorway lanes (x17..18 at z10 and z11) and the west column's headroom (y2..3) stay clear. West column
// x16: a coat-hook rail of spruce fence pegs at y4 (above the head). East column x19: a boot bench of two spruce stairs
// (seats, backs to the east wall) with a standing lantern on the bench's top face at (19,3,10), the focal light.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  s: ["spruce_stairs", { facing: "east", half: "bottom" }],
  f: "spruce_fence",
  L: ["lantern", { hanging: "false" }],
};

export function build(g) {
  // rows run along +z (z10 then z11); columns along +x (x16..19)
  layers(g, [16, 2, 10], LEGEND, [
    ["   f", "   s"],   // y2: boot bench: a seat, and a post that carries the lantern
    ["   L", "    "],   // y3: standing lantern on the post's top (x19 column is not walked)
    ["f   ", "f   "],   // y4: coat pegs, clear of the head
  ]);
}
