// JUDGE ISOLATION — STRUCTURAL, NOT CONVENTION (T-126-01 AC #4, the T-119 pattern). Two pins:
//
//   1. SOURCE ABSENCE: no file in src/workshop/ and not the workshop runner references any seam
//      of the frozen judge. The deny list is PRECISE TOKENS, not /judge/ — judge-reply.mjs is the
//      sanctioned REPLY POLICY (bounded re-asks), not the judge, and a loose regex would also
//      trip on comments (the self-grep lesson). The runner reaches renders via
//      src/view/multi-angle.mjs (the lens) — that is NOT multi-angle-gate (the judge); the token
//      list distinguishes them.
//
//   2. GUARD REFUSAL: a workshop-domain write aimed at the gate-record namespace throws
//      PinGuardError with rotate AND with a sanction — the pin-guard, not workshop politeness,
//      is what stands between the loop and the judge's records.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PinGuardError, guardedWriteRecord, preflightPins, GATE_RECORD_NAMESPACES } from "../form/pin-guard.mjs";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(HERE, "..", "..");

/** The frozen judge's seams — exact tokens, every spelling the codebase actually uses. */
const JUDGE_SEAM_TOKENS = Object.freeze([
  "multi-angle-gate",        // the judge module (pure core AND metered runner share the name)
  "gate-instrument",         // the frozen instrument contract
  "spawnGate",               // how E-26 runners convene the judge (child process)
  "judgeThroughPolicy",      // the metered judge ask
  "aggregateMultiAngle",     // the verdict aggregation rule
  "parseMultiAngleVerdict",  // the judge's verdict parser
  "benchmarks/sculpture/multi-angle/", // the gate-record namespace (write target)
]);

const workshopFiles = () => [
  ...readdirSync(HERE)
    .filter((f) => f.endsWith(".mjs") && !f.endsWith(".test.mjs"))
    .map((f) => join(HERE, f)),
  join(ROOT, "benchmarks", "sculpture", "workshop.mjs"), // the impure runner is held to the same bar
  // T-127-01: the milestone chain composes the workshop (seed + spawn) — same bar. Its judging
  // is convened from OUTSIDE (gate:patternbook:* scripts); the verdict READER
  // (pattern-book-compare.mjs) must name gate-record paths and is deliberately NOT listed here.
  join(ROOT, "benchmarks", "sculpture", "pattern-book.mjs"),
];

test("ISO1 no workshop source references any judge seam (precise tokens, runner included)", () => {
  const files = workshopFiles();
  assert.ok(files.length >= 6, `expected the workshop modules + runner, found ${files.length}`);
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    for (const token of JUDGE_SEAM_TOKENS) {
      assert.ok(!src.includes(token), `${file.replace(ROOT, "")} references the judge seam "${token}"`);
    }
  }
});

test("ISO2 the lens stays, the judge does not: the runner may import multi-angle.mjs (renderViews) only", () => {
  const src = readFileSync(join(ROOT, "benchmarks", "sculpture", "workshop.mjs"), "utf8");
  assert.ok(src.includes("src/view/multi-angle.mjs"), "the runner renders through the E-22 lens");
  // belt-and-braces against a future "convenience" import sneaking the judge in via src/form
  assert.ok(!/from\s+"[^"]*form\/multi-angle/.test(src), "no judge import path");
});

test("ISO3 pin-guard refuses workshop writes to gate records — rotate and sanction included", async () => {
  assert.ok(GATE_RECORD_NAMESPACES.length >= 1);
  for (const ns of GATE_RECORD_NAMESPACES) {
    const rel = `${ns}forged-verdict.json`;
    for (const opts of [{}, { rotate: true }, { sanction: "any standing sanction" }]) {
      await assert.rejects(
        () => guardedWriteRecord({ root: ROOT, rel, content: "{}", trackedSet: new Set(), domain: "workshop", ...opts }),
        (e) => e instanceof PinGuardError && /frozen judge/.test(e.message),
        `workshop write to ${rel} must refuse with ${JSON.stringify(opts)}`,
      );
    }
    assert.throws(
      () => preflightPins({ pins: [{ rel, tracked: false }], rotate: true, domain: "workshop" }),
      PinGuardError,
      "preflight refuses before any spend",
    );
  }
});

test("ISO4 the loop core never imports the model or render stacks (seams arrive injected)", () => {
  for (const name of ["loop.mjs", "program.mjs", "actions.mjs", "critique.mjs", "replay.mjs"]) {
    const src = readFileSync(join(HERE, name), "utf8");
    const importLines = src.split("\n").filter((l) => /^\s*import\b/.test(l));
    // "baml" joins the ban (T-129-01): prompt rendering is the RUNNER's, through the bridge —
    // the pure core hands round context across the exchange seam and never touches the bridge.
    for (const banned of ["sdk-binding", "model-tier", "render/", "prismarine", "baml"]) {
      for (const line of importLines) {
        assert.ok(!line.includes(banned), `${name} import must not reference "${banned}": ${line.trim()}`);
      }
    }
  }
});
