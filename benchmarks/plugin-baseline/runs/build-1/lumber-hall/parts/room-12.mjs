// Room: Keepers' gallery (interior designer's part). Box x 3..39, y 13..17, z 15..22; floor y 13 (the store's
// floor block is y 12, the hatches sit in it). The keepers' desk is the focal piece, set on the axis of the
// partition doorways' lane; the chairs and the second table, barrels and chest stand against the walls; hanging
// lanterns on iron chains (under the loft floor, y 18) light the walkway. Clear: the stair head x 3..4 z 15..19,
// the landing lane z 20..21, the doorway cells x 20..21 at z 15 and z 22, and the cell above every hatch.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// one entry per placed cell: [x, z, character]; rows are built from them so the coordinates stay readable
const floor = [
  // z 15: north wall, barrels by the stair rail, a chest at the east end
  [6, 15, "B"], [7, 15, "B"], [8, 15, "B"], [35, 15, "B"], [37, 15, "C"],
  // z 18: the keepers' desk (focal, x 24..26) and the second table (x 34) with its chair
  [24, 18, "P"], [25, 18, "P"], [26, 18, "P"], [34, 18, "F"], [33, 18, "W"],
  // z 19: the desk chair, on the walkway side of the desk
  [25, 19, "D"],
  // z 22: south wall barrels, east of the south doorway lane
  [27, 22, "B"], [28, 22, "B"], [29, 22, "B"],
];
const tops = [
  [24, 18, "T"], [25, 18, "T"], [26, 18, "T"], [34, 18, "T"],
];
const lamps = [
  [25, 18, "c"],
];
const hang = [
  // lanterns: one per bay, over lanes and walls alike; the cells at y 13..14 stay clear
  [7, 17, "l"], [16, 18, "l"], [33, 16, "l"], [25, 16, "l"], [13, 21, "l"], [36, 21, "l"],
  [5, 21, "l"], [29, 21, "l"], [21, 16, "l"], [19, 22, "l"], [37, 17, "l"], [8, 17, "l"],
];
const chains = [
  [7, 17, "h"], [16, 18, "h"], [33, 16, "h"], [25, 16, "h"], [13, 21, "h"], [36, 21, "h"],
  [5, 21, "h"], [29, 21, "h"], [21, 16, "h"], [19, 22, "h"], [37, 17, "h"], [8, 17, "h"],
];

const legend = {
  B: ["barrel", { facing: "up" }],
  C: ["chest", { facing: "south" }],
  P: "dark_oak_planks",
  F: "dark_oak_fence",
  D: ["dark_oak_stairs", { facing: "south", half: "bottom" }],
  W: ["dark_oak_stairs", { facing: "west", half: "bottom" }],
  T: ["dark_oak_slab", { type: "top" }],
  c: ["candle", { candles: "3", lit: "true" }],
  l: ["lantern", { hanging: "true" }],
  h: ["iron_chain", { axis: "y" }],
};

// rows of one layer: z 15..22 (rows along +z), each row runs x 3..39 (index = x - 3)
function rowsOf(cells) {
  const X0 = 3, X1 = 39, Z0 = 15, Z1 = 22;
  const rows = [];
  for (let z = Z0; z <= Z1; z++) {
    const row = Array(X1 - X0 + 1).fill(" ");
    for (const [x, cz, ch] of cells) if (cz === z) row[x - X0] = ch;
    rows.push(row.join(""));
  }
  return rows;
}

export function build(g) {
  // one layer per height: the floor furniture (y 13), the table tops (y 14), the candles (y 15), the lanterns
  // (y 16) and their chains (y 17), each drawn as text and placed with layers()
  layers(g, [3, 13, 15], legend, [rowsOf(floor)]);
  layers(g, [3, 14, 15], legend, [rowsOf(tops)]);
  layers(g, [3, 15, 15], legend, [rowsOf(lamps)]);
  layers(g, [3, 16, 15], legend, [rowsOf(hang)]);
  layers(g, [3, 17, 15], legend, [rowsOf(chains)]);
}
