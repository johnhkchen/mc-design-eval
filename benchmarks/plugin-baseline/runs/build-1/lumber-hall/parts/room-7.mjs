// Room: Pocket B1 (interior designer's part): keeper pocket on the south row, lit, ladder to hatch (15,12,21).
// Box x14..16, y5..11, z20..21. The ladder (15, y5..11, z21) is the shell's, locked; its lane (15, y5..6, z20) stays clear.
// Layout: a two-barrel stock by the ladder, a stool and a slab desk with a lit candle as the focal piece, one
// hanging lantern from the store floor. Drawn as text with layers(): '.' is left as it is (air or the ladder).
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const legend = {
  B: ["barrel", { facing: "up" }],
  T: ["dark_oak_stairs", { facing: "north", half: "bottom" }],
  D: ["dark_oak_slab", { type: "bottom" }],
  C: ["candle", { candles: "2", lit: "true" }],
};

export function build(g) {
  // y5: the stock by the west wall, the stool, and the desk
  layers(g, [14, 5, 20], legend, [
    ["..T", "B.D"],
  ]);
  // y6: second barrel on the stock, candle on the desk
  layers(g, [14, 6, 20], legend, [
    ["...", "B.C"],
  ]);
  // lantern on an iron chain from the store floor (y12), over the free floor: the room's one light
  g.set(14, 11, 20, ...B.chain("y"));
  g.set(14, 10, 20, ...B.lantern(true));
}
