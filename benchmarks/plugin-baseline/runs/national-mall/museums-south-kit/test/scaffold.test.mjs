// Scaffold checks: the palette is real and is exactly base.mjs's constants, the site maps are brief.txt's rows, the
// PRNG is seeded, and make.sh turns the stubs into a valid 1.21.1 build.nbt. Run: node --test test/scaffold.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as base from "../vocab/base.mjs";

const kit = join(dirname(fileURLToPath(import.meta.url)), "..");
const MCD = "/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs";
const STRUCTURE = "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
const palette = JSON.parse(readFileSync(join(kit, "palette.json"), "utf8"));
const paletteIds = [...new Set(Object.values(palette.roles).flat())].sort();

test("rng is seeded and in [0, 1)", () => {
  const a = base.rng(7), b = base.rng(7), c = base.rng(8);
  const xs = Array.from({ length: 50 }, () => a());
  assert.deepEqual(xs, Array.from({ length: 50 }, () => b()));
  assert.notEqual(xs[0], c());
  assert.ok(xs.every((x) => x >= 0 && x < 1));
});

test("inEllipse is the plan's E(cx, cz, rx, rz) test", () => {
  assert.equal(base.inEllipse(10, 5, 10, 5, 2, 2), true);
  assert.equal(base.inEllipse(12, 5, 10, 5, 2, 2), true);
  assert.equal(base.inEllipse(13, 5, 10, 5, 2, 2), false);
});

test("palette.json ids are exactly the palette constants in base.mjs", () => {
  const constants = Object.values(base).filter((v) => typeof v === "string").sort();
  assert.deepEqual(constants, paletteIds);
});

test("every palette id exists in 1.21.1 (mcd blocks --check)", () => {
  const out = execFileSync("node", [MCD, "blocks", "--check", paletteIds.join(",")], { encoding: "utf8" });
  assert.match(out, /"unknown":\s*\[\s*\]/);
});

test("site maps are brief.txt's footprint and ground rows, verbatim", () => {
  const rows = readFileSync(join(kit, "brief.txt"), "utf8").split("\n");
  assert.deepEqual(base.NASM_FOOTPRINT, rows.slice(10, 41));
  assert.deepEqual(base.NASM_GROUND, rows.slice(42, 73));
  assert.deepEqual(base.NMAI_FOOTPRINT, rows.slice(76, 105));
  assert.deepEqual(base.NMAI_GROUND, rows.slice(106, 135));
});

test("every footprint cell has a ground value of 0 or 1, and every ground value sits in the footprint", () => {
  for (const { footprint, ground } of Object.values(base.SITE_MAPS)) {
    footprint.forEach((row, z) => [...row].forEach((ch, x) => {
      const gch = ground[z][x];
      if (ch === "#") assert.ok(gch === "0" || gch === "1", `ground at row ${z} col ${x} is ${gch}`);
      else assert.equal(gch, ".", `ground outside footprint at row ${z} col ${x}`);
    }));
  }
});

test("make.sh builds a valid build.nbt from the stubs", async () => {
  execFileSync(join(kit, "make.sh"), [], { cwd: kit, stdio: "pipe" });
  const { load } = await import(pathToFileURL(STRUCTURE).href);
  const g = load(join(kit, "build.nbt"));
  assert.deepEqual(g.size, base.SITE_SIZE);
  assert.equal(g.dataVersion, 3955);
  let ground = 0;
  for (const { footprint, ground: map } of Object.values(base.SITE_MAPS)) {
    footprint.forEach((row, z) => [...row].forEach((ch, x) => { if (ch === "#") ground += Number(map[z][x]) + 1; }));
  }
  assert.equal(g.cells.size, ground);
  assert.equal(g.blockAt(5, 1, 5), "minecraft:grass_block");
  assert.equal(g.blockAt(5, 0, 5), "minecraft:coarse_dirt");
});
