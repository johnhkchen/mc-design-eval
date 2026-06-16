// The E-40 / S-167 DEFECT CORPUS loader (T-167-01) — the labeled (concept, build-render) states that
// E-40's style-distance severity term validates against, and that fix the E-39 bake-off's 2-state
// under-powering. This module is the SHARED INFRASTRUCTURE S-168 (severity term) and S-169 (crater
// re-run + corpus agreement) read; it is upstream DATA, so it has NO dependency on bakeoff-score.mjs —
// the scoring core stays pure and unaware of the corpus, and S-168 joins the two.
//
// Reading the corpus needs NO MODEL SPEND: labels are committed data, validation is ajv + light
// semantic checks. Follows the artifact.mjs / style-pack.mjs validation idiom: Ajv2020 strict +
// addFormats, memoized validator, non-throwing parse + fail-fast assert, formatErrors REUSED.
//
// SINGLE COMPOSITION POINT: `worstDepartment` membership is checked against DEPARTMENTS
// (src/pack/departments.mjs, derived from the idiom registry) HERE — the JSON Schema keeps it a free
// string on purpose, because JSON Schema cannot import the .mjs constant and a duplicated enum would be
// drift bait. Massing/proportion is deliberately NOT a department (the S-163 decision); a massing-worst
// state is logged in `excluded`, never force-fit to a department.

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { formatErrors } from "../artifact.mjs";
import { DEPARTMENTS } from "../pack/departments.mjs";

const here = dirname(fileURLToPath(import.meta.url));

export const DEFECT_CORPUS_SCHEMA = "eval-alignment/defect-corpus/v1";
export const CORPUS_SCHEMA_PATH = resolve(here, "..", "..", "schema", "defect-corpus.schema.json");
export const CORPUS_PATH = resolve(
  here, "..", "..", "experiments", "eval-alignment", "corpus", "defect-corpus.json"
);
/** Repo root — the base every corpus path (concept/renderDir) is resolved against. */
export const REPO_ROOT = resolve(here, "..", "..");

export function loadCorpusSchema(path = CORPUS_SCHEMA_PATH) {
  return JSON.parse(readFileSync(path, "utf8"));
}

let _validator = null;
/** Memoized compiled validator (one ajv instance, the style-pack.mjs idiom). */
export function compileCorpusValidator(schema = loadCorpusSchema()) {
  if (_validator) return _validator;
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  _validator = ajv.compile(schema);
  return _validator;
}

/** All paths a state references (concept/renderDir for single, both concepts + renderDir for pair). */
export function statePaths(state) {
  if (state.kind === "single") return [state.concept, state.renderDir];
  if (state.kind === "pair") return [state.labels.matchedConcept, state.labels.wrongStyleConcept, state.renderDir];
  return [];
}

/**
 * The semantic checks JSON Schema cannot express — IO-FREE so S-168/S-169 can call it on a parsed
 * corpus. Path-on-disk existence is asserted in the TEST, not here (keeps this reusable + pure).
 * @param {{states:Array, excluded?:Array}} corpus
 * @throws on a worstDepartment outside DEPARTMENTS or a duplicate id.
 */
export function assertSemantics(corpus) {
  const ids = new Set();
  for (const s of corpus.states ?? []) {
    if (ids.has(s.id)) throw new Error(`defect-corpus: duplicate state id "${s.id}"`);
    ids.add(s.id);
    if (s.kind === "single") {
      const d = s.labels?.worstDepartment;
      if (!DEPARTMENTS.includes(d)) {
        throw new Error(
          `defect-corpus: state "${s.id}" worstDepartment "${d}" is not a department (${DEPARTMENTS.join(", ")})`
        );
      }
    }
  }
  for (const e of corpus.excluded ?? []) {
    if (ids.has(e.id)) throw new Error(`defect-corpus: excluded id "${e.id}" collides with a state id`);
    ids.add(e.id);
  }
}

/**
 * Parse + validate. Validation failure is a VALUE, not an exception (the artifact.mjs idiom).
 * Semantic failures still throw — they are programmer/data errors, not user input.
 * @param {string|object} input JSON string or already-parsed object
 * @returns {{ok:true, corpus:object} | {ok:false, errors:string[]}}
 */
export function parseDefectCorpus(input) {
  let data = input;
  if (typeof input === "string") {
    try { data = JSON.parse(input); }
    catch (err) { return { ok: false, errors: [`  could not parse JSON: ${err.message}`] }; }
  }
  const validate = compileCorpusValidator();
  if (!validate(data)) return { ok: false, errors: formatErrors(validate.errors) };
  assertSemantics(data);
  return { ok: true, corpus: Object.freeze(data) };
}

/**
 * Fail-fast loader: returns the frozen corpus or throws with formatted schema/semantic errors.
 * @param {string} path
 * @returns {object} the validated corpus
 */
export function loadDefectCorpus(path = CORPUS_PATH) {
  const res = parseDefectCorpus(readFileSync(path, "utf8"));
  if (!res.ok) throw new Error(`defect-corpus invalid (${path}):\n${res.errors.join("\n")}`);
  return res.corpus;
}

/** Pure partition helpers — what S-168/S-169 import. */
export const singleStates = (corpus) => (corpus.states ?? []).filter((s) => s.kind === "single");
export const pairStates = (corpus) => (corpus.states ?? []).filter((s) => s.kind === "pair");
