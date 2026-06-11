// Roof-region diff instrument (T-118-01, story S-118, epic E-30) — the analysis that comes
// BEFORE construction on the roof-form seam (E-30 Rule 2).
//
// The multi-angle verdicts say "major: form @ roof"; the fit records say which rungs refused;
// nothing says WHAT, region by region, reads wrong. This module turns the cage's own comparison
// (build silhouette vs GLB silhouette, normalized to a common grid) into a per-region ledger:
// every XOR (mismatch) pixel at each gate azimuth is attributed to a named roof region —
// **ridge / ends / eaves / slopes** (from the recorded gable parametrics; `wall` below the band
// floor; `unpartitioned` for fallback roofs) — and per-gable HEIGHT PROFILES along the ridge and
// the rakes measure the build surface against GLB triangles sampled under the existing aabb
// alignment (measurement, not application — the roof-end-fit doctrine: vertical absolutes are
// evidence only, so deltas are reported both raw and eave-relative).
//
// PURE, GL-FREE, NETWORK-FREE, RNG-FREE. Composes the cage's own primitives (voxelSilhouettes,
// normalizeSilhouette/normalizePlacement/iou, projectPoint under cameraForMeshBounds,
// alignedTriangles, gableSurfaceHeight) — no forked camera math, no new thresholds. All floats
// rounded; output is plain JSON (byte-stable under re-call).
//
// HONESTY LEDGER:
//   1. Attribution is nearest-projected-cell — a screen-space heuristic, not a ray cast. Thin
//      regions are seeded densely (every exposed cell) and win ties by fixed precedence, but a
//      mismatch pixel far from every region is still attributed to SOMETHING nearby. The numbers
//      localize; they do not adjudicate (silhouette can only refute — the T-111 lesson).
//   2. GLB heights are sampled under the aabb alignment — raw deltas inherit its vertical
//      unreliability. The eave-relative profile is the refit-grade number.
//   3. Column granularity: a region owns whole columns above the band floor; sub-column features
//      (dormers inside a slope) read as their column's region.

import { voxelSilhouettes, REGULARIZE_DEFAULTS } from "./shell-regularize.mjs";
import { resolveAngle } from "./multi-angle.mjs";
import { normalizeSilhouette, normalizePlacement, iou } from "../form/form-fidelity.mjs";
import { cameraForMeshBounds, projectPoint, SILHOUETTE_DEFAULTS } from "../form/glb-silhouette.mjs";
import { gableSurfaceHeight } from "../form/roof-fit.mjs";

/** Schema tag stamped on assembled records. */
export const ROOF_DIFF_SCHEMA = "roof-region-diff/v1";

/** Shared defaults — declared once, no per-subject tuning. Grid reuses the cage's. */
export const ROOF_DIFF_DEFAULTS = Object.freeze({
  grid: REGULARIZE_DEFAULTS.grid, // 128 — the same normalization the cage IoU gates on
  precedence: Object.freeze(["ridge", "ends", "eaves", "slopes", "unpartitioned", "wall"]),
  endBandWidth: 1, // unfitted gable end: the outermost footprint column band, this wide
  capDepth: 0.5,   // ridge region: columns whose parametric surface is within this of ridge.y
});

const noNegZero = (v) => (v + 0 === 0 ? 0 : v);
const round3 = (v) => noNegZero(Math.round(v * 1e3) / 1e3);

const colKey = (x, z) => `${x},${z}`;

/** Normalize a gable footprint's `cols` (Set or array of "x,z") to a Set. */
function colsSet(footprint) {
  const cols = footprint?.cols;
  if (!cols) return new Set();
  return cols instanceof Set ? cols : new Set(cols);
}

/** Per-column top of every SOLID cell (forms excluded — fixtures are not shell mass). */
function columnTops(occ) {
  const tops = new Map();
  for (const key of occ.cells.keys()) {
    if (occ.forms?.has(key)) continue;
    const [x, y, z] = key.split(",").map(Number);
    const k = colKey(x, z);
    const cur = tops.get(k);
    if (cur === undefined || y > cur) tops.set(k, y);
  }
  return tops;
}

/**
 * Assign every roof-band column to a named region from the gable parametrics. PURE.
 *
 * ridge — columns whose parametric surface reaches within `capDepth` of the ridge height;
 * ends  — per gable end, columns at/past the fitted face plane (`ends.{lo,hi}.faceCoord`), or the
 *         outermost `endBandWidth` column band when the end was not fitted (refused/hip — the
 *         same rule everywhere, no per-subject width);
 * eaves — each side's recorded `eaveEdge` column strip;
 * slopes — the remaining footprint. Overlaps resolve by `precedence` (thin regions win).
 * Gables absent/empty → every column topping at/above `bandFloor` is `unpartitioned` (fallback
 * roofs — flat-cap, refused fits — still get their mismatch localized to the roof band).
 *
 * @param {object[]} gables  roof-fit gables (each may carry merged `ends` from the end-fit record)
 * @param {import("./occupancy.mjs").Occupancy} occ  the as-built occupancy
 * @param {{bandFloor?:number|null, defaults?:object}} [opts]
 * @returns {{assign:Map<string,string>, tops:Map<string,number>, bandFloor:number,
 *            counts:Record<string,number>, fallback:null|{region:string,reason:string}}}
 */
export function roofRegions(gables, occ, opts = {}) {
  const d = { ...ROOF_DIFF_DEFAULTS, ...(opts.defaults || {}) };
  const tops = columnTops(occ);
  const list = (gables || []).filter((g) => g && g.sides?.length);

  let bandFloor = opts.bandFloor ?? null;
  if (bandFloor == null && list.length) {
    bandFloor = Math.floor(Math.min(...list.flatMap((g) => g.sides.map((s) => s.eaveY))));
  }
  if (bandFloor == null) {
    throw new Error("roofRegions: bandFloor is required when no gable parametrics exist");
  }

  const assign = new Map();
  const rank = new Map(d.precedence.map((r, i) => [r, i]));
  const put = (k, region) => {
    const cur = assign.get(k);
    if (cur === undefined || rank.get(region) < rank.get(cur)) assign.set(k, region);
  };

  if (!list.length) {
    for (const [k, top] of tops) if (top >= bandFloor) put(k, "unpartitioned");
    const counts = tally(assign);
    return { assign, tops, bandFloor, counts, fallback: { region: "unpartitioned", reason: "no gable parametrics — fallback roof" } };
  }

  for (const g of list) {
    const cols = colsSet(g.footprint);
    const axis = g.ridge.axis; // the axis the ridge RUNS along
    const alongOf = (x, z) => (axis === "x" ? x : z);
    const crossOf = (x, z) => (axis === "x" ? z : x);

    // footprint extremes along the ridge axis (the unfitted-end fallback band)
    let loAlong = Infinity, hiAlong = -Infinity;
    const parsed = [];
    for (const k of cols) {
      const [x, z] = k.split(",").map(Number);
      parsed.push([k, x, z]);
      const v = alongOf(x, z);
      if (v < loAlong) loAlong = v;
      if (v > hiAlong) hiAlong = v;
    }

    const loFace = g.ends?.lo?.faceCoord ?? null;
    const hiFace = g.ends?.hi?.faceCoord ?? null;
    const eaveEdges = g.sides.map((s) => ({ edge: s.eaveEdge, axis: s.eaveDir[1] }));

    for (const [k, x, z] of parsed) {
      const along = alongOf(x, z);
      const cross = crossOf(x, z);
      put(k, "slopes");
      for (const e of eaveEdges) {
        const c = e.axis === axis ? along : cross; // eaveDir is ⊥ ridge for sides; tolerate either
        if (c === e.edge) put(k, "eaves");
      }
      const inLo = loFace != null ? along <= loFace : along < loAlong + d.endBandWidth;
      const inHi = hiFace != null ? along >= hiFace : along > hiAlong - d.endBandWidth;
      if (inLo || inHi) put(k, "ends");
      if (gableSurfaceHeight(g, x, z) >= g.ridge.y - d.capDepth) put(k, "ridge");
    }
  }

  return { assign, tops, bandFloor, counts: tally(assign), fallback: null };
}

function tally(assign) {
  const counts = {};
  for (const r of assign.values()) counts[r] = (counts[r] ?? 0) + 1;
  return counts;
}

/** 6-neighbor offsets (exposure test — mirrors exposedFaceMesh's). */
const NEIGH6 = Object.freeze([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);

/**
 * Project every EXPOSED solid cell to screen space under the SAME camera the build silhouette
 * used (exposedFaceMesh bounds = `[min, max+1]` through cameraForMeshBounds — no forked framing).
 * Each point carries its region: the column's assignment for cells at/above the band floor,
 * `wall` below. PURE.
 * @returns {{region:string, sx:number, sy:number}[]}
 */
export function projectRegions(regions, occ, view, opts = {}) {
  const width = opts.width ?? SILHOUETTE_DEFAULTS.width;
  const height = opts.height ?? SILHOUETTE_DEFAULTS.height;
  const meshBounds = { min: occ.bounds.min.slice(), max: occ.bounds.max.map((v) => v + 1) };
  const cam = cameraForMeshBounds(meshBounds, { ...view, width, height });

  const solid = new Set();
  for (const key of occ.cells.keys()) if (!occ.forms?.has(key)) solid.add(key);

  const points = [];
  for (const key of solid) {
    const [x, y, z] = key.split(",").map(Number);
    let exposed = false;
    for (const [dx, dy, dz] of NEIGH6) {
      if (!solid.has(`${x + dx},${y + dy},${z + dz}`)) { exposed = true; break; }
    }
    if (!exposed) continue;
    const p = projectPoint([x + 0.5, y + 0.5, z + 0.5], cam, width, height);
    if (!(p.w > 0)) continue;
    const region = y >= regions.bandFloor ? (regions.assign.get(colKey(x, z)) ?? "wall") : "wall";
    points.push({ region, sx: p.x, sy: p.y });
  }
  return points;
}

/**
 * One azimuth's diff: normalize both silhouettes to the common grid (the cage's comparison),
 * XOR them, and attribute every mismatch pixel to the nearest projected region point —
 * multi-source BFS over the grid, seeded in precedence order (deterministic; thin regions win
 * exact ties). `extra` = build∖GLB, `missing` = GLB∖build. The partition is total:
 * Σ byRegion (+ unattributed when there are no points) === mismatchPx. PURE.
 *
 * @param {{buildSil:object, refSil:object, points:object[], grid?:number, precedence?:string[]}} args
 */
export function attributeMismatch({ buildSil, refSil, points, grid = ROOF_DIFF_DEFAULTS.grid, precedence = ROOF_DIFF_DEFAULTS.precedence }) {
  const nb = normalizeSilhouette(buildSil, { grid, fit: "aspect" });
  const nr = normalizeSilhouette(refSil, { grid, fit: "aspect" });
  const score = iou(nb, nr);

  // nearest-region field: seed projected points through the build mask's own placement
  const G = grid;
  const regionOf = new Int16Array(G * G).fill(-1);
  const names = [...precedence];
  const nameIdx = new Map(names.map((n, i) => [n, i]));
  const queue = [];
  if (buildSil.bbox) {
    const bbox = buildSil.bbox;
    const { tw, th, ox, oy } = normalizePlacement(bbox, { grid: G, fit: "aspect" });
    const bw = bbox.x1 - bbox.x0;
    const bh = bbox.y1 - bbox.y0;
    const seeds = [...points].sort((a, b) => (nameIdx.get(a.region) ?? names.length) - (nameIdx.get(b.region) ?? names.length));
    for (const pt of seeds) {
      if (!nameIdx.has(pt.region)) { nameIdx.set(pt.region, names.length); names.push(pt.region); }
      const gx = Math.min(G - 1, Math.max(0, Math.floor(ox + ((pt.sx - bbox.x0) * tw) / bw)));
      const gy = Math.min(G - 1, Math.max(0, Math.floor(oy + ((pt.sy - bbox.y0) * th) / bh)));
      const i = gy * G + gx;
      if (regionOf[i] === -1) { regionOf[i] = nameIdx.get(pt.region); queue.push(i); }
    }
  }
  for (let q = 0; q < queue.length; q++) { // multi-source BFS, 4-neighbor
    const i = queue[q];
    const x = i % G, y = (i / G) | 0, r = regionOf[i];
    if (x > 0 && regionOf[i - 1] === -1) { regionOf[i - 1] = r; queue.push(i - 1); }
    if (x < G - 1 && regionOf[i + 1] === -1) { regionOf[i + 1] = r; queue.push(i + 1); }
    if (y > 0 && regionOf[i - G] === -1) { regionOf[i - G] = r; queue.push(i - G); }
    if (y < G - 1 && regionOf[i + G] === -1) { regionOf[i + G] = r; queue.push(i + G); }
  }

  const byRegion = {};
  let extra = 0, missing = 0, unattributed = 0;
  for (let i = 0; i < G * G; i++) {
    const b = nb.data[i] ? 1 : 0;
    const r = nr.data[i] ? 1 : 0;
    if (b === r) continue;
    const kind = b ? "extra" : "missing";
    if (b) extra++; else missing++;
    if (regionOf[i] === -1) { unattributed++; continue; }
    const name = names[regionOf[i]];
    byRegion[name] = byRegion[name] ?? { extra: 0, missing: 0 };
    byRegion[name][kind]++;
  }
  return { iou: round3(score), grid: G, mismatchPx: extra + missing, extra, missing, byRegion, unattributed };
}

// --- height profiles --------------------------------------------------------

/** Max GLB surface height over a column's center, sampled from voxel-space triangles. */
function glbHeightAt(aTris, x, z) {
  const px = x + 0.5, pz = z + 0.5;
  let best = null;
  for (const t of aTris) {
    const [a, b, c] = t.verts;
    const d = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]); // xz 2-area
    if (Math.abs(d) < 1e-9) continue; // vertical / degenerate in plan view
    const w1 = ((pz - a[2]) * (c[0] - a[0]) - (px - a[0]) * (c[2] - a[2])) / d;
    const w2 = ((b[2] - a[2]) * (px - a[0]) - (b[0] - a[0]) * (pz - a[2])) / d;
    const w0 = 1 - w1 - w2;
    const eps = -1e-9;
    if (w0 < eps || w1 < eps || w2 < eps) continue;
    const y = w0 * a[1] + w1 * b[1] + w2 * c[1];
    if (best === null || y > best) best = y;
  }
  return best;
}

const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function profileStats(pairs) {
  const both = pairs.filter((p) => p.build != null && p.glb != null);
  const uncovered = pairs.length - both.length;
  if (!both.length) return { rmse: null, maxAbs: null, mean: null, uncovered, count: 0 };
  let sq = 0, sum = 0, maxAbs = 0;
  for (const p of both) {
    const dv = p.delta;
    sq += dv * dv;
    sum += dv;
    if (Math.abs(dv) > Math.abs(maxAbs)) maxAbs = dv;
  }
  return { rmse: round3(Math.sqrt(sq / both.length)), maxAbs: round3(maxAbs), mean: round3(sum / both.length), uncovered, count: both.length };
}

/**
 * Per-gable height profiles along the RIDGE (max column height per ridge-axis coordinate) and the
 * RAKES (each end's column line, height per cross coordinate), build vs GLB triangles. Deltas are
 * reported RAW (inherits aabb vertical unreliability — context only) and EAVE-RELATIVE (each side
 * anchored to its own measured eave: build = mean recorded `eaveY`; GLB = median sampled height
 * over the recorded eave-edge columns) — the refit-grade number. PURE.
 * @returns {{gable:string, anchors:object, ridge:object, rakes:object[]}}
 */
export function heightProfiles({ gable, tops, aTris }) {
  const axis = gable.ridge.axis;
  const cols = [...colsSet(gable.footprint)].map((k) => k.split(",").map(Number));
  const alongOf = ([x, z]) => (axis === "x" ? x : z);
  const crossOf = ([x, z]) => (axis === "x" ? z : x);

  // sample every footprint column once
  const sampled = new Map(); // "x,z" → {build, glb}
  for (const [x, z] of cols) {
    sampled.set(colKey(x, z), { build: tops.get(colKey(x, z)) ?? null, glb: glbHeightAt(aTris, x, z) });
  }

  // anchors
  const buildEave = gable.sides.length ? gable.sides.reduce((s, side) => s + side.eaveY, 0) / gable.sides.length : null;
  const glbEaveSamples = [];
  for (const side of gable.sides) {
    for (const [x, z] of cols) {
      const c = side.eaveDir[1] === axis ? alongOf([x, z]) : crossOf([x, z]);
      if (c === side.eaveEdge) {
        const s = sampled.get(colKey(x, z));
        if (s?.glb != null) glbEaveSamples.push(s.glb);
      }
    }
  }
  const glbEave = median(glbEaveSamples);

  const entry = (vKey, group) => {
    let build = null, glb = null;
    for (const col of group) {
      const s = sampled.get(colKey(col[0], col[1]));
      if (s.build != null && (build === null || s.build > build)) build = s.build;
      if (s.glb != null && (glb === null || s.glb > glb)) glb = s.glb;
    }
    const raw = build != null && glb != null ? build + 1 - glb : null; // +1: cell top face vs continuous surface
    // each side's rise above its OWN eave anchor — the +1 face shift cancels (build and eaveY share cell-index units)
    const eaveRel = raw != null && buildEave != null && glbEave != null
      ? (build - buildEave) - (glb - glbEave)
      : null;
    return { v: vKey, build, glb: glb != null ? round3(glb) : null, delta: eaveRel != null ? round3(eaveRel) : null, rawDelta: raw != null ? round3(raw) : null };
  };

  const groupBy = (keyFn) => {
    const m = new Map();
    for (const col of cols) {
      const v = keyFn(col);
      if (!m.has(v)) m.set(v, []);
      m.get(v).push(col);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  };

  const ridgeLine = groupBy(alongOf).map(([v, group]) => entry(v, group));

  const rakes = [];
  for (const end of ["lo", "hi"]) {
    const face = gable.ends?.[end]?.faceCoord ?? null;
    const alongs = cols.map(alongOf);
    const edge = end === "lo" ? Math.min(...alongs) : Math.max(...alongs);
    const at = face ?? edge;
    const line = cols.filter((c) => alongOf(c) === at);
    if (!line.length) continue;
    const byCross = new Map();
    for (const c of line) {
      const v = crossOf(c);
      if (!byCross.has(v)) byCross.set(v, []);
      byCross.get(v).push(c);
    }
    const prof = [...byCross.entries()].sort((a, b) => a[0] - b[0]).map(([v, group]) => entry(v, group));
    rakes.push({ end, at, fitted: face != null, profile: prof, stats: profileStats(prof) });
  }

  return {
    gable: gable.id,
    anchors: { buildEave: buildEave != null ? round3(buildEave) : null, glbEave: glbEave != null ? round3(glbEave) : null, glbEaveSamples: glbEaveSamples.length },
    ridge: { profile: ridgeLine, stats: profileStats(ridgeLine) },
    rakes,
  };
}

/**
 * Assemble the full per-subject record body: per-azimuth attributed mismatch + per-gable height
 * profiles + cross-azimuth summary. The caller (impure runner) supplies everything loaded — occ,
 * gables (ends merged), GLB reference silhouettes, aligned triangles. PURE; plain JSON out.
 */
export function roofRegionDiff({ occ, gables, refSils, aTris, bandFloor = null, grid = ROOF_DIFF_DEFAULTS.grid }) {
  const regions = roofRegions(gables, occ, { bandFloor });
  const azimuths = Object.keys(refSils);
  const buildSils = voxelSilhouettes(occ, azimuths);

  const views = {};
  for (const a of azimuths) {
    const points = projectRegions(regions, occ, resolveAngle(a), { width: buildSils[a].w, height: buildSils[a].h });
    views[a] = attributeMismatch({ buildSil: buildSils[a], refSil: refSils[a], points, grid });
  }

  const profiles = regions.fallback || !aTris
    ? []
    : (gables || []).filter((g) => g?.sides?.length).map((g) => heightProfiles({ gable: g, tops: regions.tops, aTris }));

  // cross-azimuth roof share: how much of the mismatch lands on roof regions vs wall
  const totals = {};
  let mismatch = 0;
  for (const a of azimuths) {
    mismatch += views[a].mismatchPx;
    for (const [r, c] of Object.entries(views[a].byRegion)) {
      totals[r] = totals[r] ?? { extra: 0, missing: 0 };
      totals[r].extra += c.extra;
      totals[r].missing += c.missing;
    }
  }
  const roofPx = Object.entries(totals).filter(([r]) => r !== "wall").reduce((s, [, c]) => s + c.extra + c.missing, 0);

  return {
    schema: ROOF_DIFF_SCHEMA,
    grid,
    regions: { counts: regions.counts, bandFloor: regions.bandFloor, fallback: regions.fallback },
    views,
    profiles,
    summary: {
      mismatchPx: mismatch,
      byRegion: totals,
      roofSharePct: mismatch ? round3((100 * roofPx) / mismatch) : 0,
      worstView: azimuths.length
        ? azimuths.reduce((w, a) => (views[a].mismatchPx > views[w].mismatchPx ? a : w), azimuths[0])
        : null,
    },
  };
}
