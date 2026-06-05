// Staged-sculptor material-noise pass — seed craft pass A (T-027-01, epic E-11 / story S-027).
//
// "Fake shading through materials." Over the LOCKED massing (the gray proportion shell), assign each
// surface a SAME-HUE block *set* of 2–3 real blocks (the run-015 effect: mix stone/cobble/stone_bricks
// for depth and age) with a noise mix, and VARY the choice across height so light breaks differently
// top to bottom. Writes `material`; locks it. Leaves the locked `occupied` (and `relief`) untouched —
// the proof that "improve" is additive: the silhouette can't move, only its skin gains texture.
//
// THIS IS THE E-10 COUPLING S-027 CALLS FOR. The hue-family set is an upgrade of E-10's single-block
// match (`nearestLab`) to a k-nearest *set*: rank the survival block→Lab table by the engine's ΔE and
// keep the nearest few WITHIN a ΔE radius (same hue, varied lightness). The portable color core
// (cielab.mjs) stays untouched — we only consume its `deltaE`/`srgbToLab` and the runtime block table.
//
// NAMESPACE BOUNDARY (load-bearing). The block table's keys are BARE (`stone`); the AJV gate requires
// NAMESPACED ids (`minecraft:stone`, pattern `^[a-z0-9_.-]+:[a-z0-9_]+$`). So we strip the namespace
// when looking a target up in the table (`tableKey`) and add it back when writing `material`
// (`blockId`). Conform to the live schema or renders fail.
//
// NOISE IS DETERMINISTIC — a pure function of (x,y). No Math.random, so renders reproduce and tests
// are stable. Height drives a light-break gradient (bottom = darkest set member, top = lightest); a
// per-cell hash jitters the pick by a modest `spread` so the field reads textured, not striped.
//
// BOUNDARIES: imports the spine (orchestrator, build-state, compile) and the E-10 engine + table. No
// SDK, no I/O, no render, no schema import. The AJV gate validates the compiled output in tests.

import { defineStage, runStages } from "./orchestrator.mjs";
import { occupiedCells } from "./build-state.mjs";
import { toDesignArtifact } from "./compile.mjs";
import { MASSING_BLOCK } from "./massing.mjs";
import { srgbToLab, deltaE } from "../color/cielab.mjs";
import { loadBlockTable } from "../color/block-table.mjs";

/** The committed block→Lab table, loaded once (runtime path; zero asset deps). The hue-family pool. */
const TABLE = loadBlockTable();

/** Tunables for the set and the noise. Modest `spread` keeps color fields clean (ticket guidance). */
export const DEFAULTS = Object.freeze({ size: 3, spread: 0.7, radius: 6 });

/** The style stamped on a compiled material-noise build. */
export const MATERIAL_STYLE = Object.freeze({
  name: "material-noise",
  rationale:
    "Same-hue block set per surface, varied by height — texture/age and a light break without " +
    "changing the silhouette.",
});

// --- namespace helpers (the bare-table-key ↔ namespaced-artifact-id boundary) ---

/** Strip a leading `namespace:` so a block id or bare key both reduce to the table's bare key. */
export function tableKey(id) {
  return typeof id === "string" ? id.replace(/^[a-z0-9_.-]+:/, "") : id;
}

/** Add `minecraft:` if the key carries no namespace (artifacts require namespaced ids). */
export function blockId(key) {
  return /:/.test(key) ? key : `minecraft:${key}`;
}

// --- hue-family set (nearest block + its near neighbours in Lab, via the E-10 engine) ---

/** Resolve a target (block id | rgb triple | {lab}/{rgb}) to a Lab triple. Throws on an unknown id. */
function resolveTargetLab(target) {
  if (typeof target === "string") {
    const k = tableKey(target);
    const b = TABLE.blocks.find((e) => e.block === k);
    if (!b) throw new Error(`hueFamilySet: unknown block "${target}" (not in the block→Lab table)`);
    return b.lab;
  }
  if (Array.isArray(target) && target.length === 3) return srgbToLab(target);
  if (target && Array.isArray(target.lab)) return target.lab;
  if (target && Array.isArray(target.rgb)) return srgbToLab(target.rgb);
  throw new Error(
    `hueFamilySet: target must be a block id, rgb triple, or {lab}/{rgb} — got ${JSON.stringify(target)}`,
  );
}

/**
 * The same-hue block SET for a target: the nearest block AND its near neighbours in Lab. Ranks the
 * survival block table by the engine's `deltaE`, keeps the nearest `size` WITHIN `radius` ΔE (so the
 * set stays one hue family — a sparse neighbourhood yields a smaller set rather than reaching for a
 * far, off-hue block), and always keeps ≥1 (the nearest, even past the radius). Returned NAMESPACED
 * and ordered DARK→LIGHT by Lab L*, so height can map to lightness in `pickMaterial`.
 * @param {string|[number,number,number]|{lab?:number[],rgb?:number[]}} target
 * @param {{size?:number, radius?:number}} [opts]
 * @returns {string[]}  2–3 namespaced block ids (fewer only if the neighbourhood is sparse)
 */
export function hueFamilySet(target, opts = {}) {
  const size = opts.size ?? DEFAULTS.size;
  const radius = opts.radius ?? DEFAULTS.radius;
  const targetLab = resolveTargetLab(target);
  const ranked = TABLE.blocks
    .map((b) => ({ block: b.block, lab: b.lab, d: deltaE(targetLab, b.lab) }))
    .sort((a, b) => a.d - b.d);
  let kept = ranked.filter((r) => r.d <= radius).slice(0, size);
  if (kept.length === 0) kept = [ranked[0]]; // a far target still gets its single nearest block
  kept.sort((a, b) => a.lab[0] - b.lab[0]); // dark → light by L*
  return kept.map((r) => blockId(r.block));
}

// --- deterministic per-cell noise + height-driven selection ---

/**
 * A deterministic hash of a cell position to [0,1). xorshift avalanche so neighbouring cells differ.
 * Pure — no Math.random, so the field reproduces across runs.
 * @param {number} x @param {number} y @returns {number} in [0,1)
 */
export function cellHash(x, y) {
  let h = (Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) | 0;
  h ^= h << 13;
  h ^= h >>> 17;
  h ^= h << 5;
  return (h >>> 0) / 2 ** 32;
}

/**
 * Pick a set member for a cell: the selection CENTER tracks height (`t` 0=bottom→darkest,
 * 1=top→lightest) and a per-cell hash `h` jitters it by `spread`. Clamped to the set. With a small
 * `spread` the field is mostly the height-appropriate block (clean light break) with texture at the
 * band edges; a bigger `spread` mixes more.
 * @param {string[]} set  ordered dark→light @param {number} t in [0,1] @param {number} h in [0,1)
 * @param {number} spread @returns {string}
 */
export function pickMaterial(set, t, h, spread) {
  const S = set.length;
  if (S === 1) return set[0];
  const center = t * (S - 1);
  let idx = Math.round(center + (h - 0.5) * 2 * spread);
  if (idx < 0) idx = 0;
  else if (idx > S - 1) idx = S - 1;
  return set[idx];
}

// --- surfaces ---

/** The dominant block of a target palette: first id, or the highest-coverage entry if objects. */
function dominantBlock(palette) {
  if (!Array.isArray(palette) || palette.length === 0) return null;
  if (typeof palette[0] === "string") return palette[0];
  let best = palette[0];
  for (const p of palette) if ((p.coveragePct ?? 0) > (best.coveragePct ?? 0)) best = p;
  return best.block;
}

/** A region spec → predicate. Missing region claims all remaining cells; a `[[x,y],…]` list or a
 *  `(x,y)→bool` predicate claim explicitly. */
function regionPredicate(region) {
  if (region == null) return () => true;
  if (typeof region === "function") return region;
  if (Array.isArray(region)) {
    const set = new Set(region.map(([x, y]) => `${x},${y}`));
    return (x, y) => set.has(`${x},${y}`);
  }
  return () => false;
}

/**
 * Partition the occupied cells into surfaces, each carrying its hue-family set and spread. Explicit
 * `intent.material.surfaces` claim cells first (in order); whatever is left forms one default surface
 * targeting the palette's dominant block (or the massing gray as a fallback).
 */
function resolveSurfaces(state, intent) {
  const mi = (intent && intent.material) || {};
  const size = mi.size ?? DEFAULTS.size;
  const radius = mi.radius ?? DEFAULTS.radius;
  const spread = mi.spread ?? DEFAULTS.spread;
  const defaultTarget = dominantBlock(mi.palette) ?? MASSING_BLOCK;
  const all = occupiedCells(state).map(({ x, y }) => ({ x, y }));
  const claimed = new Set();
  const key = (x, y) => `${x},${y}`;
  const surfaces = [];

  if (Array.isArray(mi.surfaces)) {
    for (const s of mi.surfaces) {
      const pred = regionPredicate(s.region);
      const cells = all.filter(({ x, y }) => !claimed.has(key(x, y)) && pred(x, y));
      cells.forEach(({ x, y }) => claimed.add(key(x, y)));
      surfaces.push({
        cells,
        set: hueFamilySet(s.target ?? defaultTarget, { size: s.size ?? size, radius: s.radius ?? radius }),
        spread: s.spread ?? spread,
      });
    }
  }
  const rest = all.filter(({ x, y }) => !claimed.has(key(x, y)));
  if (rest.length > 0) {
    surfaces.push({ cells: rest, set: hueFamilySet(defaultTarget, { size, radius }), spread });
  }
  return surfaces;
}

// --- the stage + convenience ---

/**
 * The material-noise Stage: write a same-hue, height-varied `material` on every occupied cell. Reads
 * the target palette / per-surface targets from `intent.material` (see resolveSurfaces). Touches ONLY
 * `material` on ONLY occupied cells — `occupied` (locked) and `relief` are never written.
 * @param {object} [intent]  closure intent; the runStages intent (if it carries `.material`) wins
 * @returns {{name:string, apply:Function}}
 */
export function materialStage(intent = {}) {
  return defineStage({
    name: "material",
    run: (draft, intentArg, prev) => {
      const useIntent = intentArg && intentArg.material ? intentArg : intent;
      const occ = occupiedCells(prev);
      let minY = Infinity;
      let maxY = -Infinity;
      for (const { y } of occ) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      const span = maxY - minY;
      for (const surf of resolveSurfaces(prev, useIntent)) {
        for (const { x, y } of surf.cells) {
          const t = span === 0 ? 0 : (y - minY) / span;
          draft.set(x, y, { material: pickMaterial(surf.set, t, cellHash(x, y), surf.spread) });
        }
      }
    },
  });
}

/**
 * Run the material-noise pass over a (massing-locked) state, locking `material` on accept.
 * @param {import("./build-state.mjs").BuildState} state  a massing-locked state
 * @param {object} [intent]  `{ material: { palette?, surfaces?, size?, spread?, radius? } }`
 * @returns {import("./build-state.mjs").BuildState}
 */
export function material(state, intent = {}) {
  return runStages(state, [materialStage(intent)], intent);
}

/**
 * Compile a material-painted state to a `DesignArtifact`. The manifest derives from the blocks
 * actually placed — a fully painted surface yields the multi-entry hue-family manifest. Pure (callers
 * validate via src/artifact.mjs). `defaultBlock` only covers an occupied-but-unpainted cell.
 * @param {import("./build-state.mjs").BuildState} state @param {Object} [opts]
 * @returns {import("../artifact.mjs").DesignArtifact}
 */
export function compileMaterial(state, opts = {}) {
  return toDesignArtifact(state, { style: MATERIAL_STYLE, ...opts });
}
