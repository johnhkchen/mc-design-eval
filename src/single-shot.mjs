// Single-shot prompting archetype (T-004-02) — E-03, spec §7 archetype 1.
//
// A NAMED, VERSIONED configuration of how the harness constructs the prompt
// (spec §7): target brief + named style brief + the injected palette whitelist as
// the binding material constraint → ONE generation, no feedback, no revision →
// a complete, schema-valid design artifact attributable to THIS config, not to
// incidental wording drift.
//
// It is a prompt-construction policy LAYERED ON the T-004-01 runner: it contributes
// only the prompt and the seed identity, then hands them to runTrial, which owns
// the single metered SDK seam (sdk-binding.mjs) and the schema enforcement /
// re-validation. This module never imports the SDK directly.
//
// Split (mirrors the runner): buildSingleShotPrompt and assertAttribution are PURE
// and unit-tested over the real shipped palette and plain artifact objects. The one
// live, metered call (runSingleShotTrial) is thin glue and is NOT exercised by
// `npm test` (spec §4: Agent SDK usage bills at full API rates).

import { runTrial } from "./trial.mjs";
import { PHASE1_MODEL_ID, DEFAULT_PROMPTING_METHOD_ID } from "./config.mjs";
import { loadPalette, formatPaletteBlocks } from "./palette.mjs";
import { TARGET_BRIEFS, STYLE_BRIEFS } from "./briefs.mjs";

/**
 * The archetype descriptor. `id` is single-sourced from config.mjs (the same
 * constant the runner's default carries) so there is exactly one spelling of this
 * archetype's identity. The `.v1` suffix is the *versioning*: any change to prompt
 * construction that could move results bumps it (→ `.v2`), so every logged trial is
 * attributable to the exact construction that produced it (spec §7 / AC #4).
 * @type {Readonly<{ id: string, version: number, label: string }>}
 */
export const SINGLE_SHOT = Object.freeze({
  id: DEFAULT_PROMPTING_METHOD_ID, // "single-shot.v1"
  version: 1,
  label: "Single-shot (one generation, no revision)",
});

/**
 * @typedef {Object} TrialSpec
 * @property {"house"|"path"|"landscape"} target  build target (a TARGET_BRIEFS key)
 * @property {string} paletteId                   style-palette id, e.g. "industrial"
 * @property {string} style                       style name (a STYLE_BRIEFS key)
 * @property {string} trialId                     stable trial identifier (the join key)
 * @property {number} seed                        integer generation seed
 * @property {string} serverStateId               assumed world-state id
 * @property {string} [model]                     model override (defaults to the pin)
 * @property {string} [createdAt]                 optional ISO timestamp (injected, not clock-read)
 * @property {string} [outDir]                    trial-store root (passed through to runTrial)
 */

/**
 * Validate a TrialSpec before any work. A misconfigured archetype must fail here,
 * not after a metered call. Throws a field-named Error.
 * @param {TrialSpec} spec
 */
function assertSpec(spec) {
  const s = spec || {};
  if (!TARGET_BRIEFS[s.target]) {
    throw new Error(
      `single-shot: unknown target "${s.target}" (expected one of ${Object.keys(TARGET_BRIEFS).join(", ")})`,
    );
  }
  if (!STYLE_BRIEFS[s.style]) {
    throw new Error(
      `single-shot: unknown style "${s.style}" (expected one of ${Object.keys(STYLE_BRIEFS).join(", ")})`,
    );
  }
  for (const field of ["paletteId", "trialId", "serverStateId"]) {
    if (typeof s[field] !== "string" || s[field].length === 0) {
      throw new Error(`single-shot: spec.${field} must be a non-empty string`);
    }
  }
  if (!Number.isInteger(s.seed)) {
    throw new Error(`single-shot: spec.seed must be an integer (got ${s.seed})`);
  }
}

/**
 * Build the single-shot prompt and the metadata it pins. PURE (the only side is the
 * deterministic palette file read via loadPalette). The prompt is assembled from
 * fixed, ordered sections so the wording is stable and versioned — same spec in,
 * byte-identical prompt out. Returns the prompt and the `seedMetadata` it asked the
 * model to write into `metadata`, so a caller (or test) can compare intent.
 * @param {TrialSpec} spec
 * @returns {{ prompt: string, seedMetadata: import("./artifact.mjs").Metadata }}
 */
export function buildSingleShotPrompt(spec) {
  assertSpec(spec);
  const { target, paletteId, style, trialId, seed, serverStateId, model, createdAt } = spec;

  const palette = loadPalette(paletteId);
  const targetBrief = TARGET_BRIEFS[target];
  const styleBrief = STYLE_BRIEFS[style];
  const blocks = formatPaletteBlocks(palette);
  const modelId = model || PHASE1_MODEL_ID;

  /** @type {import("./artifact.mjs").Metadata} */
  const seedMetadata = {
    trial_id: trialId,
    prompting_method_id: SINGLE_SHOT.id,
    model_id: modelId,
    seed,
    server_state_id: serverStateId,
    target,
  };
  if (createdAt) seedMetadata.created_at = createdAt;

  const metadataLines = [
    `- metadata.trial_id = "${trialId}"`,
    `- metadata.prompting_method_id = "${SINGLE_SHOT.id}"`,
    `- metadata.model_id = "${modelId}"`,
    `- metadata.seed = ${seed}`,
    `- metadata.server_state_id = "${serverStateId}"`,
    `- metadata.target = "${target}"`,
  ];
  if (createdAt) metadataLines.push(`- metadata.created_at = "${createdAt}"`);

  const prompt = [
    "You are designing a Minecraft build as a single, complete structured design",
    "artifact. Produce the ENTIRE design in ONE response: there is no feedback, no",
    "follow-up turn, and no revision. Commit to a coherent whole now.",
    "",
    "## Target",
    targetBrief.headline,
    targetBrief.brief,
    "",
    "## Style",
    `Build in the "${styleBrief.name}" style.`,
    styleBrief.brief,
    `Palette intent: ${palette.description}`,
    "",
    "## Material constraint (binding)",
    "You MUST use ONLY blocks from the whitelist below. It is the single allowed",
    "material set: every placement's `block` MUST be one of these blocks, and any",
    "block outside this whitelist is a palette-adherence violation. The whitelist is",
    "grouped only for legibility; all groups are equally allowed:",
    "",
    blocks,
    "",
    "Emit each block id namespaced (prefix `minecraft:`, e.g. `minecraft:iron_block`)",
    "drawn from the bare names above. Record the palette you used:",
    `- palette.palette_id = "${palette.id}"`,
    "- palette.manifest = the set of block ids you actually place (a subset of the whitelist).",
    "",
    "## Required metadata",
    "Set these fields EXACTLY so the trial is reproducible and attributable to this",
    "prompting archetype:",
    ...metadataLines,
    "",
    "## Style record",
    `Set style.name = "${styleBrief.name}" and style.rationale to a short account of`,
    "how your design realizes the style with the whitelisted materials.",
  ].join("\n");

  return { prompt, seedMetadata };
}

/**
 * Enforce attribution (AC #4): the produced artifact must declare it was generated
 * by THIS archetype. The harness cannot stamp the model-authored, schema-enforced,
 * frozen artifact — so the prompt pins `prompting_method_id` and this guard verifies
 * it, failing a mislabeled trial loudly instead of logging a wrong row in
 * trial.json. PURE; unit-tested.
 * @param {import("./artifact.mjs").DesignArtifact} artifact
 * @param {{ id: string }} [archetype]
 */
export function assertAttribution(artifact, archetype = SINGLE_SHOT) {
  const got = artifact && artifact.metadata && artifact.metadata.prompting_method_id;
  if (got !== archetype.id) {
    throw new Error(
      `single-shot: artifact is not attributable to this archetype — ` +
        `metadata.prompting_method_id is ${JSON.stringify(got)}, expected "${archetype.id}"`,
    );
  }
}

/**
 * Run ONE live, metered single-shot trial end to end (AC #1–#4). LIVE — builds the
 * prompt and hands it to runTrial (the single metered seam, T-004-01), which calls
 * the SDK, enforces + re-validates the schema, and writes the trial store. Then
 * asserts attribution. Not unit-tested (spec §4); its logic is the pure functions
 * above, which are.
 * @param {TrialSpec} spec
 * @returns {Promise<{ record: import("./trial.mjs").TrialRecord, artifact: import("./artifact.mjs").DesignArtifact, dir: string }>}
 */
export async function runSingleShotTrial(spec) {
  const { prompt, seedMetadata } = buildSingleShotPrompt(spec);
  const result = await runTrial({
    prompt,
    metadata: seedMetadata,
    model: spec.model,
    outDir: spec.outDir,
  });
  assertAttribution(result.artifact);
  return result;
}
