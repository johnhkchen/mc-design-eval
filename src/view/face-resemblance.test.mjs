import { test } from "node:test";
import assert from "node:assert/strict";
import { loadBlockTable } from "../color/block-table.mjs";
import {
  faceResemblance, acceptIfCloser, coverageGate, acceptWithCoverage, DEFAULT_COVERAGE_THRESHOLD,
} from "./face-resemblance.mjs";

const TABLE = loadBlockTable();

/** A solid w×h RGBA image of one colour (full-foreground; no background pixels). */
function solid(w, h, [r, g, b]) {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) { const o = i << 2; data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255; }
  return { width: w, height: h, data };
}

const WHITE_TERRACOTTA = [210, 178, 161]; // table rgb
const DARK_OAK = [60, 47, 26]; // table rgb

test("faceResemblance scores a concept-matching face higher than a mismatched one", () => {
  const concept = solid(16, 16, WHITE_TERRACOTTA); // the cream plaster the concept shows
  const after = solid(16, 16, WHITE_TERRACOTTA); // painted to match → high agreement
  const before = solid(16, 16, DARK_OAK); // pre-paint dark wall → low agreement
  const sAfter = faceResemblance(after, concept, TABLE).score;
  const sBefore = faceResemblance(before, concept, TABLE).score;
  assert.ok(sAfter != null && sBefore != null);
  assert.ok(sAfter > sBefore, `expected after (${sAfter}) > before (${sBefore})`);
});

test("faceResemblance includes set agreement when an artifact is supplied", () => {
  const concept = solid(16, 16, WHITE_TERRACOTTA);
  const build = solid(16, 16, WHITE_TERRACOTTA);
  const artifact = { placements: [{ op: "voxel", pos: [0, 0, 0], block: "minecraft:white_terracotta" }] };
  const r = faceResemblance(build, concept, TABLE, { artifact });
  assert.ok(r.set !== null);
  assert.ok(r.set.score != null);
});

test("acceptIfCloser accepts strict improvement, rejects equal/worse (rollback)", () => {
  assert.equal(acceptIfCloser({ before: 0.3, after: 0.6 }).accepted, true);
  assert.equal(acceptIfCloser({ before: 0.6, after: 0.6 }).accepted, false); // equal → roll back
  assert.equal(acceptIfCloser({ before: 0.6, after: 0.4 }).accepted, false); // worse → roll back
  assert.equal(acceptIfCloser({ before: 0.5, after: 0.55, epsilon: 0.1 }).accepted, false); // under margin
  const r = acceptIfCloser({ before: 0.3, after: 0.6 });
  assert.equal(r.delta, 0.3);
});

test("acceptIfCloser treats a null after-score as no improvement", () => {
  assert.equal(acceptIfCloser({ before: 0.3, after: null }).accepted, false);
  assert.equal(acceptIfCloser({ before: null, after: 0.6 }).accepted, false);
});

/** Shorthand: a dominantCoverage-shaped record from zone→fraction (total defaults to 100). */
function cov(fractions, total = 100) {
  return Object.fromEntries(Object.entries(fractions).map(([z, f]) =>
    [z, { total, byBlock: {}, dominant: "x", dominantFraction: f }]));
}

test("coverageGate: every zone at/above threshold passes; ANY zone below fails the skin", () => {
  assert.equal(DEFAULT_COVERAGE_THRESHOLD, 0.5);
  assert.equal(coverageGate(cov({ base: 0.6, upper: 0.7, roof: 0.9 })).passed, true);
  const g = coverageGate(cov({ base: 0.6, upper: 0.13, roof: 0.9 }));
  assert.equal(g.passed, false);
  assert.deepEqual(g.failures.map((f) => f.zone), ["upper"]);
  assert.equal(g.byZone.base.passed, true);
});

test("coverageGate: boundary fraction === threshold passes; custom threshold respected", () => {
  assert.equal(coverageGate(cov({ upper: 0.5 })).passed, true);
  assert.equal(coverageGate(cov({ upper: 0.5 }), { threshold: 0.6 }).passed, false);
});

test("coverageGate: absence of evidence fails — missing policy zone, empty census, null fraction", () => {
  const zones = { base: {}, upper: {}, roof: {} };
  const missing = coverageGate(cov({ base: 0.9, upper: 0.9 }), { zones }); // roof never measured
  assert.equal(missing.passed, false);
  assert.deepEqual(missing.failures.map((f) => f.zone), ["roof"]);
  assert.equal(coverageGate(cov({ upper: 0.9 }, 0)).passed, false); // total 0
  assert.equal(coverageGate(cov({ upper: null })).passed, false); // no fraction
});

test("acceptWithCoverage: a failing base coat rejects REGARDLESS of an improving delta", () => {
  const r = acceptWithCoverage({ coverage: cov({ upper: 0.13 }), before: 0.25, after: 0.4 });
  assert.equal(r.accepted, false);
  assert.equal(r.reason, "coverage");
  // the delta was never consulted — resemblance fields are nulled, not computed
  assert.deepEqual([r.before, r.after, r.delta], [null, null, null]);
  assert.equal(r.coverage.passed, false);
});

test("acceptWithCoverage: with coverage passed, the decision is acceptIfCloser's, unchanged", () => {
  const ok = acceptWithCoverage({ coverage: cov({ upper: 0.7 }), before: 0.25, after: 0.4 });
  assert.deepEqual(
    { accepted: ok.accepted, before: ok.before, after: ok.after, delta: ok.delta, epsilon: ok.epsilon },
    acceptIfCloser({ before: 0.25, after: 0.4 }));
  assert.equal(ok.reason, "resemblance-improved");
  const worse = acceptWithCoverage({ coverage: cov({ upper: 0.7 }), before: 0.4, after: 0.3 });
  assert.equal(worse.accepted, false);
  assert.equal(worse.reason, "resemblance-not-improved");
});

test("the recorded cottage fractions prove the gate both ways (T-088-01 AC #3, unit level)", () => {
  // the committed spray-paint/cottage.json zones.coverage numbers, with the historically accepted
  // marginal front delta 0.25→0.40 that rubber-stamped the 91%-bare upper wall
  const splatOnly = cov({ base: 0.562, upper: 0.13, roof: 0.642 });
  const zoneFilled = cov({ base: 0.619, upper: 0.712, roof: 0.89 });
  const rejected = acceptWithCoverage({ coverage: splatOnly, before: 0.25, after: 0.4 });
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.reason, "coverage");
  assert.deepEqual(rejected.coverage.failures.map((f) => f.zone), ["upper"]);
  const passed = acceptWithCoverage({ coverage: zoneFilled, before: 0.25, after: 0.4 });
  assert.equal(passed.accepted, true);
  assert.equal(passed.reason, "resemblance-improved");
});

test("coverageGate metric 'own': gates on ownFraction (declared vocabulary); default metric unchanged", () => {
  const rec = { band1: { total: 100, byBlock: {}, dominant: "smooth_sandstone", dominantFraction: 0.23,
    own: ["smooth_sandstone", "spruce_planks"], ownFraction: 0.96 } };
  assert.equal(coverageGate(rec).passed, false, "dominant-only still fails the styled band");
  const g = coverageGate(rec, { metric: "own" });
  assert.equal(g.passed, true);
  assert.equal(g.byZone.band1.fraction, 0.96);
  assert.equal(g.byZone.band1.dominantFraction, 0.23, "the dominant count stays reported beside it");
  assert.deepEqual(g.byZone.band1.own, ["smooth_sandstone", "spruce_planks"]);
  assert.equal(coverageGate(rec, { metric: "own", threshold: 0.97 }).passed, false);
  assert.throws(() => coverageGate(rec, { metric: "best" }), /unknown metric/);
});
