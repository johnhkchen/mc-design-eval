// Calls every h2.mjs helper once on an empty grid and checks each placed only inside the footprint it returned;
// then checks a helper leaves existing blocks alone (air only). Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const SIZE = [42, 16, 38];
const CALLS = [
  ["canopy_column", [13, 12]],
  ["asphalt_strip", [6, 0, 35, 23]],
  ["storefront_bay", [11, 22, 24]],
  ["mart_letters", [12, 6, 23]],
  ["slot_window", [28, 24]],
  ["ev_charger", [1, 25]],
  ["air_station", [36, 23]],
  ["dumpster_enclosure", [35, 29, 39, 33]],
];

let failed = 0;
const fail = (msg) => { failed++; console.log(`FAIL ${msg}`); };

for (const [name, args] of CALLS) {
  const g = new Grid(SIZE);
  const r = h2[name](g, ...args);
  const [x0, y0, z0, x1, y1, z1] = r.box;
  const cells = [...g].filter((c) => c.block !== "minecraft:air");
  const outside = cells.filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  if (cells.length === 0) fail(`${name}: placed nothing`);
  if (outside.length) fail(`${name}: ${outside.length} blocks outside its footprint, first at ${outside[0].pos}`);
  if (r.placed !== cells.length) fail(`${name}: reported ${r.placed} placed, grid has ${cells.length}`);
  console.log(`${name}: ${cells.length} blocks in ${JSON.stringify(r.box)}`);
}

// Air only: a block already in the footprint is kept, and reported as skipped.
{
  const g = new Grid(SIZE);
  g.set(13, 3, 12, "stone");
  const r = h2.canopy_column(g, 13, 12);
  if (r.skipped !== 1 || g.blockAt(13, 3, 12) !== "minecraft:stone") fail("canopy_column overwrote a non-air cell");
  console.log(`air only: skipped ${r.skipped}, kept ${g.blockAt(13, 3, 12)}`);
}

// Door-free check of the light and lever states the workers rely on.
{
  const g = new Grid(SIZE);
  h2.ev_charger(g, 1, 25);
  if (g.get(1, 3, 25)?.state?.face !== "floor") fail("ev_charger lever not on the floor face");
}

console.log(failed ? `${failed} check(s) failed` : "all h2 checks passed");
process.exit(failed ? 1 : 0);
