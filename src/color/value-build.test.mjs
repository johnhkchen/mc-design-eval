// Unit suite for the value-matched build snap (T-041-01, story S-041, epic E-14).
//
// Offline, deterministic, no model/GL/network — auto-collected by the `src/**/*.test.mjs` glob.
// The realized palette is passed DIRECTLY as synthetic [{block,lab}] built from REAL table rows, so
// the snap target `to` ∈ table and `valueShift` are assertable without running the extractor or a
// render. Artifacts are minimal synthetic DesignArtifacts. Tests assert PROPERTIES (rewrite, manifest
// rebuild, value-shift, determinism, purity, schema-validity) and pin the deterministic snap targets.

import { test } from "node:test";
import assert from "node:assert/strict";
import { snapArtifactToValueTrue, VALUE_MATCHED_SCHEMA } from "./value-build.mjs";
import { loadBlockTable } from "./block-table.mjs";
import { assertArtifact } from "../artifact.mjs";

const TABLE = loadBlockTable();
const BY = new Map(TABLE.blocks.map((b) => [b.block, b]));
const TABLE_NAMES = new Set(TABLE.blocks.map((b) => b.block));
const lab = (name) => BY.get(name).lab;

/** A real cluster {block,lab} straight from the table (so `to` is guaranteed a real value-true id). */
const cluster = (name) => ({ block: name, lab: lab(name) });

/** A minimal schema-valid DesignArtifact whose placements use the given block ids. */
function artifactWith(blocks) {
  return {
    schema_version: "1.0.0",
    metadata: {
      trial_id: "t",
      prompting_method_id: "vconcept-sculpture.v1",
      model_id: "m",
      seed: 17,
      server_state_id: "s",
    },
    style: { name: "x", rationale: "y" },
    palette: { manifest: blocks.map((b) => `minecraft:${b}`) },
    placements: blocks.map((b, i) => ({ op: "voxel", pos: [i, 0, 0], block: `minecraft:${b}` })),
  };
}

// --- Group A: basic snap & rewrite ----------------------------------------

test("A: placements rewrite to the nearest realized block; manifest rebuilds; counts are right", () => {
  // model named three darks; realized palette offers a light + a mid neutral.
  const art = artifactWith(["gray_concrete", "stone_bricks", "andesite"]);
  const realized = [cluster("white_concrete"), cluster("stone")];
  const r = snapArtifactToValueTrue(art, realized);

  assert.equal(r.schema, VALUE_MATCHED_SCHEMA);
  // every placement is now a real, namespaced value-true block in the realized set
  const realizedNs = new Set(["minecraft:white_concrete", "minecraft:stone"]);
  for (const p of r.artifact.placements) assert.ok(realizedNs.has(p.block), `bad ${p.block}`);
  // manifest is the deduped, first-seen set of placed blocks
  assert.deepEqual(r.manifest, r.artifact.palette.manifest);
  assert.equal(new Set(r.manifest).size, r.manifest.length); // deduped
  assert.ok(r.manifest.every((b) => realizedNs.has(b)));
  assert.equal(r.changedPlacements, 3); // all three model names differ from their snap target
  assert.equal(r.swaps.length, 3); // one row per distinct name
});

// --- Group B: value-drift cure (the moai case) ----------------------------

test("B: a dark model block snaps UP to a lighter realized cluster (positive valueShift)", () => {
  const art = artifactWith(["gray_concrete"]); // L* ≈ 24 (very dark)
  // realized palette's only neutral is much lighter — the snap must lift the value
  const realized = [cluster("light_gray_concrete")];
  const r = snapArtifactToValueTrue(art, realized);
  const s = r.swaps[0];
  assert.equal(s.name, "gray_concrete");
  assert.equal(s.to, "light_gray_concrete"); // deterministic target
  assert.ok(s.valueShift > 0, `expected a positive lift, got ${s.valueShift}`);
  assert.equal(r.artifact.placements[0].block, "minecraft:light_gray_concrete");
});

// --- Group C: imaginary / non-cube model names ----------------------------

test("C: a non-table model name (honey_block) anchors via the S-039 card and snaps to a real block", () => {
  const art = artifactWith(["honey_block"]); // not a full-cube table block
  const realized = [cluster("hay_block"), cluster("oak_planks")];
  const r = snapArtifactToValueTrue(art, realized);
  const s = r.swaps[0];
  assert.equal(s.name, "honey_block");
  assert.ok(TABLE_NAMES.has(s.to), `${s.to} must be a real table block`);
  assert.ok(["hay_block", "oak_planks"].includes(s.to));
  assert.equal(r.artifact.placements[0].block, `minecraft:${s.to}`);
});

// --- Group D: realized-input flexibility ----------------------------------

test("D: [{block,lab}] and an extractPaletteFromImage-shaped result give identical snaps", () => {
  const art = artifactWith(["gray_concrete", "andesite"]);
  const arr = [cluster("stone"), cluster("white_concrete")];
  const extractShaped = {
    palette: [
      { block: "stone", repColor: { lab: lab("stone") }, coveragePct: 60 },
      { block: "white_concrete", repColor: { lab: lab("white_concrete") }, coveragePct: 40 },
    ],
  };
  const a = snapArtifactToValueTrue(art, arr);
  const b = snapArtifactToValueTrue(art, extractShaped);
  assert.deepEqual(a.artifact, b.artifact);
  assert.deepEqual(a.swaps, b.swaps);
});

// --- Group E: determinism & purity ----------------------------------------

test("E: deterministic, the input is never mutated, and methodId stamps only the clone", () => {
  const art = artifactWith(["gray_concrete", "andesite", "red_nether_bricks"]);
  const before = structuredClone(art);
  const realized = [cluster("stone"), cluster("netherrack"), cluster("white_concrete")];

  const r1 = snapArtifactToValueTrue(art, realized, { methodId: "vconcept-sculpture.v2" });
  const r2 = snapArtifactToValueTrue(art, realized, { methodId: "vconcept-sculpture.v2" });
  assert.deepEqual(r1, r2); // fully deterministic

  assert.deepEqual(art, before); // input artifact untouched
  assert.equal(r1.artifact.metadata.prompting_method_id, "vconcept-sculpture.v2"); // clone stamped
  assert.equal(art.metadata.prompting_method_id, "vconcept-sculpture.v1"); // original kept
});

// --- Group F: errors -------------------------------------------------------

test("F: empty realized palette and a name-less artifact both throw actionable errors", () => {
  const art = artifactWith(["gray_concrete"]);
  assert.throws(() => snapArtifactToValueTrue(art, []), /realized palette is empty/);
  assert.throws(() => snapArtifactToValueTrue(art, "nope"), /realized palette must be/);

  const empty = artifactWith(["gray_concrete"]);
  empty.placements = [];
  empty.palette.manifest = [];
  assert.throws(() => snapArtifactToValueTrue(empty, [cluster("stone")]), /no placement\/manifest block names/);
});

// --- Group G: value-honesty / shape contract ------------------------------

test("G: every swap row is numeric & real-id; the snapped artifact re-validates against the schema", () => {
  const art = artifactWith(["gray_concrete", "andesite", "honey_block"]);
  // include a line + box op to prove non-voxel placements are rewritten too
  art.placements.push({ op: "box", from: [0, 0, 0], to: [2, 2, 2], block: "minecraft:gray_concrete" });
  const realized = [cluster("stone"), cluster("hay_block"), cluster("deepslate_bricks")];
  const r = snapArtifactToValueTrue(art, realized);

  for (const s of r.swaps) {
    assert.equal(typeof s.toL, "number");
    assert.equal(typeof s.valueHonestL, "number");
    assert.equal(typeof s.valueShift, "number");
    assert.ok(TABLE_NAMES.has(s.to), `${s.to} ∈ table`);
    assert.ok(TABLE_NAMES.has(s.valueHonest), `${s.valueHonest} ∈ table`);
  }
  // the rewritten artifact must still pass the canonical AJV gate
  assert.doesNotThrow(() => assertArtifact(r.artifact));
  // the box placement was rewritten like the rest
  const boxp = r.artifact.placements.find((p) => p.op === "box");
  assert.match(boxp.block, /^minecraft:/);
  assert.ok(r.manifest.includes(boxp.block));
});
