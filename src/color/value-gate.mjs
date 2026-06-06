// Concept↔render Δvalue feedback gate (T-042-01, story S-042, epic E-14) — the MEASUREMENT end.
//
// THE TERMINAL LINK of the co-design loop. T-040 made the concept preview real block VALUES; T-041 made
// the build PLACE value-true blocks. This module asks the question that gates both: after the model
// proposes and the engine snaps, **how far is what we BUILT from what the concept PREVIEWED?** It scores
// a build's realized palette against the concept's realized palette in CIE-Lab and flags drift over a
// threshold — the same value-drift signal E-13 could only see *after* the render, now a number computed
// up front. Before value-matching the gap is the documented surprise (moai `gray_concrete` far darker
// than the concept showed); after, it should close — the gate measures that closure and catches a regression.
//
// THE RENDER-SIDE PROXY (segmentation-free): a render PNG is dominated by the viewer scene (sky/floor
// match to `glass` ~79%), so a palette extracted straight from it is background noise, not the sculpture.
// But by T-039's table invariant — the table holds only real, survival, full-cube, untinted blocks, so a
// real full-cube block RENDERS AS ITSELF — the build's realized values are exactly the placed manifest at
// its value-true Lab. So `realizedPaletteFromArtifact` is a faithful, deterministic, GL-free stand-in for
// "what the render shows", weighted by how many placements use each block. No segmentation required.
//
// PURE, GL-FREE, NETWORK-FREE. Reuses E-10's ΔE core (cielab.mjs `nearestLab`/`deltaE`), the S-039
// contract (value-palette.mjs `resolveValueTruePalette`), and the categorical partition (image-grid.mjs
// `comparePalettes`). ZERO new color math. It only reads the committed table (via its imports) and does
// arithmetic on already-parsed artifacts/palettes, so it runs under `src/**/*.test.mjs` with nothing
// mocked, and never mutates its inputs.

import { nearestLab, deltaE } from "./cielab.mjs";
import { comparePalettes } from "./image-grid.mjs";
import { resolveValueTruePalette, normalizeName } from "./value-palette.mjs";

/** Schema tag stamped on the gate result so downstream (the A/B report) can version-check it. */
export const VALUE_GATE_SCHEMA = "value-gate/v1";

/**
 * Default flag threshold: mean ΔE (CIE76) over the realized palette. 6 sits just above the extractor's
 * own per-cell residual on these concepts (~3–7) and near the "noticeable at a glance" band. Tunable.
 */
export const DEFAULT_VALUE_GATE_THRESHOLD = 6;

const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

// --- the render-side proxy -------------------------------------------------

/**
 * The build's realized palette: the placed manifest at its **value-true Lab**, weighted by placement
 * count. By the T-039 table invariant a real full-cube block renders as itself, so this is the
 * segmentation-free stand-in for the render's realized values (see module header).
 *
 * Counts `artifact.placements[].block` by normalized name; resolves the distinct names through the S-039
 * contract (`resolveValueTruePalette`) to their true rendered Lab/L*. Falls back to `palette.manifest`
 * (uniform weight) when an artifact has no placements. Order is first-seen.
 * @param {object} artifact  a parsed DesignArtifact
 * @returns {{block:string, lab:number[], value:number, count:number, weight:number}[]}
 */
export function realizedPaletteFromArtifact(artifact) {
  const counts = new Map(); // normalized name -> count, first-seen order
  for (const p of artifact?.placements || []) {
    if (!p || typeof p.block !== "string" || p.block.trim() === "") continue;
    const n = normalizeName(p.block);
    counts.set(n, (counts.get(n) || 0) + 1);
  }
  // Fallback: manifest-only artifact (no placements) — each declared block counts once.
  if (counts.size === 0) {
    for (const m of artifact?.palette?.manifest || []) {
      if (typeof m !== "string" || m.trim() === "") continue;
      const n = normalizeName(m);
      if (!counts.has(n)) counts.set(n, 1);
    }
  }
  const names = [...counts.keys()];
  if (names.length === 0) {
    throw new Error("realizedPaletteFromArtifact: artifact has no placement/manifest block names");
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const { card } = resolveValueTruePalette(names); // first-seen order, aligned to `names`
  const byName = new Map(card.map((c) => [c.name, c]));
  return names.map((name) => {
    const c = byName.get(name);
    const count = counts.get(name);
    return { block: c.block, lab: c.lab, value: c.value, count, weight: count / total };
  });
}

// --- reference (concept side) ----------------------------------------------

/**
 * Normalize the concept-side reference into `nearestLab` candidates. Accepts either an
 * `extractPaletteFromImage` result (`{ palette:[{ block, repColor:{lab}, coverage|pct }] }`) or a ready
 * `[{ block|key, lab, weight? }]` array — so a caller can pass the extractor's output verbatim.
 * @returns {{key:string, block:string, lab:number[], weight:number}[]}
 */
export function toReferenceClusters(reference) {
  let items;
  if (Array.isArray(reference)) items = reference;
  else if (reference && Array.isArray(reference.palette)) items = reference.palette;
  else {
    throw new Error(
      "valueGate: reference must be [{block,lab}] or an extractPaletteFromImage result",
    );
  }
  const clusters = [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const key = it.block ?? it.key;
    const lab = it.lab ?? (it.repColor && it.repColor.lab);
    const weight = it.weight ?? it.coverage ?? it.pct ?? 1;
    if (typeof key !== "string" || !Array.isArray(lab) || lab.length !== 3) {
      throw new Error(`valueGate: bad reference cluster ${JSON.stringify(it)}`);
    }
    clusters.push({ key, block: key, lab, weight });
  }
  if (clusters.length === 0) {
    throw new Error("valueGate: reference palette is empty (no clusters to compare against)");
  }
  return clusters;
}

/** Coerce the realized side to `[{block,lab,weight}]` — accepts the artifact-proxy array or a raw array. */
function toRealized(realized) {
  if (!Array.isArray(realized) || realized.length === 0) {
    throw new Error("valueGate: realized palette must be a non-empty [{block,lab,weight?}] array");
  }
  return realized.map((it) => {
    const block = it.block ?? it.key;
    const lab = it.lab ?? (it.repColor && it.repColor.lab);
    if (typeof block !== "string" || !Array.isArray(lab) || lab.length !== 3) {
      throw new Error(`valueGate: bad realized entry ${JSON.stringify(it)}`);
    }
    return { block, lab, value: it.value ?? round1(lab[0]), weight: it.weight ?? 1 };
  });
}

// --- the gate --------------------------------------------------------------

/**
 * THE ΔVALUE FEEDBACK GATE. Score a build's realized palette against the concept's previewed palette: for
 * each realized block, its nearest reference cluster in Lab (`nearestLab`) gives a ΔE; the
 * coverage-weighted mean is the headline drift, flagged over `threshold`. The categorical
 * `comparePalettes` partition (present/missing/added by id) rides along.
 *
 * @param {object[]} realized   `realizedPaletteFromArtifact` output, or a raw `[{block,lab,weight?}]`.
 * @param {object} reference    the concept side — an `extractPaletteFromImage` result or `[{block,lab}]`.
 * @param {{ threshold?: number }} [opts]
 * @returns {{schema:string, threshold:number, meanDeltaE:number, maxDeltaE:number, flagged:boolean,
 *   recommendCorrectiveReplace:boolean, perBlock:object[], present:string[], missing:string[],
 *   added:string[]}}
 */
export function valueGate(realized, reference, { threshold = DEFAULT_VALUE_GATE_THRESHOLD } = {}) {
  const real = toRealized(realized);
  const clusters = toReferenceClusters(reference);

  let wSum = 0;
  let weighted = 0;
  let maxDeltaE = 0;
  const perBlock = real.map((r) => {
    const hit = nearestLab(r.lab, clusters);
    const dE = hit.deltaE;
    const w = r.weight > 0 ? r.weight : 0;
    wSum += w;
    weighted += w * dE;
    if (dE > maxDeltaE) maxDeltaE = dE;
    return {
      block: r.block,
      lab: r.lab,
      value: r.value,
      weight: round2(r.weight),
      nearest: hit.key,
      deltaE: round2(dE),
    };
  });

  const meanDeltaE = round2(wSum > 0 ? weighted / wSum : 0);
  const flagged = meanDeltaE > threshold;
  const realizedIds = real.map((r) => r.block);
  const referenceIds = clusters.map((c) => c.block);
  const { present, missing, added } = comparePalettes(realizedIds, referenceIds);

  return {
    schema: VALUE_GATE_SCHEMA,
    threshold,
    meanDeltaE,
    maxDeltaE: round2(maxDeltaE),
    flagged,
    // Advisory: recommend (not auto-fire) one corrective re-place when drift exceeds the gate. A second
    // snap against the SAME realized palette is idempotent, so the real lever is a new concept or a wider
    // extractor `k` — the caller documents whether it fired (see T-042-01 design.md D4).
    recommendCorrectiveReplace: flagged,
    perBlock,
    present,
    missing,
    added,
  };
}

/**
 * Before/after scalar for the A/B: how much did value-matching close the concept↔render gap?
 * @param {{before:number, after:number}} p  the two `valueGate` mean ΔEs
 * @returns {{before:number, after:number, delta:number, pct:number, improved:boolean}}
 */
export function gapClosure({ before, after }) {
  const delta = round2(before - after);
  const pct = before > 0 ? round1((100 * (before - after)) / before) : 0;
  return { before: round2(before), after: round2(after), delta, pct, improved: after < before };
}
