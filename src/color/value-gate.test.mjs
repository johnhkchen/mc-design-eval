// Tests for the concept↔render Δvalue feedback gate (T-042-01, story S-042, epic E-14).
//
// Pure, synthetic inputs — no image fixtures, no GL. Groups:
//   A realizedPaletteFromArtifact — counts/weights, order, non-cube resolution, manifest fallback, throws
//   B toReferenceClusters         — extractor-shape + array-shape, weight defaulting, throws
//   C valueGate ΔE math           — identity→0, far→flagged, max≥mean, weighting
//   D comparePalettes passthrough — present/missing/added
//   E gapClosure                  — improvement, equality, before:0 guard
//   F purity/determinism          — deep-equal repeat, inputs not mutated
//   G threshold knob              — custom threshold flips the flag at the boundary

import test from "node:test";
import assert from "node:assert/strict";
import {
  VALUE_GATE_SCHEMA,
  DEFAULT_VALUE_GATE_THRESHOLD,
  realizedPaletteFromArtifact,
  toReferenceClusters,
  valueGate,
  gapClosure,
} from "./value-gate.mjs";

// A small artifact factory. blocks: array of placement block ids (may repeat).
const artifactOf = (blocks, manifest) => ({
  placements: blocks.map((b, i) => ({ block: b, x: i, y: 0, z: 0 })),
  palette: { manifest: manifest ?? [...new Set(blocks)] },
});

// --- Group A: realizedPaletteFromArtifact ----------------------------------

test("A1 realizedPaletteFromArtifact counts placements and weights sum to 1", () => {
  const art = artifactOf(["stone", "stone", "stone", "gold_block"]);
  const real = realizedPaletteFromArtifact(art);
  assert.equal(real.length, 2);
  const stone = real.find((r) => r.block === "stone");
  assert.equal(stone.count, 3);
  assert.equal(stone.weight, 0.75);
  const w = real.reduce((s, r) => s + r.weight, 0);
  assert.ok(Math.abs(w - 1) < 1e-9);
});

test("A2 first-seen order preserved", () => {
  const real = realizedPaletteFromArtifact(artifactOf(["gold_block", "stone", "gold_block"]));
  assert.deepEqual(real.map((r) => r.block), ["gold_block", "stone"]);
});

test("A3 non-cube name resolves to its value-true block's Lab/value", () => {
  // cobblestone_stairs is not a full-cube table id → resolves to cobblestone (a real block).
  const real = realizedPaletteFromArtifact(artifactOf(["cobblestone_stairs"]));
  assert.equal(real.length, 1);
  assert.equal(real[0].block, "cobblestone");
  assert.equal(real[0].lab.length, 3);
  assert.equal(typeof real[0].value, "number");
});

test("A4 namespaced names normalize (minecraft: stripped, deduped)", () => {
  const real = realizedPaletteFromArtifact(artifactOf(["minecraft:stone", "stone"]));
  assert.equal(real.length, 1);
  assert.equal(real[0].block, "stone");
  assert.equal(real[0].count, 2);
});

test("A5 manifest fallback when an artifact has no placements", () => {
  const real = realizedPaletteFromArtifact({ placements: [], palette: { manifest: ["stone", "gold_block"] } });
  assert.deepEqual(real.map((r) => r.block), ["stone", "gold_block"]);
  assert.equal(real[0].weight, 0.5);
});

test("A6 throws when no block names anywhere", () => {
  assert.throws(() => realizedPaletteFromArtifact({ placements: [], palette: { manifest: [] } }), /no placement/);
});

// --- Group B: toReferenceClusters ------------------------------------------

test("B1 accepts an extractPaletteFromImage-shaped result", () => {
  const ref = { palette: [{ block: "stone", repColor: { lab: [50, 0, 0] }, coverage: 0.6 }] };
  const cl = toReferenceClusters(ref);
  assert.equal(cl.length, 1);
  assert.equal(cl[0].key, "stone");
  assert.deepEqual(cl[0].lab, [50, 0, 0]);
  assert.equal(cl[0].weight, 0.6);
});

test("B2 accepts a ready [{key,lab}] array; weight defaults to 1", () => {
  const cl = toReferenceClusters([{ key: "a", lab: [10, 0, 0] }]);
  assert.equal(cl[0].weight, 1);
  assert.equal(cl[0].block, "a");
});

test("B3 throws on empty / bad shape", () => {
  assert.throws(() => toReferenceClusters([]), /empty/);
  assert.throws(() => toReferenceClusters({}), /reference must be/);
  assert.throws(() => toReferenceClusters([{ key: "x" }]), /bad reference/);
});

// --- Group C: valueGate ΔE math --------------------------------------------

const ref3 = [
  { key: "dark", lab: [20, 0, 0] },
  { key: "mid", lab: [50, 0, 0] },
  { key: "light", lab: [80, 0, 0] },
];

test("C1 realized identical to reference → meanDeltaE ~0, not flagged", () => {
  const realized = [{ block: "mid", lab: [50, 0, 0], weight: 1 }];
  const g = valueGate(realized, ref3);
  assert.equal(g.schema, VALUE_GATE_SCHEMA);
  assert.ok(g.meanDeltaE < 0.01);
  assert.equal(g.flagged, false);
  assert.equal(g.recommendCorrectiveReplace, false);
});

test("C2 realized far in L* → flagged + recommend re-place", () => {
  // a [35,0,0] block sits 15 ΔE from both dark(20) and mid(50) nearest is 15.
  const realized = [{ block: "x", lab: [35, 0, 0], weight: 1 }];
  const g = valueGate(realized, ref3);
  assert.ok(g.meanDeltaE > DEFAULT_VALUE_GATE_THRESHOLD);
  assert.equal(g.flagged, true);
  assert.equal(g.recommendCorrectiveReplace, true);
});

test("C3 maxDeltaE >= meanDeltaE and per-block rows present", () => {
  const realized = [
    { block: "a", lab: [50, 0, 0], weight: 0.9 }, // ~0 from mid
    { block: "b", lab: [35, 0, 0], weight: 0.1 }, // ~15 from nearest
  ];
  const g = valueGate(realized, ref3);
  assert.equal(g.perBlock.length, 2);
  assert.ok(g.maxDeltaE >= g.meanDeltaE);
  assert.ok(g.maxDeltaE > 14);
});

test("C4 weighting: a heavy off block dominates the mean", () => {
  const realized = [
    { block: "a", lab: [50, 0, 0], weight: 0.1 }, // ~0
    { block: "b", lab: [35, 0, 0], weight: 0.9 }, // ~15
  ];
  const g = valueGate(realized, ref3);
  assert.ok(g.meanDeltaE > 13); // pulled toward the heavy block
});

test("C5 accepts realizedPaletteFromArtifact output directly", () => {
  const real = realizedPaletteFromArtifact(artifactOf(["stone", "gold_block"]));
  const ref = [{ key: "stone", lab: [53.3, 0.6, -0.4] }];
  const g = valueGate(real, ref);
  assert.equal(g.perBlock.length, 2);
});

// --- Group D: comparePalettes passthrough ----------------------------------

test("D1 present/missing/added partition the realized vs reference ids", () => {
  const realized = [
    { block: "stone", lab: [50, 0, 0], weight: 0.5 },
    { block: "extra", lab: [50, 0, 0], weight: 0.5 },
  ];
  const ref = [
    { key: "stone", lab: [50, 0, 0] },
    { key: "absent", lab: [10, 0, 0] },
  ];
  const g = valueGate(realized, ref);
  // comparePalettes(realizedIds, referenceIds): present = reference ids that appear in realized.
  assert.deepEqual(g.present, ["stone"]);
  assert.deepEqual(g.missing, ["absent"]);
  assert.deepEqual(g.added, ["extra"]);
});

// --- Group E: gapClosure ---------------------------------------------------

test("E1 before > after → improved with positive delta and pct", () => {
  const c = gapClosure({ before: 6.97, after: 2.31 });
  assert.equal(c.improved, true);
  assert.equal(c.delta, 4.66);
  assert.equal(c.pct, 66.9);
});

test("E2 equality → not improved, zero delta", () => {
  const c = gapClosure({ before: 5, after: 5 });
  assert.equal(c.improved, false);
  assert.equal(c.delta, 0);
});

test("E3 before:0 guarded (no NaN/Infinity in pct)", () => {
  const c = gapClosure({ before: 0, after: 0 });
  assert.equal(c.pct, 0);
  assert.ok(Number.isFinite(c.pct));
});

// --- Group F: purity / determinism -----------------------------------------

test("F1 deterministic: same inputs → deep-equal output", () => {
  const realized = [{ block: "a", lab: [35, 0, 0], weight: 1 }];
  assert.deepEqual(valueGate(realized, ref3), valueGate(realized, ref3));
});

test("F2 inputs are not mutated", () => {
  const realized = [{ block: "a", lab: [35, 0, 0], weight: 1 }];
  const ref = [{ key: "mid", lab: [50, 0, 0] }];
  const realizedCopy = structuredClone(realized);
  const refCopy = structuredClone(ref);
  valueGate(realized, ref);
  assert.deepEqual(realized, realizedCopy);
  assert.deepEqual(ref, refCopy);
});

// --- Group G: threshold knob -----------------------------------------------

test("G1 custom threshold flips the flag at the boundary", () => {
  const realized = [{ block: "x", lab: [35, 0, 0], weight: 1 }]; // ~15 ΔE
  assert.equal(valueGate(realized, ref3, { threshold: 20 }).flagged, false);
  assert.equal(valueGate(realized, ref3, { threshold: 10 }).flagged, true);
});
