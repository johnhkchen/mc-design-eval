// Reuse-boundary guard for the staged sculptor (T-029-01, story S-029, epic E-11) — AC #2.
//
// LOAD-BEARING RULE: the only FORM dependency of the staged loop is `MassingSource`. The middle passes
// (material-noise, relief) and the bookends (review, compile) must carry NO concept-grid / image-pipeline
// import — so a GLB voxelizer that emits the same `{width, height, occupied()}` contract is a drop-in (the
// E-09 reuse hook). `conceptGridSource` (in massing.mjs) is the SINGLE concept-grid-aware function; the
// grid's specifics (`{grid, n, m}`, null-means-air, top-down rows) live there and nowhere else.
//
// Enforced two ways, mirroring src/color/reuse-boundary.test.mjs:
//   1. STATIC scan of each module's import specifiers against a concept-grid denylist.
//   2. FUNCTIONAL proof: a literal MassingSource (no grid array) runs the whole loop and compiles to a
//      valid DesignArtifact — with NO concept-grid import in this test's own module graph.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { stagedSculpt } from "./staged-loop.mjs";
import { compileRelief } from "./relief.mjs";
import { parseArtifact } from "../artifact.mjs";

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));

/** Extract every module specifier: `import … from "X"`, bare `import "X"`, dynamic `import("X")`. */
function importSpecifiers(src) {
  const specs = [];
  const fromRe = /import\b[^]*?\bfrom\s*["']([^"']+)["']/g;
  const bareRe = /import\s*["']([^"']+)["']/g;
  const dynRe = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
  for (const re of [fromRe, bareRe, dynRe]) {
    let m;
    while ((m = re.exec(src)) !== null) specs.push(m[1]);
  }
  return specs;
}

// Concept-grid / image-pipeline modules the middle/review stages must never import.
const CONCEPT_GRID_DENYLIST = [
  /image-grid/,
  /palette-extract/,
  /nano-banana/,
  /\bexpand\.mjs$/,
  /image-to-grid/,
  /\bbriefs\.mjs$/,
];

// The middle passes + bookends + spine — everything DOWNSTREAM of the MassingSource seam.
const MIDDLE_AND_REVIEW = [
  "./material.mjs",
  "./relief.mjs",
  "./review.mjs",
  "./compile.mjs",
  "./orchestrator.mjs",
  "./build-state.mjs",
  "./staged-loop.mjs",
];

// --- 1. static scan: no concept-grid import in the middle/review/spine ---------

test("middle/review/spine modules import no concept-grid module", () => {
  for (const rel of MIDDLE_AND_REVIEW) {
    const specs = importSpecifiers(readFileSync(here(rel), "utf8"));
    for (const spec of specs) {
      for (const deny of CONCEPT_GRID_DENYLIST) {
        assert.ok(
          !deny.test(spec),
          `${rel} must not import a concept-grid module; found "${spec}" (matches ${deny})`,
        );
      }
    }
  }
});

test("geometry + spine modules are color-engine-free; material's only cross-dir import is the engine", () => {
  // relief/compile/orchestrator/build-state/staged-loop are geometry/spine — no ../color import.
  for (const rel of ["./relief.mjs", "./compile.mjs", "./orchestrator.mjs", "./build-state.mjs", "./staged-loop.mjs"]) {
    const specs = importSpecifiers(readFileSync(here(rel), "utf8"));
    assert.ok(!specs.some((s) => s.includes("../color/")), `${rel} must not import the color engine`);
  }
  // material legitimately consumes the PORTABLE engine + table — and ONLY those, under ../color/.
  const matSpecs = importSpecifiers(readFileSync(here("./material.mjs"), "utf8"));
  const matColor = matSpecs.filter((s) => s.startsWith("../color/"));
  assert.deepEqual(matColor.sort(), ["../color/block-table.mjs", "../color/cielab.mjs"]);
});

// --- the MassingSource seam: conceptGridSource is the SOLE grid reader ---------

test("only massing.mjs reads the concept-grid shape; middle/review never touch a grid", () => {
  // massing.mjs is where the grid's `{grid, n, m}` destructuring lives (conceptGridSource).
  const massingSrc = readFileSync(here("./massing.mjs"), "utf8");
  assert.ok(/conceptGridSource/.test(massingSrc), "conceptGridSource lives in massing.mjs");
  assert.ok(/const\s*\{\s*grid\s*,\s*n\s*,\s*m\s*\}/.test(massingSrc), "it destructures {grid, n, m}");

  // the downstream stages reference no grid/gridResult — they see only MassingSource / build-state.
  for (const rel of ["./material.mjs", "./relief.mjs", "./review.mjs"]) {
    const src = readFileSync(here(rel), "utf8");
    assert.ok(!/gridResult|\.grid\b|conceptGrid/.test(src), `${rel} must not reference a concept grid`);
  }
});

// --- 2. functional proof: a GRIDLESS source runs the whole loop ----------------

test("a literal MassingSource (no grid) flows massing→material→relief→artifact", () => {
  // The exact shape a GLB voxelizer would emit: width/height + an occupied() generator. NO grid array,
  // NO image-grid import anywhere in this test's graph — yet the full loop runs and validates.
  const source = {
    width: 3,
    height: 4,
    *occupied() {
      for (let y = 0; y < 4; y++) for (let x = 0; x < 3; x++) yield { x, y };
    },
  };
  const intent = { relief: { features: [{ type: "recess", region: [[1, 1]] }] } };
  const { state, metrics, baseline } = stagedSculpt(source, intent);

  assert.deepEqual([...state.locked].sort(), ["material", "occupied", "relief"]);
  assert.ok(metrics.variance > baseline.variance, "less-flat than the massing-only baseline");
  assert.ok(parseArtifact(compileRelief(state)).ok, "the gridless loop compiles to a valid DesignArtifact");
});
