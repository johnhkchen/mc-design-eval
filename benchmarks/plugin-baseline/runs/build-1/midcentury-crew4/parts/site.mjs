// PART 2 site, carport and paving (plan.md SITE, ROOFS carport, RESERVED pool/cactus cells).
// Ground cover is laid over the shell's dirt at y=0 (build.mjs sets it before runParts), so the ground helper below
// replaces dirt; the vocab helpers only write into air, except joint_row (cuts the driveway) and stepping_pad (paves
// the sand/dirt top of its own cells). Order matters: yard first, then the cells laid over it.
import {
  carport, breeze_screen, joint_row, stepping_pad, POOL_CELLS, DRIVEWAY_JOINTS,
} from "../vocab.mjs";

const inPool = (x, z) => (POOL_CELLS[z] ?? []).some(([a, b]) => x >= a && x <= b);

// y=0 ground block over x0..x1, z0..z1, skipping the kidney pool (its ground stays empty)
function ground(g, x0, x1, z0, z1, block) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (!inPool(x, z)) g.set(x, 0, z, block);
}

export function build(g) {
  // 1. ground cover that the rest sits on: sand yard, side strips, lawns
  ground(g, 9, 33, 1, 7, "sand");            // front yard (desert)
  ground(g, 0, 0, 1, 21, "sand");            // west side strip, beside the drive
  ground(g, 32, 33, 1, 25, "sand");          // east side strip
  ground(g, 0, 8, 22, 33, "grass_block");    // back lawn, west
  ground(g, 9, 9, 26, 33, "grass_block");    // lawn under the carport's back corner
  ground(g, 9, 9, 22, 25, "sand");           // x=9 strip at the back of the carport
  ground(g, 10, 10, 29, 33, "grass_block");  // lawn strip between the house patio and the pool deck
  ground(g, 25, 33, 29, 33, "grass_block");  // east back lawn
  ground(g, 32, 33, 26, 28, "grass_block");  // east edge of the patio row

  // 2. gravel beds in the front yard, sand under the cactus cluster
  ground(g, 10, 16, 1, 5, "gravel");
  ground(g, 22, 30, 1, 5, "gravel");
  for (const [x, z] of [[26, 3], [24, 2], [28, 2], [23, 4], [29, 4]]) g.set(x, 0, z, "sand");

  // 3. sidewalk along the street
  ground(g, 0, 33, 0, 0, "smooth_stone");

  // 4. driveway with joint rows, carport floor under the deck
  ground(g, 1, 8, 1, 21, "smooth_stone");
  for (const z of DRIVEWAY_JOINTS) joint_row(g, z, 1, 8);
  ground(g, 1, 9, 7, 21, "smooth_stone");    // carport floor (plan: x=1..9 z=7..21)
  carport(g, 0, 7);

  // 5. entry landing and stepping-pad path in the sand
  ground(g, 18, 20, 6, 7, "smooth_stone");
  for (const z of [1, 3, 5]) stepping_pad(g, 18, z);

  // 6. breeze-block screen closing the carport's south side
  breeze_screen(g, 1, 9, 21, 1, 4);

  // 7. back patio and pool deck (pool cells stay empty)
  ground(g, 10, 31, 26, 28, "smooth_stone");
  ground(g, 11, 24, 29, 33, "smooth_stone");
}
