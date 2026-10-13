// Room: Pocket B2 (interior designer's part): a keeper's pocket on the south row. A dark oak tally desk (fence leg,
// slab top) with a dark oak stair seat, a stock chest and a barrel with a lit candle, one hanging lantern on a chain
// from the store floor. The ladder cell (23, y5..11, 21) and the lane in front of it (23, y5..6, 20) are never written.
// Inner air: x 22..24, y 5..11, z 20..21. Floor y 4 (the pocket floor), ceiling is the first-floor slab at y 12.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const legend = {
  // seat: stairs whose back is on the north wall, so the sitter faces the desk to the south
  C: ["dark_oak_stairs", { facing: "north", half: "bottom" }],
  // desk leg and desk top (a bottom slab on the fence post)
  F: "dark_oak_fence",
  S: ["dark_oak_slab", { type: "bottom" }],
  // ledger chest, lid facing the lane
  K: ["chest", { facing: "west" }],
  // stock barrel, open top, candle on its lid
  B: ["barrel", { facing: "up" }],
  c: ["candle", { candles: "1", lit: "true" }],
  // hanging lantern under the chain, lighting the pocket's floor cells at 8+
  l: ["lantern", { hanging: "true" }],
  i: ["iron_chain", { axis: "y" }],
};

export function build(g) {
  // floor furniture (y 5): rows are z 20 then z 21, columns x 22..24; the ladder column x 23 at z 21 is left alone
  layers(g, [22, 5, 20], legend, ["C K", "F B"]); // z 20: seat, open lane, chest; z 21: desk leg, ladder, barrel
  layers(g, [22, 6, 20], legend, ["   ", "S c"]); // desk top; lit candle on the barrel
  layers(g, [22, 11, 20], legend, [" i ", "   "]); // chain under the store floor
  layers(g, [22, 10, 20], legend, [" l ", "   "]); // hanging lantern over the lane
}
