import { test } from "node:test";
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { Voxels } from "../src/voxels.mjs";
import { canopyTrees, growTree } from "../src/trees.mjs";

// a canopy map with round crowns on flat ground at y 0: a tall broad one, a small one, a tall narrow one (a conifer)
function map(n) {
  const chm = new Float32Array(n * n);
  const crown = (cx, cz, h, r, fall) => { for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) { const d = Math.hypot(x - cx, z - cz); if (d <= r) chm[z * n + x] = Math.max(chm[z * n + x], h - d * fall); } };
  crown(9, 9, 14, 7, 0.6); crown(26, 10, 6, 2.5, 0.8); crown(10, 28, 22, 3.5, 2.5);
  return chm;
}
const N = 36, H = 30, ground = () => 0, wood = (c) => c && /_(log|wood|leaves)$/.test(c.block);
const run = (g, o = {}) => canopyTrees(g, { chm: map(N), n: N, ground, ...o });

test("one tree per crown, at its height, a trunk from the ground under the treetop", () => {
  const g = new Grid([N, H, N]), r = run(g);
  assert.equal(r.trees.length, 3);
  const tall = r.trees.find((t) => t.height === 14), small = r.trees.find((t) => t.height === 6), narrow = r.trees.find((t) => t.height === 22);
  assert.ok(tall && small && narrow);
  assert.deepEqual(tall.at, [9, 9]);
  assert.equal(tall.form, "broadleaf"); assert.equal(narrow.form, "conifer");
  for (const t of r.trees) assert.match(g.get(t.at[0], 1, t.at[1])?.block ?? "", /_log$/, `rooted: ${t.at}`);
  assert.ok(r.leaves > 0 && r.logs > 0);
});

test("the tree meets the measured top and stays under it (within a block)", () => {
  const g = new Grid([N, H, N]), chm = map(N), r = run(g);
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) for (let y = H - 1; y > 0; y--) {
    if (!wood(g.get(x, y, z))) continue;
    assert.ok(y <= Math.round(chm[z * N + x]) + 1, `${x},${y},${z} over the canopy (${chm[z * N + x].toFixed(1)})`); break; }
  // and reaches it: each tree's highest block is within a block of its height
  for (const t of r.trees) { let top = 0; const reach = 8;
    for (let z = t.at[1] - reach; z <= t.at[1] + reach; z++) for (let x = t.at[0] - reach; x <= t.at[0] + reach; x++) for (let y = 1; y < H; y++) if (x >= 0 && z >= 0 && x < N && z < N && wood(g.get(x, y, z))) top = Math.max(top, y);
    assert.ok(Math.abs(top - t.height) <= 1, `tree at ${t.at}: top ${top}, measured ${t.height}`); }
});

test("the crown is joined to its trunk (most of a tree's blocks reach the ground through wood and leaves)", () => {
  const g = new Grid([N, H, N]), r = run(g);
  for (const t of r.trees) {
    const seen = new Set(), stack = [[t.at[0], 1, t.at[1]]], key = (p) => p.join(",");
    while (stack.length) { const p = stack.pop(), k = key(p); if (seen.has(k) || !wood(g.get(...p))) continue; seen.add(k);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) if (dx || dy || dz) stack.push([p[0] + dx, p[1] + dy, p[2] + dz]); }
    let all = 0; const reach = 8;
    for (let z = t.at[1] - reach; z <= t.at[1] + reach; z++) for (let x = t.at[0] - reach; x <= t.at[0] + reach; x++) for (let y = 1; y < H; y++)
      if (x >= 0 && z >= 0 && x < N && z < N && wood(g.get(x, y, z)) && Math.abs(x - t.at[0]) + Math.abs(z - t.at[1]) <= reach) all++;
    assert.ok(seen.size >= all * 0.85, `tree at ${t.at}: ${seen.size} of ${all} joined`);
  }
});

test("a rebuild grows the same trees", () => {
  const a = new Voxels([N, H, N]), b = new Voxels([N, H, N]); run(a); run(b);
  assert.deepEqual([...a.data].map((v) => a.palette[v] && a.palette[v].block + JSON.stringify(a.palette[v].state)), [...b.data].map((v) => b.palette[v] && b.palette[v].block + JSON.stringify(b.palette[v].state)));
});

test("no tree where the ground isn't open, and nothing is overwritten", () => {
  const g = new Grid([N, H, N]);
  g.set(9, 8, 9, "stone"); g.set(26, 4, 10, "stone");
  const r = run(g, { open: (x, z) => x > 18 || z > 20 });
  assert.equal(r.trees.length, 2);
  assert.equal(g.get(9, 8, 9).block, "minecraft:stone"); assert.equal(g.get(26, 4, 10).block, "minecraft:stone");
  for (let z = 0; z <= 20; z++) for (let x = 0; x <= 18; x++) for (let y = 1; y < H; y++) assert.ok(!wood(g.get(x, y, z)), `${x},${y},${z} grew where it isn't open`);
});

test("species from the caller: a form, or blocks", () => {
  const g = new Grid([N, H, N]), r = run(g, { species: (m, t) => (t.height < 10 ? "palm" : { log: "dark_oak_log", leaves: "dark_oak_leaves" }) });
  assert.equal(r.trees.find((t) => t.height === 6).form, "palm");
  assert.equal(r.trees.find((t) => t.height === 14).log, "dark_oak_log");
});

test("growTree: a palm is a bare trunk under a head of fronds; every form stays rooted and in bounds", () => {
  for (const species of ["palm", "conifer", "broadleaf", { form: "broadleaf", log: "birch_log", leaves: "birch_leaves" }]) {
    const g = new Voxels([24, 24, 24]), r = growTree(g, { at: [12, 12], base: 0, height: 14, species, seed: 7 });
    assert.match(g.get(12, 1, 12).block, /_log$/);
    assert.ok(r.logs > 5 && r.leafCount > 10, `${JSON.stringify(species)}: ${r.logs} logs, ${r.leafCount} leaves`);
    let top = 0; for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) for (let z = 0; z < 24; z++) if (g.get(x, y, z)) top = y;
    assert.ok(top <= 14 && top >= 12, `${JSON.stringify(species)}: top ${top}`);
    if (species === "palm") for (let y = 1; y <= 8; y++) for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) assert.equal(g.get(12 + dx, y, 12 + dz), null, "a palm's trunk is bare");
  }
});
