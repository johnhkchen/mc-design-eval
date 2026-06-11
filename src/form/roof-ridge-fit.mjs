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
// An unfittable ridge is a NAMED finding and the as-built ridge stays (E-28 Rule 2).
// PURE — no I/O, no GL, no Date/random; runs under the `src/**/*.test.mjs` glob.

/** Schema tag for ridge-fit results embedded in durable records. */
export const RIDGE_FIT_SCHEMA = "roof-ridge-fit/v1";

/** Declared parameters — shared across subjects, never subject-tuned (E-25 Rule 3). */
export const RIDGE_FIT_DEFAULTS = Object.freeze({
  apexGap: 1.0, // apex-cluster tolerance below the maximum: one voxel quantization unit
});

const roundHalf = (v) => Math.round(v * 2) / 2;
const noNegZero = (v) => (v + 0 === 0 ? 0 : v);
const round3 = (v) => noNegZero(Math.round(v * 1e3) / 1e3);

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
 * Bins every roof-band triangle vertex inside the gable's footprint window per ridge-axis cell,
 * takes the apex per bin, and fits the highest contiguous cluster within `apexGap`.
 * @param {object} gable a sane gable from gablesFromRecord
 * @param {{verts:number[][], centroid:number[], area:number}[]} tris alignedTriangles output
 * @param {object} [opts] RIDGE_FIT_DEFAULTS overrides
 * @returns {{height:number, slopeDeg:number, span:number[], length:number, rmse:number,
 *            slices:number} | {reason:string, detail:string}}
 */
export function fitRidgeLine(gable, tris, opts = {}) {
  const o = { ...RIDGE_FIT_DEFAULTS, ...opts };
  const axis = gable.ridge.axis;
  const idx = axis === "x" ? 0 : 2;
  const crossIdx = axis === "x" ? 2 : 0;
  const bbox = gable.footprint.bbox;
  const lo = (axis === "x" ? bbox.minX : bbox.minZ) - 0.5;
  const hi = (axis === "x" ? bbox.maxX : bbox.maxZ) + 0.5;
  const crossLo = (axis === "x" ? bbox.minZ : bbox.minX) - 0.5;
  const crossHi = (axis === "x" ? bbox.maxZ : bbox.maxX) + 0.5;
  const bandFloor = Math.min(...gable.sides.map((s) => Math.floor(s.eaveY)));

  const apex = new Map(); // bin (int along ridge axis) → max vertex y
  for (const t of tris) {
    if (t.area === 0) continue;
    const c = t.centroid;
    if (c[1] < bandFloor || c[crossIdx] < crossLo || c[crossIdx] > crossHi || c[idx] < lo || c[idx] > hi) continue;
    for (const v of t.verts) {
      const bin = Math.round(v[idx]);
      if (bin < lo || bin > hi) continue;
      const cur = apex.get(bin);
      if (cur === undefined || v[1] > cur) apex.set(bin, v[1]);
    }
  }
  if (!apex.size) {
    return { reason: "ridge-unfitted", detail: "no roof-band triangles in the gable window" };
  }

  // the highest contiguous cluster: start at the (lowest-bin) argmax, expand while present and
  // within apexGap of the maximum
  let maxY = -Infinity;
  let start = null;
  for (const [bin, y] of apex) {
    if (y > maxY || (y === maxY && bin < start)) { maxY = y; start = bin; }
  }
  const inCluster = (bin) => apex.has(bin) && apex.get(bin) >= maxY - o.apexGap;
  let loBin = start;
  let hiBin = start;
  while (inCluster(loBin - 1)) loBin--;
  while (inCluster(hiBin + 1)) hiBin++;

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
  return {
    height: round3(mean),
    slopeDeg: round3((Math.atan(slope) * 180) / Math.PI),
    span: [loBin, hiBin],
    length: hiBin - loBin + 1,
    rmse: round3(Math.sqrt(sse / n)),
    slices: apex.size,
  };
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
