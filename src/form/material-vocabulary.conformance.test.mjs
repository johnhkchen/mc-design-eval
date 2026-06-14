// CONFORMANCE TRIPWIRE (T-113-01 AC2, story S-113, epic E-29) — the structural guarantee, not a
// convention. The church settle non-convergence happened because stages composed the material
// vocabulary independently (the kit-blind class: T-095 → T-101 → T-110 → here). This test reads
// CONSUMER SOURCE from disk (the T-107 lens-guard pattern) and fails the build if any stage
// bypasses the authority:
//
//   1. the composition primitives — spreading a renaming map ({...substitution, ...overrides}),
//      shipping a policy (mapPolicy), building an own-vocabulary set inline — may appear ONLY in
//      src/form/material-vocabulary.mjs (plus the named, documented exceptions below);
//   2. every enumerated consumer must import the authority;
//   3. the sweep is CLOSED over the pipeline directories — a new file that re-composes fails with
//      its name, it cannot join quietly.
//
// If this test is in your diff because it caught you: don't widen an allowlist — compose through
// composeVocabulary/ownSetsOf and delete your local copy. That is the whole contract.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const AUTHORITY = "src/form/material-vocabulary.mjs";
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

/** The enumerated consumers (the six stages + their runners and gates). */
const CONSUMERS = [
  // construction chain
  "benchmarks/sculpture/durable-skin.mjs",        // buildSkin: zones, fill policy, band instruments
  "benchmarks/sculpture/placement-grammar.mjs",   // grammarStage + runGrammar + band evidence
  "benchmarks/sculpture/_archive/styled-milestone.mjs",    // dressing treatments + the settle fixpoint
  // gates
  "benchmarks/sculpture/multi-angle-gate.mjs",    // guarded shipped policy + presence treatments
  "benchmarks/sculpture/kit-presence.mjs",        // the presence proof runner
  "benchmarks/sculpture/dress-openings.mjs",      // the dressing evidence runner
  // pure cores that take a policy and must not re-compose it
  "src/form/kit-presence.mjs",                    // foreign/residue split → ownSetsOf
];

/** Consumers fed the COMPOSED object by an importer instead of importing the authority
 *  themselves — each pinned to the expression that proves the feed. (zone-fill/opening-dressing/
 *  placement-grammar cores consume caller-fed policy/sub/treatments; their callers above are the
 *  pinned edges.) */
const VOCAB_FED = {
  // the styled chain: buildSkin composes; the milestone consumes its vocabulary object for the
  // grammar opts, the dressing treatments, and the settle own-sets
  "benchmarks/sculpture/_archive/styled-milestone.mjs": /skin\.vocabulary/,
};
const MUST_IMPORT = CONSUMERS.filter((rel) => !(rel in VOCAB_FED));

/** Forbidden composition primitives. Each entry: name, regex, and the files allowed to carry it. */
const FORBIDDEN = [
  {
    name: "renaming-map spread ({...substitution, ...overrides})",
    re: /\{\s*\.\.\.\s*\(?\s*(substitution|kitOverrides|skinRec\.valueTrue)/,
    allowed: [AUTHORITY],
  },
  {
    name: "kit-overrides spread into a map (...x.overrides)",
    re: /\.\.\.\s*\(?\s*(kit|kitRec|kitRecord)\.overrides/,
    allowed: [AUTHORITY],
  },
  {
    name: "policy shipping (mapPolicy())",
    re: /\bmapPolicy\s*\(/,
    allowed: [],
  },
  {
    name: "inline own-vocabulary set (new Set([…dominant, …preserve]))",
    re: /new Set\(\s*\[[^\]]*\.dominant\b/,
    allowed: [
      AUTHORITY,
      // T-110's role-family census metric — the gate-side own-materials instrument; zone-fill is
      // a leaf core below the authority (importing it upward would invert the layer). Documented
      // exception, not an escape hatch.
      "src/view/zone-fill.mjs",
      // legacy E-23 spray-paint path: a CONSTANT registry policy (no map/kit/substitution is
      // composed) — outside the styled chain this ticket pins.
      "benchmarks/sculpture/spray-paint.mjs",
    ],
  },
];

/** The closure sweep: every pipeline file is checked, enumerated or not. */
const SWEEP_DIRS = ["src/form", "src/view", "benchmarks/sculpture"];
const sweepFiles = () => SWEEP_DIRS.flatMap((dir) =>
  readdirSync(join(ROOT, dir))
    .filter((f) => f.endsWith(".mjs") && !f.endsWith(".test.mjs"))
    .map((f) => `${dir}/${f}`));

test("conformance: composition primitives live ONLY in the authority (closed sweep)", () => {
  const violations = [];
  for (const rel of sweepFiles()) {
    const src = read(rel);
    for (const { name, re, allowed } of FORBIDDEN) {
      if (rel === AUTHORITY && allowed.includes(AUTHORITY)) continue;
      if (allowed.includes(rel)) continue;
      const m = src.match(re);
      if (m) {
        const line = src.slice(0, m.index).split("\n").length;
        violations.push(`${rel}:${line} — ${name}`);
      }
    }
  }
  assert.deepEqual(violations, [],
    `stages composing their own material vocabulary (consume composeVocabulary/ownSetsOf instead):\n  ${violations.join("\n  ")}`);
});

test("conformance: every enumerated consumer imports the authority or is provably vocab-fed", () => {
  const missing = MUST_IMPORT.filter((rel) => !read(rel).includes("material-vocabulary.mjs"));
  assert.deepEqual(missing, [],
    `consumers not importing the authority:\n  ${missing.join("\n  ")}`);
  for (const [rel, marker] of Object.entries(VOCAB_FED)) {
    assert.match(read(rel), marker, `${rel} must consume the composed vocabulary (${marker})`);
  }
});

test("conformance: the enumerated consumers exist (the list cannot rot silently)", () => {
  for (const rel of CONSUMERS) assert.ok(read(rel).length > 0, rel);
  // and the authority exports what the consumers are pinned to
  const authority = read(AUTHORITY);
  for (const name of ["composeVocabulary", "ownSetsOf", "MATERIAL_VOCABULARY_SCHEMA"]) {
    assert.match(authority, new RegExp(`export (function|const) ${name}`), `authority exports ${name}`);
  }
});
