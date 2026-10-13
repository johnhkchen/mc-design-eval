// Room: P0 back room (interior designer's part): a shotgun bedroom. Inner air x4..7, y3..6, z14..16.
// Layout (floor y3, rows run along +z, columns along +x from x4):
//   bed (head west at x4, foot at x5, z15) against the west wall: the focal piece, in line with the partition door.
//   dresser: two chests against the east wall (x7, z14 and z16), a white carpet rug between them at z15.
//   bedside: a fence post with a standing lantern at x4 z16 (the one lamp), a lit candle and a potted poppy on the dresser.
// The walk: partition door (5,13) -> (5,14) -> (6,14) -> column x6 -> back door (6,17). Column x6 stays clear, and
// nothing sits in the doorway's first cell (5,14). Bed cells x4..5 z15 keep y4..5 clear above.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // The bed: foot at x5 z15, head one step west at x4 (the pillow end against the west wall).
  bed(g, [5, 3, 15], "west", "red");

  // Floor layer y3: rows z14, z15, z16; columns x4..x7. '.' is left as it is.
  // C = chest facing west (dresser), W = white carpet rug, F = fence post (bedside stand).
  // Layer y4: K = lit candle on the dresser, L = standing lantern on the fence post, P = potted poppy on a chest.
  layers(g, [4, 3, 14], {
    "C": ["chest", { facing: "west", type: "single" }],
    "W": "white_carpet",
    "F": "oak_fence",
    "K": ["candle", { candles: "3", lit: "true" }],
    "L": ["lantern", { hanging: "false" }],
    "P": "potted_poppy",
  }, [
    // y3 floor layer
    ["...C",
     "...W",
     "F..C"],
    // y4 layer (the lamp and the dresser top)
    ["...K",
     "....",
     "L..P"],
  ]);
}
