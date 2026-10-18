// Room "P0 attic" (interior designer's part): a storage nook under the Magnolia's hip roof. Box x5..10, y10..12, z15..19.
// The ladder comes up at x11 z17 and steps off onto (10,10,17), so that cell and the lane west from it stay clear.
// Focal piece: the dresser on the west wall (barrels with a chest between them, facing the ladder). Window seat on the
// north wall, a chest bench on the south wall, a red rug between, and lanterns standing on barrels for light.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  b: ["barrel", { facing: "up" }],
  E: ["chest", { facing: "east" }],
  S: ["chest", { facing: "south" }],
  n: ["chest", { facing: "north" }],
  s: ["spruce_stairs", { facing: "north", half: "bottom", shape: "straight" }],
  r: "red_carpet",
  L: ["lantern", { hanging: "false" }],
  f: "flower_pot",
};

// origin [5, 10, 15]: x 5..10 (columns), z 15..19 (rows). y10 is the floor the feet stand on.
const FLOOR = [
  // z15  x5..x10
  "b..ssS",
  // z16
  "b.rr..",
  // z17  (focal chest on the west wall; ladder entry at x10)
  "E.rr..",
  // z18
  "b.....",
  // z19  (chest bench on the south wall)
  ".nn...",
];

// y11: things standing on the barrels (a lantern on each end barrel, a flower pot on the north one)
const STANDING = [
  "f.....",
  "L.....",
  "......",
  "L.....",
  "......",
];

export function build(g) {
  layers(g, [5, 10, 15], LEGEND, [FLOOR, STANDING]);
}
