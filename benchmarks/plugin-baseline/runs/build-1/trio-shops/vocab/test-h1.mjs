// Run: node vocab/test-h1.mjs
// Calls every H1 helper once on a grid laid out like H1 (house a=25) and checks each placed block sits in its footprint.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const SIZE = [40, 30, 34];
const inBox = (p, [x0, y0, z0, x1, y1, z1]) => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1 && p[2] >= z0 && p[2] <= z1;
const key = (x, y, z) => `${x},${y},${z}`;

/** Fresh grid with `pre` [x0,y0,z0,x1,y1,z1,block] boxes filled, returns { g, preKeys } so the test knows what it laid. */
function setup(pre = []) {
  const g = new Grid(SIZE);
  const preKeys = new Set();
  for (const [x0, y0, z0, x1, y1, z1, block] of pre)
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) { g.set(x, y, z, block); preKeys.add(key(x, y, z)); }
  return { g, preKeys };
}

/** Every block the helper added (not pre-laid) must sit inside the footprint it was given. */
function assertInFootprint(g, preKeys, box, label) {
  for (const c of g) {
    if (c.block === "minecraft:air" || preKeys.has(key(...c.pos))) continue;
    assert.ok(inBox(c.pos, box), `${label}: ${c.block} at ${c.pos} is outside footprint ${box}`);
  }
}

test("fascia_board: dark oak board on the street wall, and it never writes over an existing block", () => {
  const { g, preKeys } = setup([[27, 6, 7, 27, 6, 7, "stone_bricks"]]);
  const r = h1.fascia_board(g, 25);
  assert.equal(g.blockAt(27, 6, 7), "minecraft:stone_bricks", "occupied cell must be left alone");
  assert.deepEqual(r.skipped.map((s) => s.at), [[27, 6, 7]]);
  assert.equal(r.placed, 20);
  assert.equal(g.blockAt(26, 5, 7), "minecraft:dark_oak_planks");
  assertInFootprint(g, preKeys, [26, 5, 7, 32, 7, 7], "fascia_board");
});

test("awning: seven stair cells at y 5 z 6, alternating shop and quartz, back to the wall", () => {
  const { g, preKeys } = setup();
  const r = h1.awning(g, 25);
  assert.equal(r.placed, 7);
  assert.equal(g.get(26, 5, 6).block, "minecraft:dark_prismarine_stairs");
  assert.equal(g.get(27, 5, 6).block, "minecraft:quartz_stairs");
  assert.equal(g.get(26, 5, 6).state.facing, "south");
  assertInFootprint(g, preKeys, [26, 5, 6, 32, 5, 6], "awning");
});

test("pier: cut sandstone out, smooth sandstone on the wall, bracket stair at the foot", () => {
  const { g, preKeys } = setup();
  const r = h1.pier(g, 33, 5, 17, { bracket: true });
  assert.equal(r.placed, 2 * 13);
  assert.equal(g.get(33, 5, 6).block, "minecraft:smooth_sandstone_stairs");
  assert.equal(g.get(33, 5, 6).state.half, "top");
  assert.equal(g.get(33, 6, 6).block, "minecraft:cut_sandstone");
  assertInFootprint(g, preKeys, [33, 5, 6, 33, 17, 7], "pier");
});

test("window_bay: glass one cell inside, sill below and lintel above", () => {
  const { g, preKeys } = setup();
  const r = h1.window_bay(g, 27, 28, 10, 11, 7, 1);
  // 2 columns x 2 rows: opening + glass = 8; lintel and sill, one per column = 4
  assert.equal(r.placed, 12);
  assert.equal(g.get(27, 10, 8).block, "minecraft:glass_pane");
  assert.equal(g.get(27, 10, 7).block, "minecraft:air");
  assert.equal(g.get(27, 12, 7).block, "minecraft:smooth_sandstone");
  assert.equal(g.get(27, 9, 6).block, "minecraft:smooth_sandstone_stairs");
  assertInFootprint(g, preKeys, [27, 9, 6, 28, 12, 8], "window_bay");
});

test("lobby_door: both door halves, fanlight, lintel and hanging lanterns", () => {
  const { g, preKeys } = setup();
  h1.lobby_door(g, 35);
  assert.equal(g.get(35, 2, 7).block, "minecraft:dark_oak_door");
  assert.equal(g.get(35, 2, 7).state.half, "lower");
  assert.equal(g.get(35, 3, 7).state.half, "upper");
  assert.equal(g.get(35, 4, 7).block, "minecraft:glass_pane");
  assert.equal(g.get(34, 4, 6).state.hanging, "true");
  assertInFootprint(g, preKeys, [34, 2, 6, 36, 5, 7], "lobby_door");
});

test("loft_ladder: ladder against the partition, hatch at y 18; skips cells with no wall behind", () => {
  const { g, preKeys } = setup([[33, 13, 9, 33, 18, 12, "bricks"]]);
  const r = h1.loft_ladder(g, 34, 10, "east");
  assert.equal(r.placed, 5);
  assert.equal(g.get(34, 14, 10).block, "minecraft:ladder");
  assert.equal(g.get(34, 14, 10).state.facing, "east");
  assert.equal(g.get(34, 18, 10).block, "minecraft:dark_oak_trapdoor");
  assertInFootprint(g, preKeys, [34, 14, 10, 34, 18, 10], "loft_ladder");
  const bare = setup();
  assert.equal(h1.loft_ladder(bare.g, 34, 10, "east").placed, 1, "only the hatch: no wall behind the ladder");
});

test("yard: grass and dirt in the yard, a dirt path from the door, brick walls round it", () => {
  const { g, preKeys } = setup();
  h1.yard(g, 25, 35);
  assert.equal(g.get(26, 1, 25).block, "minecraft:grass_block");
  assert.equal(g.get(35, 1, 26).block, "minecraft:dirt_path");
  assert.equal(g.get(37, 2, 30).block, "minecraft:brick_wall");
  assertInFootprint(g, preKeys, [25, 1, 25, 37, 2, 32], "yard");
});

test("product_panel: column on the pier face; an anvil only over solid ground", () => {
  const { g, preKeys } = setup();
  h1.product_panel(g, 33, "bookshelf");
  assert.equal(g.get(33, 6, 5).block, "minecraft:bookshelf");
  assertInFootprint(g, preKeys, [33, 5, 5, 33, 7, 5], "product_panel");
  const anvil = setup();
  assert.equal(h1.product_panel(anvil.g, 33, "anvil").placed, 0, "anvil floats: no support below");
  assert.throws(() => h1.product_panel(g, 33, "stone"), /not a PALETTE product/);
});
