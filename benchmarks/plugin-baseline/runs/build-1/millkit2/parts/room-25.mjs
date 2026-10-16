// Part: room: Bungalow living room (plot 7, inner air x 86..93, y 3..6, z 11..13).
// Furnished as the front room of the bungalow: lit hearth on the west (chimney) wall as the focal piece, a sofa of
// spruce stairs against the west wall facing the room, a coffee table with a lantern on it, a chair by the hearth,
// two barrels as a dresser on the east wall with standing lanterns on them. Door cells x89 z11 and x91 z13 stay clear,
// and so does the chimney cell x86 z13 (the chimney part builds there).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hearth_nook, table_set } from "../vocab.mjs";

export function build(g) {
  // Hearth: lit furnace on the chimney wall, stone-brick mantle above it.
  hearth_nook(g, 87, 3, 13, "east");

  // Coffee table between the sofa and the door: fence leg at y3, spruce top slab at y4.
  table_set(g, 88, 3, 12, 1);

  // Furniture by layer, origin x 86, y 3, z 11. '.' = leave as is.
  const legend = {
    S: ["spruce_stairs", { facing: "west", half: "bottom" }],   // sofa, back to the west wall
    C: ["spruce_stairs", { facing: "south", half: "bottom" }],  // chair by the hearth, back to the south wall
    B: ["barrel", { facing: "up" }],                            // dresser barrels on the east wall
    L: ["lantern", { hanging: "false" }],                       // standing lanterns
  };
  layers(g, [86, 3, 11], legend, [
    // y 3: sofa x86 z11..12, barrels x93 z11 and z13, chair x88 z13
    ["S......B",
     "S.......",
     "..C....B"],
    // y 4: lanterns standing on the barrels
    [".......L",
     "........",
     ".......L"],
    // y 5: lantern standing on the table top (x88 z12, the slab at y4)
    ["........",
     "..L.....",
     "........"],
  ]);
}
