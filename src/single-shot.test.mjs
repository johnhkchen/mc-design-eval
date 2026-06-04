// Unit suite for the single-shot archetype's PURE surface (T-004-02, AC #1–#4).
//
// Covers buildSingleShotPrompt (prompt construction, spec validation, determinism)
// and assertAttribution over the real shipped industrial palette and plain artifact
// objects. The SDK is never imported and runSingleShotTrial() is never called — the
// suite is offline and free of metered API calls (spec §4).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SINGLE_SHOT,
  buildSingleShotPrompt,
  assertAttribution,
} from "./single-shot.mjs";
import { loadPalette } from "./palette.mjs";
import { TARGET_BRIEFS, STYLE_BRIEFS } from "./briefs.mjs";

const HOUSE_SPEC = {
  target: "house",
  paletteId: "industrial",
  style: "industrial",
  trialId: "phase1-house-singleshot-0001",
  seed: 42,
  serverStateId: "flat-creative-superflat.v1",
};

// --- descriptor -----------------------------------------------------------

test("SINGLE_SHOT id is the single-sourced, versioned archetype id", () => {
  assert.equal(SINGLE_SHOT.id, "single-shot.v1");
  assert.equal(SINGLE_SHOT.version, 1);
});

// --- buildSingleShotPrompt: content (AC #1, #3) ---------------------------

test("prompt injects the whole palette whitelist as the binding constraint", () => {
  const { prompt } = buildSingleShotPrompt(HOUSE_SPEC);
  const palette = loadPalette("industrial");
  for (const block of palette.blocks) {
    assert.ok(prompt.includes(block), `prompt injects whitelist block "${block}"`);
  }
  // Framed as binding, not a suggestion.
  assert.match(prompt, /ONLY blocks from the whitelist/);
  assert.match(prompt, /violation/);
  assert.match(prompt, /palette\.palette_id = "industrial"/);
});

test("prompt carries the target brief and the named style brief (AC #1)", () => {
  const { prompt } = buildSingleShotPrompt(HOUSE_SPEC);
  assert.ok(prompt.includes(TARGET_BRIEFS.house.headline), "house target headline present");
  assert.ok(prompt.includes(STYLE_BRIEFS.industrial.brief), "industrial style brief present");
  assert.ok(prompt.includes(loadPalette("industrial").description), "palette description present");
});

test("prompt is single-shot: one generation, no revision (spec §7)", () => {
  const { prompt } = buildSingleShotPrompt(HOUSE_SPEC);
  assert.match(prompt, /ONE response/);
  assert.match(prompt, /no revision/);
});

// --- buildSingleShotPrompt: metadata attribution (AC #4) ------------------

test("prompt pins all reproducibility metadata, incl. the archetype id", () => {
  const { prompt, seedMetadata } = buildSingleShotPrompt(HOUSE_SPEC);
  assert.match(prompt, /metadata\.prompting_method_id = "single-shot\.v1"/);
  assert.match(prompt, /metadata\.trial_id = "phase1-house-singleshot-0001"/);
  assert.match(prompt, /metadata\.model_id = "claude-opus-4-8"/);
  assert.match(prompt, /metadata\.seed = 42/);
  assert.match(prompt, /metadata\.server_state_id = "flat-creative-superflat\.v1"/);
  assert.match(prompt, /metadata\.target = "house"/);

  assert.equal(seedMetadata.prompting_method_id, SINGLE_SHOT.id);
  assert.equal(seedMetadata.trial_id, "phase1-house-singleshot-0001");
  assert.equal(seedMetadata.model_id, "claude-opus-4-8");
  assert.equal(seedMetadata.target, "house");
});

test("a model override flows into both prompt and seedMetadata", () => {
  const { prompt, seedMetadata } = buildSingleShotPrompt({ ...HOUSE_SPEC, model: "claude-sweep-x" });
  assert.match(prompt, /metadata\.model_id = "claude-sweep-x"/);
  assert.equal(seedMetadata.model_id, "claude-sweep-x");
});

test("createdAt is included only when supplied", () => {
  const without = buildSingleShotPrompt(HOUSE_SPEC);
  assert.equal(without.seedMetadata.created_at, undefined);
  assert.ok(!without.prompt.includes("created_at"));
  const withTs = buildSingleShotPrompt({ ...HOUSE_SPEC, createdAt: "2026-06-04T15:30:00Z" });
  assert.equal(withTs.seedMetadata.created_at, "2026-06-04T15:30:00Z");
  assert.match(withTs.prompt, /metadata\.created_at = "2026-06-04T15:30:00Z"/);
});

// --- buildSingleShotPrompt: validation & determinism ----------------------

test("buildSingleShotPrompt rejects malformed specs", () => {
  assert.throws(() => buildSingleShotPrompt({ ...HOUSE_SPEC, target: "castle" }), /unknown target/);
  assert.throws(() => buildSingleShotPrompt({ ...HOUSE_SPEC, style: "rococo" }), /unknown style/);
  assert.throws(() => buildSingleShotPrompt({ ...HOUSE_SPEC, trialId: "" }), /trialId/);
  assert.throws(() => buildSingleShotPrompt({ ...HOUSE_SPEC, serverStateId: "" }), /serverStateId/);
  assert.throws(() => buildSingleShotPrompt({ ...HOUSE_SPEC, seed: 1.5 }), /seed must be an integer/);
  assert.throws(() => buildSingleShotPrompt({ ...HOUSE_SPEC, seed: "42" }), /seed must be an integer/);
});

test("buildSingleShotPrompt is deterministic — same spec, byte-identical prompt", () => {
  assert.equal(buildSingleShotPrompt(HOUSE_SPEC).prompt, buildSingleShotPrompt(HOUSE_SPEC).prompt);
});

// --- assertAttribution (AC #4) --------------------------------------------

test("assertAttribution passes when the artifact declares this archetype", () => {
  assert.doesNotThrow(() =>
    assertAttribution({ metadata: { prompting_method_id: "single-shot.v1" } }),
  );
});

test("assertAttribution throws on a mismatched or missing archetype id", () => {
  assert.throws(
    () => assertAttribution({ metadata: { prompting_method_id: "multi-shot.v1" } }),
    /not attributable/,
  );
  assert.throws(() => assertAttribution({ metadata: {} }), /not attributable/);
  assert.throws(() => assertAttribution({}), /not attributable/);
});
