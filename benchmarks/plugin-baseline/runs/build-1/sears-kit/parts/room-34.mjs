// Room "P4 kitchen" (interior designer's part): a 4 x 2 kitchen at feet level y2 (box x73..76, z19..20). The focal piece
// is the stove run on the back row (smoker, furnace, cauldron), facing north into the room, so the doorway looks at it.
// The front row z19 stays a lane from the doorway at (73,19) to the table at the east end; the barrel closes the back row.
// Light: a hanging lantern under the upper floor, plus the lit smoker and furnace.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const Y_FEET = 2;

// feet level (y2): the stove run and the barrel on the back row, the fence table at the east end of the front row
const LEGEND_FEET = {
  "S": ["smoker", { facing: "north", lit: "true" }],
  "F": ["furnace", { facing: "north", lit: "true" }],
  "C": "cauldron",
  "b": "barrel",
  "T": "oak_fence",
};

// the top of the stove run and the table: a candle and a potted herb on the stove, the table's pressure-plate top
const LEGEND_TOP = {
  "P": "oak_pressure_plate",
  "c": ["candle", { candles: "2", lit: "true" }],
  "p": "potted_dandelion",
};

// the hanging lantern under the upper floor's block layer (y5), clear of the doorway and the lane
const LEGEND_HANG = {
  "L": ["lantern", { hanging: "true" }],
};

// rows: z19 (front, the lane), z20 (back, the stove run); columns x73..76
export function build(g) {
  // feet level: y2
  layers(g, [73, Y_FEET, 19], LEGEND_FEET, [
    ["...T", "SFCb"],
  ]);
  // top level: y3 (on the stove run, the barrel, and the table's fence)
  layers(g, [73, Y_FEET + 1, 19], LEGEND_TOP, [
    ["...P", "cp.."],
  ]);
  // hanging light: y4, under the ceiling
  layers(g, [73, Y_FEET + 2, 19], LEGEND_HANG, [
    [".L.."],
  ]);
}
