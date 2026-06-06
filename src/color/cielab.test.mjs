// Unit suite for the portable CIE-Lab color engine (T-020-01, AC: independently-
// derived expectations).
//
// Offline, deterministic, pure. Imports ONLY node built-ins + the module under test —
// which also serves as a regression guard on the zero-dependency boundary.
//
// Reference Lab values are published sRGB/D65 figures (Bruce Lindbloom's CIE color
// calculator / colormine), NOT values printed by our own srgbToLab — so a bug in the
// conversion cannot hide behind a self-consistent expectation. Tolerances are stated
// inline and sized to absorb matrix-constant rounding, nothing more.

import { test } from "node:test";
import assert from "node:assert/strict";
import { srgbToLab, deltaE76, deltaE, nearest, nearestLab, nearestFlat, FLAT_LAMBDA } from "./cielab.mjs";

const close = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg}: |${actual} - ${expected}| > ${tol}`);

// --- srgbToLab: anchors ---------------------------------------------------

test("srgbToLab maps white to L*≈100, a*≈0, b*≈0", () => {
  const [L, a, b] = srgbToLab([255, 255, 255]);
  close(L, 100, 0.01, "white L*");
  close(a, 0, 0.01, "white a*");
  close(b, 0, 0.01, "white b*");
});

test("srgbToLab maps black to L*≈0 (exercises the f() linear segment)", () => {
  const [L, a, b] = srgbToLab([0, 0, 0]);
  close(L, 0, 0.01, "black L*");
  close(a, 0, 0.01, "black a*");
  close(b, 0, 0.01, "black b*");
});

// --- srgbToLab: published primaries + grey (independent reference) ---------

test("srgbToLab matches published Lab for mid-grey 128,128,128", () => {
  // Neutral grey → a*=b*=0; L* computed independently ≈ 53.59.
  const [L, a, b] = srgbToLab([128, 128, 128]);
  close(L, 53.59, 0.3, "grey L*");
  close(a, 0, 0.01, "grey a*");
  close(b, 0, 0.01, "grey b*");
});

test("srgbToLab matches published Lab for pure red 255,0,0", () => {
  // Lindbloom sRGB/D65: L 53.2408, a 80.0925, b 67.2032
  const [L, a, b] = srgbToLab([255, 0, 0]);
  close(L, 53.2408, 0.5, "red L*");
  close(a, 80.0925, 0.5, "red a*");
  close(b, 67.2032, 0.5, "red b*");
});

test("srgbToLab matches published Lab for pure blue 0,0,255", () => {
  // Lindbloom sRGB/D65: L 32.2970, a 79.1875, b -107.8602
  const [L, a, b] = srgbToLab([0, 0, 255]);
  close(L, 32.297, 0.5, "blue L*");
  close(a, 79.1875, 0.5, "blue a*");
  close(b, -107.8602, 0.5, "blue b*");
});

// --- srgbToLab: validation ------------------------------------------------

test("srgbToLab rejects malformed input", () => {
  assert.throws(() => srgbToLab([0, 0]), /length 3/);
  assert.throws(() => srgbToLab("ffffff"), /length 3/);
  assert.throws(() => srgbToLab([0, 0, NaN]), /finite number in \[0, 255\]/);
  assert.throws(() => srgbToLab([-1, 0, 0]), /\[0, 255\]/);
  assert.throws(() => srgbToLab([0, 0, 256]), /\[0, 255\]/);
});

// --- deltaE76 -------------------------------------------------------------

test("deltaE76 identity is zero and the default alias is CIE76", () => {
  const x = srgbToLab([10, 120, 200]);
  assert.equal(deltaE76(x, x), 0);
  assert.equal(deltaE, deltaE76);
});

test("deltaE76 is symmetric", () => {
  const p = srgbToLab([200, 30, 30]);
  const q = srgbToLab([40, 180, 90]);
  assert.equal(deltaE76(p, q), deltaE76(q, p));
});

test("deltaE76 equals the hand-computed Euclidean distance", () => {
  // ΔL=3, Δa=4, Δb=0 → √(9+16) = 5
  assert.equal(deltaE76([50, 0, 0], [53, 4, 0]), 5);
});

// --- nearest --------------------------------------------------------------

const PALETTE = [
  { key: "white", lab: srgbToLab([255, 255, 255]) },
  { key: "black", lab: srgbToLab([0, 0, 0]) },
  { key: "red", lab: srgbToLab([255, 0, 0]) },
  { key: "blue", lab: srgbToLab([0, 0, 255]) },
];

test("nearest picks the perceptually closest key", () => {
  assert.equal(nearest([250, 12, 8], PALETTE).key, "red");
  assert.equal(nearest([8, 8, 250], PALETTE).key, "blue");
  assert.equal(nearest([250, 250, 250], PALETTE).key, "white");
  assert.equal(nearest([5, 5, 5], PALETTE).key, "black");
});

test("nearest returns the matched deltaE and lab consistent with a direct recompute", () => {
  const rgb = [240, 20, 15];
  const res = nearest(rgb, PALETTE);
  assert.equal(res.key, "red");
  const expected = deltaE76(srgbToLab(rgb), PALETTE.find((e) => e.key === "red").lab);
  assert.equal(res.deltaE, expected);
  assert.deepEqual(res.lab, PALETTE.find((e) => e.key === "red").lab);
});

test("nearest honors a pluggable metric (default never invoked)", () => {
  // A metric that always favors 'black' regardless of color proves the seam is real:
  // for a bright-red target, CIE76 would pick 'red', so picking 'black' can only come
  // from the injected metric.
  const favorBlack = (_t, lab) => (lab === PALETTE[1].lab ? -1 : 1);
  assert.equal(nearest([255, 0, 0], PALETTE, { metric: favorBlack }).key, "black");
});

test("nearest throws on an empty or non-array palette", () => {
  assert.throws(() => nearest([0, 0, 0], []), /non-empty array/);
  assert.throws(() => nearest([0, 0, 0], null), /non-empty array/);
});

// --- nearestLab (Lab-input matcher; the centroid path for T-021) -----------

test("nearestLab matches an exact entry Lab with deltaE 0", () => {
  const res = nearestLab(PALETTE[2].lab, PALETTE); // 'red' entry's own lab
  assert.equal(res.key, "red");
  assert.equal(res.deltaE, 0);
  assert.deepEqual(res.lab, PALETTE[2].lab);
});

test("nearestLab picks the perceptually closest key for a Lab target", () => {
  // A Lab near red but not equal: nudge each component slightly.
  const [L, a, b] = PALETTE[2].lab;
  assert.equal(nearestLab([L + 1, a - 2, b + 1], PALETTE).key, "red");
  assert.equal(nearestLab(srgbToLab([8, 8, 250]), PALETTE).key, "blue");
});

test("nearest delegates to nearestLab (same result via either entry point)", () => {
  const rgb = [240, 20, 15];
  const viaRgb = nearest(rgb, PALETTE);
  const viaLab = nearestLab(srgbToLab(rgb), PALETTE);
  assert.deepEqual(viaRgb, viaLab);
});

test("nearestLab honors a pluggable metric and validates the palette", () => {
  const favorBlack = (_t, lab) => (lab === PALETTE[1].lab ? -1 : 1);
  assert.equal(nearestLab(PALETTE[2].lab, PALETTE, { metric: favorBlack }).key, "black");
  assert.throws(() => nearestLab([0, 0, 0], []), /non-empty array/);
  assert.throws(() => nearestLab([0, 0, 0], null), /non-empty array/);
});

// --- nearestFlat (T-064-01: variance-penalized, flat-preferring selection) --

test("nearestFlat: at equal mean ΔE, the flatter (lower-var) block wins", () => {
  const target = [50, 0, 0];
  // two entries equidistant in Lab from the target; only var differs.
  const pal = [
    { key: "busy", lab: [55, 0, 0], var: 4000 },
    { key: "flat", lab: [45, 0, 0], var: 4 },
  ];
  assert.equal(nearestFlat(target, pal).key, "flat");
});

test("nearestFlat: entries without var behave exactly like nearestLab", () => {
  const pal = [
    { key: "a", lab: [10, 0, 0] },
    { key: "b", lab: [90, 0, 0] },
  ];
  assert.deepEqual(nearestFlat([20, 0, 0], pal), nearestLab([20, 0, 0], pal));
});

test("nearestFlat: a small ΔE advantage loses to a flat block; a large one wins", () => {
  const target = [50, 0, 0];
  const flat = { key: "flat", lab: [54, 0, 0], var: 1 }; // ΔE 4
  // busy slightly closer (ΔE 2) but √10000·0.1 = 10 penalty → loses.
  const busyNear = { key: "busyNear", lab: [52, 0, 0], var: 10000 };
  assert.equal(nearestFlat(target, [flat, busyNear]).key, "flat");
  // busy much closer (ΔE 0) → 0 + 10 = 10 vs flat 4; flat still wins here, so make flat far.
  const flatFar = { key: "flatFar", lab: [80, 0, 0], var: 1 }; // ΔE 30
  const busyExact = { key: "busyExact", lab: [50, 0, 0], var: 10000 }; // ΔE 0 + 10
  assert.equal(nearestFlat(target, [flatFar, busyExact]).key, "busyExact");
});

test("nearestFlat: returned deltaE is the TRUE (unpenalized) ΔE of the winner", () => {
  const target = [50, 0, 0];
  const pal = [{ key: "flat", lab: [45, 0, 0], var: 4 }];
  const res = nearestFlat(target, pal);
  assert.equal(res.key, "flat");
  close(res.deltaE, deltaE76(target, pal[0].lab), 1e-9, "true ΔE returned");
  assert.ok(FLAT_LAMBDA > 0, "FLAT_LAMBDA is a positive weight");
});

test("nearestFlat: validates a non-empty palette", () => {
  assert.throws(() => nearestFlat([0, 0, 0], []), /non-empty array/);
});
