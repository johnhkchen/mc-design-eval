// Tests for vocab/h1.mjs: every helper is called once on an empty grid, and what it wrote stays inside the footprint it
// was given. Run with: node vocab/test-h1.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const newGrid = () => new Grid([153, 51, 159], { dataVersion: 3955 });
const id = (g, x, y, z) => g.blockAt(x, y, z).replace(/^minecraft:/, "");

// Every solid cell in g lies inside the box [x0, x1] x [y0, y1] x [z0, z1].
function assertInside(g, [x0, x1], [y0, y1], [z0, z1], what) {
  const bad = g.solids().filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  assert.deepEqual(bad.map((c) => c.pos), [], `${what} wrote outside its footprint`);
}

// Highest solid y in a column.
const topY = (g, x, z) => Math.max(...g.solids().filter((c) => c.pos[0] === x && c.pos[2] === z).map((c) => c.pos[1]));

test("podium writes its box, y 0..2, and leaves the ground alone unless asked", () => {
  const g = newGrid();
  const r = h1.podium(g, 8, 8, 20, 20);
  assertInside(g, [8, 20], [0, 2], [8, 20], "podium");
  assert.equal(r.placed, 13 * 13 * 3);
  assert.equal(id(g, 14, 2, 8), "smooth_stone_slab", "outer ring coping");
  assert.equal(id(g, 14, 2, 14), "polished_andesite", "deck");

  const ground = newGrid();
  ground.set(14, 0, 14, "grass_block");
  assert.equal(h1.podium(ground, 8, 8, 20, 20).refused.length, 1, "grass under the plinth is refused by default");
  assert.equal(id(ground, 14, 0, 14), "grass_block");
  h1.podium(ground, 8, 8, 20, 20, { groundOver: true });
  assert.equal(id(ground, 14, 0, 14), "stone_bricks", "groundOver lets the y 0 course replace grass");
});

test("column writes its 3x3, base to capital; tall columns reach y 36", () => {
  const g = newGrid();
  h1.column(g, 17, 17);
  assertInside(g, [16, 18], [3, 19], [16, 18], "column");
  assert.equal(id(g, 17, 3, 17), "polished_andesite");
  assert.equal(id(g, 17, 19, 17), "smooth_stone");
  const tall = newGrid();
  h1.column(tall, 53, 134, 36);
  assertInside(tall, [52, 54], [3, 36], [133, 135], "tall column");
  assert.throws(() => h1.column(newGrid(), 17, 17, 3), RangeError);
});

test("roof_cell follows the d-table, is a closed shell, and rims the top deck", () => {
  const g = newGrid();
  h1.roof_cell(g, 20, 60); // d = 10, surface 27, tile terracotta (band 3)
  assertInside(g, [20, 20], [23, 27], [60, 60], "roof_cell");
  assert.equal(topY(g, 20, 60), 27);
  assert.equal(id(g, 20, 27, 60), "yellow_terracotta");
  assert.equal(id(g, 20, 26, 60), "yellow_terracotta", "column is filled below the surface");

  const eave = newGrid();
  h1.roof_cell(eave, 10, 60); // d = 0, fascia and soffit
  assert.equal(id(eave, 10, 24, 60), "smooth_stone");
  assert.equal(id(eave, 10, 23, 60), "smooth_stone");

  const deck = newGrid();
  h1.roof_cell(deck, 40, 40); // d = 30, rim with gold corner
  assert.equal(topY(deck, 40, 40), 42);
  assert.equal(id(deck, 40, 42, 40), "gold_block");
  assert.throws(() => h1.roof_cell(newGrid(), 9, 60), RangeError);
});

test("corner_flick rises from y 28 to a gold tip at y 31 on the corner cell", () => {
  const g = newGrid();
  h1.corner_flick(g, "nw");
  assertInside(g, [10, 13], [28, 31], [10, 13], "corner_flick");
  assert.equal(id(g, 10, 31, 10), "gold_block");
  assert.equal(id(g, 13, 28, 13), "stone_stairs");
  assert.equal(g.get(13, 28, 13).state.facing, "north");
  assert.throws(() => h1.corner_flick(newGrid(), "xx"), RangeError);
});

test("glass_wall keeps mullions, transoms and door air where the plan puts them", () => {
  const g = newGrid();
  const doors = [[60, 63], [66, 69], [82, 85], [88, 91]];
  h1.glass_wall(g, 55, 96, 130, 3, 36, doors);
  assertInside(g, [55, 96], [3, 36], [130, 130], "glass_wall");
  assert.equal(id(g, 60, 4, 130), "air", "door air at y 3..5");
  assert.equal(id(g, 62, 6, 130), "glass_pane", "glass above the door (x 61 is a mullion)");
  assert.equal(id(g, 55, 10, 130), "polished_deepslate", "mullion at x0");
  assert.equal(id(g, 96, 10, 130), "polished_deepslate", "mullion at x1");
  assert.equal(id(g, 57, 9, 130), "polished_deepslate", "transom at y 9");
  assert.equal(id(g, 57, 10, 130), "glass_pane");
});

test("chandelier hangs its lantern from the chain above it, within its footprint", () => {
  const g = newGrid();
  h1.chandelier(g, 66, 125);
  assertInside(g, [65, 67], [26, 36], [124, 126], "chandelier");
  assert.equal(id(g, 66, 36, 125), "chain");
  assert.equal(g.get(66, 29, 125).state.hanging, "true");
  assert.equal(id(g, 65, 27, 124), "quartz_slab");
});

test("roof_light replaces the topmost roof tile and refuses an empty column", () => {
  const g = newGrid();
  h1.roof_cell(g, 20, 60);
  const r = h1.roof_light(g, 20, 60);
  assert.equal(r.placed, 1);
  assert.equal(id(g, 20, 27, 60), "ochre_froglight");
  assert.equal(h1.roof_light(newGrid(), 20, 60).refused.length, 1);
});

test("topiary_cone stands on the ground course, 3x3 tapering to one leaf at y 5", () => {
  const g = newGrid();
  h1.topiary_cone(g, 90, 146);
  assertInside(g, [89, 91], [1, 5], [145, 147], "topiary_cone");
  assert.equal(topY(g, 90, 146), 5);
  assert.equal(g.get(90, 1, 146).state.persistent, "true");
  assert.equal(g.solids().filter((c) => c.pos[1] === 5).length, 1);
});

test("a helper never overwrites: a second call on the same cells places nothing", () => {
  const g = newGrid();
  h1.column(g, 17, 17);
  const again = h1.column(g, 17, 17);
  assert.equal(again.placed, 0);
  assert.equal(again.refused.length, 9 * 17, "every cell of the first call is refused, not overwritten");
});
