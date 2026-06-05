// Staged-sculptor build state — the framework spine's leaf (T-024-01, epic E-11 / story S-024).
//
// A richer intermediate than the flat `DesignArtifact`: a sparse grid of facade cells, each
// carrying `occupied` (massing), `material` (block id), and `relief` (Z-depth), plus a per-field
// LOCK record. A facade is a silhouette (most of the bounding box is air), so cells are a sparse
// `Map` keyed "x,y" — only written cells exist; an absent key reads as the default cell.
//
// LOCK SEMANTICS ARE LOAD-BEARING (the P14 destructive-revision cure, enforced in code, not by
// convention). Once a stage's contribution is accepted, the orchestrator LOCKS the field(s) it
// wrote (see orchestrator.mjs `lockFields`). A later stage that tries to change a LOCKED field to a
// new value throws `LockViolationError` at the point of the write — the draft inherits the prior
// state's locked set and guards every `set`. Re-writing the SAME value is a no-op ("only add within
// bounds"): a stage may touch a locked field as long as it doesn't change it.
//
// BOUNDARIES: this module is the leaf — NO intra-project imports, no SDK, no I/O, no schema. It is
// pure data + a guarded mutator + named errors, fully unit-testable on hand-built states. The
// orchestrator (locking, stage running) and compile (→ DesignArtifact) build on top of it; the AJV
// gate (src/artifact.mjs) is a consumer-side check exercised only in tests, never imported here.

/** The lockable per-cell fields, in canonical order. */
export const FIELDS = Object.freeze(["occupied", "material", "relief"]);

/**
 * @typedef {Object} Cell
 * @property {boolean} occupied  massing — is this facade cell solid?
 * @property {string|null} material  Minecraft block id, or null until a material pass sets it
 * @property {number} relief  Z-depth (0 flat, -1 inset/recess, +1 pop/trim)
 */
/**
 * @typedef {Object} BuildState
 * @property {number} width   facade bounding width (cells along x)
 * @property {number} height  facade bounding height (cells along y)
 * @property {Map<string, Cell>} cells  sparse, keyed `cellKey(x,y)`; absent key = default cell
 * @property {Set<string>} locked  the set of LOCKED field names (members of FIELDS)
 * @property {Array<{stage: string, fields: string[]}>} lockLog  ordered accept records
 */

/** The value of a never-written cell. Callers treat `getCell` undefined as this. */
export function defaultCell() {
  return { occupied: false, material: null, relief: 0 };
}

/** Sparse-map key for a cell. The single place the "x,y" scheme is spelled — a future
 *  per-voxel model swaps this (and `parseKey`) to "x,y,z" without touching call sites. */
export function cellKey(x, y) {
  return `${x},${y}`;
}

/** Inverse of `cellKey`: "x,y" → {x, y} as integers. */
export function parseKey(key) {
  const [x, y] = key.split(",").map((n) => Number.parseInt(n, 10));
  return { x, y };
}

/**
 * A fresh, empty build state of the given facade bounds: no occupied cells, nothing locked.
 * @param {{width: number, height: number}} dims
 * @returns {BuildState}
 */
export function createBuildState({ width, height }) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error(`createBuildState: width/height must be positive integers, got ${width}x${height}`);
  }
  return Object.freeze({ width, height, cells: new Map(), locked: new Set(), lockLog: [] });
}

/** The cell at (x,y), or undefined if never written. Treat undefined as `defaultCell()`. */
export function getCell(state, x, y) {
  return state.cells.get(cellKey(x, y));
}

/** Whether `field` is locked in `state`. */
export function isLocked(state, field) {
  return state.locked.has(field);
}

/**
 * Every occupied cell, sorted by (y, x) for deterministic, diff-stable output.
 * @param {BuildState} state
 * @returns {Array<{x: number, y: number, cell: Cell}>}
 */
export function occupiedCells(state) {
  const out = [];
  for (const [key, cell] of state.cells) {
    if (cell.occupied) out.push({ ...parseKey(key), cell });
  }
  out.sort((a, b) => a.y - b.y || a.x - b.x);
  return out;
}

/** Thrown by `Draft.set` when a stage tries to change a LOCKED field to a new value. */
export class LockViolationError extends Error {
  constructor(field, x, y) {
    super(`locked field "${field}" cannot be changed at (${x},${y})`);
    this.name = "LockViolationError";
    this.code = "lock_violation";
    this.field = field;
    this.x = x;
    this.y = y;
  }
}

/**
 * A mutable working copy of a BuildState. A stage NEVER mutates a BuildState directly — it goes
 * through a Draft, whose `set` enforces the prior state's locks at write time, then `commit`s a
 * fresh frozen BuildState. The committed state carries the source's `locked`/`lockLog` UNCHANGED:
 * locking a stage's contribution is the orchestrator's job on accept, not the stage's.
 */
class Draft {
  #cells;
  #locked;
  #width;
  #height;
  #lockLog;

  /** @param {BuildState} state */
  constructor(state) {
    // Shallow-clone the map and each touched cell so the source state is never mutated.
    this.#cells = new Map();
    for (const [k, cell] of state.cells) this.#cells.set(k, { ...cell });
    this.#locked = state.locked; // read-only use: locks are enforced against the source set
    this.#width = state.width;
    this.#height = state.height;
    this.#lockLog = state.lockLog;
  }

  /** Current draft cell at (x,y) (a copy of the default if never written). */
  get(x, y) {
    const cell = this.#cells.get(cellKey(x, y));
    return cell ? { ...cell } : defaultCell();
  }

  /**
   * Patch the cell at (x,y). For each field in `patch` whose new value differs from the current
   * draft value: if that field is LOCKED, throw `LockViolationError`; otherwise apply it. Writing
   * the same value to a locked field is a permitted no-op ("only add within bounds").
   * @param {number} x
   * @param {number} y
   * @param {Partial<Cell>} patch
   * @returns {Draft} this (chainable)
   */
  set(x, y, patch) {
    const key = cellKey(x, y);
    const current = this.#cells.get(key) ?? defaultCell();
    const next = { ...current };
    for (const field of FIELDS) {
      if (!(field in patch)) continue;
      const value = patch[field];
      if (value === current[field]) continue; // unchanged — no write, no lock check
      if (this.#locked.has(field)) throw new LockViolationError(field, x, y);
      next[field] = value;
    }
    this.#cells.set(key, next);
    return this;
  }

  /** Freeze a fresh BuildState from the draft. locked/lockLog carry from the source UNCHANGED. */
  commit() {
    return Object.freeze({
      width: this.#width,
      height: this.#height,
      cells: this.#cells,
      locked: this.#locked,
      lockLog: this.#lockLog,
    });
  }
}

/** Open a Draft over `state` (the only way to produce a successor BuildState by mutation). */
export function draftState(state) {
  return new Draft(state);
}

/**
 * Return a NEW BuildState with `fields` LOCKED under `stageName`. Unions `fields` into `locked` and
 * appends a `{stage, fields}` record to `lockLog` — but ONLY if `fields` is non-empty (a true no-op
 * stage that contributed nothing leaves no record). The source state is not mutated.
 * @param {BuildState} state
 * @param {string} stageName
 * @param {string[]} fields
 * @returns {BuildState}
 */
export function lockFields(state, stageName, fields) {
  if (fields.length === 0) return state;
  const locked = new Set(state.locked);
  for (const f of fields) locked.add(f);
  const lockLog = [...state.lockLog, { stage: stageName, fields: [...fields] }];
  return Object.freeze({ width: state.width, height: state.height, cells: state.cells, locked, lockLog });
}
