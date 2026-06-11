// T-110-01 (E-28) — the role-family gate's MONOTONE PROOF over committed records.
//
// The live skin/grammar gates moved from metric "dominant" to metric "own" (the zone's declared
// vocabulary: dominant ∪ preserve — the material-map roles at the renaming seam). E-28 Rule 1
// demands the change be proven monotone: every previously passing view/record still passes. This
// suite replays the COMMITTED durable-skin records (the ones that carry both a per-zone byBlock
// census and the shipped policy) through ownCoverage + the own-metric gate and asserts no
// previously passing zone regresses. Records without a committed policy+census pair (challenge/
// styled — their policies live only in the live chain) are out of replay scope by design: the
// durable-skin pair exercises the identical gate arithmetic on the same census shape.
//
// Plus the structural property at gate level: own ⊇ dominant ⇒ the own gate passes wherever the
// dominant gate passes, for ANY census/policy pair.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { ownCoverage } from "./zone-fill.mjs";
import { coverageGate } from "./face-resemblance.mjs";

const REC = (p) => fileURLToPath(new URL(`../../benchmarks/sculpture/${p}`, import.meta.url));

/** Re-census a committed coverage block (per-zone {total, byBlock}) through ownCoverage. */
function replay(coverage, policy, threshold) {
  const hist = Object.fromEntries(Object.entries(coverage)
    .map(([z, c]) => [z, { total: c.total, byBlock: c.byBlock }]));
  const cov = ownCoverage(hist, policy);
  return {
    dominant: coverageGate(cov, { threshold, zones: policy, metric: "dominant" }),
    own: coverageGate(cov, { threshold, zones: policy, metric: "own" }),
    cov,
  };
}

for (const subject of ["cottage", "gatehouse"]) {
  const path = REC(`durable-skin/${subject}.json`);
  test(`monotone replay: committed durable-skin/${subject}.json passes the own-metric gate`, (t) => {
    if (!existsSync(path)) return t.skip(`no committed record at durable-skin/${subject}.json`);
    const rec = JSON.parse(readFileSync(path, "utf8"));
    const policy = rec.fill?.policy;
    const threshold = rec.coverageGate?.threshold ?? 0.5;
    assert.ok(policy && rec.coverage?.final, "record carries policy + final census");

    // the FINAL skin: recorded as passed under "dominant" — must pass under "own", zone by zone
    const fin = replay(rec.coverage.final, policy, threshold);
    assert.equal(rec.coverageGate.final.passed, true, "committed final gate was a pass");
    assert.equal(fin.dominant.passed, true, "replayed dominant gate agrees with the record");
    assert.equal(fin.own.passed, true, "own-metric gate passes everything that passed");
    for (const [zone, row] of Object.entries(fin.own.byZone)) {
      const before = fin.dominant.byZone[zone];
      if (before.passed) assert.equal(row.passed, true, `${zone}: passed dominant ⇒ passes own`);
      // both fractions present on every own-census row (AC: both fractions reported)
      assert.ok(fin.cov[zone].ownFraction == null || fin.cov[zone].dominantFraction !== undefined,
        `${zone}: census row reports both fractions`);
    }

    // the SPLAT-ONLY baseline: monotone direction only (own may pass where dominant failed — the
    // baseline gate stays pinned to "dominant" in the runner precisely for that reason)
    const splat = replay(rec.coverage.splatOnly, policy, threshold);
    for (const [zone, row] of Object.entries(splat.dominant.byZone)) {
      if (row.passed) assert.equal(splat.own.byZone[zone].passed, true,
        `${zone}: splat-only monotone direction`);
    }
  });
}

test("gate-level property: own ⊇ dominant ⇒ own gate passes wherever the dominant gate passes", () => {
  // a small grid of censuses crossing the threshold from both sides, with and without preserves
  const cases = [
    { byBlock: { a: 51, b: 49 }, policy: { dominant: "a", preserve: ["b"] } },
    { byBlock: { a: 49, b: 51 }, policy: { dominant: "a", preserve: ["b"] } },   // dominant fails, own passes
    { byBlock: { a: 49, b: 2, c: 49 }, policy: { dominant: "a", preserve: ["b"] } }, // both fail
    { byBlock: { a: 100 }, policy: { dominant: "a", preserve: [] } },
    { byBlock: { a: 50, b: 50 }, policy: { dominant: "a", preserve: [] } },
  ];
  for (const [i, c] of cases.entries()) {
    const total = Object.values(c.byBlock).reduce((s, n) => s + n, 0);
    const cov = ownCoverage({ z: { total, byBlock: c.byBlock } }, { z: c.policy });
    const dom = coverageGate(cov, { zones: { z: c.policy }, metric: "dominant" });
    const own = coverageGate(cov, { zones: { z: c.policy }, metric: "own" });
    assert.ok(cov.z.ownFraction >= cov.z.dominantFraction, `case ${i}: ownFraction ≥ dominantFraction`);
    if (dom.passed) assert.equal(own.passed, true, `case ${i}: dominant pass ⇒ own pass`);
  }
});

test("the church refusal census: literal-name read fails, role-family read passes (the T-110 witness)", () => {
  // the committed T-107 census decomposition, verbatim from reconstructed/church.json
  const band0 = {
    total: 2082,
    byBlock: { polished_basalt: 1225, stone: 681, black_stained_glass: 100, dark_oak_planks: 76 },
  };
  const policy = { band0: { dominant: "stone", preserve: ["polished_basalt", "black_stained_glass"] } };
  const cov = ownCoverage({ band0 }, policy);
  assert.equal(cov.band0.dominantFraction, 0.327);
  assert.equal(cov.band0.ownFraction, 0.963); // stone + basalt + glazing — the band's declared set
  assert.equal(coverageGate(cov, { zones: policy, metric: "dominant" }).passed, false);
  assert.equal(coverageGate(cov, { zones: policy, metric: "own" }).passed, true);
});
