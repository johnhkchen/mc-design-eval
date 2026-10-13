// Part "room: corridor 1" (parts/room-5.mjs): the first-floor corridor to the flats. Inner air [4,14,3,20,17,4].
// Furniture runs along the north wall (z 3); the z 4 row stays clear as the lane from the stair door (21,14,3) to the
// flat doors (8,5) and (16,5). Focal piece: a hall table with a pot, facing the east door. Light: two hanging
// lanterns over the furniture, one standing lantern on the west cabinet. Palette has no barrel or carpet, so the
// west cabinet is a dark_oak_planks block and there is no runner.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Rows run along +x from x 4 to x 20; successive rows along +z (z 3 then z 4). Origin is the room's top-left air cell.
  const legend = {
    "P": "dark_oak_planks",                                  // west cabinet and the hall table
    "<": ["dark_oak_stairs", { facing: "north", half: "bottom" }], // chairs: backs to the wall, seats face the lane
    "L": ["lantern", { hanging: "false" }],                  // standing lantern on the cabinet
    "l": ["lantern", { hanging: "true" }],                   // hanging lanterns from the ceiling block
    "f": "flower_pot",                                       // the focal piece: a pot on the hall table
  };

  // y 14: the floor-level furniture (cabinet, chairs, table), the lane row stays empty.
  layers(g, [4, 14, 3], legend, [
    ["P......<P<.......", "................."],
  ]);
  // y 15: the lantern on the cabinet and the pot on the table.
  layers(g, [4, 15, 3], legend, [
    ["L.......f........", "................."],
  ]);
  // y 17: the two hanging lanterns, kept off the doorway cells (8 and 16 on z 5) and off the door approach (20, 3).
  layers(g, [4, 17, 3], legend, [
    ["..l.........l..l.", ".......l.........."],
  ]);
}
