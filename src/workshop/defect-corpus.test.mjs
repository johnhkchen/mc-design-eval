// Tests for the E-40 / S-167 defect-corpus loader (T-167-01). Pure I/O + schema — reading and
// validating the committed corpus needs NO model spend (S-167 AC). These also guard the labels'
// referenced assets exist on disk, so a moved render/concept fails `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

import {
  loadDefectCorpus,
  parseDefectCorpus,
  assertSemantics,
  singleStates,
  pairStates,
  statePaths,
  DEFECT_CORPUS_SCHEMA,
  REPO_ROOT,
} from "./defect-corpus.mjs";
import { DEPARTMENTS } from "../pack/departments.mjs";

// ---- DC1: the committed corpus loads, has >=8 states, and carries the rater + exclusions ----
test("DC1 committed corpus loads and meets the S-167 shape", () => {
  const corpus = loadDefectCorpus();
  assert.equal(corpus.schema, DEFECT_CORPUS_SCHEMA);
  assert.ok(corpus.states.length >= 8, `expected >=8 states, got ${corpus.states.length}`);
  assert.ok(typeof corpus.rater === "string" && corpus.rater.length > 0, "rater field required");
  assert.ok(Array.isArray(corpus.excluded) && corpus.excluded.length >= 1,
    "exclusions must be logged (no-padding evidence)");
  for (const e of corpus.excluded) assert.ok(e.reason && e.reason.length > 0, `excluded ${e.id} needs a reason`);
});

// ---- DC2: every single-state worstDepartment is a real DEPARTMENT (one composition point) ----
test("DC2 worstDepartment is always a member of DEPARTMENTS", () => {
  const corpus = loadDefectCorpus();
  for (const s of singleStates(corpus)) {
    assert.ok(DEPARTMENTS.includes(s.labels.worstDepartment),
      `state ${s.id}: ${s.labels.worstDepartment} not in ${DEPARTMENTS.join(",")}`);
  }
});

// ---- DC3: pair states carry the pairwise more-faithful label with a valid verdict ----
test("DC3 pair states carry matched/wrongStyle concepts and a moreFaithful verdict", () => {
  const corpus = loadDefectCorpus();
  const pairs = pairStates(corpus);
  assert.ok(pairs.length >= 1, "expected at least one wrong-style pair");
  for (const p of pairs) {
    assert.ok(["matched", "wrongStyle"].includes(p.labels.moreFaithful), `${p.id} moreFaithful invalid`);
    assert.ok(p.labels.matchedConcept && p.labels.wrongStyleConcept, `${p.id} missing a concept`);
  }
});

// ---- DC4: single + pair partition the states exactly (no third kind slips through) ----
test("DC4 singleStates and pairStates partition states", () => {
  const corpus = loadDefectCorpus();
  assert.equal(singleStates(corpus).length + pairStates(corpus).length, corpus.states.length);
});

// ---- DC5: ids are unique across states and exclusions ----
test("DC5 all ids unique across states and excluded", () => {
  const corpus = loadDefectCorpus();
  const ids = [...corpus.states.map((s) => s.id), ...corpus.excluded.map((e) => e.id)];
  assert.equal(new Set(ids).size, ids.length, "duplicate id found");
});

// ---- DC6: every referenced asset exists on disk (concept + renderDir, both concepts for pairs) ----
test("DC6 every referenced concept and renderDir exists on disk", () => {
  const corpus = loadDefectCorpus();
  for (const s of corpus.states) {
    for (const p of statePaths(s)) {
      const abs = resolve(REPO_ROOT, p);
      assert.ok(existsSync(abs), `state ${s.id}: missing asset ${p}`);
    }
    // renderDir must be a directory; concepts must be files
    assert.ok(statSync(resolve(REPO_ROOT, s.renderDir)).isDirectory(), `${s.id}: renderDir not a dir`);
  }
});

// ---- DC7: schema rejects malformed input as a value (non-throwing parse) ----
test("DC7 parseDefectCorpus rejects malformed corpus without throwing", () => {
  const bad = { schema: "eval-alignment/defect-corpus/v1", rater: "x", states: [] }; // <8 states
  const res = parseDefectCorpus(bad);
  assert.equal(res.ok, false);
  assert.ok(res.errors.length > 0);

  const badJson = parseDefectCorpus("{not json");
  assert.equal(badJson.ok, false);
});

// ---- DC8: assertSemantics throws on an out-of-vocabulary worstDepartment ----
test("DC8 assertSemantics rejects a non-department worstDepartment", () => {
  const corpus = {
    states: [{ id: "x", kind: "single", labels: { worstDepartment: "MASSING", confidence: "high" } }],
  };
  assert.throws(() => assertSemantics(corpus), /not a department/);
});

// ---- DC9: assertSemantics throws on a duplicate id ----
test("DC9 assertSemantics rejects a duplicate state id", () => {
  const corpus = {
    states: [
      { id: "dup", kind: "single", labels: { worstDepartment: "ROOF", confidence: "high" } },
      { id: "dup", kind: "single", labels: { worstDepartment: "WALL", confidence: "low" } },
    ],
  };
  assert.throws(() => assertSemantics(corpus), /duplicate state id/);
});
