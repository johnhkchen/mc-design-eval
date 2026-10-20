// Calls every h1.mjs helper once and checks each placed only inside the footprint it returned; then the air-only and
// no-ground rules. Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const SIZE = [32, 40, 200];
const CALLS = [
  ["fortWall", (g) => h1.fortWall(g, 2, 2, ["##.", "###"])],
  ["loophole", (g) => h1.loophole(g, 10, 3, 10, "north")],
  ["stairTower", (g) => h1.stairTower(g, 20, 1, 20, "south")],
  ["lampPost", (g) => h1.lampPost(g, 16, 30, 1)],
  ["deckPier", (g) => h1.deckPier(g, 7, 88, { cap: [7, 23] })],
  ["deckSection", (g) => h1.deckSection(g, 11, 14, 34)],
  ["archRib", (g) => h1.archRib(g, { 15: 14, 16: 15, 17: 16, 18: 18, 19: 19 })],
  ["archRib jump", (g) => h1.archRib(g, { 20: 14, 21: 20 })],
  ["bent", (g) => h1.bent(g, 120, { pedTop: 12, legs: [13, 28] })],
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
  if (r.skipped.length) fail(`${name}: skipped ${r.skipped.length} on an empty grid, first ${JSON.stringify(r.skipped[0])}`);
  console.log(`${name}: ${cells.length} blocks in ${JSON.stringify(r.box)}`);
}

// Air only: a block already in the footprint is kept and reported as skipped; nothing is written to the ground row.
{
  const g = new Grid(SIZE);
  g.set(2, 3, 2, "stone");
  const r = h1.fortWall(g, 2, 2, ["##.", "###"]);
  if (g.blockAt(2, 3, 2) !== "minecraft:stone") fail("fortWall overwrote a non-air cell");
  if (!r.skipped.some(([x, y, z]) => x === 2 && y === 3 && z === 2)) fail("fortWall did not report the refused cell");
  const ground = [...g].filter((c) => c.pos[1] === 0 && c.block !== "minecraft:air");
  if (ground.length) fail(`fortWall wrote ${ground.length} ground cells without ground: true`);
  console.log(`air only: kept ${g.blockAt(2, 3, 2)}, skipped ${r.skipped.length}, ground cells ${ground.length}`);
}

// Stair tower doorway: two air cells in the south wall at y 7..8, the rest of the wall solid.
{
  const g = new Grid(SIZE);
  h1.stairTower(g, 20, 1, 20, "south");
  if (!g.isAir(21, 7, 23) || !g.isAir(22, 8, 23)) fail("stairTower doorway not air");
  if (g.blockAt(20, 7, 20) !== "minecraft:stone_bricks") fail("stairTower quoin not stone_bricks");
}

// Deck lines: the dashed line is on at z % 4 in {0, 1}, the road otherwise.
{
  const g = new Grid(SIZE);
  h1.deckSection(g, 12, 14, 34);
  if (g.blockAt(12, 34, 12) !== "minecraft:smooth_quartz") fail("deckSection dash not on at z 12");
  if (g.blockAt(12, 34, 14) !== "minecraft:polished_deepslate") fail("deckSection dash not off at z 14");
}

if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log("h1 helpers: all checks passed");
