// Room "P5 hall" (interior designer's part): a 3 x 3 Cape Cod front hall, inner air x 87..89, z 15..17, floor y 2.
// Door (88, 2..3, 14) on the front; cased openings W (x 86) and E (x 90) on z 15..17; the hearth mouth (88, 2, 18) on
// the back partition. The focal line runs door -> hearth down the centre column x 88, which stays clear except for a
// runner. Furniture stands in the corners and against the walls: a newel-post coat stand with a lantern on it (NW), a
// chest as the hall dresser (NE), stair-seat chairs facing the fire (SW, SE). Light: a hanging lantern over the lane.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  F: "spruce_fence",
  L: ["lantern", { hanging: "false" }],
  H: ["lantern", { hanging: "true" }],
  C: ["chest", { facing: "south" }],
  R: "red_carpet",
  S: ["spruce_stairs", { facing: "north", half: "bottom" }],
};

export function build(g) {
  // rows run along +x (x 87..89), successive rows along +z (z 15..17)
  layers(g, [87, 2, 15], LEGEND, [
    ["FRC", ".R.", "S.S"], // y 2: coat post, runner, chest; chairs on the hearth side (the runner stops short of the hearth surround)
    ["L..", "...", "..."], // y 3: lantern standing on the post
    ["...", ".H.", "..."], // y 4: hanging lantern over the lane
  ]);
}
