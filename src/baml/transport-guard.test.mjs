// Transport + judge-isolation guards (T-129-01, story S-129, epic E-32). Executable proofs of
// the ticket's two structural constraints, so they cannot rot into one-off shell output:
//   AC2 — transport rides the `claude -p` subscription shim, never metered API keys: the bridge
//         renders and parses but never transports; the metered key never appears on the .mjs
//         live path; the render-only dummy-key guard is present.
//   AC3 — the frozen judge is instrument surface (E-32 Rule 2): its path carries no BAML
//         dependency, today and from now on.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

function* walk(dir, exts) {
  for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const rel = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "fixtures") continue;
      yield* walk(rel, exts);
    } else if (exts.some((x) => e.name.endsWith(x))) {
      yield rel;
    }
  }
}

/** The file's import surface only — comments and prose never count. */
const importLines = (src) =>
  src.split("\n").filter((l) => /^\s*import\b|\brequire\(|\bawait import\(/.test(l)).join("\n");

// ---------------------------------------------------------------- AC2: the transport constraint

test("TG1 the bridge renders and parses but NEVER transports", () => {
  const src = read("src/baml/bridge.mts");
  assert.match(src, /baml-render-only/, "the render-only dummy-key guard must be present");
  assert.match(src, /delete process\.env\.ANTHROPIC_API_KEY/, "the dummy key must be deleted after render");
  assert.doesNotMatch(importLines(src), /sdk-binding|model-tier/, "the bridge must not import transport");
  assert.doesNotMatch(src, /\bspawn\s*\(/, "the bridge must not spawn transport processes");
  // b.request.* and b.parse.* only — a bare `b.Fn(...)` is a LIVE metered call through the BAML client
  const code = src.split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n");
  assert.doesNotMatch(code, /\bb\.(?!request\.|parse\.)[A-Za-z]/, "no live BAML client invocation");
});

test("TG2 the metered key never enters the .mjs live path", () => {
  const offenders = [];
  for (const dir of ["src", "benchmarks", "scripts"]) {
    for (const rel of walk(dir, [".mjs"])) {
      if (rel.endsWith(".test.mjs")) continue; // source-guard tests name the token to ban it
      if (read(rel).includes("ANTHROPIC_API_KEY")) offenders.push(rel);
    }
  }
  assert.deepEqual(offenders, [], `metered-key token on the .mjs path: ${offenders.join(", ")}`);
});

test("TG3 baml_client importers are exactly the pinned set (one new bridge; facade-era grandfathered)", () => {
  const importers = [];
  for (const dir of ["src", "benchmarks", "scripts"]) {
    for (const rel of walk(dir, [".mjs", ".mts"])) {
      if (importLines(read(rel)).includes("baml_client")) importers.push(rel);
    }
  }
  assert.deepEqual(importers.sort(), [
    "benchmarks/sculpture/baml-concept.mts",
    "benchmarks/temple-facade/baml-build.mts",
    "benchmarks/temple-facade/baml-concept.mts",
    "benchmarks/temple-facade/baml-judge.mts",
    "src/baml/bridge.mts",
    "src/form/baml-material-map.mts",
    "src/revise/baml-material-correct.mts",
    "src/revise/baml-revise.mts",
    "src/sculptor/baml-review.mts",
  ], "a new baml_client importer must be a deliberate, reviewed decision");
});

// ---------------------------------------------------------------- AC3: the frozen judge is BAML-free

const JUDGE_PATH = [
  "src/form/multi-angle-gate.mjs",
  "src/form/judge-reply.mjs",
  "src/form/resemblance.mjs",
  "benchmarks/sculpture/multi-angle-gate.mjs",
];

test("TG4 the judge path has no BAML dependency (E-32 Rule 2)", () => {
  for (const rel of JUDGE_PATH) {
    const src = read(rel);
    assert.ok(!/baml/i.test(src), `${rel} must not reference baml (frozen instrument surface)`);
  }
});

test("TG5 no facade-era judge function bleeds into the new BAML sources", () => {
  for (const rel of ["recognition.baml", "critique.baml", "vernacular.baml", "decompose.baml", "formation.baml"]) {
    const src = read(join("baml_src", rel));
    assert.ok(!src.includes("JudgeFacade") && !/same object|drifted|different object/.test(src),
      `${rel} must not carry judge vocabulary`);
  }
});
