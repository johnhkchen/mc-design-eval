// Smoke test for vocab/h3.mjs: each helper once on a fresh 1.21.1 grid; every write lands inside its footprint.
// Run: node vocab/test-h3.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const fresh = () => new Grid([12, 12, 12], { dataVersion: 3955 });
const block = (g, x, y, z) => g.blockAt(x, y, z).replace("minecraft:", "");

// every cell the helper wrote lies in the box [x0, y0, z0, x1, y1, z1] (cells placed before the call, in skip, don't count)
function inside(g, [x0, y0, z0, x1, y1, z1], skip = []) {
  const pre = new Set(skip.map((c) => c.join(",")));
  for (const { pos: [x, y, z], block: b } of g.cells.values()) {
    if (pre.has(`${x},${y},${z}`)) continue;
    const ok = x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
    assert.ok(ok, `${b} at ${x},${y},${z} is outside the footprint ${[x0, y0, z0, x1, y1, z1]}`);
  }
  return g.cells.size;
}

// window: a pane in the opening; its west side connects to the stone beside it
{
  const g = fresh();
  g.set(2, 2, 5, "stone");
  const r = h3.window(g, [3, 2, 5], "south");
  assert.equal(r.placed, 1);
  assert.equal(block(g, 3, 2, 5), "glass_pane");
  assert.equal(g.get(3, 2, 5).state.west, "true");
  assert.equal(g.get(3, 2, 5).state.east, "false");
  inside(g, [3, 2, 5, 3, 2, 5], [[2, 2, 5]]);
}

// porch_posts: fence columns and a spruce deck; a stone already in the deck is refused, not overwritten
{
  const g = fresh();
  g.set(1, 0, 6, "stone");
  const r = h3.porch_posts(g, { xs: [1, 5], z: 7, y0: 1, y1: 2, deck: { x0: 1, x1: 5, z0: 6, z1: 7, y: 0 } });
  assert.equal(block(g, 1, 0, 6), "stone");
  assert.deepEqual(r.refused, [[1, 0, 6, "spruce_planks"]]);
  assert.equal(block(g, 5, 2, 7), "birch_fence");
  inside(g, [1, 0, 6, 5, 2, 7], [[1, 0, 6]]);
}

// pyramid_cap: 12 stairs in the ring, 4 tiles and 4 cap slabs inside
{
  const g = fresh();
  const r = h3.pyramid_cap(g, { x0: 4, z0: 0, x1: 7, z1: 3, y: 3 });
  assert.equal(r.placed, 12 + 4 + 4);
  assert.equal(block(g, 4, 3, 1), "deepslate_tile_stairs");
  assert.equal(g.get(4, 3, 1).state.facing, "east");
  assert.equal(block(g, 6, 4, 2), "deepslate_tile_slab");
  inside(g, [4, 3, 0, 7, 4, 3]);
}

// arch: upside-down stairs over the opening, full jambs either side
{
  const g = fresh();
  h3.arch(g, [4, 5, 3, 6], "south", "smooth_sandstone");
  assert.equal(block(g, 4, 3, 6), "smooth_sandstone_stairs");
  assert.equal(g.get(4, 3, 6).state.half, "top");
  assert.equal(block(g, 3, 3, 6), "smooth_sandstone");
  inside(g, [3, 3, 6, 6, 3, 6]);
}

// chimney_for: the plot 0 fire stands at [6,1,3], lit; footprint is the 3 x 3 column to the top
{
  const g = fresh();
  h3.chimney_for(g, "0");
  assert.equal(block(g, 6, 1, 3), "campfire");
  assert.equal(g.get(6, 1, 3).state.lit, "true");
  inside(g, [5, 0, 2, 7, 8, 4]);
}

// gun_pit: ring and pivot at y2, the trimmed circle cut at y3, the corners keep the deck
{
  const g = fresh();
  for (let x = 0; x <= 5; x++) for (let z = 0; z <= 5; z++) for (const y of [2, 3]) g.set(x, y, z, "polished_andesite");
  h3.gun_pit(g, 0, 0);
  assert.equal(block(g, 2, 2, 2), "polished_blackstone");
  assert.equal(block(g, 2, 2, 1), "iron_block");
  assert.equal(block(g, 1, 2, 1), "polished_andesite");
  assert.equal(block(g, 0, 2, 0), "polished_andesite");
  assert.equal(block(g, 2, 3, 2), "air");
  assert.equal(block(g, 0, 3, 0), "polished_andesite");
  inside(g, [0, 2, 0, 5, 3, 5]);
}

// lamp_post: fence post with a standing lantern on top; iron bars are refused outright
{
  const g = fresh();
  h3.lamp_post(g, [2, 1, 2]);
  assert.equal(block(g, 2, 2, 2), "lantern");
  assert.equal(g.get(2, 2, 2).state.hanging, "false");
  inside(g, [2, 1, 2, 2, 2, 2]);
  assert.throws(() => h3.lamp_post(fresh(), [2, 1, 2], { post: "iron_bars" }), /fence post/);
}

console.log("h3 ok: window, porch_posts, pyramid_cap, arch, chimney_for, gun_pit, lamp_post");
