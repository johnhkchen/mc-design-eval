// Checks each h1 helper once on the house grid: every write lands inside the footprint it was given, writes only into
// air, and the counts match. Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const grid = new Grid([34, 9, 34]);
let placed = [];
// Records every write.
const g = new Proxy(grid, {
  get(target, prop) {
    if (prop === "set") return (x, y, z, ...rest) => { placed.push([x, y, z]); target.set(x, y, z, ...rest); return g; };
    const v = Reflect.get(target, prop);
    return typeof v === "function" ? v.bind(target) : v;
  },
});

const POOL = { 29: [[14, 17], [20, 21]], 30: [[13, 22]], 31: [[13, 22]], 32: [[14, 21]] };

// [name, call, footprint [min corner, max corner], expected count or null, setup()]
const cases = [
  ["stucco_wall", (g) => h1.stucco_wall(g, 11, 8, 17, 8), [[11, 2, 8], [17, 4, 8]], 20, () => grid.set(12, 3, 8, "stone")],
  ["slider_gap", (g) => h1.slider_gap(g, 14, 25), [[14, 2, 25], [15, 4, 25]], 2],
  ["roof_band", (g) => h1.roof_band(g, 6, 10, 6, "bottom"), [[9, 6, 6], [32, 6, 10]], 120],
  ["breeze_screen", (g) => h1.breeze_screen(g, 1, 9, 1, 4, 21), [[1, 1, 21], [9, 4, 21]], 18],
  ["palm", (g) => h1.palm(g, 12, 3), [[10, 1, 1], [14, 7, 5]], 27],
  ["kidney_pool", (g) => h1.kidney_pool(g, POOL), [[12, -2, 28], [23, 1, 33]], null],
  ["hung_lantern (beam above)", (g) => h1.hung_lantern(g, 19, 4, 14), [[19, 4, 14], [19, 4, 14]], 1, () => grid.set(19, 5, 14, "dark_oak_log", { axis: "z" })],
  ["hung_lantern (no block above)", (g) => h1.hung_lantern(g, 21, 4, 14), [[21, 4, 14], [21, 4, 14]], 0],
  ["egg_chair", (g) => h1.egg_chair(g, 20, 10, "east"), [[20, 2, 9], [21, 3, 11]], 5],
  ["wardrobe", (g) => h1.wardrobe(g, 26, 9, 3, "x", "south"), [[26, 2, 9], [28, 3, 10]], 12],
  ["fireplace_stack", (g) => h1.fireplace_stack(g, 20, 21), [[20, 1, 21], [21, 8, 22]], 32],
];

let fails = 0;
const fail = (msg) => { fails++; console.log(`FAIL ${msg}`); };
const inside = ([x, y, z], [[ax, ay, az], [bx, by, bz]]) => x >= ax && x <= bx && y >= ay && y <= by && z >= az && z <= bz;

for (const [name, call, foot, expected, setup] of cases) {
  setup?.();
  placed = [];
  const n = call(g);
  const outside = placed.filter((p) => !inside(p, foot));
  if (outside.length) fail(`${name} wrote outside its footprint: ${JSON.stringify(outside.slice(0, 4))}`);
  if (n !== placed.length) fail(`${name} returned ${n}, wrote ${placed.length}`);
  if (expected !== null && n !== expected) fail(`${name} returned ${n}, expected ${expected}`);
  console.log(`ok   ${name}: ${n} blocks`);
}

// Air-only: the stone set before the stucco call must survive it.
if (grid.blockAt(12, 3, 8) !== "minecraft:stone") fail("stucco_wall overwrote stone");
// Lantern hangs from the beam and carries hanging=true.
if (grid.get(19, 4, 14)?.state?.hanging !== "true") fail("hung_lantern is not hanging=true");
// Kidney pool: water on the pool cells at y=0, deck left as it was (air here) at the pinch, coping on its rim at y=1.
if (grid.blockAt(14, 0, 29) !== "minecraft:water") fail("kidney_pool has no water at (14,0,29)");
if (grid.blockAt(18, 0, 29) !== "minecraft:air") fail("kidney_pool wrote to y=0 on the rim");
if (grid.blockAt(18, 1, 29) !== "minecraft:smooth_quartz_slab") fail("kidney_pool has no coping at (18,1,29)");

console.log(fails ? `${fails} FAILED` : "all h1 helpers pass");
process.exitCode = fails ? 1 : 0;
