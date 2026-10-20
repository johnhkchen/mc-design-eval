// Calls every h2.mjs helper once on a small grid and checks each placed blocks only inside the footprint it returned, that
// the placed count matches the grid, that a non-air cell is left alone, and that leaves are persistent. Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const SIZE = [40, 24, 40];
const CALLS = [
  ["crown_band", (g) => h2.crown_band(g, [2, 10, 2, 14, 13, 9])],
  ["portal_bay", (g) => h2.portal_bay(g, { x: 20, z0: 4, y0: 2 })],
  ["emblem", (g) => h2.emblem(g, { x: 30, z0: 4, z2: 6, y0: 9, y1: 10, kind: "british" })],
  ["shop_bay", (g) => h2.shop_bay(g, { face: "north", plane: 10, a: 2, b: 9 })],
  ["plinth", (g) => h2.plinth(g, { x0: 26, z0: 26, x1: 32, z1: 33, y0: 2 })],
  ["ring_circle", (g) => h2.ring_circle(g, [30, 14, 27.5], "x", 4.5, "waxed_exposed_cut_copper")],
  ["pylon", (g) => h2.pylon(g, 4, 30, 2)],
  ["roof_garden", (g) => h2.roof_garden(g, [2, 2, 25, 17], 4, 7)],
  ["ledge_planter", (g) => h2.ledge_planter(g, [30, 3, 2, 37, 6, 3], { edge: "north" })],
];

let failed = 0;
const fail = (msg) => { failed++; console.log(`FAIL ${msg}`); };

for (const [name, call] of CALLS) {
  const g = new Grid(SIZE);
  const r = call(g);
  const [x0, y0, z0, x1, y1, z1] = r.box;
  const cells = [...g].filter((c) => c.block !== "minecraft:air");
  const outside = cells.filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  if (cells.length === 0) fail(`${name}: placed nothing`);
  if (outside.length) fail(`${name}: ${outside.length} blocks outside its footprint, first at ${outside[0].pos}`);
  if (r.placed !== cells.length) fail(`${name}: reported ${r.placed} placed, grid has ${cells.length}`);
  const loose = cells.filter((c) => c.block.endsWith("_leaves") && c.state?.persistent !== "true");
  if (loose.length) fail(`${name}: ${loose.length} leaves not persistent`);
  console.log(`${name}: ${cells.length} blocks in ${JSON.stringify(r.box)}${r.skipped ? `, ${r.skipped} kept (not air)` : ""}`);
}

// Air only: a block already in the footprint is kept and reported as skipped.
{
  const g = new Grid(SIZE);
  g.set(26, 2, 26, "stone");
  const r = h2.plinth(g, { x0: 26, z0: 26, x1: 32, z1: 33, y0: 2 });
  if (r.skipped !== 1 || g.blockAt(26, 2, 26) !== "minecraft:stone") fail("plinth overwrote a non-air cell");
  console.log(`air only: skipped ${r.skipped}, kept ${g.blockAt(26, 2, 26)}`);
}

console.log(failed ? `${failed} check(s) failed` : "all h2 checks passed");
process.exit(failed ? 1 : 0);
