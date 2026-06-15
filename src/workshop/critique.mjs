// The workshop exchange contract — prompt + strict reply parser (T-126-01, story S-126, epic
// E-31). One model exchange per round: the model sees the concept beside the 4 gate-azimuth
// renders of ITS OWN build, names what is wrong (structured: per-region, named issues), and
// either picks ONE sanctioned action or declares done. Pipeline-philosophy Stage 5: judging a
// rendered image is perception (VLM home turf); revising through tools exercises judgement
// without motor control.
//
// THE PARSER IS STRICT AND THROWS. Malformed replies are not verdicts — the runner routes the
// throw into judge-reply's bounded same-prompt re-ask policy (the T-114 ledger pattern; never the
// prompt-mutating artifact retry). The contract is small on purpose: decision "revise" REQUIRES a
// valid action, "done" FORBIDS one, issues are capped and vocabulary-checked.
//
// THIS IS WORKSHOP CRITIQUE, NOT THE FROZEN JUDGE. No gate vocabulary ("same object"/"drifted"),
// no gap budget, no verdict aggregation — the model critiques to IMPROVE, the judge (S-127,
// outside the loop) grades once, later. The isolation test pins the absence of every judge seam.
//
// PURE — no GL, no IO, no Date/random — runs under the `src/**/*.test.mjs` glob.

import { parseAction, ACTION_NAMES } from "./actions.mjs";
import { GEOMETRY_PARAM_KEYS } from "./geometry.mjs";
import { silhouetteRatios } from "../recognition/measured-program.mjs";

export const WORKSHOP_REPLY_SCHEMA = "workshop-reply/v1";
export const ISSUE_SEVERITIES = Object.freeze(["minor", "major"]);
export const MAX_ISSUES = 6;

/** The azimuth names shown to the model, in image order (the fixed lens, config.MULTI_ANGLE_GATE).
 *  Exported so the Layer A diagnostic judge (diagnose.mjs) labels the same renders the same way —
 *  one definition, no drift between the two judges (E-39 single-composition-point discipline). */
export const ANGLE_DESCRIPTIONS = Object.freeze({
  "+x+z": "azimuth 45° (+x+z)", "+x-z": "azimuth 135° (+x-z)",
  "-x-z": "azimuth 225° (-x-z)", "-x+z": "azimuth 315° (-x+z)",
});

/** The pack vocabulary block — `role: block` lines, then an optional `decoration:` list. The exact
 *  string the fused critique and the Layer A diagnosis both render, so the material grammar reads
 *  byte-identically in both prompts. Byte-neutral extraction of critiqueRenderArgs' inline builder. */
export function paletteBlock({ pack }) {
  const palette = (pack.palette ?? []).map((p) => `  - ${p.role}: ${p.block}`).join("\n");
  const decoration = (pack.decoration ?? []).map((d) => `  - ${d.item}: ${d.block}`).join("\n");
  return `${palette}${decoration ? `\ndecoration:\n${decoration}` : ""}`;
}

const isNonEmptyString = (s) => typeof s === "string" && s.trim().length > 0;

/** The source-geometry block (T-136-01) — rendered ONLY when the run carries the recognized
 *  building program: the per-mass measured surface the geometry levers reach, the lever
 *  vocabulary, and the silhouette ratios beside their declared targets (when T-135 targets are
 *  declared). Sourceless runs render the empty string — their prompts stay byte-identical to
 *  the pre-T-136 golden. */
export function sourceBlock({ program, pack, source }) {
  if (source == null) return "";
  const lines = [
    "THE SOURCE GEOMETRY (the building program your build compiles from — per-mass):",
    "```json",
    JSON.stringify({ masses: source.masses }, null, 2),
    "```",
    `Geometry levers (adjust-params with elementId = a MASS id, params from: ${GEOMETRY_PARAM_KEYS.join(", ")};`,
    `pitchClass must be one of ${JSON.stringify(pack.proportions?.pitchClasses ?? [])}; eaveHeight is the wall height`,
    "in blocks, factorized for you). re-recognize with a mass id re-reads that part from the sketch.",
  ];
  try {
    const now = silhouetteRatios(program);
    lines.push(`Silhouette now: ridge:eave ${now.ridgeToEave}, roof share ${now.roofShare}, aspect ${now.aspect}.`);
  } catch { /* a program without roof/shell elements has no silhouette row */ }
  const decl = program.declarations?.proportions;
  if (decl?.targets) {
    lines.push(`Declared targets: ridge:eave ${decl.targets.ridgeToEave}, roof share ${decl.targets.roofShare}, `
      + `aspect ${decl.targets.aspect} (tolerance ${decl.tolerance}).`);
  }
  return `\n${lines.join("\n")}\n`;
}

/**
 * The per-round critique prompt's DATA — the typed inputs of the BAML function
 * CritiqueWorkshopRound (baml_src/critique.baml, T-129-01). The prose skeleton lives in the BAML
 * template; this serializes the round's live objects into its string params. Deterministic in
 * its inputs; the rendered prompt is byte-pinned to the captured golden by the fixture test, and
 * the SAME rendered prompt is re-sent on a bounded re-ask (the reply policy's contract).
 */
export function critiqueRenderArgs({ program, pack, round, budget, liveActions, azimuths, conformance, lastRound = null, source = null }) {
  return {
    round_num: round,
    budget,
    image_list: ["  1. the CONCEPT (the target)"]
      .concat(azimuths.map((a, i) => `  ${i + 2}. your build, ${ANGLE_DESCRIPTIONS[a] ?? a}`))
      .join("\n"),
    program_json: JSON.stringify({ elements: program.elements }, null, 2),
    source_block: sourceBlock({ program, pack, source }),
    palette_block: paletteBlock({ pack }),
    conformance_block: (conformance?.checks ?? [])
      .map((c) => `  - ${c.name}: ${c.passed ? "PASS" : `FAIL — ${c.findings.join("; ")}`}`)
      .join("\n"),
    last_round_note: lastRound
      ? `\nLAST ROUND: you chose ${JSON.stringify(lastRound.action)} — ${lastRound.accepted
        ? "ACCEPTED (conformance held or improved)."
        : `ROLLED BACK (${lastRound.reason}). Do not repeat it unchanged.`}\n`
      : "",
    live_actions: liveActions.join(", "),
    max_issues: MAX_ISSUES,
  };
}

/** Extract the reply's single fenced JSON block (or accept a bare-JSON reply). Throws otherwise. */
export function extractReplyJson(text) {
  if (typeof text !== "string" || text.trim().length === 0) throw new Error("empty reply");
  const fences = [...text.matchAll(/```(?:json)?\s*\n([\s\S]*?)```/g)].map((m) => m[1]);
  if (fences.length > 1) throw new Error(`expected ONE fenced json block, got ${fences.length}`);
  const body = fences.length === 1 ? fences[0] : text;
  try {
    return JSON.parse(body);
  } catch (e) {
    throw new Error(`reply is not valid JSON${fences.length ? " inside the fence" : ""}: ${e.message}`);
  }
}

/**
 * Parse + validate one workshop reply. THROWS on any violation (the bounded re-ask contract).
 * @param {string} text  the raw model reply
 * @param {{program:object, pack:object, source?:object|null}} ctx  the round's program + pack
 *   (+ the source building program when the run carries one) — actions ground here
 * @returns {{critique:{issues:object[]}, decision:"revise"|"done", action?:object, rationale:string}}
 */
export function parseWorkshopReply(text, { program, pack, source = null }) {
  const r = extractReplyJson(text);
  if (r === null || typeof r !== "object" || Array.isArray(r)) throw new Error("reply must be a JSON object");

  const issues = r.critique?.issues;
  if (!Array.isArray(issues)) throw new Error("critique.issues must be an array");
  if (issues.length > MAX_ISSUES) throw new Error(`critique.issues exceeds the cap (${issues.length} > ${MAX_ISSUES})`);
  for (const [i, issue] of issues.entries()) {
    if (!isNonEmptyString(issue?.region)) throw new Error(`issues[${i}].region must be a non-empty string`);
    if (!isNonEmptyString(issue?.issue)) throw new Error(`issues[${i}].issue must be a non-empty string`);
    if (!ISSUE_SEVERITIES.includes(issue?.severity)) {
      throw new Error(`issues[${i}].severity must be one of ${ISSUE_SEVERITIES.join("|")}`);
    }
  }

  if (r.decision !== "revise" && r.decision !== "done") throw new Error('decision must be "revise" | "done"');
  if (!isNonEmptyString(r.rationale)) throw new Error("rationale must be a non-empty string");

  let action;
  if (r.decision === "revise") {
    if (r.action === undefined) throw new Error('decision "revise" requires an action');
    action = parseAction(r.action, { program, pack, source }); // throws off-vocabulary / malformed
    if (issues.length === 0) throw new Error('decision "revise" requires at least one named issue');
  } else if (r.action !== undefined) {
    throw new Error('decision "done" forbids an action');
  }

  return Object.freeze({
    critique: Object.freeze({
      issues: Object.freeze(issues.map((i) => Object.freeze({ region: i.region, issue: i.issue, severity: i.severity }))),
    }),
    decision: r.decision,
    ...(action !== undefined ? { action } : {}),
    rationale: r.rationale,
  });
}

/** The action names whose appliers are wired (for the prompt's "live now" list). */
export function liveActionNames(appliers) {
  return ACTION_NAMES.filter((n) => typeof appliers[n] === "function");
}
