import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { Voxels } from "../src/voxels.mjs";

test("a voxel volume writes a structure the toolkit reads back block for block", () => {
  const v = new Voxels([5, 4, 3]);
  v.set(0, 0, 0, "stone"); v.set(4, 3, 2, "oak_stairs", { facing: "north", half: "bottom" }); v.set(2, 1, 1, "minecraft:water", { level: 0 });
  v.set(1, 1, 1, "dirt"); v.set(1, 1, 1, "air");                         // set to air: left out
  assert.equal(v.get(1, 1, 1), null);
  assert.equal(v.get(4, 3, 2).block, "minecraft:oak_stairs");
  const f = join(mkdtempSync(join(tmpdir(), "vox-")), "t.nbt"), r = v.save(f);
  assert.deepEqual(r, { blocks: 3, palette: 3 });
  const g = load(f);
  assert.deepEqual(g.size, [5, 4, 3]);
  assert.equal(g.get(0, 0, 0).block, "minecraft:stone");
  assert.equal(g.get(4, 3, 2).state.facing, "north");
  assert.equal(g.get(2, 1, 1).state.level, "0");
  assert.ok(!g.get(1, 1, 1));
});

test("a sparse volume holds the same blocks as a dense one, allocates only touched sections, and saves the same file", async () => {
  const { SparseVoxels } = await import("../src/voxels.mjs");
  const d = new Voxels([40, 700, 33]), s = new Voxels([40, 700, 33], { sparse: true });
  assert.ok(s instanceof SparseVoxels && s instanceof Voxels && s.sparse && !d.sparse);
  for (const v of [d, s]) { v.set(0, 0, 0, "stone"); v.set(39, 699, 32, "oak_stairs", { facing: "east", half: "top" }); v.set(17, 333, 5, "glass"); v.set(17, 333, 5, "air"); v.set(3, 650, 30, "glowstone"); }
  assert.equal(s.sections, 4);                                  // a section stays allocated once written, even back to air
  for (const [x, y, z] of [[0, 0, 0], [39, 699, 32], [17, 333, 5], [3, 650, 30], [5, 5, 5]]) assert.deepEqual(s.get(x, y, z), d.get(x, y, z));
  assert.equal(s.count(), d.count());
  const i = d.at(3, 650, 30); assert.equal(s.cellAt(i), d.cellAt(i)); s.setCellAt(i, 0); d.setCellAt(i, 0); assert.equal(s.get(3, 650, 30), null);
  const a = [], b = []; d.forEachCell((i, v) => a.push([i, v])); s.forEachCell((i, v) => b.push([i, v])); assert.deepEqual(b.sort((p, q) => p[0] - q[0]), a);
  const dir = mkdtempSync(join(tmpdir(), "vox-")); d.save(join(dir, "d.nbt")); s.save(join(dir, "s.nbt"));
  const gd = load(join(dir, "d.nbt")), gs = load(join(dir, "s.nbt"));
  assert.deepEqual(gs.size, gd.size); assert.equal(gs.get(39, 699, 32).state.facing, "east"); assert.equal(gs.get(0, 0, 0).block, "minecraft:stone");
  s.growTo(900); assert.equal(s.size[1], 900); s.set(1, 880, 1, "stone"); assert.equal(s.get(1, 880, 1).block, "minecraft:stone");
  assert.equal(new Voxels([4, 4, 4]).sparse, undefined);                      // dense stays the default
});
