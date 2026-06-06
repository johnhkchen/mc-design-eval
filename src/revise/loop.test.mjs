// The cage proof for the deterministic revision loop (T-045-01, story S-045, epic E-15).
//
// PURE — no GL/model/network, auto-collected by `src/**/*.test.mjs`. Drives `reviseLoop` with INJECTED
// synthetic seams (a deterministic score + the default model-free diagnose) so the whole cage is proven
// without loading GL or calling a model. Groups: LA convergence, LB accept-gate/rollback, LC spatial
// lock, LD determinism, LE no-GL import boundary, LF trace contract.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { reviseLoop, REVISE_SCHEMA, LOOP_DEFAULTS } from "./loop.mjs";
import { selectRegion, subBoundsOf } from "./region.mjs";
import { boxesIntersect } from "./tweak.mjs";
import { expandArtifact, voxelKey } from "../expand.mjs";

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

/** A synthetic FORM score that RELIEF (a +Z move) strictly improves: the total Z over all voxels. */
const zSum = (artifact) => expandArtifact(artifact).reduce((s, v) => s + v.pos[2], 0);

/** Three disjoint flat columns at z=0 (each its own region) + a far anchor giving Z headroom to 3. */
function columnsArtifact() {
  return artifactWith([
    { op: "fill", from: [0, 0, 0], to: [0, 2, 0], block: "minecraft:stone" },
    { op: "fill", from: [5, 0, 0], to: [5, 2, 0], block: "minecraft:stone" },
    { op: "fill", from: [10, 0, 0], to: [10, 2, 0], block: "minecraft:stone" },
    { op: "voxel", pos: [20, 0, 3], block: "minecraft:stone" }, // anchor: extends overall Z to 3
  ]);
}
const COLUMN_REGIONS = [
  { bbox: { min: [0, 0, 0], max: [0, 2, 3] } },
  { bbox: { min: [5, 0, 0], max: [5, 2, 3] } },
  { bbox: { min: [10, 0, 0], max: [10, 2, 3] } },
];

// --- LA: convergence --------------------------------------------------------

test("LA: the loop converges within budget and improves the score", async () => {
  const input = columnsArtifact();
  const before = zSum(input);
  const out = await reviseLoop(input, {
    regions: COLUMN_REGIONS,
    score: (a) => zSum(a), // relief +1 raises this; the loop hill-climbs it
    budget: { maxIterations: 24, perRegion: 2 },
  });
  assert.equal(out.schema, REVISE_SCHEMA);
  assert.equal(out.converged, true, "terminated by exhausting regions, not the cap");
  assert.ok(out.iterations <= COLUMN_REGIONS.length * 2, "bounded by regions × perRegion");
  assert.equal(out.iterations, 3, "each region accepted on its first attempt");
  assert.ok(zSum(out.artifact) > before, "form score strictly improved");
  assert.equal(out.trace.filter((e) => e.accepted).length, 3, "one accept per region");
  assert.equal(out.locked.length, 3, "each accepted region locked");
});

// --- LB: the accept-gate rolls back a non-improving tweak -------------------

test("LB: a non-improving score → every attempt rolled back, artifact UNCHANGED", async () => {
  const input = columnsArtifact();
  const out = await reviseLoop(input, {
    regions: COLUMN_REGIONS,
    score: () => 7, // constant — no tweak can ever improve it
    budget: { maxIterations: 24, perRegion: 2 },
  });
  assert.deepEqual(out.artifact, input, "the artifact is byte-for-byte the input (full rollback)");
  assert.equal(out.locked.length, 0, "nothing locked");
  assert.ok(out.trace.length > 0 && out.trace.every((e) => e.accepted === false), "no accepts");
  assert.ok(out.trace.filter((e) => e.reason === "rolled-back").length >= 3, "rollbacks recorded");
});

// --- LC: an accepted region is never re-edited (the spatial lock) ----------

test("LC: a region overlapping an accepted one is SKIPPED; out-of-region cells untouched", async () => {
  const input = artifactWith([
    { op: "fill", from: [0, 0, 0], to: [2, 2, 0], block: "minecraft:stone" }, // region A's content
    { op: "voxel", pos: [20, 0, 3], block: "minecraft:stone" }, // anchor (out of A and B)
  ]);
  const specA = { bbox: { min: [0, 0, 0], max: [2, 2, 3] } };
  const specB = { bbox: { min: [1, 1, 0], max: [3, 3, 3] } }; // overlaps A in x[1,2] y[1,2]
  const out = await reviseLoop(input, {
    regions: [specA, specB],
    score: (a) => zSum(a),
    budget: { maxIterations: 24, perRegion: 2 },
  });

  // A accepted, B skipped as locked-overlap
  assert.equal(out.trace[0].accepted, true);
  assert.equal(out.trace[0].reason, "accepted");
  const bEntry = out.trace.find((e) => e.region === specB);
  assert.equal(bEntry.reason, "locked-overlap");
  assert.equal(bEntry.accepted, false);

  // the lock's bounds really do overlap (sanity on the skip condition)
  const subA = subBoundsOf(selectRegion(input, specA));
  const subB = subBoundsOf(selectRegion(input, specB));
  assert.ok(boxesIntersect(subA, subB));

  // INVARIANT at loop scope: every cell OUTSIDE A's bounds is byte-identical before/after
  const beforeMap = new Map(expandArtifact(input).map((v) => [voxelKey(v.pos), v.block]));
  const afterMap = new Map(expandArtifact(out.artifact).map((v) => [voxelKey(v.pos), v.block]));
  const inA = (pos) => pos.every((c, i) => c >= subA.min[i] && c <= subA.max[i]);
  for (const [key, block] of beforeMap) {
    const pos = key.split(",").map(Number);
    if (!inA(pos)) assert.equal(afterMap.get(key), block, `outside-A cell ${key} changed`);
  }
  for (const key of afterMap.keys()) {
    const pos = key.split(",").map(Number);
    if (!inA(pos)) assert.ok(beforeMap.has(key), `outside-A cell ${key} appeared`);
  }
});

// --- LD: determinism --------------------------------------------------------

test("LD: same input + same seams → identical trace and artifact", async () => {
  const run = () =>
    reviseLoop(columnsArtifact(), {
      regions: COLUMN_REGIONS,
      score: (a) => zSum(a),
      budget: { maxIterations: 24, perRegion: 2 },
    });
  const a = await run();
  const b = await run();
  assert.deepEqual(a.trace, b.trace, "traces identical");
  assert.deepEqual(a.artifact, b.artifact, "artifacts identical");
  assert.equal(a.iterations, b.iterations);
});

// --- LE: the pure loop loads no GL (static import scan) ---------------------

test("LE: loop.mjs's top-level imports pull no GL/render; liveFormScore is lazy", () => {
  const src = readFileSync(here("./loop.mjs"), "utf8");
  const specs = [];
  const fromRe = /^\s*import\b[^]*?\bfrom\s*["']([^"']+)["']/gm;
  const bareRe = /^\s*import\s*["']([^"']+)["']/gm;
  for (const re of [fromRe, bareRe]) {
    let m;
    while ((m = re.exec(src)) !== null) specs.push(m[1]);
  }
  const DENY = [/render/, /world/, /prismarine/, /\bthree\b/, /headless/, /\bgl\b/, /camera/, /viewer/];
  for (const s of specs) {
    for (const re of DENY) assert.ok(!re.test(s), `top-level import "${s}" must be lazy (matched ${re})`);
  }
  // the render/form stack must be reached via dynamic import (the live score seam)
  assert.ok(/await import\(\s*["'][^"']*form-fidelity\.mjs/.test(src), "liveFormScore lazy-imports the form metric");
  assert.ok(/await import\(\s*["']\.\/region\.mjs/.test(src), "liveFormScore lazy-imports observeRegion");
});

// --- LF: the trace contract -------------------------------------------------

test("LF: accepted & rolled-back entries carry the required fields", async () => {
  const accepted = await reviseLoop(columnsArtifact(), {
    regions: [COLUMN_REGIONS[0]],
    score: (a) => zSum(a),
    budget: { maxIterations: 24, perRegion: 2 },
  });
  const e = accepted.trace.find((t) => t.accepted);
  for (const k of ["iteration", "region", "subBounds", "defect", "route", "tweak", "scoreBefore", "scoreAfter", "accepted"]) {
    assert.ok(k in e, `accepted entry has ${k}`);
  }

  const rejected = await reviseLoop(columnsArtifact(), {
    regions: [COLUMN_REGIONS[0]],
    score: () => 0,
    budget: { maxIterations: 24, perRegion: 1 },
  });
  const r = rejected.trace[0];
  assert.equal(r.accepted, false);
  assert.equal(r.reason, "rolled-back");
  assert.equal(typeof r.scoreBefore, "number");
  assert.equal(typeof r.scoreAfter, "number");
});

// --- LG: defaults exported --------------------------------------------------

test("LG: LOOP_DEFAULTS is the documented budget", () => {
  assert.equal(LOOP_DEFAULTS.perRegion, 2);
  assert.ok(LOOP_DEFAULTS.maxIterations >= 1);
});
