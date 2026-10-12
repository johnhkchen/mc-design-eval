// Smoke test for vocab/h1.mjs: each helper runs once, and every block it places lands inside the footprint it was given.
// Run: node vocab/test-h1.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const SIZE = [34, 9, 34];
const ATRIUM = { x0: 17, x1: 21, z0: 12, z1: 17, edge: true };

// Grid has no y < 0 and the pool sits in the bedding, so the pool test uses this Map-backed stand-in.
class Stand {
  constructor() { this.cells = new Map(); }
  blockAt(x, y, z) { return this.cells.get(`${x},${y},${z}`)?.block ?? "minecraft:air"; }
  isAir(x, y, z) { return this.blockAt(x, y, z) === "minecraft:air"; }
  set(x, y, z, block, state) {
    this.cells.set(`${x},${y},${z}`, { pos: [x, y, z], block: block.includes(":") ? block : `minecraft:${block}`, state });
    return this;
  }
}

// Calls call(g) on a fresh grid, asserts every placed cell is inside the box lo..hi, and returns [g, placed].
function run(name, lo, hi, call, g = new Grid(SIZE)) {
  const placed = call(g);
  assert.ok(placed > 0, `${name}: placed nothing`);
  for (const c of g.cells.values()) {
    for (let i = 0; i < 3; i++) assert.ok(c.pos[i] >= lo[i] && c.pos[i] <= hi[i], `${name}: ${c.block} at ${c.pos} is outside its footprint`);
  }
  console.log(`ok ${name}: ${placed} blocks`);
  return [g, placed];
}

// stucco_wall: a 1-thick wall, and a built cell is left alone
{
  const [g] = run("stucco_wall", [10, 2, 8], [17, 4, 8], (g) => h1.stucco_wall(g, 10, 8, 17, 8));
  assert.equal(g.blockAt(12, 3, 8), "minecraft:white_concrete");
  const built = new Grid(SIZE);
  built.set(12, 3, 8, "stone");
  h1.stucco_wall(built, 10, 8, 17, 8);
  assert.equal(built.blockAt(12, 3, 8), "minecraft:stone");
}

// slider_gap: glass on top, and the 2 x 2 opening is never written
{
  const [g, placed] = run("slider_gap", [14, 4, 25], [15, 4, 25], (g) => h1.slider_gap(g, 14, 25));
  assert.equal(placed, 2);
  assert.equal(g.blockAt(14, 2, 25), "minecraft:air");
  assert.equal(g.blockAt(15, 3, 25), "minecraft:air");
  const closed = new Grid(SIZE);
  closed.set(14, 2, 25, "stone");
  h1.slider_gap(closed, 14, 25);
  assert.equal(closed.blockAt(14, 2, 25), "minecraft:stone");
}

// roof_band: slabs at the band's half, the fascia ring, and the atrium hole left open
{
  const [g] = run("roof_band", [9, 6, 6], [32, 6, 10], (g) => h1.roof_band(g, 6, 10, 6, "bottom", { holes: [ATRIUM], fascia: true }));
  assert.equal(g.blockAt(9, 6, 6), "minecraft:dark_oak_slab");
  assert.equal(g.blockAt(20, 6, 8), "minecraft:smooth_stone_slab");
  assert.equal(g.get(20, 6, 8).state.type, "bottom");
  const [h] = run("roof_band hole", [9, 6, 11], [32, 6, 13], (g) => h1.roof_band(g, 11, 13, 6, "top", { holes: [ATRIUM], fascia: true }));
  assert.equal(h.blockAt(19, 6, 12), "minecraft:air");
  assert.equal(h.blockAt(16, 6, 12), "minecraft:dark_oak_slab");
}

// breeze_screen: checkerboard, 18 of the 36 cells
{
  const [g, placed] = run("breeze_screen", [1, 1, 21], [9, 4, 21], (g) => h1.breeze_screen(g, 1, 9, 21));
  assert.equal(placed, 18);
  assert.equal(g.blockAt(1, 1, 21), "minecraft:white_concrete");
  assert.equal(g.blockAt(2, 1, 21), "minecraft:air");
}

// palm: trunk, crown, persistent leaves
{
  const [g] = run("palm", [10, 1, 1], [14, 7, 5], (g) => h1.palm(g, 12, 3));
  for (let y = 1; y <= 7; y++) assert.equal(g.blockAt(12, y, 3), "minecraft:jungle_log");
  assert.equal(g.blockAt(14, 6, 3), "minecraft:jungle_leaves");
  assert.equal(g.blockAt(14, 7, 3), "minecraft:air");
  assert.deepEqual(g.get(13, 7, 2).state, { persistent: "true" });
}

// kidney_pool: floor, liner rim, water inside, coping on the deck (stand-in: pool is below y=0)
{
  const ROWS = { 29: [[14, 17], [20, 21]], 30: [[13, 22]], 31: [[13, 22]], 32: [[14, 21]] };
  const [g] = run("kidney_pool", [12, -2, 28], [23, 0, 33], (g) => h1.kidney_pool(g, ROWS), new Stand());
  assert.equal(g.blockAt(14, -2, 29), "minecraft:light_blue_concrete");
  assert.equal(g.blockAt(14, -1, 29), "minecraft:light_blue_concrete");
  assert.equal(g.blockAt(15, -1, 30), "minecraft:water");
  assert.equal(g.blockAt(15, 0, 30), "minecraft:water");
  assert.equal(g.blockAt(14, 0, 28), "minecraft:smooth_quartz_slab");
}

// hung_lantern: needs a block above it
{
  const g = new Grid(SIZE);
  assert.equal(h1.hung_lantern(g, 20, 20), 0);
  g.set(20, 5, 20, "dark_oak_log", { axis: "z" });
  assert.equal(h1.hung_lantern(g, 20, 20), 1);
  assert.equal(g.blockAt(20, 4, 20), "minecraft:lantern");
  assert.deepEqual(g.get(20, 4, 20).state, { hanging: "true", waterlogged: "false" });
}

// egg_chair: seat, stacked back, two side panels
{
  const [g, placed] = run("egg_chair", [15, 2, 20], [17, 3, 21], (g) => h1.egg_chair(g, 16, 21, "north"));
  assert.equal(placed, 5);
  assert.equal(g.get(16, 2, 21).block, "minecraft:smooth_red_sandstone_stairs");
  assert.equal(g.get(16, 2, 21).state.facing, "north");
  assert.equal(g.blockAt(16, 2, 20), "minecraft:iron_trapdoor");
  assert.equal(g.blockAt(16, 3, 20), "minecraft:iron_trapdoor");
}

// fireplace_stack: 2 x 2, y=1..8, lit campfire on the west column
{
  const [g, placed] = run("fireplace_stack", [20, 1, 21], [21, 8, 22], (g) => h1.fireplace_stack(g, 20, 21));
  assert.equal(placed, 32);
  assert.equal(g.get(20, 2, 21).block, "minecraft:campfire");
  assert.deepEqual(g.get(20, 2, 21).state, { facing: "south", lit: "true" });
  assert.equal(g.blockAt(21, 2, 21), "minecraft:mud_bricks");
}

// wardrobe: 3 cells along z, body on the west, open doors on the east
{
  const [g, placed] = run("wardrobe", [26, 2, 10], [27, 3, 12], (g) => h1.wardrobe(g, 26, 10, 3, "z", "east"));
  assert.equal(placed, 12);
  assert.equal(g.blockAt(26, 2, 11), "minecraft:spruce_planks");
  assert.equal(g.blockAt(27, 2, 11), "minecraft:spruce_trapdoor");
  assert.equal(g.get(27, 2, 11).state.facing, "west");
}

console.log("all H1 helpers passed");
