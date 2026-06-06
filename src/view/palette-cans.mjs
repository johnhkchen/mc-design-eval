// The enforced palette — the "4 cans" (T-079-01, story S-079, epic E-23).
//
// The spray-paint tool exposes ONLY the design-doc manifest ∪ E-21 concept-justified additions. Off-
// palette paint must be STRUCTURALLY impossible, not merely measured — that is what killed the 91-block
// bloat by construction (`voxel-palette-must-be-design-doc`). Two mechanisms feed off one source of
// truth here: the splat snaps within this set (image-grid `whitelist`), and the LLM-refine path is
// gated against the same set. A concept material the build is MISSING may be ADDED BACK (E-21's
// concept-justified-growth right) — `withAdditions` extends the artifact manifest so AJV stays
// consistent when the allowed set grows.
//
// PURE — no GL, no I/O, no Date/random.

import { bareBlock } from "./occupancy.mjs";

/** Namespace a bare id back to `minecraft:` form for storage (manifest + placements are namespaced). */
function namespaced(id) {
  return typeof id === "string" && !id.includes(":") ? `minecraft:${id}` : id;
}

/**
 * The allowed paint palette: the design-doc manifest ∪ concept-justified additions, as BARE ids (so it
 * matches block-table keys and `bareBlock(cell.block)`). The membership oracle the splat + LLM-refine
 * both validate against. PURE.
 * @param {{palette?:{manifest?:string[]}}} artifact
 * @param {string[]} [additions]  concept materials to add back (bare or namespaced)
 * @returns {Set<string>} bare block ids
 */
export function allowedPalette(artifact, additions = []) {
  const manifest = artifact?.palette?.manifest ?? [];
  const set = new Set(manifest.map(bareBlock));
  for (const a of additions) set.add(bareBlock(a));
  return set;
}

/**
 * A shallow-cloned artifact whose `palette.manifest` is the union of the current manifest and
 * `additions` (namespaced, sorted, de-duplicated). Use when a concept material is added back so the
 * manifest matches the placements the paint will introduce — AJV stays consistent. Idempotent. Does
 * NOT validate (round-trip through `assertArtifact`). PURE.
 * @param {object} artifact
 * @param {string[]} additions
 * @returns {object} cloned artifact
 */
export function withAdditions(artifact, additions = []) {
  const current = artifact?.palette?.manifest ?? [];
  const union = new Set(current.map(namespaced));
  for (const a of additions) union.add(namespaced(a));
  const manifest = [...union].sort();
  return { ...artifact, palette: { ...(artifact.palette ?? {}), manifest } };
}

/**
 * Null out any target-grid cell whose block is off-palette — a defensive gate for the LLM-refine path
 * (the splat's `whitelist` already guarantees adherence, but a model proposal does not). Returns a new
 * grid plus tallies. PURE.
 * @param {(string|null)[][]} targetGrid  per-cell block ids (bare or namespaced) or null
 * @param {Set<string>} allowed  bare ids from {@link allowedPalette}
 * @returns {{grid:(string|null)[][], kept:number, dropped:number}}
 */
export function filterToPalette(targetGrid, allowed) {
  let kept = 0;
  let dropped = 0;
  const grid = targetGrid.map((row) =>
    row.map((cell) => {
      if (cell == null) return null;
      if (allowed.has(bareBlock(cell))) { kept++; return cell; }
      dropped++;
      return null;
    }),
  );
  return { grid, kept, dropped };
}
