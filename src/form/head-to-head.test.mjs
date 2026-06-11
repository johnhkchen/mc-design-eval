// Unit tests — head-to-head composition (T-127-01). Fixture gate records only; the pure half
// quotes verdicts and does arithmetic, nothing else.

import { test } from "node:test";
import assert from "node:assert/strict";

import { MULTI_ANGLE_GATE_SCHEMA } from "./multi-angle-gate.mjs";
import { HEAD_TO_HEAD_SCHEMA, gateRow, composeHeadToHead, headToHeadMd } from "./head-to-head.mjs";

const view = (angle, outcome, gaps = []) => {
  if (outcome === "same object" || outcome === "drifted") {
    return { angle, azimuthDeg: 45, rendered: true, coverage: { passed: true }, verdict: { verdict: outcome, gaps } };
  }
  if (outcome === "coverage") return { angle, azimuthDeg: 45, rendered: true, coverage: { passed: false }, verdict: null, reason: "coverage" };
  if (outcome === "unparsed") return { angle, azimuthDeg: 45, rendered: true, coverage: { passed: true }, verdict: null, unparsed: true };
  return { angle, azimuthDeg: 45, rendered: false, coverage: null, verdict: null };
};

const gateRec = ({ subject = "hut", gapCount = 3, passed = false, views, kitPresence }) => ({
  schema: MULTI_ANGLE_GATE_SCHEMA,
  subject,
  label: "x",
  artifact: { path: `p/${subject}.json`, sha256: "ab".repeat(32) },
  aggregate: { decided: true, passed, gapCount, gapBudget: 2, failures: [] },
  views: views ?? [
    view("+x+z", "same object", [{ severity: "minor", attribute: "form", region: "roof" }]),
    view("+x-z", "drifted", [{ severity: "major", attribute: "form", region: "roof" }]),
  ],
  kitPresence: kitPresence ?? { ran: true, passed: true, gaps: [], skips: [] },
  overall: { schema: "kit-aware-gate/v1", decided: true, passed: false },
  sheet: `pr/assets/frames/sheet-${subject}.png`,
});

test("H2H1 gateRow quotes verdicts, counts same-object, pins the schema", () => {
  const row = gateRow(gateRec({}), "patternbook");
  assert.equal(row.sameObject.count, 1);
  assert.equal(row.sameObject.total, 2);
  assert.equal(row.gapCount, 3);
  assert.deepEqual(row.views[1].gaps, [{ severity: "major", attribute: "form", region: "roof" }]);
  assert.throws(() => gateRow({ schema: "other/v1" }, "x"), /not "multi-angle-gate\/v1"/);
});

test("H2H2 coverage-rejected, unparsed, and unrendered views are named outcomes", () => {
  const row = gateRow(gateRec({ views: [view("+x+z", "coverage"), view("+x-z", "unparsed"), view("-x-z", "norender")] }), "x");
  assert.deepEqual(row.views.map((v) => v.outcome), ["coverage-rejected", "unparsed", "not-rendered"]);
  assert.equal(row.sameObject.count, 0);
});

test("H2H3 composeHeadToHead deltas: negative gap delta = fewer gaps than the best", () => {
  const h2h = composeHeadToHead({
    subjects: [{
      key: "hut",
      records: {
        patternbook: gateRec({ gapCount: 4, views: [view("a", "same object"), view("b", "same object"), view("c", "drifted"), view("d", "drifted")] }),
        generated: gateRec({ gapCount: 10, views: [view("a", "same object"), view("b", "drifted"), view("c", "drifted"), view("d", "drifted")] }),
      },
      context: { patternbook: { rounds: 6 } },
    }],
  });
  assert.equal(h2h.schema, HEAD_TO_HEAD_SCHEMA);
  const s = h2h.subjects[0];
  assert.equal(s.deltas.gapCount, -6);
  assert.equal(s.deltas.sameObject, 1);
  assert.deepEqual(s.rows[0].context, { rounds: 6 });
  assert.equal(s.rows[1].context, null);
});

test("H2H4 subject mismatch and empty input throw", () => {
  assert.throws(() => composeHeadToHead({ subjects: [] }), /non-empty/);
  assert.throws(() => composeHeadToHead({
    subjects: [{ key: "barnacle", records: { patternbook: gateRec({}), generated: gateRec({}) } }],
  }), /subject "hut" is not "barnacle"/);
});

test("H2H5 a refusal record rows honestly (no pass/fail invented)", () => {
  const rec = gateRec({});
  rec.aggregate = { decided: false, refusal: "render-missing" };
  const row = gateRow(rec, "patternbook");
  assert.equal(row.decided, false);
  assert.equal(row.passed, null);
  assert.equal(row.refusal, "render-missing");
  assert.equal(row.gapCount, null);
});

test("H2H7 coverage-rejected rows carry the under-statement warning in the md", () => {
  const md = headToHeadMd(composeHeadToHead({
    subjects: [{ key: "hut", records: {
      patternbook: gateRec({ gapCount: 0, views: [view("a", "coverage"), view("b", "coverage")] }),
      generated: gateRec({ gapCount: 5 }),
    } }],
  }));
  assert.match(md, /patternbook: 2 view\(s\) coverage-rejected/);
  assert.match(md, /under-states/);
});

test("H2H6 the markdown carries both rows, deltas, and sheets per subject", () => {
  const md = headToHeadMd(composeHeadToHead({
    subjects: [{ key: "hut", records: { patternbook: gateRec({ gapCount: 1 }), generated: gateRec({ gapCount: 5 }) } }],
  }));
  assert.match(md, /## hut/);
  assert.match(md, /\*\*patternbook\*\* \| FAIL \| 1\/2/);
  assert.match(md, /\*\*generated\*\* \| FAIL \| 5\/2/);
  assert.match(md, /gaps -4, same-object \+0/);
  assert.match(md, /Sheet \(patternbook\)/);
});
