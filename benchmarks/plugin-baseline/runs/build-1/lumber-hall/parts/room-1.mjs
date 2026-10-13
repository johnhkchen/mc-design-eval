// Room: Lobby (interior designer's part). Customers' lobby and keeper's office front, tidy and plain.
// Box 3..7 x 5..11 x 6..12. Focal piece: the dark oak counter against the east wall, with its price board behind and a
// standing lantern on top. Customers' bench (two stair seats) against the west wall. Barrels of stock along the back.
// Hanging lanterns on iron chains from the first-floor slab (x 4 and 6 only: x 3..4 at z 12 is open over the stair).
// Everything is drawn as text and placed with layers(); each y level is one layer, rows along +z from z 6, columns x 3..7.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // y 5: floor furniture. S = bench seat (stairs, back to the west wall), C = counter body, B = barrel stock
  layers(g, [3, 5, 6], {
    S: ["dark_oak_stairs", { facing: "west", half: "bottom" }],
    C: "dark_oak_planks",
    B: "barrel",
  }, [
    ".....",   // z 6  (entry lane from the north door: keep clear)
    "S....",   // z 7
    "S...C",   // z 8
    "....C",   // z 9
    "B...C",   // z 10
    "B....",   // z 11
    "B....",   // z 12  (foot of the stair flight: keep clear)
  ]);

  // y 6: counter top slab (top half, so the counter top is a full face at y 7)
  layers(g, [3, 6, 6], {
    T: ["dark_oak_slab", { type: "top" }],
  }, [
    ".....",
    ".....",
    "....T",
    "....T",
    "....T",
    ".....",
    ".....",
  ]);

  // y 7: candles and a standing lantern on the counter
  layers(g, [3, 7, 6], {
    K: ["candle", { lit: "true" }],
    L: ["lantern", { hanging: "false" }],
  }, [
    ".....",
    ".....",
    "....K",
    "....L",
    "....K",
    ".....",
    ".....",
  ]);

  // y 9..10: price board behind the counter (plain planks, 3 high x 3 wide, on the east wall)
  layers(g, [3, 9, 6], { W: "dark_oak_planks" }, [
    ".....",
    ".....",
    "....W",
    "....W",
    "....W",
    ".....",
    ".....",
  ]);

  // y 10: hanging lanterns (H) over the bench, the lane and the board; the board's second row is the same W
  layers(g, [3, 10, 6], {
    H: ["lantern", { hanging: "true" }],
    W: "dark_oak_planks",
  }, [
    ".....",
    ".H...",
    "....W",
    "...HW",
    "....W",
    ".H...",
    ".....",
  ]);

  // y 11: iron chains hanging the lanterns from the first-floor slab (y 12)
  layers(g, [3, 11, 6], {
    I: ["iron_chain", { axis: "y" }],
  }, [
    ".....",
    ".I...",
    ".....",
    "...I.",
    ".....",
    ".I...",
    ".....",
  ]);
}
