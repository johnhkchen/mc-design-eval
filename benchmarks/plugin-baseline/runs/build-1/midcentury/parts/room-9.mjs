// ROOM bath 2 (interior designer): en-suite to bedroom 2, white quartz. Inner air x 29..30, z 14..16, y 2..4 (floor y=1).
// Only 2 x 3 cells, so the room is a strip: north row (z=14) holds the basin and the WC, the middle row (z=15) is the
// clear path with bath mats, the south row (z=16) is the shower corner beside the door at (29,17).
//   z=14:  x=29 basin (cauldron) under a mirror pane   |  x=30 WC (quartz stairs, seat facing south)
//   z=15:  x=29 and x=30 white carpet (bath mats), clear 2-high path to every fixture
//   z=16:  x=29 clear (the cell in front of the door)  |  x=30 shower tray, lantern on it, glass screen above
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// the toolkit lists no waterlogged/powered/level states: the same filter as vocab.mjs's put()
const UNLISTED = new Set(["waterlogged", "powered", "level"]);
const put = (g, x, y, z, block, state) => g.set(x, y, z, block,
  state && Object.fromEntries(Object.entries(state).filter(([k]) => !UNLISTED.has(k))));

export function build(g) {
  // basin against the north wall, with a mirror pane above it
  put(g, 29, 2, 14, "cauldron");
  put(g, 29, 3, 14, "glass_pane");
  // WC: quartz stairs, the low step faces south so the seat faces the door
  put(g, 30, 2, 14, ...B.stairs("quartz", "south", "bottom"));
  // bath mats in front of the basin and the WC
  put(g, 29, 2, 15, "white_carpet");
  put(g, 30, 2, 15, "white_carpet");
  // shower: quartz tray in the south-east cell, a lantern on the tray as the room's light, glass screen above it
  put(g, 30, 2, 16, ...B.slab("smooth_quartz", "bottom"));
  put(g, 30, 3, 16, "lantern", { hanging: "false" });
  put(g, 30, 4, 16, "glass_pane");
}
