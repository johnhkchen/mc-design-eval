// Sanctioned workshop actions (T-126-01, story S-126, epic E-31). The model's hands: each round
// the critique picks ONE action from this vocabulary; the applier is DETERMINISTIC given the
// recorded parameters, so an accepted round replays without the model (Rule 5). Judgement lives
// in CHOOSING the action; applying it is pure code — the same split E-23 proved (the model points,
// the brush paints).
//
// THE VOCABULARY IS THE TICKET'S, THE APPLIERS ARE THE LANDED SEAMS':
//   • adjust-params  → TWO groundings (T-136-01): an elementId naming a program ELEMENT merges
//     spec keys (program.mjs applyParamAdjust, the original form); an elementId naming a source
//     MASS pulls the geometry levers (geometry.mjs applyGeometryAdjust — the T-133 measured
//     surface, re-validated and recompiled through the registry). Element grounding wins a tie.
//   • spray-paint    → the E-23 canvas: projectSurface + a fromBlock→toBlock surface recolor
//   • re-recognize   → grounded against program elements OR source masses (resolved to the
//     owning mass); the APPLIER stays the runner's to inject (the model transport may not enter
//     the pure core — ISO4). Without an injected applier the loop records `unavailable`.
//
// PURE — no GL, no IO, no Date/random — runs under the `src/**/*.test.mjs` glob.

import { projectSurface, resolveDir } from "../view/surface-grid.mjs";
import { bareBlock } from "../view/occupancy.mjs";
import { applyParamAdjust } from "./program.mjs";
import { GEOMETRY_PARAM_KEYS, resolveMass, applyGeometryAdjust } from "./geometry.mjs";

export const WORKSHOP_ACTION_SCHEMA = "workshop-action/v1";

/** The sanctioned action names (the ticket's list; `done` is a DECISION, not an action). */
export const ACTION_NAMES = Object.freeze(["adjust-params", "spray-paint", "re-recognize"]);

const isInt = (n) => Number.isInteger(n);
const isNonEmptyString = (s) => typeof s === "string" && s.length > 0;

/** The pack's block vocabulary — the SAME derivation paletteInPackCheck judges by (palette ∪
 *  decoration, bare ids). One source of truth for "in pack". */
export function packVocabulary(pack) {
  return new Set([
    ...(pack?.palette ?? []).map((p) => bareBlock(p.block)),
    ...(pack?.decoration ?? []).map((d) => bareBlock(d.block)),
  ]);
}

function fail(msg) { throw new Error(`parseAction: ${msg}`); }

/**
 * Validate a model-proposed action against the CURRENT program, pack and (when the run carries
 * one) source building-program. Throws on anything malformed or off-vocabulary (the critique
 * parser routes the throw into the bounded re-ask policy). Returns a frozen action carrying only
 * sanctioned keys; a geometry-form adjust and a mass-resolved re-recognize carry `massId`.
 * @param {object} obj  the model's `action` object
 * @param {{program:object, pack:object, source?:object|null}} ctx
 */
export function parseAction(obj, { program, pack, source = null }) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) fail("action must be an object");
  const name = obj.action;
  if (!ACTION_NAMES.includes(name)) fail(`action must be one of ${ACTION_NAMES.join(", ")} (got "${name}")`);

  if (name === "adjust-params") {
    if (obj.params === null || typeof obj.params !== "object" || Array.isArray(obj.params) || Object.keys(obj.params).length === 0) {
      fail("adjust-params.params must be a non-empty object");
    }
    const isElement = program.elements.some((el) => el.id === obj.elementId);
    if (isElement) {
      return Object.freeze({ action: name, elementId: obj.elementId, params: Object.freeze(structuredClone(obj.params)) });
    }
    // geometry form: the elementId names a source MASS (T-136-01 — the measured surface)
    if (source?.masses?.some((m) => m.id === obj.elementId)) {
      const keys = Object.keys(obj.params);
      const off = keys.filter((k) => !GEOMETRY_PARAM_KEYS.includes(k));
      if (off.length > 0) {
        fail(`adjust-params on mass "${obj.elementId}": unknown geometry param(s) ${off.join(", ")} (have: ${GEOMETRY_PARAM_KEYS.join(", ")})`);
      }
      if (keys.some((k) => !Number.isFinite(obj.params[k]))) fail("geometry params must be finite numbers");
      if ("eaveHeight" in obj.params && ("storeys" in obj.params || "storeyHeight" in obj.params)) {
        fail("eaveHeight is exclusive with storeys/storeyHeight — it factorizes into both");
      }
      return Object.freeze({
        action: name, elementId: obj.elementId, massId: obj.elementId,
        params: Object.freeze(structuredClone(obj.params)),
      });
    }
    fail(`adjust-params.elementId "${obj.elementId}" is not a program element${source ? " or a source mass" : ""} (have: ${program.elements.map((e) => e.id).join(", ")}${source ? `; masses: ${source.masses.map((m) => m.id).join(", ")}` : ""})`);
  }

  if (name === "spray-paint") {
    resolveDir(obj.dir); // throws on anything but ortho/45° — the E-23 paint-back scope
    const allowed = packVocabulary(pack);
    if (!isNonEmptyString(obj.toBlock) || !allowed.has(bareBlock(obj.toBlock))) {
      fail(`spray-paint.toBlock "${obj.toBlock}" is not in the pack vocabulary`);
    }
    if (obj.fromBlock !== undefined && !isNonEmptyString(obj.fromBlock)) {
      fail("spray-paint.fromBlock, when given, must be a non-empty block id");
    }
    let bounds;
    if (obj.bounds !== undefined) {
      const { min, max } = obj.bounds ?? {};
      const box3 = (v) => Array.isArray(v) && v.length === 3 && v.every(isInt);
      if (!box3(min) || !box3(max) || min.some((m, i) => m > max[i])) {
        fail("spray-paint.bounds must be {min:[x,y,z], max:[x,y,z]} with min ≤ max");
      }
      bounds = Object.freeze({ min: Object.freeze([...min]), max: Object.freeze([...max]) });
    }
    return Object.freeze({
      action: name, dir: typeof obj.dir === "string" ? obj.dir : obj.dir.name,
      toBlock: bareBlock(obj.toBlock),
      ...(obj.fromBlock !== undefined ? { fromBlock: bareBlock(obj.fromBlock) } : {}),
      ...(bounds !== undefined ? { bounds } : {}),
    });
  }

  // re-recognize — vocabulary-valid; the applier seam decides availability. Grounded against
  // program elements OR source masses; when a source rides, the named part resolves to its
  // owning mass (the compile naming rule) so the applier re-samples one whole mass.
  const resolved = resolveMass(source, obj.elementId);
  if (!program.elements.some((el) => el.id === obj.elementId) && resolved === null) {
    fail(`re-recognize.elementId "${obj.elementId}" is not a program element${source ? " or a source mass" : ""}`);
  }
  return Object.freeze({
    action: name, elementId: obj.elementId,
    ...(resolved !== null ? { massId: resolved.massId } : {}),
  });
}

const namespaced = (id) => (id.includes(":") ? id : `minecraft:${id}`);

/**
 * THE SPRAY-PAINT APPLIER — deterministic surface recolor on the E-23 canvas. Projects the
 * occupancy along the action's dir; every visible FULL-CUBE cell (shaped cells keep their states
 * — paint never smashes a stair) whose bare block matches `fromBlock` (or any, if absent), inside
 * `bounds` (if given), and not already `toBlock`, gets one {op:"voxel"} recolor at its stored
 * voxel (back-projection is a stored-voxel read — the surface-grid invariant).
 * @param {{occ:import("../view/occupancy.mjs").Occupancy, action:object}} args
 * @returns {{placements:object[], painted:number, skipped:{shaped:number, outOfBounds:number, fromMismatch:number, alreadyTarget:number}}}
 */
export function sprayPaintApplier({ occ, action }) {
  const grid = projectSurface(occ, action.dir);
  const placements = [];
  const skipped = { shaped: 0, outOfBounds: 0, fromMismatch: 0, alreadyTarget: 0 };
  for (const row of grid.cells) {
    for (const cell of row) {
      if (cell === null) continue;
      const [x, y, z] = cell.voxel;
      if (action.bounds) {
        const { min, max } = action.bounds;
        if (x < min[0] || y < min[1] || z < min[2] || x > max[0] || y > max[1] || z > max[2]) {
          skipped.outOfBounds++;
          continue;
        }
      }
      const bare = bareBlock(cell.block);
      if (action.fromBlock !== undefined && bare !== action.fromBlock) { skipped.fromMismatch++; continue; }
      if (bare === action.toBlock) { skipped.alreadyTarget++; continue; }
      if (occ.formOf(x, y, z) !== "cube") { skipped.shaped++; continue; }
      placements.push({ op: "voxel", pos: [x, y, z], block: namespaced(action.toBlock) });
    }
  }
  return { placements, painted: placements.length, skipped };
}

/** The default applier table. `re-recognize` is deliberately ABSENT — its applier calls the
 *  model, so the RUNNER injects it (the exchange precedent; ISO4 keeps transport out of the
 *  core). Selecting it uninjected yields {kind:"unavailable"} so the round is recorded, never
 *  crashed. The adjust-params applier routes by grounding: geometry form (massId — pure, so it
 *  IS a default) when the run carries a source; element form unchanged. */
export const DEFAULT_APPLIERS = Object.freeze({
  "adjust-params": ({ program, source = null, pack = null }, action) => {
    if (action.massId === undefined) {
      return {
        kind: "program",
        program: applyParamAdjust(program, { elementId: action.elementId, params: action.params }),
      };
    }
    if (!source || !pack) {
      return { kind: "unavailable", reason: "geometry adjust needs the source building program (this run carries none)" };
    }
    const r = applyGeometryAdjust(
      { source, pack, budget: { ...program.budget } },
      { massId: action.massId, params: action.params },
    );
    return { kind: "geometry", program: r.program, source: r.source };
  },
  "spray-paint": ({ occ }, action) => {
    const r = sprayPaintApplier({ occ, action });
    return { kind: "paint", placements: r.placements, painted: r.painted, skipped: r.skipped };
  },
});

/**
 * Apply a parsed action. Returns the applier's result (possibly a Promise — an injected
 * re-recognize applier is a metered exchange; the loop awaits), or {kind:"unavailable"} when the
 * action has no wired applier (the loop ledgers it and moves on).
 * @param {{program:object, occ:object, source?:object|null, pack?:object}} ctx
 * @param {object} action  a {@link parseAction} result
 * @param {{appliers?:object}} [opts]
 */
export function applyAction(ctx, action, { appliers = DEFAULT_APPLIERS } = {}) {
  const applier = appliers[action.action];
  if (!applier) {
    return { kind: "unavailable", reason: `action "${action.action}" has no wired applier in this workshop (the runner injects the re-recognize exchange — T-136-01)` };
  }
  return applier(ctx, action);
}
