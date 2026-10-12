// PART 6 pool, patio and garden details (plan.md ticks 23, 24, 26): the kidney pool in its reserved cells (water and
// the liner below the grid), three loungers and a patio table on the patio (z=26..28), a palm on the back lawn, four
// garden lamps (two by the entry path, two by the pool) and short grass on the lawns. Writes only into air.
//
// The pool is laid here without the vocabulary's kidney_pool(): that helper also swaps the rim's smooth_stone for
// coping, and the rim is the site part's deck (locked to this part's writes), so the coping is site's to lay (see Notes).
import { rng, POOL_CELLS, WATER, GRASS_BLOCK, SHORT_GRASS } from "../vocab.mjs";
import { lounger, patio_table, palm, garden_lamp } from "../vocab.mjs";

// plan.md: loungers (head cell; the foot sits one cell east, axis x, d=1) and the patio table (chairs at x=15 and x=17)
const LOUNGERS = [[12, 27], [20, 27], [24, 27]];
const PATIO_TABLE = [16, 27];
const PALM = [29, 31];
// garden lamps: flanking the entry path (x=17, x=21 at z=5) and two by the pool on the lawn
const LAMPS = [[17, 5], [21, 5], [10, 30], [25, 30], [0, 5], [0, 17], [4, 30], [32, 1], [10, 1]];
const GRASS_DENSITY = 0.35;

// Water in the reserved pool cells at y=0 (the basin below the grid is dropped by the build's proxy, so the pool reads
// as shallow water on the bedding). Only air cells are written.
function pool(g) {
  let water = 0;
  for (const [z, runs] of Object.entries(POOL_CELLS)) for (const [a, b] of runs) for (let x = a; x <= b; x++) {
    if (!g.isAir(x, 0, Number(z))) continue;
    g.set(x, 0, Number(z), WATER);
    water++;
  }
  return water;
}

export function build(g) {
  const out = { water: pool(g) };
  out.loungers = LOUNGERS.map(([x, z]) => lounger(g, x, z, "x", 1));
  out.table = patio_table(g, PATIO_TABLE[0], PATIO_TABLE[1], 1, "x");
  out.palm = palm(g, ...PALM);
  out.lamps = LAMPS.map(([x, z]) => garden_lamp(g, x, z));

  // short grass on the lawns: any grass_block cell at y=0 with air above it, sparse and seeded
  const rand = rng(6);
  let grass = 0;
  for (let x = 0; x < 34; x++) for (let z = 0; z < 34; z++) {
    if (g.blockAt(x, 0, z) !== `minecraft:${GRASS_BLOCK}`) continue;
    if (!g.isAir(x, 1, z) || rand() >= GRASS_DENSITY) continue;
    g.set(x, 1, z, SHORT_GRASS);
    grass++;
  }
  out.grass = grass;
  return out;
}
