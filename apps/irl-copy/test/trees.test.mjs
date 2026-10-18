import { test } from "node:test";
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { canopyTrees } from "../src/trees.mjs";

// a canopy map with two round crowns: a tall one (12) and a small one (6), on flat ground at y 0
function map(n) {
  const chm = new Float32Array(n * n);
  const crown = (cx, cz, h, r) => { for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) { const d = Math.hypot(x - cx, z - cz); if (d <= r) chm[z * n + x] = Math.max(chm[z * n + x], h - d * 0.8); } };
  crown(6, 6, 12, 4); crown(16, 14, 6, 2.5);
  return chm;
}

test("one tree per crown, at its height, with a trunk to the ground under the treetop", () => {
  const n = 22, g = new Grid([n, 20, n]), chm = map(n);
  const r = canopyTrees(g, { chm, n, ground: () => 0 });
  assert.equal(r.trees.length, 2);
  const tall = r.trees.find((t) => t.height === 12), small = r.trees.find((t) => t.height === 6);
  assert.ok(tall && small);
  assert.deepEqual(tall.at, [6, 6]);
  for (let y = 1; y <= 4; y++) assert.match(g.get(6, y, 6).block, /_log$/);
  assert.match(g.get(6, 12, 6).block, /_leaves$/);
  assert.ok(!g.get(6, 13, 6) || /air$/.test(g.get(6, 13, 6).block));
});

test("no tree where the ground isn't open, and nothing is overwritten", () => {
  const n = 22, g = new Grid([n, 20, n]), chm = map(n);
  g.set(6, 5, 6, "stone");
  const r = canopyTrees(g, { chm, n, ground: () => 0, open: (x) => x > 11 });
  assert.equal(r.trees.length, 1);
  assert.equal(g.get(6, 5, 6).block, "minecraft:stone");
});
