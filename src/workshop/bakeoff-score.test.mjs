// Tests for the S-166 bake-off scoring core (T-166-01, story S-166, epic E-39). Pure — the only part of
// the referee that gates `npm test`; the live harnesses are metered witnesses, not tests.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  regionToDepartment,
  worstDepartmentOfDispatch,
  worstDepartmentOfFusedReply,
  styleFidelityScore,
  critiqueEvidence,
  dispatchCorrectness,
  PENALTY,
  BAKEOFF_SCHEMA,
} from "./bakeoff-score.mjs";
import { DEPARTMENTS } from "../pack/departments.mjs";

// ---- BO1: regionToDepartment — one keyword per department + the visible default ----
test("BO1 regionToDepartment maps each department's keywords and flags the unmatched default", () => {
  assert.deepEqual(regionToDepartment("the steep gable roof"), { department: "ROOF", matched: true });
  assert.deepEqual(regionToDepartment("front arched gate"), { department: "OPENING", matched: true });
  assert.deepEqual(regionToDepartment("the brick chimney"), { department: "CHIMNEY", matched: true });
  assert.deepEqual(regionToDepartment("ground floor interior"), { department: "ROOM", matched: true });
  assert.deepEqual(regionToDepartment("rubble masonry wall"), { department: "WALL", matched: true });
  // no keyword → defaults to WALL but flags matched:false so the fused path's lossiness is visible
  const d = regionToDepartment("the overall vibe");
  assert.equal(d.department, "WALL");
  assert.equal(d.matched, false);
  // non-string is tolerated (empty text → unmatched default)
  assert.deepEqual(regionToDepartment(undefined), { department: "WALL", matched: false });
});

test("BO1b every mapped department is a real DEPARTMENTS member", () => {
  for (const txt of ["roof", "door", "chimney", "floor", "wall", "nonsense"]) {
    assert.ok(DEPARTMENTS.includes(regionToDepartment(txt).department));
  }
});

// ---- BO2: worstDepartmentOfDispatch — first (worst-first) item, throws on empty ----
test("BO2 worstDepartmentOfDispatch returns the first item's department", () => {
  assert.equal(
    worstDepartmentOfDispatch([{ department: "ROOF", idiom: "roof.gable" }, { department: "WALL", idiom: "plinth" }]),
    "ROOF",
  );
  assert.throws(() => worstDepartmentOfDispatch([]), /not a routing/);
  assert.throws(() => worstDepartmentOfDispatch([{ department: "NOPE" }]), /not a department/);
});

// ---- BO3: worstDepartmentOfFusedReply — first major else first, region-mapped ----
test("BO3 worstDepartmentOfFusedReply prefers the first major issue", () => {
  const reply = {
    critique: {
      issues: [
        { region: "a minor block tint", severity: "minor" },
        { region: "the missing roof", severity: "major" },
      ],
    },
  };
  const w = worstDepartmentOfFusedReply(reply);
  assert.equal(w.department, "ROOF");
  assert.equal(w.matched, true);
  assert.equal(w.region, "the missing roof");
});

test("BO3b falls back to the first issue when none is major; throws on no issues", () => {
  const reply = { critique: { issues: [{ region: "front gate", severity: "minor" }] } };
  assert.equal(worstDepartmentOfFusedReply(reply).department, "OPENING");
  assert.throws(() => worstDepartmentOfFusedReply({ critique: { issues: [] } }), /no issues/);
});

// ---- BO4: styleFidelityScore — penalty sum, clamp, empty=100 ----
test("BO4 styleFidelityScore subtracts severity-weighted penalties and clamps", () => {
  assert.equal(styleFidelityScore({ items: [] }), 100);
  assert.equal(styleFidelityScore({ items: [{ severity: "major" }] }), 100 - PENALTY.major);
  assert.equal(styleFidelityScore({ items: [{ severity: "minor" }, { severity: "minor" }] }), 100 - 2 * PENALTY.minor);
  // floor at 0 — a wall of majors craters, never negative
  assert.equal(styleFidelityScore({ items: Array(10).fill({ severity: "major" }) }), 0);
  // unknown severity falls to the minor penalty (defensive)
  assert.equal(styleFidelityScore({ items: [{ severity: "???" }] }), 100 - PENALTY.minor);
});

// ---- BO5: critiqueEvidence — the reported bundle ----
test("BO5 critiqueEvidence bundles score + counts + the missing strings", () => {
  const critique = {
    items: [
      { department: "ROOF", missing: "round-arched voussoirs", severity: "major" },
      { department: "WALL", missing: "  ", severity: "minor" },
      { department: "OPENING", missing: "dressed ashlar jambs", severity: "major" },
    ],
  };
  const e = critiqueEvidence(critique);
  assert.equal(e.nItems, 3);
  assert.equal(e.nMajor, 2);
  assert.deepEqual(e.departments, ["ROOF", "WALL", "OPENING"]);
  assert.deepEqual(e.missing, ["round-arched voussoirs", "dressed ashlar jambs"]); // blanks dropped
  assert.equal(e.score, 100 - 2 * PENALTY.major - PENALTY.minor);
});

// ---- BO6: dispatchCorrectness — aggregation + the three verdicts ----
test("BO6 dispatchCorrectness counts per-path correctness and picks the verdict", () => {
  const rows = [
    { key: "g", ground: "ROOF", splitDept: "ROOF", fusedDept: "ROOF", fusedMatched: true },
    { key: "b", ground: "WALL", splitDept: "WALL", fusedDept: "WALL", fusedMatched: false },
    { key: "c", ground: "OPENING", splitDept: "OPENING", fusedDept: "WALL", fusedMatched: false },
  ];
  const r = dispatchCorrectness(rows);
  assert.equal(r.n, 3);
  assert.equal(r.split.correct, 3);
  assert.equal(r.fused.correct, 2);
  assert.equal(r.fused.unmatchedRegions, 2);
  assert.match(r.verdict, /SPLIT WINS/);
  assert.deepEqual(r.perState.g, { ground: "ROOF", split: ["ROOF"], fused: ["ROOF"] });
});

test("BO6b tie and fused-win verdicts are reported honestly", () => {
  const tie = dispatchCorrectness([{ key: "a", ground: "ROOF", splitDept: "ROOF", fusedDept: "ROOF" }]);
  assert.match(tie.verdict, /TIE/);
  const fusedWin = dispatchCorrectness([
    { key: "a", ground: "ROOF", splitDept: "WALL", fusedDept: "ROOF" },
  ]);
  assert.match(fusedWin.verdict, /FUSED WINS/);
  assert.equal(dispatchCorrectness([]).verdict, "NO STATES");
});

test("BO7 schema + penalty constants are exported and stable", () => {
  assert.equal(BAKEOFF_SCHEMA, "bakeoff/v1");
  assert.deepEqual(PENALTY, { major: 20, minor: 8 });
});
