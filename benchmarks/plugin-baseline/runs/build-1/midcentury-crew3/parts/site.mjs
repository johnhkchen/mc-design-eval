// PART 2 site, carport and paving (plan.md SITE, ROOFS "Carport roof", PARTS 2). Ground-level paving and cover at y=0,
// plus the carport and the breeze-block screen. The bedding is dirt at y=0 (build.mjs), so the paving and cover here
// overwrite the dirt and the other ground cover: `lay` writes only over air and the cover named in `over`, so a
// paved cell is never covered again by a later stroke. Pool cells (base.mjs inPool) are left as air for the pool part.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { breeze_screen, joint_row, stepping_pad, carport } from "../vocab.mjs";
import { CARPORT, DRIVEWAY_JOINT_ROWS, STEPPING_PADS, inPool } from "../vocab/base.mjs";

const COVER = new Set(["dirt", "sand", "gravel", "grass_block"]);
const name = (g, x, y, z) => g.blockAt(x, y, z).replace("minecraft:", "");

// Paints the inclusive box x0..x1 x z0..z1 at height y with block, over air and the cells named in `over` (default: any
// ground cover). Pool cells are skipped.
function lay(g, [x0, x1], [z0, z1], block, over = COVER, y = 0) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (inPool(x, z)) continue;
    const here = name(g, x, y, z);
    if (here === "air" || over.has(here)) g.set(x, y, z, ...B.block(block));
  }
}

export function build(g) {
  // the sidewalk, one row along the street
  lay(g, [0, 33], [0, 0], "smooth_stone");

  // the sand yard: the front yard, the side strips and the x=9 strip; gravel beds over the sand
  lay(g, [9, 33], [1, 7], "sand");
  lay(g, [0, 0], [1, 25], "sand");
  lay(g, [32, 33], [1, 25], "sand");
  lay(g, [9, 9], [8, 25], "sand");
  lay(g, [22, 30], [1, 5], "gravel");
  lay(g, [10, 16], [1, 5], "gravel");

  // the driveway (its joints go in after the carport floor, so they run under the carport too)
  lay(g, [1, 8], [1, 21], "smooth_stone");

  // the stepping pads in the sand and the entry landing under the eave
  for (const pad of STEPPING_PADS) stepping_pad(g, pad.x0, pad.z, 3);
  lay(g, [18, 20], [6, 7], "smooth_stone");

  // the carport: floor, then the deck, posts, beams and fascia (vocab), then the breeze-block screen at z=21
  lay(g, [1, CARPORT.x1], [CARPORT.z0, CARPORT.z1], "smooth_stone");
  carport(g, CARPORT.x0, CARPORT.z0, CARPORT.x1, CARPORT.z1);
  breeze_screen(g, 1, 9, 21, 1, 4);

  for (const z of DRIVEWAY_JOINT_ROWS) joint_row(g, 1, 8, z, 0, { swap: "smooth_stone" });

  // the back: patio, pool deck, then the lawns over the dirt only (the sand strip at x=0 and the pool stay as they are)
  const dirtOnly = new Set(["dirt"]);
  lay(g, [10, 31], [26, 28], "smooth_stone");
  lay(g, [11, 24], [29, 33], "smooth_stone");
  lay(g, [0, 9], [22, 33], "grass_block", dirtOnly);
  lay(g, [10, 10], [26, 33], "grass_block", dirtOnly);
  lay(g, [25, 33], [26, 33], "grass_block", dirtOnly);
}
