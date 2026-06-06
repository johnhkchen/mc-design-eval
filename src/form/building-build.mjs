// HIGH-RES BUILDING BUILD — the E-20 scale selector + report (T-068-01, story S-068, epic E-20).
//
// E-20 voxelizes the whole-building GLB (T-067-01) at a DELIBERATELY HIGH scale (markedly more blocks than
// the ~32-block sculptures) and cleans it with the matured E-19 pipeline (value-true flat palette, no
// speckle, stray-pruned). The measured caveat: scale↔fidelity is NON-MONOTONIC for angular forms — a very
// high scale can make an angular mass read WORSE. So this module is the PURE arbiter the AC mandates: try a
// couple of scales, keep the one that READS BEST (highest form IoU vs the GLB), NOT the biggest block count,
// and record which + why.
//
// PURE — no GL, no I/O, no Date/random — so it runs under the `src/**/*.test.mjs` glob. The impure runner
// (benchmarks/sculpture/building-build.mjs) does the voxelize + segment + prune + GL render + score and feeds
// this the per-scale cells. Mirrors e19-cleanup.mjs's shape (schema const + assemble* + private render*Md);
// null-tolerant (a failed scale → null formIoU → ranks last; never throws on a gap).

/** Schema tag stamped on the report json (downstream version-check). */
export const BUILDING_BUILD_SCHEMA = "building-build/v1";

/** Metric axes carried per scale + the direction that counts as an IMPROVEMENT.
 *  formIoU / largestFraction: higher better. Everything else: lower better. */
export const AXES = Object.freeze({
  formIoU: "up",
  speckle: "down",
  distinct: "down",
  offPalette: "down",
  valueDeltaE: "down",
  strayCount: "down",
  largestFraction: "up",
});

const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000;
const isNum = (x) => typeof x === "number" && Number.isFinite(x);

/**
 * One scale's measured cell → a normalized row. Pass-through with guards; missing numeric fields stay
 * null (rendered "—"). PURE.
 * @param {{scale:number, blocks?:number, formIoU?:number, speckle?:number, distinct?:number,
 *          offPalette?:number, valueDeltaE?:number, strayCount?:number, largestFraction?:number,
 *          occ?:object, note?:string}} cell
 */
export function buildingRow(cell = {}) {
  const g = (v, r = round3) => (isNum(v) ? r(v) : null);
  return {
    scale: isNum(cell.scale) ? cell.scale : null,
    blocks: isNum(cell.blocks) ? Math.round(cell.blocks) : null,
    formIoU: g(cell.formIoU),
    speckle: g(cell.speckle),
    distinct: isNum(cell.distinct) ? Math.round(cell.distinct) : null,
    offPalette: isNum(cell.offPalette) ? Math.round(cell.offPalette) : null,
    valueDeltaE: g(cell.valueDeltaE, round2),
    strayCount: isNum(cell.strayCount) ? Math.round(cell.strayCount) : null,
    largestFraction: g(cell.largestFraction),
    occ: cell.occ ?? null,
    note: cell.note ?? null,
  };
}

/**
 * Deterministic best-scale pick (the AC core: "best-reading kept, recorded which + why"). Rank by form IoU
 * descending; if the top two are within `iouEps`, prefer the LOWER scale — the explicit "keep the
 * best-reading, NOT the biggest block count" rule (the non-monotonicity caveat). Rows with a null formIoU
 * rank last. PURE.
 * @param {Array<ReturnType<typeof buildingRow>>} rows
 * @param {{iouEps?:number}} [opts]
 * @returns {{scale:number|null, formIoU:number|null, reason:string, tieBreak:boolean,
 *            ranked:Array<{scale:number, formIoU:number|null}>}}
 */
export function pickBestScale(rows = [], { iouEps = 0.01 } = {}) {
  const valid = (rows || []).filter((r) => r && isNum(r.scale));
  if (valid.length === 0) return { scale: null, formIoU: null, reason: "no scales built", tieBreak: false, ranked: [] };
  // rank: higher IoU first; null IoU last; tie on IoU → lower scale first.
  const ranked = [...valid].sort((a, b) => {
    const ai = isNum(a.formIoU) ? a.formIoU : -Infinity;
    const bi = isNum(b.formIoU) ? b.formIoU : -Infinity;
    if (bi !== ai) return bi - ai;
    return a.scale - b.scale;
  });
  const top = ranked[0];
  let chosen = top;
  let tieBreak = false;
  // among the scales within iouEps of the top IoU, keep the LOWEST scale (fewest blocks).
  if (isNum(top.formIoU)) {
    const contenders = ranked.filter((r) => isNum(r.formIoU) && top.formIoU - r.formIoU <= iouEps);
    const lowest = contenders.reduce((m, r) => (r.scale < m.scale ? r : m), contenders[0]);
    if (lowest.scale !== top.scale) {
      chosen = lowest;
      tieBreak = true;
    }
  }
  const rankedView = ranked.map((r) => ({ scale: r.scale, formIoU: r.formIoU }));
  const maxScale = valid.reduce((m, r) => Math.max(m, r.scale), -Infinity);
  const higherLost = valid.find((r) => r.scale > chosen.scale && isNum(r.formIoU)); // a higher scale that read worse
  const runnerUp = ranked.find((r) => r.scale !== chosen.scale);
  let reason;
  if (tieBreak) {
    reason = `scale ${chosen.scale} kept: form IoU ${fmt(chosen.formIoU)} is within ${iouEps} of the top (scale ${top.scale} @ ${fmt(top.formIoU)}) — the lower scale is kept (fewer blocks, the best-reading-not-biggest rule).`;
  } else if (!isNum(chosen.formIoU)) {
    reason = `scale ${chosen.scale} kept (no form IoU available to rank).`;
  } else if (higherLost) {
    reason = `scale ${chosen.scale} kept: highest form IoU ${fmt(chosen.formIoU)} — a higher scale (${higherLost.scale} @ ${fmt(higherLost.formIoU)}) read WORSE (scale↔fidelity is non-monotonic for angular forms; the bigger block count is not kept).`;
  } else if (chosen.scale === maxScale) {
    reason = `scale ${chosen.scale} kept: highest form IoU ${fmt(chosen.formIoU)} at the HIGHEST scale tried` +
      (runnerUp ? ` (vs scale ${runnerUp.scale} @ ${fmt(runnerUp.formIoU)})` : "") +
      " — more resolution still read better; the high-scale regression that bites angular sculptures did not appear up to this ceiling.";
  } else {
    reason = `scale ${chosen.scale} kept: highest form IoU ${fmt(chosen.formIoU)}` + (runnerUp ? ` vs scale ${runnerUp.scale} @ ${fmt(runnerUp.formIoU)}` : "") + ".";
  }
  return { scale: chosen.scale, formIoU: chosen.formIoU, reason, tieBreak, ranked: rankedView };
}

const fmt = (v) => (isNum(v) ? String(Math.round(v * 1000) / 1000) : "—");

/**
 * Assemble the building-build report. PURE.
 * @param {{rows:Array, chosen?:ReturnType<typeof pickBestScale>, generatedFrom?:string, scale?:number}} input
 * @returns {{md:string, json:object}}
 */
export function assembleBuildingBuild({ rows = [], chosen = null, generatedFrom } = {}) {
  if (!Array.isArray(rows)) throw new Error("assembleBuildingBuild: rows must be an array");
  const normalized = rows.map(buildingRow);
  const pick = chosen ?? pickBestScale(normalized);
  const chosenRow = normalized.find((r) => r.scale === pick.scale) ?? null;

  // cleanliness headline: E-19 "as clean as text→JSON" = off-palette 0 AND speckle ≤ 0.05, on the chosen build.
  const clean = chosenRow
    ? {
        offPaletteZero: chosenRow.offPalette === 0,
        speckleOk: isNum(chosenRow.speckle) ? chosenRow.speckle <= 0.05 : null,
        singleMass: isNum(chosenRow.largestFraction) ? chosenRow.largestFraction >= 0.999 : null,
      }
    : null;

  const json = {
    schema: BUILDING_BUILD_SCHEMA,
    generatedFrom: generatedFrom ?? "building-build live sweep (voxelize @scales → E-19 clean: augmented design-doc palette + segment + gated prune) vs the GLB silhouette",
    subject: "building",
    scalesTried: normalized.map((r) => r.scale).filter((s) => isNum(s)),
    chosen: pick,
    chosenRow,
    clean,
    note:
      "Per scale: voxelize (solid→plain voxelizeGlb) → gated pruneStrays → segmentMaterials under the " +
      "augmented design-doc flat palette (design-doc + ≤2 secondary). form IoU vs the GLB at the building " +
      "3/4 view (higher better); speckle/distinct/off-palette/value ΔE lower better. The BEST-READING scale " +
      "is kept (highest form IoU), NOT the biggest block count — scale↔fidelity is non-monotonic for angular " +
      "forms (a building is angular). The GLB lost fine detail upstream (T-067), so absolute IoU is bounded " +
      "by the reconstruction; the cross-scale comparison is the signal.",
    rows: normalized,
  };
  return { md: renderBuildMd(json), json };
}

// --- markdown -------------------------------------------------------------------------------------------

const fmtNum = (v, d = 3) => (isNum(v) ? String(Math.round(v * 10 ** d) / 10 ** d) : "—");
const fmtInt = (v) => (isNum(v) ? String(Math.round(v)) : "—");

function renderBuildMd(json) {
  const R = json.rows;
  const lines = [
    "# High-res building build — voxelize @ scales → E-19 clean → keep the best-reading (T-068-01)",
    "",
    "The E-20 higher-resolution build. The whole-building GLB (T-067-01, `stone-gatehouse.glb`) voxelized at",
    "a deliberately HIGH scale (markedly more blocks than the ~32-block sculptures), cleaned with the matured",
    "E-19 pipeline (value-true within the design-doc **flat** palette, material-region segmented, stray-pruned),",
    "rendered at the building 3/4 view. A couple of scales tried; the **best-reading** kept (highest form IoU",
    "vs the GLB), **not** the biggest block count — scale↔fidelity is non-monotonic for angular forms.",
    "",
    `Subject: building. Scales tried: ${json.scalesTried.join(", ") || "—"}. Schema \`${json.schema}\`.`,
    "",
    "| scale | blocks | form IoU | speckle | distinct | off-pal | value ΔE | stray | largest-frac |",
    "| ----- | ------ | -------- | ------- | -------- | ------- | -------- | ----- | ------------ |",
    ...R.map(
      (r) =>
        `| ${fmtInt(r.scale)}${json.chosen.scale === r.scale ? " ✓" : ""} | ${fmtInt(r.blocks)} | ${fmtNum(r.formIoU)} | ` +
        `${fmtNum(r.speckle)} | ${fmtInt(r.distinct)} | ${fmtInt(r.offPalette)} | ${fmtNum(r.valueDeltaE, 2)} | ` +
        `${fmtInt(r.strayCount)} | ${fmtNum(r.largestFraction)} |`,
    ),
    "",
    "## Chosen scale (AC#1 — best-reading kept, recorded why)",
    "",
    `**Scale ${fmtInt(json.chosen.scale)}** — ${json.chosen.reason}`,
    `Ranking (form IoU): ${json.chosen.ranked.map((r) => `${r.scale}@${fmtNum(r.formIoU)}`).join(" > ") || "—"}.`,
    "",
    "## Cleanliness (AC#2 — E-19 flat palette, no speckle, single mass)",
    "",
    json.clean
      ? `- off-palette (vs the augmented design-doc palette): **${fmtInt(json.chosenRow.offPalette)}** ` +
        `(${json.clean.offPaletteZero ? "zero ✓" : "NON-ZERO ✗"})\n` +
        `- speckle: **${fmtNum(json.chosenRow.speckle)}** (${json.clean.speckleOk === null ? "—" : json.clean.speckleOk ? "≤ 0.05 E-19 bar ✓" : "above the bar ✗"})\n` +
        `- distinct blocks: **${fmtInt(json.chosenRow.distinct)}** (design-doc flat palette + ≤2 gated secondary)\n` +
        `- principal mass: largest-fraction **${fmtNum(json.chosenRow.largestFraction)}** ` +
        `(${json.clean.singleMass === null ? "—" : json.clean.singleMass ? "single mass, prune a no-op ✓" : "multi-mass — pruned"})`
      : "_(no chosen row)_",
    "",
    `> _Note:_ ${json.note}`,
    "",
  ];
  return lines.join("\n");
}
