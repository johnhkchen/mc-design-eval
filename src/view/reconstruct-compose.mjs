// Reconstruction delta-composition — T-106-01 (story S-106, epic E-27).
//
// The T-104 roof program and the T-105 shaped heads each rebuilt the SAME T-102 regularized shell
// independently (both runners pin `regularize/<subj>/artifact.json` by sha256). Component-aware
// skinning needs ONE reconstructed shell carrying both. This module is the pure composition core:
// diff each reconstruction against the shared base, assert the edit sets are DISJOINT, apply both.
//
// Disjointness is a TRIPWIRE, not a merge policy (D1, design.md): the roof delta lives in the
// carved band above the eaves, the shaped delta in opening heads/jambs in the walls — an overlap
// means the two reconstructions disagree about a cell, which is a geometry fact a human must see.
// There is deliberately no precedence rule to hide it under.
//
// Cell identity is the WHOLE write — block id as written plus its block-state map (a
// `spruce_planks` → `spruce_stairs[facing=north]` change is a change of both). Forms are never
// diffed: form class is DERIVED from the block id at occupancy time (src/form/kit.mjs), so block
// equality implies form equality.
//
// PURE — no I/O, no Date/random; runs under the `src/**/*.test.mjs` glob. Artifact emission reuses
// `rebuildArtifact` (shell-integrity's canonical y,z,x ordering + state carry) so a composed
// artifact serializes deterministically — the runners' double-run sha256 asserts depend on it.

import { artifactOccupancy } from "./occupancy.mjs";
import { rebuildArtifact } from "./shell-integrity.mjs";

export const RECONSTRUCT_SCHEMA = "reconstruct-compose/v1";

/** Stable signature of one cell's write: block id as written + canonicalized state map. */
function cellSig(block, state) {
  if (state === undefined || state === null) return block;
  const keys = Object.keys(state).sort();
  return `${block}[${keys.map((k) => `${k}=${state[k]}`).join(",")}]`;
}

function entryOf(occ, key) {
  const block = occ.cells.get(key);
  if (block === undefined) return null;
  const state = occ.states.get(key);
  return state === undefined ? { block } : { block, state };
}

/**
 * Cell-level diff of a reconstruction against its base occupancy.
 * @param {import("./occupancy.mjs").Occupancy} baseOcc
 * @param {import("./occupancy.mjs").Occupancy} reconOcc
 * @returns {{changed:{key:string, from:{block:string,state?:object}, to:{block:string,state?:object}}[],
 *            added:{key:string, to:{block:string,state?:object}}[],
 *            removed:{key:string, from:{block:string,state?:object}}[],
 *            size:number}}
 */
export function occupancyDelta(baseOcc, reconOcc) {
  const changed = [];
  const added = [];
  const removed = [];
  for (const [key] of reconOcc.cells) {
    const to = entryOf(reconOcc, key);
    const from = entryOf(baseOcc, key);
    if (from === null) added.push({ key, to });
    else if (cellSig(from.block, from.state) !== cellSig(to.block, to.state)) changed.push({ key, from, to });
  }
  for (const [key] of baseOcc.cells) {
    if (!reconOcc.cells.has(key)) removed.push({ key, from: entryOf(baseOcc, key) });
  }
  // deterministic order regardless of Map insertion history
  const byKey = (a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  changed.sort(byKey);
  added.sort(byKey);
  removed.sort(byKey);
  return { changed, added, removed, size: changed.length + added.length + removed.length };
}

/** Every cell key a delta touches (changed ∪ added ∪ removed). */
export function deltaKeys(delta) {
  const keys = new Set();
  for (const list of [delta.changed, delta.added, delta.removed]) for (const e of list) keys.add(e.key);
  return keys;
}

/**
 * Compose named reconstruction deltas onto a base artifact. Deltas must be pairwise DISJOINT —
 * any shared cell THROWS with both names and sample keys (no precedence rule, by design). An empty
 * delta list returns a rebuild of the base itself: byte-identical placements (the graceful-fallback
 * passthrough the AC names). Does NOT validate — callers run assertArtifact (round-trip pattern).
 * @param {object} baseArtifact schema-valid design artifact (the pinned regularized shell)
 * @param {{name:string, delta:ReturnType<typeof occupancyDelta>}[]} deltas
 * @returns {{artifact:object, touched:Set<string>,
 *            stats:{perDelta:{name:string, changed:number, added:number, removed:number}[], cells:number}}}
 */
export function composeReconstruction(baseArtifact, deltas = []) {
  for (const d of deltas) {
    if (!d || typeof d.name !== "string" || !d.delta) {
      throw new Error("composeReconstruction: each delta must be {name:string, delta:occupancyDelta}");
    }
  }
  // pairwise disjointness — the tripwire
  const owner = new Map(); // key → delta name
  for (const d of deltas) {
    for (const key of deltaKeys(d.delta)) {
      const prior = owner.get(key);
      if (prior !== undefined && prior !== d.name) {
        const overlap = [...deltaKeys(d.delta)].filter((k) => owner.get(k) !== undefined && owner.get(k) !== d.name);
        throw new Error(
          `composeReconstruction: deltas "${prior}" and "${d.name}" overlap on ${overlap.length} cell(s) — ` +
          `the reconstructions disagree; first keys: ${overlap.slice(0, 20).join(" ")}`
        );
      }
      owner.set(key, d.name);
    }
  }
  const occ = artifactOccupancy(baseArtifact);
  const cells = new Map(); // key → {block, state?}
  for (const [key] of occ.cells) cells.set(key, entryOf(occ, key));
  for (const d of deltas) {
    for (const e of d.delta.removed) cells.delete(e.key);
    for (const e of d.delta.changed) cells.set(e.key, e.to);
    for (const e of d.delta.added) cells.set(e.key, e.to);
  }
  // rebuild via the canonical emitter (ordering + state carry + manifest recompute)
  const composedOcc = {
    size: cells.size,
    cells: new Map([...cells].map(([k, v]) => [k, v.block])),
    states: new Map([...cells].filter(([, v]) => v.state !== undefined && v.state !== null).map(([k, v]) => [k, v.state])),
  };
  const artifact = rebuildArtifact(composedOcc, baseArtifact);
  return {
    artifact,
    touched: new Set(owner.keys()),
    stats: {
      perDelta: deltas.map((d) => ({
        name: d.name,
        changed: d.delta.changed.length,
        added: d.delta.added.length,
        removed: d.delta.removed.length,
      })),
      cells: owner.size,
    },
  };
}
