// PRE-SPEND REGISTRATION SMOKE — the lens-readability gate the S-094 checklist was missing
// (T-120-01, story S-120, epic E-30). THE BARN LESSON: its concept passed the geometry checklist,
// spent the TRELLIS/GLB budget, and was THEN refused by the zone lens (`no-field-cells`) — a
// refusal decidable from the concept + the committed material map alone. This module runs the REAL
// zone lens (extractConceptZoneMap, the T-117 role-aware rung included) against the concept BEFORE
// any TRELLIS call, plus the kit-extract dry-run (everything kit-extract does before its live
// call), so an unreadable concept is refused cheap, named, and pre-spend.
//
// HOW A BUILD-RELATIVE LENS RUNS WITH NO BUILD: proxy geometry. `mapRowsToLayers` relocates row
// histograms onto y values but never changes their content, and both axes use the same robust-
// extent/anchor statistics — so with layer counts ≡ the concept's own reversed row counts the map
// is identity-shaped and every MATERIAL-readability refusal (`too-few-cells`, `extent-too-short`,
// `no-field-cells`, `weak-dominant:*`, `unmapped-dominant:*`) reproduces exactly. Band y-geometry
// is proxy-true only: the smoke's verdict is READABILITY, never registry band data (the record
// says so).
//
// The one geometric input with no row-side twin is the wall/roof split (`upperTop`). Ladder
// (T-104 attempt semantics, each rung named in the record):
//   1. the widest-row ANCHOR (the eave) — `anchorIndex` verbatim, narrow-plateau condition
//      included (measured invariant: the eave is the widest line of both axes — band-profile
//      header; cottage y14 = upperTop, gatehouse y18 = upperTop);
//   2. the ROOF-RUN bottom — top-down scan for the first row where field-class cells outnumber
//      roof-class cells (classes from the map's placementRule rows; field counted THROUGH
//      `fieldResolution` — the same near-tone flip that starves the lens rung 1 would starve a
//      raw scan); only defined when the map declares both classes;
//   3. named refusal `proxy-eave-undecidable` — a smoke must never guess a split and then
//      certify readability off it.
//
// PURE — plain-data inputs, no I/O, no GL, no network, no thresholds of its own (committed map
// data + the lens's exported constants only). The impure leaf is
// benchmarks/sculpture/registration-smoke.mjs. See docs/knowledge/registration-runbook.md.

import {
  rowProfile, robustExtent, anchorIndex, fieldResolution, extractConceptZoneMap,
} from "../color/band-profile.mjs";
import { bandRefsFromZoneRecord, buildKitPrompt } from "./kit.mjs";

/** Schema tag of the committed registration-smoke record (the runner stamps it). */
export const REGISTRATION_SMOKE_SCHEMA = "registration-smoke/v1";

const bare = (id) => String(id).replace(/^[a-z0-9_]+:/, "");

/**
 * Synthesize the lens's occupancy-side inputs from the concept's own row profile (see header).
 * Rows are top-first; proxy y of row i is `rowExt.hi - i`, so layer counts are the reversed
 * in-extent row widths and the row→layer map the lens derives is identity-shaped.
 * @param {{grid:(string|null)[][]}} gridResult  validate-mode grid (gridFromPixels)
 * @param {{map:{block:string, placementRule?:string}[], nearTonePairs?:object[]}} materialMap
 * @returns {{layerCounts:{yMin:number, counts:number[]}, floorLines:number[], upperTop:number,
 *            eave:{source:"anchor"|"roof-run", row:number}}
 *          | {undecidable:true, reason:"proxy-eave-undecidable"|"proxy-extent-empty"}}
 */
export function proxyGeometry(gridResult, materialMap) {
  const profile = rowProfile(gridResult);
  const widths = profile.rows.map((r) => r.filled);
  const rowExt = robustExtent(widths);
  if (!rowExt) return { undecidable: true, reason: "proxy-extent-empty" };
  const counts = [];
  for (let i = rowExt.hi; i >= rowExt.lo; i--) counts.push(widths[i]);
  const layerCounts = { yMin: 0, counts };
  const yOf = (row) => rowExt.hi - row;

  // rung 1 — the widest-row anchor (the eave); fractional anchors round like the lens's yAt
  const anchor = anchorIndex(widths, rowExt);
  if (anchor != null) {
    return { layerCounts, floorLines: [], upperTop: Math.round(yOf(anchor)), eave: { source: "anchor", row: anchor } };
  }

  // rung 2 — roof-run bottom, classes from the map's own placementRule rows, field counted
  // through the recorded near-tone resolution (the dominance view only — the lens's model)
  const fieldKeys = new Set(materialMap.map.filter((r) => r.placementRule === "walls").map((r) => bare(r.block)));
  const roofKeys = new Set(materialMap.map.filter((r) => r.placementRule === "roof").map((r) => bare(r.block)));
  if (fieldKeys.size && roofKeys.size) {
    const resolve = fieldResolution(materialMap);
    for (let i = rowExt.lo; i <= rowExt.hi; i++) {
      let field = 0, roof = 0;
      for (const [k, c] of Object.entries(profile.rows[i].counts)) {
        if (fieldKeys.has(k) || resolve.has(k)) field += c;
        else if (roofKeys.has(k)) roof += c;
      }
      if (field > 0 && field >= roof) {
        return { layerCounts, floorLines: [], upperTop: yOf(i) + 1, eave: { source: "roof-run", row: i } };
      }
    }
  }

  return { undecidable: true, reason: "proxy-eave-undecidable" };
}

/**
 * THE SMOKE: concept grid + committed material map → pass/refusal, pre-spend. Composes the real
 * lens over {@link proxyGeometry}, then the kit-extract dry-run (`bandRefsFromZoneRecord` — the
 * exact precondition that refused the barn while its zone record was prior-fallback — and
 * `buildKitPrompt`) against an EPHEMERAL zone-record-shaped object built from the lens output.
 * Deterministic; structurally zero-spend (no I/O of any kind).
 * @param {{gridResult:object, materialMap:object, subject:string}} input
 * @returns {{schema:string, subject:string, pass:boolean,
 *            refusal:null|{stage:"proxy"|"lens"|"kit-dry-run", reason:string},
 *            proxy:object|null, lens:object|null,
 *            kitDryRun:null|{ok:true, bandNames:string[], promptChars:number}, note:string}}
 */
export function registrationSmoke({ gridResult, materialMap, subject }) {
  if (!materialMap || !Array.isArray(materialMap.map)) {
    throw new Error("registrationSmoke: materialMap with .map[] required");
  }
  const note = "readability verdict only — band y-geometry is proxy-true, never registry data";
  const base = { schema: REGISTRATION_SMOKE_SCHEMA, subject: subject ?? null, note };

  const proxy = proxyGeometry(gridResult, materialMap);
  if (proxy.undecidable) {
    return { ...base, pass: false, refusal: { stage: "proxy", reason: proxy.reason }, proxy, lens: null, kitDryRun: null };
  }
  const proxyRec = { upperTop: proxy.upperTop, eave: proxy.eave, layers: proxy.layerCounts.counts.length };

  const lens = extractConceptZoneMap({
    gridResult,
    floorLines: proxy.floorLines,
    layerCounts: proxy.layerCounts,
    upperTop: proxy.upperTop,
    materialMap,
  });
  if (!lens.readable) {
    return { ...base, pass: false, refusal: { stage: "lens", reason: lens.reason }, proxy: proxyRec, lens, kitDryRun: null };
  }

  let kitDryRun;
  try {
    const ephemeral = { schema: "zone-map/v1", source: "concept", derived: { bands: lens.bands } };
    const { bandNames, promptBands } = bandRefsFromZoneRecord(ephemeral);
    const prompt = buildKitPrompt({ subject: subject ?? "the subject", promptBands });
    kitDryRun = { ok: true, bandNames, promptChars: prompt.length };
  } catch (e) {
    return { ...base, pass: false, refusal: { stage: "kit-dry-run", reason: e.message }, proxy: proxyRec, lens, kitDryRun: null };
  }

  return { ...base, pass: true, refusal: null, proxy: proxyRec, lens, kitDryRun };
}
