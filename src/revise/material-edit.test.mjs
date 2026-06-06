// The pure proof for the LLM material-correction route (T-073-01, story S-073, epic E-21).
//
// PURE — no GL/model/network (auto-collected by `src/**/*.test.mjs`). Proves the material editor's heart
// and its wiring into the UNMODIFIED loop with a stubbed `propose` + synthetic `score`, so AC#1/#2 are
// demonstrated without a metered call. Groups: ME-stash (async-propose/sync-replay), ME-policy (in-palette
// vs needs-addition vs off-palette through the editor), ME-cage (keep vs roll-back through reviseLoop with
// NO loop change), ME-additions (the AC#2 log), ME-imports (no top-level GL/SDK).

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { makeMaterialEditor, MATERIAL_EDIT_ROUTE, MATERIAL_EDIT_SCHEMA } from "./material-edit.mjs";
import { selectRegion, subBoundsOf } from "./region.mjs";
import { regionKey } from "./form-edit.mjs";
import { reviseLoop } from "./loop.mjs";

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));

function artifactWith(placements) {
  return {
    schema_version: "1.0.0",
    metadata: { trial_id: "t", prompting_method_id: "p", model_id: "m", seed: 0, server_state_id: "s" },
    style: { name: "x", rationale: "y" },
    palette: { manifest: [...new Set(placements.map((p) => p.block))].sort() },
    placements,
  };
}

// A small build: three stone_brick voxels in a corner region that SHOULD be cobblestone.
const baseArtifact = () =>
  artifactWith([
    { op: "voxel", pos: [0, 0, 0], block: "minecraft:stone_bricks" },
    { op: "voxel", pos: [1, 0, 0], block: "minecraft:stone_bricks" },
    { op: "voxel", pos: [0, 1, 0], block: "minecraft:stone_bricks" },
  ]);

const REGION = { bbox: { min: [0, 0, 0], max: [1, 1, 0] } };
const materialCritic = () => (_a, _R) => [{ defect: "mis-zoned corner", where: "corner", route: MATERIAL_EDIT_ROUTE }];

// --- ME-stash ---------------------------------------------------------------

test("ME-stash: an in-palette swap is proposed, applied, stashed, and replayed by tweakFor", async () => {
  const art = baseArtifact();
  const editor = makeMaterialEditor({
    critic: materialCritic(),
    policy: { mapPalette: ["minecraft:stone_bricks", "minecraft:cobblestone"] },
    propose: async () => ({ swaps: [{ target: 0, block: "minecraft:cobblestone" }], additions: [] }),
  });
  const R = selectRegion(art, REGION);
  const routed = await editor.diagnose(art, R, null);
  assert.equal(routed[0].route, MATERIAL_EDIT_ROUTE);
  const stashed = editor.stash.get(regionKey(subBoundsOf(R)));
  assert.ok(stashed, "the corrected placements are stashed");
  const replayed = editor.tweakFor(MATERIAL_EDIT_ROUTE)(R.placements, subBoundsOf(R));
  assert.ok(replayed.some((p) => p.block === "minecraft:cobblestone"), "tweakFor replays the swap");
  // geometry immutable: same number of placements, same positions
  assert.equal(replayed.length, R.placements.length);
});

test("ME-stash: a non-material route → identity no-op (nothing stashed)", async () => {
  const art = baseArtifact();
  const editor = makeMaterialEditor({
    critic: () => [{ defect: "flat", where: "x", route: "relief" }],
    propose: async () => ({ swaps: [{ target: 0, block: "minecraft:cobblestone" }], additions: [] }),
  });
  const R = selectRegion(art, REGION);
  const routed = await editor.diagnose(art, R, null);
  assert.equal(routed[0].route, "relief", "passed through unchanged");
  assert.equal(editor.stash.size, 0, "nothing stashed for a non-material route");
});

// --- ME-policy --------------------------------------------------------------

test("ME-policy: an off-palette swap with no justification stashes nothing (rolled back)", async () => {
  const art = baseArtifact();
  const editor = makeMaterialEditor({
    critic: materialCritic(),
    policy: { mapPalette: ["minecraft:stone_bricks"] }, // cobblestone NOT allowed, no addition given
    propose: async () => ({ swaps: [{ target: 0, block: "minecraft:cobblestone" }], additions: [] }),
  });
  const R = selectRegion(art, REGION);
  await editor.diagnose(art, R, null);
  assert.equal(editor.stash.size, 0, "off-palette swap dropped → nothing to stash");
  assert.ok(editor.proposals[0].rejected.some((r) => /off-palette/.test(r)), "recorded as off-palette");
});

test("ME-policy: a needs-addition swap applies when its concept-justified addition is gated ok", async () => {
  const art = baseArtifact();
  const editor = makeMaterialEditor({
    critic: materialCritic(),
    policy: { mapPalette: ["minecraft:stone_bricks"] },
    propose: async () => ({
      swaps: [{ target: 0, block: "minecraft:cobblestone" }],
      additions: [{ block: "minecraft:cobblestone", conceptMaterial: "rough cobble buttress", where: "the corner pilaster" }],
    }),
  });
  const R = selectRegion(art, REGION);
  await editor.diagnose(art, R, null);
  assert.ok(editor.stash.get(regionKey(subBoundsOf(R))), "stashed after the addition unlocked the swap");
  assert.equal(editor.additions.length, 1, "the addition is logged");
  assert.equal(editor.additions[0].block, "minecraft:cobblestone");
  assert.equal(editor.additions[0].conceptMaterial, "rough cobble buttress");
});

// --- ME-cage ----------------------------------------------------------------

test("ME-cage: through the UNMODIFIED reviseLoop — accepted when the score improves", async () => {
  const art = baseArtifact();
  const editor = makeMaterialEditor({
    critic: materialCritic(),
    policy: { mapPalette: ["minecraft:stone_bricks", "minecraft:cobblestone"] },
    propose: async () => ({ swaps: [{ target: 0, block: "minecraft:cobblestone" }], additions: [] }),
  });
  // synthetic deterministic score: a build containing cobblestone scores higher (the concept wants it).
  const score = (a) => (a.placements.some((p) => p.block === "minecraft:cobblestone") ? 1 : 0);
  const out = await reviseLoop(art, {
    regions: [REGION],
    diagnose: editor.diagnose,
    tweakFor: editor.tweakFor,
    score,
    budget: { maxIterations: 4, perRegion: 1 },
  });
  assert.ok(out.artifact.placements.some((p) => p.block === "minecraft:cobblestone"), "the recolor was accepted");
  assert.equal(out.locked.length, 1, "the corrected region locked (P14-safe)");
  assert.ok(out.trace.some((t) => t.accepted), "the trace records the accept");
});

test("ME-cage: a recolor that does NOT improve the score is rolled back (no geometry, no regression)", async () => {
  const art = baseArtifact();
  const editor = makeMaterialEditor({
    critic: materialCritic(),
    policy: { mapPalette: ["minecraft:stone_bricks", "minecraft:cobblestone"] },
    propose: async () => ({ swaps: [{ target: 0, block: "minecraft:cobblestone" }], additions: [] }),
  });
  const score = () => 0.5; // flat — no swap ever improves it
  const out = await reviseLoop(art, {
    regions: [REGION],
    diagnose: editor.diagnose,
    tweakFor: editor.tweakFor,
    score,
    budget: { maxIterations: 4, perRegion: 1 },
  });
  assert.ok(out.artifact.placements.every((p) => p.block === "minecraft:stone_bricks"), "rolled back to the original blocks");
  assert.equal(out.locked.length, 0, "nothing locked");
});

// --- ME-additions / schema --------------------------------------------------

test("ME-additions: an addition is committed to the log ONLY when the correction stashes", async () => {
  const art = baseArtifact();
  // The swap target is out of range → applyFormEdit rejects it → nothing applied → nothing stashed →
  // the addition must NOT leak into the log (it is only committed on a real stashed change).
  const editor = makeMaterialEditor({
    critic: materialCritic(),
    policy: { mapPalette: ["minecraft:stone_bricks"] },
    propose: async () => ({
      swaps: [{ target: 99, block: "minecraft:cobblestone" }], // out of range
      additions: [{ block: "minecraft:cobblestone", conceptMaterial: "cobble", where: "corner" }],
    }),
  });
  const R = selectRegion(art, REGION);
  await editor.diagnose(art, R, null);
  assert.equal(editor.stash.size, 0);
  assert.equal(editor.additions.length, 0, "no stash → no addition committed to the log");
});

test("ME-schema: route + schema tags are stable; critic is required", () => {
  assert.equal(MATERIAL_EDIT_ROUTE, "material-correct");
  assert.equal(MATERIAL_EDIT_SCHEMA, "material-edit/v1");
  assert.throws(() => makeMaterialEditor({}), /critic.*required/);
});

// --- ME-imports -------------------------------------------------------------

test("ME-imports: material-edit.mjs's top-level imports pull no GL/SDK; the live leaf is lazy", () => {
  const src = readFileSync(here("./material-edit.mjs"), "utf8");
  const specs = [];
  const fromRe = /^\s*import\b[^]*?\bfrom\s*["']([^"']+)["']/gm;
  let m;
  while ((m = fromRe.exec(src)) !== null) specs.push(m[1]);
  const DENY = [/render/, /world/, /prismarine/, /headless/, /\bgl\b/, /child_process/, /baml/, /sdk-binding/];
  for (const s of specs) {
    for (const re of DENY) assert.ok(!re.test(s), `top-level import "${s}" must be lazy (matched ${re})`);
  }
  assert.ok(/await import\(\s*["']node:child_process/.test(src), "defaultProposeCorrection lazy-spawns the bridge");
});
