// PART 6 pool, patio and garden details (plan.md step 6, elements 23, 24, 26): kidney_pool in the RESERVED cells with
// liner, water and quartz coping; three loungers and a patio table on the patio (z=26..28, y=1); a palm at (29,31);
// garden_lamp posts flanking the entry path and two by the pool; short_grass scattered over the back lawns.
// Every write goes into air only (earlier parts' blocks are locked), so an occupied cell is skipped, not replaced.
import { SAND, SHORT_GRASS, kidney_pool, lounger, patio_table, palm, garden_lamp } from "../vocab.mjs";

const GRASS = "minecraft:grass_block";

// a view that keeps only the writes into air: kidney_pool's coping lands on deck cells the patio already paved (locked)
function airOnly(g) {
  const view = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, ...rest) => { if (target.isAir(x, y, z)) target.set(x, y, z, ...rest); return view; };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return view;
}

export function build(g) {
  // the kidney pool: floor and liner at y=-2..-1 are below the grid (dropped by build.mjs), water and coping at y=0
  kidney_pool(airOnly(g));

  // patio furniture on the smooth_stone patio (y=0), standing at y=1
  lounger(g, 12, 26, "x");
  lounger(g, 15, 26, "x");
  lounger(g, 25, 26, "x");
  patio_table(g, 20, 27);

  // palm in the back lawn, outside the deck and the pool
  palm(g, 29, 31);

  // garden lamps: two flanking the entry path on the sand, two on the lawn by the pool
  for (const [x, z] of [[17, 5], [21, 5], [10, 30], [25, 30]]) {
    if (g.isAir(x, 0, z)) g.set(x, 0, z, SAND);
    if (g.isAir(x, 1, z) && g.isAir(x, 2, z) && g.isAir(x, 3, z)) garden_lamp(g, x, z);
  }

  // short grass on about one lawn cell in five, picked by a fixed hash so every run gives the same lawn
  for (let x = 0; x < 34; x++) {
    for (let z = 26; z <= 33; z++) {
      if (g.blockAt(x, 0, z) !== GRASS || !g.isAir(x, 1, z)) continue;
      if ((((x * 73856093) ^ (z * 19349663)) >>> 0) % 5 === 0) g.set(x, 1, z, SHORT_GRASS);
    }
  }
}
