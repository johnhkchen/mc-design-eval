// LISA CLAIM tests (T-157-01) — the pure decision core. No IO, no Date (now injected).

import { test } from "node:test";
import assert from "node:assert/strict";

import { decideClaim, claimRecord, claimRel, DEFAULT_TTL_MS } from "./lisa-claim.mjs";

const NOW = 1_000_000_000_000;

test("CLAIM1 decideClaim truth table — free / mine / stale / held-by-other", () => {
  assert.equal(decideClaim({ existing: null, now: NOW, mySession: "a" }), "free");
  assert.equal(decideClaim({ existing: { session: "a", at: NOW - 1000 }, now: NOW, mySession: "a" }), "mine");
  assert.equal(decideClaim({ existing: { session: "b", at: NOW - 1000 }, now: NOW, mySession: "a" }), "held-by-other");
  // older than the TTL → reclaimable regardless of who held it
  assert.equal(decideClaim({ existing: { session: "b", at: NOW - DEFAULT_TTL_MS - 1 }, now: NOW, mySession: "a" }), "stale");
  // a claim with no usable timestamp reads as stale (fail-open to free, never wedge)
  assert.equal(decideClaim({ existing: { session: "b" }, now: NOW, mySession: "a" }), "stale");
});

test("CLAIM1b a fresh foreign claim is held-by-other right up to the TTL boundary", () => {
  assert.equal(decideClaim({ existing: { session: "b", at: NOW - DEFAULT_TTL_MS }, now: NOW, mySession: "a" }), "held-by-other");
  assert.equal(decideClaim({ existing: { session: "b", at: NOW - DEFAULT_TTL_MS - 1 }, now: NOW, mySession: "a" }), "stale");
});

test("CLAIM2 claimRel — work-dir path, ticket id validated", () => {
  assert.equal(claimRel("T-157-01"), "docs/active/work/T-157-01/.lisa-claim.json");
  assert.throws(() => claimRel("../etc/passwd"), /bad ticket id/);
  assert.throws(() => claimRel("T 1"), /bad ticket id/);
});

test("CLAIM3 claimRecord — carries the fields and round-trips through JSON", () => {
  const rec = claimRecord({ ticket: "T-157-01", phase: "research", session: "pane-3", at: NOW });
  assert.deepEqual(rec, { schema: "lisa-claim/v1", ticket: "T-157-01", phase: "research", session: "pane-3", at: NOW });
  assert.deepEqual(JSON.parse(JSON.stringify(rec)), rec);
  assert.throws(() => claimRecord({ ticket: "T-1", session: "x", at: NaN }), /required/);
  assert.throws(() => claimRecord({ ticket: "T-1", at: NOW }), /required/); // no session
});
