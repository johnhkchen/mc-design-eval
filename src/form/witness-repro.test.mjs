// witness-repro unit tests (T-142-01) — the SKIP-vs-FAIL regression the S-138 review named as a
// coverage gap. One pure core serves BOTH witness families (proportion + visibility); they differ
// only in which sha they feed it, so this suite covers both. Groups:
//   WR — classifyWitnessRepro decision matrix (skip on registered rotation, FAIL on corruption,
//        FAIL on an unregistered change, GREEN on clean repro, missing-source handling)
//   RE — retiredEntry lookup

import { test } from "node:test";
import assert from "node:assert/strict";

import { classifyWitnessRepro, retiredEntry, WITNESS_REPRO_VERDICT } from "./witness-repro.mjs";

const PINNED = "a".repeat(64);
const ROTATED = "b".repeat(64);
const ENTRY = { slug: "barn-patternbook", retiredSourceSha: PINNED, ticket: "T-138-01", reason: "barn through the proportion loop" };

test("WR1 registered rotation → SKIP naming the retiring ticket (both families' happy path)", () => {
  const r = classifyWitnessRepro({ pinnedSourceSha: PINNED, currentSourceSha: ROTATED, retired: ENTRY });
  assert.equal(r.verdict, WITNESS_REPRO_VERDICT.SKIP);
  assert.match(r.reason, /T-138-01/);
  assert.match(r.reason, /barn through the proportion loop/);
});

test("WR2 source unchanged but re-derivation diverges → FAIL (corruption, NOT a skip)", () => {
  const r = classifyWitnessRepro({ pinnedSourceSha: PINNED, currentSourceSha: PINNED, retired: null, derivedMatches: false });
  assert.equal(r.verdict, WITNESS_REPRO_VERDICT.FAIL);
  assert.match(r.reason, /corrupted|diverges/i);
});

test("WR2b a registry entry does NOT rescue an unchanged-source corruption", () => {
  // even with an entry on file, an unchanged source that diverges is corruption — the entry is
  // keyed on a DIFFERENT (retired) sha and must not mask a genuine regression
  const r = classifyWitnessRepro({ pinnedSourceSha: PINNED, currentSourceSha: PINNED, retired: ENTRY, derivedMatches: false });
  assert.equal(r.verdict, WITNESS_REPRO_VERDICT.FAIL);
});

test("WR3 source changed but unregistered → FAIL (no free skip for an undeclared rotation)", () => {
  const r = classifyWitnessRepro({ pinnedSourceSha: PINNED, currentSourceSha: ROTATED, retired: null });
  assert.equal(r.verdict, WITNESS_REPRO_VERDICT.FAIL);
  assert.match(r.reason, /no sanctioned rotation/i);
});

test("WR3b source changed, entry present but for a DIFFERENT retired sha → FAIL", () => {
  // a further change beyond the one the registry certified must still fail
  const staleEntry = { ...ENTRY, retiredSourceSha: "c".repeat(64) };
  const r = classifyWitnessRepro({ pinnedSourceSha: PINNED, currentSourceSha: ROTATED, retired: staleEntry });
  assert.equal(r.verdict, WITNESS_REPRO_VERDICT.FAIL);
});

test("WR4 source unchanged and re-derivation matches → GREEN", () => {
  const r = classifyWitnessRepro({ pinnedSourceSha: PINNED, currentSourceSha: PINNED, retired: null, derivedMatches: true });
  assert.equal(r.verdict, WITNESS_REPRO_VERDICT.GREEN);
});

test("WR4b unchanged source with derivedMatches omitted → GREEN (the source-sha gate is the guard)", () => {
  const r = classifyWitnessRepro({ pinnedSourceSha: PINNED, currentSourceSha: PINNED, retired: null });
  assert.equal(r.verdict, WITNESS_REPRO_VERDICT.GREEN);
});

test("WR5 missing source + registered retirement → SKIP; missing + unregistered → FAIL", () => {
  assert.equal(classifyWitnessRepro({ pinnedSourceSha: PINNED, currentSourceSha: null, retired: ENTRY }).verdict, WITNESS_REPRO_VERDICT.SKIP);
  assert.equal(classifyWitnessRepro({ pinnedSourceSha: PINNED, currentSourceSha: null, retired: null }).verdict, WITNESS_REPRO_VERDICT.FAIL);
});

test("WR6 a malformed pinned sha → FAIL (cannot classify, never a silent skip)", () => {
  assert.equal(classifyWitnessRepro({ pinnedSourceSha: "", currentSourceSha: ROTATED, retired: ENTRY }).verdict, WITNESS_REPRO_VERDICT.FAIL);
});

test("RE retiredEntry: hit by slug, miss otherwise, null on a non-array registry", () => {
  const reg = [ENTRY, { slug: "cottage-patternbook", retiredSourceSha: ROTATED, ticket: "T-138-02", reason: "cottage" }];
  assert.equal(retiredEntry("barn-patternbook", reg), ENTRY);
  assert.equal(retiredEntry("nope", reg), null);
  assert.equal(retiredEntry("barn-patternbook", null), null);
});
