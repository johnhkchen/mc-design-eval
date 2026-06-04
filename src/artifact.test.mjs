// Unit suite for the artifact validation core (T-001-03, AC #2/#3/#4).
//
// Pure and offline — no SDK, no network. The committed conformance fixtures are
// the canonical valid/invalid payloads, shared with the schema gate and the
// expander so all three agree on one ground truth.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  parseArtifact,
  assertArtifact,
  formatErrors,
  toModelSchema,
  loadSchema,
} from "./artifact.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const examples = resolve(here, "..", "schema", "examples");
const readExample = (name) => readFileSync(resolve(examples, name), "utf8");

const VALID = "valid-industrial-house.json";
const INVALID = "invalid-industrial-house.json";

const validText = readExample(VALID);
const validObj = JSON.parse(validText);
const invalidText = readExample(INVALID);
const invalidObj = JSON.parse(invalidText);

// structural scan for an object KEY anywhere in a schema (ignores strings)
function hasKey(node, key) {
  if (Array.isArray(node)) return node.some((n) => hasKey(n, key));
  if (node && typeof node === "object") {
    if (Object.prototype.hasOwnProperty.call(node, key)) return true;
    return Object.values(node).some((v) => hasKey(v, key));
  }
  return false;
}

// --- parseArtifact: valid -------------------------------------------------

test("valid fixture (object) parses to a typed, frozen artifact", () => {
  const r = parseArtifact(validObj);
  assert.equal(r.ok, true);
  assert.deepEqual(r.artifact, validObj);
  assert.equal(Object.isFrozen(r.artifact), true);
});

test("valid fixture (JSON string) parses ok", () => {
  const r = parseArtifact(validText);
  assert.equal(r.ok, true);
  assert.equal(r.artifact.metadata.trial_id, "phase1-house-singleshot-0001");
});

// --- parseArtifact: invalid (located, actionable) -------------------------

test("invalid fixture is rejected with code schema_invalid", () => {
  const r = parseArtifact(invalidObj);
  assert.equal(r.ok, false);
  assert.equal(r.code, "schema_invalid");
  assert.ok(r.errors.length >= 2);
});

test("invalid fixture errors name the bad manifest id and the missing block", () => {
  const r = parseArtifact(invalidObj);
  assert.equal(r.ok, false);
  const joined = r.errors.join("\n");
  // bare un-namespaced id in the manifest
  assert.match(joined, /\/palette\/manifest\/1: must match pattern/);
  // voxel placement missing its required block
  assert.match(joined, /\/placements\/1: must have required property 'block'/);
});

test("malformed JSON string is rejected with code invalid_json", () => {
  const r = parseArtifact("{ not json");
  assert.equal(r.ok, false);
  assert.equal(r.code, "invalid_json");
  assert.match(r.errors[0], /could not parse JSON/);
});

// --- targeted negatives: located at the expected instancePath -------------

const clone = (o) => JSON.parse(JSON.stringify(o));

test("missing required metadata field is located at /metadata", () => {
  const a = clone(validObj);
  delete a.metadata.seed;
  const r = parseArtifact(a);
  assert.equal(r.ok, false);
  assert.match(r.errors.join("\n"), /at \/metadata: must have required property 'seed'/);
});

test("unknown placement op is rejected", () => {
  const a = clone(validObj);
  a.placements[0] = { op: "sphere", pos: [0, 0, 0], block: "minecraft:stone" };
  const r = parseArtifact(a);
  assert.equal(r.ok, false);
  assert.match(r.errors.join("\n"), /\/placements\/0/);
});

test("non-integer coordinate is rejected", () => {
  const a = clone(validObj);
  a.placements[4].pos = [0, 1.5, 0];
  const r = parseArtifact(a);
  assert.equal(r.ok, false);
  assert.match(r.errors.join("\n"), /\/placements\/4\/pos\/1: must be integer/);
});

test("additionalProperties error names the unexpected property", () => {
  const a = clone(validObj);
  a.surprise = true;
  const r = parseArtifact(a);
  assert.equal(r.ok, false);
  assert.match(r.errors.join("\n"), /unexpected property 'surprise'/);
});

test("enum error lists the allowed values", () => {
  const a = clone(validObj);
  a.metadata.target = "barn";
  const r = parseArtifact(a);
  assert.equal(r.ok, false);
  assert.match(r.errors.join("\n"), /allowed: house, path, landscape/);
});

// --- formatErrors directly ------------------------------------------------

test("formatErrors handles null/undefined gracefully", () => {
  assert.deepEqual(formatErrors(null), []);
  assert.deepEqual(formatErrors(undefined), []);
});

// --- assertArtifact -------------------------------------------------------

test("assertArtifact returns the artifact on valid input", () => {
  const a = assertArtifact(validObj);
  assert.equal(a.style.name, "industrial");
});

test("assertArtifact throws a joined, located message on invalid input", () => {
  assert.throws(
    () => assertArtifact(invalidObj),
    (err) => /schema_invalid/.test(err.message) && /palette\/manifest/.test(err.message),
  );
});

// --- toModelSchema (Decision 4) -------------------------------------------

test("toModelSchema drops $schema and $id", () => {
  const ms = toModelSchema();
  assert.equal("$schema" in ms, false);
  assert.equal("$id" in ms, false);
});

test("toModelSchema strips the discriminator key everywhere", () => {
  const ms = toModelSchema();
  assert.equal(hasKey(ms, "discriminator"), false);
  // the oneOf union is preserved
  assert.equal(Array.isArray(ms.$defs.placement.oneOf), true);
});

test("toModelSchema is pure: the canonical schema keeps its discriminator", () => {
  toModelSchema();
  assert.equal(hasKey(loadSchema(), "discriminator"), true);
});

test("projected schema validates standalone (no discriminator option)", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const v = ajv.compile(toModelSchema());
  assert.equal(v(validObj), true);
  assert.equal(v(invalidObj), false);
});
