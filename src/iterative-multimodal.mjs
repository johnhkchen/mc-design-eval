// Iterative-multimodal prompting archetype (T-005-03) — E-03, spec §7 archetypes 2+3.
//
// A NAMED, VERSIONED configuration of a harness-orchestrated feedback loop: build an
// initial design from a base prompt, then for N rounds RENDER the current design to a
// WIP image, show that image back to the model with a versioned revision instruction,
// and take the model's COMPLETE revised artifact — generate → render → see → revise.
// The loop is run by the harness (not an emergent model tool call) so results are
// attributable to THIS config, not to incidental wording drift (spec §7).
//
// Layering mirrors the rest of the harness. Unlike single-shot (which layers on the
// single-call runTrial), an N-round loop accumulates across calls, so this archetype
// orchestrates the single metered seam DIRECTLY — requestDesignArtifact for round 0
// (text) and requestDesignArtifactWithImage for each revision (image) — exactly as
// smoke-trial.mjs steps outside the runner to add rendering. It reuses the runner's
// PURE logging helpers (tallyUsage / serializeTranscript) and render-tool's pure
// helpers (derivePath / renderSummary) so the record format never forks.
//
// Split (mirrors the runner): the descriptor, prompt builders, stop/round bookkeeping,
// and the schema-/palette-adherence gates are PURE and unit-tested over the real
// shipped neoclassical palette and plain artifact objects. The one live, metered
// driver (runIterativeTrial) is thin glue over already-tested-or-documented seams and
// is NOT exercised by `npm test` (spec §4: live calls bill at full rates; rendering
// needs headless GL). The GL/prismarine render core is lazy-imported inside it, so
// importing THIS module for the pure tests loads neither the SDK nor GL.

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";
import {
  requestDesignArtifact,
  requestDesignArtifactWithImage,
} from "./sdk-binding.mjs";
import { tallyUsage, serializeTranscript } from "./trial.mjs";
import { derivePath, renderSummary } from "./render-tool.mjs";
import { assertAttribution } from "./single-shot.mjs";
import { loadPalette, formatPaletteBlocks } from "./palette.mjs";
import { TARGET_BRIEFS, STYLE_BRIEFS } from "./briefs.mjs";
import { PHASE1_MODEL_ID, ITERATIVE_MULTIMODAL_METHOD_ID } from "./config.mjs";

/**
 * The archetype descriptor. `id` is single-sourced from config.mjs so there is
 * exactly one spelling of this archetype's identity. The `.v1` suffix is the
 * versioning: any change to round-0 OR revision prompt construction that could move
 * results bumps it (→ `.v2`), so every logged trial is attributable to the exact
 * construction that produced it (spec §7 / AC #4). `defaultRounds` is the configurable
 * number of REVISION rounds after round 0 (AC #2) — default 3, so a default trial is
 * one generation plus three render-grounded revisions (four model calls).
 * @type {Readonly<{ id: string, version: number, defaultRounds: number, label: string }>}
 */
export const ITERATIVE_MULTIMODAL = Object.freeze({
  id: ITERATIVE_MULTIMODAL_METHOD_ID, // "iterative-multimodal.v1"
  version: 1,
  defaultRounds: 3,
  label: "Iterative multimodal (render → see → revise, N rounds)",
});

/**
 * @typedef {Object} TrialSpec
 * @property {"house"|"path"|"landscape"} target  build target (a TARGET_BRIEFS key)
 * @property {string} paletteId                   style-palette id, e.g. "neoclassical"
 * @property {string} style                       style name (a STYLE_BRIEFS key)
 * @property {string} trialId                     stable trial identifier (the join key)
 * @property {number} seed                        integer generation seed
 * @property {string} serverStateId               assumed world-state id
 * @property {number} [rounds]                    revision rounds after round 0 (default 3)
 * @property {string} [model]                     model override (defaults to the pin)
 * @property {string} [createdAt]                 optional ISO timestamp (injected, not clock-read)
 * @property {string} [outDir]                    trial-store root (defaults to "trials")
 */

/**
 * Validate a TrialSpec before any work. A misconfigured archetype must fail here, not
 * after a metered call. Same field checks as single-shot's assertSpec, plus the
 * iterative-only `rounds` (when present, a positive integer). Throws a field-named
 * Error prefixed `iterative-multimodal:`.
 * @param {TrialSpec} spec
 */
export function assertSpec(spec) {
  const s = spec || {};
  if (!TARGET_BRIEFS[s.target]) {
    throw new Error(
      `iterative-multimodal: unknown target "${s.target}" (expected one of ${Object.keys(TARGET_BRIEFS).join(", ")})`,
    );
  }
  if (!STYLE_BRIEFS[s.style]) {
    throw new Error(
      `iterative-multimodal: unknown style "${s.style}" (expected one of ${Object.keys(STYLE_BRIEFS).join(", ")})`,
    );
  }
  for (const field of ["paletteId", "trialId", "serverStateId"]) {
    if (typeof s[field] !== "string" || s[field].length === 0) {
      throw new Error(`iterative-multimodal: spec.${field} must be a non-empty string`);
    }
  }
  if (!Number.isInteger(s.seed)) {
    throw new Error(`iterative-multimodal: spec.seed must be an integer (got ${s.seed})`);
  }
  if (s.rounds !== undefined && (!Number.isInteger(s.rounds) || s.rounds < 1)) {
    throw new Error(
      `iterative-multimodal: spec.rounds must be a positive integer when set (got ${s.rounds})`,
    );
  }
}

/**
 * Build the metadata this archetype pins on the artifact, shared by BOTH prompt
 * builders so round 0 and every revision agree on identity (the artifact is the one
 * source). PURE. `prompting_method_id` is THIS archetype, so the produced artifact is
 * attributable (AC #4) and re-validatable across rounds.
 * @param {TrialSpec} spec
 * @returns {import("./artifact.mjs").Metadata}
 */
export function seedMetadataFor(spec) {
  const { target, trialId, seed, serverStateId, model, createdAt } = spec;
  /** @type {import("./artifact.mjs").Metadata} */
  const meta = {
    trial_id: trialId,
    prompting_method_id: ITERATIVE_MULTIMODAL.id,
    model_id: model || PHASE1_MODEL_ID,
    seed,
    server_state_id: serverStateId,
    target,
  };
  if (createdAt) meta.created_at = createdAt;
  return meta;
}

/** The `- metadata.x = …` prompt lines for a Metadata, shared by both builders. */
function metadataPinLines(meta) {
  const lines = [
    `- metadata.trial_id = "${meta.trial_id}"`,
    `- metadata.prompting_method_id = "${meta.prompting_method_id}"`,
    `- metadata.model_id = "${meta.model_id}"`,
    `- metadata.seed = ${meta.seed}`,
    `- metadata.server_state_id = "${meta.server_state_id}"`,
    `- metadata.target = "${meta.target}"`,
  ];
  if (meta.created_at) lines.push(`- metadata.created_at = "${meta.created_at}"`);
  return lines;
}

/** The binding-material-constraint section, shared by both builders. */
function materialConstraintLines(palette, blocks) {
  return [
    "## Material constraint (binding)",
    "You MUST use ONLY blocks from the whitelist below. It is the single allowed",
    "material set: every placement's `block` MUST be one of these blocks, and any",
    "block outside this whitelist is a palette-adherence violation. The whitelist is",
    "grouped only for legibility; all groups are equally allowed:",
    "",
    blocks,
    "",
    "Emit each block id namespaced (prefix `minecraft:`, e.g. `minecraft:quartz_block`)",
    "drawn from the bare names above. Record the palette you used:",
    `- palette.palette_id = "${palette.id}"`,
    "- palette.manifest = the set of block ids you actually place (a subset of the whitelist).",
  ];
}

/**
 * Build the ROUND-0 prompt and the metadata it pins. PURE (the only side is the
 * deterministic palette read via loadPalette). Reuses single-shot's construction
 * SHAPE (target → style → binding palette → metadata → style record) but with
 * iterative framing: this is an initial DRAFT the model will REVISE from renders —
 * the opposite of single-shot's "one response, no revision". Same spec in →
 * byte-identical prompt out.
 * @param {TrialSpec} spec
 * @returns {{ prompt: string, seedMetadata: import("./artifact.mjs").Metadata }}
 */
export function buildRound0Prompt(spec) {
  assertSpec(spec);
  const { target, paletteId, style } = spec;

  const palette = loadPalette(paletteId);
  const targetBrief = TARGET_BRIEFS[target];
  const styleBrief = STYLE_BRIEFS[style];
  const blocks = formatPaletteBlocks(palette);
  const seedMetadata = seedMetadataFor(spec);

  const prompt = [
    "You are designing a Minecraft build through ITERATION. This is ROUND 0: produce a",
    "complete, coherent initial DRAFT now. Over the next rounds you will be shown a",
    "render of your own design and asked to revise it — so commit to a strong whole",
    "here, knowing you will refine its realism, proportion, and detail from what you see.",
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
    ...materialConstraintLines(palette, blocks),
    "",
    "## Required metadata",
    "Set these fields EXACTLY so the trial is reproducible and attributable to this",
    "prompting archetype (keep them identical in every later revision):",
    ...metadataPinLines(seedMetadata),
    "",
    "## Style record",
    `Set style.name = "${styleBrief.name}" and style.rationale to a short account of`,
    "how your design realizes the style with the whitelisted materials.",
  ].join("\n");

  return { prompt, seedMetadata };
}

/**
 * Build the REVISION prompt for a given round (1..N) and the metadata it re-pins.
 * PURE. This is the versioned (`.v1`) revision policy: a FIXED instruction — see the
 * render, improve realism/proportion/depth and the named neoclassical detail, stay
 * strictly in the palette, emit the COMPLETE revised artifact — identical across all
 * rounds except a human-legible "revision N" header (so all revision turns share one
 * versioned wording; only the counter varies). Re-injects the binding whitelist and
 * re-pins identity (trial_id + archetype) so the revised artifact stays attributable
 * and the join key cannot drift. The image itself is delivered by the seam, not here.
 * @param {TrialSpec} spec
 * @param {number} round  1-based revision round
 * @returns {{ prompt: string, seedMetadata: import("./artifact.mjs").Metadata }}
 */
export function buildRevisionPrompt(spec, round) {
  assertSpec(spec);
  const { paletteId, style } = spec;

  const palette = loadPalette(paletteId);
  const styleBrief = STYLE_BRIEFS[style];
  const blocks = formatPaletteBlocks(palette);
  const seedMetadata = seedMetadataFor(spec);

  const prompt = [
    `## Revision ${round}`,
    "Attached is a headless render of your CURRENT design. Study it as built, then",
    "revise it. Improve realism, proportion, and depth, and sharpen the",
    `"${styleBrief.name}" architectural order you can SEE is missing or weak:`,
    "columns (shaft, capital, base), the entablature and cornice above them, the",
    "triangular pediment, the stepped base, and the rhythm and proportion of the",
    "windows. Fix anything that reads flat, lopsided, or unfinished in the render.",
    "",
    "Stay STRICTLY within the palette below — every block you place must be on this",
    "whitelist, exactly as in round 0. Then emit the COMPLETE revised design artifact",
    "(the whole thing, not a diff or a description of changes).",
    "",
    ...materialConstraintLines(palette, blocks),
    "",
    "## Required metadata (unchanged)",
    "Keep these fields EXACTLY as in round 0 so the trial stays reproducible and",
    "attributable across rounds:",
    ...metadataPinLines(seedMetadata),
    "",
    "## Style record",
    `Set style.name = "${styleBrief.name}" and update style.rationale to reflect this revision.`,
  ].join("\n");

  return { prompt, seedMetadata };
}

/**
 * Has a revision changed the BUILD? Compares only the build-determining content —
 * `placements` (order-sensitive: placement order is part of the build) and `style` —
 * canonicalized via JSON.stringify. Metadata or palette-manifest churn around an
 * identical build is still a no-op (nothing new to render or score), so the loop can
 * stop early. PURE; a null/undefined operand is treated as "changed" (never a no-op),
 * so a malformed comparand never silently halts the loop.
 * @param {import("./artifact.mjs").DesignArtifact} prev
 * @param {import("./artifact.mjs").DesignArtifact} next
 * @returns {boolean}
 */
export function isNoOpRevision(prev, next) {
  if (!prev || !next) return false;
  const key = (a) => JSON.stringify({ placements: a.placements, style: a.style });
  return key(prev) === key(next);
}

/**
 * Enforce palette adherence (AC #3): every placed block and every declared manifest
 * entry must be on the configured palette's whitelist, and the artifact must declare
 * that palette. The palette stores BARE ids; placements are namespaced `minecraft:` —
 * the prefix is normalized before comparison. PURE; throws a located Error naming the
 * offender(s) so a violating round fails LOUDLY rather than logging a bad row. This is
 * a narrow harness gate, not the full E-04 adherence scorer (which palette.mjs's
 * header anticipates can later absorb it).
 * @param {import("./artifact.mjs").DesignArtifact} artifact
 * @param {import("./palette.mjs").Palette} palette
 */
export function assertInPalette(artifact, palette) {
  const whitelist = new Set((palette && palette.blocks) || []);
  const bare = (id) => String(id).replace(/^minecraft:/, "");

  const declared = artifact && artifact.palette;
  if (!declared || declared.palette_id !== palette.id) {
    throw new Error(
      `iterative-multimodal: artifact.palette.palette_id is ${JSON.stringify(declared && declared.palette_id)}, ` +
        `expected "${palette.id}"`,
    );
  }

  const offenders = [];
  for (const p of (artifact.placements || [])) {
    if (!whitelist.has(bare(p.block))) offenders.push(p.block);
  }
  for (const m of (declared.manifest || [])) {
    if (!whitelist.has(bare(m))) offenders.push(m);
  }
  if (offenders.length) {
    const unique = [...new Set(offenders)];
    throw new Error(
      `iterative-multimodal: ${unique.length} block(s) off the "${palette.id}" palette: ${unique.join(", ")}`,
    );
  }
}

/**
 * Enforce that an artifact carries the expected trial_id — the join key for scores,
 * renders, and ratings. A revision that silently changed it would orphan the trial,
 * so this guards every round (AC #4). PURE; throws on mismatch/missing.
 * @param {import("./artifact.mjs").DesignArtifact} artifact
 * @param {string} trialId
 */
export function assertTrialId(artifact, trialId) {
  const got = artifact && artifact.metadata && artifact.metadata.trial_id;
  if (got !== trialId) {
    throw new Error(
      `iterative-multimodal: trial_id drift — artifact metadata.trial_id is ${JSON.stringify(got)}, ` +
        `expected ${JSON.stringify(trialId)}`,
    );
  }
}

/**
 * Build one round's record row (PURE). `messages`/`raw` are the SDK message stream and
 * terminal result for THIS round; usage is tallied per round so spec §9's turn-over-
 * turn context growth (incl. image tokens, which ride in the turn usage) is first
 * class. A render report (rounds 1..N) is folded in via renderSummary with the
 * absolute path dropped (the record implies its own directory), plus the WIP image's
 * trial-relative name. Round 0 passes neither.
 * @param {Object} p
 * @param {number} p.round
 * @param {"text"|"multimodal"} p.mode
 * @param {object[]} p.messages
 * @param {object} p.raw                            terminal SDKResult message
 * @param {import("../render/src/render-tool.mjs").RenderReport} [p.render]
 * @param {string} [p.image]                        trial-relative png name
 * @returns {object}
 */
export function buildRoundRecord({ round, mode, messages, raw, render, image }) {
  const row = {
    round,
    mode,
    status: (raw && raw.subtype) || "unknown",
    usage: tallyUsage(messages, raw),
  };
  if (render) {
    const { path, ...rest } = renderSummary(render);
    row.render = rest;
  }
  if (image) row.image = image;
  return row;
}

/** Sum the per-round billed totals into one aggregate (pure). */
function sumTotals(rounds) {
  const acc = {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
    total_cost_usd: 0,
    num_turns: 0,
  };
  for (const r of rounds) {
    const t = (r.usage && r.usage.totals) || {};
    for (const k of Object.keys(acc)) acc[k] += typeof t[k] === "number" ? t[k] : 0;
  }
  return acc;
}

/**
 * Assemble the per-trial record (PURE). Identity is pulled FROM THE FINAL ARTIFACT
 * (model_id, prompting_method_id, schema_version, metadata) so the record cannot
 * disagree with the artifact it describes. The `archetype` block records the
 * configured vs. actually-run round counts and why the loop stopped; `rounds` is the
 * per-round breakdown; `usage.totals` is their sum. `finishedAt` is a parameter, not a
 * clock read, so this stays deterministically testable.
 * @param {Object} p
 * @param {import("./artifact.mjs").DesignArtifact} p.artifact   the final artifact
 * @param {object[]} p.rounds                                    buildRoundRecord rows
 * @param {number} p.roundsConfigured
 * @param {"rounds"|"noop"} p.stoppedReason
 * @param {string} p.finishedAt                                  ISO date-time
 * @returns {object}
 */
export function buildIterativeRecord({ artifact, rounds, roundsConfigured, stoppedReason, finishedAt }) {
  const last = rounds[rounds.length - 1];
  return {
    metadata: artifact.metadata,
    model_id: artifact.metadata.model_id,
    prompting_method_id: artifact.metadata.prompting_method_id,
    schema_version: artifact.schema_version,
    archetype: {
      id: ITERATIVE_MULTIMODAL.id,
      version: ITERATIVE_MULTIMODAL.version,
      rounds_configured: roundsConfigured,
      rounds_run: Math.max(0, rounds.length - 1), // revisions actually performed
      stopped_reason: stoppedReason,
    },
    status: (last && last.status) || "unknown",
    usage: { totals: sumTotals(rounds) },
    rounds,
    finished_at: finishedAt,
  };
}

/**
 * Run ONE live, metered iterative-multimodal trial end to end (AC #1–#4). LIVE — it
 * drives the single metered seam directly (requestDesignArtifact for round 0,
 * requestDesignArtifactWithImage for each revision) and the GL render core (lazy-
 * imported here so the pure tests never load it), and writes the trial store. NOT
 * unit-tested (spec §4: metered + headless GL); all its decision logic is the pure
 * functions above, which are.
 *
 * Steps: build the round-0 draft (text) → for each round 1..N render the current
 * artifact to a WIP PNG and feed it back through the multimodal seam with the
 * versioned revision prompt → re-validate (the seam re-checks the schema and throws;
 * this loop additionally asserts trial_id, attribution, and palette adherence each
 * round, AC #3/#4) → stop after N rounds or on a no-op revision → write the per-round
 * artifacts, all WIP renders, the concatenated transcript, and the iterative record.
 * @param {TrialSpec} spec
 * @returns {Promise<{ record: object, artifact: import("./artifact.mjs").DesignArtifact, dir: string, rounds: object[] }>}
 */
export async function runIterativeTrial(spec) {
  assertSpec(spec);
  const rounds = spec.rounds ?? ITERATIVE_MULTIMODAL.defaultRounds;
  const palette = loadPalette(spec.paletteId);
  const outDir = spec.outDir ?? "trials";
  const dir = join(outDir, spec.trialId);
  mkdirSync(dir, { recursive: true });

  // Lazy: only a live run pulls the GL/prismarine core into the process.
  const { renderArtifact } = await import("../render/src/render-tool.mjs");

  const allMessages = [];
  const roundRecords = [];
  let stoppedReason = "rounds";

  const guard = (artifact) => {
    assertTrialId(artifact, spec.trialId);
    assertAttribution(artifact, ITERATIVE_MULTIMODAL);
    assertInPalette(artifact, palette);
  };

  // Round 0 — initial draft via the text seam.
  const { prompt: p0 } = buildRound0Prompt(spec);
  const m0 = [];
  const { artifact: first, raw: raw0 } = await requestDesignArtifact({
    prompt: p0,
    model: spec.model,
    onMessage: (m) => (m0.push(m), allMessages.push(m)),
  });
  guard(first);
  writeFileSync(join(dir, "artifact-round0.json"), JSON.stringify(first, null, 2) + "\n");
  roundRecords.push(buildRoundRecord({ round: 0, mode: "text", messages: m0, raw: raw0 }));

  // Rounds 1..N — render the current design, show it back, take the revision.
  let current = first;
  for (let r = 1; r <= rounds; r++) {
    const imagePath = derivePath(dir, spec.trialId, r);
    const report = await renderArtifact(current, { outPath: imagePath });
    const png = readFileSync(report.path);

    const { prompt: pr } = buildRevisionPrompt(spec, r);
    const mk = [];
    const { artifact: next, raw: rawk } = await requestDesignArtifactWithImage({
      prompt: pr,
      images: [png],
      model: spec.model,
      onMessage: (m) => (mk.push(m), allMessages.push(m)),
    });
    guard(next);
    writeFileSync(join(dir, `artifact-round${r}.json`), JSON.stringify(next, null, 2) + "\n");
    roundRecords.push(
      buildRoundRecord({
        round: r,
        mode: "multimodal",
        messages: mk,
        raw: rawk,
        render: report,
        image: basename(imagePath),
      }),
    );

    const noop = isNoOpRevision(current, next);
    current = next; // the last artifact is final, no-op or not
    if (noop) {
      stoppedReason = "noop";
      break;
    }
  }

  // Final store: the final artifact, the full multi-round transcript, the record.
  writeFileSync(join(dir, "artifact.json"), JSON.stringify(current, null, 2) + "\n");
  writeFileSync(join(dir, "transcript.jsonl"), serializeTranscript(allMessages));
  const record = buildIterativeRecord({
    artifact: current,
    rounds: roundRecords,
    roundsConfigured: rounds,
    stoppedReason,
    finishedAt: new Date().toISOString(),
  });
  writeFileSync(join(dir, "trial.json"), JSON.stringify(record, null, 2) + "\n");

  return { record, artifact: current, dir, rounds: roundRecords };
}
