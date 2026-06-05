// Staged-sculptor orchestrator — the stage interface + the lock-on-accept runner (T-024-01,
// epic E-11 / story S-024).
//
// A STAGE is a pure transform `apply(buildState, intent) → buildState`. `intent` is the LLM/plan
// side-channel (focal hierarchy, palette-to-mood) a craft pass may read; the spine threads it but
// never interprets it. The orchestrator runs an ordered list of stages and, after each, LOCKS
// exactly the fields that stage contributed — so a later stage cannot undo a prior one (only add
// within bounds). This is the structural cure for the P14 regression (a blanket 2nd pass detaching
// masses): "improve" becomes additive, never destructive.
//
// LOCK ENFORCEMENT IS TWO-LAYERED:
//   1. write-time (primary, structural) — a stage built the normal way drafts via `draftState`,
//      whose `set` THROWS `LockViolationError` the instant it tries to change a locked field.
//   2. accept-time (defense in depth) — even a stage that hand-builds a state bypassing the draft
//      is caught: the orchestrator diffs (`changedFields`) and REJECTS (`StageRejectedError`) if any
//      changed field was already locked, before locking or advancing.
//
// BOUNDARIES: imports only build-state.mjs (the leaf). No SDK, no I/O, no schema, no render.

import { FIELDS, draftState, lockFields, getCell, defaultCell, parseKey } from "./build-state.mjs";

/** Thrown by `runStages` when a stage's output changes an already-LOCKED field (bypass defense). */
export class StageRejectedError extends Error {
  constructor(stage, fields) {
    super(`stage "${stage}" rejected: changed locked field(s) ${fields.join(", ")}`);
    this.name = "StageRejectedError";
    this.code = "stage_rejected";
    this.stage = stage;
    this.fields = fields;
  }
}

/**
 * The set of FIELDS whose value differs on ANY cell between two states. A key present in only one
 * state contributes any field of its cell that differs from the default cell (e.g. a newly occupied
 * cell yields "occupied", and "material"/"relief" if those were set too).
 * @param {import("./build-state.mjs").BuildState} prev
 * @param {import("./build-state.mjs").BuildState} next
 * @returns {Set<string>}
 */
export function changedFields(prev, next) {
  const changed = new Set();
  const keys = new Set([...prev.cells.keys(), ...next.cells.keys()]);
  for (const key of keys) {
    const { x, y } = parseKey(key);
    const a = getCell(prev, x, y) ?? defaultCell();
    const b = getCell(next, x, y) ?? defaultCell();
    for (const field of FIELDS) {
      if (a[field] !== b[field]) changed.add(field);
    }
    if (changed.size === FIELDS.length) break; // can't grow further
  }
  return changed;
}

/**
 * Build a Stage from a `run(draft, intent, prevState)` body — sugar that wraps the draft/commit
 * boilerplate so a stage author writes only the mutation. The resulting `apply` is the pure
 * `(state, intent) → state` transform the orchestrator expects.
 * @param {{name: string, run: (draft: any, intent: any, prev: any) => void}} def
 * @returns {{name: string, apply: (state: any, intent: any) => any}}
 */
export function defineStage({ name, run }) {
  return {
    name,
    apply(state, intent) {
      const draft = draftState(state);
      run(draft, intent, state);
      return draft.commit();
    },
  };
}

/**
 * Run `stages` in order over `state`, locking each stage's contributions on accept.
 * @param {import("./build-state.mjs").BuildState} state
 * @param {Array<{name: string, apply: (s: any, i: any) => any}>} stages
 * @param {object} [intent]  the plan side-channel, threaded read-only to every stage
 * @returns {import("./build-state.mjs").BuildState}
 */
export function runStages(state, stages, intent = {}) {
  for (const stage of stages) {
    const next = stage.apply(state, intent); // may throw LockViolationError (write-time guard)
    const changed = changedFields(state, next);
    const illegal = [...changed].filter((f) => state.locked.has(f));
    if (illegal.length > 0) throw new StageRejectedError(stage.name, illegal);
    state = lockFields(next, stage.name, [...changed]);
  }
  return state;
}
