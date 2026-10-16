// P0 west front room: the bed in the west corner (head to the west wall, foot out into the room), a small table by the
// front door with a lantern on it, a chair at the table, and one hanging lantern over the bed's foot. Lit so no cell is dark.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { chair, hanging_lantern } from "../vocab.mjs";

const LEGEND = {
  f: "spruce_fence", // table leg
  s: ["spruce_slab", { type: "top" }], // table top, sits on the fence's 1.5 height
  l: ["lantern", { hanging: "false" }], // lamp standing on the table top
};

export function build(g) {
  // Rows run along +x (x 2..4), successive rows along +z (z 10..12). Layers are y 3, 4, 5.
  layers(g, [2, 3, 10], LEGEND, [
    ["f  ", "   ", "   "], // y 3: table leg at (2,3,10)
    ["s  ", "   ", "   "], // y 4: table top at (2,4,10)
    ["l  ", "   ", "   "], // y 5: lantern on the table at (2,5,10)
  ]);
  chair(g, 3, 3, 10, "west"); // sitter faces the table at x 2
  bed(g, [3, 3, 12], "west", "blue"); // foot (3,3,12), head (2,3,12) against the west wall
  hanging_lantern(g, 3, 6, 11); // hangs from the floor block y 7 over the room's middle
}
