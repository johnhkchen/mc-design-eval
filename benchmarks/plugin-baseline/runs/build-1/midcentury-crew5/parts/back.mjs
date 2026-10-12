// PART 6 pool, patio and garden details (plan.md ticks 23, 24, 26): the kidney pool in its RESERVED cells (liner,
// water, quartz coping on the deck), three loungers and a parasol-less patio table on the patio (z=26..28), a palm at
// (29,31), four garden lamps (two flanking the entry path, two by the pool), two hung lanterns under the entry eave,
// and short_grass tufts on the lawns. Writes only into air: earlier parts' ground, deck and walls are never touched.
import { kidney_pool, lounger, patio_table, palm, garden_lamp, hung_lantern } from "../vocab.mjs";
import { rng } from "../vocab/base.mjs";

// The kidney pool's RESERVED cells (plan.md): z -> inclusive x spans. Same as base.mjs POOL.
const POOL_ROWS = { 29: [[14, 17], [20, 21]], 30: [[13, 22]], 31: [[13, 22]], 32: [[14, 21]] };

export function build(g) {
  // 1. The pool first: its coping (quartz slab, y=1) sits on the deck, and the patio furniture below keeps clear of it.
  kidney_pool(g, POOL_ROWS);

  // 2. Patio (z=26..28, standing y=1): three loungers along x on the north row, a patio table in the middle row.
  //    Loungers: foot at (x, 26), head at (x+1, 26). The table's chairs are at x-1 and x+1 on z=27.
  lounger(g, 12, 26, "x");
  lounger(g, 16, 26, "x");
  lounger(g, 25, 26, "x");
  patio_table(g, 21, 27, "x", 1);

  // 3. Palm on the back lawn (crown meets the lawn at z=29..33, clear of the roof's eave at z<=27).
  palm(g, 29, 31);

  // 4. Garden lamps: two flanking the entry path (sand at x=17 and x=21), two by the pool on the lawn.
  garden_lamp(g, 17, 5);
  garden_lamp(g, 21, 5);
  garden_lamp(g, 10, 30);
  garden_lamp(g, 25, 30);

  // 5. Entry lanterns: hung under the eave over the landing (x=18..20, z=6..7). Each needs the roof's slab above it.
  hung_lantern(g, 18, 5, 7);
  hung_lantern(g, 20, 5, 7);

  // 6. Short grass tufts on the lawns: every grass_block top cell that is still air, about one in three, seeded.
  const pick = rng(26);
  for (let x = 0; x < g.size[0]; x++)
    for (let z = 0; z < g.size[2]; z++) {
      if (g.blockAt(x, 0, z) !== "minecraft:grass_block" || !g.isAir(x, 1, z)) continue;
      if (pick() < 0.33) g.set(x, 1, z, "short_grass");
    }
}
