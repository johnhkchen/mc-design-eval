// Room: Pocket A1 (interior designer's part). A keeper's pocket behind the OAK machine, 3 x 2 cells, entered by the
// keeper's ladder at (11, z16) up to the gallery hatch (11,12,16). The ladder is the shell's, locked: its foot (11,5,16)
// and the lane in front of it (11,5..6,17) stay clear. Cells (10,16..17) are the doorway's first cells, kept clear too.
// Focal piece: the keeper's strongbox (barrel, open top) with four lit candles, in the far corner from the ladder.
// Light: two hanging lanterns under the gallery floor (y12), so every floor cell is at 6 or more.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // floor furniture, origin = the box's low corner (x10, y5, z16); rows run along +x, then +z
  // y5: the strongbox at (12,5,16); y6: four lit candles on its top at (12,6,16)
  layers(g, [10, 5, 16], {
    "B": ["barrel", { facing: "up" }],
  }, [
    ["..B", "..."],          // y5: barrel at x12 z16
  ]);
  layers(g, [10, 6, 16], {
    "C": ["candle", { candles: "4", lit: "true" }],
  }, [
    ["..C", "..."],          // y6: candles on the barrel
  ]);
  // hanging lanterns at y11, each under the gallery floor (y12): one over the lane, one over the strongbox
  layers(g, [10, 11, 16], {
    "L": ["lantern", { hanging: "true" }],
  }, [
    ["..L", "L.."],          // y11: (12,11,16) and (10,11,17)
  ]);
}
