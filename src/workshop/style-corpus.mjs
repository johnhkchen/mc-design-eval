// The E-46 / S-183 STYLE CORPUS loader (T-183-01) — the pack/concept-DECOUPLED (build, pack, concept)
// states the S-185 promotion gate re-runs. This module mirrors defect-corpus.mjs exactly: it is upstream
// DATA, so it has NO dependency on bakeoff-score.mjs — the scoring core stays pure and unaware of the
// corpus, and S-184 joins the two. Reading the corpus needs NO MODEL SPEND.
//
// THE DECOUPLING (why this corpus exists): in production the PACK is derived from the CONCEPT by
// recognition, so the two co-vary and the T-182-01 confound (the term tracked the pack, not the picture)
// is baked in. The corpus bypasses recognition — every state hands the scorer a pack file and a concept
// file as INDEPENDENT diagnose() arguments — so pack-effect and concept-image-effect are separable BY
// CONSTRUCTION. cellType enumerates the E-46 crux table; the loader asserts the AC shape (all four crux
// cell types present, >=2 hard-middle, >=3 subjects) so a future edit can't silently drop a crux cell.
//
// SINGLE COMPOSITION POINT: cellType / intendedFaithfulness membership is checked against the frozen
// CELL_TYPES / FAITHFULNESS constants HERE — the JSON Schema keeps them inline enums on purpose (JSON
// Schema cannot import a .mjs constant and a duplicated enum would be drift bait, the defect-corpus
// decision).

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { formatErrors } from "../artifact.mjs";

const here = dirname(fileURLToPath(import.meta.url));

export const STYLE_CORPUS_SCHEMA = "eval-alignment/style-corpus/v1";
export const STYLE_CORPUS_SCHEMA_PATH = resolve(here, "..", "..", "schema", "style-corpus.schema.json");
export const STYLE_CORPUS_PATH = resolve(
  here, "..", "..", "experiments", "eval-alignment", "corpus", "style-corpus.json"
);
/** Repo root — the base every corpus path (build/concept/pack/beside) is resolved against. */
export const REPO_ROOT = resolve(here, "..", "..");

/** The E-46 crux table cell types (authoritative; the schema mirrors this inline). */
export const CELL_TYPES = Object.freeze([
  "match", "same-pack-wrong-picture", "wrong-pack-right-picture", "cross", "hard-middle",
]);
/** The four CRUX cell types whose presence the corpus AC requires (excludes the off-diagonal `cross`). */
export const CRUX_CELL_TYPES = Object.freeze([
  "match", "same-pack-wrong-picture", "wrong-pack-right-picture", "hard-middle",
]);
export const FAITHFULNESS = Object.freeze(["high", "middle", "low"]);

export function loadStyleCorpusSchema(path = STYLE_CORPUS_SCHEMA_PATH) {
  return JSON.parse(readFileSync(path, "utf8"));
}

let _validator = null;
/** Memoized compiled validator (one ajv instance, the style-pack.mjs idiom). */
export function compileStyleCorpusValidator(schema = loadStyleCorpusSchema()) {
  if (_validator) return _validator;
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  _validator = ajv.compile(schema);
  return _validator;
}

/** Every on-disk path a state references — the test's existence guard iterates this. `renderDir` (not
 *  `build`) is the dir the view PNGs actually live in (== build for reuse cells, the synth dir for
 *  mutated builds). */
export function statePaths(state) {
  return [state.renderDir, state.pack, state.concept, state.beside];
}

/**
 * The semantic checks JSON Schema cannot express — IO-FREE so S-184/S-185 can call it on a parsed
 * corpus. Path-on-disk existence is asserted in the TEST, not here (keeps this reusable + pure).
 * @param {{states:Array, excluded?:Array}} corpus
 * @throws on an unknown cellType/intendedFaithfulness, a duplicate id, or an unmet AC-shape coverage
 *   requirement (the four crux cell types + >=2 hard-middle + >=3 subjects).
 */
export function assertSemantics(corpus) {
  const ids = new Set();
  const subjects = new Set();
  const cellCount = new Map();
  for (const s of corpus.states ?? []) {
    if (ids.has(s.id)) throw new Error(`style-corpus: duplicate state id "${s.id}"`);
    ids.add(s.id);
    if (!CELL_TYPES.includes(s.cellType)) {
      throw new Error(`style-corpus: state "${s.id}" cellType "${s.cellType}" not in (${CELL_TYPES.join(", ")})`);
    }
    if (!FAITHFULNESS.includes(s.intendedFaithfulness)) {
      throw new Error(`style-corpus: state "${s.id}" intendedFaithfulness "${s.intendedFaithfulness}" not in (${FAITHFULNESS.join(", ")})`);
    }
    subjects.add(s.subject);
    cellCount.set(s.cellType, (cellCount.get(s.cellType) ?? 0) + 1);
  }
  for (const e of corpus.excluded ?? []) {
    if (ids.has(e.id)) throw new Error(`style-corpus: excluded id "${e.id}" collides with a state id`);
    ids.add(e.id);
  }
  // AC-shape coverage — the corpus is worthless if a crux cell is missing. Assert it at load so the
  // gate (S-185) can trust the manifest is complete without re-deriving the table.
  for (const t of CRUX_CELL_TYPES) {
    if (!cellCount.get(t)) throw new Error(`style-corpus: missing required crux cell type "${t}"`);
  }
  if ((cellCount.get("hard-middle") ?? 0) < 2) {
    throw new Error(`style-corpus: need >=2 hard-middle states, got ${cellCount.get("hard-middle") ?? 0}`);
  }
  if (subjects.size < 3) {
    throw new Error(`style-corpus: need >=3 distinct subjects, got ${subjects.size} (${[...subjects].join(", ")})`);
  }
}

/**
 * Parse + validate. Validation failure is a VALUE, not an exception (the artifact.mjs idiom).
 * Semantic failures still throw — they are programmer/data errors, not user input.
 * @param {string|object} input JSON string or already-parsed object
 * @returns {{ok:true, corpus:object} | {ok:false, errors:string[]}}
 */
export function parseStyleCorpus(input) {
  let data = input;
  if (typeof input === "string") {
    try { data = JSON.parse(input); }
    catch (err) { return { ok: false, errors: [`  could not parse JSON: ${err.message}`] }; }
  }
  const validate = compileStyleCorpusValidator();
  if (!validate(data)) return { ok: false, errors: formatErrors(validate.errors) };
  assertSemantics(data);
  return { ok: true, corpus: Object.freeze(data) };
}

/**
 * Fail-fast loader: returns the frozen corpus or throws with formatted schema/semantic errors.
 * @param {string} path
 * @returns {object} the validated corpus
 */
export function loadStyleCorpus(path = STYLE_CORPUS_PATH) {
  const res = parseStyleCorpus(readFileSync(path, "utf8"));
  if (!res.ok) throw new Error(`style-corpus invalid (${path}):\n${res.errors.join("\n")}`);
  return res.corpus;
}

/** Pure partition helpers — what S-184/S-185 import. */
export const byCellType = (corpus, type) => (corpus.states ?? []).filter((s) => s.cellType === type);
export const cruxCells = (corpus) => (corpus.states ?? []).filter((s) => CRUX_CELL_TYPES.includes(s.cellType));
export const hardMiddle = (corpus) => byCellType(corpus, "hard-middle");
export const matchedRows = (corpus) => byCellType(corpus, "match");
