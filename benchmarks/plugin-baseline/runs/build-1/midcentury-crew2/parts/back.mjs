// PART 6 pool, patio and garden details (plan.md PARTS 6; VOCABULARY Exterior, Back garden).
// Ticks 23 (pool), 24 (patio furniture, palm, lamps), 26 (short grass). Writes only into air, through the helpers.
import { POOL, WATER, COPING, GRASS, rng, palm, lounger, patio_table, garden_lamp, hung_lantern } from "../vocab.mjs";

// the reserved pool cells (plan.md RESERVED), from the shared POOL spans
const poolCells = Object.entries(POOL).flatMap(([z, spans]) =>
  spans.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => [a + i, Number(z)])),
);
const inPool = (x, z) => (POOL[z] ?? []).some(([a, b]) => x >= a && x <= b);

// kidney_pool from vocab/h1 is NOT used: its coping is written at y=0 on the deck cells, and site's deck (built first)
// already fills those cells, so the coping would be refused. Here the basin below y=0 is not storable (dropped), so the
// pool is water at y=0 over the reserved cells, and the quartz coping is a slab lip at y=1 on the deck beside it.
function pool(g) {
  let placed = 0;
  for (const [x, z] of poolCells) {
    if (!g.isAir(x, 0, z)) continue;
    g.set(x, 0, z, WATER);
    placed++;
  }
  for (const [x, z] of poolCells) {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const nz = z + dz;
      if (inPool(nx, nz) || !g.isAir(nx, 1, nz)) continue;
      g.set(nx, 1, nz, COPING, { type: "bottom" });
      placed++;
    }
  }
  return placed;
}

// short grass on the back lawns (grass_block at y=0), about a third of the open cells, seeded so every run is the same
function shortGrass(g) {
  const r = rng(6);
  let placed = 0;
  for (let x = 0; x <= 33; x++) for (let z = 26; z <= 33; z++) {
    const lawn = x <= 10 || x >= 25;
    if (!lawn || inPool(x, z) || !g.isAir(x, 1, z)) continue;
    if (!g.blockAt(x, 0, z).includes(GRASS.replace("minecraft:", ""))) continue;
    if (r() < 0.35) { g.set(x, 1, z, "short_grass"); placed++; }
  }
  return placed;
}

export function build(g) {
  pool(g);
  // patio furniture on z=27 (z=26 stays a clear walk-out row in front of the sliders)
  lounger(g, 12, 27, "x");
  lounger(g, 16, 27, "x");
  patio_table(g, 21, 27, "x");
  lounger(g, 26, 27, "x");
  palm(g, 29, 31);
  // garden lamps: the entry path and the pool
  garden_lamp(g, 17, 5);
  garden_lamp(g, 21, 5);
  garden_lamp(g, 12, 29);
  garden_lamp(g, 23, 32);
  // entry lanterns in the air niche, hung from the north header course
  hung_lantern(g, 18, 8, 4);
  hung_lantern(g, 20, 8, 4);
  shortGrass(g);
}
