// ROOM bath 2 (interior designer): en-suite bath for bedroom 2, white quartz. Inner air [29,2,14]..[30,4,16] (2 x 3).
// The fixtures stand in the east column (x=30) and the walk runs up the west column (x=29) from the doorway at (29,17),
// so every fixture has a clear cell in front of it: shower tray and glass screen at z=14, basin under a mirror at z=15,
// WC (quartz stairs, back to the east wall, open side west) at z=16, with a standing lantern on its tank at (30,3,16).
// The ceiling over this room is not in the shell, so nothing hangs: the light stands on a block.
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// T shower tray, K basin, W WC, G glass (screen and mirror), L standing lantern; '.' is free floor
const legend = {
  T: B.slab("smooth_quartz", "bottom"),
  K: B.block("cauldron"),
  W: B.stairs("smooth_quartz", "west", "bottom"),
  G: B.pane(),
  L: B.lantern(false),
};

// rows run along +x (x=29, x=30), successive rows along +z (z=14, 15, 16); one layer per y (y=2, 3, 4)
const floor = [".T", ".K", ".W"];
const mid = [".G", ".G", ".L"];
const top = [".G", ".G", ".."];

export function build(g) {
  layers(g, [29, 2, 14], legend, [floor, mid, top]);
}
