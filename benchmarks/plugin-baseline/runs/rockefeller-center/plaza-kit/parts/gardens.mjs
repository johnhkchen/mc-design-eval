// Channel gardens: plot 1's six long pools, the two continuous flower runners either side of them, and benches on the
// walks. Layout in garden-layout.mjs (the ground laid the soil, the prismarine pool floors and the pale walks under them).
// Pools: low smooth_stone_slab rims at g+1, still water at g+1, a bronze jet (copper block with a lightning-rod spout)
// at each pool's west end. Planters: a pale smooth_stone_slab curb raised one slab on the walk row and the run ends,
// the pool rim as their inner edge, planted in 3-long bands of bushes, hedge and flowers.
import { bench } from "../vocab.mjs";
import { GARDEN_POOLS, PLANTER_RUNS, PLANTER_ROWS, POOL_ROWS } from "./garden-layout.mjs";

const RIM = ["smooth_stone_slab", { type: "bottom" }];
const leaves = (id) => [id, { persistent: "true" }];
const tall = (id) => [[id, { half: "lower" }], [id, { half: "upper" }]];

// Planting bands, 3 cells long each, cycled along every run: [walk-side row, pool-side row] stacks from g+1 up
const FAZ = leaves("flowering_azalea_leaves"), AZ = leaves("azalea_leaves"), BOX = leaves("oak_leaves");
const BANDS = [
  [[FAZ], [FAZ]],
  [[["red_tulip"]], [BOX]],
  [tall("rose_bush"), [FAZ]],
  [[["allium"]], [["allium"]]],
  [[["orange_tulip"]], [AZ]],
  [tall("peony"), [FAZ]],
  [[["white_tulip"]], [BOX]],
  [[["pink_tulip"]], [["pink_tulip"]]],
  [[AZ], [FAZ]],
  [[["cornflower"]], [BOX]],
  [tall("lilac"), [FAZ]],
  [[["oxeye_daisy"]], [AZ]],
]

function pool(g, { x0, x1, g: gy }) {
  for (let x = x0; x <= x1; x++) for (let z = POOL_ROWS.rim[0]; z <= POOL_ROWS.rim[1]; z++) {
    const rim = x === x0 || x === x1 || POOL_ROWS.rim.includes(z);
    if (rim) g.set(x, gy + 1, z, ...RIM);
    else if (x === x0 + 1 && z === POOL_ROWS.water[0]) {
      // the jet at the west end: a bronze block in the water, a lightning-rod spout standing on it
      g.set(x, gy + 1, z, "waxed_exposed_copper");
      g.set(x, gy + 2, z, "lightning_rod", { facing: "up" });
    } else g.set(x, gy + 1, z, "water", { level: "0" });
  }
}

function planter(g, { x0, x1, g: gy }, { curb, soil }, phase) {
  const y = gy + 1;
  for (let x = x0; x <= x1; x++) g.set(x, y, curb, ...RIM);
  for (const z of soil) { g.set(x0, y, z, ...RIM); g.set(x1, y, z, ...RIM); }
  // pool-side row is the soil row next to the pools
  const poolSide = curb < 6 ? soil[1] : soil[0], walkSide = curb < 6 ? soil[0] : soil[1];
  for (let x = x0 + 1; x < x1; x++) {
    const band = BANDS[(Math.floor((x - x0 - 1) / 3) + phase) % BANDS.length];
    for (const [z, stack] of [[walkSide, band[0]], [poolSide, band[1]]]) stack.forEach(([id, st], i) => g.set(x, y + i, z, id, st));
  }
}

export function build(g) {
  for (const p of GARDEN_POOLS) pool(g, p);
  PLANTER_RUNS.forEach((run, i) => {
    planter(g, run, PLANTER_ROWS.north, i * 4);
    planter(g, run, PLANTER_ROWS.south, i * 4 + 6);
  });
  // benches on the walks, backed on the planter curbs, mid-pool (clear of the lamps every 8)
  for (const [x, gy] of [[61, 0], [69, 0], [78, 1], [86, 1], [93, 1], [102, 2]]) {
    bench(g, x, 2, "north", { y: gy + 1 });
    bench(g, x, 13, "south", { y: gy + 1 });
  }
}
