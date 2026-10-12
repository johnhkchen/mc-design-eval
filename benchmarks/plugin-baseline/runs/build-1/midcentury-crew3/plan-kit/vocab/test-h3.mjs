// Smoke test for vocab/h3.mjs: each helper once on a fresh grid. Checks that everything it wrote lies inside the
// footprint it was given, that it keeps the states it promises, that the lane stays open, and that it refuses non-air.
// Run: node vocab/test-h3.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const SIZE = [40, 9, 40];
const fresh = () => new Grid(SIZE);

// every non-air cell g holds must sit inside the box [lo, hi]
function insideOnly(g, [lo, hi], name) {
  for (const c of g.solids()) {
    const [x, y, z] = c.pos;
    const ok = x >= lo[0] && x <= hi[0] && y >= lo[1] && y <= hi[1] && z >= lo[2] && z <= hi[2];
    assert.ok(ok, `${name} wrote outside its footprint at ${x},${y},${z}`);
  }
}
const at = (g, x, y, z) => g.blockAt(x, y, z);
const state = (g, x, y, z) => g.get(x, y, z).state ?? {};

// post, beam_line
{
  let g = fresh();
  assert.equal(h3.post(g, 5, 5).placed, 3);
  insideOnly(g, [[5, 2, 5], [5, 4, 5]], "post");
  assert.equal(at(g, 5, 3, 5), "minecraft:dark_oak_log");
  assert.equal(state(g, 5, 3, 5).axis, "y");

  g = fresh();
  assert.equal(h3.beam_line(g, 10).placed, 24);
  insideOnly(g, [[10, 5, 5], [10, 5, 28]], "beam_line");
  assert.equal(state(g, 10, 5, 12).axis, "z");

  // refusal: a stone already in the way is kept and reported; overwrite replaces it
  g = fresh();
  g.set(5, 3, 5, "stone");
  const r = h3.post(g, 5, 5);
  assert.equal(at(g, 5, 3, 5), "minecraft:stone");
  assert.deepEqual(r.skipped, [[5, 3, 5, "minecraft:stone"]]);
  h3.post(g, 5, 5, 2, 4, { overwrite: true });
  assert.equal(at(g, 5, 3, 5), "minecraft:dark_oak_log");
}

// orange_entry: both door halves, the panels, the transom
{
  const g = fresh();
  h3.orange_entry(g, 19, 9);
  insideOnly(g, [[18, 2, 9], [20, 4, 9]], "orange_entry");
  assert.equal(at(g, 19, 2, 9), "minecraft:acacia_door");
  assert.equal(state(g, 19, 2, 9).half, "lower");
  assert.equal(state(g, 19, 3, 9).half, "upper");
  assert.equal(state(g, 19, 2, 9).facing, "north");
  assert.equal(at(g, 18, 3, 9), "minecraft:orange_concrete");
  assert.equal(at(g, 20, 4, 9), "minecraft:orange_concrete");
  assert.equal(at(g, 19, 4, 9), "minecraft:orange_concrete");
}

// stepping_pad: replaces the sand/dirt on its own row, writes nothing below y=0
{
  const g = fresh();
  g.set(19, 0, 1, "sand");
  h3.stepping_pad(g, 18, 1);
  insideOnly(g, [[18, 0, 1], [20, 0, 1]], "stepping_pad");
  assert.equal(at(g, 19, 0, 1), "minecraft:smooth_stone");
}

// barrel_cactus: two cells, no sand written
{
  const g = fresh();
  assert.equal(h3.barrel_cactus(g, 23, 4).placed, 2);
  insideOnly(g, [[23, 1, 4], [23, 2, 4]], "barrel_cactus");
  assert.equal(at(g, 23, 1, 4), "minecraft:cactus");
}

// patio_table: fence, top, two chairs facing the table, lane on row z+-1 left open
{
  const g = fresh();
  h3.patio_table(g, 20, 27);
  insideOnly(g, [[19, 1, 27], [21, 2, 27]], "patio_table");
  assert.equal(state(g, 19, 1, 27).facing, "west");
  assert.equal(state(g, 21, 1, 27).facing, "east");
  assert.equal(state(g, 20, 2, 27).type, "bottom");
  for (const z of [26, 28]) for (const y of [1, 2]) assert.equal(at(g, 20, y, z), "minecraft:air", `lane z=${z} y=${y}`);
}

// panel_wall: open trapdoors on the wall side, halves alternating
{
  const g = fresh();
  h3.panel_wall(g, 12, 2, 4, 13, "north");
  insideOnly(g, [[12, 2, 13], [12, 4, 13]], "panel_wall");
  assert.equal(state(g, 12, 2, 13).open, "true");
  assert.equal(state(g, 12, 2, 13).facing, "north");
  assert.deepEqual([2, 3, 4].map((y) => state(g, 12, y, 13).half), ["bottom", "top", "bottom"]);
}

// coffee_table: the slab on the floor and the pot beside it
{
  const g = fresh();
  h3.coffee_table(g, 14, 22, 1);
  insideOnly(g, [[14, 1, 22], [15, 1, 22]], "coffee_table");
  assert.equal(at(g, 14, 1, 22), "minecraft:spruce_slab");
  assert.equal(at(g, 15, 1, 22), "minecraft:flower_pot");
}

// galley_kitchen: kitchen box x=11..15 z=9..13, lane open on z=10..11
{
  const g = fresh();
  const r = h3.galley_kitchen(g, 11, 15, 9);
  insideOnly(g, [[11, 2, 9], [15, 4, 13]], "galley_kitchen");
  assert.equal(r.skipped.length, 0);
  assert.equal(at(g, 11, 2, 9), "minecraft:iron_block");
  assert.equal(at(g, 12, 3, 9), "minecraft:smoker");
  assert.equal(at(g, 14, 3, 9), "minecraft:furnace");
  assert.equal(at(g, 12, 3, 12), "minecraft:spruce_slab");
  assert.equal(at(g, 12, 4, 9), "minecraft:spruce_trapdoor");
  for (const z of [10, 11]) for (let x = 11; x <= 15; x++) for (const y of [2, 3]) assert.equal(at(g, x, y, z), "minecraft:air", `lane ${x},${y},${z}`);
}

console.log("h3 ok: 9 helpers, footprints, states, lanes and refusals checked");
