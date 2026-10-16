// Part: room: I-house west room (parlour). Inner air x 26..27, y 3..6, z 10..15; door x28 z11 from the hall.
// The stove (lit furnace) on the chimney wall at x26 z12 is the chimneys part's hearth_nook, not built here; its stand x27
// z12 kept clear; table and settee by the west window at z14..15; a barrel dresser at z10; two hanging lanterns (under the
// y7 floor) light the room.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    b: ["barrel", { facing: "up" }],
    f: ["spruce_fence", {}],
    T: ["spruce_slab", { type: "top" }],
    S: ["spruce_stairs", { facing: "east", half: "bottom" }],
    L: ["lantern", { hanging: "true" }],
  };
  // rows run along +x (x26, x27), successive rows along +z (z10..z15); layers from y3 up.
  layers(g, [26, 3, 10], legend, [
    ["b ", "  ", "  ", "  ", "fS", " S"], // y3: floor furnishings
    ["  ", "  ", "  ", "  ", "T ", "  "], // y4: table top
    ["  ", "  ", "  ", "  ", "  ", "  "], // y5
    ["  ", " L", "  ", "  ", "L ", "  "], // y6: hanging lanterns
  ]);
}
