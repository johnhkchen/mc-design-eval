// GATED SECONDARY PALETTE — E-18 rung augmentation (T-058-03, story S-058, epic E-18).
//
// The E-18 palette fix (paletteFromManifest, commit 62dadc4) locked the GLB-voxel colour picker to the
// DESIGN-DOC manifest — the few blocks the model deliberately chose — instead of snapping over the full
// 305-block table. That killed speckle/bloat (heart 91 → 5 blocks). But a tight primary palette can
// OVER-CONSTRAIN: a TRELLIS texture sometimes carries a genuine colour the design doc never anticipated,
// and forcing it onto the nearest of the 5 design-doc blocks creates large SNAP DRIFT (high ΔE → an
// inaccurate surface). This module adds a STRICTLY GATED secondary palette: at most K extra blocks from
// the full value-true table, brought in ONLY when they are a super-great fit that greatly cuts the drift.
// The primary stays the design-doc palette; the secondary is a high-bar augmentation — NOT a return to
// snapping over the universe. Most subjects add 0.
//
// PURITY: GL-free. Takes an ALREADY-DECODED texture (the runners decode once and share it). No GLB/WebP/
// network. REUSE, NOT REIMPLEMENTATION: clusters come from E-10 (aggregateForeground + medianCutLab),
// the two ΔE queries from the portable engine (nearestLab/deltaE/srgbToLab), the table from S-019
// (loadBlockTable). No new colour math. MUST NOT import glb-voxel-build (that would cycle — material-
// segment and glb-voxel-build both import THIS module).

import { aggregateForeground, medianCutLab, DEFAULTS as EXTRACT_DEFAULTS } from "../color/palette-extract.mjs";
import { nearestLab } from "../color/cielab.mjs";
import { loadBlockTable } from "../color/block-table.mjs";

/**
 * The gates + cap (design.md Decision 3). All ΔE in the CIE76 space the whole stack uses. Named, tunable.
 *   k             — median-cut cluster count over the texture's actual colours
 *   driftThreshold — "underserved": min ΔE to the design-doc palette must exceed this to qualify
 *   minCoverage   — "real": cluster's surface share must be ≥ this (not stray voxels)
 *   fitThreshold  — "super-great fit": the candidate table block must be within this ΔE of the cluster
 *   gainThreshold — "big win": (primaryΔE − tableΔE) must be ≥ this (greatly cuts the drift)
 *   K             — cap on added secondary blocks (most subjects add 0)
 */
export const AUGMENT_DEFAULTS = Object.freeze({
  k: 8,
  driftThreshold: 12,
  minCoverage: 0.05,
  fitThreshold: 6,
  gainThreshold: 6,
  K: 2,
});

/** The full value-true table as a `nearestLab` palette. Inlined (NOT blockPaletteFromTable — that lives
 *  in glb-voxel-build, importing it here would cycle). */
function tablePalette(table) {
  if (!table || !Array.isArray(table.blocks) || table.blocks.length === 0) {
    throw new Error("augmentPalette: table.blocks must be a non-empty array");
  }
  return table.blocks.map((b) => ({ key: b.block, lab: b.lab }));
}

/**
 * The rich computation behind {@link augmentPalette}: cluster the texture → score each cluster against the
 * design-doc palette and the full table → keep only clusters that pass ALL four gates and whose best table
 * block is not already in the primary → rank by `gain × coverage`, dedupe, cap at K → merge. PURE.
 *
 * @param {{key:string, lab:number[]}[]} designDocPalette  the primary (design-doc manifest) palette
 * @param {{width:number,height:number,data:Uint8Array|Buffer}} texture  decoded baseColor atlas
 * @param {{blocks:{block:string,lab:number[]}[]}} [table]  the full value-true table
 * @param {{ k?:number, driftThreshold?:number, minCoverage?:number, fitThreshold?:number,
 *           gainThreshold?:number, K?:number, dropColor?:number[]|null, dropTolerance?:number,
 *           alphaThreshold?:number }} [opts]
 * @returns {{ palette:{key:string,lab:number[]}[], secondary:{key:string,lab:number[]}[],
 *             added:object[], candidates:object[], meanSnapBefore:number, meanSnapAfter:number,
 *             foregroundPx:number }}
 */
export function augmentReport(designDocPalette, texture, table = loadBlockTable(), opts = {}) {
  if (!Array.isArray(designDocPalette) || designDocPalette.length === 0) {
    throw new Error("augmentPalette: designDocPalette must be a non-empty array of {key,lab}");
  }
  const o = { ...AUGMENT_DEFAULTS, ...opts };
  const primary = designDocPalette;
  const empty = {
    palette: primary.slice(),
    secondary: [],
    added: [],
    candidates: [],
    meanSnapBefore: 0,
    meanSnapAfter: 0,
    foregroundPx: 0,
  };

  const aggOpts = {
    dropColor: o.dropColor !== undefined ? o.dropColor : EXTRACT_DEFAULTS.dropColor,
    dropTolerance: o.dropTolerance !== undefined ? o.dropTolerance : EXTRACT_DEFAULTS.dropTolerance,
    alphaThreshold: o.alphaThreshold !== undefined ? o.alphaThreshold : EXTRACT_DEFAULTS.alphaThreshold,
  };
  const { points, foregroundPx } = aggregateForeground(texture, aggOpts);
  if (foregroundPx === 0) return empty;

  const clusters = medianCutLab(points, o.k);
  const tbl = tablePalette(table);
  const primaryKeys = new Set(primary.map((e) => e.key));

  // Score every cluster (kept for an honest "considered but rejected" trail in the record).
  const candidates = clusters.map((c) => {
    const coverage = c.count / foregroundPx;
    const primaryDeltaE = nearestLab(c.lab, primary).deltaE;
    const best = nearestLab(c.lab, tbl);
    const gain = primaryDeltaE - best.deltaE;
    const qualifies =
      primaryDeltaE > o.driftThreshold && // underserved
      coverage >= o.minCoverage && // real
      best.deltaE <= o.fitThreshold && // super-great fit
      gain >= o.gainThreshold && // big win
      !primaryKeys.has(best.key); // not already in the design-doc palette
    return { key: best.key, lab: best.lab, coverage, primaryDeltaE, tableDeltaE: best.deltaE, gain, clusterLab: c.lab, qualifies };
  });

  // Rank qualifiers by gain × coverage (desc), tie-break coverage (desc) then key (asc) — deterministic.
  const ranked = candidates
    .filter((c) => c.qualifies)
    .sort((a, b) => b.gain * b.coverage - a.gain * a.coverage || b.coverage - a.coverage || (a.key < b.key ? -1 : 1));

  const added = [];
  const takenKeys = new Set();
  for (const c of ranked) {
    if (takenKeys.has(c.key)) continue; // two clusters → one block; keep the higher rank
    takenKeys.add(c.key);
    added.push(c);
    if (added.length >= o.K) break;
  }

  const secondary = added.map((c) => ({ key: c.key, lab: c.lab }));
  const palette = [...primary, ...secondary];

  // Drift removed (coverage-weighted mean over the texture's colour distribution; Σcoverage = 1).
  let meanSnapBefore = 0;
  let meanSnapAfter = 0;
  for (const c of candidates) {
    meanSnapBefore += c.coverage * c.primaryDeltaE;
    meanSnapAfter += c.coverage * nearestLab(c.clusterLab, palette).deltaE;
  }

  return { palette, secondary, added, candidates, meanSnapBefore, meanSnapAfter, foregroundPx };
}

/**
 * The gated-secondary-palette augmentation (the AC-named entry point): the design-doc palette UNION at
 * most K table blocks that are a super-great fit for an underserved, meaningful texture colour. PURE,
 * GL-free. Returns the merged `{key,lab}[]` to snap within — pass it where the design-doc palette went.
 * @param {{key:string, lab:number[]}[]} designDocPalette
 * @param {{width:number,height:number,data:Uint8Array|Buffer}} texture  decoded baseColor atlas
 * @param {{blocks:{block:string,lab:number[]}[]}} [table]
 * @param {object} [opts] see {@link AUGMENT_DEFAULTS}
 * @returns {{key:string, lab:number[]}[]}
 */
export function augmentPalette(designDocPalette, texture, table = loadBlockTable(), opts = {}) {
  return augmentReport(designDocPalette, texture, table, opts).palette;
}
