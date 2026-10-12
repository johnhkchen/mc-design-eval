// PART 2 site, carport and paving: the sidewalk, the concrete driveway with its joint rows, the sand yard and gravel beds,
// the stepping pads and entry landing, the side strips, the carport (posts, beams, deck, fascia, floor) with its breeze
// screen, the back patio and pool deck, and the lawns. The ground at y=0 is dirt from build.mjs, so this part sets the
// ground cells directly (they stay writable) and claims each one, so a later rule here skips what an earlier rule
// in this part already paved. The pool cells are never touched.
import {
  PAVING, JOINT, SAND, GRAVEL, GRASS, inPool, carport, breeze_screen,
} from "../vocab.mjs";

export function build(g) {
  const claimed = new Set();

  // one ground cell (y=0); the pool is left for the back part
  const ground = (x, z, block) => {
    if (inPool(x, z)) return;
    g.set(x, 0, z, block, {});
    claimed.add(`${x},${z}`);
  };
  // a rectangle of ground; `free` skips the cells an earlier rule here already claimed
  const fill = (x0, x1, z0, z1, block, { free = false } = {}) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      if (free && claimed.has(`${x},${z}`)) continue;
      ground(x, z, block);
    }
  };

  // sidewalk along the street, then the driveway (x=1..8, z=1..21) and its joint rows
  fill(0, 33, 0, 0, PAVING);
  fill(1, 8, 1, 21, PAVING);
  for (const z of [4, 8, 12, 16]) fill(1, 8, z, z, JOINT);

  // the front yard: sand, with gravel beds either side of the path
  fill(9, 33, 1, 7, SAND);
  fill(10, 16, 1, 5, GRAVEL);
  fill(22, 30, 1, 5, GRAVEL);

  // stepping pads in the sand, then the entry landing under the eave
  for (const z of [1, 3, 5]) fill(18, 20, z, z, PAVING);
  fill(18, 20, 6, 7, PAVING);

  // side strips: west (x=0) and east (x=32..33), and the x=9 strip beside the carport
  fill(0, 0, 1, 25, SAND);
  fill(32, 33, 1, 25, SAND);
  fill(9, 9, 8, 25, SAND);

  // the carport: its floor (smooth_stone under x=1..9, z=7..21) is laid over the x=9 sand
  carport(g, 0, 7, 9, 21, { floor: true });
  // the breeze-block screen at the south side of the carport
  breeze_screen(g, 1, 9, 1, 4, 21);

  // the back patio and the pool deck (pool cells skipped inside ground())
  fill(10, 31, 26, 28, PAVING);
  fill(11, 24, 29, 33, PAVING);

  // the lawns: only into cells nothing above has claimed
  fill(0, 10, 26, 33, GRASS, { free: true });
  fill(25, 33, 26, 33, GRASS, { free: true });
}
