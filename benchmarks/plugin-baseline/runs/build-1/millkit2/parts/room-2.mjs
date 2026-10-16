// Part: room: Dogtrot east pen (bedroom). Inner air x 8..9, y 3..6, z 10..14; door x7 z12 from the breezeway.
// Layout: bed against the north wall (head z10, foot z11, facing north) as the focal piece, the chest dresser on the
// east wall at z13 with a lit candle on top, one hanging lantern under the tie beam at y7. The lane x8 z10..14 stays clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bed_set } from "../vocab.mjs";

export function build(g) {
  // Bed: foot x9 z11, head x9 z10 (pillow end), head against the north wall.
  bed_set(g, [9, 3, 11], "north", "red");

  // Dresser, candle and lantern, drawn as layers: rows run along +x (x8, x9), successive rows along +z (z10..z14).
  // The tie beam at y7 is not built yet (roof part), so the lantern stands on the dresser top instead of hanging from air.
  // Chest and candle are off the palette: the dresser is a barrel (top face for the lantern).
  const legend = {
    B: ["barrel", { facing: "up" }],
    L: ["lantern", { hanging: "false" }],
  };
  layers(g, [8, 3, 10], legend, [
    // y 3: barrel dresser on the floor against the east wall
    ["  ", "  ", "  ", " B", "  "],
    // y 4: lantern standing on the barrel top
    ["  ", "  ", "  ", " L", "  "],
  ]);
}
