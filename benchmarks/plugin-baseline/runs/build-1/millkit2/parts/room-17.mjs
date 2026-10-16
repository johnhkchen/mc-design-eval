// Part: room: Pyramid SE bedroom. Inner air x 43..45, y 3..6, z 14..16 (floor y 3). Entered from the back hall at x42 z15.
// Layout (x across, z down; F furnace/stove, B barrel dresser, T table with lamp, b bed foot and head):
//   z14:  F . B
//   z15:  . . .      <- entry x43 z15 and the lane across to the bed head
//   z16:  T b b      (bed foot x44, head x45 against the east wall; window beside it at x46 z15)
// Light: the lit stove at x43 z14, a standing lantern on the table top at x43 y5 z16.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bed_set, hearth_nook, table_set } from "../vocab.mjs";

export function build(g) {
  // Stove: lit furnace on a stone hearth, against the hearth mass at x42 z14, front facing into the room (east).
  hearth_nook(g, 43, 3, 14, "east");

  // Table: spruce fence legs at y3, top slab at y4 (top type), at x43 z16. The lamp stands on its top at y5.
  table_set(g, 43, 3, 16, 1);

  // Bed: green (pyramid house colour), foot at x44 z16, head at x45 z16 against the east wall.
  bed_set(g, [44, 3, 16], "east", "green");

  // Dresser barrel in the NE corner (x45 z14), its top open to the room.
  // Lamp on the table top.
  layers(
    g,
    [43, 3, 14],
    {
      B: ["barrel", { facing: "up" }],
      L: ["lantern", { hanging: "false" }],
    },
    [
      // y3 floor layer: rows z14, z15, z16
      ["..B", "...", "..."],
      // y4 layer: nothing (table slab already placed)
      ["...", "...", "..."],
      // y5 layer: lamp on the table top
      ["...", "...", "L.."],
    ],
  );
}
