// Part: room: bedroom 4 (west rear bedroom). Interior box x27..38 x z54..60, floor y11, air y11..16.
// Focal piece: the red bed on the west wall, its head to the wall and its foot toward the room. A chest dresser and a
// barrel nightstand flank it, a small writing table with a chair sits by the rear windows, a rug lies between them.
// The chimney stack (x33..34, z56..57) is built by the roofs part: the cells round it (x32..35, z55..58) stay clear
// so its room-facing hearth reads and can be reached.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // bed: foot at (28,11,55), head at (27,11,55) toward the west wall
  bed(g, [28, 11, 55], "west", "red");

  // y11 furniture, origin (27,11,54): one layer of rows; rows run along +z, columns along +x
  layers(g, [27, 11, 54], {
    n: "barrel",
    C: ["chest", { facing: "east", type: "single" }],
    R: "red_carpet",
    T: "dark_oak_planks",
    S: ["dark_oak_stairs", { facing: "east", half: "bottom", shape: "straight" }],
  }, [
    "n           ", // z54: nightstand barrel by the bed head
    "            ", // z55: the bed (placed above)
    " RRR        ", // z56: rug in front of the bed
    "CRRR        ", // z57: chest dresser against the west wall, rug beside it
    "         TS  ", // z58: writing table (x36) and its chair (x37), clear of the chimney's east face
    "n           ", // z59: barrel shelf under the west window
    "            ", // z60
  ]);

  // y12 things standing on the tops, origin (27,12,54)
  layers(g, [27, 12, 54], {
    c: ["candle", { candles: "2", lit: "true" }],
    f: "flower_pot",
    L: ["lantern", { hanging: "false" }],
  }, [
    "c           ", // z54: lit candles on the nightstand
    "            ",
    "            ",
    "            ",
    "         L  ", // z58: table lamp on the writing table (x36)
    "f           ", // z59: flower pot on the barrel shelf
    "            ",
  ]);

  // ceiling lanterns hang from the plate (y17); room air y16
  g.set(31, 16, 56, "lantern", { hanging: "true" });
  g.set(30, 16, 59, "lantern", { hanging: "true" });
  g.set(28, 16, 54, "lantern", { hanging: "true" });
}
