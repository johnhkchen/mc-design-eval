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
  pairAgreement,
  kindReliability,
  itemStyleClass,
  PENALTY,
  WRONG_STYLE,
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
  // precedence: a "...storey walls" region is a WALL defect — WALL is checked before ROOM, and "storey"
  // is not a ROOM word (it is an envelope level). Pins the T-166-01 adapter fix that moved the bake-off.
  assert.deepEqual(regionToDepartment("upper storey walls (both masses)"), { department: "WALL", matched: true });
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
  assert.deepEqual(WRONG_STYLE, { cap: 40, distance: 12 }); // E-40 style-distance constants, one source
});

// ---- BO8: itemStyleClass — the structural triple read + the typed-kind short-circuit (E-40/S-168) ----
// The classifier reads the EMPTINESS of the expected/present/missing triple (missing→add,
// present-but-wrong→replace, absent→remove), never the free-text content.
test("BO8 itemStyleClass reads the triple structurally and honours a typed kind", () => {
  // structural: present non-empty + missing non-empty ⇒ wrong-style (replace)
  assert.equal(itemStyleClass({ present: "rough rustic stone", missing: "polychrome glazed brick" }), "wrong-style");
  // present empty ⇒ absent (add — the element is not built yet)
  assert.equal(itemStyleClass({ present: "", missing: "the steep gable roof" }), "absent");
  assert.equal(itemStyleClass({ present: "   ", missing: "a roof" }), "absent"); // whitespace is empty
  // present non-empty + missing empty ⇒ match (noted, nothing missing)
  assert.equal(itemStyleClass({ present: "ashlar wall", missing: "" }), "match");
  // defensive defaults: no fields ⇒ absent (this is why BO4/BO5 severity-only items keep the old math)
  assert.equal(itemStyleClass({ severity: "major" }), "absent");
  assert.equal(itemStyleClass({}), "absent");
  // the TYPED tag (scoped E-39 schema feedback) WINS over structure when present — forward-compatible
  assert.equal(itemStyleClass({ kind: "replace", present: "" }), "wrong-style");
  assert.equal(itemStyleClass({ kind: "add", present: "has something" }), "absent");
  assert.equal(itemStyleClass({ kind: "remove", present: "", missing: "x" }), "match");
});

// ---- BO9: matched vs wrong-style now SEPARATE (were tied under the severity-only scalar) ----
// The headline AC test. Hold the OLD signal (severity sum) EQUAL across the two builds, so only the new
// present-aware term can separate them — making "was tied" concrete, not asserted.
test("BO9 the style-distance term separates matched from wrong-style that the old scalar tied", () => {
  // matched: incomplete-but-RIGHT-style — 3 absent majors (present empty). Old & new agree: 100 − 3×20 = 40.
  const matched = { items: [
    { department: "ROOF", present: "", missing: "a steeper ridge course", severity: "major" },
    { department: "WALL", present: "", missing: "a quoin course", severity: "major" },
    { department: "OPENING", present: "", missing: "a dressed lintel", severity: "major" },
  ] };
  // wrong-style: complete but WRONG — 3 present-but-wrong-style majors. SAME severity profile as matched.
  const wrongStyle = { items: [
    { department: "ROOF", present: "flat classical entablature", missing: "a pitched gable", severity: "major" },
    { department: "WALL", present: "polychrome glazed brick", missing: "rustic rubble masonry", severity: "major" },
    { department: "OPENING", present: "a Corinthian portico", missing: "a timber-framed arch", severity: "major" },
  ] };

  // OLD math (severity-only, the E-39 scalar) recomputed inline — the two builds were TIED.
  const oldScore = (c) => Math.max(0, Math.min(100, 100 - c.items.reduce((s, i) => s + (PENALTY[i.severity] ?? PENALTY.minor), 0)));
  assert.equal(oldScore(matched), 40);
  assert.equal(oldScore(wrongStyle), 40);
  assert.ok(Math.abs(oldScore(matched) - oldScore(wrongStyle)) <= 12, "old scalar tied them within the E-38 noise band");

  // NEW math: matched stays 40 (all absent, no cap); wrong-style craters and is capped.
  const mNew = styleFidelityScore(matched);
  const wNew = styleFidelityScore(wrongStyle);
  assert.equal(mNew, 40); // incomplete-but-right-style is untouched by the new term
  assert.ok(wNew <= WRONG_STYLE.cap, `wrong-style is capped (${wNew} <= ${WRONG_STYLE.cap})`);
  assert.equal(wNew, 4); // clamp(100 − 3×(20+12)) = clamp(4) = 4, min(4,40) = 4 — breadth-graded below the cap
  assert.ok(mNew - wNew >= 30, `the new term separates what the old one tied (spread ${mNew - wNew})`);

  // evidence reports the crater cause
  const ev = critiqueEvidence(wrongStyle);
  assert.equal(ev.nWrongStyle, 3);
  assert.equal(ev.wrongStyleCapped, true);
  assert.equal(critiqueEvidence(matched).nWrongStyle, 0);
});

// ---- BO10: incomplete-but-right-style is NOT over-penalized by the new term ----
test("BO10 an incomplete-but-right-style (absent) build is docked only for severity, never capped", () => {
  // present empty everywhere ⇒ absent ⇒ the new style-distance term does NOT fire.
  const incomplete = { items: [
    { department: "ROOF", present: "", missing: "the whole roof", severity: "major" },
    { department: "CHIMNEY", present: "", missing: "the chimney stack", severity: "minor" },
  ] };
  const score = styleFidelityScore(incomplete);
  assert.equal(score, 100 - PENALTY.major - PENALTY.minor); // 72 — pure missing-element math
  assert.ok(score > WRONG_STYLE.cap, "not capped — it is the right style, just unfinished");
  assert.equal(critiqueEvidence(incomplete).wrongStyleCapped, false);
});

// ---- BO11: the F1 boundary — a present-but-detail-incomplete item is a KNOWN over-penalty ----
// Pins the CURRENT behavior so the typed-grammar-tag fix (schema-feedback.md) flips it DELIBERATELY.
// A right-base-material-but-missing-detail item is structurally indistinguishable from wrong-material
// replace without reading content — so it is (today) classed wrong-style and caps the score. We refuse
// the brittle string-overlap hack; the remedy is the typed `kind` tag from Layer A (see schema-feedback.md).
test("BO11 KNOWN LIMIT: present-but-detail-incomplete is classed wrong-style (typed tag is the fix)", () => {
  const detailIncomplete = { present: "plain plaster", missing: "timber stud framing", severity: "major" };
  assert.equal(itemStyleClass(detailIncomplete), "wrong-style"); // the over-penalty, pinned
  // the typed tag would correct it to "absent" (an add of detail), un-capping the score:
  assert.equal(itemStyleClass({ ...detailIncomplete, kind: "add" }), "absent");
});

// ---- BO12: pairAgreement buckets easy vs contested SEPARATELY, never averages them ----
// AC #2's referee: ordering agreement with the human moreFaithful label, split by confidence so an
// empty contested bucket (the S-167 corpus excludes its contested pair) shows instead of being hidden.
test("BO12 pairAgreement splits easy/contested by confidence and reports ordering agreement", () => {
  const rows = [
    { key: "g-arc", confidence: "high", moreFaithful: "matched", matchedScore: 40, wrongScore: 4 },   // agree
    { key: "g-chap", confidence: "high", moreFaithful: "matched", matchedScore: 12, wrongScore: 30 }, // DISagree (ordering wrong)
    { key: "c-mid", confidence: "medium", moreFaithful: "matched", matchedScore: 30, wrongScore: 10 },// contested, agree
  ];
  const r = pairAgreement(rows);
  // easy bucket = the two high-confidence pairs; 1 of 2 ordered correctly
  assert.equal(r.easy.n, 2);
  assert.equal(r.easy.agree, 1);
  assert.equal(r.easy.rate, 0.5);
  assert.equal(r.easy.pairs[0].margin, 36); // matched 40 − wrong 4
  assert.equal(r.easy.pairs[0].agree, true);
  assert.equal(r.easy.pairs[1].agree, false);
  // contested bucket = the medium-confidence pair, NOT folded into easy
  assert.equal(r.contested.n, 1);
  assert.equal(r.contested.agree, 1);
  assert.equal(r.contested.rate, 1);
  // overall is reported but the buckets are not averaged away
  assert.equal(r.overall.n, 3);
  assert.equal(r.overall.agree, 2);
});

test("BO12b pairAgreement: empty contested bucket yields no NaN; defensive 'wrong' branch", () => {
  // The real corpus shape: all pairs high-confidence ⇒ contested is EMPTY by construction.
  const allEasy = pairAgreement([
    { key: "a", confidence: "high", moreFaithful: "matched", matchedScore: 40, wrongScore: 0 },
  ]);
  assert.equal(allEasy.contested.n, 0);
  assert.equal(allEasy.contested.rate, 0); // not NaN
  assert.deepEqual(allEasy.contested.pairs, []);
  // empty input ⇒ all rates 0, no NaN
  const empty = pairAgreement([]);
  assert.equal(empty.overall.rate, 0);
  assert.equal(empty.easy.rate, 0);
  // defensive moreFaithful:"wrong" ⇒ agree iff wrong scored higher
  const wrong = pairAgreement([
    { key: "w", confidence: "high", moreFaithful: "wrong", matchedScore: 4, wrongScore: 40 },
  ]);
  assert.equal(wrong.easy.agree, 1); // wrong (40) > matched (4) and label says wrong ⇒ agree
});

// ---- BO13: kindReliability — condition-level tag distribution + the MATCHED/WRONG replace contrast ----
test("BO13 kindReliability tallies per-condition kinds and the matched-vs-wrong replace contrast", () => {
  // MATCHED build vs its own concept: detail-only divergences tag `add` (non-capping) — over-cap removed.
  const matched = { key: "A-matched", tier: "MATCHED", votes: [{ items: [
    { kind: "add", styleClass: "absent" },
    { kind: "remove", styleClass: "match" },
  ] }] };
  // WRONG-style: wrong-material divergences tag `replace` (capping) — the correct cap.
  const wrong = { key: "B-arc", tier: "WRONG", votes: [{ items: [
    { kind: "replace", styleClass: "wrong-style" },
    { kind: "replace", styleClass: "wrong-style" },
  ] }] };
  const r = kindReliability([matched, wrong]);

  // per-condition counts + rates
  assert.equal(r.perCondition["A-matched"].add, 1);
  assert.equal(r.perCondition["A-matched"].remove, 1);
  assert.equal(r.perCondition["A-matched"].replaceRate, 0);
  assert.equal(r.perCondition["A-matched"].cappingRate, 0);
  assert.equal(r.perCondition["B-arc"].replace, 2);
  assert.equal(r.perCondition["B-arc"].replaceRate, 1);
  assert.equal(r.perCondition["B-arc"].cappingRate, 1);

  // contrast = WRONG.replaceRate (1) − MATCHED.replaceRate (0) = 1 ⇒ DISCRIMINATES
  assert.equal(r.byTier.MATCHED.replaceRate, 0);
  assert.equal(r.byTier.WRONG.replaceRate, 1);
  assert.equal(r.replaceContrast, 1);
  assert.match(r.verdict, /DISCRIMINATES/);

  // NO CONTRAST: matched also tags replace (the E-40 collapse signature, now via kind)
  const collapse = kindReliability([
    { key: "m", tier: "MATCHED", votes: [{ items: [{ kind: "replace", styleClass: "wrong-style" }] }] },
    { key: "w", tier: "WRONG", votes: [{ items: [{ kind: "replace", styleClass: "wrong-style" }] }] },
  ]);
  assert.equal(collapse.replaceContrast, 0);
  assert.match(collapse.verdict, /NO CONTRAST/);

  // UNRELIABLE: an item with no kind ⇒ structural fallback fired. styleClass recomputed when absent.
  const untagged = kindReliability([
    { key: "m", tier: "MATCHED", votes: [{ items: [{ present: "x", missing: "y" }] }] }, // no kind → untagged, recompute → wrong-style
    { key: "w", tier: "WRONG", votes: [{ items: [{ kind: "replace", styleClass: "wrong-style" }] }] },
  ]);
  assert.equal(untagged.perCondition["m"].untagged, 1);
  assert.equal(untagged.perCondition["m"].cappingRate, 1); // recomputed via itemStyleClass(present&&missing)
  assert.match(untagged.verdict, /UNRELIABLE/);

  // empty / single-tier safety: no NaN; contrast null when a tier is empty
  const empty = kindReliability([]);
  assert.equal(empty.replaceContrast, null);
  assert.equal(empty.byTier.WRONG.replaceRate, 0);
  assert.match(empty.verdict, /INSUFFICIENT/);
  const onlyMatched = kindReliability([{ key: "m", tier: "MATCHED", votes: [{ items: [{ kind: "add" }] }] }]);
  assert.equal(onlyMatched.replaceContrast, null);
});
