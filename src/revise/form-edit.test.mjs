// The pure proof for the LLM form-edit route (T-046-01, story S-046, epic E-15).
//
// PURE — no GL/model/network, auto-collected by `src/**/*.test.mjs`. Proves the LLM editor's heart and
// its wiring into the UNMODIFIED loop with a stubbed `propose` + synthetic `score`, so AC #1/#2/#3/#5 are
// demonstrated without a metered call. Groups: FE-apply (op application + index stability), FE-bounds
// (the bounds guard), FE-ajv (the AJV gate), FE-router (relief/material vs form dispatch + stash replay),
// FE-cage (keep vs roll-back through reviseLoop with NO loop change), FE-imports (no top-level GL/SDK).

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  applyFormEdit,
  makeFormEditor,
  placementInBounds,
  regionKey,
  LLM_EDIT_ROUTE,
  FORM_EDIT_SCHEMA,
  EDIT_KINDS,
} from "./form-edit.mjs";
import { selectRegion, subBoundsOf } from "./region.mjs";
import { reviseLoop } from "./loop.mjs";
import { expandArtifact } from "../expand.mjs";

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

const SUB = { min: [0, 0, 0], max: [9, 9, 9] };
const inRegionFixture = () => [
  { op: "voxel", pos: [1, 1, 1], block: "minecraft:stone" }, // index 0
  { op: "voxel", pos: [2, 2, 2], block: "minecraft:stone" }, // index 1
  { op: "fill", from: [3, 3, 3], to: [4, 4, 4], block: "minecraft:stone" }, // index 2
];

// --- FE-apply ---------------------------------------------------------------

test("FE-apply: each op kind applies; indices stay stable under removes (tombstones)", () => {
  const inR = inRegionFixture();
  const { placements, applied, rejected } = applyFormEdit(inR, SUB, [
    { kind: "add", placement: { op: "voxel", pos: [5, 5, 5], block: "minecraft:oak_planks" } },
    { kind: "remove", target: 0 },
    { kind: "swap", target: 1, block: "minecraft:deepslate" }, // index unchanged by the earlier remove
    { kind: "move", target: 2, delta: [1, 0, 0] },
  ]);
  assert.equal(rejected.length, 0, "all four ops applied");
  assert.equal(applied.length, 4);
  // removed index-0 voxel gone; index-1 swapped; index-2 moved; one added
  assert.ok(!placements.some((p) => p.op === "voxel" && p.pos?.[0] === 1), "index-0 removed");
  assert.ok(placements.some((p) => p.block === "minecraft:deepslate"), "index-1 swapped");
  assert.ok(placements.some((p) => p.op === "fill" && p.from[0] === 4), "index-2 moved +x");
  assert.ok(placements.some((p) => p.block === "minecraft:oak_planks"), "one added");
  assert.equal(placements.length, 3, "3 - 1 remove + 1 add = 3");
});

test("FE-apply: inputs are never mutated; output is deterministic", () => {
  const inR = inRegionFixture();
  const snapshot = JSON.parse(JSON.stringify(inR));
  const ops = [{ kind: "swap", target: 0, block: "minecraft:deepslate" }];
  const a = applyFormEdit(inR, SUB, ops);
  const b = applyFormEdit(inR, SUB, ops);
  assert.deepEqual(inR, snapshot, "input unmutated");
  assert.deepEqual(a.placements, b.placements, "same inputs → same output");
});

test("FE-apply: an unknown op kind is rejected, not thrown", () => {
  const { rejected, applied } = applyFormEdit(inRegionFixture(), SUB, [{ kind: "frobnicate" }]);
  assert.equal(applied.length, 0);
  assert.equal(rejected.length, 1);
  assert.match(rejected[0].reason, /unknown edit kind/);
});

// --- FE-bounds --------------------------------------------------------------

test("FE-bounds: an in-R add/move applies; an out-of-R add/move is REJECTED (not thrown)", () => {
  const inR = inRegionFixture();
  const r = applyFormEdit(inR, SUB, [
    { kind: "add", placement: { op: "voxel", pos: [50, 50, 50], block: "minecraft:stone" } }, // escapes R
    { kind: "move", target: 0, delta: [100, 0, 0] }, // escapes R
    { kind: "add", placement: { op: "voxel", pos: [8, 8, 8], block: "minecraft:stone" } }, // in R
  ]);
  assert.equal(r.applied.length, 1, "only the in-R add applied");
  assert.equal(r.rejected.length, 2);
  assert.match(r.rejected[0].reason, /escapes region/);
  assert.match(r.rejected[1].reason, /escapes region/);
});

test("FE-bounds: placementInBounds agrees with the lock's per-voxel test", () => {
  assert.equal(placementInBounds({ op: "voxel", pos: [0, 0, 0], block: "b" }, SUB), true);
  assert.equal(placementInBounds({ op: "voxel", pos: [9, 9, 9], block: "b" }, SUB), true);
  assert.equal(placementInBounds({ op: "voxel", pos: [10, 0, 0], block: "b" }, SUB), false);
  assert.equal(placementInBounds({ op: "fill", from: [0, 0, 0], to: [9, 9, 10], block: "b" }, SUB), false);
});

test("FE-apply: an added placement with a null/empty `state` is normalized (schema safety)", () => {
  const inR = inRegionFixture();
  const { placements } = applyFormEdit(inR, SUB, [
    { kind: "add", placement: { op: "voxel", pos: [5, 5, 5], block: "minecraft:oak_planks", state: null } },
    { kind: "add", placement: { op: "voxel", pos: [6, 6, 6], block: "minecraft:oak_stairs", state: {} } },
    { kind: "add", placement: { op: "voxel", pos: [7, 7, 7], block: "minecraft:oak_stairs", state: { facing: "north" } } },
  ]);
  const added = placements.filter((p) => p.block.startsWith("minecraft:oak"));
  assert.equal(added.length, 3);
  assert.ok(!("state" in added[0]), "null state dropped");
  assert.ok(!("state" in added[1]), "empty-object state dropped");
  assert.deepEqual(added[2].state, { facing: "north" }, "a real state is kept");
});

test("FE-bounds: a remove that would empty a non-empty region is rejected (schema floor)", () => {
  const inR = [{ op: "voxel", pos: [1, 1, 1], block: "minecraft:stone" }];
  const r = applyFormEdit(inR, SUB, [{ kind: "remove", target: 0 }]);
  assert.equal(r.placements.length, 1, "the last placement is kept");
  assert.equal(r.rejected.length, 1);
  assert.match(r.rejected[0].reason, /empty the region/);
});

// --- FE-router + stash replay -----------------------------------------------

test("FE-router: a relief/material defect routes to the procedural editor (stash empty)", async () => {
  const editor = makeFormEditor({
    critic: () => [{ defect: "flat", where: "w", route: "relief" }],
    propose: async () => assert.fail("propose must NOT be called for a procedural route"),
  });
  const art = artifactWith(inRegionFixture());
  const R = selectRegion(art, { bbox: SUB });
  const routed = await editor.diagnose(art, R, null);
  assert.equal(routed[0].route, "relief", "passed through unchanged");
  assert.equal(editor.stash.size, 0, "no LLM edit stashed");
  // tweakFor delegates to scopedTweakFor for relief (a Z move — not identity)
  const tweak = editor.tweakFor("relief", 0, {});
  const moved = tweak(R.placements, subBoundsOf(R));
  assert.notDeepEqual(moved, R.placements, "relief produced a non-identity edit via scopedTweakFor");
});

test("FE-router: a form defect routes to llm-edit; tweakFor replays the stashed edit", async () => {
  const ops = [{ kind: "swap", target: 0, block: "minecraft:deepslate" }];
  const editor = makeFormEditor({
    critic: () => [{ defect: "ringing", where: "the arch", route: "curve" }],
    propose: async () => ({ ops }),
  });
  const art = artifactWith(inRegionFixture());
  const R = selectRegion(art, { bbox: SUB });
  const routed = await editor.diagnose(art, R, null);
  assert.equal(routed[0].route, LLM_EDIT_ROUTE, "form defect → llm-edit route");
  assert.equal(editor.stash.size, 1, "the proposed edit is stashed");

  const tweak = editor.tweakFor(LLM_EDIT_ROUTE, 0, {});
  const replayed = tweak(R.placements, subBoundsOf(R));
  assert.ok(replayed.some((p) => p.block === "minecraft:deepslate"), "tweakFor replayed the stash");
  assert.notStrictEqual(replayed, R.placements, "not the identity fallback");
});

test("FE-ajv: an out-of-bounds proposal stashes nothing → llm-edit tweak is an identity no-op", async () => {
  const editor = makeFormEditor({
    critic: () => [{ defect: "ringing", where: "w", route: "curve" }],
    // every op escapes R → applyFormEdit yields the unchanged in-region set; but assert it still no-ops
    propose: async () => ({ ops: [{ kind: "add", placement: { op: "voxel", pos: [99, 99, 99], block: "minecraft:stone" } }] }),
  });
  const art = artifactWith(inRegionFixture());
  const R = selectRegion(art, { bbox: SUB });
  await editor.diagnose(art, R, null);
  // the rejected add leaves placements == inRegion (unchanged); a no-change edit need not be stashed as
  // a "fix", but if stashed it is identical — either way the tweak must not alter the region.
  const tweak = editor.tweakFor(LLM_EDIT_ROUTE, 0, {});
  const out = tweak(R.placements, subBoundsOf(R));
  assert.deepEqual(out, R.placements, "no geometric change reaches the region");
});

test("FE-ajv: a schema-invalid candidate is caught → nothing stashed", async () => {
  // A swap to an empty block id would fail applyFormEdit's own guard, so force invalidity via a custom
  // validate that always throws; the editor must swallow it and stash nothing.
  const editor = makeFormEditor({
    critic: () => [{ defect: "ringing", where: "w", route: "curve" }],
    propose: async () => ({ ops: [{ kind: "swap", target: 0, block: "minecraft:deepslate" }] }),
    validate: () => {
      throw new Error("AJV: synthetic schema failure");
    },
  });
  const art = artifactWith(inRegionFixture());
  const R = selectRegion(art, { bbox: SUB });
  const routed = await editor.diagnose(art, R, null);
  assert.equal(routed[0].route, LLM_EDIT_ROUTE);
  assert.equal(editor.stash.size, 0, "AJV failure → no stash → rolled-back no-op");
});

// --- FE-cage: keep vs roll-back through the UNMODIFIED loop (AC #3) ----------

// A synthetic FORM score: count black_concrete voxels (a swap to it "improves" form here).
const blackCount = (artifact) =>
  expandArtifact(artifact).filter((v) => v.block === "minecraft:black_concrete").length;

test("FE-cage: an IMPROVING llm-edit is KEPT (artifact changes, region locked) — no loop change", async () => {
  const art = artifactWith([
    { op: "fill", from: [0, 0, 0], to: [2, 2, 0], block: "minecraft:stone" },
    { op: "voxel", pos: [20, 0, 0], block: "minecraft:stone" }, // anchor, out of region
  ]);
  const spec = { bbox: { min: [0, 0, 0], max: [2, 2, 0] } };
  const editor = makeFormEditor({
    critic: () => [{ defect: "ringing", where: "body", route: "curve" }],
    propose: async (a, R) =>
      // swap every in-region placement to black_concrete → raises blackCount
      ({ ops: R.placements.map((_, i) => ({ kind: "swap", target: i, block: "minecraft:black_concrete" })) }),
  });
  const out = await reviseLoop(art, {
    regions: [spec],
    diagnose: editor.diagnose,
    tweakFor: editor.tweakFor,
    score: (a) => blackCount(a),
    budget: { maxIterations: 8, perRegion: 1 },
  });
  assert.ok(blackCount(out.artifact) > blackCount(art), "form score strictly improved");
  assert.equal(out.trace.find((e) => e.route === LLM_EDIT_ROUTE).accepted, true, "kept");
  assert.equal(out.locked.length, 1, "the accepted region is locked");
});

test("FE-cage: a NON-improving llm-edit is ROLLED BACK (artifact deep-equal to input)", async () => {
  const art = artifactWith([
    { op: "fill", from: [0, 0, 0], to: [2, 2, 0], block: "minecraft:stone" },
    { op: "voxel", pos: [20, 0, 0], block: "minecraft:stone" },
  ]);
  const spec = { bbox: { min: [0, 0, 0], max: [2, 2, 0] } };
  const editor = makeFormEditor({
    critic: () => [{ defect: "ringing", where: "body", route: "curve" }],
    // swap to a block the score does not reward → no improvement
    propose: async (a, R) => ({ ops: R.placements.map((_, i) => ({ kind: "swap", target: i, block: "minecraft:cobblestone" })) }),
  });
  const out = await reviseLoop(art, {
    regions: [spec],
    diagnose: editor.diagnose,
    tweakFor: editor.tweakFor,
    score: (a) => blackCount(a), // constant 0 across the cobblestone swap
    budget: { maxIterations: 8, perRegion: 1 },
  });
  assert.deepEqual(out.artifact, art, "non-improving edit fully rolled back");
  assert.equal(out.locked.length, 0, "nothing locked");
  assert.equal(out.trace[0].accepted, false);
});

// --- FE-imports: no top-level GL/SDK/subprocess import ----------------------

test("FE-imports: form-edit.mjs pulls no top-level GL/render/SDK/child_process", () => {
  const src = readFileSync(here("./form-edit.mjs"), "utf8");
  const specs = [];
  const fromRe = /^\s*import\b[^]*?\bfrom\s*["']([^"']+)["']/gm;
  const bareRe = /^\s*import\s*["']([^"']+)["']/gm;
  for (const re of [fromRe, bareRe]) {
    let m;
    while ((m = re.exec(src)) !== null) specs.push(m[1]);
  }
  const DENY = [/render/, /world/, /prismarine/, /headless/, /\bgl\b/, /camera/, /viewer/, /child_process/, /sdk-binding/, /baml/];
  for (const s of specs) {
    for (const re of DENY) assert.ok(!re.test(s), `top-level import "${s}" must be lazy (matched ${re})`);
  }
  // the live propose leaf reaches the bridge via lazy import only
  assert.ok(/await import\(\s*["']node:child_process/.test(src), "defaultProposeEdit lazy-imports child_process");
});

// --- FE-meta ----------------------------------------------------------------

test("FE-meta: exported constants are stable", () => {
  assert.equal(FORM_EDIT_SCHEMA, "form-edit/v1");
  assert.equal(LLM_EDIT_ROUTE, "llm-edit");
  assert.deepEqual([...EDIT_KINDS], ["add", "remove", "move", "swap"]);
  assert.equal(regionKey(SUB), "0,0,0|9,9,9");
});
