// Part: room: H1 loft. Attic store and study under the gable, lit by the gable window.
// The floor grid (plan.md / `mcd plan`) starts at x 26, z 9; the study desk sits under the gable window (x 30..32,
// z 9). Rows run along +x, successive rows along +z. The partition at x 33 (door at z 11), the ladder top at x 34
// z 10, the stair-joiner's fence posts at x 35 z 16..19 and the walls are not written: their cells are left alone.
// Lanes: door (33,11) and ladder top (34,10) to the desk and chair, down the west part, and the east strip stays open.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  S: "spruce_fence",
  T: ["spruce_slab", { type: "bottom" }],
  C: ["dark_oak_stairs", { facing: "south", half: "bottom" }],
  K: "bookshelf",
  Z: ["barrel", { facing: "up", open: "false" }],
  H: ["chest", { facing: "west", type: "single", waterlogged: "false" }],
  L: ["lantern", { hanging: "false" }],
  A: "potted_azalea_bush",
};

// y 19: floor-level furniture (x 26..36 across, z 9..23 down)
const FLOOR = [
  "....S.S....",
  ".....C.....",
  ".........LK",
  "K.........K",
  "K.........K",
  "K..........",
  "K..........",
  "K..S.......",
  "...........",
  "...........",
  "...........",
  "Z..........",
  ".........H.",
  "......H....",
  "...........",
];

// y 20: desk top, table top, shelf tops, lanterns on barrel and chests
const TOP = [
  "....TTT....",
  "...........",
  "...........",
  "...........",
  "...........",
  "...........",
  "...........",
  "...T.......",
  "...........",
  "...........",
  "...........",
  "...........",
  ".........L.",
  "......L....",
  "...........",
];

// y 21: the lamps on the desk and the table, and a flower pot on the desk
const LAMPS = [
  "....L.A....",
  "...........",
  "...........",
  "...........",
  "...........",
  "...........",
  "...........",
  "...L.......",
  "...........",
  "...........",
  "...........",
  "...........",
  "...........",
  "...........",
  "...........",
];

export function build(g) {
  layers(g, [26, 19, 9], LEGEND, [FLOOR, TOP, LAMPS]);
}
