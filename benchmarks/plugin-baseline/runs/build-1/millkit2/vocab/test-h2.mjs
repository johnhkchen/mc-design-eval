// Calls every h2.mjs helper once on a small grid and checks it placed blocks only inside the footprint it returned;
// then checks the air-only rule and the hanging lantern's support. Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const SIZE = [24, 12, 24];
const CALLS = [
  ["lamp_post", (g) => h2.lamp_post(g, 4, 1, 4)],
  ["clapboard_wall", (g) => h2.clapboard_wall(g, [6, 3, 6, 12, 6, 12], "acacia_planks", "stripped_pale_oak_log", { open: [[9, 4, 6, 9, 5, 6]] })],
  ["shutter_pair", (g) => h2.shutter_pair(g, 14, 4, 6, "north", "spruce", { width: 1, height: 2 })],
  ["front_steps", (g) => h2.front_steps(g, 14, 15, 1, 6)],
  ["hearth_nook", (g) => h2.hearth_nook(g, 2, 3, 14, "north"), (g) => g.set(2, 3, 15, "bricks")],
  ["hanging_lantern", (g) => h2.hanging_lantern(g, 18, 7, 14), (g) => g.set(18, 8, 14, "spruce_planks")],
  ["woodpile", (g) => h2.woodpile(g, [2, 1, 18, 5, 4, 21])],
  ["swing", (g) => h2.swing(g, 20, 2, 15)],
  ["tapered_post", (g) => h2.tapered_post(g, 10, 3, 20)],
];

let failed = 0;
const fail = (msg) => { failed++; console.log(`FAIL ${msg}`); };

for (const [name, call, setup = () => {}] of CALLS) {
  const g = new Grid(SIZE);
  setup(g);
  const before = new Set([...g].map((c) => c.pos.join(",")));
  const r = call(g);
  const [x0, y0, z0, x1, y1, z1] = r.box;
  const cells = [...g].filter((c) => c.block !== "minecraft:air" && !before.has(c.pos.join(",")));
  const outside = cells.filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  if (r.placed === 0) fail(`${name}: placed nothing`);
  if (outside.length) fail(`${name}: ${outside.length} blocks outside its footprint, first at ${outside[0].pos}`);
  if (r.placed !== cells.length) fail(`${name}: reported ${r.placed} placed, grid has ${cells.length}`);
  console.log(`${name}: ${r.placed} placed in ${JSON.stringify(r.box)}`);
}

// Air only: a block already in the footprint is kept and reported as skipped; nothing outside it is touched.
{
  const g = new Grid(SIZE);
  g.set(4, 1, 4, "stone");
  const r = h2.lamp_post(g, 4, 1, 4);
  if (r.skipped !== 1 || g.blockAt(4, 1, 4) !== "minecraft:stone") fail("lamp_post overwrote a non-air cell");
  if (r.placed !== 3) fail(`lamp_post placed ${r.placed} around a stone foot, expected 3`);
  console.log(`air only: skipped ${r.skipped}, kept ${g.blockAt(4, 1, 4)}`);
}

// A hanging lantern with air above places nothing.
{
  const g = new Grid(SIZE);
  const r = h2.hanging_lantern(g, 18, 7, 14);
  if (r.hung || r.placed !== 0) fail("hanging_lantern hung from air");
  console.log(`hanging_lantern with air above: hung ${r.hung}`);
}

console.log(failed ? `${failed} check(s) failed` : "all h2 checks passed");
process.exit(failed ? 1 : 0);
