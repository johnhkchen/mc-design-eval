// Portable CIE-Lab color engine (T-020-01, Epic E-10).
//
// The math core for color matching: convert sRGB to CIE L*a*b*, measure perceptual
// distance (ΔE), and pick the nearest entry from a palette. This is the *portable
// voxelizer color core* — it is deliberately the one piece of E-10 with ZERO
// mc-design-eval / Minecraft / DesignArtifact knowledge. It takes a palette as plain
// `[{ key, lab }]` data and returns a key; it never touches block ids, artifacts,
// files, or the network. That boundary is load-bearing — both application points
// (concept-image→grid, 2D; voxel-grid→blocks, 3D) reuse this same engine, and a stray
// `../` import would quietly couple it to the project. See
// docs/knowledge/cielab-block-matching.md for the rationale and the exact math.
//
// Input convention: 8-bit sRGB, each channel 0–255 (the natural form of texture/image
// pixels), normalized to 0–1 internally before the inverse-gamma step.
//
// The distance metric is PLUGGABLE: CIE76 (plain Euclidean in Lab) is the default and
// is sufficient for nearest-block matching; CIEDE2000 can be passed in later via
// `nearest(..., { metric })` with no change to existing callers.

/** @typedef {[number, number, number]} RGB  8-bit sRGB; each component 0–255. */
/** @typedef {[number, number, number]} Lab  CIE L*a*b* (L* 0–100; a*, b* ≈ ±128). */
/** @typedef {{ key: string, lab: Lab }} PaletteEntry */
/** @typedef {{ key: string, deltaE: number, lab: Lab }} NearestResult */

// D65 reference white, XYZ scaled to 0–100 (knowledge doc §conversion).
const D65 = { Xn: 95.0489, Yn: 100, Zn: 108.884 };

// Lab f() breakpoint constants: δ = 6/29.
const DELTA = 6 / 29;
const DELTA_CUBED = DELTA ** 3; //              ≈ 0.008856
const THREE_DELTA_SQ = 3 * DELTA * DELTA; //    ≈ 0.128419

// Linear-sRGB → XYZ, D65 primaries (the standard Lindbloom sRGB/D65 matrix).
const M = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.072175],
  [0.0193339, 0.119192, 0.9503041],
];

/** sRGB inverse gamma, channel in 0..1 → linear. */
function inverseGamma(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** The Lab nonlinearity f(t), with the linear segment below δ³. */
function f(t) {
  return t > DELTA_CUBED ? Math.cbrt(t) : t / THREE_DELTA_SQ + 4 / 29;
}

/** Validate an 8-bit RGB triple; throw an actionable error otherwise. */
function assertRgb(rgb) {
  if (!Array.isArray(rgb) || rgb.length !== 3) {
    throw new Error("srgbToLab: expected an [r, g, b] array of length 3");
  }
  for (const c of rgb) {
    if (typeof c !== "number" || !Number.isFinite(c) || c < 0 || c > 255) {
      throw new Error(`srgbToLab: each channel must be a finite number in [0, 255], got ${c}`);
    }
  }
}

/**
 * Convert 8-bit sRGB to CIE L*a*b* (D65). Pure and deterministic.
 * @param {RGB} rgb  each channel 0–255
 * @returns {Lab}
 */
export function srgbToLab(rgb) {
  assertRgb(rgb);
  const r = inverseGamma(rgb[0] / 255);
  const g = inverseGamma(rgb[1] / 255);
  const b = inverseGamma(rgb[2] / 255);
  // linear RGB → XYZ, scaled to 0–100.
  const X = (M[0][0] * r + M[0][1] * g + M[0][2] * b) * 100;
  const Y = (M[1][0] * r + M[1][1] * g + M[1][2] * b) * 100;
  const Z = (M[2][0] * r + M[2][1] * g + M[2][2] * b) * 100;
  const fx = f(X / D65.Xn);
  const fy = f(Y / D65.Yn);
  const fz = f(Z / D65.Zn);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/**
 * CIE76 color difference: plain Euclidean distance in Lab. Symmetric; ≥ 0;
 * deltaE76(x, x) === 0. The default metric for {@link nearest}.
 * @param {Lab} lab1
 * @param {Lab} lab2
 * @returns {number}
 */
export function deltaE76(lab1, lab2) {
  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * The default, canonical ΔE metric (CIE76). Aliased so callers can write `deltaE`
 * and a future CIEDE2000 can be swapped in via {@link nearest}'s `metric` option
 * without touching call sites that take the default.
 * @type {(a: Lab, b: Lab) => number}
 */
export const deltaE = deltaE76;

/**
 * Find the palette entry whose Lab is nearest to a pre-computed `targetLab` under
 * `metric` (argmin ΔE). This is the core scan; callers holding a Lab target (e.g. a
 * cluster centroid formed in Lab space, T-021) use this directly rather than
 * round-tripping a representative rgb back through {@link srgbToLab}. Palette entries
 * carry pre-converted, cached Lab. Linear scan — palettes are small (≈5–30 entries),
 * so a scan beats building a tree. (For matching against a *large* block set, build a
 * k-d tree on Lab and query it here instead.)
 * @param {Lab} targetLab  target color already in CIE L*a*b*
 * @param {PaletteEntry[]} palette  non-empty `[{ key, lab }]`
 * @param {{ metric?: (a: Lab, b: Lab) => number }} [opts]
 * @returns {NearestResult}
 */
export function nearestLab(targetLab, palette, { metric = deltaE76 } = {}) {
  if (!Array.isArray(palette) || palette.length === 0) {
    throw new Error("nearestLab: palette must be a non-empty array of { key, lab }");
  }
  let best = palette[0];
  let bestD = metric(targetLab, best.lab);
  for (let i = 1; i < palette.length; i++) {
    const d = metric(targetLab, palette[i].lab);
    if (d < bestD) {
      bestD = d;
      best = palette[i];
    }
  }
  return { key: best.key, deltaE: bestD, lab: best.lab };
}

/**
 * Find the palette entry whose Lab is nearest to `rgb` under `metric` (argmin ΔE).
 * The target color is converted sRGB→Lab here, then delegated to {@link nearestLab};
 * the public contract (signature + `{ key, deltaE, lab }` return) is unchanged.
 * @param {RGB} rgb  target color, 0–255
 * @param {PaletteEntry[]} palette  non-empty `[{ key, lab }]`
 * @param {{ metric?: (a: Lab, b: Lab) => number }} [opts]
 * @returns {NearestResult}
 */
export function nearest(rgb, palette, opts) {
  return nearestLab(srgbToLab(rgb), palette, opts);
}
