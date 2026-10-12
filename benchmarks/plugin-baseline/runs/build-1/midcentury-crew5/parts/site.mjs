// PART 2 site, carport and paving: sidewalk, driveway with joints, carport, front yard (sand, gravel, pads, landing),
// side strips, back patio, pool deck and lawns. Ground is the dirt the grid laid at y=0: this part owns it, and writes
// only over dirt (or air). The pool cells are never touched. Order matters: specific paving first, the broad sand last.
import { BASE, SAND, GRAVEL, GRASS, DIRT, inPool, joint_row, stepping_pad, carport, breeze_screen } from "../vocab.mjs";

const bare = (b) => String(b ?? "").replace(/^minecraft:/, "").split("[")[0];

export function build(g) {
  // one ground cell at y=0: only replaces the bedding dirt (or air), never another part's block; pool cells stay open
  const ground = (x, z, block) => {
    if (inPool(x, z)) return;
    if (bare(g.blockAt(x, 0, z)) === DIRT || g.isAir(x, 0, z)) g.set(x, 0, z, block);
  };
  const rect = (x0, z0, x1, z1, block) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) ground(x, z, block);
  };

  // sidewalk along the street, then the concrete driveway with its joint rows (joints run across the carport floor too)
  rect(0, 0, 33, 0, BASE);
  rect(1, 1, 8, 21, BASE);
  for (const z of [4, 8, 12, 16]) joint_row(g, 1, 8, z, 0, { over: [BASE] });

  // carport floor under the deck (x=1..9, z=7..21); the carport helper's own floor is refused on these cells, as intended
  rect(1, 7, 9, 21, BASE);
  carport(g, 0, 7);
  breeze_screen(g, 1, 9, 1, 4, 21);

  // front yard: stepping pads and the entry landing, gravel beds, then the sand around them
  for (const z of [1, 3, 5]) stepping_pad(g, 18, z, 0, { over: true });
  rect(18, 6, 20, 7, BASE);
  rect(22, 1, 30, 5, GRAVEL);
  rect(10, 1, 16, 5, GRAVEL);
  rect(9, 1, 33, 7, SAND);

  // side strips: west (x=0) and east (x=32..33), and the sand south of the carport (x=1..9, z=22..25)
  rect(0, 1, 0, 25, SAND);
  rect(32, 1, 33, 25, SAND);
  rect(1, 22, 9, 25, SAND);

  // back patio under the south eave, then the pool deck (pool cells skipped inside rect)
  rect(10, 26, 31, 28, BASE);
  rect(11, 29, 24, 33, BASE);

  // back lawns, only where nothing is paved; the pool cells are never written
  rect(0, 26, 9, 33, GRASS);
  rect(10, 29, 10, 33, GRASS);
  rect(25, 29, 33, 33, GRASS);
  rect(32, 26, 33, 28, GRASS);
}
