// ROOM bath 2 (interior designer): en-suite for bedroom 2, white quartz. Inner air x=29..30, z=14..16, y=2..4; the door
// is at (29,17) from bedroom 2 (south), the clerestory glazes the east wall at (31,4,15..16). Layout, north (z=14) to south:
// WC on the north wall, basin (cauldron) with a glass mirror above it on the west; shower tray and head in the far south-east
// corner, a bath mat by the basin, and a standing lantern on the floor as the light (the vault over z=14..16 is open, so
// nothing hangs there). The entry cell (29,16) stays open.
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [28, 2, 13]; // top-left corner of plan.md's bath 2 grid (x 28..31, z 13..17); walls and the door are skipped

export function build(g) {
  const legend = {
    C: B.block("cauldron"), // basin
    S: B.stairs("quartz", "south", "bottom"), // WC: quartz stair seat, back to the north wall
    R: B.block("white_carpet"), // bath mat
    Q: B.slab("smooth_quartz", "bottom"), // shower tray (walkable half step)
    M: B.pane(), // mirror over the basin
    l: B.lantern(false), // standing light on the floor (no ceiling over the bath to hang from)
    T: B.trapdoor("iron", "south", "top", false), // shower head plate under the ceiling
  };
  return layers(g, ORIGIN, legend, [
    // y=2: floor fixtures
    [
      "####",
      "#CS#",
      "#Rl#",
      "#.Q#",
      "#D##",
    ],
    // y=3: mirror
    [
      "####",
      "#M.#",
      "#..#",
      "#..#",
      "####",
    ],
    // y=4: shower head
    [
      "####",
      "#..#",
      "#..#",
      "#.T#",
      "####",
    ],
  ]);
}
