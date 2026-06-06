// Pure unit tests for the ablation-sweep core (T-056-01). No GL, no fixtures on disk — runs under the
// src/**/*.test.mjs glob (AC #4).

import test from "node:test";
import assert from "node:assert/strict";

import { RUNGS, autoRegions, rungVerdict, assembleAblation } from "./ablation.mjs";

// --- autoRegions -----------------------------------------------------------

test("autoRegions: default 3 slabs, full XZ, exact Y tiling, contiguous & non-inverted", () => {
  const bounds = { min: [-16, 0, -11], max: [15, 16, 11] };
  const regions = autoRegions(bounds);
  assert.equal(regions.length, 3);
  for (const r of regions) {
    // full XZ cross-section on every slab
    assert.deepEqual(r.bbox.min[0] !== undefined && [r.bbox.min[0], r.bbox.max[0]], [-16, 15]);
    assert.deepEqual([r.bbox.min[2], r.bbox.max[2]], [-11, 11]);
    assert.ok(r.bbox.max[1] >= r.bbox.min[1], "slab Y not inverted");
  }
  // tiles [minY, maxY] exactly: first starts at minY, last ends at maxY, each slab follows the previous.
  assert.equal(regions[0].bbox.min[1], 0);
  assert.equal(regions[2].bbox.max[1], 16);
  for (let i = 1; i < regions.length; i++) {
    assert.equal(regions[i].bbox.min[1], regions[i - 1].bbox.max[1] + 1, "slabs contiguous, no gap/overlap");
  }
});

test("autoRegions: custom slab count and a single-row Y span still yields non-empty specs", () => {
  assert.equal(autoRegions({ min: [0, 0, 0], max: [4, 9, 4] }, { slabs: 5 }).length, 5);
  // degenerate: minY == maxY → every slab collapses to that row, none inverted
  const flat = autoRegions({ min: [0, 7, 0], max: [3, 7, 3] }, { slabs: 3 });
  assert.equal(flat.length, 3);
  for (const r of flat) {
    assert.equal(r.bbox.min[1], 7);
    assert.equal(r.bbox.max[1], 7);
  }
});

test("autoRegions: rejects malformed bounds", () => {
  assert.throws(() => autoRegions(null));
  assert.throws(() => autoRegions({ min: [0, 0, 0] }));
});

// --- rungVerdict -----------------------------------------------------------

test("rungVerdict: baseline / improved / held / regressed / unknown", () => {
  assert.equal(rungVerdict(null, 0.5), "baseline");
  assert.equal(rungVerdict(0.5, 0.7), "improved");
  assert.equal(rungVerdict(0.5, 0.3), "regressed");
  assert.equal(rungVerdict(0.5, 0.5), "held");
  assert.equal(rungVerdict(0.5, 0.5005), "held"); // within eps
  assert.equal(rungVerdict(0.5, 0.502), "improved"); // beyond eps
  assert.equal(rungVerdict(0.5, null), "unknown");
  assert.equal(rungVerdict("x", 0.5), "unknown");
});

// --- assembleAblation ------------------------------------------------------

test("assembleAblation: 4-rung chain → verdict sequence + signed marginal deltas", () => {
  const rows = [
    { subject: "koi", rung: "R0", formIoU: 0.47, valueDeltaE: 18.0 },
    { subject: "koi", rung: "R1", formIoU: 0.622, valueDeltaE: 9.5 },
    { subject: "koi", rung: "R2", formIoU: 0.623, valueDeltaE: 7.3 },
    { subject: "koi", rung: "R3", formIoU: 0.623, valueDeltaE: 7.3 },
  ];
  const { json, md } = assembleAblation(rows);
  assert.equal(json.schema, "sweep-ablation/v1");
  assert.equal(json.subjects.length, 1);
  const k = json.subjects[0].rungs;
  assert.equal(k.R0.verdict, "baseline");
  assert.equal(k.R1.verdict, "improved");
  assert.equal(k.R2.verdict, "held"); // 0.623 vs 0.622 within eps
  assert.equal(k.R3.verdict, "held");
  // marginal form delta
  assert.equal(k.R0.dFormIoU, null);
  assert.equal(k.R1.dFormIoU, 0.152);
  // value ΔE got cleaner R0→R1→R2 (negative deltas), flat R2→R3
  assert.ok(k.R1.dValueDeltaE < 0 && k.R2.dValueDeltaE < 0);
  assert.equal(k.R3.dValueDeltaE, 0);
  // md is a non-empty string with the subject and both tables
  assert.match(md, /koi/);
  assert.match(md, /Marginal Δ/);
});

test("assembleAblation: a null/absent cell is tolerated and advances from the last present rung", () => {
  const rows = [
    { subject: "moai", rung: "R0", formIoU: 0.40, valueDeltaE: 20 },
    { subject: "moai", rung: "R1", formIoU: 0.66, valueDeltaE: null, note: "palette unresolved" },
    // R2 entirely absent
    { subject: "moai", rung: "R3", formIoU: 0.66, valueDeltaE: 6.0 },
  ];
  const { json } = assembleAblation(rows);
  const m = json.subjects[0].rungs;
  assert.equal(m.R1.valueDeltaE, null);
  assert.equal(m.R1.note, "palette unresolved");
  assert.equal(m.R2.formIoU, null);
  assert.equal(m.R2.verdict, "unknown"); // prev present (0.66) but this cell null
  // R3 verdict compares to the last PRESENT IoU (R1's 0.66), not the absent R2
  assert.equal(m.R3.verdict, "held");
  // dValueDeltaE for R3 compares to the last present ΔE (R0's 20), since R1/R2 had none
  assert.equal(m.R3.dValueDeltaE, -14);
});

test("assembleAblation: empty / malformed rows do not throw", () => {
  assert.equal(assembleAblation([]).json.subjects.length, 0);
  assert.equal(assembleAblation(null).json.subjects.length, 0);
  assert.equal(assembleAblation([{ rung: "R0" }]).json.subjects.length, 0); // no subject → skipped
});

test("RUNGS is the canonical 4-rung ladder", () => {
  assert.deepEqual(RUNGS.map((r) => r.id), ["R0", "R1", "R2", "R3"]);
});
