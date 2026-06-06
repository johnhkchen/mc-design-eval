// Unit tests for the E-18 consolidation scorecard pure core (T-061-01). GL-free, file-free: a hand-built
// e18-remeasure/v1 spine fixture exercises the per-fix attribution, the routing partition, and the md shape.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FIXES,
  EPS,
  meanPresent,
  attributeFixes,
  classifyRouting,
  assembleE18Scorecard,
} from "./e18-scorecard.mjs";
import { delta, METRICS } from "./remeasure.mjs";

/** Build a spine subject with R1/R2/E18 cells and the direction-aware deltas the real spine carries. */
function subject(name, r1, r2, e18) {
  const deltas = { vsR1: {}, vsR2: {} };
  for (const m of METRICS) {
    deltas.vsR1[m.key] = delta(m, e18[m.key], r1[m.key]);
    deltas.vsR2[m.key] = delta(m, e18[m.key], r2[m.key]);
  }
  return { subject: name, r1, r2, e18, deltas };
}

// Two subjects: koi = thin-helped + clean win + discipline win; dancing = solid-hurt on form.
const KOI_R1 = { formIoU: 0.622, speckle: 0.415, distinct: 5, offPalette: 0, valueDeltaE: 4.53 };
const KOI_R2 = { formIoU: 0.623, speckle: 0.35, distinct: 8, offPalette: 1237, valueDeltaE: 0 };
const KOI_E18 = { formIoU: 0.706, speckle: 0.158, distinct: 5, offPalette: 0, valueDeltaE: 16.35 };
const DAN_R1 = { formIoU: 0.914, speckle: 0.402, distinct: 5, offPalette: 0, valueDeltaE: 11.19 };
const DAN_R2 = { formIoU: 0.914, speckle: 0.275, distinct: 5, offPalette: 973, valueDeltaE: 0 };
const DAN_E18 = { formIoU: 0.814, speckle: 0.148, distinct: 5, offPalette: 0, valueDeltaE: 13.82 };

const SPINE = {
  schema: "e18-remeasure/v1",
  scale: 32,
  averages: {
    r1: { formIoU: 0.768, speckle: 0.409, distinct: 5, offPalette: 0, valueDeltaE: 7.86 },
    r2: { formIoU: 0.769, speckle: 0.313, distinct: 6.5, offPalette: 1105, valueDeltaE: 0 },
    e18: { formIoU: 0.76, speckle: 0.153, distinct: 5, offPalette: 0, valueDeltaE: 15.09 },
  },
  subjects: [subject("koi", KOI_R1, KOI_R2, KOI_E18), subject("dancing-man", DAN_R1, DAN_R2, DAN_E18)],
};

test("attributeFixes: thin fix means E18−R1 form IoU and wins on a thin-helped majority", () => {
  const fixes = attributeFixes(SPINE);
  const thin = fixes.find((f) => f.key === "thin");
  // koi +0.084, dancing −0.10 → mean ≈ −0.008 → net regressed here (2-subject fixture), but tallies split.
  assert.equal(thin.metric, "formIoU");
  assert.equal(thin.improved, 1); // koi improved
  assert.equal(thin.regressed, 1); // dancing regressed
  assert.ok(thin.mean !== null);
});

test("attributeFixes: segmentation means E18−R2 speckle and wins clean on both", () => {
  const seg = attributeFixes(SPINE).find((f) => f.key === "segment");
  assert.equal(seg.metric, "speckle");
  assert.equal(seg.improved, 2); // both subjects' speckle dropped vs R2
  assert.equal(seg.verdict, "won-clean");
  assert.ok(seg.mean < 0); // speckle went down
});

test("attributeFixes: discipline means E18−R2 off-palette → wins discipline", () => {
  const disc = attributeFixes(SPINE).find((f) => f.key === "discipline");
  assert.equal(disc.metric, "offPalette");
  assert.equal(disc.improved, 2); // both R2 had off-pal > 0 (koi 1237, dancing 973) dropping to 0
  assert.equal(disc.improved + disc.held + disc.regressed, 2);
  assert.equal(disc.verdict, "won-discipline");
});

test("meanPresent skips nulls and reports n", () => {
  assert.deepEqual(meanPresent([1, null, 3, undefined, NaN]), { mean: 2, n: 2 });
  assert.deepEqual(meanPresent([]), { mean: null, n: 0 });
});

test("classifyRouting partitions by sign of the thin form Δ (vsR1)", () => {
  const r = classifyRouting(SPINE);
  assert.deepEqual(r.thinHelped.map((e) => e.subject), ["koi"]);
  assert.deepEqual(r.solidHurt.map((e) => e.subject), ["dancing-man"]);
  assert.equal(r.flat.length, 0);
});

test("assembleE18Scorecard returns {md,json} with the v1 schema and all sections", () => {
  const { md, json } = assembleE18Scorecard(SPINE);
  assert.equal(json.schema, "e18-scorecard/v1");
  assert.equal(json.epic, "E-18");
  assert.equal(json.scale, 32);
  assert.equal(json.fixes.length, FIXES.length);
  for (const h of [
    "## Levels",
    "## Marginal Δ",
    "## What each fix bought",
    "## Form-type routing",
    "## Honesty notes",
  ]) {
    assert.ok(md.includes(h), `md missing section: ${h}`);
  }
  assert.ok(md.includes("koi"));
  assert.ok(md.includes("dancing-man"));
});

test("assembleE18Scorecard tolerates a missing build cell (renders —)", () => {
  const partial = { schema: "e18-remeasure/v1", subjects: [{ subject: "x", r1: null, r2: KOI_R2, e18: KOI_E18, deltas: { vsR1: {}, vsR2: {} } }] };
  const { md } = assembleE18Scorecard(partial);
  assert.ok(md.includes("—")); // null r1 cells render as em-dash
});

test("EPS and FIXES are frozen contracts", () => {
  assert.throws(() => (FIXES[0].key = "z"), TypeError);
  assert.ok(EPS.formIoU > 0 && EPS.speckle > 0);
});
