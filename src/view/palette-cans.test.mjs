import { test } from "node:test";
import assert from "node:assert/strict";
import { allowedPalette, withAdditions, filterToPalette } from "./palette-cans.mjs";

const ART = {
  palette: { manifest: ["minecraft:stone_bricks", "minecraft:white_terracotta", "minecraft:dark_oak_log"] },
};

test("allowedPalette returns bare ids of the manifest", () => {
  const set = allowedPalette(ART);
  assert.ok(set.has("stone_bricks"));
  assert.ok(set.has("white_terracotta"));
  assert.ok(!set.has("minecraft:stone_bricks")); // bare, not namespaced
  assert.equal(set.size, 3);
});

test("allowedPalette ∪ additions (concept-justified add-back), bare or namespaced", () => {
  const set = allowedPalette(ART, ["minecraft:spruce_door", "lantern"]);
  assert.ok(set.has("spruce_door"));
  assert.ok(set.has("lantern"));
  assert.equal(set.size, 5);
});

test("withAdditions extends the manifest, namespaced + sorted + deduped + idempotent", () => {
  const a1 = withAdditions(ART, ["minecraft:spruce_door"]);
  assert.deepEqual(a1.palette.manifest, [
    "minecraft:dark_oak_log",
    "minecraft:spruce_door",
    "minecraft:stone_bricks",
    "minecraft:white_terracotta",
  ]);
  // idempotent: adding an already-present material changes nothing
  const a2 = withAdditions(a1, ["spruce_door", "minecraft:stone_bricks"]);
  assert.deepEqual(a2.palette.manifest, a1.palette.manifest);
  // original untouched (shallow clone)
  assert.equal(ART.palette.manifest.length, 3);
});

test("filterToPalette nulls off-palette cells and tallies kept/dropped", () => {
  const allowed = allowedPalette(ART);
  const grid = [
    ["stone_bricks", "lava", null],
    ["minecraft:white_terracotta", "diamond_block", "dark_oak_log"],
  ];
  const { grid: out, kept, dropped } = filterToPalette(grid, allowed);
  assert.equal(kept, 3); // stone_bricks, white_terracotta, dark_oak_log
  assert.equal(dropped, 2); // lava, diamond_block
  assert.equal(out[0][1], null); // lava dropped
  assert.equal(out[1][1], null); // diamond_block dropped
  assert.equal(out[1][0], "minecraft:white_terracotta"); // namespaced kept as written
  assert.equal(out[0][2], null); // air stays air
});
