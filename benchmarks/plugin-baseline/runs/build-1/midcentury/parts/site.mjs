// PART 2 site, carport and paving (plan.md SITE, ROOFS carport, PARTS 2): ground cover at y=0, the driveway with its
// joints, the stepping path and landing, the carport (posts, beams, deck, floor) with the breeze screen, the patio and
// pool deck, and the lawns. Order: the desert yard first, then the paving on top of it, then the carport, then the
// lawns, which only take the cells nothing above claimed. The kidney pool cells are never written.
import {
  carport, breeze_screen, joint_row, stepping_pad, garden_lamp, hung_lantern, POOL_CELLS, SAND, GRAVEL, SMOOTH_STONE, GRASS_BLOCK,
} from "../vocab.mjs";

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export function build(g) {
  const inPool = (x, z) => POOL_CELLS.has(`${x},${z}`);
  // ground cover at y=0 over a rectangle; skipPool keeps the kidney pool open
  const ground = (x0, x1, z0, z1, block, skipPool = false) => {
    for (const x of range(x0, x1)) for (const z of range(z0, z1)) {
      if (skipPool && inPool(x, z)) continue;
      g.set(x, 0, z, block);
    }
  };

  // 1. desert yard: sand on the front yard and the side strips, gravel beds in the yard
  ground(9, 33, 1, 7, SAND);
  ground(0, 0, 1, 25, SAND);
  ground(32, 33, 8, 25, SAND);
  ground(9, 9, 22, 25, SAND);
  ground(22, 30, 1, 5, GRAVEL);
  ground(10, 16, 1, 5, GRAVEL);

  // 2. paving: sidewalk, driveway, stepping pads and the entry landing
  ground(0, 33, 0, 0, SMOOTH_STONE);
  ground(1, 8, 1, 21, SMOOTH_STONE);
  for (const z of [1, 3, 5]) stepping_pad(g, z);
  ground(18, 20, 6, 7, SMOOTH_STONE);

  // 3. carport (floor, posts, beams, deck, fascia) and the breeze screen; the driveway joints run on across the slab
  carport(g);
  breeze_screen(g, 21);
  for (const z of [4, 8, 12, 16]) joint_row(g, z);

  // 4. back patio and pool deck (the kidney pool stays open)
  ground(10, 31, 26, 28, SMOOTH_STONE);
  ground(11, 24, 29, 33, SMOOTH_STONE, true);

  // 5. lawns: x=0..10 and 25..33 from z=26, plus x=1..8 from z=22; the paved cells above are skipped
  for (let z = 22; z <= 33; z++) for (let x = 0; x <= 33; x++) {
    if (inPool(x, z)) continue;
    if (z <= 25) { if (x >= 1 && x <= 8) g.set(x, 0, z, GRASS_BLOCK); continue; }
    if (z <= 28 && x >= 10 && x <= 31) continue; // patio
    if (z >= 29 && x >= 11 && x <= 24) continue; // pool deck
    if (x <= 10 || x >= 25) g.set(x, 0, z, GRASS_BLOCK);
  }

  // 6. light for the dark outdoor cells (the light map at y=1): two lanterns hung under the carport deck, and garden
  // lamps on the open west edge of the lot, where the carport and the driveway's west side were 0
  hung_lantern(g, 4, 11, 4);
  hung_lantern(g, 8, 11, 4);
  hung_lantern(g, 4, 17, 4);
  for (const z of [4, 12, 20]) garden_lamp(g, 0, z);
  garden_lamp(g, 10, 1);            // the gravel bed by the mailbox (the sidewalk at x=9)
  garden_lamp(g, 9, 4);             // the front yard's west edge, beside the driveway (the sidewalk and driveway at x=2..8)
  garden_lamp(g, 21, 1);            // the front yard, by the stepping path (the sidewalk at x=15..24)
  garden_lamp(g, 32, 2);            // the east corner of the front yard (the sidewalk at x=30..33)
  garden_lamp(g, 32, 27);           // the lawn at the patio's east end
  garden_lamp(g, 1, 32);            // the back lawn's south-west corner
  garden_lamp(g, 17, 33);           // the pool deck's back edge (the kidney pool stays open)
}
