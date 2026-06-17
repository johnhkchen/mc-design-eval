// The S-166 bake-off scoring core (T-166-01, story S-166, epic E-39) — the referee's PURE arithmetic.
// E-39's whole bet is falsifiable; this module holds the decisions a reviewer must trust so they are
// unit-tested and single-sourced, while the live metered harnesses (experiments/eval-alignment/) stay
// thin I/O shells. Two claims:
//
//   (1) SPLIT BEATS FUSED — does diagnose→route dispatch to the worst defect's correct DEPARTMENT more
//       often than the fused WorkshopReply? The split path emits a typed `department` by construction;
//       the fused path emits a free-text `region` + an action lever, so it needs a region→department
//       ADAPTER. That adapter is LOSSY ON PURPOSE-VISIBLY: regionToDepartment reports `matched:false`
//       when no keyword hits (it defaults to WALL), so the fused path's untyped-ness is in the evidence,
//       never hidden — the typing is part of WHY split may win.
//   (2) WITHIN-FAMILY GRADIENT — a clean build scored against a wrong-style concept must score far below
//       the same build against its matched-style concept. styleFidelityScore turns the structured per-
//       style Critique into a 0-100 scalar (an explainable convenience; the `missing` strings are the
//       real proof) so the crater is a number beside the E-38 flat 22-32.
//
// THIS IS CREATION-LOOP MEASUREMENT, NOT THE FROZEN INSTRUMENT. No gate vocabulary, no scalar judge.
// PURE — no GL/IO/Date/random/model — runs under the `src/**/*.test.mjs` glob. Keyed only on DEPARTMENTS.

import { DEPARTMENTS } from "../pack/departments.mjs";

/** Evidence tag for the harness JSON. */
export const BAKEOFF_SCHEMA = "bakeoff/v1";

/** Severity penalties for styleFidelityScore — one source the test + FINDINGS both cite. */
export const PENALTY = Object.freeze({ major: 20, minor: 8 });

/**
 * The STYLE-DISTANCE term's constants (E-40/S-168; RE-CALIBRATED E-45/S-181/T-181-01) — one source, the
 * PENALTY pattern. A present-but-wrong-style item adds a severity-weighted penalty plus one `distance`
 * unit, and the whole score is capped by a GRADED ceiling that falls with the BREADTH of wrong-style
 * (distinct departments). The two constants now do this:
 *   - `distance` (12) is one "style-distance unit", used TWICE: the per-item surcharge above severity AND
 *     the per-department cap-grade STEP (`cap(b) = max(cap, 100 − distance·b)`). It is the same quantity —
 *     how far one wrong department sits from the style — so coupling them is principled, not a second knob.
 *   - `cap` (40) is now the WRONG-IN-ALL FLOOR: with 5 departments, `cap(5) = 100 − 12·5 = 40`. A build
 *     wrong in every department sinks to it; a build wrong in ONE sits near the ceiling (`cap(1) = 88`).
 * This replaces the original BINARY hard cap (T-180-01 AUDIT: the flat `min(score,40)` compressed every
 * ≥1-wrong build into [0,40], crushing a faithful-except-one build into the same band as a wrong-in-two —
 * "the binary-cap collapse"). The graded cap is monotone non-increasing in breadth, so a faithful build
 * with one legit off element (the dark-oak roof) ranks well above a wrong-in-every-department build.
 */
export const WRONG_STYLE = Object.freeze({ cap: 40, distance: 12 });

const nonEmpty = (s) => typeof s === "string" && s.trim().length > 0;

/**
 * Per-item style class from a Layer-A CritiqueItem — PURE and STRUCTURAL. It reads the EMPTINESS of the
 * expected/present/missing triple (the repo's sanctioned element vocabulary: missing→ADD,
 * present-but-wrong→REPLACE, absent→REMOVE — department.baml / departments.mjs), NOT the free-text
 * CONTENT. So it never does the brittle keyword matching the ticket forbids; it asks only "did the build
 * put SOMETHING here that differs from what the style wants?".
 *
 *   present non-empty AND missing non-empty  => "wrong-style" (replace — capping)
 *   present empty                            => "absent"      (add — incomplete, NOT capping)
 *   present non-empty AND missing empty      => "match"       (noted, nothing missing)
 *
 * If Layer A later ships a TYPED discriminator (`kind: "add"|"replace"|"remove"`, the scoped E-39 schema
 * feedback this ticket files), it WINS over the structural read — forward-compatible, no code change.
 *
 * KNOWN BOUNDARY (the falsifiable-claim failure mode F1, pinned not faked — see BO11 + schema-feedback.md):
 * a build with the RIGHT base material but a missing DETAIL (present="plain plaster", missing="timber
 * studs") is structurally indistinguishable from wrong-material replace without comparing CONTENT, so it
 * is currently classed "wrong-style". The fix is the typed tag, not a string heuristic.
 *
 * @param {{present?:string, missing?:string, kind?:string}} item a CritiqueItem-shaped object
 * @returns {"wrong-style"|"absent"|"match"}
 */
export function itemStyleClass(item) {
  const kind = item?.kind;
  if (kind === "replace") return "wrong-style";
  if (kind === "add") return "absent";
  if (kind === "remove") return "match";
  const present = nonEmpty(item?.present);
  const missing = nonEmpty(item?.missing);
  if (present && missing) return "wrong-style";
  if (!present) return "absent";
  return "match";
}

// Keyword → department. ORDER MATTERS for first-match: the more specific department predicates are
// listed before WALL's generic envelope words so e.g. "roof" wins over a stray "wall" later in the text.
// Unlike departmentOf (which throws on ambiguity), free text is allowed to be loose — first hit wins.
//
// WALL is checked BEFORE ROOM on purpose: a region like "upper storey walls" is a WALL defect (the words
// name walls); only an explicit interior/floor word should win ROOM. (This precedence is consequential —
// see T-166-01 FINDINGS: a "...storey walls" region mis-filed to ROOM flips the bake-off verdict.) "storey"
// is NOT a ROOM word — it denotes a vertical envelope LEVEL, not an interior room.
const KEYWORDS = Object.freeze([
  ["ROOF", ["roof", "gable", "ridge", "eave", "thatch", "dormer", "pitch", "rafter"]],
  ["OPENING", ["door", "window", "arch", "opening", "gate", "lintel", "voussoir", "jamb", "portal"]],
  ["CHIMNEY", ["chimney", "flue", "smokestack", "stack"]],
  ["WALL", ["wall", "facade", "façade", "plinth", "quoin", "corner", "masonry", "timber", "frame", "ashlar", "pilaster", "cladding"]],
  ["ROOM", ["floor", "interior", "room", "hollow", "rafter-bay"]],
]);

/**
 * Map a fused reply's free-text `region` to a construction department — the LOSSY adapter the split path
 * does not need. First keyword hit (across departments, in KEYWORDS order) wins.
 * @param {string} text a region label like "the roof" or "front facade"
 * @returns {{department: string, matched: boolean}} matched=false ⇒ no keyword hit, defaulted to WALL
 *          (the visible lossiness — count these when reporting the fused path's typing handicap).
 */
export function regionToDepartment(text) {
  const t = typeof text === "string" ? text.toLowerCase() : "";
  for (const [dept, words] of KEYWORDS) {
    if (words.some((w) => t.includes(w))) return { department: dept, matched: true };
  }
  return { department: "WALL", matched: false };
}

/**
 * The split path's worst-defect department = the router's first (worst-first) dispatch item.
 * @param {ReadonlyArray<{department:string}>} dispatch a resolved dispatch (route.mjs::resolveDispatch)
 * @returns {string} a member of DEPARTMENTS
 * @throws if the dispatch is empty (no routing — mirrors resolveDispatch's contract).
 */
export function worstDepartmentOfDispatch(dispatch) {
  if (!Array.isArray(dispatch) || dispatch.length === 0) {
    throw new Error("worstDepartmentOfDispatch: empty dispatch is not a routing");
  }
  const d = dispatch[0]?.department;
  if (!DEPARTMENTS.includes(d)) {
    throw new Error(`worstDepartmentOfDispatch: "${d}" is not a department (${DEPARTMENTS.join(", ")})`);
  }
  return d;
}

/**
 * The fused path's worst-defect department: the first `major` issue (else the first issue), region-mapped.
 * @param {{critique:{issues:Array<{region:string, severity:string}>}}} reply a parsed WorkshopReply
 * @returns {{department:string, matched:boolean, region:string}}
 * @throws if the reply names no issues (nothing to route).
 */
export function worstDepartmentOfFusedReply(reply) {
  const issues = reply?.critique?.issues;
  if (!Array.isArray(issues) || issues.length === 0) {
    throw new Error("worstDepartmentOfFusedReply: reply has no issues");
  }
  const worst = issues.find((i) => i?.severity === "major") ?? issues[0];
  const { department, matched } = regionToDepartment(worst?.region);
  return { department, matched, region: worst?.region ?? "" };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * The BREADTH of wrong-style — the count of DISTINCT departments carrying a present-but-wrong-style item.
 * This is the sanctioned style-distance measure (E-40 / T-180-01: "more wrong-style DEPARTMENTS ⇒ lower"):
 * two wrong items in the SAME department are one department of wrong-ness, not two. An item with no
 * `department` falls back to a per-index key so it still counts as breadth (conservative — more breadth
 * lowers the cap). Single-sourced so styleFidelityScore and critiqueEvidence agree.
 * @param {ReadonlyArray<object>} items CritiqueItem-shaped objects
 * @returns {number} number of distinct wrong-style departments
 */
function wrongStyleBreadth(items) {
  const depts = new Set();
  (items ?? []).forEach((it, i) => {
    if (itemStyleClass(it) === "wrong-style") depts.add(it?.department ?? `__item${i}`);
  });
  return depts.size;
}

/** The graded style-distance ceiling for a given wrong-style breadth (0 ⇒ no cap). */
function gradedCapFor(breadth) {
  return breadth > 0 ? Math.max(WRONG_STYLE.cap, 100 - breadth * WRONG_STYLE.distance) : null;
}

/**
 * A 0-100 style-fidelity scalar derived from a per-style Critique. Two terms (E-40/S-168; RE-CALIBRATED
 * E-45/S-181):
 *   (1) the MISSING-element term (unchanged from E-39): each absent/match item subtracts its severity
 *       penalty — a build that is incomplete-but-RIGHT-style is docked only for what it has not built;
 *   (2) the STYLE-DISTANCE term: each present-but-WRONG-style item (itemStyleClass) subtracts a
 *       SEVERITY-RESPECTING penalty (PENALTY[severity], default major) + WRONG_STYLE.distance, and the
 *       whole score is capped by a GRADED ceiling gradedCapFor(breadth) that falls with the number of
 *       distinct wrong-style departments.
 * The recalibration (T-180-01 AUDIT) replaces the original BINARY cap and the SEVERITY-BLIND forced major:
 *   - severity-respecting per-item: a minor wrong-style no longer costs a forced major (the AUDIT's named
 *     binding floor); missing severity still defaults to major (wrong-style is inherently serious);
 *   - graded cap: one off element sits near the ceiling (cap(1)=88), wrong-in-every-department floors at
 *     WRONG_STYLE.cap (40) — monotone in breadth, so the binary-cap collapse is gone.
 * Empty critique ⇒ 100. An item with no `present` field ⇒ "absent" ⇒ the exact pre-E-40 math (back-compat).
 * @param {{items:Array<{severity?:string, present?:string, missing?:string, kind?:string, department?:string}>}} critique
 * @returns {number} integer 0-100
 */
export function styleFidelityScore(critique) {
  const items = critique?.items ?? [];
  let penalty = 0;
  for (const it of items) {
    if (itemStyleClass(it) === "wrong-style") {
      // severity-respecting (default major) + one distance unit — replaces the old forced 32-per-replace
      penalty += (PENALTY[it?.severity] ?? PENALTY.major) + WRONG_STYLE.distance;
    } else {
      penalty += PENALTY[it?.severity] ?? PENALTY.minor; // the unchanged missing-element severity path
    }
  }
  let score = clamp(100 - penalty, 0, 100);
  const cap = gradedCapFor(wrongStyleBreadth(items));
  if (cap !== null) score = Math.min(score, cap); // completeness can't buy back wrong style; cap grades by breadth
  return score;
}

/**
 * The reported evidence bundle for one diagnosis — the scalar plus the qualitative crater (the `missing`
 * strings) and the department spread. This is what the crater harness writes and FINDINGS quotes.
 * @param {{items:Array<{department:string, missing:string, severity:string}>}} critique
 */
export function critiqueEvidence(critique) {
  const items = critique?.items ?? [];
  const nWrongStyle = items.filter((i) => itemStyleClass(i) === "wrong-style").length;
  const breadth = wrongStyleBreadth(items);
  return {
    score: styleFidelityScore(critique),
    nItems: items.length,
    nMajor: items.filter((i) => i?.severity === "major").length,
    departments: items.map((i) => i?.department).filter(Boolean),
    missing: items.map((i) => i?.missing).filter((m) => typeof m === "string" && m.trim().length > 0),
    // E-40 additive: the style-distance crater's cause — how many present-but-wrong-style items capped it.
    nWrongStyle,
    // wrongStyleCapped = the style-distance term FIRED (≥1 wrong-style). NB under the E-45 graded cap it may
    // not BIND for low breadth (the per-item penalty alone can already dominate) — see gradedCap below.
    wrongStyleCapped: nWrongStyle > 0,
    // E-45 additive (T-181-01): the recalibrated mechanism, reported beside the score for the crater harness.
    wrongStyleBreadth: breadth,           // distinct wrong-style departments — the style-distance measure
    gradedCap: gradedCapFor(breadth),     // the ceiling applied (null when no wrong-style)
  };
}

const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);

/**
 * Aggregate per-(state,vote) rows into split-vs-fused dispatch correctness. A row is correct for a path
 * when that path's worst-defect department equals the analyst ground-truth department.
 * @param {Array<{key:string, ground:string, splitDept:string, fusedDept:string, fusedMatched?:boolean}>} rows
 * @returns {{n:number, split:{correct:number, rate:number}, fused:{correct:number, rate:number,
 *           unmatchedRegions:number}, perState:object, verdict:string}}
 */
export function dispatchCorrectness(rows) {
  const n = rows.length;
  const splitCorrect = rows.filter((r) => r.splitDept === r.ground).length;
  const fusedCorrect = rows.filter((r) => r.fusedDept === r.ground).length;
  const unmatched = rows.filter((r) => r.fusedMatched === false).length;
  const perState = {};
  for (const r of rows) {
    const k = r.key;
    perState[k] ??= { ground: r.ground, split: [], fused: [] };
    perState[k].split.push(r.splitDept);
    perState[k].fused.push(r.fusedDept);
  }
  const rate = (c) => (n ? c / n : 0);
  const verdict = n === 0 ? "NO STATES"
    : splitCorrect > fusedCorrect ? "SPLIT WINS (routes to the correct department more often)"
    : splitCorrect < fusedCorrect ? "FUSED WINS (collapse the split — report)"
    : "TIE (the two-call split buys no dispatch gain — recommend collapse)";
  return {
    n,
    split: { correct: splitCorrect, rate: rate(splitCorrect) },
    fused: { correct: fusedCorrect, rate: rate(fusedCorrect), unmatchedRegions: unmatched },
    perState,
    verdict,
  };
}

/**
 * Pairwise-label agreement for the style-distance crater (E-40/S-169, T-169-01). For each corpus PAIR
 * state we score the build against its MATCHED concept and against its WRONG-STYLE concept; the human
 * label (`moreFaithful`) says which should score higher. This aggregates whether the scored ORDERING
 * agrees with the human, SPLIT BY CONFIDENCE so the easy pairs and the contested middle are reported
 * SEPARATELY — never averaged. (The S-167 corpus excludes its contested pair as sub-threshold noise, so
 * the contested bucket can legitimately be EMPTY; that must show, not be hidden by an average.)
 *
 *   agree := the scored ordering matches the human label
 *     moreFaithful "matched" ⇒ agree iff matchedScore > wrongScore
 *     moreFaithful "wrong"   ⇒ agree iff wrongScore  > matchedScore   (defensive; the corpus has none)
 *   bucket := confidence === "high" ? "easy" : "contested"
 *
 * @param {Array<{key:string, confidence:string, moreFaithful:string, matchedScore:number,
 *                wrongScore:number}>} rows
 * @returns {{easy:Bucket, contested:Bucket, overall:{n:number, agree:number, rate:number}}}
 *          where Bucket = {n, agree, rate, pairs:[{key, matchedScore, wrongScore, margin, agree}]}
 */
export function pairAgreement(rows) {
  const mk = () => ({ n: 0, agree: 0, rate: 0, pairs: [] });
  const buckets = { easy: mk(), contested: mk() };
  let agreeAll = 0;
  for (const r of rows) {
    const margin = r.matchedScore - r.wrongScore; // matched minus wrong; >0 ⇒ matched scored higher
    const agree = r.moreFaithful === "wrong" ? margin < 0 : margin > 0;
    const b = r.confidence === "high" ? buckets.easy : buckets.contested;
    b.n += 1;
    if (agree) { b.agree += 1; agreeAll += 1; }
    b.pairs.push({ key: r.key, matchedScore: r.matchedScore, wrongScore: r.wrongScore, margin, agree });
  }
  for (const b of Object.values(buckets)) b.rate = b.n ? b.agree / b.n : 0;
  const n = rows.length;
  return { ...buckets, overall: { n, agree: agreeAll, rate: n ? agreeAll / n : 0 } };
}

/**
 * Per-condition typed-kind distribution + capping-rate for the T-170-02 crater rerun (E-41/S-170). The
 * defect corpus carries NO per-item kind ground truth, so reliability is reported as a CONDITION-LEVEL
 * expectation, not a per-item join: a MATCHED condition's divergences SHOULD skew add/remove (non-capping);
 * a WRONG-style condition's SHOULD skew replace (capping). The reliability signal is the CONTRAST
 * (WRONG.replaceRate − MATCHED.replaceRate), reported BESIDE — never folded into — the score.
 *
 * `untagged` (an item the judge returned with no `kind`) is the red flag: it means Layer A did not emit the
 * tag, so the scorer fell back to the structural triple read and the over-cap can persist for that reason.
 *
 * @param {Array<{key:string, tier:string, votes:Array<{items:Array<{kind?:string, styleClass?:string}>}>}>} conditions
 *        crater conditions (tier ∈ MATCHED|WRONG|CONTROL), each with its VOTES of persisted items.
 * @returns {{perCondition:Object, byTier:Object, replaceContrast:(number|null), verdict:string}}
 */
export function kindReliability(conditions) {
  const tally = (items) => {
    const c = { nItems: 0, add: 0, replace: 0, remove: 0, untagged: 0, capping: 0 };
    for (const it of items ?? []) {
      c.nItems += 1;
      const k = it?.kind;
      if (k === "add") c.add += 1;
      else if (k === "replace") c.replace += 1;
      else if (k === "remove") c.remove += 1;
      else c.untagged += 1;
      // styleClass is what the scorer derived; recompute defensively if the harness did not persist it.
      const sc = it?.styleClass ?? itemStyleClass(it);
      if (sc === "wrong-style") c.capping += 1;
    }
    return c;
  };
  const rate = (num, den) => (den ? num / den : 0);
  const perCondition = {};
  const tiers = { MATCHED: [], WRONG: [], CONTROL: [] };
  for (const cond of conditions ?? []) {
    const items = (cond.votes ?? []).flatMap((v) => v.items ?? []);
    const c = tally(items);
    perCondition[cond.key] = {
      tier: cond.tier, nItems: c.nItems, add: c.add, replace: c.replace, remove: c.remove,
      untagged: c.untagged, cappingRate: rate(c.capping, c.nItems), replaceRate: rate(c.replace, c.nItems),
    };
    if (tiers[cond.tier]) tiers[cond.tier].push(c);
  }
  const aggregate = (cs) => {
    const sum = cs.reduce((a, c) => ({
      nItems: a.nItems + c.nItems, replace: a.replace + c.replace,
      untagged: a.untagged + c.untagged, capping: a.capping + c.capping,
    }), { nItems: 0, replace: 0, untagged: 0, capping: 0 });
    return { nItems: sum.nItems, untagged: sum.untagged,
      replaceRate: rate(sum.replace, sum.nItems), cappingRate: rate(sum.capping, sum.nItems) };
  };
  const byTier = { MATCHED: aggregate(tiers.MATCHED), WRONG: aggregate(tiers.WRONG), CONTROL: aggregate(tiers.CONTROL) };
  const replaceContrast = (byTier.MATCHED.nItems && byTier.WRONG.nItems)
    ? byTier.WRONG.replaceRate - byTier.MATCHED.replaceRate : null;
  const anyUntagged = Object.values(perCondition).some((p) => p.untagged > 0);
  const verdict = anyUntagged
    ? "TAG UNRELIABLE — the judge returned items with no kind (structural fallback fired)"
    : replaceContrast === null
      ? "INSUFFICIENT — a MATCHED or WRONG tier has no items to contrast"
      : replaceContrast > 0
        ? "DISCRIMINATES — wrong-style skews `replace` more than matched (the tag separates the classes)"
        : "NO CONTRAST — matched and wrong-style tag alike (the typed tag did not remove the over-cap)";
  return { perCondition, byTier, replaceContrast, verdict };
}

export { mean as _meanForHarness };
