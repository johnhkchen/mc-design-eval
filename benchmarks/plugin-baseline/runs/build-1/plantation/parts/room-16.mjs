// Part: room: bedroom 2 (West front bedroom: bed, dresser chest, desk). Interior box [27,11,43,35,16,49].
// Layout (x27..35 across, z43..49 down; front wall z42 with the two windows, south wall z50 with the door at x29..30):
// red bed against the west wall, head to the north; chest dresser on the north wall; writing desk and chair on the east
// wall by the window; a rug between the bed and the door; lamps at the bedside, on the desk and hung from the ceiling.
// The chimney stack (x33..34, z46..47) is locked by the chimney part and stays as it is. A lane 1 wide runs down x28.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // bed: foot at (27,11,44), head one step north at (27,11,43)
  bed(g, [27, 11, 44], "north", "red");

  const legend = {
    c: ["chest", { facing: "south" }], // dresser, two chests on the north wall
    n: "barrel", // nightstand under the bedside lamp
    h: ["dark_oak_stairs", { facing: "west", half: "bottom" }], // desk chair, back to the west, seat facing the desk
    d: "dark_oak_fence", // desk post
    t: ["dark_oak_slab", { type: "top" }], // desk top
    r: "red_carpet", // rug
    p: "flower_pot", // on the dresser
    l: ["lantern", { hanging: "false" }], // standing lamps
    H: ["lantern", { hanging: "true" }], // ceiling lamp
  };

  // y11: floor furniture (rows z43..z49, columns x27..x35)
  layers(g, [27, 11, 43], legend, [
    "...cc....", // z43: dresser chests x30..31
    ".........", // z44
    "n......hd", // z45: barrel x27, chair x34, desk post x35
    "..rrr....", // z46: rug x29..31
    "..rrr....", // z47
    "l.rrr....", // z48: floor lamp in the corner, rug to its east
    ".........", // z49: clear lane to the door
  ]);

  // y12: pot on the dresser, bedside lamp, desk top
  layers(g, [27, 12, 43], legend, [
    "...p.....", // z43: flower pot on the chest
    ".........", // z44
    "l.......t", // z45: lamp on the barrel, desk top at x35
    ".........", // z46
    ".........", // z47
    ".........", // z48
    ".........", // z49
  ]);

  // y13: desk lamp on the desk top
  layers(g, [27, 13, 43], legend, [
    ".........", // z43
    ".........", // z44
    "........l", // z45: lamp at x35
    ".........", // z46
    ".........", // z47
    ".........", // z48
    ".........", // z49
  ]);

  // y16: hanging ceiling lamp over the rug, under the plate y17
  layers(g, [27, 16, 43], legend, [
    ".........", // z43
    ".........", // z44
    ".........", // z45
    "....H....", // z46: lamp at x31
    ".........", // z47
    ".........", // z48
    ".........", // z49
  ]);
}
