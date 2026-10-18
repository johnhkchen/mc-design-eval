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
