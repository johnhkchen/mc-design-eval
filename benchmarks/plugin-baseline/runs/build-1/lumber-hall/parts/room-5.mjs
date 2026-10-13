// Room: Pocket A2 (interior designer's part). A keeper's stock pocket behind the SPRUCE counter, three wide, entered
// down the ladder at (19, z16) from the hatch above. Inner air box x 18..20, y 5..11, z 16..17.
// The ladder's lane (19, y5..6, z17) stays open. Focal piece: the keeper's tally chest with a lit candle on the barrel
// beside it. Stock barrels along the back row, two hanging lanterns for the dark cells.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [18, 5, 16];

const LEGEND = {
  C: ["chest", { facing: "south", type: "single" }],          // tally chest (focal), faces the ladder
  B: ["barrel", { facing: "up", open: "false" }],             // stock barrels
  K: ["candle", { candles: "1", lit: "true" }],               // tally candle on the barrel top
  L: ["lantern", { hanging: "true" }],                        // hung from the store floor above
};

// y 5..11, rows along +x (x 18..20), successive rows along +z (z 16, 17). '.' is left as it is.
const LAYERS = [
  // y5: floor level. Chest and barrel on the back row; the ladder foot at (19,16) and the lane at (19,17) stay clear.
  ["C.B", "B.."],
  // y6: candle on the barrel top; a second barrel stacked on the front-left stock.
  ["..K", "B.."],
  // y7..y10: empty air.
  ["...", "..."],
  ["...", "..."],
  ["...", "..."],
  ["...", "..."],
  // y11: lanterns hang from the store floor slab (y12) either side of the ladder top.
  ["L..", ".L."],
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, LAYERS);
}
