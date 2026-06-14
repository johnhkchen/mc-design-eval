// T-137-01 (E-33) — the visibility-aware census's MONOTONE PROOF over committed records, the T-127
// cottage witness at unit level, and the AC's synthetic fully-occluded-band case on the REAL
// projection machinery.
//
// The per-view coverage precondition moved from "an empty census fails the view" to the
// visibility-aware arithmetic (face-resemblance.mjs visibilityAwareCoverage): a band with no
// visible cells from a view is excluded from THAT view's precondition; a band invisible from all
// views but present on the exposure skin is a NAMED failure. E-33 Rule 3 demands the monotone
// proof over committed records: every previously passing view still passes. This suite replays
// every committed multi-angle gate record's recorded byZone rows through the new arithmetic.
//
// Replay exposure note: the exposure census (the existence basis) is not in committed records and
// only influences bands invisible from EVERY view — no such band can exist in a previously
// PASSING view (its gated bands all had total > 0), so the monotone assertion is exposure-
// independent and replays with exposure {}. For the cottage witness, {} IS the measured truth:
// band1 has zero cells in the census identity (planCensusZoneOf routes the roof program over its
// whole y-range) — re-verified live by benchmarks/sculpture/visibility-witness.mjs.
//
// Witness provenance (T-138-02): the live cottage-patternbook record was ROTATED by the E-33
// re-run (the new build shows band1 on skin and judges 4/4 — the flip's refusal no longer exists
// at HEAD). The T-127 witness record is pinned VERBATIM at fixtures/
// cottage-patternbook.t127-retired.json — sha f5567754f77c… , the exact retired pin quoted in
// benchmarks/sculpture/pattern-book/proportion-baselines.json. The flip proof reads the fixture;
// the monotone sweep keeps reading every LIVE committed record.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { visibilityAwareCoverage } from "./face-resemblance.mjs";
import { occupancyFromCells } from "./occupancy.mjs";
import { surfaceZoneHistogram, ownCoverage } from "./zone-fill.mjs";

const REC_DIR = fileURLToPath(new URL("../../measurements/multi-angle", import.meta.url));
const RETIRED_T127_COTTAGE = fileURLToPath(
  new URL("./fixtures/cottage-patternbook.t127-retired.json", import.meta.url));
const GATE_SCHEMA = "multi-angle-gate/v1";

/** Recorded byZone row → a coverageGate-consumable census row (the record stores the gated
 *  metric's fraction as `fraction`; rebuild the metric-named field coverageGate reads). */
function rowFromRecord(r) {
  const own = r.metric === "own";
  return {
    total: r.total, byBlock: {}, dominant: r.dominant, own: r.own ?? null,
    dominantFraction: own ? (r.dominantFraction ?? null) : r.fraction,
    ownFraction: own ? r.fraction : null,
  };
}

function replayRecord(rec) {
  const zones = rec.zones?.policy;
  const threshold = rec.contract?.coverageThreshold ?? 0.5;
  const judged = (rec.views ?? []).filter((v) => v.coverage?.byZone);
  if (!zones || judged.length === 0) return null;
  const metric = judged.some((v) => Object.values(v.coverage.byZone).some((r) => r.metric === "own"))
    ? "own" : "dominant";
  const views = judged.map((v) => ({
    angle: v.angle,
    coverage: Object.fromEntries(Object.entries(v.coverage.byZone).map(([z, r]) => [z, rowFromRecord(r)])),
  }));
  return { rec, metric, result: visibilityAwareCoverage({ views, zones, exposure: {}, threshold, metric }), judged };
}

const recordFiles = existsSync(REC_DIR)
  ? readdirSync(REC_DIR).filter((f) => f.endsWith(".json")).sort()
  : [];

test("monotone replay: every committed gate view that passed coverage still passes (all records)", (t) => {
  if (recordFiles.length === 0) return t.skip("no committed multi-angle records");
  let replayedViews = 0, flipped = 0;
  for (const f of recordFiles) {
    const rec = JSON.parse(readFileSync(`${REC_DIR}/${f}`, "utf8"));
    if (rec.schema !== GATE_SCHEMA) continue;
    const rep = replayRecord(rec);
    if (!rep) continue;
    for (let i = 0; i < rep.judged.length; i++) {
      const before = rep.judged[i].coverage.passed;
      const view = rep.result.views[i];
      // the replayed legacy arithmetic must agree with the committed verdict (same numbers, same
      // gate — proves the replay reads the record faithfully before trusting the aware direction)
      assert.equal(view.legacy.passed, before, `${f} ${view.angle}: legacy replay agrees with the record`);
      if (before === true) {
        assert.equal(view.aware.passed, true, `${f} ${view.angle}: previously passing view still passes`);
      } else if (view.aware.passed) flipped++;
      replayedViews++;
    }
  }
  assert.ok(replayedViews > 0, "replayed at least one committed view");
  // the flip witness lives in the PINNED retired record (the live one was rotated by T-138-02);
  // live records may legitimately contain zero flips
  const fixtureRep = replayRecord(JSON.parse(readFileSync(RETIRED_T127_COTTAGE, "utf8")));
  for (const view of fixtureRep.result.views) {
    if (!view.legacy.passed && view.aware.passed) flipped++;
  }
  assert.ok(flipped > 0, "the class has at least one witness flip (the retired T-127 cottage fixture)");
});

test("the T-127 cottage witness (retired pin, sha-quoted in proportion-baselines.json): patternbook flips to aware-pass on all four views, band1 named, legacy beside it", () => {
  const rec = JSON.parse(readFileSync(RETIRED_T127_COTTAGE, "utf8"));
  const rep = replayRecord(rec);
  assert.equal(rep.judged.length, 4, "all four contract views replay");
  assert.equal(rep.result.visibility.byBand.band1.status, "not-on-skin",
    "band1 has zero cells in the census identity — named, not failed");
  assert.equal(rep.result.visibility.passed, true);
  for (const v of rep.result.views) {
    assert.equal(v.legacy.passed, false, `${v.angle}: the committed refusal arithmetic is preserved in the record`);
    assert.equal(v.aware.passed, true, `${v.angle}: the precondition no longer refuses on invisibility`);
    assert.equal(v.aware.byZone.band1.status, "not-visible-from-view");
    assert.equal(v.aware.byZone.band1.excluded, true);
  }
});

test("the cottage-baseline guard: a band the view CAN see keeps failing (t290 at fraction 0)", (t) => {
  const path = `${REC_DIR}/cottage-baseline.json`;
  if (!existsSync(path)) return t.skip("no committed cottage-baseline record");
  const rep = replayRecord(JSON.parse(readFileSync(path, "utf8")));
  for (const v of rep.result.views) {
    assert.ok((v.legacy.byZone.band1?.total ?? 0) > 0, `${v.angle}: band1 is visible in this record`);
    assert.equal(v.aware.passed, false, `${v.angle}: visibility-awareness pardons only invisibility`);
    assert.ok(v.aware.failures.some((x) => x.zone === "band1"), `${v.angle}: band1 still the named failure`);
  }
});

// ---- the synthetic fully-occluded band, on the real projection machinery --------------------------

const GATE_FACES = ["+x+z", "+x-z", "-x-z", "-x+z"];

/** A ring of 8 stone cells at y0 around a center cell: the center shares (column,row) with a
 *  nearer ring cell along EVERY 45° diagonal ray, so no gate view's projection contains it — but
 *  its top face is air-exposed (the exposure skin sees it; a camera straight above would). */
function ringFixture() {
  const cells = [];
  for (const x of [-1, 0, 1]) for (const z of [-1, 0, 1]) cells.push({ pos: [x, 0, z], block: "minecraft:stone" });
  const occ = occupancyFromCells(cells);
  const zoneOf = ([x, , z]) => (x === 0 && z === 0 ? "hidden" : "ring");
  return { occ, zoneOf };
}

test("synthetic: a band invisible from ALL gate views but on the exposure skin is a NAMED failure, not a free pass", () => {
  const { occ, zoneOf } = ringFixture();
  const zones = { hidden: { dominant: "stone" }, ring: { dominant: "stone" } };
  const views = GATE_FACES.map((a) => ({
    angle: a,
    coverage: ownCoverage(surfaceZoneHistogram(occ, zoneOf, { faces: [a], skin: "projection" }), zones),
  }));
  for (const v of views) assert.equal(v.coverage.hidden, undefined, `${v.angle}: the center cell is in no diagonal projection`);
  const exposure = surfaceZoneHistogram(occ, zoneOf, { skin: "exposure" });
  assert.equal(exposure.hidden.total, 1, "the exposure skin carries the hidden cell (top face air)");
  const r = visibilityAwareCoverage({ views, zones, exposure, metric: "own" });
  assert.deepEqual(r.visibility.failures, [{ band: "hidden", reason: "not-visible-from-any-view" }]);
  assert.equal(r.visibility.passed, false);
  for (const v of r.views) {
    assert.equal(v.aware.passed, false, `${v.angle}: the hidden band stays gated and fails — never a free pass`);
    assert.ok(v.aware.failures.some((x) => x.zone === "hidden"));
  }
});

test("synthetic: a DECLARED band with no cells anywhere is not-on-skin — excluded, named, views pass", () => {
  const { occ, zoneOf } = ringFixture();
  const zones = { ring: { dominant: "stone" }, ghost: { dominant: "bricks" } };
  const views = GATE_FACES.map((a) => ({
    angle: a,
    coverage: ownCoverage(surfaceZoneHistogram(occ, zoneOf, { faces: [a], skin: "projection" }), zones),
  }));
  const exposure = surfaceZoneHistogram(occ, zoneOf, { skin: "exposure" });
  const r = visibilityAwareCoverage({ views, zones, exposure, metric: "own" });
  assert.equal(r.visibility.byBand.ghost.status, "not-on-skin");
  assert.equal(r.visibility.passed, true);
  for (const v of r.views) {
    assert.equal(v.aware.passed, true, `${v.angle}: nothing to census is not a coverage failure`);
    assert.equal(v.aware.byZone.ghost.status, "not-visible-from-view");
    assert.equal(v.legacy.passed, false, `${v.angle}: the legacy arithmetic recorded beside it still refuses`);
  }
});
