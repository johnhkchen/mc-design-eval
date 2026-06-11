// The brush contract — schema gate + semantic validator over the registry (T-128-01, story
// S-128, epic E-32). A brush is the unit of capability: parametrized, composable, unit-tested,
// preview-carded (E-32 Rule 1). The contract has two halves:
//
//   • schema/brush.schema.json validates brushDescriptor(name, entry) — the SERIALIZABLE
//     projection (identity, kind, composition vocabularies, paramsSchema, preview declaration,
//     test pointer). Functions cannot be JSON-schema'd, so they never enter the descriptor.
//   • validateBrushRegistry applies the semantic rules JSON Schema cannot express: paramsSchema
//     compiles AND accepts {} (the T-124 partial-params rule), kind/composition consistency,
//     the preview RESOLVES (a construct's card ids exist and realize this brush; a pass's
//     synthetic subject realizes ≥1 cell), the declared test file exists and names the brush,
//     the source file exists. The contract test sweeps the real registry — a brush without a
//     test or a preview fails `npm test`. That is what makes the registry the only door.
//
// COMPOSITION is the chaining declaration the catalog documents and S-131 plans against:
// constructs are spec → cells; passes are occupancy + context → placements (or a removeSet the
// entry's `apply` consumes). Closed vocabularies — an unknown term is a schema error.
//
// Follows the style-pack idiom: Ajv2020 strict + memoized validator + non-throwing parse /
// fail-fast assert; formatErrors REUSED from artifact.mjs. IO is the committed-file-read purity
// class (schema + declared test/source reads), injectable for tests.

import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { formatErrors } from "../artifact.mjs";
import { IDIOM_REGISTRY } from "./idiom-registry.mjs";
import { IDIOM_CARD_SPECS } from "./idiom-card.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "..", "..");

export const BRUSH_SCHEMA = "brush/v1";
export const BRUSH_SCHEMA_PATH = resolve(ROOT, "schema", "brush.schema.json");

/** The composition vocabularies (closed — the schema enums mirror these). */
export const BRUSH_CONSUMES = Object.freeze(["spec", "occupancy", "zones", "features", "kit", "artifact"]);
export const BRUSH_EMITS = Object.freeze(["cells", "placements", "report", "removeSet", "artifact"]);

export function loadBrushSchema(path = BRUSH_SCHEMA_PATH) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function compileBrushValidator(schema = loadBrushSchema()) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

let _validator = null;
function getValidator() {
  if (_validator === null) _validator = compileBrushValidator();
  return _validator;
}

/**
 * Project a live registry entry onto its serializable brush descriptor. Pure. Functions
 * (generate/fn/apply/merge/preview.realize) are stripped; everything the schema validates stays.
 * @param {string} name
 * @param {object} entry  an IDIOM_REGISTRY-shaped entry carrying the brush metadata
 */
export function brushDescriptor(name, entry) {
  const preview = entry?.preview?.card
    ? { card: [...entry.preview.card] }
    : entry?.preview
      ? { substrate: structuredClone(entry.preview.substrate), params: structuredClone(entry.preview.params) }
      : undefined;
  return {
    schema: BRUSH_SCHEMA,
    name,
    kind: entry?.kind,
    source: entry?.source,
    tests: entry?.tests,
    composition: entry?.composition ? structuredClone(entry.composition) : undefined,
    paramsSchema: entry?.paramsSchema ? structuredClone(entry.paramsSchema) : undefined,
    ...(preview !== undefined ? { preview } : {}),
  };
}

/**
 * Non-throwing JSON-schema gate over a descriptor (the parseArtifact idiom).
 * @param {string|object} input
 * @returns {{ok:true, descriptor:object}|{ok:false, code:string, errors:string[]}}
 */
export function parseBrushDescriptor(input) {
  let data = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch (err) {
      return { ok: false, code: "invalid_json", errors: [`could not parse: ${err.message}`] };
    }
  }
  const validate = getValidator();
  if (validate(data)) return { ok: true, descriptor: Object.freeze(data) };
  return { ok: false, code: "schema_invalid", errors: formatErrors(validate.errors) };
}

/** Fail-fast variant. */
export function assertBrushDescriptor(input) {
  const r = parseBrushDescriptor(input);
  if (!r.ok) throw new Error(`invalid brush descriptor (${r.code}):\n${r.errors.join("\n")}`);
  return r.descriptor;
}

const defaultReadFile = (rel) => readFileSync(join(ROOT, rel), "utf8");

/** The realizer name a brush's tests/source must mention (rule 6's anchor). */
function realizerName(entry) {
  return entry?.generate?.name || entry?.fn?.name || null;
}

/**
 * SEMANTIC validation of a registry under the brush contract — everything the JSON schema
 * cannot say. Sweeps every entry; errors fail the registry.
 *   1. The descriptor is schema-valid (the gate above, per entry).
 *   2. paramsSchema compiles under Ajv and ACCEPTS {} (style params are partial by contract).
 *   3. Kind consistency: construct ⇒ `generate` is a function, consumes "spec", emits "cells";
 *      pass ⇒ `fn` is a function, consumes "occupancy", emits "placements" or "removeSet";
 *      `apply`/`merge` are functions where present.
 *   4. Preview resolves: construct ⇒ every preview.card id exists in cardSpecs AND that card
 *      spec realizes THIS brush; pass ⇒ realizePreview(name, entry) yields ≥1 cell.
 *   5. The declared tests file exists and mentions the brush (its name or its realizer's name).
 *   6. The declared source file exists.
 * @param {object} [registry]
 * @param {{cardSpecs?:Array, readFile?:(rel:string)=>string,
 *          realizePreview?:(name:string, entry:object)=>{cells:Array}}} [opts]
 * @returns {{ok:boolean, count:number, findings:{level:"error"|"warn", brush:string, msg:string}[]}}
 */
export function validateBrushRegistry(
  registry = IDIOM_REGISTRY,
  { cardSpecs = IDIOM_CARD_SPECS, readFile = defaultReadFile, realizePreview = null } = {}
) {
  const findings = [];
  const err = (brush, msg) => findings.push({ level: "error", brush, msg });
  const names = Object.keys(registry).sort();

  const paramsAjv = new Ajv2020({ allErrors: true, strict: false }); // entry fragments, not full docs
  const cardById = new Map((cardSpecs ?? []).map((s) => [s.id, s]));

  for (const name of names) {
    const entry = registry[name];

    // 1. schema gate over the projection
    const gate = parseBrushDescriptor(brushDescriptor(name, entry));
    if (!gate.ok) {
      for (const e of gate.errors) err(name, `descriptor: ${e}`);
      continue; // the rest assumes a well-formed descriptor
    }

    // 2. paramsSchema compiles + accepts {}
    try {
      const validateParams = paramsAjv.compile(structuredClone(entry.paramsSchema));
      if (!validateParams({})) err(name, "paramsSchema must accept {} (style params are partial)");
    } catch (e) {
      err(name, `paramsSchema does not compile: ${e.message}`);
    }

    // 3. kind consistency
    const { consumes, emits } = entry.composition;
    if (entry.kind === "construct") {
      if (typeof entry.generate !== "function") err(name, "construct must carry generate()");
      if (!consumes.includes("spec")) err(name, 'construct must consume "spec"');
      if (!emits.includes("cells")) err(name, 'construct must emit "cells"');
    } else {
      if (typeof entry.fn !== "function") err(name, "pass must carry fn()");
      if (!consumes.includes("occupancy")) err(name, 'pass must consume "occupancy"');
      if (!emits.includes("placements") && !emits.includes("removeSet")) {
        err(name, 'pass must emit "placements" or "removeSet"');
      }
    }
    for (const k of ["apply", "merge"]) {
      if (entry[k] !== undefined && typeof entry[k] !== "function") err(name, `${k} must be a function when present`);
    }

    // 4. preview resolves
    if (entry.preview?.card) {
      for (const id of entry.preview.card) {
        const spec = cardById.get(id);
        if (!spec) err(name, `preview.card "${id}" not found in the committed card specs`);
        else if (spec.idiom !== name) err(name, `preview.card "${id}" realizes "${spec.idiom}", not this brush`);
      }
    } else if (entry.preview) {
      if (typeof entry.preview.realize !== "function") {
        err(name, "pass preview must carry realize()");
      } else if (realizePreview === null) {
        err(name, "no preview realizer provided (pass previews need realizePassPreview)");
      } else {
        try {
          const { cells, effect } = realizePreview(name, entry);
          if (!Array.isArray(cells) || cells.length === 0) err(name, "preview realized no cells");
          else if (effect !== undefined && effect === 0) {
            err(name, "preview effect is empty (the card would show the bare substrate)");
          }
        } catch (e) {
          err(name, `preview did not realize: ${e.message}`);
        }
      }
    }

    // 5. tests exist and name the brush
    try {
      const text = readFile(entry.tests);
      const anchor = realizerName(entry);
      if (!text.includes(name) && !(anchor && text.includes(anchor))) {
        err(name, `tests file ${entry.tests} mentions neither "${name}" nor its realizer`);
      }
    } catch {
      err(name, `tests file ${entry.tests} is not readable`);
    }

    // 6. source exists
    try {
      readFile(entry.source);
    } catch {
      err(name, `source file ${entry.source} is not readable`);
    }
  }

  return { ok: findings.every((f) => f.level !== "error"), count: names.length, findings };
}
