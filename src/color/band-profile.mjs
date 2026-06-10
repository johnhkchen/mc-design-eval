// Concept band-profile extractor (T-092-01, story S-092, epic E-25).
//
// THE ZONE MAP COMES FROM THE CONCEPT, NOT A PRIOR. The zone machinery (structuralZones floor-lines,
// zoneFill) works, but the zone ASSIGNMENTS were a hard-coded building prior (base=stone, upper=plaster,
// roof=wood). Measured consequence: the cottage concept shows a half-timbered building on a LOW stone
// plinth — plaster+timber on BOTH storeys — while the prior assigned the whole ground storey to stone;
// the gatehouse prior invented a base band the concept doesn't have. Perfect execution of a wrong map is
// still the wrong cottage.
//
// This module reads the band structure FROM the concept image: a height-band profile of the concept's
// building region (the validate-mode quantized grid the T-086 value-true step already computes — the
// named block LOCATES its region, the proven locator), aligned to the build's geometric y-axis, segmented
// into dominant bands, snapped to floor-lines, and resolved to E-21 material roles. The deterministic
// zone-fill APPLIES the map; the splat never establishes it (the 9%-conversion lesson).
//
// Alignment is to FLOOR-LINES (geometry), never to storeyBands' dominant-block bands — those are
// corrupted by the very material collapse this chain fixes. "Aligned" means SNAP-WHEN-NEAR (within
// SNAP_TOLERANCE), not force-to: the cottage plinth top is a real band boundary that is NOT a floor
// slab; forcing it to one would reproduce the defect.
//
// The image-row → voxel-y map is calibrated on the ROBUST extents of both axes — rows/layers carrying at
// least EXTENT_WIDTH_FLOOR of the maximum width/mass — the same statistic on both sides, so a narrow
// feature rising past the ridge (the chimney) is excluded from BOTH and cannot shear the bands.
// Within those extents the map is ANCHORED at the WIDEST-SILHOUETTE line when it is a distinctive
// feature (a narrow plateau): the eave/roof-overhang is the widest line of both the concept render and
// the voxel build (measured: cottage max layer = y14 = upperTop, max image row a single line; gatehouse
// max layer = y18 = upperTop), so pinning max-width-row ↔ max-count-layer and mapping piecewise-linearly
// above/below it stops the 3/4 view's vertical foreshortening from leaking roof rows below the geometric
// eave (the defect a plain linear map showed on the real cottage: spruce dominating wall layers 7..10).
// When either plateau is BROAD (≥ ANCHOR_MAX_PLATEAU of its extent — a flat-sided synthetic, a tower),
// the "widest line" is not a feature and the map stays plain linear.
//
// The walls/roof split stays GEOMETRIC (upperTop from structuralZones): only layers below it produce
// wall bands; everything mapping at or above it aggregates into ONE roof histogram that supplies the
// roof's materials. The concept decides what zones are MADE OF, never where the roof IS.
//
// An unreadable concept yields {readable:false, reason} — the caller falls back to its recorded prior
// (recorded when used, NEVER overriding a readable concept — E-25). All thresholds are generic exported
// constants: a subject contributes data only, no per-subject code (E-25 Rule 3).
//
// PURE — plain-data inputs (a GridResult, arrays, the material-map JSON), no I/O, no GL, no view-layer
// imports. The occupancy-side mate (layerCounts, zonesFromBands) is src/view/zone-map.mjs.

/** Schema tag for the committed zone-map record (the runner stamps it; durable-skin version-checks). */
export const ZONE_MAP_SCHEMA = "zone-map/v1";

/** Robust-extent floor: rows/layers narrower than this fraction of the widest are silhouette spurs
 *  (the chimney above the ridge), excluded from the row→y calibration on BOTH axes. */
export const EXTENT_WIDTH_FLOOR = 0.25;

/** Minimum band height in voxel layers; thinner runs are transition noise and merge into a neighbour. */
export const MIN_BAND_HEIGHT = 2;

/** Snap radius (voxel layers) for aligning a detected band boundary to a structural floor-line. Wide
 *  enough to absorb the linear row→y map's perspective error at a storey divide, narrow enough that a
 *  mid-storey boundary (the plinth top) is never dragged onto one. */
export const SNAP_TOLERANCE = 2;

/** A band's non-dominant block becomes a recorded secondary at this share of the band's filled cells. */
export const SECONDARY_MIN_SHARE = 0.05;

/** A band whose dominant carries less than this share of its cells is an unreadable mix (fallback). */
export const MIN_DOMINANT_SHARE = 0.3;

/** Below this many filled foreground cells the whole concept region is unreadable (fallback). */
export const MIN_PROFILE_CELLS = 200;

/** Both robust extents must span at least this many rows/layers to calibrate a linear map. */
export const MIN_EXTENT_LAYERS = 4;

/** The widest-silhouette anchor engages only when its plateau is NARROW — a distinctive feature (an
 *  eave overhang), not a flat-sided mass. Plateaus wider than this fraction of the extent fall back
 *  to the plain linear map. */
export const ANCHOR_MAX_PLATEAU = 0.25;

/** placementRules naming linear/local design features (studs, quoins, chimney shaft, door leaves) that
 *  cross height bands and are by construction never row-dominant — always carried as secondaries so the
 *  fill PRESERVES their runs. */
export const CROSS_BAND_RULES = Object.freeze(["trim", "corners-edges", "openings"]);

const DEFAULTS = Object.freeze({
  extentWidthFloor: EXTENT_WIDTH_FLOOR,
  minBandHeight: MIN_BAND_HEIGHT,
  snapTolerance: SNAP_TOLERANCE,
  secondaryMinShare: SECONDARY_MIN_SHARE,
  minDominantShare: MIN_DOMINANT_SHARE,
  minProfileCells: MIN_PROFILE_CELLS,
  minExtentLayers: MIN_EXTENT_LAYERS,
  anchorMaxPlateau: ANCHOR_MAX_PLATEAU,
  crossBandRules: CROSS_BAND_RULES,
});

const bare = (id) => String(id).replace(/^[a-z0-9_]+:/, "");
const round3 = (n) => Math.round(n * 1000) / 1000;

/**
 * Per-row block histogram of a validate-mode GridResult (top row first, grid order).
 * @param {{grid:(string|null)[][]}} gridResult  from gridFromPixels
 * @returns {{rows:{filled:number, counts:Record<string,number>}[], maxWidth:number, totalFilled:number}}
 */
export function rowProfile(gridResult) {
  if (!gridResult || !Array.isArray(gridResult.grid)) {
    throw new Error("rowProfile: expected a GridResult with .grid");
  }
  const rows = [];
  let maxWidth = 0, totalFilled = 0;
  for (const gridRow of gridResult.grid) {
    const counts = {};
    let filled = 0;
    for (const key of gridRow) {
      if (key === null) continue;
      filled++;
      counts[key] = (counts[key] || 0) + 1;
    }
    rows.push({ filled, counts });
    if (filled > maxWidth) maxWidth = filled;
    totalFilled += filled;
  }
  return { rows, maxWidth, totalFilled };
}

/**
 * Robust extent of a width sequence: first/last index carrying ≥ floor·max(widths). Null when empty.
 * Used identically on image rows (filled cells) and voxel layers (occupied cells) — see module header.
 * @param {number[]} widths
 * @param {number} floor  fraction of the max
 * @returns {{lo:number, hi:number}|null}
 */
export function robustExtent(widths, floor = EXTENT_WIDTH_FLOOR) {
  let max = 0;
  for (const w of widths) if (w > max) max = w;
  if (max <= 0) return null;
  const min = max * floor;
  let lo = -1, hi = -1;
  for (let i = 0; i < widths.length; i++) {
    if (widths[i] >= min) {
      if (lo === -1) lo = i;
      hi = i;
    }
  }
  return lo === -1 ? null : { lo, hi };
}

/**
 * The widest-silhouette anchor: the midpoint of the maximal-width plateau inside `ext`, or null when
 * the plateau is too broad to be a feature (≥ `maxPlateauFraction` of the extent) — see module header.
 * @param {number[]} widths
 * @param {{lo:number, hi:number}} ext
 * @param {number} [maxPlateauFraction]
 * @returns {number|null} a (possibly fractional) index inside the extent
 */
export function anchorIndex(widths, ext, maxPlateauFraction = ANCHOR_MAX_PLATEAU) {
  let max = -Infinity;
  for (let i = ext.lo; i <= ext.hi; i++) if (widths[i] > max) max = widths[i];
  const at = [];
  for (let i = ext.lo; i <= ext.hi; i++) if (widths[i] === max) at.push(i);
  const extent = ext.hi - ext.lo + 1;
  if (at.length / extent >= maxPlateauFraction) return null;
  return (at[0] + at[at.length - 1]) / 2;
}

/**
 * Map the image rows inside `rowExt` onto voxel layers [yLo..yHi] (row order is top-first, so
 * rowExt.lo → yHi and rowExt.hi → yLo), accumulating each row's histogram into its layer. With
 * `anchors` ({row, y} — from {@link anchorIndex} on each axis) the map is PIECEWISE linear, pinned at
 * the shared widest-silhouette feature; without, plain linear. Rows outside the robust extent
 * (silhouette spurs) are skipped.
 * @param {{filled:number, counts:Record<string,number>}[]} rows  from rowProfile
 * @param {{lo:number, hi:number}} rowExt
 * @param {{yLo:number, yHi:number}} layerExt
 * @param {{row:number, y:number}|null} [anchors]
 * @returns {Map<number, {filled:number, counts:Record<string,number>}>} keyed by voxel y
 */
export function mapRowsToLayers(rows, rowExt, layerExt, anchors = null) {
  const byY = new Map();
  const yAt = (i) => {
    if (anchors) {
      const { row: ar, y: ay } = anchors;
      if (i <= ar) {
        const span = Math.max(1e-9, ar - rowExt.lo);
        return layerExt.yHi - ((i - rowExt.lo) / span) * (layerExt.yHi - ay);
      }
      const span = Math.max(1e-9, rowExt.hi - ar);
      return ay - ((i - ar) / span) * (ay - layerExt.yLo);
    }
    const span = Math.max(1, rowExt.hi - rowExt.lo);
    return layerExt.yHi - ((i - rowExt.lo) / span) * (layerExt.yHi - layerExt.yLo);
  };
  for (let i = rowExt.lo; i <= rowExt.hi; i++) {
    const y = Math.round(yAt(i));
    let acc = byY.get(y);
    if (!acc) byY.set(y, (acc = { filled: 0, counts: {} }));
    const row = rows[i];
    acc.filled += row.filled;
    for (const [k, c] of Object.entries(row.counts)) acc.counts[k] = (acc.counts[k] || 0) + c;
  }
  return byY;
}

/** Dominant key of a histogram (ties broken lexicographically for determinism); null when empty. */
function dominantOf(counts) {
  let best = null, bestC = -1;
  for (const [k, c] of Object.entries(counts)) {
    if (c > bestC || (c === bestC && best !== null && k < best)) { best = k; bestC = c; }
  }
  return best;
}

function sumCounts(into, from) {
  for (const [k, c] of Object.entries(from)) into[k] = (into[k] || 0) + c;
}

/** Restrict a histogram to a candidate set (null set = no restriction). */
function filterCounts(counts, set) {
  if (!set) return counts;
  const out = {};
  for (const [k, c] of Object.entries(counts)) if (set.has(k)) out[k] = c;
  return out;
}

/**
 * Segment voxel layers [yLo..yHi] into bands of consecutive layers sharing a dominant block. With
 * `fieldBlocks` (the map's `placementRule:"walls"` blocks) the per-layer dominant is decided among
 * FIELD materials only — a 3/4-view concept stacks roof slopes and feature trim (studs, shadows,
 * shutters) into the same image rows as the wall fields, and a band's dominant must be a field, never
 * a feature or another zone's material (measured on the real cottage: every wall layer was
 * log/spruce-dominant over ALL cells, plaster/stone-dominant over FIELD cells). `share` is then the
 * dominant's share OF THE FIELD cells; the full `counts` are kept for secondaries. A layer with no
 * (field) cells inherits the previous layer's dominant (leading empties take the first real one).
 * Bands shorter than `minBandHeight` merge into a same-dominant neighbour when one exists, else the
 * taller neighbour (adopting its dominant).
 * @param {Map<number,{filled:number,counts:Record<string,number>}>} byY  from mapRowsToLayers
 * @param {{yLo:number, yHi:number, minBandHeight?:number, fieldBlocks?:Set<string>|null}} opts
 * @returns {{yRange:[number,number], dominant:string, share:number, filled:number,
 *            counts:Record<string,number>}[]} bottom-up; empty array when no layer has data
 */
export function segmentLayerBands(byY, { yLo, yHi, minBandHeight = MIN_BAND_HEIGHT, fieldBlocks = null }) {
  // per-layer dominants over the FIELD cells, with inherit-forward (then backward for leading gaps)
  const doms = [];
  for (let y = yLo; y <= yHi; y++) {
    const h = byY.get(y);
    doms.push(h && h.filled > 0 ? dominantOf(filterCounts(h.counts, fieldBlocks)) : null);
  }
  let firstReal = doms.find((d) => d !== null) ?? null;
  if (firstReal === null) return [];
  for (let i = 0; i < doms.length; i++) {
    if (doms[i] === null) doms[i] = i === 0 ? firstReal : doms[i - 1];
  }
  // run-length group
  let bands = [];
  for (let i = 0; i < doms.length; i++) {
    const y = yLo + i;
    const h = byY.get(y) ?? { filled: 0, counts: {} };
    const cur = bands[bands.length - 1];
    if (cur && cur.dominant === doms[i]) {
      cur.yRange[1] = y;
      cur.filled += h.filled;
      sumCounts(cur.counts, h.counts);
    } else {
      bands.push({ yRange: [y, y], dominant: doms[i], filled: h.filled, counts: { ...h.counts } });
    }
  }
  // merge sub-min bands (smallest first, stable until none remain or only one band left)
  const height = (b) => b.yRange[1] - b.yRange[0] + 1;
  for (;;) {
    if (bands.length <= 1) break;
    let idx = -1;
    for (let i = 0; i < bands.length; i++) {
      if (height(bands[i]) < minBandHeight && (idx === -1 || height(bands[i]) < height(bands[idx]))) idx = i;
    }
    if (idx === -1) break;
    const prev = bands[idx - 1], next = bands[idx + 1], b = bands[idx];
    let into;
    if (prev && prev.dominant === b.dominant) into = prev;
    else if (next && next.dominant === b.dominant) into = next;
    else if (prev && next) into = height(prev) >= height(next) ? prev : next;
    else into = prev ?? next;
    into.yRange = [Math.min(into.yRange[0], b.yRange[0]), Math.max(into.yRange[1], b.yRange[1])];
    into.filled += b.filled;
    sumCounts(into.counts, b.counts);
    bands.splice(idx, 1);
    // adjacent same-dominant bands can now touch — re-coalesce
    for (let i = bands.length - 2; i >= 0; i--) {
      if (bands[i].dominant === bands[i + 1].dominant) {
        bands[i].yRange = [bands[i].yRange[0], bands[i + 1].yRange[1]];
        bands[i].filled += bands[i + 1].filled;
        sumCounts(bands[i].counts, bands[i + 1].counts);
        bands.splice(i + 1, 1);
      }
    }
  }
  for (const b of bands) {
    const field = filterCounts(b.counts, fieldBlocks);
    const fieldFilled = Object.values(field).reduce((a, c) => a + c, 0);
    b.share = fieldFilled ? round3((field[b.dominant] || 0) / fieldFilled) : 0;
  }
  return bands;
}

/**
 * Snap interior band boundaries to the nearest floor-line within `tolerance` (a boundary y is the LOWER
 * edge of the upper band). Boundaries farther than the tolerance stand as detected — see module header.
 * Bands emptied by a snap are dropped (their neighbour absorbs the range).
 * @param {{yRange:[number,number]}[]} bands  bottom-up, contiguous
 * @param {number[]} floorLines
 * @param {number} [tolerance]
 * @returns {object[]} same band objects, ranges adjusted
 */
export function snapBands(bands, floorLines, tolerance = SNAP_TOLERANCE) {
  if (bands.length < 2 || !floorLines?.length) return bands;
  const out = bands.map((b) => ({ ...b, yRange: [...b.yRange] }));
  for (let i = 0; i < out.length - 1; i++) {
    const boundary = out[i + 1].yRange[0];
    let best = null;
    for (const fl of floorLines) {
      if (Math.abs(fl - boundary) <= tolerance && (best === null || Math.abs(fl - boundary) < Math.abs(best - boundary))) best = fl;
    }
    if (best !== null && best !== boundary) {
      out[i + 1].yRange[0] = best;
      out[i].yRange[1] = best - 1;
    }
  }
  // drop bands inverted by a snap; the neighbour that took the range keeps it contiguous
  const kept = [];
  for (const b of out) {
    if (b.yRange[0] > b.yRange[1]) {
      if (kept.length) kept[kept.length - 1].yRange[1] = Math.max(kept[kept.length - 1].yRange[1], b.yRange[1]);
      continue;
    }
    if (kept.length && kept[kept.length - 1].yRange[1] + 1 < b.yRange[0]) {
      b.yRange[0] = kept[kept.length - 1].yRange[1] + 1; // re-tile after a drop
    }
    kept.push(b);
  }
  return kept;
}

/**
 * Resolve a band's blocks to E-21 roles: `dominantRole` from the map's 1:1 block→role; `secondaries` =
 * blocks at ≥ `secondaryMinShare` of the band's cells ∪ ALL map blocks whose placementRule is in
 * `crossBandRules` (linear features cross bands and never win a row — the map already declares them).
 * Returns null when the dominant block has no map row (caller records the fallback reason).
 * @param {{dominant:string, counts:Record<string,number>, filled:number}} band
 * @param {{map:{role:string, block:string, placementRule?:string}[]}} materialMap
 * @param {{secondaryMinShare?:number, crossBandRules?:readonly string[]}} [opts]
 * @returns {{dominantRole:string, secondaries:{block:string, role:string, share:number}[]}|null}
 */
export function resolveBandRoles(band, materialMap, opts = {}) {
  const minShare = opts.secondaryMinShare ?? SECONDARY_MIN_SHARE;
  const crossRules = opts.crossBandRules ?? CROSS_BAND_RULES;
  const byBlock = new Map(materialMap.map.map((r) => [bare(r.block), r]));
  const domRow = byBlock.get(bare(band.dominant));
  if (!domRow) return null;
  const secondaries = new Map(); // bare -> {block, role, share}
  for (const [block, c] of Object.entries(band.counts)) {
    const row = byBlock.get(bare(block));
    if (!row || bare(block) === bare(band.dominant)) continue;
    const share = band.filled ? c / band.filled : 0;
    if (share >= minShare) secondaries.set(bare(block), { block: bare(block), role: row.role, share: round3(share) });
  }
  for (const row of materialMap.map) {
    const b = bare(row.block);
    if (b === bare(band.dominant) || secondaries.has(b)) continue;
    if (crossRules.includes(row.placementRule)) {
      const share = band.filled ? (band.counts[b] || 0) / band.filled : 0;
      secondaries.set(b, { block: b, role: row.role, share: round3(share) });
    }
  }
  return { dominantRole: domRow.role, secondaries: [...secondaries.values()] };
}

/**
 * THE ORCHESTRATOR: concept grid + geometry → the concept-derived zone map (or an honest refusal).
 * See the module header for the model. All inputs are plain data; deterministic.
 * @param {{gridResult:object, floorLines:number[], layerCounts:{yMin:number, counts:number[]},
 *          upperTop:number, materialMap:object}} input
 * @param {object} [opts]  threshold overrides (DEFAULTS)
 * @returns {{readable:true, bands:object[], roof:object, params:object} |
 *           {readable:false, reason:string, params:object}}
 */
export function extractConceptZoneMap(input, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const { gridResult, floorLines, layerCounts, upperTop, materialMap } = input;
  if (!layerCounts || !Array.isArray(layerCounts.counts)) throw new Error("extractConceptZoneMap: layerCounts {yMin, counts[]} required");
  if (!materialMap || !Array.isArray(materialMap.map)) throw new Error("extractConceptZoneMap: materialMap with .map[] required");
  if (!Number.isFinite(upperTop)) throw new Error("extractConceptZoneMap: numeric upperTop required");
  const params = { ...o, n: gridResult?.n, m: gridResult?.m };
  const refuse = (reason) => ({ readable: false, reason, params });

  const profile = rowProfile(gridResult);
  if (profile.totalFilled < o.minProfileCells) return refuse("too-few-cells");

  const rowExt = robustExtent(profile.rows.map((r) => r.filled), o.extentWidthFloor);
  const layerExtIdx = robustExtent(layerCounts.counts, o.extentWidthFloor);
  if (!rowExt || !layerExtIdx) return refuse("extent-too-short");
  if (rowExt.hi - rowExt.lo + 1 < o.minExtentLayers) return refuse("extent-too-short");
  const layerExt = { yLo: layerCounts.yMin + layerExtIdx.lo, yHi: layerCounts.yMin + layerExtIdx.hi };
  if (layerExt.yHi - layerExt.yLo + 1 < o.minExtentLayers) return refuse("extent-too-short");

  // pin the map at the shared widest-silhouette feature (the eave overhang) when both axes show one
  const rowAnchor = anchorIndex(profile.rows.map((r) => r.filled), rowExt, o.anchorMaxPlateau);
  const layerAnchorIdx = anchorIndex(layerCounts.counts, layerExtIdx, o.anchorMaxPlateau);
  const anchors = rowAnchor != null && layerAnchorIdx != null
    ? { row: rowAnchor, y: layerCounts.yMin + layerAnchorIdx }
    : null;
  params.anchored = anchors != null;
  if (anchors) params.anchor = { row: anchors.row, y: anchors.y };
  const byY = mapRowsToLayers(profile.rows, rowExt, layerExt, anchors);

  // the placementRule classes: FIELD blocks may dominate wall bands, ROOF blocks the roof — features
  // (trim/corners/openings) never dominate anything (they become secondaries). Maps without the rule
  // annotations leave the class open (null = unrestricted).
  const fieldList = materialMap.map.filter((r) => r.placementRule === "walls").map((r) => bare(r.block));
  const fieldBlocks = fieldList.length ? new Set(fieldList) : null;
  const roofList = materialMap.map.filter((r) => r.placementRule === "roof").map((r) => bare(r.block));
  const roofBlocks = roofList.length ? new Set(roofList) : null;

  // walls: below the geometric eave only
  const wallYHi = Math.min(layerExt.yHi, upperTop - 1);
  if (wallYHi < layerExt.yLo) return refuse("extent-too-short");
  let bands = segmentLayerBands(byY, {
    yLo: layerExt.yLo, yHi: wallYHi, minBandHeight: o.minBandHeight, fieldBlocks,
  });
  if (!bands.length) return refuse("no-field-cells");
  bands = snapBands(bands, floorLines ?? [], o.snapTolerance);
  // tile the FULL wall extent: the build's real bottom and the eave (zoneOf must be total)
  bands[0].yRange[0] = Math.min(bands[0].yRange[0], layerCounts.yMin);
  bands[bands.length - 1].yRange[1] = Math.max(bands[bands.length - 1].yRange[1], upperTop - 1);

  // roof: ONE aggregated histogram of everything mapping at/above the eave
  const roofAgg = { filled: 0, counts: {} };
  for (const [y, h] of byY) {
    if (y >= upperTop) { roofAgg.filled += h.filled; sumCounts(roofAgg.counts, h.counts); }
  }
  if (roofAgg.filled === 0) return refuse("weak-dominant:roof");
  // the roof dominant is decided among ROOF-class blocks (same principle as the wall field)
  const roofClassCounts = roofBlocks
    ? Object.fromEntries(Object.entries(roofAgg.counts).filter(([k]) => roofBlocks.has(k)))
    : roofAgg.counts;
  const roofClassFilled = Object.values(roofClassCounts).reduce((a, c) => a + c, 0);
  if (roofClassFilled === 0) return refuse("weak-dominant:roof");
  const roofDominant = dominantOf(roofClassCounts);
  const roofShare = round3((roofClassCounts[roofDominant] || 0) / roofClassFilled);
  if (roofShare < o.minDominantShare) return refuse("weak-dominant:roof");

  // readability + roles
  const outBands = [];
  for (let i = 0; i < bands.length; i++) {
    const b = bands[i];
    if (b.share < o.minDominantShare) return refuse(`weak-dominant:band${i}`);
    const roles = resolveBandRoles(b, materialMap, o);
    if (!roles) return refuse(`unmapped-dominant:${bare(b.dominant)}`);
    outBands.push({
      name: `band${i}`, yRange: [...b.yRange], dominantBlock: bare(b.dominant),
      dominantRole: roles.dominantRole, share: b.share, secondaries: roles.secondaries,
    });
  }
  const roofRoles = resolveBandRoles({ dominant: roofDominant, counts: roofAgg.counts, filled: roofAgg.filled }, materialMap, o);
  if (!roofRoles) return refuse(`unmapped-dominant:${bare(roofDominant)}`);
  const roof = {
    dominantBlock: bare(roofDominant), dominantRole: roofRoles.dominantRole,
    share: roofShare, secondaries: roofRoles.secondaries,
  };
  return { readable: true, bands: outBands, roof, params };
}
