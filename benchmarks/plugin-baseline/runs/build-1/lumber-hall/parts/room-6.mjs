// Room: Pocket A3 (interior designer's part). Keeper pocket behind the BIRCH side, 3 wide by 2 deep, box x26..28 y5..11 z16..17.
// The ladder (27, 5..11, 16) is the way in and is locked by the stair joiner, so it is drawn as '.' here.
// Focal piece: the keeper's desk (dark oak fence + top slab) at x26 z17, lit by a candle and a hanging lantern over it.
// Stock barrels fill the back row, the chair (stairs) sits at x28 z17 facing the desk, and the lane x27 z17 (y5..6) stays open
// in front of the ladder. Lanterns hang from the store floor (y12) at y11, so the pocket is lit at the feet.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  // stock: barrels on the back row, two high
  B: ["barrel", { facing: "up", open: "false" }],
  // desk: fence leg, top slab (top half, so its surface sits at y7 for the candle)
  f: ["dark_oak_fence"],
  s: ["dark_oak_slab", { type: "top" }],
  // keeper's chair: a stair whose full back is east, so the sitter faces the desk to the west
  c: ["dark_oak_stairs", { facing: "east", half: "bottom", shape: "straight" }],
  // candle on the desk, lit
  k: ["candle", { candles: "2", lit: "true" }],
  // hanging lanterns from the store floor slab at y12
  L: ["lantern", { hanging: "true" }],
};

export function build(g) {
  // origin [26, 5, 16]: rows along +x (x26..28), successive rows along +z (z16, z17); layers run up in y
  layers(g, [26, 5, 16], LEGEND, [
    // y5: standing level. z16 barrel . barrel (ladder at x27 is locked); z17 desk leg, open lane, chair
    ["B.B",
     "f.c"],
    // y6: second barrel course on the back row; desk top slab over the leg
    ["B.B",
     "s.."],
    // y7: candle on the desk top
    ["...",
     "k.."],
    // y8..y10: open air
    ["...",
     "..."],
    ["...",
     "..."],
    ["...",
     "..."],
    // y11: hanging lanterns from the store floor; one over the desk, one at the back
    ["..L",
     "L.."],
  ]);
}
