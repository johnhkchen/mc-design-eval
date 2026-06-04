// Unit suite for the iterative-multimodal archetype's PURE surface (T-005-03, AC #1–#4).
//
// Covers the descriptor, spec validation, both prompt builders (round 0 + versioned
// revision), the no-op / palette-adherence / trial-id gates, and the per-round +
// iterative record builders — over the real shipped neoclassical palette and plain
// objects. The SDK and the GL render core are NEVER imported and runIterativeTrial()
// is NEVER called: the suite is offline, GPU-free, and free of metered calls (spec §4).
// That this file runs under `node --test` at all is the proof the live fn's heavy
// deps are lazy.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ITERATIVE_MULTIMODAL,
  assertSpec,
  seedMetadataFor,
  buildRound0Prompt,
  buildRevisionPrompt,
  isNoOpRevision,
  assertInPalette,
  assertTrialId,
  buildRoundRecord,
  buildIterativeRecord,
} from "./iterative-multimodal.mjs";
import { loadPalette } from "./palette.mjs";
import { TARGET_BRIEFS, STYLE_BRIEFS } from "./briefs.mjs";

const HOUSE_SPEC = {
  target: "house",
  paletteId: "neoclassical",
  style: "neoclassical",
  trialId: "phase1-house-iter-0001",
  seed: 7,
  serverStateId: "flat-creative-superflat.v1",
};

const NEO = loadPalette("neoclassical");

/** Build a minimal in-palette artifact for the gate tests. */
function inPaletteArtifact(overrides = {}) {
  const block = `minecraft:${NEO.blocks[0]}`;
  return {
    schema_version: "1.0.0",
    metadata: { trial_id: HOUSE_SPEC.trialId, prompting_method_id: ITERATIVE_MULTIMODAL.id, model_id: "claude-opus-4-8" },
    style: { name: "neoclassical", rationale: "r" },
    palette: { palette_id: "neoclassical", manifest: [block] },
    placements: [{ op: "voxel", pos: [0, 0, 0], block }],
    ...overrides,
  };
}

// --- descriptor -----------------------------------------------------------

test("ITERATIVE_MULTIMODAL is the single-sourced, versioned archetype id (AC #4)", () => {
  assert.equal(ITERATIVE_MULTIMODAL.id, "iterative-multimodal.v1");
  assert.equal(ITERATIVE_MULTIMODAL.version, 1);
  assert.equal(ITERATIVE_MULTIMODAL.defaultRounds, 3);
});

// --- assertSpec -----------------------------------------------------------

test("assertSpec accepts a valid spec and an omitted rounds", () => {
  assert.doesNotThrow(() => assertSpec(HOUSE_SPEC));
  assert.doesNotThrow(() => assertSpec({ ...HOUSE_SPEC, rounds: 5 }));
});

test("assertSpec rejects malformed specs incl. bad rounds", () => {
  assert.throws(() => assertSpec({ ...HOUSE_SPEC, target: "castle" }), /unknown target/);
  assert.throws(() => assertSpec({ ...HOUSE_SPEC, style: "rococo" }), /unknown style/);
  assert.throws(() => assertSpec({ ...HOUSE_SPEC, paletteId: "" }), /paletteId/);
  assert.throws(() => assertSpec({ ...HOUSE_SPEC, trialId: "" }), /trialId/);
  assert.throws(() => assertSpec({ ...HOUSE_SPEC, serverStateId: "" }), /serverStateId/);
  assert.throws(() => assertSpec({ ...HOUSE_SPEC, seed: 1.5 }), /seed must be an integer/);
  assert.throws(() => assertSpec({ ...HOUSE_SPEC, rounds: 0 }), /rounds must be a positive integer/);
  assert.throws(() => assertSpec({ ...HOUSE_SPEC, rounds: -1 }), /rounds must be a positive integer/);
  assert.throws(() => assertSpec({ ...HOUSE_SPEC, rounds: 2.5 }), /rounds must be a positive integer/);
});

// --- seedMetadataFor ------------------------------------------------------

test("seedMetadataFor pins identity to THIS archetype (AC #4)", () => {
  const m = seedMetadataFor(HOUSE_SPEC);
  assert.equal(m.prompting_method_id, "iterative-multimodal.v1");
  assert.equal(m.trial_id, "phase1-house-iter-0001");
  assert.equal(m.model_id, "claude-opus-4-8");
  assert.equal(m.target, "house");
  assert.equal(m.created_at, undefined);
  assert.equal(seedMetadataFor({ ...HOUSE_SPEC, model: "claude-sweep-x" }).model_id, "claude-sweep-x");
  assert.equal(seedMetadataFor({ ...HOUSE_SPEC, createdAt: "2026-06-04T15:30:00Z" }).created_at, "2026-06-04T15:30:00Z");
});

// --- buildRound0Prompt ----------------------------------------------------

test("round-0 prompt injects the whole neoclassical whitelist as the binding constraint", () => {
  const { prompt } = buildRound0Prompt(HOUSE_SPEC);
  for (const block of NEO.blocks) {
    assert.ok(prompt.includes(block), `round-0 prompt injects whitelist block "${block}"`);
  }
  assert.match(prompt, /ONLY blocks from the whitelist/);
  assert.match(prompt, /violation/);
  assert.match(prompt, /palette\.palette_id = "neoclassical"/);
});

test("round-0 prompt carries target headline + neoclassical brief + palette description", () => {
  const { prompt } = buildRound0Prompt(HOUSE_SPEC);
  assert.ok(prompt.includes(TARGET_BRIEFS.house.headline), "house target headline present");
  assert.ok(prompt.includes(STYLE_BRIEFS.neoclassical.brief), "neoclassical style brief present");
  assert.ok(prompt.includes(NEO.description), "palette description present");
});

test("round-0 prompt frames an iterative DRAFT, not a one-shot (spec §7)", () => {
  const { prompt } = buildRound0Prompt(HOUSE_SPEC);
  assert.match(prompt, /ROUND 0/);
  assert.match(prompt, /DRAFT/);
  assert.match(prompt, /revise/i);
  // It must NOT carry single-shot's "no revision" framing.
  assert.ok(!/no revision/i.test(prompt), "round-0 must not say 'no revision'");
});

test("round-0 prompt pins all reproducibility metadata incl. the archetype id (AC #4)", () => {
  const { prompt, seedMetadata } = buildRound0Prompt(HOUSE_SPEC);
  assert.match(prompt, /metadata\.prompting_method_id = "iterative-multimodal\.v1"/);
  assert.match(prompt, /metadata\.trial_id = "phase1-house-iter-0001"/);
  assert.match(prompt, /metadata\.seed = 7/);
  assert.match(prompt, /metadata\.target = "house"/);
  assert.equal(seedMetadata.prompting_method_id, ITERATIVE_MULTIMODAL.id);
});

test("round-0 prompt is deterministic and honors a model override", () => {
  assert.equal(buildRound0Prompt(HOUSE_SPEC).prompt, buildRound0Prompt(HOUSE_SPEC).prompt);
  const { prompt, seedMetadata } = buildRound0Prompt({ ...HOUSE_SPEC, model: "claude-sweep-x" });
  assert.match(prompt, /metadata\.model_id = "claude-sweep-x"/);
  assert.equal(seedMetadata.model_id, "claude-sweep-x");
});

// --- buildRevisionPrompt --------------------------------------------------

test("revision prompt names the neoclassical detail vocabulary (AC #1 / ticket §2)", () => {
  const { prompt } = buildRevisionPrompt(HOUSE_SPEC, 1);
  for (const term of [/columns/, /entablature/, /pediment/, /steps|stepped/, /windows|rhythm/]) {
    assert.match(prompt, term);
  }
  assert.match(prompt, /realism/);
  assert.match(prompt, /COMPLETE/);
});

test("revision prompt re-injects the whitelist and re-pins identity (AC #3/#4)", () => {
  const { prompt, seedMetadata } = buildRevisionPrompt(HOUSE_SPEC, 2);
  for (const block of NEO.blocks) assert.ok(prompt.includes(block), `revision re-injects "${block}"`);
  assert.match(prompt, /metadata\.trial_id = "phase1-house-iter-0001"/);
  assert.match(prompt, /metadata\.prompting_method_id = "iterative-multimodal\.v1"/);
  assert.equal(seedMetadata.prompting_method_id, ITERATIVE_MULTIMODAL.id);
});

test("revision prompts differ only by the round counter (one versioned wording)", () => {
  const p1 = buildRevisionPrompt(HOUSE_SPEC, 1).prompt;
  const p2 = buildRevisionPrompt(HOUSE_SPEC, 2).prompt;
  assert.notEqual(p1, p2, "the counter header differs");
  // Strip the leading "## Revision N" line; the remainder must be byte-identical.
  const strip = (s) => s.replace(/^## Revision \d+\n/, "");
  assert.equal(strip(p1), strip(p2), "instruction text is identical across rounds");
  // Deterministic for a fixed round.
  assert.equal(buildRevisionPrompt(HOUSE_SPEC, 1).prompt, buildRevisionPrompt(HOUSE_SPEC, 1).prompt);
});

// --- isNoOpRevision -------------------------------------------------------

test("isNoOpRevision: identical build ⇒ true; changed placement ⇒ false", () => {
  const a = inPaletteArtifact();
  const same = inPaletteArtifact();
  assert.equal(isNoOpRevision(a, same), true);
  const moved = inPaletteArtifact({ placements: [{ op: "voxel", pos: [1, 0, 0], block: `minecraft:${NEO.blocks[0]}` }] });
  assert.equal(isNoOpRevision(a, moved), false);
});

test("isNoOpRevision: metadata/manifest-only churn is still a no-op; null ⇒ not a no-op", () => {
  const a = inPaletteArtifact();
  const churned = inPaletteArtifact({
    metadata: { ...a.metadata, seed: 999 },
    palette: { palette_id: "neoclassical", manifest: [`minecraft:${NEO.blocks[1]}`, `minecraft:${NEO.blocks[0]}`] },
  });
  assert.equal(isNoOpRevision(a, churned), true, "build unchanged ⇒ no-op");
  assert.equal(isNoOpRevision(null, a), false);
  assert.equal(isNoOpRevision(a, undefined), false);
});

// --- assertInPalette (AC #3) ----------------------------------------------

test("assertInPalette passes an in-palette artifact", () => {
  assert.doesNotThrow(() => assertInPalette(inPaletteArtifact(), NEO));
});

test("assertInPalette throws naming an off-palette placement block", () => {
  const bad = inPaletteArtifact({ placements: [{ op: "voxel", pos: [0, 0, 0], block: "minecraft:slime_block" }] });
  assert.throws(() => assertInPalette(bad, NEO), /off the "neoclassical" palette.*slime_block/s);
});

test("assertInPalette throws on a manifest entry outside the whitelist", () => {
  const bad = inPaletteArtifact({ palette: { palette_id: "neoclassical", manifest: ["minecraft:slime_block"] } });
  assert.throws(() => assertInPalette(bad, NEO), /slime_block/);
});

test("assertInPalette throws on a palette_id mismatch", () => {
  const bad = inPaletteArtifact({ palette: { palette_id: "industrial", manifest: [] } });
  assert.throws(() => assertInPalette(bad, NEO), /expected "neoclassical"/);
});

// --- assertTrialId (AC #4) ------------------------------------------------

test("assertTrialId passes on match, throws on drift/missing", () => {
  assert.doesNotThrow(() => assertTrialId(inPaletteArtifact(), HOUSE_SPEC.trialId));
  assert.throws(() => assertTrialId(inPaletteArtifact({ metadata: { trial_id: "other" } }), HOUSE_SPEC.trialId), /drift/);
  assert.throws(() => assertTrialId({ metadata: {} }, HOUSE_SPEC.trialId), /drift/);
});

// --- record builders ------------------------------------------------------

// tallyUsage-shaped stand-ins (like trial.test.mjs): an assistant turn + a result.
const assistantMsg = (out) => ({ type: "assistant", message: { usage: { input_tokens: 10, output_tokens: out } } });
const resultMsg = (out) => ({
  type: "result",
  subtype: "success",
  usage: { input_tokens: 10, output_tokens: out },
  total_cost_usd: 0.01,
  num_turns: 1,
});
const renderReport = {
  path: "/abs/env/trials/t/rev1.png",
  bytes: 4096,
  placed: 120,
  unmapped: [],
  bounds: { min: [0, 0, 0], max: [8, 6, 8] },
};

test("buildRoundRecord: text round carries tallied usage, no render/image", () => {
  const row = buildRoundRecord({ round: 0, mode: "text", messages: [assistantMsg(50)], raw: resultMsg(50) });
  assert.equal(row.round, 0);
  assert.equal(row.mode, "text");
  assert.equal(row.status, "success");
  assert.equal(row.usage.totals.output_tokens, 50);
  assert.equal(row.usage.turns.length, 1);
  assert.equal(row.render, undefined);
  assert.equal(row.image, undefined);
});

test("buildRoundRecord: multimodal round folds in the render summary (no absolute path) + image", () => {
  const row = buildRoundRecord({
    round: 1, mode: "multimodal", messages: [assistantMsg(60)], raw: resultMsg(60), render: renderReport, image: "t-rev1.png",
  });
  assert.equal(row.mode, "multimodal");
  assert.equal(row.image, "t-rev1.png");
  assert.equal(row.render.placed, 120);
  assert.equal(row.render.unmapped, 0);
  assert.deepEqual(row.render.bounds, renderReport.bounds);
  assert.equal(row.render.path, undefined, "no absolute path leaks into the record");
});

test("buildIterativeRecord: identity from the artifact, summed usage, round/stop bookkeeping", () => {
  const r0 = buildRoundRecord({ round: 0, mode: "text", messages: [assistantMsg(50)], raw: resultMsg(50) });
  const r1 = buildRoundRecord({ round: 1, mode: "multimodal", messages: [assistantMsg(60)], raw: resultMsg(60), render: renderReport, image: "t-rev1.png" });
  const record = buildIterativeRecord({
    artifact: inPaletteArtifact(),
    rounds: [r0, r1],
    roundsConfigured: 3,
    stoppedReason: "noop",
    finishedAt: "2026-06-04T00:00:00.000Z",
  });
  assert.equal(record.prompting_method_id, "iterative-multimodal.v1");
  assert.equal(record.model_id, "claude-opus-4-8");
  assert.equal(record.schema_version, "1.0.0");
  assert.equal(record.archetype.id, "iterative-multimodal.v1");
  assert.equal(record.archetype.rounds_configured, 3);
  assert.equal(record.archetype.rounds_run, 1, "two round rows ⇒ one revision performed");
  assert.equal(record.archetype.stopped_reason, "noop");
  assert.equal(record.usage.totals.output_tokens, 110, "summed across rounds");
  assert.equal(record.status, "success");
  assert.equal(record.finished_at, "2026-06-04T00:00:00.000Z");
  assert.equal(record.rounds.length, 2);
});
