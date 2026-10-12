// Part "room: Restroom A" (parts/room-2.mjs): the small tiled restroom inside box [25,1,25,26,7,28].
// Layout (x across, z down; origin x24 z24, the plan's top-left corner):
//   basin + white mirror on the north-west corner, barrel with a standing lantern beside it (the focal corner),
//   toilet (stair seat + tank) against the west wall in the south-west corner; the door (27,27) opens onto a clear
//   1-wide lane down the east half, with the basin and toilet each reached from it.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Floor furniture (y=1). Rows run along +z from z24; characters not in the legend (walls, doorway, free floor) are left alone.
const FLOOR = [
  "####", // z24 wall
  "#cb#", // z25: basin cauldron at x25, barrel at x26
  "#..#", // z26: lane
  "#..D", // z27: lane from the door
  "#T.#", // z28: toilet seat at x25
  "####", // z29 wall
];

// Second layer (y=2): mirror above the basin, lantern on the barrel, toilet tank above the seat.
const WAIST = [
  "####",
  "#ml#",
  "#..#",
  "#..D",
  "#k.#",
  "####",
];

// Third layer (y=3): the mirror's upper half.
const HEAD = [
  "####",
  "#m.#",
  "#..#",
  "#..D",
  "#..#",
  "####",
];

const MIRROR = ["white_stained_glass_pane", { north: "true", west: "true", east: "false", south: "false" }];

export function build(g) {
  layers(
    g,
    [24, 1, 24],
    {
      c: "cauldron",
      b: "barrel",
      T: ["smooth_quartz_stairs", { facing: "west", half: "bottom", shape: "straight" }],
      k: "light_gray_concrete",
      l: ["lantern", { hanging: "false" }],
      m: MIRROR,
    },
    [FLOOR, WAIST, HEAD],
  );
}
