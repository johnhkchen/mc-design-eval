// Roof RIDGE fit — the ridge line as a FITTED construction (T-109-01, story S-109, epic E-28).
//
// The E-27 program fits slopes and eaves; T-108 fits the gable ends; the ridge HEIGHT still
// inherits the sampled blob's top (`p.ridge.y` mean in gablesFromRecord) — and the committed
// records carry a named inconsistency between that height and the fitted planes (the cottage
// "apex shortfall": eave + pitch·run never reaches the recorded ridge). This module closes that
// gap two ways, per the project's parameter-sourcing doctrine:
//
//   • ridgeFromPlanes — the ridge CONSTRUCTED from the already-fitted side planes: the
//     intersection of `eaveY + pitch·dist` for the two opposing sides. Under glb-sourced pitches
//     this is the GLB-fitted ridge height; under voxel pitches it is the declared fallback flavor
//     — and the swap ladder already carries both pitch flavors, so the CAGE arbitrates between
//     the intersect-ridge and the as-built-ridge hypotheses (the T-104 mechanism, no tuned
//     constants). Geometric sanity gates only: the intersection must sit between the eave edges
//     and above both eaves.
//   • fitRidgeLine — the GLB apex line measured in mesh space (alignedTriangles' voxel-space
//     output): per-cell slices along the ridge axis inside the gable window, apex per slice, the
//     highest contiguous cluster within the quantization unit. Records the AC's fit evidence —
//     height, direction (slope of the apex line, ≈0 for a sane ridge), length (cluster span) and
//     rmse — but is NEVER applied as an absolute height: vertical aabb-affine maps the mesh top
//     onto the spike-inflated blob top (the roof-end-fit offsetDelta lesson). Evidence, not
//     geometry.
//
// T-122-01 (story S-122) adds the CLOSURE: fitRidgeProfile reads the GLB ridge as the roof-diff
// instrument samples it (surface at column centers, not vertex peaks), and closeRidge applies it
// to the gable DATA — eave-relatively (gableEaveAnchors' like-for-like arithmetic; absolute
// aabb-affine verticals stay untrusted), with side pitches re-derived through the closed ridge
// and hip demands the profile refutes cleared. The shared surface definition is untouched.
//
// An unfittable ridge is a NAMED finding and the as-built ridge stays (E-28 Rule 2).
// PURE — no I/O, no GL, no Date/random; runs under the `src/**/*.test.mjs` glob.

import { glbHeightAt, ROOF_FIT_DEFAULTS } from "./roof-fit.mjs";

/** Schema tag for ridge-fit results embedded in durable records. */
export const RIDGE_FIT_SCHEMA = "roof-ridge-fit/v1";

/** Declared parameters — shared across subjects, never subject-tuned (E-25 Rule 3). */
export const RIDGE_FIT_DEFAULTS = Object.freeze({
  apexGap: 1.0, // apex-cluster tolerance below the maximum: one voxel quantization unit
  excludeDilate: 1, // protrusion-exclusion grows by one plan cell — the GLB protrusion bleeds past
                    // the recorded columns under the aabb's sub-cell offsets (same ±-one-unit
                    // convention as apexGap and the fits' ±0.5 windows)
  minProfileCoverage: 0.5, // closure precondition: the sampled dominant line must cover at least
                           // half the ridge-axis extent (a fragmentary profile is not a ridge read)
});

const roundHalf = (v) => Math.round(v * 2) / 2;
const noNegZero = (v) => (v + 0 === 0 ? 0 : v);
const round3 = (v) => noNegZero(Math.round(v * 1e3) / 1e3);

/** Protrusion-exclusion set grown by `excludeDilate` plan cells (the shared ±-one-unit bleed). */
function buildExclusion(exclude, dilate) {
  if (!exclude || !exclude.size || dilate <= 0) return exclude ?? null;
  const grown = new Set(exclude);
  for (const k of exclude) {
    const [x, z] = k.split(",").map(Number);
    for (let dx = -dilate; dx <= dilate; dx++) {
      for (let dz = -dilate; dz <= dilate; dz++) grown.add(`${x + dx},${z + dz}`);
    }
  }
  return grown;
}

/**
 * The DOMINANT contiguous line over a bin→height map (T-118-01's selector, extracted so the
 * vertex-sourced apex (fitRidgeLine) and the sampled-surface profile (fitRidgeProfile) share one
 * definition): candidate clusters expand from every anchor bin while contiguous and within
 * `apexGap` of the anchor; the LONGEST wins (ties: higher mean, then lower start). A
 * higher-but-shorter cluster that lost is recorded as `spike` — counted, never hidden.
 * Least-squares line over the winner; returns the fitRidgeLine record shape.
 */
function dominantLine(apex, o) {
  const bins = [...apex.keys()].sort((p, q) => p - q);
  const candidates = new Map(); // "lo,hi" → {lo, hi, mean}
  for (const anchor of bins) {
    const aY = apex.get(anchor);
    const inBand = (bin) => apex.has(bin) && Math.abs(apex.get(bin) - aY) <= o.apexGap;
    let cl = anchor;
    let ch = anchor;
    while (inBand(cl - 1)) cl--;
    while (inBand(ch + 1)) ch++;
    const key = `${cl},${ch}`;
    if (!candidates.has(key)) {
      let s = 0;
      for (let bin = cl; bin <= ch; bin++) s += apex.get(bin);
      candidates.set(key, { lo: cl, hi: ch, mean: s / (ch - cl + 1) });
    }
  }
  const ranked = [...candidates.values()].sort((p, q) =>
    (q.hi - q.lo) - (p.hi - p.lo) || q.mean - p.mean || p.lo - q.lo);
  const sel = ranked[0];
  const loBin = sel.lo;
  const hiBin = sel.hi;
  // the highest cluster, for the spike record when it lost to a longer line
  let selMax = -Infinity;
  for (let bin = loBin; bin <= hiBin; bin++) selMax = Math.max(selMax, apex.get(bin));
  let peakY = -Infinity;
  let peak = null;
  for (const c of candidates.values()) {
    let m = -Infinity;
    for (let bin = c.lo; bin <= c.hi; bin++) m = Math.max(m, apex.get(bin));
    if (m > peakY) { peakY = m; peak = c; }
  }
  const spike = peak && (peak.lo !== loBin || peak.hi !== hiBin) && peakY > selMax + o.apexGap
    ? { height: round3(peakY), span: [peak.lo, peak.hi] }
    : null;

  // least-squares line over the cluster (direction = the apex line's slope along the ridge axis)
  let n = 0, sv = 0, sy = 0, svv = 0, svy = 0;
  for (let bin = loBin; bin <= hiBin; bin++) {
    const y = apex.get(bin);
    n++; sv += bin; sy += y; svv += bin * bin; svy += bin * y;
  }
  const denom = n * svv - sv * sv;
  const slope = denom !== 0 ? (n * svy - sv * sy) / denom : 0;
  const mean = sy / n;
  let sse = 0;
  const vMean = sv / n;
  for (let bin = loBin; bin <= hiBin; bin++) {
    const fit = mean + slope * (bin - vMean);
    const r = apex.get(bin) - fit;
    sse += r * r;
  }
  const out = {
    height: round3(mean),
    slopeDeg: round3((Math.atan(slope) * 180) / Math.PI),
    span: [loBin, hiBin],
    length: hiBin - loBin + 1,
    rmse: round3(Math.sqrt(sse / n)),
    slices: apex.size,
  };
  if (spike) out.spike = spike;
  return out;
}

/** Slope/intercept of one side's surface along the run axis: y(v) = m·v + c (evalSideHeight's
 *  arithmetic, solved form). */
function sideLine(side) {
  const m = side.eaveDir.startsWith("+") ? -side.pitch : side.pitch;
  const c = side.eaveY - m * side.eaveEdge;
  return { m, c };
}

/**
 * The ridge constructed from the gable's two FITTED side planes: their intersection along the run
 * axis. Returns `{y, v, valid, reasons}` — `reasons` non-empty (and `valid:false`) when a side is
 * unparameterized, the slopes do not oppose, or the intersection violates the geometric gates
 * (between the eave edges ± 0.5; above both eaves + 0.5). PURE.
 * @param {object} gable a gable from gablesFromRecord
 */
export function ridgeFromPlanes(gable) {
  const reasons = [];
  const [a, b] = gable.sides ?? [];
  for (const s of [a, b]) {
    if (!s || s.pitch === null || s.pitch === undefined || s.eaveY === null || s.eaveEdge === null || !s.eaveDir) {
      reasons.push(`side ${s?.planeId ?? "missing"} unparameterized (pitch/eave incomplete)`);
    }
  }
  if (reasons.length) return { y: null, v: null, valid: false, reasons };

  const la = sideLine(a);
  const lb = sideLine(b);
  if (la.m === lb.m) {
    return { y: null, v: null, valid: false, reasons: [`side slopes do not oppose (m=${round3(la.m)} both)`] };
  }
  const v = (lb.c - la.c) / (la.m - lb.m);
  const y = la.m * v + la.c;

  const lo = Math.min(a.eaveEdge, b.eaveEdge) - 0.5;
  const hi = Math.max(a.eaveEdge, b.eaveEdge) + 0.5;
  if (v < lo || v > hi) reasons.push(`intersection v ${round3(v)} outside the run window [${lo}, ${hi}]`);
  const eaveTop = Math.max(a.eaveY, b.eaveY);
  if (y < eaveTop + 0.5) reasons.push(`intersection y ${round3(y)} not above the eaves (${eaveTop})`);

  return { y: round3(y), v: round3(v), valid: reasons.length === 0, reasons };
}

/**
 * The GLB apex line, measured in voxel-aligned mesh space (recorded EVIDENCE — see header).
 * Bins every roof-band triangle vertex over the gable's OWN footprint columns per ridge-axis
 * cell, takes the apex per bin, and fits the highest contiguous cluster within `apexGap`.
 *
 * T-118-01 (the roof-diff findings): the original bbox window let NON-ROOF masses inside the
 * bounding rectangle win the cluster — the cottage apexLine (26.484) was the GLB CHIMNEY, the
 * gatehouse apexLine (31.5) the side-wall PARAPET tops. Sampling is therefore restricted to the
 * footprint column SET (the fillBetween cols, not their bbox), and `opts.exclude` (a Set of
 * "x,z" protrusion columns — chimneyColumns' shape) drops recorded protrusions that sit INSIDE
 * the footprint. What was excluded is counted (`excludedColumns`), never hidden.
 * @param {object} gable a sane gable from gablesFromRecord
 * @param {{verts:number[][], centroid:number[], area:number}[]} tris alignedTriangles output
 * @param {object} [opts] RIDGE_FIT_DEFAULTS overrides + {exclude?:Set<string>}
 * @returns {{height:number, slopeDeg:number, span:number[], length:number, rmse:number,
 *            slices:number, excludedColumns:number} | {reason:string, detail:string}}
 */
export function fitRidgeLine(gable, tris, opts = {}) {
  const o = { ...RIDGE_FIT_DEFAULTS, ...opts };
  const axis = gable.ridge.axis;
  const idx = axis === "x" ? 0 : 2;
  const bbox = gable.footprint.bbox;
  const lo = (axis === "x" ? bbox.minX : bbox.minZ) - 0.5;
  const hi = (axis === "x" ? bbox.maxX : bbox.maxZ) + 0.5;
  const bandFloor = Math.min(...gable.sides.map((s) => Math.floor(s.eaveY)));
  const rawCols = gable.footprint?.cols;
  const cols = rawCols instanceof Set ? rawCols : new Set(rawCols ?? []);
  const exclude = buildExclusion(o.exclude ?? null, o.excludeDilate);
  const excludedCols = new Set();
  const colOf = (p) => `${Math.floor(p[0])},${Math.floor(p[2])}`;
  const inSample = (p) => {
    const k = colOf(p);
    if (cols.size && !cols.has(k)) return false;
    if (exclude && exclude.has(k)) {
      excludedCols.add(k);
      return false;
    }
    return true;
  };

  const apex = new Map(); // bin (int along ridge axis) → max vertex y
  for (const t of tris) {
    if (t.area === 0) continue;
    const c = t.centroid;
    if (c[1] < bandFloor || !inSample(c)) continue;
    for (const v of t.verts) {
      const bin = Math.round(v[idx]);
      if (bin < lo || bin > hi) continue;
      if (!inSample(v)) continue;
      const cur = apex.get(bin);
      if (cur === undefined || v[1] > cur) apex.set(bin, v[1]);
    }
  }
  if (!apex.size) {
    return { reason: "ridge-unfitted", detail: "no roof-band triangles over the gable's footprint columns" };
  }

  // T-118-01 (the roof-diff findings): the ridge apex is the DOMINANT contiguous line, not the
  // highest cluster — a protrusion the exclusion misses (the GLB chimney is wider than the
  // recorded build columns) is a short spike, and "highest wins" handed it the whole apexLine.
  const line = dominantLine(apex, o);
  // key order preserved exactly (committed fit records are byte-compared under --repro)
  const out = {
    height: line.height, slopeDeg: line.slopeDeg, span: line.span, length: line.length,
    rmse: line.rmse, slices: line.slices, excludedColumns: excludedCols.size,
  };
  if (line.spike) out.spike = line.spike;
  return out;
}

/**
 * The same gables with each sane gable's ridge height replaced by the plane-intersection ridge
 * (rounded to halves) where {@link ridgeFromPlanes} is valid — the swap ladder's ridge-fitted
 * hypothesis. Unfittable ridges keep the as-built height with a NAMED finding (Rule 2). The
 * intersection values travel on the gable (`ridgeIntersect`) for the durable record. PURE; does
 * not mutate the input.
 * @param {object[]} gables
 * @returns {{gables:object[], findings:object[]}}
 */
export function ridgeVariant(gables) {
  const findings = [];
  const out = gables.map((g) => {
    if (!g.sane) return g;
    // T-112-01: hip-cap (and any non-2-side) gables pass through — their apex is already a
    // FITTED construction (roof-hip-fit), not an unfitted ridge; no finding, no flavor.
    if (g.kind || (g.sides?.length ?? 0) !== 2) return g;
    const r = ridgeFromPlanes(g);
    if (!r.valid) {
      findings.push({
        code: "ridge-unfitted",
        where: g.id,
        detail: `${r.reasons.join("; ")} — as-built ridge stays (Rule 2)`,
      });
      return g;
    }
    const y = roundHalf(r.y);
    return {
      ...g,
      ridge: { ...g.ridge, y },
      ridgeIntersect: { y: r.y, v: r.v, deltaVsRecord: round3(y - g.ridge.y), source: "intersect" },
    };
  });
  return { gables: out, findings };
}

/**
 * The GLB ridge line as the INSTRUMENT reads it (T-122-01): the surface sampled at footprint
 * column centers (roof-fit glbHeightAt — the roof-region-diff sampler, one ruler), max across the
 * gable's cross-section per ridge-axis station, protrusions excluded exactly as fitRidgeLine
 * excludes them, dominant line selected by the same T-118 selector. This is the closure's height
 * source: the vertex-sourced apexLine can rest on a handful of surviving bins after exclusion
 * (the barn: 3 of 48) while the sampled profile covers the span the instrument will verify.
 * @param {object} gable a sane gable from gablesFromRecord
 * @param {{verts:number[][], centroid:number[], area:number}[]} aTris alignedTriangles output
 * @param {object} [opts] RIDGE_FIT_DEFAULTS overrides + {exclude?:Set<string>}
 * @returns {{height:number, slopeDeg:number, span:number[], length:number, rmse:number,
 *            slices:number, excludedColumns:number, spike?:object} | {reason:string, detail:string}}
 */
export function fitRidgeProfile(gable, aTris, opts = {}) {
  const o = { ...RIDGE_FIT_DEFAULTS, ...opts };
  const idx = gable.ridge.axis === "x" ? 0 : 1;
  const rawCols = gable.footprint?.cols;
  const colSet = rawCols instanceof Set ? rawCols : new Set(rawCols ?? []);
  const exclude = buildExclusion(o.exclude ?? null, o.excludeDilate);
  const excludedCols = new Set();
  const apex = new Map(); // bin (int along ridge axis) → max sampled surface height
  for (const k of colSet) {
    if (exclude && exclude.has(k)) {
      excludedCols.add(k);
      continue;
    }
    const col = k.split(",").map(Number);
    const h = glbHeightAt(aTris, col[0], col[1]);
    if (h === null) continue;
    const bin = col[idx];
    const cur = apex.get(bin);
    if (cur === undefined || h > cur) apex.set(bin, h);
  }
  if (!apex.size) {
    return { reason: "ridge-profile-unfitted", detail: "no GLB surface samples over the gable's footprint columns" };
  }
  const line = dominantLine(apex, o);
  const out = {
    height: line.height, slopeDeg: line.slopeDeg, span: line.span, length: line.length,
    rmse: line.rmse, slices: line.slices, excludedColumns: excludedCols.size,
  };
  if (line.spike) out.spike = line.spike;
  return out;
}

/**
 * RIDGE CLOSURE (T-122-01, story S-122, epic E-30) — build the ridge at the fitted height.
 *
 * The parametric surface is min(ridge cap, side planes, hip end planes); committed fits carried
 * three composing height losses: shallow independently-fitted side pitches intersecting BELOW the
 * declared ridge, a misfitted hip end plane honored as a hard ceiling, and a ridge.y inherited
 * from the blob median while the trusted GLB reading sat above it. This closes all three on the
 * gable DATA (the shared surface definition is untouched):
 *
 *   • ridge.y ← roundHalf(buildEave + (profile.height − glbEave)) — the sampled GLB ridge line
 *     applied EAVE-RELATIVELY (gableEaveAnchors' like-for-like arithmetic; absolute aabb-affine
 *     verticals stay untrusted, the roof-end-fit lesson);
 *   • each side's pitch ← (ridge.y − eaveY) / run — the plane forced through the two trustworthy
 *     anchors (its own eave line and the closed ridge); the fitted pitch stays recorded as
 *     `pitchFitted` evidence;
 *   • a demanded hip end whose sampled profile holds the ridge to the footprint edge is REFUTED
 *     (the short recorded ridge was a blob artifact — the profile can only refute, never invent);
 *     a hip that survives is re-anchored through (ridgeEnd, ridge.y).
 *
 * Geometric sanity only (E-25 Rule 3 — shared gates, no subject tuning): profile coverage,
 * target above both eaves, derived pitches in (0, maxPitch]. ANY failure → the gable is returned
 * UNCHANGED and the refusal is named (E-28 Rule 2). The vertex apexLine is cross-checked and the
 * divergence recorded (`apexCheck`) — named when it exceeds apexGap, never blocking.
 *
 * @param {object} gable a sane 2-side gable (hip-cap/kind gables pass through unchanged)
 * @param {object} args {profile: fitRidgeProfile result, anchors: gableEaveAnchors result,
 *                       apexLine?: fitRidgeLine result|null, opts?: overrides}
 * @returns {{gable:object, closure:object}}
 */
export function closeRidge(gable, { profile, anchors, apexLine = null, opts = {} } = {}) {
  const o = { ...RIDGE_FIT_DEFAULTS, ...opts };
  const refusals = [];
  const closure = { applied: false, from: gable.ridge?.y ?? null, to: null, refusals };
  const refuse = (detail) => {
    refusals.push(detail);
    return { gable, closure };
  };

  if (!gable.sane || gable.kind || (gable.sides?.length ?? 0) !== 2) {
    return refuse("not a sane 2-side gable — closure does not apply");
  }
  if (!profile || profile.reason) {
    return refuse(`ridge profile unfitted${profile?.detail ? ` (${profile.detail})` : ""} — as-fitted gable stays (Rule 2)`);
  }
  if (!anchors || anchors.buildEave === null || anchors.glbEave === null) {
    return refuse("eave anchors unavailable (no GLB samples on any eave edge) — as-fitted gable stays (Rule 2)");
  }
  const bbox = gable.footprint.bbox;
  const axis = gable.ridge.axis;
  const fLo = axis === "x" ? bbox.minX : bbox.minZ;
  const fHi = axis === "x" ? bbox.maxX : bbox.maxZ;
  const extent = fHi - fLo + 1;
  const coverage = extent > 0 ? profile.length / extent : 0;
  if (coverage < o.minProfileCoverage) {
    return refuse(`profile covers ${round3(coverage)} of the ridge-axis extent < minProfileCoverage ${o.minProfileCoverage}`);
  }

  const toY = roundHalf(anchors.buildEave + (profile.height - anchors.glbEave));
  for (const s of gable.sides) {
    if (toY <= s.eaveY + 0.5) {
      return refuse(`closed ridge y ${toY} not above eave y ${s.eaveY} (${s.planeId ?? "?"})`);
    }
  }
  const sidesPlan = gable.sides.map((s) => {
    const run = s.run ?? null;
    if (run === null || run <= 0) return { side: s, error: `side ${s.planeId ?? "?"} has no recorded run` };
    const pitch = round3((toY - s.eaveY) / run);
    if (!(pitch > 0) || pitch > (o.maxPitch ?? ROOF_FIT_DEFAULTS.maxPitch)) {
      return { side: s, error: `derived pitch ${pitch} outside (0, ${o.maxPitch ?? ROOF_FIT_DEFAULTS.maxPitch}] (${s.planeId ?? "?"})` };
    }
    return { side: s, pitch };
  });
  const sideError = sidesPlan.find((p) => p.error);
  if (sideError) return refuse(sideError.error);

  // hip arbitration: refute a demanded end the profile holds to the edge; re-anchor a survivor
  let hip = gable.hip;
  const hipPlan = { refuted: [], reanchored: [] };
  if (hip?.demanded) {
    hip = { ...hip, fitted: hip.fitted ? { ...hip.fitted } : undefined };
    const eave = Math.min(...gable.sides.map((s) => s.eaveY));
    for (const [end, edge] of [["lo", fLo], ["hi", fHi]]) {
      if (!hip[end]) continue;
      const atEdge = end === "lo" ? profile.span[0] <= edge + 1 : profile.span[1] >= edge - 1;
      if (atEdge) {
        hip[end] = false;
        hipPlan.refuted.push(end);
        continue;
      }
      const ridgeEnd = end === "lo" ? hip.ridgeLo : hip.ridgeHi;
      const run = ridgeEnd === null || ridgeEnd === undefined ? null : Math.abs(edge - ridgeEnd);
      if (run === null || run <= 0) return refuse(`hip ${end} has no usable ridge end for re-anchoring`);
      const pitch = round3((toY - eave) / run);
      if (!(pitch > 0) || pitch > (o.maxPitch ?? ROOF_FIT_DEFAULTS.maxPitch)) {
        return refuse(`re-anchored hip ${end} pitch ${pitch} outside (0, ${o.maxPitch ?? ROOF_FIT_DEFAULTS.maxPitch}]`);
      }
      hip.fitted = { lo: hip.fitted?.lo ?? null, hi: hip.fitted?.hi ?? null, ...hip.fitted };
      hip.fitted[end] = { pitch, rmse: null, triangles: null, source: "ridge-closure" };
      hipPlan.reanchored.push({ end, pitch });
    }
    hip.demanded = hip.lo || hip.hi;
    if (hipPlan.refuted.length) hip.refuted = "ridge-profile-to-edge";
  }

  const closed = {
    ...gable,
    ridge: { ...gable.ridge, y: toY },
    sides: sidesPlan.map(({ side, pitch }) => ({ ...side, pitch, pitchFitted: side.pitch })),
    ...(hip !== gable.hip ? { hip } : {}),
  };
  const apexCheck = apexLine && apexLine.height !== undefined ? round3(toY - apexLine.height) : null;
  const out = {
    applied: true,
    from: closure.from,
    to: toY,
    profile: { height: profile.height, span: profile.span, length: profile.length, rmse: profile.rmse },
    anchors: { buildEave: round3(anchors.buildEave), glbEave: round3(anchors.glbEave), dropped: anchors.dropped },
    apexCheck,
    apexDiverges: apexCheck !== null && Math.abs(apexCheck) > o.apexGap,
    sides: sidesPlan.map(({ side, pitch }) => ({ planeId: side.planeId ?? null, pitchFrom: side.pitch, pitchTo: pitch })),
    hip: hipPlan,
    refusals,
  };
  return { gable: closed, closure: out };
}
