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

export const WORKSHOP_REPLY_SCHEMA = "workshop-reply/v1";
export const ISSUE_SEVERITIES = Object.freeze(["minor", "major"]);
export const MAX_ISSUES = 6;

/** The azimuth names shown to the model, in image order (the fixed lens, config.MULTI_ANGLE_GATE). */
const ANGLE_DESCRIPTIONS = Object.freeze({
  "+x+z": "azimuth 45° (+x+z)", "+x-z": "azimuth 135° (+x-z)",
  "-x-z": "azimuth 225° (-x-z)", "-x+z": "azimuth 315° (-x+z)",
});

const isNonEmptyString = (s) => typeof s === "string" && s.trim().length > 0;

/**
 * Build the per-round workshop prompt. Deterministic in its inputs; the SAME prompt is re-sent on
 * a bounded re-ask (the reply policy's contract). The conformance report and the pack palette are
 * embedded so the model's action is grounded in the gate it must not regress and the vocabulary
 * it must paint from.
 */
export function buildWorkshopPrompt({ program, pack, round, budget, liveActions, azimuths, conformance, lastRound = null }) {
  const palette = (pack.palette ?? []).map((p) => `  - ${p.role}: ${p.block}`).join("\n");
  const decoration = (pack.decoration ?? []).map((d) => `  - ${d.item}: ${d.block}`).join("\n");
  const checks = (conformance?.checks ?? [])
    .map((c) => `  - ${c.name}: ${c.passed ? "PASS" : `FAIL — ${c.findings.join("; ")}`}`)
    .join("\n");
  const imageList = ["  1. the CONCEPT (the target)"]
    .concat(azimuths.map((a, i) => `  ${i + 2}. your build, ${ANGLE_DESCRIPTIONS[a] ?? a}`))
    .join("\n");
  const last = lastRound
    ? `\nLAST ROUND: you chose ${JSON.stringify(lastRound.action)} — ${lastRound.accepted
      ? "ACCEPTED (conformance held or improved)."
      : `ROLLED BACK (${lastRound.reason}). Do not repeat it unchanged.`}\n`
    : "";
  return `You are the builder in the workshop (round ${round} of ${budget}). The images are:
${imageList}

This build is YOURS and you may revise it. Compare your build against the concept and decide.

THE CURRENT PROGRAM (the revisable object — elements realize in order):
\`\`\`json
${JSON.stringify({ elements: program.elements }, null, 2)}
\`\`\`

THE PACK VOCABULARY (every block you paint or assign must come from it):
${palette}${decoration ? `\ndecoration:\n${decoration}` : ""}

THE CONFORMANCE GATE on the current build (a revision that scores worse is rolled back):
${checks}
${last}
SANCTIONED ACTIONS (choose exactly ONE per round; live now: ${liveActions.join(", ")}):
  - {"action":"adjust-params","elementId":"<element id>","params":{<spec keys to replace>}}
  - {"action":"spray-paint","dir":"+x|-x|+z|-z|+y|-y|+x+z|+x-z|-x+z|-x-z","toBlock":"<pack block>","fromBlock":"<block, optional>","bounds":{"min":[x,y,z],"max":[x,y,z]} (optional)}
  - {"action":"re-recognize","elementId":"<element id>"}

Reply with EXACTLY ONE fenced json block, nothing else fenced:
\`\`\`json
{
  "critique": { "issues": [ { "region": "<where on the build>", "issue": "<what is wrong vs the concept>", "severity": "minor|major" } ] },
  "decision": "revise" | "done",
  "action": { ... },        // required when revising, forbidden when done
  "rationale": "<one or two sentences>"
}
\`\`\`
Name at most ${MAX_ISSUES} issues. Prefer fixing FAILING conformance checks and major visual
divergences first. Declare "done" only when the build reads as the concept's building and the
conformance gate passes.`;
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
 * @param {{program:object, pack:object}} ctx  the round's program + pack (actions ground here)
 * @returns {{critique:{issues:object[]}, decision:"revise"|"done", action?:object, rationale:string}}
 */
export function parseWorkshopReply(text, { program, pack }) {
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
    action = parseAction(r.action, { program, pack }); // throws off-vocabulary / malformed
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
