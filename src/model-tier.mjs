// Per-op model-tier seam over the SUBSCRIPTION shim (T-082-01, story S-082, epic E-23).
//
// The agentic-engineering move: because the 2.5-D view layer (T-078-01) scopes each op to a single VIEW,
// many sub-tasks are narrow enough for a LIGHTER model tier ("which roof cells read wrong", "mark the
// hollowable mass"). This module is the one seam that turns a declared TIER into a `--model` override on
// the `claude -p` subscription shim and records WHY each op got the tier it did (`twodee-interaction-sector`).
//
// HARD INVARIANT (the reason this is a seam, not scattered `model:` args): a lighter tier is reached ONLY
// through the `claude -p` subscription functions in sdk-binding (`requestText`/`requestTextWithImage`),
// passing a smaller `--model`. The metered Agent-SDK / API-key path is DELIBERATELY not importable here —
// this module imports neither the Agent-SDK package nor the metered API-key env var, a property a
// source-guard test pins (AC #1): the metered API-key env var is never read here. A smaller model is
// still the subscription, just a smaller `--model`.
//
// PURE except `runTieredOp`, whose model call is dependency-INJECTED (defaults to the shim) so routing is
// unit-testable without a spawn — mirroring how resemblance.mjs injects its block table to stay pure.

import { MODEL_TIERS, DEFAULT_TIER } from "./config.mjs";
import { requestText, requestTextWithImage } from "./sdk-binding.mjs";

/**
 * The ONLY model invokers this seam may reach: the `claude -p` subscription functions. Exported so the
 * behavioural test can assert the default invoker is one of these (the subscription path), never the SDK.
 * @type {Readonly<{ text: typeof requestText, image: typeof requestTextWithImage }>}
 */
export const SHIM_INVOKERS = Object.freeze({ text: requestText, image: requestTextWithImage });

/**
 * Resolve a tier name to its single-sourced model id. Throws on an unknown tier (the seam never silently
 * falls back to a metered/strong model on a typo). PURE.
 * @param {"light"|"strong"} tier
 * @returns {string} the model id for `--model`
 */
export function resolveTier(tier) {
  const id = MODEL_TIERS[tier];
  if (!id) {
    throw new Error(`model-tier: unknown tier "${tier}" (have ${Object.keys(MODEL_TIERS).join(", ")})`);
  }
  return id;
}

/**
 * Run one op on its declared tier via the subscription shim. Resolves `tier`→`model`, selects the shim
 * invoker (image vs text by whether images are present) unless one is INJECTED, and calls it with the
 * resolved `model`. The seam builds NO client of its own — the only path to a model is the `--model`
 * param of `claude -p`. LIVE + METERED when the default invoker is used (subscription credits).
 * @param {Object} p
 * @param {"light"|"strong"} [p.tier] declared tier (default {@link DEFAULT_TIER})
 * @param {string} p.prompt
 * @param {Array<*>} [p.images] one or more images → routes to the image shim
 * @param {string} [p.system]
 * @param {(m:object)=>void} [p.onMessage]
 * @param {(args:object)=>Promise<{text:string,raw:object}>} [p.invoke] injected invoker (tests); default
 *   is the matching {@link SHIM_INVOKERS} function.
 * @returns {Promise<{ text:string, raw:object, tier:string, model:string }>}
 */
export async function runTieredOp({ tier = DEFAULT_TIER, prompt, images, system, onMessage, invoke } = {}) {
  const model = resolveTier(tier);
  const fn = invoke || (images && images.length ? SHIM_INVOKERS.image : SHIM_INVOKERS.text);
  const res = await fn({ prompt, images, model, system, onMessage });
  return { ...res, tier, model };
}

/**
 * The short ROUTING RUBRIC (AC #3). One line per tier — the rule that decides every op's tier. Frozen so
 * the rationale a run records can't drift from the rule it was applied under.
 * @type {Readonly<{ light: string, strong: string }>}
 */
export const ROUTING_RUBRIC = Object.freeze({
  light:
    "a NARROW detector / classification scoped to ONE view, over a bounded candidate set the geometric " +
    "read already surfaced (the model triages, it does not scan 57k voxels).",
  strong:
    "CROSS-VIEW judgement, AUTHORING a generator, or MATERIAL ZONING — anything that must reason across " +
    "views or produce new structure, not just label cells on one view.",
});

/**
 * The per-op routing record (AC #3): tier chosen + WHY. Single-sourced + unit-tested (every `tier` is a
 * key of MODEL_TIERS; every `rationale` non-empty). The two light detectors this ticket ships, plus the
 * two contrasting STRONG ops the rubric names (worked examples of the boundary). Rendered to
 * `scoping-rationale.md` by {@link routingTableMarkdown} so the doc and the code stay in lockstep.
 * @type {ReadonlyArray<{op:string, tier:"light"|"strong", rationale:string}>}
 */
export const OP_ROUTING = Object.freeze([
  Object.freeze({
    op: "roof-patch-detector",
    tier: "light",
    rationale:
      "Classifies which roof cells read wrong on ONE top view, over a bounded candidate set (the strays " +
      "and holes the pure roof read already isolated). Narrow + single-view → light.",
  }),
  Object.freeze({
    op: "hollowable-mass-detector",
    tier: "light",
    rationale:
      "Confirms the safe-to-carve interior mass + flags skin-hole blockers, scoped to footprint + storey " +
      "bands + a single 3/4 view. Bounded geometric classification → light. (Feeds T-080-01.)",
  }),
  Object.freeze({
    op: "seal-authoring",
    tier: "strong",
    rationale:
      "AUTHORING a watertight seal over the holes the detector flagged is generative and must reconcile " +
      "multiple faces — cross-view + new structure → strong (S-084, seal-before-hollow).",
  }),
  Object.freeze({
    op: "material-zoning",
    tier: "strong",
    rationale:
      "Assigning materials to geometric zones across the whole build is the rubric's named strong case — " +
      "material zoning across views, not a single-view label.",
  }),
  Object.freeze({
    op: "floorplan-author",
    tier: "strong",
    rationale:
      "Authoring/steering an N×M floorplan generator from the plan + elevation is design WITH invention " +
      "(no interior reference) — the rubric's named strong case (authoring a generator), not a one-view " +
      "label. (T-081-01, fills the T-080-01 hollow shell.)",
  }),
]);

/**
 * Render {@link OP_ROUTING} + {@link ROUTING_RUBRIC} to the scoping-rationale markdown body. PURE — the
 * runner writes the returned string to disk, so the recorded doc is generated from the single-sourced
 * table (doc ⇄ code can't drift). AC #3's written deliverable.
 * @returns {string}
 */
export function routingTableMarkdown() {
  const lines = [
    "# Scoping rationale — T-082-01 (generated from `src/model-tier.mjs`)",
    "",
    "Per-op model tier + why. Generated from the single-sourced `OP_ROUTING` table so this record cannot",
    "drift from the code. The metered API key never enters any of these paths — a lighter tier is the",
    "subscription shim with a smaller `--model`.",
    "",
    "## Rubric",
    "",
    `- **light** — ${ROUTING_RUBRIC.light}`,
    `- **strong** — ${ROUTING_RUBRIC.strong}`,
    "",
    "## Per-op routing",
    "",
    "| op | tier | rationale |",
    "| --- | --- | --- |",
    ...OP_ROUTING.map((r) => `| \`${r.op}\` | **${r.tier}** | ${r.rationale} |`),
    "",
    "## Tier ids (single-sourced in `config.mjs`)",
    "",
    `- **light** → \`${MODEL_TIERS.light}\``,
    `- **strong** → \`${MODEL_TIERS.strong}\` (the pinned Phase-1 default)`,
    "",
  ];
  return lines.join("\n");
}
