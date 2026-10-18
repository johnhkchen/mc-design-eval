// Room "P3 upper hall" (interior designer's part): the gambrel landing at the stair top. Box x55..57, y6..8, z14..20.
// The stair (x55, z15..18) and the doorway first cells (57,6,15), (57,6,19) and the window cells (55,14), (57,14) stay
// clear. The north row (z14) and south row (z20) at y6..7 belong to the shell and roof, so nothing is set there.
// Supporting pieces: a fence-and-slab table with a candle and a linen chest in the east column (x57, z16..17), a barrel
// dresser at the stair top, a stair bench on the west wall, a carpet runner up the lane. One standing lantern on the
// barrel lights the whole landing (no ceiling block is assumed above it).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // furniture and lamps by layer. Rows run along +x (55..57), successive rows along +z (14..20). Spaces are left as found.
  layers(g, [55, 6, 14], {
    "r": "brown_carpet",                                    // runner up the middle lane
    "b": ["barrel", { facing: "up", open: "false" }],        // dresser at the stair top, lamp on its top
    "k": ["oak_stairs", { facing: "west", half: "bottom", shape: "straight" }], // bench, back to the west wall
    "T": "oak_fence",                                       // table leg
    "C": ["chest", { facing: "west", type: "single" }],     // linen chest against the east wall
  }, [
    [
      "...",   // z14: window cells x55 and x57 stay clear; the north row is the shell's
      " r.",   // z15: stair x55; doorway first cell x57 clear
      " rC",   // z16: linen chest on the east wall
      " rT",   // z17: table leg on the east wall
      "..b",   // z18: stair top landing (x55) clear; barrel dresser at x57
      "k..",   // z19: bench on x55; doorway first cell x57 clear
      "...",   // z20: the south row is the roof's
    ],
  ]);

  // the lamp on the barrel, and the table top (a top slab on the fence) with a candle
  layers(g, [55, 7, 14], {
    "L": ["lantern", { hanging: "false" }],                 // standing on the barrel top
    "S": ["oak_slab", { type: "top" }],                     // table top, sits on the fence post
  }, [
    [
      "...",
      "...",
      "...",
      "..S",   // z17: table top at (57,7,17)
      "..L",   // z18: lantern on the barrel at (57,7,18)
      "...",
      "...",
    ],
  ]);

  // a lit candle on the table top, the second light on the east wall
  layers(g, [55, 8, 14], {
    "c": ["candle", { candles: "2", lit: "true" }],
  }, [
    [
      "...",
      "...",
      "...",
      "..c",   // z17: candle on the table top at (57,8,17)
      "...",
      "...",
      "...",
    ],
  ]);
}
