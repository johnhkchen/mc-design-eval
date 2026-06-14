// TOPOLOGY CONFORMANCE (T-157-01, story S-157, epic E-37) — the suite that makes the wrong
// ORGANIZATIONAL move structurally impossible. Each guardrail proves it (a) is GREEN on the
// canonical repo and (b) goes RED on a synthetic violation. Same bar as
// pin-guard.conformance.test.mjs / isolation.test.mjs: read source from disk, pure decision over
// strings, precise patterns. If this test is in your diff because it caught you, fix the DRIFT
// (update STRUCTURE.md, archive what you replaced, keep one entry point) — don't loosen the check.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  STRUCTURE_REL,
  parseSpineModules, resolveModuleToken,
  chainStageModules, missingFromMap,
  findArchiveImports, ARCHIVE_IMPORT_RE,
  findBuildEntryPoints, isBuildEntrySource,
} from "./topology.mjs";
import { isInstrumentPath, INSTRUMENT_ALLOWLIST, MEASUREMENTS_PREFIX } from "./pin-guard.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const STRUCTURE = read(STRUCTURE_REL);
const BUILD_REL = "benchmarks/sculpture/build.mjs";

test("TOPO1 map forward — every module the spine names resolves on disk", () => {
  const tokens = parseSpineModules(STRUCTURE);
  assert.ok(tokens.length >= 6, `expected the spine to name several modules, got ${tokens.length}`);
  for (const tok of tokens) {
    const r = resolveModuleToken(ROOT, tok);
    assert.ok(r.ok, `STRUCTURE.md names "${tok}" but it is absent (${r.reason})`);
  }
});

test("TOPO1-red a spine that names a missing module is caught", () => {
  const bogus = [
    "| # | Stage | Owning module | Artifact | Entry point |",
    "| --- | --- | --- | --- | --- |",
    "| 1 | Ghost | `src/nope/ghost.mjs` | x | y |",
  ].join("\n");
  const [tok] = parseSpineModules(bogus);
  assert.equal(tok, "src/nope/ghost.mjs");
  assert.equal(resolveModuleToken(ROOT, tok).ok, false);
});

test("TOPO2 map reverse — every stage the chain actually runs is named in the map", () => {
  const stages = chainStageModules(read(BUILD_REL));
  assert.ok(stages.includes("generated-milestone.mjs") && stages.includes("workshop.mjs"),
    `chainStageModules should find the spawned stages, got ${stages.join(", ")}`);
  const missing = missingFromMap(STRUCTURE, stages);
  assert.deepEqual(missing, [], `chain stages absent from STRUCTURE.md: ${missing.join(", ")}`);
});

test("TOPO2-red a stage missing from the map is caught", () => {
  const mapWithout = STRUCTURE.replaceAll("workshop.mjs", "REDACTED.mjs");
  assert.deepEqual(missingFromMap(mapWithout, ["workshop.mjs"]), ["workshop.mjs"]);
});

test("TOPO3 one build entry point — exactly one live runner declares build-chain/v1", () => {
  const entries = findBuildEntryPoints(ROOT);
  assert.deepEqual(entries, [BUILD_REL],
    `expected exactly one build entry point (${BUILD_REL}); found: ${entries.join(", ")}`);
});

test("TOPO3-red a second build entry point is caught; composing helpers are not false positives", () => {
  assert.ok(isBuildEntrySource('export const BUILD_CHAIN_SCHEMA = "build-chain/v1";'));
  // a runner that merely SPAWNS the workshop (geometry-levers style) is not an entry point
  assert.ok(!isBuildEntrySource('spawnSync(node, [join(HERE, "workshop.mjs")]);'));
});

test("TOPO4 no live module imports from _archive/", () => {
  const hits = findArchiveImports(ROOT);
  assert.deepEqual(hits, [], "live import(s) from the dead-code home:\n" +
    hits.map((h) => `  ${h.rel}: ${h.line}`).join("\n"));
});

test("TOPO4-red an archive import is caught; a provenance comment is not", () => {
  assert.ok(ARCHIVE_IMPORT_RE.test('import { x } from "../_archive/pattern-book.mjs";'));
  assert.ok(ARCHIVE_IMPORT_RE.test('const m = await import("./_archive/old.mjs");'));
  assert.ok(!ARCHIVE_IMPORT_RE.test("// retired to _archive/pattern-book.mjs (S-156)"));
  assert.ok(!ARCHIVE_IMPORT_RE.test('const note = "see _archive/README.md";'));
});

test("TOPO5 the pin-guard allowlist is a path PREFIX, not a hand-list", () => {
  // drafts under builds/ are free; the frozen homes are measurements/ + ratified packs/
  assert.equal(isInstrumentPath("builds/cottage/build.json"), false);
  assert.equal(isInstrumentPath("builds/barn/final-artifact.json"), false);
  assert.equal(isInstrumentPath("measurements/multi-angle/cottage-x.json"), true);
  assert.equal(isInstrumentPath("measurements/baselines/anything/else.json"), true); // prefix, any depth
  assert.equal(isInstrumentPath("packs/rustic.json"), true);
  assert.equal(isInstrumentPath("packs/drafts/wip.json"), false);
  // the allowlist stays a SHORT set of prefix/extension matchers (measurements, packs, deferred kit)
  assert.ok(INSTRUMENT_ALLOWLIST.length <= 3, "allowlist grew into a hand-list — keep it prefix-shaped");
  assert.ok(MEASUREMENTS_PREFIX.endsWith("/"), "the measurements prefix is a directory prefix");
  // two unrelated files under the same prefix both freeze → it is a prefix, not a single-file allow
  assert.equal(isInstrumentPath(`${MEASUREMENTS_PREFIX}a/one.json`), true);
  assert.equal(isInstrumentPath(`${MEASUREMENTS_PREFIX}b/two.json`), true);
});

test("TOPO6 done = delivered — the chain's success path renders the final beside the concept", () => {
  const src = read(BUILD_REL);
  assert.match(src, /from\s+["'][^"']*render-beside\.mjs["']/, "build.mjs must import the beside-concept render");
  for (const seam of ["assertGlAvailable", "renderBesideConcept"]) {
    assert.ok(src.includes(seam), `build.mjs must use ${seam} (E-36 delivery)`);
  }
  const success = src.indexOf("return record.");
  assert.ok(success > 0, "could not locate the success return in build.mjs");
  assert.ok(src.indexOf("assertGlAvailable()") > 0 && src.indexOf("assertGlAvailable()") < success,
    "assertGlAvailable() must run before the chain reports success (green tests alone are not done)");
  assert.ok(src.indexOf("renderBesideConcept(") > 0 && src.indexOf("renderBesideConcept(") < success,
    "the beside-concept render must run before the chain reports success");
});

test("TOPO7 conventions recorded — STRUCTURE.md carries the S-157 enforcement + conventions", () => {
  const markers = [
    "src/form/topology.conformance.test.mjs", // the enforcement is named in the map
    "updates this map in the same commit",     // kept-current convention
    "Replace, don't accrete",                  // supersede-archives-in-the-same-ticket convention
    "Claim before you produce",                // the lisa-claim convention
  ];
  for (const m of markers) {
    assert.ok(STRUCTURE.includes(m), `STRUCTURE.md is missing the recorded convention marker: "${m}"`);
  }
});
