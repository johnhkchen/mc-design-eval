// Value-matched build snap (T-041-01, story S-041, epic E-14) — the BUILD END.
//
// THE CURE FOR VALUE DRIFT AT PLACEMENT TIME. E-13 measured that on angular forms the model names a
// block by HUE, the concept previews a HUE, and only the render exposes the block's true VALUE (L*) —
// the documented moai case: faithful form, but `gray_concrete` (L* ≈ 24) rendered far darker than the
// medium-gray the concept showed. T-039-01 pinned name→true-value (the value-honest card). This module
// wires that contract into the live build: after the model proposes the artifact, it re-chooses the
// BLOCK so each placement hits the CONCEPT'S REALIZED VALUE, not the model's name-by-hue.
//
// DIVISION OF LABOR (the whole point): the MODEL owns form + WHERE (it placed the masses and named the
// region's intent); the ENGINE owns WHICH BLOCK hits that region's value. So the build prompt does not
// change — this is a pure, post-build block substitution.
//
// THE SNAP (per distinct model-named block): hue-anchor → nearest realized cluster → its value-true
// block. (1) `resolveValueTruePalette([name])` gives the name's VALUE-HONEST Lab (a real block anchors
// on itself; an imaginary/non-cube name like `honey_block` anchors on the real block it resolves to).
// (2) `nearestLab` over the concept's REALIZED palette clusters routes that anchor to the realized
// region it most resembles (the bridge — there is no placement↔pixel mapping). (3) that cluster's
// value-true block (the extractor's discover-mode match — the real full-cube block nearest the realized
// color) becomes the block actually placed. Block choice is thus driven by `nearestLab` against the
// realized palette resolved through the S-039 contract.
//
// PURE, GL-FREE, NETWORK-FREE. The caller (the runner / the A/B script) extracts the realized palette
// from `concept.png` with `extractPaletteFromImage` (pngjs decode + arithmetic — no GL); this module
// only does table-anchored arithmetic on the already-extracted palette + the parsed artifact. So it
// runs under the `src/**/*.test.mjs` glob with nothing mocked, and the input artifact is never mutated.

import { nearestLab } from "./cielab.mjs";
import { resolveValueTruePalette, normalizeName } from "./value-palette.mjs";

/** Schema tag stamped on the returned report so downstream (S-042) can version-check it. */
export const VALUE_MATCHED_SCHEMA = "value-matched-build/v1";

const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Normalize the realized-palette input into `nearestLab` candidates. Accepts either a ready
 * `[{block, lab}]` array or an `extractPaletteFromImage` result (`{ palette:[{ block,
 * repColor:{lab} }] }`) — so the runner can pass the extractor's output verbatim.
 * @returns {{key:string, lab:number[]}[]}
 */
function toRealizedClusters(realized) {
  let items;
  if (Array.isArray(realized)) items = realized;
  else if (realized && Array.isArray(realized.palette)) items = realized.palette;
  else {
    throw new Error(
      "snapArtifactToValueTrue: realized palette must be [{block,lab}] or an extractPaletteFromImage result",
    );
  }
  const clusters = [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const key = it.block ?? it.key;
    const lab = it.lab ?? (it.repColor && it.repColor.lab);
    if (typeof key !== "string" || !Array.isArray(lab) || lab.length !== 3) {
      throw new Error(`snapArtifactToValueTrue: bad realized cluster ${JSON.stringify(it)}`);
    }
    clusters.push({ key, lab });
  }
  if (clusters.length === 0) {
    throw new Error("snapArtifactToValueTrue: realized palette is empty (no clusters to snap toward)");
  }
  return clusters;
}

/**
 * Ordered-unique normalized block names in an artifact: placement blocks first (application order),
 * then any manifest-only names. Throws if the artifact carries no block names at all.
 * @returns {string[]}
 */
function distinctNames(artifact) {
  const seen = new Set();
  const names = [];
  const add = (raw) => {
    if (typeof raw !== "string" || raw.trim() === "") return;
    const n = normalizeName(raw);
    if (!seen.has(n)) {
      seen.add(n);
      names.push(n);
    }
  };
  for (const p of artifact?.placements || []) add(p && p.block);
  for (const m of artifact?.palette?.manifest || []) add(m);
  if (names.length === 0) {
    throw new Error("snapArtifactToValueTrue: artifact has no placement/manifest block names to snap");
  }
  return names;
}

/** The value-honest anchor for a model-named block (via the S-039 contract). */
function anchorFor(name) {
  const c = resolveValueTruePalette([name]).card[0];
  return { valueHonest: c.block, lab: c.lab, valueHonestL: c.value };
}

/**
 * Snap an artifact's placements to value-true blocks against the concept's realized palette.
 *
 * @param {object} artifact  a parsed DesignArtifact (placements[].block, palette.manifest).
 * @param {{block:string,lab:number[]}[] | {palette:object[]}} realized  the concept's realized palette
 *   ([{block,lab}] or an `extractPaletteFromImage` result).
 * @param {{ methodId?: string }} [opts]  if given, stamps `metadata.prompting_method_id` on the CLONE.
 * @returns {{schema:string, artifact:object, swaps:object[], manifest:string[],
 *   changedPlacements:number, realizedUsed:{block:string,L:number}[]}}
 *   `artifact` is a CLONE (original never mutated); `swaps` is one row per distinct model-named block
 *   (the per-region "original name → value-true block" record); `changedPlacements` counts rewritten
 *   placements; `realizedUsed` echoes the clusters the snap chose among.
 */
export function snapArtifactToValueTrue(artifact, realized, opts = {}) {
  const clusters = toRealizedClusters(realized);
  const clusterL = new Map(clusters.map((c) => [c.key, c.lab[0]]));
  const names = distinctNames(artifact);

  const map = new Map(); // normalized model name -> value-true block id (bare)
  const swaps = [];
  for (const name of names) {
    const a = anchorFor(name);
    const hit = nearestLab(a.lab, clusters); // { key, deltaE, lab }
    const toL = round1(clusterL.get(hit.key));
    map.set(name, hit.key);
    swaps.push({
      name, // model's original block (normalized) — the "from"
      valueHonest: a.valueHonest, // its T-039-01 value-honest block (== name if real)
      valueHonestL: a.valueHonestL, // that block's true L*
      to: hit.key, // value-true block actually placed in .v2
      toL, // realized cluster L* (the value being matched)
      deltaE: round2(hit.deltaE), // ΔE(anchor → cluster) — how far the association reached
      valueShift: round1(toL - a.valueHonestL), // the value correction (the moai-drift number)
      changed: hit.key !== name, // placed block differs from the model's literal choice
    });
  }

  const snapped = structuredClone(artifact); // original never mutated
  let changedPlacements = 0;
  for (const p of snapped.placements || []) {
    const to = map.get(normalizeName(p.block));
    const ns = `minecraft:${to}`;
    if (ns !== p.block) changedPlacements++;
    p.block = ns;
  }
  // Rebuild the manifest from the rewritten placements (first-seen) — exactly the value-true blocks
  // actually placed, no stale declared-but-unused ids.
  const seenBlocks = new Set();
  const manifest = [];
  for (const p of snapped.placements || []) {
    if (!seenBlocks.has(p.block)) {
      seenBlocks.add(p.block);
      manifest.push(p.block);
    }
  }
  if (snapped.palette) snapped.palette.manifest = manifest;
  if (opts.methodId && snapped.metadata) snapped.metadata.prompting_method_id = opts.methodId;

  return {
    schema: VALUE_MATCHED_SCHEMA,
    artifact: snapped,
    swaps,
    manifest,
    changedPlacements,
    realizedUsed: clusters.map((c) => ({ block: c.key, L: round1(c.lab[0]) })),
  };
}
