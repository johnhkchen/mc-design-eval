// composeReceipts unit tests (T-132-01) — arithmetic, honesty, determinism on synthetic inputs.

import { test } from "node:test";
import assert from "node:assert/strict";

import { composeReceipts, FACTORY_RECEIPTS_SCHEMA } from "./receipts.mjs";

const P = Object.freeze({
  before: { count: 3, names: ["a", "b", "c"], ref: "abc1234" },
  afterNames: ["a", "b", "c", "d", "e"],
  baselineStyle: "rustic",
  baselineIdioms: ["a", "b"],
  style: "saltcrag",
  styleIdioms: ["a", "b", "d", "e"],
  backlog: { items: 2, notes: 5, demotions: 0, askCount: 1 },
  drafts: [
    { name: "d", rework: [] },
    { name: "e", rework: ["param reshaped", "formula clarified"] },
  ],
  costShape: [
    { stage: "formation", calls: 3, source: "packs/drafts/x/ledger.json" },
    { stage: "backlog", calls: 1, source: "records" },
    { stage: "workshop", calls: 6, source: "ledger" },
    { stage: "gate", calls: 4, source: "gate record" },
  ],
  gates: {
    baseline: { decided: true, passed: false, refusal: null, gapCount: 8, gapBudget: 2, sameObject: { count: 4, total: 4 } },
    candidate: { decided: true, passed: false, refusal: null, gapCount: 11, gapBudget: 2, sameObject: { count: 3, total: 4 } },
  },
  conformance: { first: { passed: 6, findings: 0 }, final: { passed: 6, findings: 0 } },
  chain: { record: "benchmarks/sculpture/pattern-book/x.json", replay: "patternbook:saltcrag:repro" },
});

test("R1 registry growth and reuse arithmetic", () => {
  const { receipts } = composeReceipts(P);
  assert.equal(receipts.schema, FACTORY_RECEIPTS_SCHEMA);
  assert.deepEqual(receipts.registry, { before: 3, beforeRef: "abc1234", after: 5, grown: ["d", "e"] });
  assert.deepEqual(receipts.reuse.sharedWithBaseline, ["a", "b"]);
  assert.deepEqual(receipts.reuse.newlyBuilt, ["d", "e"]);
  assert.equal(receipts.reuse.fraction, 0.5);
});

test("R2 rework + cost totals; the verdict is carried verbatim (no smoothing)", () => {
  const { receipts, md } = composeReceipts(P);
  assert.equal(receipts.factory.reworkTotal, 2);
  assert.equal(receipts.callsTotal, 14);
  assert.equal(receipts.verdict.candidate.gapCount, 11);
  assert.match(md, /FAIL — same-object 3\/4, 11 gap\(s\) vs budget 2/);
  assert.match(md, /FAIL — same-object 4\/4, 8 gap\(s\) vs budget 2/);
  assert.match(md, /50%/);
});

test("R3 a refusal row renders as refusal, never as a pass", () => {
  const { md } = composeReceipts({
    ...P,
    gates: { ...P.gates, candidate: { decided: false, passed: null, refusal: "coverage", gapCount: null, gapBudget: null, sameObject: { count: 0, total: 4 } } },
  });
  assert.match(md, /REFUSAL \(coverage\) — same-object 0\/4/);
});

test("R4 byte-deterministic given identical inputs", () => {
  const a = composeReceipts(P);
  const b = composeReceipts(P);
  assert.equal(JSON.stringify(a.receipts), JSON.stringify(b.receipts));
  assert.equal(a.md, b.md);
});

test("R5 fail-loud input gates", () => {
  assert.throws(() => composeReceipts({ ...P, before: { count: 2, names: ["a", "b", "c"], ref: "x" } }), /before.count/);
  assert.throws(() => composeReceipts({ ...P, gates: { baseline: null, candidate: null } }), /candidate/);
  assert.throws(() => composeReceipts({ ...P, styleIdioms: [] }), /styleIdioms/);
});
