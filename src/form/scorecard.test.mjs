// Pure unit tests for the E-17 scorecard assembler — no files, no GL (T-057-01).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  meanPresent,
  attributeTechniques,
  assembleScorecard,
  TECHNIQUES,
} from "./scorecard.mjs";

/** Build a spine subject from per-rung marginal triples [dFormIoU, dValueDeltaE, verdict]. */
function subj(name, cells) {
  const rungs = {};
  for (const [id, [dF, dE, verdict]] of Object.entries(cells)) {
    rungs[id] = { formIoU: 0.5, valueDeltaE: 0, verdict, dFormIoU: dF, dValueDeltaE: dE };
  }
  return { subject: name, rungs };
}

// The real 7-subject marginals copied from benchmarks/sculpture/_archive/sweep-ablation.json (inlined so the
// test is self-contained and PINS the headline averages — a spine change that breaks them fails here).
const SPINE = {
  scale: 32,
  subjects: [
    subj("dancing-man", { R0: [null, null, "baseline"], R1: [0.308, -14.15, "improved"], R2: [0, -2.1, "held"], R3: [0, 0, "held"] }),
    subj("moai", { R0: [null, null, "baseline"], R1: [0.286, -8.55, "improved"], R2: [0, -1.22, "held"], R3: [0, 0, "held"] }),
    subj("pineapple", { R0: [null, null, "baseline"], R1: [0.124, -1.81, "improved"], R2: [0, -4.38, "held"], R3: [0, 0, "held"] }),
    subj("bow-and-arrow", { R0: [null, null, "baseline"], R1: [0.174, -6.29, "improved"], R2: [0, -3.8, "held"], R3: [-0.004, 0, "regressed"] }),
    subj("heart", { R0: [null, null, "baseline"], R1: [0.421, -4.0, "improved"], R2: [0, -5.91, "held"], R3: [0, 0, "held"] }),
    subj("mushroom", { R0: [null, null, "baseline"], R1: [0.204, -6.72, "improved"], R2: [0, -6.44, "held"], R3: [0, 0, "held"] }),
    subj("koi", { R0: [null, null, "baseline"], R1: [0.15, -8.63, "improved"], R2: [0.001, -7.87, "held"], R3: [0, 0, "held"] }),
  ],
};

test("meanPresent skips nulls and reports n", () => {
  assert.deepEqual(meanPresent([2, null, 4, undefined]), { mean: 3, n: 2 });
  assert.deepEqual(meanPresent([null, null]), { mean: null, n: 0 });
  assert.deepEqual(meanPresent([]), { mean: null, n: 0 });
});

test("attributeTechniques averages the marginal column across subjects (n=7)", () => {
  const t = Object.fromEntries(attributeTechniques(SPINE).map((x) => [x.key, x]));
  // voxel = R1−R0
  assert.equal(t.voxel.meanDFormIoU, 0.238);
  assert.equal(t.voxel.meanDValueDeltaE, -7.16);
  assert.equal(t.voxel.n, 7);
  // material-clean = R2−R1
  assert.equal(t["material-clean"].meanDFormIoU, 0);
  assert.equal(t["material-clean"].meanDValueDeltaE, -4.53);
  // surgical = R3−R2
  assert.equal(t.surgical.meanDFormIoU, -0.001);
  assert.equal(t.surgical.meanDValueDeltaE, 0);
});

test("technique verdicts: form lever / value lever / wash", () => {
  const t = Object.fromEntries(attributeTechniques(SPINE).map((x) => [x.key, x]));
  assert.equal(t.voxel.verdict, "won-form"); // +0.238 form
  assert.equal(t["material-clean"].verdict, "won-value"); // 0 form, −4.53 ΔE
  assert.equal(t.surgical.verdict, "wash"); // ~0 form, 0 ΔE
});

test("rung-verdict tallies are honest (surgical: 1 regressed, 0 improved)", () => {
  const t = Object.fromEntries(attributeTechniques(SPINE).map((x) => [x.key, x]));
  assert.equal(t.surgical.regressed, 1);
  assert.equal(t.surgical.improved, 0);
  assert.equal(t.surgical.held, 6);
  assert.equal(t.voxel.improved, 7);
});

test("assembleScorecard emits md + scorecard/v1 json with the AVG row", () => {
  const { md, json } = assembleScorecard(SPINE);
  assert.equal(json.schema, "scorecard/v1");
  assert.equal(json.epic, "E-17");
  assert.equal(json.scale, 32);
  assert.equal(json.techniques.length, TECHNIQUES.length);
  assert.match(md, /what each TECHNIQUE bought on average/);
  assert.match(md, /\+0\.238/); // voxel form win surfaced in the table
  assert.match(md, /-4\.53/); // material-clean value win surfaced
  assert.match(md, /bow-and-arrow −0\.004/); // honesty note names the regression
});

test("tolerant of a missing rung cell (n drops, no throw)", () => {
  const partial = { subjects: [SPINE.subjects[0], { subject: "x", rungs: { R1: { dFormIoU: 0.1, dValueDeltaE: -1, verdict: "improved" } } }] };
  const t = Object.fromEntries(attributeTechniques(partial).map((x) => [x.key, x]));
  assert.equal(t.voxel.n, 2);
  assert.equal(t.surgical.n, 1); // only dancing-man has an R3 cell
  assert.doesNotThrow(() => assembleScorecard(partial));
});
