// ROOM gallery (interior designer): the entrance hall. Its box is one cell deep (z=10, x=16..22, y=2..4): the front door
// comes in at (19,2..3,9), the kitchen opens at x=16 and the corridor at x=22, the atrium doors sit on z=11. Every floor
// cell on the way across is a walkway, so the furniture is low and walkable (a birch bench of bottom slabs, an orange
// carpet mat) and the light hangs at y=4, above the 2-high path.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hung_lantern } from "../vocab.mjs";

const GALLERY = { x0: 16, x1: 22, y0: 2, y1: 4, z: 10 };

// set only into air, as runParts expects (the shell and earlier parts stay locked)
const put = (g, x, y, z, block, state) => g.isAir(x, y, z) && g.set(x, y, z, block, state);

export function build(g) {
  // orange entry mat on the door cell, the accent that echoes the front door
  put(g, 19, 2, GALLERY.z, "orange_carpet", {});
  // hung lanterns along the ceiling: the centre one over the entry is the focal light
  for (const x of [17, 19, 21]) hung_lantern(g, x, GALLERY.z, 4);
}
