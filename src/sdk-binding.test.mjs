// Unit suite for the Agent SDK structured-output binding (T-001-03, AC #1/#4).
//
// Covers the PURE binding surface only: the output-format option object and the
// result-extraction path, over plain mock objects. The SDK package is never
// imported and requestDesignArtifact() is never called — keeping the suite
// offline and free of metered API calls (spec §4).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { designArtifactOutputFormat, extractArtifact } from "./sdk-binding.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const examples = resolve(here, "..", "schema", "examples");
const readExample = (name) => readFileSync(resolve(examples, name), "utf8");

const validText = readExample("valid-industrial-house.json");
const validObj = JSON.parse(validText);
const invalidObj = JSON.parse(readExample("invalid-industrial-house.json"));

function hasKey(node, key) {
  if (Array.isArray(node)) return node.some((n) => hasKey(n, key));
  if (node && typeof node === "object") {
    if (Object.prototype.hasOwnProperty.call(node, key)) return true;
    return Object.values(node).some((v) => hasKey(v, key));
  }
  return false;
}

// --- designArtifactOutputFormat (AC #1) -----------------------------------

test("output format is a json_schema wrapper around the contract", () => {
  const of = designArtifactOutputFormat();
  assert.equal(of.type, "json_schema");
  assert.equal(typeof of.schema, "object");
  assert.equal(of.schema.title, "DesignArtifact");
});

test("output-format schema is the model-facing projection (no discriminator)", () => {
  const of = designArtifactOutputFormat();
  assert.equal(hasKey(of.schema, "discriminator"), false);
  assert.equal("$schema" in of.schema, false);
});

test("output-format schema actually constrains: accepts good, rejects bad", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const v = ajv.compile(designArtifactOutputFormat().schema);
  assert.equal(v(validObj), true);
  assert.equal(v(invalidObj), false);
});

// --- extractArtifact (AC #1/#4) -------------------------------------------

test("extracts a validated artifact from structured_output (object)", () => {
  const r = extractArtifact({ structured_output: validObj });
  assert.equal(r.ok, true);
  assert.equal(r.artifact.metadata.trial_id, "phase1-house-singleshot-0001");
});

test("extracts from a result text payload (JSON string)", () => {
  const r = extractArtifact({ result: validText });
  assert.equal(r.ok, true);
  assert.equal(r.artifact.style.name, "industrial");
});

test("invalid structured_output surfaces located validation errors", () => {
  const r = extractArtifact({ structured_output: invalidObj });
  assert.equal(r.ok, false);
  assert.equal(r.code, "schema_invalid");
  assert.match(r.errors.join("\n"), /palette\/manifest/);
});

test("a result with no payload throws a clear error", () => {
  assert.throws(() => extractArtifact({}), /no structured payload/);
});
