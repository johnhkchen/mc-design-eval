// ROOM bath 1 (interior designer): hall bathroom, white quartz, windowless. Inner air x 26..27, y 2..4, z 14..16
// (plan.md ROOMS). Door (25,2..3,15) from the corridor enters at (26,15). Only 6 floor cells, so the layout is:
//   z=14 (north): sea_lantern plinth at (26,14) (the light, a glowing block; a lantern can't hang, there is no ceiling
//     over z=14..19), tub = cauldron full of water at (27,14), the focal piece on the far wall
//   z=15 (middle): a white_carpet bath mat in both cells: the only standing space, reached from the door
//   z=16 (south, against the partition z=17): WC = smooth_quartz_stairs facing north (back to the wall), basin = cauldron
//   mirror = glass_pane at y=3 above the basin, on the x=28 partition
// Every fixture is reached from the mat cells, and the 2-high path from the door to both is clear.
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// writes only into air, so an earlier part's block is never replaced
function intoAir(g) {
  return {
    set: (x, y, z, block, state, nbt) => {
      if (g.isAir(x, y, z)) g.set(x, y, z, block, state, nbt);
    },
  };
}

export function build(g) {
  const legend = {
    t: ["cauldron", { level: "3" }], // tub, full of water
    m: B.block("white_carpet"), // bath mat
    s: B.stairs("smooth_quartz", "north", "bottom"), // WC: back to the z=17 wall
    b: B.block("cauldron"), // basin
    p: B.pane(), // mirror
    L: B.block("sea_lantern"), // the light, a glowing plinth
  };
  const rows = [
    // y=2: floor-level fittings and the mat
    [
      "Lt", // z=14: light plinth, tub
      "mm", // z=15: mat
      "sb", // z=16: WC, basin
    ],
    // y=3: mirror above the basin
    [
      "..",
      "..",
      ".p",
    ],
  ];
  layers(intoAir(g), [26, 2, 14], legend, rows);
}
