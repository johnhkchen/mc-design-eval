// Compile spine tests (T-024-01) — build state → DesignArtifact, proven against the REAL AJV gate
// (src/artifact.mjs). This is the round-trip AC: the spine's output must pass the live validator so
// render/judge/export stay unchanged.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createBuildState, draftState, lockFields } from "./build-state.mjs";
import { toDesignArtifact, COMPILE_DEFAULTS } from "./compile.mjs";
import { parseArtifact, assertArtifact } from "../artifact.mjs";
import { PHASE1_MODEL_ID } from "../config.mjs";

/** A small hand-built facade: three occupied cells — one materialed+inset, one materialed+pop,
 *  one occupied but un-materialed (exercises defaultBlock). Locks mimic a massing→material→relief
 *  chain so the round-trip uses a realistically locked state. */
function facade() {
  const d = draftState(createBuildState({ width: 3, height: 2 }));
  d.set(0, 0, { occupied: true, material: "minecraft:stone_bricks", relief: -1 });
  d.set(1, 0, { occupied: true, material: "minecraft:iron_block", relief: 1 });
  d.set(2, 1, { occupied: true }); // un-materialed → defaultBlock
  let s = d.commit();
  s = lockFields(s, "massing", ["occupied"]);
  s = lockFields(s, "material", ["material"]);
  s = lockFields(s, "relief", ["relief"]);
  return s;
}

test("compiled artifact passes the live AJV gate (round-trip)", () => {
  const artifact = toDesignArtifact(facade());
  const result = parseArtifact(artifact);
  assert.ok(result.ok, `expected valid artifact, got: ${result.ok ? "" : result.errors.join("\n")}`);
  assert.doesNotThrow(() => assertArtifact(artifact));
});

test("each occupied cell → one voxel placement with Z carried from relief", () => {
  const artifact = toDesignArtifact(facade());
  assert.equal(artifact.placements.length, 3);
  for (const p of artifact.placements) assert.equal(p.op, "voxel");
  const byPos = new Map(artifact.placements.map((p) => [p.pos.join(","), p]));
  assert.equal(byPos.get("0,0,-1").block, "minecraft:stone_bricks"); // negative inset is legal
  assert.equal(byPos.get("1,0,1").block, "minecraft:iron_block"); // pop +1
  assert.equal(byPos.get("2,1,0").block, COMPILE_DEFAULTS.defaultBlock); // un-materialed → default
});

test("placements are sorted by (y, x) for deterministic output", () => {
  const artifact = toDesignArtifact(facade());
  const order = artifact.placements.map((p) => [p.pos[1], p.pos[0]]);
  const sorted = [...order].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  assert.deepEqual(order, sorted);
});

test("palette.manifest is the unique, sorted set of blocks placed", () => {
  const artifact = toDesignArtifact(facade());
  assert.deepEqual(artifact.palette.manifest, [
    "minecraft:iron_block",
    "minecraft:stone", // the defaultBlock for the un-materialed cell
    "minecraft:stone_bricks",
  ]);
  // unique + non-empty (schema: uniqueItems, minItems 1)
  assert.equal(new Set(artifact.palette.manifest).size, artifact.palette.manifest.length);
});

test("defaults: model_id is the pinned config id; opts override metadata/style", () => {
  const def = toDesignArtifact(facade());
  assert.equal(def.metadata.model_id, PHASE1_MODEL_ID);
  assert.equal(def.style.name, "massing");

  const over = toDesignArtifact(facade(), {
    metadata: { trial_id: "custom-1", seed: 7 },
    style: { name: "industrial", rationale: "exposed structure" },
    palette_id: "industrial",
  });
  assert.equal(over.metadata.trial_id, "custom-1");
  assert.equal(over.metadata.seed, 7);
  assert.equal(over.metadata.model_id, PHASE1_MODEL_ID); // unspecified field keeps default
  assert.equal(over.style.name, "industrial");
  assert.equal(over.palette.palette_id, "industrial");
  assert.ok(parseArtifact(over).ok);
});

test("a custom defaultBlock fills un-materialed cells", () => {
  const artifact = toDesignArtifact(facade(), { defaultBlock: "minecraft:smooth_stone" });
  const cell = artifact.placements.find((p) => p.pos.join(",") === "2,1,0");
  assert.equal(cell.block, "minecraft:smooth_stone");
});

test("an empty (no occupied cells) state is rejected (schema needs ≥1 placement)", () => {
  assert.throws(() => toDesignArtifact(createBuildState({ width: 2, height: 2 })), /no occupied cells/);
});
