// Room "P6 living and kitchen" (interior designer's part): Winona front room, inner air x101..107, z14..18, floor layer y1
// (feet y2). Focal piece: the east hearth (mouth at 108,2,18), with the settee on the north wall facing into the room.
// Kitchen stove along the west wall (101, z14..18), a dining set at 102..103 (z15..17), the living corner at 105..107 (z14..17).
// Lane: x104 from the front door (104,13) to the rear doorway (104,19) stays clear; the cell in front of the hearth mouth (107,18) too.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { diningSet } from "../vocab.mjs";

const LEGEND = {
  s: ["smoker", { facing: "east", lit: "false" }],
  F: ["furnace", { facing: "east", lit: "true" }],
  c: "cauldron",
  b: "barrel",
  S: ["spruce_stairs", { facing: "north", half: "bottom" }],
  A: ["spruce_stairs", { facing: "west", half: "bottom" }],
  f: "spruce_fence",
  p: "spruce_pressure_plate",
  C: "brown_carpet",
  P: "flower_pot",
  M: ["lantern", { hanging: "false" }],   // standing on a barrel top
};

// rows run along +x (x101..107), successive rows along +z (z14..18); layers: y2, y3, y4
const FURNITURE = [
  [
    "s    SS", // z14: smoker at the west wall; settee on the north wall under the window
    "F   CCb", // z15: furnace; carpet; barrel at the hearth-side sideboard
    "c   AfC", // z16: cauldron; armchair facing the table; table (fence); carpet
    "b   CCC", // z17: barrel; carpet
    "       ", // z18: the west hearth front stays clear (the chimney moved here from the east wall)
  ],
  [
    "       ", // z14
    "      P", // z15: flower pot on the sideboard barrel (y3)
    "     p ", // z16: pressure plate on the table
    "M      ", // z17: lantern standing on the west barrel, the room's light
    "       ", // z18
  ],
  [
    "       ", // z14
    "       ", // z15
    "       ", // z16
    "       ", // z17
    "       ", // z18
  ],
];

export function build(g) {
  // the dining set: table on the fence at 102,2,16 with a top slab, two stair chairs at 102,2,15 and 102,2,17
  diningSet(g, { x: 102, y: 1, z: 15, wood: "spruce" });
  // the rest of the room's furniture, drawn as text
  layers(g, [101, 2, 14], LEGEND, FURNITURE);
}
