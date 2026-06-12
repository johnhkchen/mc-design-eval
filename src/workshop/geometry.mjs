// THE GEOMETRY LEVERS (T-136-01, story S-136, epic E-33) — adjust-params reaches geometry.
// The T-127 finding this module closes: the model critiqued the proportion defect in 4 of 6
// rounds and never fixed it, because the revisable surface was compiled element specs — a
// proportion change must move shell height, roof eaveY/ridgeY, dormer seats, chimney and the
// declaration bands TOGETHER. That coherence already exists in exactly one place: compileProgram.
// So the lever edits the SOURCE (building-program/v1 masses — the T-133 measured surface:
// pitch, eave height, footprint, per-mass), re-validates through the same gates every recognized
// program passes (schema + pack vocabulary), and RECOMPILES through the registry. No geometry
// math is duplicated here; an incoherent request throws and the round records apply-failed.
//
// PURE — no GL, no IO, no model, no Date/random — runs under the `src/**/*.test.mjs` glob.
// The model transport for re-recognize lives in the RUNNER (ISO4); this module only supplies
// the deterministic substitution both the live applier and replay share.

import { factorEave } from "../recognition/measured-program.mjs";
import { assertBuildingProgram, validateProgramAgainstPack } from "../recognition/program.mjs";
import { compileProgram } from "../recognition/compile.mjs";
import { assertWorkshopProgram, realizeProgram } from "./program.mjs";

const fail = (msg) => { throw new Error(`geometry: ${msg}`); };

/** The lever vocabulary — the T-133 measured surface as flat scalars. `eaveHeight` is the
 *  measured quantity (factorized into storeys × storeyHeight under the schema bounds, the
 *  factorEave total order) and is exclusive with setting either factor directly. */
export const GEOMETRY_PARAM_KEYS = Object.freeze([
  "pitchClass", "eaveHeight", "storeys", "storeyHeight", "width", "depth",
]);

/**
 * Resolve an id against the source program's masses: a mass id directly, or a compiled element
 * id (compile names elements `${massId}-shell`, `${massId}-roof`, …) by longest matching
 * `${massId}-` prefix. Returns {massId, mass} or null.
 * @param {object|null} source  a building-program/v1
 * @param {string} id
 */
export function resolveMass(source, id) {
  const masses = source?.masses ?? [];
  let best = null;
  for (const mass of masses) {
    if (mass.id === id) return { massId: mass.id, mass };
    if (id.startsWith(`${mass.id}-`) && (best === null || mass.id.length > best.massId.length)) {
      best = { massId: mass.id, mass };
    }
  }
  return best;
}

/** Re-enter the compiler: source → workshop program, live budget preserved (compile commits
 *  drafts at rounds:1 — the seedWorkshopProgram override, single rule) and the PROPORTION
 *  declaration carried through (T-135's targets are SUBJECT data the conductor declared;
 *  compile re-derives bands/openings and knows nothing of them — without the carry, the first
 *  geometry round would silently disarm the proportion gate). */
function recompile(source, pack, budget, proportions = null) {
  const { workshopProgram } = compileProgram(source, pack);
  return assertWorkshopProgram({
    ...workshopProgram,
    budget: { ...budget },
    declarations: {
      ...workshopProgram.declarations,
      ...(proportions != null ? { proportions: structuredClone(proportions) } : {}),
    },
  });
}

/** Validate a candidate source program through the SAME gates every recognized program passes;
 *  any finding throws (the round records apply-failed — the model's re-aim signal). */
function gateSource(candidate, pack) {
  const asserted = assertBuildingProgram(candidate);
  const { findings } = validateProgramAgainstPack(asserted, pack);
  if (findings.length > 0) {
    fail(`candidate program is off the pack vocabulary:\n${findings
      .map((f) => `  at ${f.where}: ${f.msg}`).join("\n")}`);
  }
  return asserted;
}

/**
 * THE adjust-params GEOMETRY FORM — apply measured-surface params to ONE mass, re-validate,
 * recompile. Deterministic; throws on anything the gates refuse.
 * @param {{source:object, pack:object, budget:{rounds:number}, proportions?:object|null}} ctx
 *   proportions: the live program's `declarations.proportions` (carried through the recompile)
 * @param {{massId:string, params:object}} args
 * @returns {{program:object, source:object}}  the recompiled workshop program + revised source
 */
export function applyGeometryAdjust({ source, pack, budget, proportions = null }, { massId, params }) {
  if (!source) fail("no source program — geometry levers need the recognized building program");
  const keys = Object.keys(params ?? {});
  if (keys.length === 0) fail("geometry params must be a non-empty object");
  const off = keys.filter((k) => !GEOMETRY_PARAM_KEYS.includes(k));
  if (off.length > 0) fail(`unknown geometry param(s) ${off.join(", ")} (have: ${GEOMETRY_PARAM_KEYS.join(", ")})`);
  for (const k of keys) {
    if (!Number.isFinite(params[k])) fail(`geometry param ${k} must be a finite number (got ${JSON.stringify(params[k])})`);
  }
  if ("eaveHeight" in params && ("storeys" in params || "storeyHeight" in params)) {
    fail("eaveHeight is exclusive with storeys/storeyHeight — it factorizes into both");
  }

  const next = structuredClone(source);
  const mass = next.masses.find((m) => m.id === massId);
  if (!mass) fail(`mass "${massId}" is not in the source program (have: ${next.masses.map((m) => m.id).join(", ")})`);

  if ("width" in params) mass.rect.w = params.width;
  if ("depth" in params) mass.rect.d = params.depth;
  if ("storeys" in params) mass.storeys = params.storeys;
  if ("storeyHeight" in params) mass.storeyHeight = params.storeyHeight;
  if ("eaveHeight" in params) {
    const f = factorEave({
      eaveBlocks: params.eaveHeight,
      recognizedStoreys: mass.storeys,
      packBand: pack.proportions.storeyHeight,
    });
    mass.storeys = f.storeys;
    mass.storeyHeight = f.storeyHeight;
  }
  if ("pitchClass" in params) mass.roof.pitchClass = params.pitchClass;

  const asserted = gateSource(next, pack);
  return { program: recompile(asserted, pack, budget, proportions), source: asserted };
}

/**
 * THE re-recognize SUBSTITUTION — replace ONE mass with a re-sampled fragment, re-validate,
 * recompile. The fragment is a MODEL output: live, the runner's applier feeds it from the
 * bounded exchange; replay feeds the LEDGERED fragment verbatim — both land here.
 * @param {{source:object, pack:object, budget:{rounds:number}, proportions?:object|null}} ctx
 * @param {{massId:string, mass:object}} args
 * @returns {{program:object, source:object}}
 */
export function substituteMass({ source, pack, budget, proportions = null }, { massId, mass }) {
  if (!source) fail("no source program — re-recognition needs the recognized building program");
  if (mass === null || typeof mass !== "object" || Array.isArray(mass)) fail("fragment must be an object");
  if (mass.id !== massId) fail(`fragment id "${mass.id}" must keep the named part's id "${massId}"`);
  const idx = source.masses.findIndex((m) => m.id === massId);
  if (idx < 0) fail(`mass "${massId}" is not in the source program (have: ${source.masses.map((m) => m.id).join(", ")})`);
  const next = structuredClone(source);
  next.masses[idx] = structuredClone(mass);
  const asserted = gateSource(next, pack);
  return { program: recompile(asserted, pack, budget, proportions), source: asserted };
}

/**
 * Prune an accepted paint trail after geometry moved: keep placements whose position the new
 * realization still occupies (in-place recolors survive; orphans would be FLOATING voxels —
 * watertight/single-component bait that would unfairly veto a good geometry move). Pure and
 * order-preserving; replay applies the same rule at the same acceptance points.
 * @returns {{paint:object[], pruned:number}}
 */
export function prunePaint(program, paint) {
  if (!paint?.length) return { paint: paint ?? [], pruned: 0 };
  const occupied = new Set(realizeProgram(program).cells.map((c) => c.pos.join(",")));
  const kept = paint.filter((p) => occupied.has(p.pos.join(",")));
  return { paint: kept, pruned: paint.length - kept.length };
}
