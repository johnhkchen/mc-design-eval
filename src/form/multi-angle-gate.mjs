// Multi-angle same-object gate — pure core (T-093-01, story S-093, epic E-25).
//
// THE SINGLE-ANGLE GATE STRUCTURALLY REWARDS SKINNING THE PHOTOGRAPHED FACE. E-22 judges one shared
// 3/4 view; the defects that make builds read wrong (the cottage roof's grey side faces, wall residue,
// the gatehouse cavity) live on the views that gate never renders. This module is the pure half of the
// widened gate: a FIXED per-view judge contract and the aggregate pass rule over the four config
// azimuths (src/config.mjs MULTI_ANGLE_GATE — 45/135/225/315° at the contract elevation; E-25 Rule 4:
// config, never a per-run option).
//
// THE v2 VERDICT. E-22's resemblance-verdict/v1 cannot express the S-093 pass rule ("same-object at
// every azimuth with ≤2 named MINOR gaps total"): v1 forbids any gap on "same object" and demands
// exactly one otherwise. multi-angle-verdict/v1 keeps the FROZEN vocabulary (VERDICTS, GAP_ATTRS —
// Rule 5: never widened) and changes only gap cardinality/severity: "same object" may carry 0..N
// MINOR gaps (a major gap contradicts the verdict → parse error); "drifted"/"different object"
// require ≥1 gap of which ≥1 is MAJOR. v1's prompt/parser/schema and all its callers are untouched.
//
// THE AGGREGATE RULE (unit-tested here, executed by the impure runner):
//   REFUSE  — any expected azimuth missing/unrendered, or any judged verdict unparsed → the gate
//             produces NO pass/fail verdict at all (a partial sheet is not a verdict — E-25 Rule 4).
//   DECIDE  — passed ⇔ every view's T-088 coverage precondition passed ∧ every verdict is
//             "same object" ∧ the total named (minor) gaps ≤ gapBudget. A coverage-failed view is a
//             DECIDED FAIL, not a refusal — its judge was deliberately never called (the T-088
//             short-circuit: the record must show the delta was never consulted).
//
// PURE — no GL, no network, no I/O. The metered judge call, rendering, coverage census, and the
// contact sheet live in benchmarks/sculpture/multi-angle-gate.mjs (the impure runner).

import { VERDICTS, GAP_ATTRS } from "./resemblance.mjs";
import { stripToJson } from "../sdk-binding.mjs";
import { MULTI_ANGLE_GATE } from "../config.mjs";

/** Schema tags (downstream version-check). */
export const MULTI_ANGLE_VERDICT_SCHEMA = "multi-angle-verdict/v1";
export const MULTI_ANGLE_GATE_SCHEMA = "multi-angle-gate/v1";

/** Gap severities (frozen — Rule 5). "minor" is the only severity a passing view may carry. */
export const GAP_SEVERITIES = Object.freeze(["minor", "major"]);

/** Max gaps a single view's verdict may name — keeps the judge naming the worst, not inventorying. */
export const MAX_GAPS_PER_VIEW = 3;

/**
 * The FIXED per-view judge prompt (Rule 5 — one prompt, never tuned per run). The judge sees a
 * triptych: the immutable 3/4 CONCEPT (which does NOT rotate), the MESH silhouette at this azimuth
 * (the form reference that does), and the MINECRAFT build rendered at this azimuth.
 * @param {string} angleName  e.g. "-x-z"
 * @param {number} azimuthDeg  the named angle's azimuth, for plain-words orientation
 * @returns {string}
 */
export function buildMultiAngleViewPrompt(angleName, azimuthDeg) {
  return [
    "You are judging visual RESEMBLANCE for a Minecraft design evaluation — ONE view of a multi-angle gate.",
    "The single image is a TRIPTYCH of three panels, left to right:",
    "  1. CONCEPT — the immutable reference concept image. It shows the subject from its canonical 3/4",
    `     view and does NOT rotate; the build below is seen from a DIFFERENT angle (azimuth ${azimuthDeg}°,`,
    `     view "${angleName}"). Judge whether the build plausibly depicts the SAME BUILDING seen from there.`,
    "  2. MESH — a silhouette of the reference 3-D mesh rendered AT THIS SAME AZIMUTH (the form/massing",
    "     reference for the faces the concept cannot see).",
    `  3. MINECRAFT — the build being judged, rendered at azimuth ${azimuthDeg}°.`,
    "Decide whether the MINECRAFT panel depicts the SAME OBJECT as the references, has DRIFTED, or is a",
    "DIFFERENT OBJECT.",
    '  - "same object": clearly the same building; form, massing, material zoning, and palette read true',
    "    from this angle. You MAY still name small imperfections as MINOR gaps.",
    '  - "drifted": recognizably related but with a real defect from this angle (name it as a MAJOR gap).',
    '  - "different object": you would not identify it as the same subject from this angle.',
    "Name at most THREE gaps. Each gap = REGION (where, in plain words) + ATTRIBUTE (one of: form,",
    'massing, material zoning, palette) + SEVERITY ("minor" = cosmetic, does not break same-object;',
    '"major" = breaks it). A "same object" verdict must carry ONLY minor gaps (or none); "drifted" and',
    '"different object" must carry at least one gap, at least one of them major.',
    "Reply with STRICT JSON only, no prose, in this exact shape:",
    '{"verdict":"same object|drifted|different object","gaps":[{"region":"...","attribute":"form|massing|material zoning|palette","severity":"minor|major"}],"rationale":"one sentence"}',
  ].join("\n");
}

/**
 * Parse + VALIDATE a per-view judge reply. PURE; throws a precise error on any contract violation so
 * the runner records an honest "unparsed" (which the aggregate turns into a REFUSAL, never a guess).
 * @param {string} text  raw model text (may be fenced / wrapped in prose)
 * @returns {{schema:string, verdict:string,
 *            gaps:{region:string, attribute:string, severity:string}[], rationale:string}}
 */
export function parseMultiAngleVerdict(text) {
  if (typeof text !== "string" || !text.trim()) throw new Error("parseMultiAngleVerdict: empty response");
  let obj;
  try {
    obj = JSON.parse(stripToJson(text));
  } catch (e) {
    throw new Error(`parseMultiAngleVerdict: response is not JSON (${e.message})`);
  }
  if (!obj || typeof obj !== "object") throw new Error("parseMultiAngleVerdict: not an object");
  const { verdict, gaps, rationale } = obj;
  if (!VERDICTS.includes(verdict)) {
    throw new Error(`parseMultiAngleVerdict: verdict must be one of ${VERDICTS.join(" | ")}, got ${JSON.stringify(verdict)}`);
  }
  if (!Array.isArray(gaps)) throw new Error("parseMultiAngleVerdict: gaps must be an array (possibly empty)");
  if (gaps.length > MAX_GAPS_PER_VIEW) {
    throw new Error(`parseMultiAngleVerdict: at most ${MAX_GAPS_PER_VIEW} gaps per view, got ${gaps.length}`);
  }
  const cleanGaps = gaps.map((g, i) => {
    if (!g || typeof g !== "object") throw new Error(`parseMultiAngleVerdict: gaps[${i}] must be an object`);
    if (typeof g.region !== "string" || !g.region.trim()) {
      throw new Error(`parseMultiAngleVerdict: gaps[${i}].region must be a non-empty string`);
    }
    if (!GAP_ATTRS.includes(g.attribute)) {
      throw new Error(`parseMultiAngleVerdict: gaps[${i}].attribute must be one of ${GAP_ATTRS.join(" | ")}, got ${JSON.stringify(g.attribute)}`);
    }
    if (!GAP_SEVERITIES.includes(g.severity)) {
      throw new Error(`parseMultiAngleVerdict: gaps[${i}].severity must be one of ${GAP_SEVERITIES.join(" | ")}, got ${JSON.stringify(g.severity)}`);
    }
    return { region: g.region.trim(), attribute: g.attribute, severity: g.severity };
  });
  const sameObject = verdict === "same object";
  const majors = cleanGaps.filter((g) => g.severity === "major").length;
  if (sameObject && majors > 0) {
    throw new Error('parseMultiAngleVerdict: "same object" cannot carry a major gap (severity integrity)');
  }
  if (!sameObject) {
    if (cleanGaps.length === 0) throw new Error(`parseMultiAngleVerdict: "${verdict}" requires at least one named gap (Rule 7)`);
    if (majors === 0) throw new Error(`parseMultiAngleVerdict: "${verdict}" requires at least one MAJOR gap`);
  }
  return {
    schema: MULTI_ANGLE_VERDICT_SCHEMA,
    verdict,
    gaps: cleanGaps,
    rationale: typeof rationale === "string" ? rationale.trim() : "",
  };
}

/**
 * The aggregate pass rule over the gate's views. PURE (see module header for the REFUSE/DECIDE model).
 * @param {Array<{angle:string, rendered?:boolean, coverage:{passed:boolean}|null,
 *                verdict:{verdict:string, gaps:object[]}|null, unparsed?:boolean}>} views
 * @param {{azimuths?:readonly string[], gapBudget?:number}} [opts]
 * @returns {{schema:string, decided:boolean, refusal?:string, passed?:boolean, gapCount?:number,
 *            gaps?:{angle:string, region:string, attribute:string}[],
 *            failures?:{angle:string, reason:string}[],
 *            views:{angle:string, outcome:string}[]}}
 */
export function aggregateMultiAngle(views, opts = {}) {
  const azimuths = opts.azimuths ?? MULTI_ANGLE_GATE.azimuths;
  const gapBudget = opts.gapBudget ?? MULTI_ANGLE_GATE.gapBudget;
  const list = Array.isArray(views) ? views : [];
  const byAngle = new Map();
  for (const v of list) {
    if (!v || typeof v.angle !== "string") throw new Error("aggregateMultiAngle: every view needs an .angle");
    if (byAngle.has(v.angle)) throw new Error(`aggregateMultiAngle: duplicate view for angle "${v.angle}"`);
    if (!azimuths.includes(v.angle)) {
      throw new Error(`aggregateMultiAngle: unexpected angle "${v.angle}" — the gate's set is exactly [${azimuths.join(", ")}]`);
    }
    byAngle.set(v.angle, v);
  }
  const outcomes = () => azimuths.map((a) => ({ angle: a, outcome: viewOutcomeLabel(byAngle.get(a)) }));

  // 1. REFUSE — a missing/unrendered view or an unparsed verdict voids the verdict entirely.
  for (const a of azimuths) {
    const v = byAngle.get(a);
    if (!v || v.rendered === false) {
      return { schema: MULTI_ANGLE_GATE_SCHEMA, decided: false, refusal: `missing-view:${a}`, views: outcomes() };
    }
    if (v.unparsed) {
      return { schema: MULTI_ANGLE_GATE_SCHEMA, decided: false, refusal: `unparsed:${a}`, views: outcomes() };
    }
    if (v.coverage?.passed !== false && !v.verdict) {
      // rendered, parsed nothing, and not a coverage short-circuit → the judge never ran: not decidable
      return { schema: MULTI_ANGLE_GATE_SCHEMA, decided: false, refusal: `missing-verdict:${a}`, views: outcomes() };
    }
  }

  // 2. DECIDE.
  const failures = [];
  const gaps = [];
  for (const a of azimuths) {
    const v = byAngle.get(a);
    if (v.coverage?.passed === false) {
      failures.push({ angle: a, reason: "coverage" });
      continue; // verdict is null BY CONTRACT (T-088 short-circuit) — nothing to tally
    }
    if (v.verdict.verdict !== "same object") {
      failures.push({ angle: a, reason: v.verdict.verdict });
    }
    for (const g of v.verdict.gaps ?? []) gaps.push({ angle: a, region: g.region, attribute: g.attribute });
  }
  if (failures.length === 0 && gaps.length > gapBudget) {
    failures.push({ angle: "(all)", reason: "gap-budget" });
  }
  return {
    schema: MULTI_ANGLE_GATE_SCHEMA,
    decided: true,
    passed: failures.length === 0,
    gapCount: gaps.length,
    gapBudget,
    gaps,
    failures,
    views: outcomes(),
  };
}

/**
 * The sheet's per-panel caption for a view record. PURE, total.
 * @param {{rendered?:boolean, coverage?:{passed:boolean}|null,
 *          verdict?:{verdict:string, gaps?:object[]}|null, unparsed?:boolean}|undefined} view
 * @returns {string}
 */
export function viewOutcomeLabel(view) {
  if (!view || view.rendered === false) return "missing";
  if (view.coverage?.passed === false) return "coverage";
  if (view.unparsed) return "unparsed";
  const v = view.verdict;
  if (!v) return "missing";
  if (v.verdict === "same object") {
    const n = v.gaps?.length ?? 0;
    return n ? `same object (${n} minor)` : "same object";
  }
  const major = (v.gaps ?? []).find((g) => g.severity === "major") ?? (v.gaps ?? [])[0];
  return major ? `${v.verdict}: ${major.attribute}` : v.verdict;
}
