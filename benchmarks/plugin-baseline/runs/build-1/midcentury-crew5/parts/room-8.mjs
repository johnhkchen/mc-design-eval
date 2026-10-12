// ROOM bath 1 (interior designer): hall bathroom, white quartz, windowless. The room is 2 wide (x=26..27) by 3 deep
// (z=14..16), entered from the corridor through the doorway at (25,15), which opens onto the cell (26,15).
// Layout, back wall north (z=13):
//   z=14 back row: cauldron basin at x=26 with a glass mirror above it (y=3) and a sea_lantern over the mirror (y=4,
//   the brightest cell in the room, the focal piece); quartz stair WC at x=27 facing north (back to the wall).
//   z=15 the path: white carpet (bath mat) on both cells, the two cells every way in and out runs through.
//   z=16 front row against the south wall: a two-cell tub of cauldrons.
// Every furniture cell touches a walkable cell (x=26..27, z=15), so the room is walkable from the doorway.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    c: "cauldron", // basin (z=14) and tub (z=16)
    q: ["quartz_stairs", { facing: "north", half: "bottom" }], // WC against the north wall
    g: "glass_pane", // mirror over the basin
    s: "sea_lantern", // light over the mirror
    w: "white_carpet", // bath mat on the walk-through row
  };
  // y=2 is the standing layer; y=3 and y=4 hold the mirror and the light above the basin.
  layers(g, [26, 2, 14], legend, [
    [ // y=2: rows z=14, 15, 16 (x runs 26, 27)
      "cq",
      "ww",
      "cc",
    ],
    [ // y=3
      "g.",
      "..",
      "..",
    ],
    [ // y=4
      "s.",
      "..",
      "..",
    ],
  ]);
}
