// Per-face resemblance gate — accept-if-closer, P14-safe (T-079-01, story S-079, epic E-23).
//
// AC #5: a paint is accepted per-face only if it moves the build face TOWARD the concept's same face;
// a paint that doesn't is rolled back. This is the E-22 resemblance gate (`resemblance.mjs`
// zoneAgreement/setAgreement) applied PER FACE, and the hill-climb accept contract mirrors
// `revise/loop.mjs` exactly — `after > before + epsilon` else roll back (P14: a non-improving face is
// reverted, never committed). The verdict a human trusts remains the face triptych + the categorical
// judge (E-22 Rule 2); these numbers are the DIAGNOSTIC nudge the gate hill-climbs on, no more.
//
// PURE scorer (operates on already-decoded face RGBA + an injected block table — no GL, no new colour
// math) + a PURE gate decision. The GL re-render of each face is the runner's impure edge.

import { zoneAgreement, setAgreement, buildPalette } from "../form/resemblance.mjs";
import { medianCutLab, aggregateForeground } from "../color/palette-extract.mjs";
import { CONCEPT_BG } from "../form/form-fidelity.mjs";

export const FACE_RESEMBLANCE_SCHEMA = "face-resemblance/v1";

/**
 * Score how much a BUILD face image resembles the concept's SAME face — the per-face accept signal.
 * Reuses the E-22 zone agreement (materials in the same places) as the headline `score`, plus set
 * agreement (same materials at all) as a diagnostic. Both block-grounded via the injected table. PURE.
 * @param {{width:number,height:number,data:Uint8Array}} buildFaceImg   decoded render of the build face
 * @param {{width:number,height:number,data:Uint8Array}} conceptFaceImg decoded concept (same face)
 * @param {object} blockTable  a loadBlockTable() result (injected — the core never reads the FS)
 * @param {{artifact?:object} & object} [opts]  forwarded to the E-22 scorers; `artifact` enables set agreement
 * @returns {{schema:string, score:number|null, zone:object, set:object|null}}
 */
export function faceResemblance(buildFaceImg, conceptFaceImg, blockTable, opts = {}) {
  const zone = zoneAgreement(buildFaceImg, conceptFaceImg, blockTable, opts);
  let set = null;
  if (opts.artifact) {
    const buildPal = buildPalette(opts.artifact, blockTable, opts);
    const conceptClusters = medianCutLab(
      aggregateForeground(conceptFaceImg, CONCEPT_BG).points,
      opts.conceptK ?? 6,
    );
    set = setAgreement(buildPal, conceptClusters, opts);
  }
  return { schema: FACE_RESEMBLANCE_SCHEMA, score: zone.score, zone, set };
}

/**
 * The P14-safe accept decision: accept a paint pass only when the face's resemblance STRICTLY improves
 * (`after > before + epsilon`), mirroring revise/loop's gate. A null after-score (e.g. an empty face)
 * is never an improvement. PURE.
 * @param {{before:number|null, after:number|null, epsilon?:number}} args
 * @returns {{accepted:boolean, before:number|null, after:number|null, delta:number|null, epsilon:number}}
 */
export function acceptIfCloser({ before, after, epsilon = 0 }) {
  const b = before == null ? null : before;
  const a = after == null ? null : after;
  const delta = b == null || a == null ? null : Math.round((a - b) * 1000) / 1000;
  const accepted = a != null && b != null && a > b + epsilon;
  return { accepted, before: b, after: a, delta, epsilon };
}

/** "Is the dominant actually DOMINANT" — a majority of the zone's visible skin (S-088 default). */
export const DEFAULT_COVERAGE_THRESHOLD = 0.5;

/**
 * The S-088 coverage PRECONDITION over a `dominantCoverage` record (zone-fill.mjs): every gated zone
 * must show `dominantFraction >= threshold` on a non-empty census. Gated zones = `opts.zones`' keys
 * when given (the E-21-derived intent), else every measured zone. A gated zone that is missing from
 * `coverage`, has an empty census, or has a null fraction FAILS — absence of evidence is failure (the
 * 91%-bare wall *had* a number; a zone with no number is worse, never a pass). PURE.
 * Metric "own" (E-26, T-101): gate on `ownFraction` from an `ownCoverage` record instead — the
 * zone's declared vocabulary (dominant + preserve, the T-090 band-evidence set). A styled zone's
 * frame lines and shutters are supplied ingredients, not under-coverage; foreign leakage still
 * fails. Strictly monotone vs "dominant" (own ⊇ dominant): anything that passed dominant-only
 * coverage passes own-coverage. Default callers are byte-identical to before.
 * @param {Record<string,{total:number, dominant:string|null, dominantFraction:number|null}>} coverage
 * @param {{threshold?:number, zones?:Record<string,object>, metric?:"dominant"|"own"}} [opts]
 * @returns {{passed:boolean, threshold:number,
 *            failures:{zone:string,dominant:string|null,fraction:number|null,total:number}[],
 *            byZone:Record<string,{dominant:string|null,fraction:number|null,total:number,passed:boolean}>}}
 */
export function coverageGate(coverage, { threshold = DEFAULT_COVERAGE_THRESHOLD, zones, metric = "dominant" } = {}) {
  if (!coverage || typeof coverage !== "object") throw new Error("coverageGate: coverage must be a dominantCoverage record");
  if (metric !== "dominant" && metric !== "own") throw new Error(`coverageGate: unknown metric "${metric}"`);
  const gated = zones ? Object.keys(zones) : Object.keys(coverage);
  const failures = [];
  const byZone = {};
  for (const zone of gated) {
    const c = coverage[zone];
    const fraction = (metric === "own" ? c?.ownFraction : c?.dominantFraction) ?? null;
    const total = c?.total ?? 0;
    const passed = total > 0 && fraction != null && fraction >= threshold;
    byZone[zone] = {
      dominant: c?.dominant ?? null, fraction, total, passed,
      ...(metric === "own" ? { metric, own: c?.own ?? null, dominantFraction: c?.dominantFraction ?? null } : {}),
    };
    if (!passed) failures.push({ zone, dominant: c?.dominant ?? null, fraction, total });
  }
  return { passed: failures.length === 0, threshold, failures, byZone };
}

/** Schema tag for the visibility-aware multi-view coverage verdict (T-137-01). */
export const VISIBILITY_COVERAGE_SCHEMA = "visibility-coverage/v1";

/**
 * Visibility-aware multi-view coverage (T-137-01, story S-137, epic E-33) — the fourth
 * measurement-identity fix of the class (T-095 kit-renamed bands, T-101 dominant-only, T-110
 * literal-name). A per-view census denominator is already "cells visible from that view" (the
 * diagonal projection census); the defect was gating a band whose denominator is EMPTY — failing a
 * view on a band the camera cannot see. Three conditions, named apart:
 *   • visible at this view (total > 0)            → gated exactly as before (coverageGate);
 *   • not visible HERE but visible elsewhere       → `not-visible-from-view`: recorded, excluded
 *     from THIS view's precondition — the band must still pass from every view that can see it;
 *   • not visible from ANY view:
 *       – cells exist on the EXPOSURE skin         → `not-visible-from-any-view`: a NAMED failure
 *         (material the contract lens cannot verify is never a free pass) — the band stays in
 *         every view's gated set and fails on its empty census exactly as the legacy arithmetic;
 *       – no cells in the census identity at all   → `not-on-skin`: excluded everywhere, named in
 *         the record (nothing to census — form defects belong to the proportion check and the
 *         judge's glance, not to a coverage refusal).
 * Both arithmetics are returned for every view (aware + legacy — the unchanged full-set
 * coverageGate), so any record built from this carries the before/after numbers by construction.
 * Monotone by structure: a view's aware gated set ⊆ the legacy set and gating inside the set is
 * identical, so legacy pass ⇒ aware pass. Thresholds/metric forwarded verbatim; `coverageGate`
 * itself is untouched. PURE.
 * @param {{views:{angle:string, coverage:Record<string,object>}[],
 *          zones:Record<string,object>,
 *          exposure:Record<string,{total:number}>,
 *          threshold?:number, metric?:"dominant"|"own"}} args
 *   `coverage` rows are dominantCoverage/ownCoverage-shaped ({total} + the metric's fraction —
 *   committed byZone rows replay directly); `exposure` is a surfaceZoneHistogram over
 *   skin:"exposure" in the SAME zone identity (the existence basis; {} means "no band has cells").
 * @returns {{schema:string,
 *            views:{angle:string, aware:object, legacy:object}[],
 *            visibility:{byBand:Record<string,{status:string, visibleViews:string[],
 *                                              exposedCells:number}>,
 *                        failures:{band:string, reason:string}[], passed:boolean}}}
 */
export function visibilityAwareCoverage({ views, zones, exposure, threshold, metric = "dominant" }) {
  if (!Array.isArray(views) || views.length === 0) {
    throw new Error("visibilityAwareCoverage: views must be a non-empty [{angle, coverage}] array");
  }
  const seen = new Set();
  for (const v of views) {
    if (!v || typeof v.angle !== "string" || !v.angle) throw new Error("visibilityAwareCoverage: every view needs a string angle");
    if (seen.has(v.angle)) throw new Error(`visibilityAwareCoverage: duplicate view angle "${v.angle}"`);
    seen.add(v.angle);
    if (!v.coverage || typeof v.coverage !== "object") throw new Error(`visibilityAwareCoverage: view "${v.angle}" needs a coverage record`);
  }
  if (!zones || typeof zones !== "object") throw new Error("visibilityAwareCoverage: zones must be the gated policy map");
  if (!exposure || typeof exposure !== "object") {
    throw new Error("visibilityAwareCoverage: exposure (the existence basis) is required — pass {} only when no band has cells");
  }

  // cross-view classification per gated band
  const byBand = {};
  const visFailures = [];
  for (const band of Object.keys(zones)) {
    const visibleViews = views.filter((v) => (v.coverage[band]?.total ?? 0) > 0).map((v) => v.angle);
    const exposedCells = exposure[band]?.total ?? 0;
    const status = visibleViews.length > 0 ? "visible"
      : exposedCells > 0 ? "not-visible-from-any-view"
      : "not-on-skin";
    byBand[band] = { status, visibleViews, exposedCells };
    if (status === "not-visible-from-any-view") visFailures.push({ band, reason: "not-visible-from-any-view" });
  }

  // per-view: aware (subset) + legacy (full set) arithmetics
  const outViews = views.map((v) => {
    const gated = {};
    const excluded = [];
    for (const [band, p] of Object.entries(zones)) {
      const { status } = byBand[band];
      const visibleHere = (v.coverage[band]?.total ?? 0) > 0;
      // a hidden-but-existing band stays gated (fails on its empty census — never a free pass)
      if (visibleHere || status === "not-visible-from-any-view") gated[band] = p;
      else excluded.push(band);
    }
    const aware = coverageGate(v.coverage, { threshold, zones: gated, metric });
    for (const band of excluded) {
      aware.byZone[band] = {
        total: 0, fraction: null, dominant: null, passed: null,
        excluded: true, notVisible: true, status: "not-visible-from-view",
      };
    }
    const legacy = coverageGate(v.coverage, { threshold, zones, metric });
    return { angle: v.angle, aware, legacy };
  });

  return {
    schema: VISIBILITY_COVERAGE_SCHEMA,
    views: outViews,
    visibility: { byBand, failures: visFailures, passed: visFailures.length === 0 },
  };
}

/**
 * Coverage-aware accept (S-088): the coverage PRECONDITION runs FIRST — a skin whose base coat is
 * under-applied is rejected regardless of the marginal resemblance delta (coverage is a precondition,
 * not a tie-breaker; resemblance refines a skin that already has its base coat, it cannot substitute
 * for one). Only when coverage passes does the decision fall through to `acceptIfCloser`, unchanged.
 * On a coverage short-circuit the resemblance fields are nulled, NOT computed — the record must show
 * the delta was never consulted. PURE.
 * @param {{coverage:object, threshold?:number, zones?:object,
 *          before:number|null, after:number|null, epsilon?:number}} args
 * @returns {{accepted:boolean, reason:"coverage"|"resemblance-improved"|"resemblance-not-improved",
 *            coverage:object, before:number|null, after:number|null, delta:number|null, epsilon:number}}
 */
export function acceptWithCoverage({ coverage, threshold, zones, before, after, epsilon = 0 }) {
  const pre = coverageGate(coverage, { threshold, zones });
  if (!pre.passed) {
    return { accepted: false, reason: "coverage", coverage: pre, before: null, after: null, delta: null, epsilon };
  }
  const res = acceptIfCloser({ before, after, epsilon });
  return { ...res, reason: res.accepted ? "resemblance-improved" : "resemblance-not-improved", coverage: pre };
}
