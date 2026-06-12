// CONFORMANCE TRIPWIRE (T-128-01 AC2, story S-128, epic E-32) — the registry is the ONLY DOOR to
// a build technique (E-32 Rule 1), enforced structurally (the T-113 material-vocabulary pattern):
// this test reads consumer SOURCE from disk and fails the build if any file outside the allowlist
// imports a technique module directly.
//
//   1. The TECHNIQUE MODULES are the ten generator/op files every brush realizes through.
//   2. The ALLOWLIST is exact (file → the technique modules it may import, with a reason):
//      the door itself, intra-layer composition between technique modules, and the LEGACY
//      RUNNERS whose committed records pin their call chains byte-identically (rewiring them
//      through the registry would risk behavior the records pin, for zero gain — the AC's
//      "the registry wraps, it does not fork"). A pinned runner importing an ADDITIONAL
//      technique trips too: new capability enters through the registry, even in old files.
//   3. The sweep is CLOSED over the pipeline directories — a new file cannot join quietly.
//
// If this test is in your diff because it caught you: don't widen the allowlist — register a
// brush in src/pack/idiom-registry.mjs and realize through it. That is the whole contract.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const DOOR = "src/pack/idiom-registry.mjs";
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

/** The technique modules (the brush sources — research §3's inventory). */
const TECHNIQUES = [
  "roof-generate", "shaped-vocab", "idiom-constructs", "placement-grammar",
  "opening-dressing", "hollow-carve", "floorplan", "zone-fill", "face-paint", "surface-pattern",
  // E-32/T-132-01: the factory-grown saltcrag brushes join the guarded set
  "roof-thatch", "clinker", "limewash",
  // E-33/T-134-01: the steep-pitch brush joins the guarded set
  "roof-steep",
];

/** file → { modules, reason }. Exact: an extra technique import in an allowed file still trips. */
const ALLOWED = {
  // the door — every technique enters here
  [DOOR]: { modules: TECHNIQUES, reason: "the registry IS the door" },
  // intra-layer composition: technique modules consuming shared cores (one run/skin definition)
  "src/form/placement-grammar.mjs": { modules: ["zone-fill", "surface-pattern"], reason: "shares inRun/skin + ops with the fill (no refork)" },
  "src/view/surface-pattern.mjs": { modules: ["zone-fill"], reason: "consumes the canonical skin iterators" },
  "src/view/shell-integrity.mjs": { modules: ["surface-pattern"], reason: "spill-level reuse in closure repair" },
  "src/view/roof-swap.mjs": { modules: ["roof-generate"], reason: "roof family swap over the generator's records" },
  "src/view/roof-steep.mjs": { modules: ["roof-generate"], reason: "steep classes delegate to the ONE wedge/cap/sheet definition (T-134, no refork)" },
  "src/view/opening-reconstruct.mjs": { modules: ["shaped-vocab"], reason: "arch/head reconstruction over the shaped vocabulary" },
  "src/form/shaped-fit.mjs": { modules: ["shaped-vocab"], reason: "fit hypotheses realize shaped states" },
  "src/form/provision-generate.mjs": { modules: ["roof-generate"], reason: "generated-base chain emits roofs (T-115)" },
  "src/form/kit-presence.mjs": { modules: ["placement-grammar", "opening-dressing"], reason: "presence fixpoint reuses binding + dressing (T-100)" },
  "src/form/material-vocabulary.mjs": { modules: ["opening-dressing"], reason: "the vocabulary authority derives treatments (T-113)" },
  // the workshop spray appliers (T-126, committed replay seam — records pin the chain)
  "src/workshop/loop.mjs": { modules: ["face-paint"], reason: "spray-paint action applier (ledger-pinned)" },
  "src/workshop/replay.mjs": { modules: ["face-paint"], reason: "replay re-applies accepted paint byte-identically" },
  // legacy runners whose committed records pin their call chains (challenge/durable-skin/
  // workshop offline+repro asserts re-verify them — the T-128 migration proof)
  "benchmarks/sculpture/challenge-milestone.mjs": { modules: ["zone-fill"], reason: "record-pinned (challenge/*.json sha256)" },
  "benchmarks/sculpture/durable-skin.mjs": { modules: ["zone-fill", "face-paint", "surface-pattern"], reason: "record-pinned (durable-skin/*.json sha256)" },
  "benchmarks/sculpture/spray-paint.mjs": { modules: ["zone-fill", "face-paint"], reason: "record-pinned E-23 canvas" },
  "benchmarks/sculpture/styled-milestone.mjs": { modules: ["placement-grammar", "opening-dressing"], reason: "record-pinned styled chain (T-101)" },
  "benchmarks/sculpture/generated-milestone.mjs": { modules: ["roof-generate", "placement-grammar"], reason: "record-pinned generated chain (T-116)" },
  "benchmarks/sculpture/reconstructed-milestone.mjs": { modules: ["placement-grammar"], reason: "record-pinned reconstructed chain (T-106)" },
  "benchmarks/sculpture/placement-grammar.mjs": { modules: ["placement-grammar", "zone-fill", "face-paint"], reason: "record-pinned grammar runner (T-098)" },
  "benchmarks/sculpture/roof-program.mjs": { modules: ["roof-generate"], reason: "record-pinned roof program (T-104)" },
  "benchmarks/sculpture/shaped-vocabulary.mjs": { modules: ["shaped-vocab"], reason: "record-pinned shaped runner (T-105)" },
  "benchmarks/sculpture/dress-openings.mjs": { modules: ["opening-dressing"], reason: "record-pinned dressing evidence runner (T-105)" },
  "benchmarks/sculpture/kit-presence.mjs": { modules: ["opening-dressing"], reason: "record-pinned presence proof (T-100)" },
  "benchmarks/sculpture/multi-angle-gate.mjs": { modules: ["opening-dressing", "zone-fill"], reason: "record-pinned gate (T-093)" },
  "benchmarks/sculpture/hollow-cottage.mjs": { modules: ["hollow-carve"], reason: "record-pinned hollow runner (T-091)" },
  "benchmarks/sculpture/floorplan-cottage.mjs": { modules: ["hollow-carve", "floorplan"], reason: "record-pinned floorplan runner (T-092)" },
  "benchmarks/sculpture/hollow-cottage-milestone.mjs": { modules: ["hollow-carve", "floorplan", "face-paint"], reason: "record-pinned E-23 milestone" },
  "benchmarks/sculpture/shell-integrity.mjs": { modules: ["zone-fill"], reason: "record-pinned shell runner (T-094)" },
  "benchmarks/sculpture/surface-pattern.mjs": { modules: ["surface-pattern", "face-paint"], reason: "record-pinned pattern runner (T-087)" },
};

/** Closed sweep: every pipeline file is checked, enumerated or not. */
const SWEEP_DIRS = ["src/pack", "src/recognition", "src/workshop", "src/form", "src/view", "benchmarks/sculpture"];
const sweepFiles = () => SWEEP_DIRS.flatMap((dir) =>
  readdirSync(join(ROOT, dir))
    .filter((f) => f.endsWith(".mjs") && !f.endsWith(".test.mjs"))
    .map((f) => `${dir}/${f}`));

const importRe = (mod) => new RegExp(`from\\s+"[^"]*/${mod}\\.mjs"`);

test("brush door: technique imports appear ONLY through the allowlist (closed sweep)", () => {
  const violations = [];
  for (const rel of sweepFiles()) {
    const src = read(rel);
    const allowed = new Set(ALLOWED[rel]?.modules ?? []);
    for (const mod of TECHNIQUES) {
      if (rel === `src/view/${mod}.mjs` || rel === `src/form/${mod}.mjs`) continue; // the module itself
      if (allowed.has(mod)) continue;
      const m = src.match(importRe(mod));
      if (m) {
        const line = src.slice(0, m.index).split("\n").length;
        violations.push(`${rel}:${line} — imports ${mod}.mjs directly`);
      }
    }
  }
  assert.deepEqual(violations, [],
    `build techniques reached outside the registry door (register a brush instead):\n  ${violations.join("\n  ")}`);
});

test("brush door: the allowlist cannot rot (files exist, allowances are real imports)", () => {
  for (const [rel, { modules }] of Object.entries(ALLOWED)) {
    const src = read(rel); // throws if the file is gone
    for (const mod of modules) {
      assert.match(src, importRe(mod), `${rel} is allowed ${mod}.mjs but no longer imports it — prune the entry`);
    }
  }
});

test("brush door: the door exports the brush surface", () => {
  const door = read(DOOR);
  for (const name of ["BRUSH_REGISTRY", "brushNames", "getBrush", "IDIOM_REGISTRY", "getIdiom"]) {
    assert.match(door, new RegExp(`export (const|function) ${name}`), `door exports ${name}`);
  }
});
