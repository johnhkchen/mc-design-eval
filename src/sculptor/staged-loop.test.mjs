// Staged-sculptor consolidation tests (T-029-01) — the FULL wired loop end-to-end (AC #1).
//
// Three tiers, mirroring the spine's GL/model-free discipline:
//   1. PURE (always run): the lock chain, the less-flat metric, the AJV round-trip, and the routing with
//      a STUBBED diagnose — no GL, no BAML, no model.
//   2. The functional boundary half of AC #2 lives here too: a GRIDLESS MassingSource (a literal
//      `{width, height, occupied()}`, the GLB-shaped drop-in) flows through the whole loop unchanged.
//   3. GL-GATED render (AC #1 "renders"): render the COMPOSED artifact for real, skipping if no GL.

import test from "node:test";
import assert from "node:assert/strict";

import { stagedSculpt, runStagedLoop, lessFlat } from "./staged-loop.mjs";
import { conceptGridSource } from "./massing.mjs";
import { compileRelief } from "./relief.mjs";
import { parseArtifact } from "../artifact.mjs";

// --- fixtures (no GL, no model) ------------------------------------------------

const O = "x"; // an occupied grid cell (any non-null marker); `null` is air

/** A hand-built `{grid, n, m}` (4 wide × 5 tall) fed through the REAL conceptGridSource adapter — the
 *  concept-grid path exercised without a JPEG decode or an image-grid import. Two air notches make it a
 *  genuine silhouette (not a full rectangle). Row 0 is the TOP (flipY maps it to the highest build y). */
function tinyGrid() {
  const grid = [
    [null, O, O, null], // top: a gabled notch at the corners
    [O, O, O, O],
    [O, O, O, O],
    [O, O, O, O],
    [O, O, O, O], // bottom (becomes y=0 after flip)
  ];
  return conceptGridSource({ grid, n: 4, m: 5 });
}

/** A literal MassingSource with NO grid array anywhere — the GLB-shaped drop-in. The middle/review stages
 *  never learn where the occupancy came from (the AC #2 functional proof, exercised through the loop). */
function gridlessSource() {
  return {
    width: 4,
    height: 5,
    *occupied() {
      for (let y = 0; y < 5; y++) for (let x = 0; x < 4; x++) yield { x, y };
    },
  };
}

/** An intent with one explicit relief feature (a window recess) so relief is non-trivial and a recessed
 *  voxel (z=-1) appears — proving recess-by-exclusion through the compile. */
const INTENT = {
  material: { palette: ["minecraft:stone_bricks"] },
  relief: { features: [{ type: "window", region: [[1, 2]] }] },
};

// --- the lock chain: massing → material → relief, all locked, in order ---------

test("stagedSculpt locks occupied, material, and relief in chain order", () => {
  const { state } = stagedSculpt(tinyGrid(), INTENT);
  assert.deepEqual([...state.locked].sort(), ["material", "occupied", "relief"]);
  assert.deepEqual(state.lockLog.map((l) => l.stage), ["massing", "material", "relief"]);
});

// --- the "less flat" metric (cite reliefMetrics — AC #1) -----------------------

test("the composed build is measurably less flat than massing-only (reliefMetrics)", () => {
  const { metrics, baseline } = stagedSculpt(tinyGrid(), INTENT);
  // massing-only baseline is all-flat: no relief signal anywhere.
  assert.equal(baseline.coverage, 0);
  assert.equal(baseline.variance, 0);
  assert.equal(baseline.range, 0);
  // the composed facade has non-zero relief coverage AND Z-variance.
  assert.ok(metrics.coverage > 0, `coverage ${metrics.coverage} > 0`);
  assert.ok(metrics.variance > 0, `variance ${metrics.variance} > 0`);
  assert.ok(metrics.range >= 2, `range ${metrics.range} spans recess(-1)..pop(+1)`);

  const cmp = lessFlat(baseline, metrics);
  assert.equal(cmp.isLessFlat, true);
  assert.ok(cmp.coverage > 0 && cmp.variance > 0);
});

// --- the AJV gate: the composed build is a valid DesignArtifact (AC #1) --------

test("compileRelief(composed) passes the live AJV gate and carries depth", () => {
  const { state } = stagedSculpt(tinyGrid(), INTENT);
  const artifact = compileRelief(state);

  const parsed = parseArtifact(artifact);
  assert.ok(parsed.ok, `valid artifact; errors: ${(parsed.errors || []).join("; ")}`);

  // material pass → a multi-block manifest (not the single massing gray).
  assert.ok(artifact.palette.manifest.length >= 2, `multi-block manifest (${artifact.palette.manifest})`);
  // relief pass → at least one recessed voxel at z=-1 (carved by exclusion) and one popped at z=+1.
  const zs = artifact.placements.map((p) => p.pos[2]);
  assert.ok(zs.includes(-1), "a recessed voxel sits at z=-1 (recess by exclusion)");
  assert.ok(zs.includes(1), "a popped voxel sits at z=+1 (cornice/feature)");
  // one placement per occupied cell — relief never adds a second voxel.
  assert.equal(artifact.placements.length, state.cells.size ? [...state.cells.values()].filter((c) => c.occupied).length : 0);
});

// --- the full loop with a STUBBED critic: the diagnosis is recorded (AC #1) -----

test("runStagedLoop records the critic diagnosis (flat on a textured+relieved build → relief)", async () => {
  // the build is textured AND relieved, so a `flat` defect disambiguates to `relief` (wants more depth),
  // never `material` (already textured).
  const stubRender = async () => ({ image: Buffer.from("png"), report: { path: "/tmp/x.png" } });
  const stubFlat = async () => [{ defect: "flat", where: "the wall" }];
  const out = await runStagedLoop(tinyGrid(), {
    brief: "a styled facade",
    intent: INTENT,
    render: stubRender,
    diagnose: stubFlat,
  });
  assert.deepEqual(out.diagnosis, [{ defect: "flat", where: "the wall", route: "relief" }]);
  assert.equal(out.comparison.isLessFlat, true);
  assert.ok(parseArtifact(out.artifact).ok, "the loop's compiled artifact is valid");
  assert.deepEqual(out.render, { path: "/tmp/x.png" });
});

test("runStagedLoop on a clean build yields an empty diagnosis", async () => {
  const stubRender = async () => ({ image: Buffer.from("png") });
  const stubClean = async () => [];
  const out = await runStagedLoop(tinyGrid(), { intent: INTENT, render: stubRender, diagnose: stubClean });
  assert.deepEqual(out.diagnosis, []);
  assert.equal(out.render, null);
});

// --- AC #2 functional half: a GRIDLESS source flows the same chain ------------

test("a gridless MassingSource produces the same locked chain (GLB drop-in)", () => {
  const { state, metrics } = stagedSculpt(gridlessSource(), INTENT);
  assert.deepEqual([...state.locked].sort(), ["material", "occupied", "relief"]);
  assert.ok(metrics.coverage > 0 && metrics.variance > 0, "less-flat holds with no grid in sight");
  assert.ok(parseArtifact(compileRelief(state)).ok, "gridless loop compiles to a valid artifact");
});

// --- AC #1 "renders": GL-gated live render of the COMPOSED artifact -----------

test("the composed loop renders to a valid PNG (GL-gated)", async (t) => {
  const { GL_AVAILABLE, GL_LOAD_ERROR } = await import("../../render/src/render-tool.mjs");
  if (!GL_AVAILABLE) {
    t.skip("headless GL unavailable: " + (GL_LOAD_ERROR && GL_LOAD_ERROR.message));
    return;
  }
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  const { fileURLToPath } = await import("node:url");
  const { existsSync, readFileSync } = await import("node:fs");

  const { state } = stagedSculpt(tinyGrid(), INTENT);
  const artifact = compileRelief(state);
  const outPath = fileURLToPath(new URL("../../render/out/test-staged-loop.png", import.meta.url));
  const report = await renderArtifact(artifact, { outPath, view: { width: 128, height: 128 } });

  assert.ok(existsSync(report.path), "a PNG was written");
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const buf = readFileSync(report.path);
  assert.ok(buf.subarray(0, 8).equals(PNG_SIG), "valid PNG signature");
  assert.ok(report.bytes > 2000, `non-trivial PNG (${report.bytes} bytes)`);
  assert.ok(report.placed >= 1, `voxels placed (${report.placed})`);
});
