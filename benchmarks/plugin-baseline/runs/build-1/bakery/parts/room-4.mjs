// Room: Stube (living room), inner air box [7,7,9,15,10,13]. Interior designer's part.
//   Focal piece: the brick tile stove (NE corner) with its lit furnace mouth facing into the room; the one red
//   accent is the red carpet rug. Table set under the front windows (fence leg, slab top, three stair seats),
//   a bookshelf and lectern on the west wall, hanging lanterns from the attic floor for light.
//   Kept clear: the stair arrival (7..8,7..8,13), the doorway path (11..12,7..8,13..14), and every window's
//   inner air (front z=9 at x=9..10 and 12..13 above y=7, east and west windows at z=11..12).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// origin [7,7,9]: rows along +x (x=7..15), successive rows along +z (z=9..13); layers y=7..10
const FLOOR = [          // y=7: furniture at walking height
  "KL.....BB",           // z=9:  bookshelf + lectern west; tile stove NE
  "K.efw.FBB",           // z=10: bookshelf, table (fence leg at 10), seats at 9 (east) and 11 (west), furnace mouth
  "..cnccc..",           // z=11: rug, seat north of table
  "..ccccc..",           // z=12: rug
  "..ccccc..",           // z=13: rug (stair arrival x=7..8 stays clear)
];
const TOP = [            // y=8: bookshelf top row, table top, stove body
  "X......BB",
  "X..s...BB",
  ".........",
  ".........",
  ".........",
];
const STOVE_CAP = [      // y=9: brick slab cap on the stove
  ".......TT",
  ".......TT",
  ".........",
  ".........",
  ".........",
];
const CEILING = [        // y=10: hanging lanterns from the attic floor (y=11)
  ".......A.",
  ".A.......",
  ".........",
  ".....A...",
  ".........",
];

export function build(g) {
  layers(g, [7, 7, 9], {
    "K": "bookshelf",
    "X": ["chiseled_bookshelf", { facing: "east" }],
    "L": ["lectern", { facing: "east" }],
    "e": ["spruce_stairs", { facing: "east", half: "bottom" }],
    "w": ["spruce_stairs", { facing: "west", half: "bottom" }],
    "n": ["spruce_stairs", { facing: "north", half: "bottom" }],
    "f": "spruce_fence",
    "s": ["spruce_slab", { type: "bottom" }],
    "c": "red_carpet",
    "B": "bricks",
    "T": ["brick_slab", { type: "bottom" }],
    "F": ["furnace", { facing: "west", lit: true }],
    "A": ["lantern", { hanging: true }],
  }, [FLOOR, TOP, STOVE_CAP, CEILING]);
}
