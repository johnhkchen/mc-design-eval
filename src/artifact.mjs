// Design-artifact validation core (T-001-03).
//
// The single gate that turns untrusted input — a model's structured output, a
// file, a fixture — into a SCHEMA-VALID, typed design artifact (or a clear,
// located error). The contract it enforces is `schema/design-artifact.schema.json`
// (T-001-01), the single source of truth; this module never re-states the shape,
// it compiles that file with ajv (the T-001-01 idiom).
//
// Pure: no SDK import, no network. The Agent SDK wiring lives in sdk-binding.mjs
// and depends on this module, not the reverse — so this gate is reusable by every
// artifact consumer (T-001-02 expansion, the exporter, the E-04 validators).
//
// What this owns: structural validation (shape, types, id pattern, required
// fields, the placement union). What it does NOT: Minecraft semantics (block
// registry, block-state legality, gravity/attachment — E-04), the `from <= to`
// corner rule (normalized by T-001-02), and anything that calls a model.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

/** @typedef {[number, number, number]} Coordinate integer voxel-lattice cell */
/** @typedef {string} BlockId namespaced Minecraft block id, e.g. minecraft:stone */
/** @typedef {Record<string, string>} BlockState stringly-typed block-state props */
/**
 * @typedef {Object} Metadata
 * @property {string} trial_id            join key for scores/renders/ratings
 * @property {string} prompting_method_id named, versioned archetype (spec §7)
 * @property {string} model_id            pinned model id
 * @property {number} seed                generation seed
 * @property {string} server_state_id     assumed world state
 * @property {"house"|"path"|"landscape"} [target]
 * @property {string} [created_at]        ISO date-time
 */
/**
 * @typedef {Object} Style
 * @property {string} name      named style, e.g. industrial
 * @property {string} rationale how the design realizes the style
 */
/**
 * @typedef {Object} Palette
 * @property {string} [palette_id] reference to a style-palette whitelist (T-001-04)
 * @property {BlockId[]} manifest  declared set of block ids the design uses
 */
/**
 * @typedef {Object} Placement A schema-valid placement; exactly one op shape.
 * @property {"voxel"|"line"|"box"|"fill"} op
 * @property {Coordinate} [pos]   present for op "voxel"
 * @property {Coordinate} [from]  present for op "line"|"box"|"fill"
 * @property {Coordinate} [to]    present for op "line"|"box"|"fill"
 * @property {BlockId} block
 * @property {BlockState} [state]
 */
/**
 * @typedef {Object} DesignArtifact The structured object an LLM emits (spec §5).
 * @property {string} schema_version
 * @property {Metadata} metadata
 * @property {Style} style
 * @property {Palette} palette
 * @property {Placement[]} placements
 */
/**
 * @typedef {{ ok: true, artifact: DesignArtifact }
 *   | { ok: false, code: "invalid_json" | "schema_invalid", errors: string[] }
 * } ParseResult
 */

const here = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the source-of-truth schema (T-001-01). */
export const SCHEMA_PATH = resolve(here, "..", "schema", "design-artifact.schema.json");

/**
 * Read and parse the canonical JSON Schema (full form, with discriminator).
 * @returns {object}
 */
export function loadSchema() {
  return JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
}

/**
 * Compile an ajv validator for a schema, using the exact T-001-01 options so the
 * discriminator yields single-branch placement errors.
 * @param {object} [schema] defaults to the canonical schema
 * @returns {import("ajv").ValidateFunction}
 */
export function compileValidator(schema = loadSchema()) {
  const ajv = new Ajv2020({ allErrors: true, strict: true, discriminator: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

let _validator = null;
/** Memoized validator over the canonical schema (compiled once per process). */
function getValidator() {
  if (_validator === null) _validator = compileValidator();
  return _validator;
}

/**
 * Format ajv errors as located, human-actionable lines — "which field, why"
 * (AC #3). Ported from scripts/validate-artifact.mjs so messages read identically
 * across the schema gate and this helper.
 * @param {import("ajv").ErrorObject[] | null | undefined} errors
 * @returns {string[]}
 */
export function formatErrors(errors) {
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

/**
 * Parse and validate an artifact. Accepts a JSON string or an already-parsed
 * object. Validation failure is a value, not an exception — callers branch on
 * `ok`. On success the artifact is frozen and typed.
 * @param {string | object} input
 * @returns {ParseResult}
 */
export function parseArtifact(input) {
  let data = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch (err) {
      return { ok: false, code: "invalid_json", errors: [`  could not parse JSON: ${err.message}`] };
    }
  }
  const validate = getValidator();
  if (validate(data)) {
    return { ok: true, artifact: Object.freeze(/** @type {DesignArtifact} */ (data)) };
  }
  return { ok: false, code: "schema_invalid", errors: formatErrors(validate.errors) };
}

/**
 * Fail-fast variant for call sites that prefer an exception. Returns the typed,
 * frozen artifact or throws an Error whose message is the joined located lines.
 * @param {string | object} input
 * @returns {DesignArtifact}
 */
export function assertArtifact(input) {
  const result = parseArtifact(input);
  if (!result.ok) {
    throw new Error(`invalid design artifact (${result.code}):\n${result.errors.join("\n")}`);
  }
  return result.artifact;
}

/**
 * Recursively clone `node`, omitting any object key in `keys`. Pure — the input
 * is never mutated.
 * @param {*} node
 * @param {Set<string>} keys
 * @returns {*}
 */
function deepStripKeys(node, keys) {
  if (Array.isArray(node)) return node.map((n) => deepStripKeys(n, keys));
  if (node && typeof node === "object") {
    /** @type {Record<string, *>} */
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (keys.has(k)) continue;
      out[k] = deepStripKeys(v, keys);
    }
    return out;
  }
  return node;
}

/**
 * Project the canonical schema to a model-facing form safe to hand to the Agent
 * SDK's json_schema output format. Strips the non-standard OpenAPI `discriminator`
 * keyword (the `oneOf` + `const` on `op` keep the union unambiguous to a standards
 * validator) and the `$schema` / `$id` meta-fields. The full schema (with
 * discriminator) still drives our own ajv validation for crisp errors; only this
 * copy is reduced. Pure: the source schema is not mutated.
 * @param {object} [schema] defaults to the canonical schema
 * @returns {object}
 */
export function toModelSchema(schema = loadSchema()) {
  const stripped = deepStripKeys(schema, new Set(["discriminator"]));
  delete stripped.$schema;
  delete stripped.$id;
  return stripped;
}
