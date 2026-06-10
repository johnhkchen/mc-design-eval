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
