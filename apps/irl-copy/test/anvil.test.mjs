import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { gunzipSync, inflateSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Voxels } from "../src/voxels.mjs";
import { writeWorld, overworldType } from "../src/anvil.mjs";

test("a world taller than 320 gets a datapack raising the overworld, from a sparse volume", () => {
  const v = new Voxels([20, 740, 20], { sparse: true }); for (let z = 0; z < 20; z++) for (let x = 0; x < 20; x++) v.set(x, 0, z, "stone");
  for (let y = 1; y < 730; y++) v.set(5, y, 5, "glass");
  const dir = mkdtempSync(join(tmpdir(), "world-")), r = writeWorld(dir, v);
  assert.equal(r.chunks, 4); assert.ok(r.datapack);
  const t = JSON.parse(readFileSync(join(dir, "datapacks/irl-copy-tall/data/minecraft/dimension_type/overworld.json"), "utf8"));
  assert.equal(t.min_y, -64); assert.equal(t.height % 16, 0); assert.ok(-64 + t.height >= 740); assert.equal(t.logical_height, t.height);
  assert.equal(t.effects, "minecraft:overworld"); assert.equal(t.infiniburn, "#minecraft:infiniburn_overworld"); assert.equal(t.monster_spawn_light_level.max_inclusive, 7);
  assert.equal(JSON.parse(readFileSync(join(dir, "datapacks/irl-copy-tall/pack.mcmeta"), "utf8")).pack.pack_format, 48);
  assert.ok(gunzipSync(readFileSync(join(dir, "level.dat"))).includes("file/irl-copy-tall"));
  // every chunk carries an empty section at Y -1 (Chunky would otherwise clip later tall chunks at 256)
  const reg = readFileSync(join(dir, "region/r.0.0.mca")), off = reg.readUIntBE(0, 3) * 4096, nbt = inflateSync(reg.subarray(off + 5, off + 4 + reg.readUInt32BE(off)));
  const ys = []; for (let k = 0; k < nbt.length - 4; k++) if (nbt[k] === 1 && nbt[k + 1] === 0 && nbt[k + 2] === 1 && nbt[k + 3] === 89) ys.push((nbt[k + 4] << 24) >> 24);
  assert.equal(ys[0], -1); assert.ok(ys.includes(45));
  // a vanilla-height world is written as before: no datapack
  const low = mkdtempSync(join(tmpdir(), "world-")); writeWorld(low, new Voxels([16, 100, 16]).set(0, 0, 0, "stone"));
  assert.ok(!existsSync(join(low, "datapacks")));
  assert.equal(overworldType(300).height, 368);
});

test("sparse and dense volumes write the same region file", () => {
  const d = new Voxels([33, 50, 17]), s = new Voxels([33, 50, 17], { sparse: true });
  for (const v of [d, s]) { v.set(0, 0, 0, "stone"); v.set(32, 49, 16, "oak_stairs", { facing: "west" }); v.set(10, 20, 3, "glass"); }
  const a = mkdtempSync(join(tmpdir(), "w-")), b = mkdtempSync(join(tmpdir(), "w-"));
  writeWorld(a, d); writeWorld(b, s);
  const strip = (buf) => { const c = Buffer.from(buf); c.fill(0, 4096, 8192); return c; };     // the header's timestamps differ
  assert.ok(strip(readFileSync(join(a, "region/r.0.0.mca"))).equals(strip(readFileSync(join(b, "region/r.0.0.mca")))));
});
