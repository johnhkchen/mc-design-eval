// The style-pack contract — schema gate, semantic validation, and the vocabulary-authority seam
// (T-124-01, story S-124, epic E-31). A pack is the per-STYLE bundle (E-31 Rule 2 sanctions
// per-style DATA; per-building code stays forbidden): provenance story, curated palette, idiom
// set, proportion rules, decoration vocabulary, and the conformance gate the workshop runs each
// round. The pack structurally retires the flagged-kit failure mode (the barn's auto-flagged kit
// silently disabled its own roof, T-121/T-122): the palette is HUMAN-CURATED once per style — no
// per-subject recognition flags on this path.
//
// MATERIAL CHOICE IS DIEGETIC, NOT OPTICAL (pipeline-philosophy Stage 0): the pack records the
// style's local-availability narrative (`provenance.sources`) and every palette role derives
// from it (`palette[].provenance` cites source keys — enforced referentially here, since JSON
// Schema cannot). GLB textures are never read for materials anywhere on this path: no GLB input
// exists in this module or below it (TRELLIS textures are an amalgam of other games' assets —
// the barn's `flagged-mismatch` entries were the optical system correctly reporting that optics
// cannot decide materials).
//
// "VALUE-VALIDATED ONCE": the E-14/T-086 verdicts run at pack-AUTHORING time and the results are
// committed in the pack (`palette[].valueCheck`). `validateStylePack` RE-DERIVES the snapshot
// from the committed block-Lab table (deterministic — no optical sampling on the hot path, no
// silent re-runs) and rejects a stale or dishonest snapshot. The human reviewer sees the value
// evidence in the artifact they review.
//
// Follows the artifact.mjs validation idiom: Ajv2020 strict + memoized validator + non-throwing
// parse / fail-fast assert; `formatErrors` is REUSED from artifact.mjs. IO is limited to the
// committed-file idiom (schema + pack reads), the same purity class as loadBlockTable.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { formatErrors } from "../artifact.mjs";
import { loadBlockTable } from "../color/block-table.mjs";
import { familyOf, isExcludedCandidate } from "../color/value-select.mjs";
import { derivedFormClass } from "../form/kit.mjs";
import { IDIOM_REGISTRY } from "./idiom-registry.mjs";
import { CONFORMANCE_CHECK_NAMES } from "./conformance.mjs";

const here = dirname(fileURLToPath(import.meta.url));

export const STYLE_PACK_SCHEMA = "style-pack/v1";
export const PACK_SCHEMA_PATH = resolve(here, "..", "..", "schema", "style-pack.schema.json");

/** The material-precedence contract (consumed by idiom recognition, S-125): a subject's explicit
 * concept evidence beats the pack's assignment; the pack beats the vernacular default. */
export const MATERIAL_PRECEDENCE = Object.freeze([
  "concept-evidence", "pack-assignment", "vernacular-default",
]);

export function loadPackSchema(path = PACK_SCHEMA_PATH) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function compilePackValidator(schema = loadPackSchema()) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

let _validator = null;
function getValidator() {
  if (_validator === null) _validator = compilePackValidator();
  return _validator;
}

/**
 * Non-throwing JSON-schema gate (the parseArtifact idiom): errors are values.
 * @param {string|object} input
 * @returns {{ok:true, pack:object}|{ok:false, code:string, errors:string[]}}
 */
export function parseStylePack(input) {
  let data = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch (err) {
      return { ok: false, code: "invalid_json", errors: [`could not parse: ${err.message}`] };
    }
  }
  const validate = getValidator();
  if (validate(data)) return { ok: true, pack: Object.freeze(data) };
  return { ok: false, code: "schema_invalid", errors: formatErrors(validate.errors) };
}

/** Fail-fast variant. */
export function assertStylePack(input) {
  const r = parseStylePack(input);
  if (!r.ok) throw new Error(`invalid style pack (${r.code}):\n${r.errors.join("\n")}`);
  return r.pack;
}

/**
 * SEMANTIC validation — everything the JSON schema cannot express. Errors fail the pack; warns
 * are recorded gaps (E-24 Rule 5 — a family-less cube is a gap, not an invention).
 *   1. Provenance referential integrity: every palette `provenance` key exists in
 *      `provenance.sources` (the diegetic derivation, enforced).
 *   2. Idioms resolve in the registry and their style params validate against the idiom's
 *      paramsSchema (partial — nothing required).
 *   3. The valueCheck snapshot is TRUE against the committed block-Lab table: formClass
 *      re-derived (cube iff in the 305 table, rail by name, else fixture), table membership,
 *      family, Lab — and a cube must not be an excluded candidate (ore/gravity).
 *   4. Proportions are sane (min ≤ max; pitch classes drawn from the generator vocabulary).
 *   5. Conformance check names are in the pack-conformance/v1 vocabulary.
 *   6. Zone seats: every named band has exactly one dominant.
 * @param {object} pack  a schema-valid pack (assertStylePack first)
 * @param {{registry?:object, blockTable?:object[]}} [opts]  injectable for tests
 * @returns {{ok:boolean, findings:{level:"error"|"warn", where:string, msg:string}[]}}
 */
export function validateStylePack(pack, { registry = IDIOM_REGISTRY, blockTable = null } = {}) {
  const table = blockTable ?? loadBlockTable();
  const entries = Array.isArray(table) ? table : table.blocks; // committed table is {blocks:[…]}
  const tableByBlock = new Map(entries.map((e) => [e.block, e]));
  const cubeSet = new Set(tableByBlock.keys());
  const findings = [];
  const err = (where, msg) => findings.push({ level: "error", where, msg });
  const warn = (where, msg) => findings.push({ level: "warn", where, msg });

  // 1. provenance referential integrity
  const sourceKeys = new Set(Object.keys(pack.provenance.sources));
  pack.palette.forEach((p, i) => {
    for (const k of p.provenance) {
      if (!sourceKeys.has(k)) err(`palette[${i}] (${p.role})`, `provenance key "${k}" is not in provenance.sources`);
    }
  });

  // 2. idiom resolution + style-params validation
  const ajv = new Ajv2020({ strict: true });
  pack.idioms.forEach((idiom, i) => {
    const entry = registry[idiom.name];
    if (!entry) {
      err(`idioms[${i}]`, `unknown idiom "${idiom.name}" (not in the registry)`);
      return;
    }
    if (idiom.params !== undefined) {
      const validate = ajv.compile(entry.paramsSchema);
      if (!validate(idiom.params)) {
        err(`idioms[${i}] (${idiom.name})`, `params do not satisfy the idiom's paramsSchema: ${formatErrors(validate.errors).join("; ")}`);
      }
    }
  });

  // 3. valueCheck snapshot re-derivation (deterministic — committed table only)
  pack.palette.forEach((p, i) => {
    const where = `palette[${i}] (${p.role}: ${p.block})`;
    const vc = p.valueCheck;
    const formClass = derivedFormClass(p.block, { cubeSet });
    if (vc.formClass !== formClass) err(where, `valueCheck.formClass "${vc.formClass}" — re-derived "${formClass}"`);
    const inTable = tableByBlock.has(p.block);
    if (vc.inTable !== inTable) err(where, `valueCheck.inTable ${vc.inTable} — table says ${inTable}`);
    const family = familyOf(p.block);
    if ((vc.family ?? null) !== family) err(where, `valueCheck.family "${vc.family ?? null}" — re-derived "${family}"`);
    if (formClass === "cube") {
      if (!inTable) err(where, "a cube role must name a block in the committed block-Lab table");
      if (isExcludedCandidate(p.block)) err(where, "excluded candidate (ore/gravity-affected) may not hold a role");
      const lab = tableByBlock.get(p.block)?.lab;
      if (lab) {
        if (!vc.lab) err(where, "cube valueCheck must carry the table Lab snapshot");
        else if (vc.lab.some((v, j) => Math.abs(v - lab[j]) > 1e-9)) {
          err(where, `valueCheck.lab [${vc.lab}] is stale — table says [${lab}]`);
        }
      }
      if (family === null) warn(where, "cube has no semantic family (recorded gap — value drift unguarded for this role)");
    } else if (vc.lab) {
      err(where, "non-cube roles carry no Lab snapshot (the table is full-cube only)");
    }
  });

  // 4. proportions sanity
  const { storeyHeight, pitchClasses, openingRhythm } = pack.proportions;
  if (storeyHeight.min > storeyHeight.max) err("proportions.storeyHeight", "min exceeds max");
  if (openingRhythm.minSpacing > openingRhythm.maxSpacing) err("proportions.openingRhythm", "minSpacing exceeds maxSpacing");
  const REALIZABLE_PITCHES = new Set([0.5, 1, 2, 3]);
  for (const pc of pitchClasses) {
    if (!REALIZABLE_PITCHES.has(pc)) err("proportions.pitchClasses", `pitch ${pc} is outside the generator vocabulary (0.5 slab, 1 stair — roof.gable; 2/3 steep — roof.gable.steep)`);
  }

  // 5. conformance vocabulary
  const known = new Set(CONFORMANCE_CHECK_NAMES);
  for (const name of pack.conformance.checks) {
    if (!known.has(name)) err("conformance.checks", `unknown check "${name}" (known: ${CONFORMANCE_CHECK_NAMES.join(", ")})`);
  }

  // 6. zone seats: one dominant per named band
  const dominants = new Map();
  pack.palette.forEach((p, i) => {
    if (p.zone?.tier === "dominant") {
      if (dominants.has(p.zone.band)) err(`palette[${i}] (${p.role})`, `band "${p.zone.band}" already has a dominant (${dominants.get(p.zone.band)})`);
      else dominants.set(p.zone.band, p.role);
    }
  });
  for (const p of pack.palette) {
    if (p.zone?.tier === "preserve" && !dominants.has(p.zone.band)) {
      err("palette", `band "${p.zone.band}" has preserve entries but no dominant`);
    }
  }

  return { ok: !findings.some((f) => f.level === "error"), findings };
}

/**
 * Load a pack from disk, schema-gate it, and semantically validate — FAIL-LOUD (a committed pack
 * that does not validate is a broken artifact, not a degradable input).
 * @param {string} path
 * @param {object} [opts] forwarded to validateStylePack
 */
export function loadStylePack(path, opts = {}) {
  const pack = assertStylePack(readFileSync(path, "utf8"));
  const { ok, findings } = validateStylePack(pack, opts);
  if (!ok) {
    const lines = findings.filter((f) => f.level === "error").map((f) => `  at ${f.where}: ${f.msg}`);
    throw new Error(`style pack "${pack.style}" failed semantic validation:\n${lines.join("\n")}`);
  }
  return pack;
}

/**
 * THE AUTHORITY SEAM: derive the zone policy composeVocabulary consumes (`policyNamed`) from the
 * pack's palette zone seats. The pack is the policy's data source on this path — T-113 stays the
 * one composition point; this function only reshapes committed pack data.
 * @param {object} pack
 * @param {string[]} [bandNames] order/filter of bands (default: pack order of first appearance)
 * @returns {Record<string,{dominant:string, preserve:string[]}>}
 */
export function packPolicy(pack, bandNames = null) {
  const policy = {};
  for (const p of pack.palette) {
    if (!p.zone) continue;
    const z = (policy[p.zone.band] ??= { dominant: null, preserve: [] });
    if (p.zone.tier === "dominant") z.dominant = p.block;
    else z.preserve.push(p.block);
  }
  for (const [band, z] of Object.entries(policy)) {
    if (!z.dominant) throw new Error(`packPolicy: band "${band}" has no dominant`);
  }
  if (bandNames === null) return policy;
  const out = {};
  for (const b of bandNames) {
    if (!policy[b]) throw new Error(`packPolicy: pack has no zone seats for band "${b}"`);
    out[b] = policy[b];
  }
  return out;
}
