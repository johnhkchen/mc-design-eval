// Unit tests for the E-18 combined remeasure assembler (T-060-01). PURE: no GL, no I/O, no GLB. Synthetic
// per-subject rows only. Covers direction-aware deltas, per-build averages, honest "didn't help" recording
// (AC #3), the value-ΔE tautology exclusion, null handling, and the json schema/shape.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  improved,
  delta,
  assembleRemeasure,
  REMEASURE_SCHEMA,
  METRICS,
  BUILDS,
} from "./remeasure.mjs";

// --- improved / delta direction ---------------------------------------------

test("improved: form IoU is higher-better; speckle is lower-better; equal is not an improvement", () => {
  assert.equal(improved("formIoU", 0.7, 0.6), true, "higher IoU improves");
  assert.equal(improved("formIoU", 0.5, 0.6), false, "lower IoU is worse");
  assert.equal(improved("speckle", 0.2, 0.4), true, "lower speckle improves");
  assert.equal(improved("speckle", 0.5, 0.4), false, "higher speckle is worse");
  assert.equal(improved("speckle", 0.4, 0.4), false, "equal is not strictly better");
  assert.equal(improved("offPalette", 0, 500), true);
});

test("improved/delta: a missing side → null (no false verdict)", () => {
  assert.equal(improved("speckle", null, 0.4), null);
  assert.equal(improved("speckle", 0.2, undefined), null);
  assert.deepEqual(delta("speckle", null, 0.4), { raw: null, improved: null });
  assert.deepEqual(delta("formIoU", 0.7, 0.6), { raw: 0.1, improved: true });
});

test("improved: unknown metric throws", () => {
  assert.throws(() => improved("bogus", 1, 2), /unknown metric/);
});

// --- assembleRemeasure happy path -------------------------------------------

const cell = (formIoU, speckle, distinct, offPalette, valueDeltaE) => ({ formIoU, speckle, distinct, offPalette, valueDeltaE });

function sampleRows() {
  return [
    {
      subject: "koi",
      r1: cell(0.622, 0.72, 71, 1646, 7.87),
      r2: cell(0.622, 0.35, 8, 586, 0),
      e18: cell(0.707, 0.17, 6, 0, 0),
      thin: { components: 1, surfaceOnlyCount: 991, occBase: 2164, occThin: 3155 },
    },
    {
      subject: "moai",
      r1: cell(0.565, 0.6, 60, 0, 5.1),
      r2: cell(0.565, 0.248, 5, 0, 0),
      e18: cell(0.565, 0.119, 5, 0, 0),
      thin: { components: 1, surfaceOnlyCount: 0, occBase: 4215, occThin: 4215 },
    },
  ];
}

test("assembleRemeasure: 2 subjects → schema, ordered metrics, deltas, averages", () => {
  const { json, md } = assembleRemeasure(sampleRows(), { scale: 32 });
  assert.equal(json.schema, REMEASURE_SCHEMA);
  assert.equal(json.scale, 32);
  assert.equal(json.metrics.length, 5);
  assert.deepEqual(json.metrics.map((m) => m.key), METRICS.map((m) => m.key));
  assert.deepEqual(json.builds, [...BUILDS]);
  assert.equal(json.subjects.length, 2);

  const koi = json.subjects.find((s) => s.subject === "koi");
  assert.equal(koi.deltas.vsR2.speckle.raw, -0.18, "koi speckle E18−R2 = 0.17−0.35");
  assert.equal(koi.deltas.vsR2.speckle.improved, true);
  assert.equal(koi.deltas.vsR1.formIoU.raw, 0.08, "koi IoU E18−R1 = 0.707−0.622 ≈ 0.085 (float→0.08)");
  assert.equal(koi.deltas.vsR1.formIoU.improved, true);
  assert.equal(koi.deltas.vsR2.offPalette.raw, -586);

  // averages = mean over non-null cells
  assert.equal(json.averages.e18.distinct, 5.5, "(6+5)/2");
  assert.equal(json.averages.r1.distinct, 65.5, "(71+60)/2");

  // md surfaces the subjects, the triples, and an AVERAGE row
  assert.match(md, /koi/);
  assert.match(md, /0\.72→0\.35→0\.17/, "speckle triple rendered");
  assert.match(md, /\*\*AVERAGE\*\*/);
});

// --- honest regression / no-change recording (AC #3) ------------------------

test("assembleRemeasure: a metric that got WORSE is recorded honestly", () => {
  const rows = [
    {
      subject: "mushroom",
      r1: cell(0.98, 0.4, 70, 1000, 6),
      r2: cell(0.98, 0.301, 7, 2300, 0),
      // E18 speckle WORSE than R2 (0.35 > 0.301), everything else better/equal
      e18: cell(0.98, 0.35, 6, 0, 0),
    },
  ];
  const { json, md } = assembleRemeasure(rows);
  const worse = json.regressions.find((r) => r.subject === "mushroom" && r.metric === "speckle" && r.vs === "r2");
  assert.ok(worse, "the speckle regression vs R2 is listed");
  assert.equal(worse.kind, "worse");
  assert.ok(worse.raw > 0, "lower-better metric got bigger → positive raw");
  assert.match(md, /Regressions \/ no-change/);
  assert.match(md, /mushroom/);
});

test("assembleRemeasure: value-ΔE no-change is flagged as the tautology, not a silent pass", () => {
  // R2 and E18 both value ΔE 0 → no-change, the documented tautology
  const { json } = assembleRemeasure(sampleRows());
  const vTaut = json.regressions.filter((r) => r.metric === "valueDeltaE" && r.kind === "no-change");
  assert.ok(vTaut.length > 0, "value-ΔE no-change cells are recorded (honest)");
  assert.ok(json.notes.valueDeltaETautology, "and explained as tautological");
  assert.match(json.notes.valueDeltaETautology, /by construction/);
});

test("assembleRemeasure: all-improving subjects → empty regressions, no tautology note", () => {
  const rows = [
    {
      subject: "clean",
      r1: cell(0.5, 0.7, 50, 900, 8),
      r2: cell(0.55, 0.4, 9, 400, 3),
      e18: cell(0.6, 0.2, 6, 0, 1), // strictly better than both on every axis
    },
  ];
  const { json, md } = assembleRemeasure(rows);
  assert.equal(json.regressions.length, 0);
  assert.equal(json.notes.valueDeltaETautology, null);
  assert.match(md, /None — E18 strictly improved/);
});

// --- null handling ----------------------------------------------------------

test("assembleRemeasure: a subject missing R1 → null deltas, no crash, '—' in md, averages skip nulls", () => {
  const rows = [
    { subject: "withR1", r1: cell(0.5, 0.7, 50, 900, 8), r2: cell(0.55, 0.4, 9, 400, 0), e18: cell(0.6, 0.2, 6, 0, 0) },
    { subject: "noR1", r2: cell(0.55, 0.4, 9, 400, 0), e18: cell(0.6, 0.2, 6, 0, 0) },
  ];
  const { json, md } = assembleRemeasure(rows);
  const noR1 = json.subjects.find((s) => s.subject === "noR1");
  assert.equal(noR1.deltas.vsR1.speckle.raw, null);
  assert.equal(noR1.deltas.vsR1.speckle.improved, null);
  assert.equal(noR1.r1, null);
  // averages: r1 distinct averaged over the ONE subject that has it
  assert.equal(json.averages.r1.distinct, 50);
  assert.match(md, /noR1 \| —→0\.55→0\.6/, "missing R1 cell renders as —");
});

test("assembleRemeasure: rejects a non-array", () => {
  assert.throws(() => assembleRemeasure({}), /must be an array/);
});
