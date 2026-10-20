// Tests for vocab/base.mjs and the scaffold: run with `node --test test/`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as base from "../vocab/base.mjs";

const palette = JSON.parse(readFileSync(new URL("../palette.json", import.meta.url), "utf8"));

test("GROUND map is 34 rows of 36 heights in 1..63", () => {
  assert.equal(base.GROUND.length, 34);
  for (const row of base.GROUND) {
    assert.equal(row.length, 36);
    for (const h of row) assert.ok(Number.isInteger(h) && h >= 1 && h <= 63, `height ${h}`);
  }
  assert.equal(base.GROUND[0][35], 1);    // north-east corner: low point
  assert.equal(base.GROUND[33][35], 63);  // south-east corner: high point
});

test("every palette.json id has a constant in base.mjs", () => {
  const values = new Set(Object.values(base).filter((v) => typeof v === "string"));
  const ids = [...Object.values(palette.roles).flat(), ...palette.objects];
  for (const id of ids) assert.ok(values.has(id), `${id} missing`);
});

test("rng(seed) is deterministic and in [0, 1)", () => {
  const a = base.rng(42), b = base.rng(42), c = base.rng(7);
  const seqA = Array.from({ length: 50 }, () => a());
  const seqB = Array.from({ length: 50 }, () => b());
  assert.deepEqual(seqA, seqB);
  assert.notDeepEqual(seqA, Array.from({ length: 50 }, () => c()));
  for (const v of seqA) assert.ok(v >= 0 && v < 1);
});

test("onTrail covers the reserved boxes and the diagonal, nothing else", () => {
  for (const [x, z] of [[67, 0], [68, 45], [67, 42], [79, 43], [78, 44], [79, 74], [60, 45], [61, 59], [78, 74], [79, 74], [96, 100], [97, 100]])
    assert.equal(base.onTrail(x, z), true, `${x},${z} should be trail`);
  for (const [x, z] of [[66, 0], [69, 0], [60, 44], [62, 50], [77, 74], [98, 100], [0, 0], [105, 100]])
    assert.equal(base.onTrail(x, z), false, `${x},${z} should not be trail`);
});

test("PLOT matches the plan: x 0..105, y 0..74, z 0..100", () => {
  assert.deepEqual(base.PLOT, [106, 75, 101]);
  assert.equal(base.HEIGHT_CAP, base.PLOT[1] - 1);
  assert.equal(base.LANTERN_POSTS.length, 13);
});
