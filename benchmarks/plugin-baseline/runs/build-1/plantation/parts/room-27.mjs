// Part: room: bedroom 7 (over the kitchen). Interior air x51..57 z70..74, floor row y11, ceiling y17.
// Layout: bed focal on the north wall (head to the wall, foot into the room), nightstand with a standing lantern,
// barrel dresser on the north-west, a wardrobe chest in the south-west corner, a red rug between the door and the bed,
// and a writing table with a chair and a flower pot by the east window. One hanging lantern under the ceiling.

import { B, layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { porchLantern } from "../vocab.mjs";

export function build(g) {
  // floor row (y11), origin x50 z69: rows run along +x, successive rows along +z
  layers(g, [50, 11, 69], {
    "b": "barrel",
    "f": "dark_oak_fence",
    "r": "red_carpet",
    "c": ["chest", { facing: "north" }],
    "s": ["dark_oak_stairs", { facing: "west", half: "bottom" }],
    "T": ["dark_oak_slab", { type: "top" }],
    "P": "flower_pot",
    "L": ["lantern", { hanging: "false" }],
  }, [
    [
      "         ", // z69: north wall
      " bbf     ", // z70: barrels, nightstand (bed head at x54)
      "         ", // z71: bed foot at x54, placed by bed()
      "  rrrrsf ", // z72: rug, chair, writing table (door at x50)
      " Lrrrr   ", // z73: rug, standing lantern on the west wall (lights the south-west)
      " c       ", // z74: wardrobe chest
      "         ", // z75: south wall
    ],
    [
      "         ",
      "   L     ", // y12 z70: lantern on the nightstand
      "         ",
      "       T ", // y12 z72: table top slab on the fence
      "         ",
      "         ",
      "         ",
    ],
    [
      "         ",
      "         ",
      "         ",
      "       P ", // y13 z72: flower pot on the table top
      "         ",
      "         ",
      "         ",
    ],
  ]);
  bed(g, [54, 11, 71], "north", "red");
  porchLantern(g, 54, 16, 73);

  // lamplighter: two standing lanterns on the floor, into air (the light probe gives min 10, no dim cell):
  // the designer's west-wall spot (lights the south-west) and the north-east corner, clear of the bed and rug.
  g.set(51, 11, 73, ...B.lantern(false));
  g.set(57, 11, 70, ...B.lantern(false));
}
