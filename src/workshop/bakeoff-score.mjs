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

// Keyword → department. ORDER MATTERS for first-match: the more specific department predicates are
// listed before WALL's generic envelope words so e.g. "roof" wins over a stray "wall" later in the text.
// Unlike departmentOf (which throws on ambiguity), free text is allowed to be loose — first hit wins.
const KEYWORDS = Object.freeze([
  ["ROOF", ["roof", "gable", "ridge", "eave", "thatch", "dormer", "pitch", "rafter"]],
  ["OPENING", ["door", "window", "arch", "opening", "gate", "lintel", "voussoir", "jamb", "portal"]],
  ["CHIMNEY", ["chimney", "flue", "smokestack", "stack"]],
  ["ROOM", ["floor", "interior", "room", "hollow", "storey", "story"]],
  ["WALL", ["wall", "facade", "façade", "plinth", "quoin", "corner", "masonry", "timber", "frame", "ashlar", "pilaster", "cladding"]],
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
 * A 0-100 style-fidelity scalar derived from a per-style Critique: 100 minus a severity-weighted penalty
 * sum, clamped. An EXPLAINABLE convenience — the `missing` strings (critiqueEvidence) carry the meaning;
 * this is the number that sits beside the E-38 flat scalar. Empty critique ⇒ 100 (nothing wrong).
 * @param {{items:Array<{severity:string}>}} critique a Layer-A Critique
 * @returns {number} integer 0-100
 */
export function styleFidelityScore(critique) {
  const items = critique?.items ?? [];
  const penalty = items.reduce((s, it) => s + (PENALTY[it?.severity] ?? PENALTY.minor), 0);
  return clamp(100 - penalty, 0, 100);
}

/**
 * The reported evidence bundle for one diagnosis — the scalar plus the qualitative crater (the `missing`
 * strings) and the department spread. This is what the crater harness writes and FINDINGS quotes.
 * @param {{items:Array<{department:string, missing:string, severity:string}>}} critique
 */
export function critiqueEvidence(critique) {
  const items = critique?.items ?? [];
  return {
    score: styleFidelityScore(critique),
    nItems: items.length,
    nMajor: items.filter((i) => i?.severity === "major").length,
    departments: items.map((i) => i?.department).filter(Boolean),
    missing: items.map((i) => i?.missing).filter((m) => typeof m === "string" && m.trim().length > 0),
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

export { mean as _meanForHarness };
