// Fit-from-component seam — generator specs fitted from the T-103 component record (T-105-01,
// story S-105, epic E-27). E-27 Rule 1: the reference is the spec, not the substrate — every
// generator parameter here is FITTED (least-squares or equivalent) with the FIT ERROR RECORDED;
// a fit outside its declared tolerance is a NAMED finding and the regularized sampled mass stays
// (the glbFitForPlane honest-miss contract). Rule 4: the component record is the contract — head
// fits read the opening's `headProfile` verbatim, never a re-read of occupancy.
//
//   • fitCircle — Kåsa circle least squares (centroid-shifted 3×3 linear solve: deterministic,
//     no iteration). Fit error = RMSE of radial residuals |dist(p, center) − r| in cells.
//   • fitOpeningHead — the head dispatch. An arch CANDIDATE (record's archCandidate + spring)
//     gets the circle fit, gated by minArchWidth / minArchRise / center-in-span / full disc
//     COVERAGE of every profile column / VERTICAL rmse vs the upper arc within rmseTol (the
//     radial residual alone is gameable — a zigzag profile rings the Kåsa center); a
//     candidate that misses any gate is kind:"none" (the sampled head stays — never a flat head
//     invented over a witnessed arch). A NON-candidate gets the flat fit: level = modal topY
//     (highest count, then lowest level — deterministic), gated by flatRmseTol; an already-flat
//     or 1-wide profile is a recorded NO-OP (the presence-fixpoint flavor: the gate is a
//     supplying-op no-op on a clean head).
//   • stairRunSpecFromPlane / slabStepSpecFromPlane — orientation/pitch specs from a roof-plane
//     record. The GLB fit is preferred (Rule 1: the reference side of the seam) when its own
//     rmse passes glbRmseTol; otherwise the voxel fit stands in and THAT substitution is a named
//     finding. Pitch must be construction-legal: 1:1 (stairs) within pitchTol, 1:2 (slabs)
//     within slabPitchTol — pitchDelta recorded either way. Geometry composition (origins, run
//     lengths) belongs to the applier (the roof program, S-104); the fitted spec carries what
//     the record witnesses: ascent, winding, pitch, provenance.
//
// PURE — no GL, no I/O, no Date/random — runs under the `src/**/*.test.mjs` glob.

import { SHAPED_DEFAULTS } from "./shaped-vocab.mjs";

const round3 = (n) => Math.round(n * 1000) / 1000;

/**
 * Kåsa circle fit: minimize Σ(u² + y² − a·u − b·y − c)² over the centroid-shifted points.
 * @param {number[][]} points [[u,y], ...] — ≥ 3 points required
 * @returns {{center:number[], radius:number, rmse:number}|null} null on degenerate/collinear input
 */
export function fitCircle(points) {
  if (!Array.isArray(points) || points.length < 3) return null;
  const n = points.length;
  let mu = 0, my = 0;
  for (const [u, y] of points) { mu += u; my += y; }
  mu /= n; my /= n;
  // normal equations for z = a·u + b·y + c with z = u² + y², on shifted coords
  let Suu = 0, Suy = 0, Syy = 0, Su = 0, Sy = 0, Szu = 0, Szy = 0, Sz = 0;
  for (const [pu, py] of points) {
    const u = pu - mu, y = py - my;
    const z = u * u + y * y;
    Suu += u * u; Suy += u * y; Syy += y * y; Su += u; Sy += y;
    Szu += z * u; Szy += z * y; Sz += z;
  }
  // 3×3 system: [Suu Suy Su; Suy Syy Sy; Su Sy n] · [a b c]ᵀ = [Szu Szy Sz]ᵀ
  const det =
    Suu * (Syy * n - Sy * Sy) - Suy * (Suy * n - Sy * Su) + Su * (Suy * Sy - Syy * Su);
  const scale = Math.max(Suu, Syy, 1);
  if (!Number.isFinite(det) || Math.abs(det) < 1e-9 * scale * scale) return null; // collinear
  const a = (Szu * (Syy * n - Sy * Sy) - Suy * (Szy * n - Sy * Sz) + Su * (Szy * Sy - Syy * Sz)) / det;
  const b = (Suu * (Szy * n - Sz * Sy) - Szu * (Suy * n - Sy * Su) + Su * (Suy * Sz - Szy * Su)) / det;
  const c = (Suu * (Syy * Sz - Szy * Sy) - Suy * (Suy * Sz - Szy * Su) + Szu * (Suy * Sy - Syy * Su)) / det;
  const r2 = c + (a * a + b * b) / 4;
  if (!(r2 > 0)) return null;
  const center = [a / 2 + mu, b / 2 + my];
  const radius = Math.sqrt(r2);
  let sse = 0;
  for (const [u, y] of points) {
    const d = Math.hypot(u - center[0], y - center[1]) - radius;
    sse += d * d;
  }
  return { center: [round3(center[0]), round3(center[1])], radius: round3(radius), rmse: round3(Math.sqrt(sse / n)) };
}

/** Modal value: highest count, then lowest value — deterministic. */
function modal(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = null;
  for (const [v, c] of counts) {
    if (best === null || c > best.c || (c === best.c && v < best.v)) best = { v, c };
  }
  return best.v;
}

const finding = (code, detail) => ({ code, detail });

/**
 * Fit one opening's head construct from its component-record entry (T-103 shape).
 * @param {{headProfile:{at:number,topY:number}[], extent:{axis:string,range:number[]},
 *          width:number, archCandidate?:boolean, spring?:number|null}} opening
 * @param {object} [opts] tolerance overrides over {@link SHAPED_DEFAULTS}
 * @returns {{kind:"arch", spec:object, fitError:{rmse:number}, provenance:object}
 *         | {kind:"flat", spec:object, fitError:{rmse:number}, noop:boolean}
 *         | {kind:"none", finding:{code:string, detail:string}, fitError?:{rmse:number}}}
 *   arch/flat `spec` feeds archRing/flatHead minus `depth` (the applier measures the wall).
 */
export function fitOpeningHead(opening, opts = {}) {
  const o = { ...SHAPED_DEFAULTS, ...opts };
  const profile = opening?.headProfile;
  if (!Array.isArray(profile) || profile.length === 0 ||
    !profile.every((p) => Number.isInteger(p?.at) && Number.isInteger(p?.topY))) {
    return { kind: "none", finding: finding("no-head-profile", "opening carries no integer headProfile") };
  }
  const points = [...profile].sort((p, q) => p.at - q.at).map((p) => [p.at, p.topY]);
  const tops = points.map((p) => p[1]);
  const minTop = Math.min(...tops);
  const maxTop = Math.max(...tops);
  const rise = maxTop - minTop;
  const width = opening.width ?? points.length;
  const span = { axis: opening.extent?.axis, range: opening.extent?.range };
  const isCandidate = opening.archCandidate === true && opening.spring !== null && opening.spring !== undefined;

  if (isCandidate) {
    // Rule 1: a candidate that cannot be fitted within tolerance is a NAMED miss — the sampled
    // head stays; a flat head is never invented over a witnessed arch.
    if (width < o.minArchWidth) {
      return { kind: "none", finding: finding("arch-too-narrow", `width ${width} < minArchWidth ${o.minArchWidth}`) };
    }
    if (rise < o.minArchRise) {
      return { kind: "none", finding: finding("arch-no-rise", `head rise ${rise} < minArchRise ${o.minArchRise}`) };
    }
    const circle = fitCircle(points);
    if (!circle) {
      return { kind: "none", finding: finding("arch-degenerate", "circle fit is degenerate (collinear head profile)") };
    }
    // The construction error is VERTICAL: the head profile is a curve u → topY and the construct
    // builds the UPPER arc topFit(u) = y0 + √(r² − (u−u0)²). Kåsa's radial residual alone is
    // gameable — a zigzag profile can ring the fitted center within radial tolerance — so the
    // gate is (a) every column covered by the disc, (b) vertical RMSE within rmseTol.
    const [cu, cy] = circle.center;
    let vsse = 0;
    for (const [u, y] of points) {
      const du = u - cu;
      if (Math.abs(du) > circle.radius) {
        return {
          kind: "none", fitError: { radialRmse: circle.rmse },
          finding: finding("arch-profile-uncovered", `column at=${u} lies outside the fitted disc (u0=${cu}, r=${circle.radius})`),
        };
      }
      const d = y - (cy + Math.sqrt(circle.radius * circle.radius - du * du));
      vsse += d * d;
    }
    const rmse = round3(Math.sqrt(vsse / points.length));
    if (rmse > o.rmseTol) {
      return {
        kind: "none", fitError: { rmse, radialRmse: circle.rmse },
        finding: finding("arch-out-of-tolerance", `vertical rmse ${rmse} > rmseTol ${o.rmseTol}`),
      };
    }
    const [lo, hi] = span.range ?? [points[0][0], points.at(-1)[0]];
    if (!(circle.center[0] >= lo && circle.center[0] <= hi)) {
      return {
        kind: "none", fitError: { rmse: circle.rmse },
        finding: finding("arch-center-off-span", `fitted center u=${circle.center[0]} outside span [${lo},${hi}]`),
      };
    }
    const yTop = Math.max(maxTop, Math.ceil(circle.center[1] + circle.radius));
    return {
      kind: "arch",
      spec: {
        center: circle.center, radius: circle.radius, span,
        yRange: [Math.min(minTop, Math.floor(circle.center[1])), yTop + 1],
      },
      fitError: { rmse, radialRmse: circle.rmse },
      provenance: { source: "headProfile", spring: opening.spring, points: points.length },
    };
  }

  // flat path — square the head to the modal level
  const level = modal(tops);
  const rmse = round3(Math.sqrt(tops.reduce((s, t) => s + (t - level) * (t - level), 0) / tops.length));
  if (rise === 0 || width === 1) {
    return { kind: "flat", spec: { level, span, yRange: [level, level + 1] }, fitError: { rmse }, noop: true };
  }
  if (rmse > o.flatRmseTol) {
    return {
      kind: "none", fitError: { rmse },
      finding: finding("flat-out-of-tolerance", `rmse ${rmse} vs modal level ${level} > flatRmseTol ${o.flatRmseTol}`),
    };
  }
  return { kind: "flat", spec: { level, span, yRange: [minTop, level + 1] }, fitError: { rmse }, noop: false };
}

/** Choose the plane fit the spec is anchored to: GLB when its own rmse passes, else voxel —
 * and the substitution is a named finding (Rule 1 provenance). */
function planeSource(plane, o) {
  const findings = [];
  const glb = plane?.glbFit;
  if (glb && Number.isFinite(glb.rmse) && glb.rmse <= o.glbRmseTol && Array.isArray(glb.gradient)) {
    return { fit: glb, source: "glbFit", findings };
  }
  if (glb) findings.push(finding("glb-fit-unusable", `glbFit rmse ${glb.rmse} > glbRmseTol ${o.glbRmseTol} — voxelFit stands in`));
  else findings.push(finding("glb-fit-missing", "plane has no glbFit — voxelFit stands in"));
  const vox = plane?.voxelFit;
  if (vox && Array.isArray(vox.gradient)) return { fit: vox, source: "voxelFit", findings };
  return { fit: null, source: null, findings: [finding("no-fit", "plane carries neither a usable glbFit nor voxelFit")] };
}

function pitchSpec(plane, o, { legalPitch, tol, generator }) {
  const { fit, source, findings } = planeSource(plane, o);
  if (!fit) return { spec: null, source, fitError: null, findings };
  const [gx, gz] = fit.gradient;
  const onX = Math.abs(gx) >= Math.abs(gz);
  const g = onX ? gx : gz;
  const pitch = Math.abs(g);
  const ascent = onX ? (g > 0 ? "+x" : "-x") : (g > 0 ? "+z" : "-z");
  const fitError = {
    pitch: round3(pitch),
    pitchDelta: round3(Math.abs(pitch - legalPitch)),
    crossGradient: round3(Math.abs(onX ? gz : gx)),
    sourceRmse: Number.isFinite(fit.rmse) ? fit.rmse : null,
  };
  if (fitError.pitchDelta > tol) {
    findings.push(finding(`pitch-not-${generator}-legal`, `|gradient| ${fitError.pitch} not within ${tol} of ${legalPitch}`));
    return { spec: null, source, fitError, findings };
  }
  return { spec: { generator, ascent, winding: "walk", riseOverRun: legalPitch }, source, fitError, findings };
}

/**
 * Stair-run orientation/pitch spec from a roof-plane record (T-103 shape: voxelFit/glbFit with
 * `gradient` [dy/dx, dy/dz]). Stair-legal = 1:1 within pitchTol.
 * @returns {{spec:object|null, source:"glbFit"|"voxelFit"|null, fitError:object|null,
 *            findings:object[]}} spec null = the honest miss; fit error recorded regardless.
 */
export function stairRunSpecFromPlane(plane, opts = {}) {
  const o = { ...SHAPED_DEFAULTS, ...opts };
  return pitchSpec(plane, o, { legalPitch: 1, tol: o.pitchTol, generator: "stairRun" });
}

/** Slab-step spec from a roof-plane record — half-step-legal = 1:2 within slabPitchTol. */
export function slabStepSpecFromPlane(plane, opts = {}) {
  const o = { ...SHAPED_DEFAULTS, ...opts };
  return pitchSpec(plane, o, { legalPitch: 0.5, tol: o.slabPitchTol, generator: "slabStep" });
}
