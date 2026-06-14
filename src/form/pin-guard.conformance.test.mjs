// CONFORMANCE TRIPWIRE (T-119-01 AC2, story S-119, epic E-30) — the structural guarantee that
// committed pins stay behind the guard. Two T-116 incidents proved convention is not protection:
// the reskin re-cut re-rolled three styled verdict sets through an unguarded chain spawn, and a
// swallowed `--` let kit-extract live-sweep three committed kit pins. This test reads RUNNER
// SOURCE from disk (the T-107 lens-guard / T-113 vocabulary-sweep pattern) and fails the build if
// a pin-writing runner bypasses the guard:
//
//   1. every PIN-WRITING runner imports src/form/pin-guard.mjs;
//   2. none of them top-level-imports sdk-binding.mjs — the live seam stays a NAMED dynamic
//      import inside the one live function (judgeThroughPolicy / callModel), so judge-free modes
//      cannot reach it by accident;
//   3. the raw record-write idioms (`writeFile(recPath…`, `writeFile(join(OUT_DIR, …`, the named
//      artifact/raw paths) are BANNED in those runners — records go through guardedWriteRecord;
//      PNG/temp writes are not pins and stay raw;
//   4. component-skin's `distillMain` (the T-119-01 read-only distillation) contains no spawn —
//      judge-free by construction, one function to audit.
//
// If this test is in your diff because it caught you: route the write through guardedWriteRecord
// (and a preflight before any spend) — don't widen the ban list. That is the whole contract.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

/** The pin-writing runners (closed list — every runner that writes a committed record family:
 *  kit/, zone-map/, multi-angle/, styled/, challenge/, generated/, reconstructed/,
 *  component-skin/, durable-skin/). */
const PIN_WRITERS = [
  "benchmarks/sculpture/kit-extract.mjs",
  "benchmarks/sculpture/zone-map.mjs",
  "benchmarks/sculpture/multi-angle-gate.mjs",
  "benchmarks/sculpture/styled-milestone.mjs",
  "benchmarks/sculpture/challenge-milestone.mjs",
  "benchmarks/sculpture/generated-milestone.mjs",
  "benchmarks/sculpture/_archive/reconstructed-milestone.mjs",
  "benchmarks/sculpture/component-skin.mjs",
  "benchmarks/sculpture/durable-skin.mjs",
  "benchmarks/sculpture/registration-smoke.mjs", // T-120-01: registration-smoke.{json,md} beside the concept
  "benchmarks/sculpture/glb-smoke.mjs", // T-120-01: --record fixture records under glb/smoke/
];

/** Raw record-write idioms that must not reappear (each was converted at T-119-01). */
const FORBIDDEN_WRITES = [
  { name: "record write (writeFile(recPath…))", re: /writeFile\(\s*recPath/ },
  { name: "record dir write (writeFile(join(OUT_DIR, …))", re: /writeFile\(\s*join\(OUT_DIR\s*,/ },
  { name: "raw model-reply write (writeFile(rawPath…))", re: /writeFile\(\s*rawPath/ },
  { name: "artifact write (writeFile(artPath…))", re: /writeFile\(\s*artPath/ },
  { name: "chain artifact write (writeFile(paths.…))", re: /writeFile\(\s*paths\./ },
  { name: "HERE-relative record write (writeFile(join(HERE, …rel…))", re: /writeFile\(\s*join\(HERE\s*,/ },
];

test("every pin-writing runner exists and imports the pin-guard", () => {
  for (const rel of PIN_WRITERS) {
    assert.ok(existsSync(join(ROOT, rel)), `${rel} missing — update the conformance list with the rename`);
    const src = read(rel);
    assert.match(src, /from\s+["']\.\.\/\.\.\/src\/form\/pin-guard\.mjs["']/,
      `${rel} does not import src/form/pin-guard.mjs — committed records must go through guardedWriteRecord`);
  }
});

test("the live seam stays a named dynamic import: no pin-writer top-level-imports sdk-binding", () => {
  for (const rel of PIN_WRITERS) {
    const src = read(rel);
    assert.ok(!/^import\s[^;]*["'][^"']*sdk-binding\.mjs["']/m.test(src),
      `${rel} statically imports sdk-binding.mjs — the live seam must stay inside the named live function (dynamic import), or judge-free modes can reach it`);
  }
});

test("raw record-write idioms are banned in the pin-writers (records go through the guard)", () => {
  for (const rel of PIN_WRITERS) {
    const src = read(rel);
    for (const { name, re } of FORBIDDEN_WRITES) {
      assert.ok(!re.test(src), `${rel} carries a ${name} outside the pin-guard — route it through guardedWriteRecord`);
    }
  }
});

test("component-skin's distillMain is spawn-free (read-only distillation by construction)", () => {
  const src = read("benchmarks/sculpture/component-skin.mjs");
  const start = src.indexOf("async function distillMain");
  assert.ok(start >= 0, "distillMain missing from component-skin.mjs — the --distill-only mode is the T-119-01 contract");
  const end = src.indexOf("async function main", start);
  assert.ok(end > start, "could not delimit distillMain (main must follow it)");
  const body = src.slice(start, end);
  assert.ok(!/spawn/i.test(body), "distillMain reaches a spawn — the distillation path must never run the chain or the judge");
  assert.ok(body.includes("distillComponentSkin("), "distillMain must assemble through the pure distiller");
});

test("the preflights sit before the spend: kit-extract preflights before callModel, the gate before judging", () => {
  const kit = read("benchmarks/sculpture/kit-extract.mjs");
  assert.ok(kit.indexOf("preflightPins(") < kit.indexOf("await callModel("),
    "kit-extract must preflight its pins BEFORE the first live model call");
  const gate = read("benchmarks/sculpture/multi-angle-gate.mjs");
  assert.ok(gate.indexOf("preflightPins(") < gate.indexOf("await judgeThroughPolicy("),
    "multi-angle-gate must preflight its verdict pins BEFORE any judge call");
});
