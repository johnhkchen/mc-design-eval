// Room "P5 parlour" (interior designer's part): a 3 x 3 living room, NW corner of plot 5 (Stanford).
// Inner air x 84..86, z 15..17, feet at y 2. Entered from the hall through the cased opening on x 87.
// The sofa (two dark oak stairs, backs to the south wall) faces the doorway; a spruce table with a top slab sits in
// front of it, a chair on its west side, a red rug on the north row, one hanging lantern over the table and a
// potted poppy on the table. The east column x 86 stays clear as the lane from the doorway to the sofa and table.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // rows run along +x from x 84, successive rows along +z from z 15; one layer per feet level
  const legend = {
    r: "red_carpet",
    c: B.stairs("dark_oak", "west"),      // armchair on the west of the table, back to the window wall
    s: B.stairs("dark_oak", "south"),     // sofa seats, back to the south wall, facing the doorway
    f: "spruce_fence",                    // table post
    t: B.slab("spruce", "top"),           // table top, on the post
    L: B.lantern(true),                   // hanging from the ceiling block above
    p: "potted_poppy",                    // on the table top
  };
  layers(g, [84, 2, 15], legend, [
    [
      "rr.",   // z15: rug, lane
      "cf.",   // z16: chair, table, lane
      "ss.",   // z17: sofa, lane
    ],
    [
      "   ",   // y3 (nothing at z15)
      " t ",   // z16: table top slab over the post
      "   ",
    ],
    [
      " L ",   // y4 z15: lantern over the rug, hung from the y5 ceiling
      " p ",   // z16: pot on the table top
      "   ",
    ],
  ]);
}
