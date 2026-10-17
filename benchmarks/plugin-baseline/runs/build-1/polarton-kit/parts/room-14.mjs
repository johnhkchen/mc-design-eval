// Part: room: corn crib bin (interior designer). The bin is one cell wide (x 74) and six deep (z 10..15), floor y 3,
// entered from the hatch at (74, 3..4, 9). The clear column z 10..13 stays open from the hatch; the corn heap fills
// the far end, and a standing lantern on its top lights the bin.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // rows run along +z (one cell wide, so one character per row), layers run up from y 3
  layers(
    g,
    [74, 3, 14],
    {
      h: "hay_block", // corn heap (ears stored as hay: no corn block in the palette)
      L: ["lantern", { hanging: "false" }], // standing on the heap's top, the focal light
    },
    [
      ["h", "h"], // y 3: heap on the floor at z 14..15
      [" ", "h"], // y 4: the heap's top course at z 15
      [" ", "L"], // y 5: the lantern on it
    ],
  );
}
