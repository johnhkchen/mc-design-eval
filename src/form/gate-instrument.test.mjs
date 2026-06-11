// gate-instrument unit tests (T-121-01). Groups:
//   A — degenerate inputs (no fresh gate / no committed gate)
//   B — frozen: identical contracts + same judge model → diffs []
//   C — drift is named: contract field, novel judge model
//   D — null-safety: absent contract / views never throw

import { test } from "node:test";
import assert from "node:assert/strict";

import { instrumentReceipt } from "./gate-instrument.mjs";

const NAMES = {
  comparedTo: "committed styled-label gate record",
  fallbackComparedTo: "config (no committed styled-label record)",
  beforeName: "styled",
  afterName: "generated",
};

const CONTRACT = { azimuths: [45, 135, 225, 315], elevationDeg: 30, width: 512, height: 512, gapBudget: 2, coverageThreshold: 0.35 };
const gate = (contract, models = ["pinned-model"]) => ({
  contract,
  views: models.map((m, i) => ({ angle: `v${i}`, judge: { model: m } })),
});

// --- A: degenerate inputs -------------------------------------------------------------------------

test("A1 no fresh gate record → not frozen, the absence is the named diff", () => {
  const r = instrumentReceipt(gate(CONTRACT), null, NAMES);
  assert.deepEqual(r, { frozen: false, comparedTo: null, diffs: ["no fresh gate record"], judgeModels: [] });
});

test("A2 no committed record → frozen against the fallback comparator (first run)", () => {
  const r = instrumentReceipt(null, gate(CONTRACT), NAMES);
  assert.equal(r.frozen, true);
  assert.equal(r.comparedTo, NAMES.fallbackComparedTo);
  assert.deepEqual(r.diffs, []);
  assert.deepEqual(r.judgeModels, ["pinned-model"]);
});

// --- B: frozen ------------------------------------------------------------------------------------

test("B1 identical contract + same judge model → frozen, diffs []", () => {
  const r = instrumentReceipt(gate(CONTRACT), gate({ ...CONTRACT }), NAMES);
  assert.equal(r.frozen, true);
  assert.equal(r.comparedTo, NAMES.comparedTo);
  assert.deepEqual(r.diffs, []);
});

// --- C: drift is named ----------------------------------------------------------------------------

test("C1 contract field drift → named diff carrying both prefixes", () => {
  const r = instrumentReceipt(gate(CONTRACT), gate({ ...CONTRACT, gapBudget: 3 }), NAMES);
  assert.equal(r.frozen, false);
  assert.deepEqual(r.diffs, ["contract.gapBudget: styled 2 → generated 3"]);
});

test("C2 novel judge model → named diff; committed models gate the check", () => {
  const r = instrumentReceipt(gate(CONTRACT), gate({ ...CONTRACT }, ["other-model"]), NAMES);
  assert.equal(r.frozen, false);
  assert.deepEqual(r.diffs, ["judge.model: other-model not among styled-label models"]);
  // committed record without judge models (e.g. all-coverage-refused) cannot convict the fresh one
  const noModels = { contract: CONTRACT, views: [{ angle: "v0" }] };
  const r2 = instrumentReceipt(noModels, gate({ ...CONTRACT }, ["other-model"]), NAMES);
  assert.equal(r2.frozen, true);
});

// --- D: null-safety -------------------------------------------------------------------------------

test("D1 absent contract/views on either side → compared as nulls, never a throw", () => {
  const r = instrumentReceipt({}, { views: undefined }, NAMES);
  assert.equal(r.frozen, true); // null === null on every field
  assert.deepEqual(r.judgeModels, []);
  const r2 = instrumentReceipt(gate(CONTRACT), {}, NAMES);
  assert.equal(r2.frozen, false);
  assert.equal(r2.diffs.length, 6); // every contract field drifted to null
});
