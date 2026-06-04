#!/usr/bin/env node
// Validate design-artifact JSON files against schema/design-artifact.schema.json.
//
// Usage:
//   node scripts/validate-artifact.mjs <file.json> [<file2.json> ...]
//   node scripts/validate-artifact.mjs --expect valid   <file.json>   # exit !=0 unless VALID
//   node scripts/validate-artifact.mjs --expect invalid <file.json>   # exit !=0 unless INVALID
//   node scripts/validate-artifact.mjs --self-test [...]              # run inline negative cases first
//
// The schema is the source of truth; this runner only compiles it and reports
// pass/fail with located errors (instancePath + message) — AC-4 "which field, why".

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(here, "..", "schema", "design-artifact.schema.json");

function buildValidator() {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true, discriminator: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

// Format ajv errors as located, human-actionable lines.
function formatErrors(errors) {
  return (errors ?? []).map((e) => {
    const where = e.instancePath || "(root)";
    const extra =
      e.keyword === "additionalProperties"
        ? ` (unexpected property '${e.params.additionalProperty}')`
        : e.keyword === "enum"
          ? ` (allowed: ${e.params.allowedValues.join(", ")})`
          : "";
    return `  at ${where}: ${e.message}${extra}`;
  });
}

function validateData(validate, data) {
  const ok = validate(data);
  return { ok, errors: ok ? [] : formatErrors(validate.errors) };
}

function validateFile(validate, file) {
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    return { ok: false, errors: [`  could not read/parse ${file}: ${err.message}`] };
  }
  return validateData(validate, data);
}

// --- inline self-test: each fixture must FAIL at the expected location ----
// Witnesses that every schema rule we care about actually rejects bad input.
function baseArtifact() {
  return {
    schema_version: "1.0.0",
    metadata: {
      trial_id: "t",
      prompting_method_id: "m",
      model_id: "claude-opus-4-8",
      seed: 1,
      server_state_id: "s",
    },
    style: { name: "industrial", rationale: "r" },
    palette: { manifest: ["minecraft:stone"] },
    placements: [{ op: "voxel", pos: [0, 0, 0], block: "minecraft:stone" }],
  };
}

function selfTest(validate) {
  const cases = [
    [
      "additional top-level property is rejected",
      (a) => ((a.surprise = true), a),
    ],
    [
      "bare (un-namespaced) block id is rejected",
      (a) => ((a.placements[0].block = "stone"), a),
    ],
    [
      "non-integer coordinate is rejected",
      (a) => ((a.placements[0].pos = [0, 1.5, 0]), a),
    ],
    [
      "empty style rationale is rejected",
      (a) => ((a.style.rationale = ""), a),
    ],
    [
      "missing required metadata field is rejected",
      (a) => (delete a.metadata.seed, a),
    ],
    [
      "unknown placement op is rejected",
      (a) => ((a.placements[0] = { op: "sphere", pos: [0, 0, 0], block: "minecraft:stone" }), a),
    ],
  ];
  let failures = 0;
  console.log("self-test (negative fixtures):");
  for (const [name, mutate] of cases) {
    const { ok, errors } = validateData(validate, mutate(baseArtifact()));
    if (ok) {
      console.log(`  ✗ EXPECTED INVALID but passed — ${name}`);
      failures += 1;
    } else {
      console.log(`  ✓ ${name}\n${errors.map((l) => "    " + l.trim()).join("\n")}`);
    }
  }
  // Sanity: the un-mutated base must be VALID.
  const base = validateData(validate, baseArtifact());
  if (!base.ok) {
    console.log("  ✗ base artifact unexpectedly INVALID:\n" + base.errors.join("\n"));
    failures += 1;
  } else {
    console.log("  ✓ base artifact is VALID");
  }
  return failures;
}

// --------------------------------- main ----------------------------------
const argv = process.argv.slice(2);
let expect = null;
let runSelfTest = false;
const files = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--expect") expect = argv[++i];
  else if (argv[i] === "--self-test") runSelfTest = true;
  else files.push(argv[i]);
}

const validate = buildValidator();
let exitCode = 0;

if (runSelfTest) {
  const failures = selfTest(validate);
  if (failures > 0) exitCode = 1;
  console.log("");
}

for (const file of files) {
  const { ok, errors } = validateFile(validate, file);
  if (ok) {
    console.log(`VALID    ${file}`);
    if (expect === "invalid") {
      console.log(`  ✗ expected INVALID but it passed`);
      exitCode = 1;
    }
  } else {
    console.log(`INVALID  ${file}`);
    for (const line of errors) console.log(line);
    if (expect !== "invalid") exitCode = 1;
  }
}

process.exit(exitCode);
