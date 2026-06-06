// Per-subject form-type ROUTING for GLB voxelization (T-065-01, story S-065, epic E-19).
//
// T-059 added thin-feature voxelization (`voxelizeGlbThin`): it ADDS the surface/shell cells the plain
// solid fill (`voxelizeGlb`, E-16) misses, recovering thin members (bow string, koi fins). E-18's combined
// build ran it on ALL 7 subjects and found the documented trade — thin HELPS thin/organic forms but
// OVER-THICKENS already-solid ones (dancing-man form IoU −0.10, moai −0.166, …) and ~doubles their
// occupancy (spurious bulk = a cleanliness cost). The routing rule was NAMED but never WIRED:
//   thin/organic → voxelizeGlbThin ;  solid/bulky → voxelizeGlb.
// This module wires it — NO new algorithm, just a subject-keyed tag + a selector picking the right
// EXISTING voxelizer. The empirical boundary lives in e18-scorecard.mjs `classifyRouting` (the sign of
// E18−R1 form Δ per subject); this is its forward, reviewed form.
//
// PURE — no GL, no I/O — so it runs under the `src/**/*.test.mjs` glob. `selectVoxelizer` returns the
// ACTUAL voxelizer function (not a string) so a caller keeps the `voxelizer(glb, {scale})` shape and a
// test can assert identity (`=== voxelizeGlbThin`).

import { voxelizeGlb } from "./glb-voxelize.mjs";
import { voxelizeGlbThin } from "./glb-thin.mjs";

/**
 * The canonical per-subject form-type tag — ONE source of truth (the runners' duplicated SUBJECTS lists
 * consume this rather than each carrying a column). Keys are the `glb-voxel-breadth.mjs` subject keys.
 *
 * thin = {bow-and-arrow, koi} — clearly helped by the thin pass (form IoU +0.053 / +0.084 at scale 32).
 * solid = the rest. NOTE on **heart**: the spine shows the thin pass marginally HELPED it (+0.018), but
 * it is tagged SOLID deliberately — heart is a bulky organ (only the aortic arch is thin-ish), and routing
 * it solid trades that +0.018 marginal form gain for a 27% occupancy drop (7982→5840 cells) and less
 * spurious bulk (the story's cleanliness goal). The routing report records this as the one deliberate
 * trade, not a "recovery".
 * @type {Readonly<Record<string, "thin"|"solid">>}
 */
export const FORM_TYPE = Object.freeze({
  "bow-and-arrow": "thin",
  "koi": "thin",
  "dancing-man": "solid",
  "moai": "solid",
  "pineapple": "solid",
  "mushroom": "solid",
  "heart": "solid",
});

/** An untagged subject defaults to SOLID — the conservative choice: plain voxelize never over-thickens,
 *  so an unknown subject is treated as bulky rather than silently shelled. */
export const DEFAULT_FORM_TYPE = "solid";

/**
 * The form-type tag for a subject key. PURE. Unknown / non-string → DEFAULT_FORM_TYPE.
 * @param {string} subject
 * @returns {"thin"|"solid"}
 */
export function formTypeOf(subject) {
  const key = typeof subject === "string" ? subject.trim() : "";
  return FORM_TYPE[key] ?? DEFAULT_FORM_TYPE;
}

/**
 * Pick the voxelizer a subject should use. PURE. Returns the ACTUAL function reference:
 * `voxelizeGlbThin` for a thin-tagged subject, `voxelizeGlb` for solid / unknown.
 * @param {string} subject
 * @returns {typeof voxelizeGlbThin | typeof voxelizeGlb}
 */
export function selectVoxelizer(subject) {
  return formTypeOf(subject) === "thin" ? voxelizeGlbThin : voxelizeGlb;
}

/**
 * Convenience: voxelize a GLB through the routed voxelizer for `subject`. Both voxelizers accept
 * `{ scale }` with the same default, so the call site is uniform. PURE (delegates to the chosen voxelizer).
 * @param {Uint8Array|ArrayBuffer|Buffer} glb
 * @param {{ subject: string, scale?: number }} opts
 * @returns {ReturnType<typeof voxelizeGlb>}
 */
export function voxelizeRouted(glb, { subject, scale } = {}) {
  return selectVoxelizer(subject)(glb, scale == null ? {} : { scale });
}
