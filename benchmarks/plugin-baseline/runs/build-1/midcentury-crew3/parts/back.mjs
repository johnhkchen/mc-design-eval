// PART 6 pool, patio and garden details: the kidney pool (water over a light-blue liner, quartz coping lip on the deck),
// three loungers and a patio table with a parasol on the patio z=26..28, the palm at (29,31), garden lamps at the entry
// path and by the pool, and short grass on the back lawns. Every write goes into air only; the deck, patio and lawn
// blocks are the site part's, and the pool cells are the reserved ones from plan.md.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { kidney_pool, palm, lounger, patio_table, garden_lamp, POOL, rng } from "../vocab.mjs";

// one block into air. Returns 1 if placed, 0 if the cell is already built.
function put(g, x, y, z, spec) {
  if (!g.isAir(x, y, z)) return 0;
  g.set(x, y, z, ...spec);
  return 1;
}

// the parasol over a patio table at (x, z): a dark_oak_fence pole on the table top, a 3 x 3 smooth_quartz canopy at y=4
function parasol(g, x, z) {
  let n = put(g, x, 3, z, B.fence("dark_oak"));
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) n += put(g, x + dx, 4, z + dz, B.slab("smooth_quartz", "bottom"));
  return n;
}

// the pool's coping: a smooth_quartz slab lip (bottom half) at y=1 on every deck cell 4-adjacent to a pool cell
const pool = (x, z) => (POOL[z] ?? []).some(([a, b]) => x >= a && x <= b);
function coping(g) {
  const seen = new Set();
  let n = 0;
  for (const z of Object.keys(POOL).map(Number)) for (const [a, b] of POOL[z]) for (let x = a; x <= b; x++) {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const cx = x + dx, cz = z + dz;
      if (pool(cx, cz) || seen.has(`${cx},${cz}`)) continue;
      seen.add(`${cx},${cz}`);
      n += put(g, cx, 1, cz, B.slab("smooth_quartz", "bottom"));
    }
  }
  return n;
}

// the lawns: the back strips x=0..9 and x=32..33 (z=26..33), and x=25..33 south of the patio (z=29..33)
const lawn = (x, z) => z >= 26 && z <= 33 && (x <= 9 || x >= 32 || (x >= 25 && z >= 29));

export function build(g) {
  // the pool first: water, liner and floor (below y=0 the floor and liner are dropped; the water at y=0 stays)
  kidney_pool(g, POOL);
  coping(g);

  // patio on z=26..28, standing y=1: three loungers along x, one table with chairs and a parasol
  lounger(g, 11, 27, "x");
  lounger(g, 21, 27, "x");
  lounger(g, 28, 27, "x");
  patio_table(g, 16, 27);
  parasol(g, 16, 27);

  // palm in the back lawn
  palm(g, 29, 31);

  // garden lamps: two on the entry path (sand between the stepping pads), two by the pool on the deck
  garden_lamp(g, 17, 5);
  garden_lamp(g, 21, 5);
  garden_lamp(g, 11, 31);
  garden_lamp(g, 24, 32);
  // west side strip (sand at x=0): the driveway, sidewalk and carport floor are otherwise dark at night
  for (const z of [4, 14, 22]) garden_lamp(g, 0, z);
  // front corners: the sidewalk's west end past the mailbox and the east side strip (sand)
  garden_lamp(g, 9, 4);
  garden_lamp(g, 32, 2);

  // short grass: about a third of the lawn cells, seeded so every build is the same
  const rand = rng(6);
  for (let x = 0; x < 34; x++) for (let z = 26; z <= 33; z++) {
    if (lawn(x, z) && rand() < 0.35) put(g, x, 1, z, B.block("short_grass"));
  }
}
