// Room: Pocket B3 (interior designer's part). A keeper's pocket behind the south row: the ladder comes down from the
// hatch at (31,12,21) on the back wall z22 and stands at x31, z21, facing north. Its focal piece is the stock chest in
// the west corner with a lit candle on it; a barrel of stock stands beside it. The lane in front of the ladder
// (31, y5..6, z20) and the cell inside the doorway (x32) stay clear. Two hanging lanterns light the pocket.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const legend = {
  "c": ["chest", { facing: "north", type: "single", waterlogged: "false" }],
  "b": ["barrel", { facing: "up", open: "false" }],
  "t": ["candle", { candles: "2", lit: "true", waterlogged: "false" }],
  "l": ["lantern", { hanging: "true", waterlogged: "false" }],
};

// origin: the pocket's north-west floor cell (x 30, z 20); rows run along +x, successive rows along +z. One call per
// level, since layers() stacks its rows from the origin's y.
export function build(g) {
  // y5: floor level. Barrel at the north-west corner, chest against the back wall beside the ladder's foot
  layers(g, [30, 5, 20], legend, ["b..", "c.."]);
  // y6: the candle stands on the chest
  layers(g, [30, 6, 20], legend, ["...", "t.."]);
  // y11: lanterns hang from the store floor (y12) over the north-west corner and the south-east corner
  layers(g, [30, 11, 20], legend, ["l..", "..l"]);
}
