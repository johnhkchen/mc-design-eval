// Tests for vocab/base.mjs: the palette constants match palette.json exactly, footprint and rng behave.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as base from "../vocab/base.mjs";
import { rng, onFootprint, FOOTPRINT, SIZE } from "../vocab/base.mjs";

const palette = JSON.parse(readFileSync(fileURLToPath(new URL("../palette.json", import.meta.url)), "utf8"));
const paletteIds = [...Object.values(palette.roles).flat(), ...palette.objects].sort();
const constantIds = Object.entries(base).filter(([k, v]) => typeof v === "string" && k === k.toUpperCase()).map(([, v]) => v).sort();

test("palette constants are exactly the palette.json ids", () => {
  assert.deepEqual(constantIds, [...new Set(paletteIds)].sort());
  assert.equal(new Set(paletteIds).size, paletteIds.length, "no id listed twice in palette.json");
});

test("rng is seeded: same seed, same sequence; values in [0, 1)", () => {
  const a = rng(42), b = rng(42), c = rng(43);
  const seqA = Array.from({ length: 50 }, () => a());
  assert.deepEqual(seqA, Array.from({ length: 50 }, () => b()));
  assert.notDeepEqual(seqA, Array.from({ length: 50 }, () => c()));
  assert.ok(seqA.every((v) => v >= 0 && v < 1));
});

test("footprint: buildable rectangle, apron and lawn scraps are in; outside the plot is out", () => {
  assert.equal(onFootprint(4, 4), true);
  assert.equal(onFootprint(147, 147), true);
  assert.equal(onFootprint(75, 150), true, "south apron");
  assert.equal(onFootprint(75, 158), true, "steps foot");
  assert.equal(onFootprint(2, 2), false, "outside the lawn scraps");
  assert.equal(onFootprint(3, 1), false, "x 3 is outside the x 4..7 scrap");
  assert.equal(onFootprint(1, 147), true, "west lawn scrap x 0..7 z 144..151");
  assert.equal(onFootprint(1, 143), false, "x 1 at z 143 is above that scrap");
  assert.equal(onFootprint(53, 156), false, "beside the steps foot (x 56..95 only)");
  assert.equal(FOOTPRINT.length, 5);
  assert.deepEqual(SIZE, [153, 51, 159]);
});
