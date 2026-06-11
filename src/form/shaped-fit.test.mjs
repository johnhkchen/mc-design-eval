// Unit tests — fit-from-component seam (T-105-01). Every branch of the Rule 1 contract: exact
// and segmental circle fits, every named-miss gate (narrow / no-rise / degenerate / out-of-
// tolerance / off-span), the flat path (noop fixpoint, within/over tolerance), and the plane
// pitch fits with the glbFit-preferred / voxelFit-fallback-with-finding source rule. The REAL
// committed gatehouse/church records are fixtures here — the design's named risk (does the
// witnessed arch pass the declared gate?) is pinned as a test, not an assumption.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { SHAPED_DEFAULTS } from "./shaped-vocab.mjs";
import {
  fitCircle, fitOpeningHead, stairRunSpecFromPlane, slabStepSpecFromPlane,
} from "./shaped-fit.mjs";

const profile = (tops, at0 = 0) => tops.map((topY, i) => ({ at: at0 + i, topY }));
const opening = (tops, over = {}) => ({
  headProfile: profile(tops, over.at0 ?? 0),
  extent: { axis: "z", range: [over.at0 ?? 0, (over.at0 ?? 0) + tops.length - 1] },
  width: tops.length,
  ...over,
});

// --- fitCircle ------------------------------------------------------------------------------

test("fitCircle: exact lattice circle recovered (center (2,3), r=5), rmse ≈ 0", () => {
  const fit = fitCircle([[7, 3], [2, 8], [-3, 3], [5, 7], [6, 6], [2, -2]]);
  assert.ok(fit);
  assert.ok(Math.abs(fit.center[0] - 2) < 1e-6 && Math.abs(fit.center[1] - 3) < 1e-6);
  assert.ok(Math.abs(fit.radius - 5) < 1e-6);
  assert.ok(fit.rmse < 1e-6);
});

test("fitCircle: degenerate inputs → null", () => {
  assert.equal(fitCircle([[0, 0], [1, 1]]), null);                 // too few
  assert.equal(fitCircle([[0, 5], [1, 5], [2, 5], [3, 5]]), null); // collinear
});

// --- fitOpeningHead: arch path ----------------------------------------------------------------

const ARCH_TOPS = [13, 15, 15, 15, 15, 15, 14, 13]; // near-circular 8-wide candidate head
const candidate = (tops, over = {}) => opening(tops, { archCandidate: true, spring: Math.max(...tops), ...over });

test("fitOpeningHead: near-circular candidate → arch within tolerance, error recorded", () => {
  const fit = fitOpeningHead(candidate(ARCH_TOPS));
  assert.equal(fit.kind, "arch");
  assert.ok(fit.fitError.rmse <= SHAPED_DEFAULTS.rmseTol, `rmse ${fit.fitError.rmse}`);
  assert.ok(fit.spec.radius > 0);
  assert.ok(fit.spec.center[0] >= 0 && fit.spec.center[0] <= 7); // in span
  assert.deepEqual(fit.spec.span, { axis: "z", range: [0, 7] });
  assert.ok(fit.spec.yRange[1] > Math.max(...ARCH_TOPS)); // window covers the extrados row
  assert.equal(fit.provenance.source, "headProfile");
});

test("fitOpeningHead: every arch named-miss gate (Rule 1 — never an invented shape)", () => {
  // too narrow
  assert.equal(fitOpeningHead(candidate([12, 14, 12])).finding.code, "arch-too-narrow");
  // no rise
  assert.equal(fitOpeningHead(candidate([15, 15, 15, 15, 15, 15])).finding.code, "arch-no-rise");
  // collinear profile (uniform slope) → degenerate circle
  assert.equal(fitOpeningHead(candidate([10, 12, 14, 16, 18, 20])).finding.code, "arch-degenerate");
  // a zigzag rings the Kåsa center within RADIAL tolerance — the coverage gate is what
  // catches it (the vertical-arc contract: every column must lie under the fitted disc)
  const ragged = fitOpeningHead(candidate([10, 15, 10, 15, 10, 15, 10, 15]));
  assert.equal(ragged.kind, "none");
  assert.equal(ragged.finding.code, "arch-profile-uncovered");
  assert.ok(ragged.fitError.radialRmse <= SHAPED_DEFAULTS.rmseTol); // radial alone would have passed
  // covered but over the (tightened) vertical tolerance — error recorded on the miss
  const over = fitOpeningHead(candidate(ARCH_TOPS), { rmseTol: 0.1 });
  assert.equal(over.kind, "none");
  assert.equal(over.finding.code, "arch-out-of-tolerance");
  assert.ok(over.fitError.rmse > 0.1);
});

// --- fitOpeningHead: flat path ----------------------------------------------------------------

test("fitOpeningHead: flat heads — fixpoint noop, in-tolerance squaring, named miss", () => {
  // already flat → recorded no-op (the supplying op is a no-op on a clean head)
  const noop = fitOpeningHead(opening([12, 12, 12, 12]));
  assert.equal(noop.kind, "flat");
  assert.equal(noop.noop, true);
  assert.equal(noop.fitError.rmse, 0);
  // 1-wide is definitionally flat
  assert.equal(fitOpeningHead(opening([9])).noop, true);
  // slightly ragged → squared to the modal level, rmse recorded
  const squared = fitOpeningHead(opening([12, 12, 13, 12]));
  assert.equal(squared.kind, "flat");
  assert.equal(squared.noop, false);
  assert.equal(squared.spec.level, 12);
  assert.equal(squared.fitError.rmse, 0.5);
  // too ragged to square honestly → named miss (modal tie breaks to the lower level)
  const miss = fitOpeningHead(opening([12, 15, 12, 15]));
  assert.equal(miss.kind, "none");
  assert.equal(miss.finding.code, "flat-out-of-tolerance");
  // garbage profile
  assert.equal(fitOpeningHead({ headProfile: [] }).finding.code, "no-head-profile");
});

// --- the real committed records (the design's named risk, pinned) -----------------------------

const RECORDS = new URL("../../benchmarks/sculpture/components/", import.meta.url);
const loadRecord = (s) => JSON.parse(readFileSync(new URL(`${s}.json`, RECORDS), "utf8"));

test("real gatehouse record: both witnessed arch candidates fit as arches within tolerance", () => {
  const rec = loadRecord("gatehouse");
  const candidates = rec.openingGroups.flatMap((g) => g.openings).filter((o) => o.archCandidate);
  assert.equal(candidates.length, 2); // og-0 and og-2, the ±x gate arches
  for (const o of candidates) {
    const fit = fitOpeningHead(o);
    assert.equal(fit.kind, "arch");
    assert.ok(fit.fitError.rmse <= SHAPED_DEFAULTS.rmseTol, `rmse ${fit.fitError.rmse}`);
    assert.ok(fit.spec.radius >= o.width / 2 - 1, "arc spans the opening");
  }
});

test("real church record: no arch candidates — heads dispatch flat or named-miss, never arch", () => {
  const rec = loadRecord("church");
  const fits = rec.openingGroups.flatMap((g) => g.openings).map((o) => fitOpeningHead(o));
  assert.ok(fits.length > 0);
  assert.ok(fits.every((f) => f.kind !== "arch"));
  assert.ok(fits.some((f) => f.kind === "flat")); // the geometry-per-opening AC half
});

// --- plane pitch fits --------------------------------------------------------------------------

const PLANE = (voxGrad, glb) => ({
  voxelFit: { gradient: voxGrad, rmse: 0.4 },
  ...(glb ? { glbFit: glb } : {}),
});

test("stairRunSpecFromPlane: good glbFit preferred; pitch snapped to 1:1 with delta recorded", () => {
  const r = stairRunSpecFromPlane(PLANE([-1.156, 0.004], { gradient: [0, 0.95], rmse: 0.5 }));
  assert.equal(r.source, "glbFit");
  assert.deepEqual(r.spec, { generator: "stairRun", ascent: "+z", winding: "walk", riseOverRun: 1 });
  assert.equal(r.fitError.pitchDelta, 0.05);
  assert.deepEqual(r.findings, []);
});

test("stairRunSpecFromPlane: unusable glbFit falls back to voxelFit WITH a named finding", () => {
  // the witnessed gatehouse case: glbFit rmse 5.6 — the substitution must be named (Rule 1)
  const r = stairRunSpecFromPlane(PLANE([-1.156, 0.004], { gradient: [0.076, -0.613], rmse: 5.603 }));
  assert.equal(r.source, "voxelFit");
  assert.equal(r.findings[0].code, "glb-fit-unusable");
  assert.equal(r.spec.ascent, "-x"); // gradient −1.156 along x: y rises toward −x
  assert.equal(r.fitError.pitchDelta, 0.156);
  // missing glbFit entirely is its own named substitution
  assert.equal(stairRunSpecFromPlane(PLANE([1, 0])).findings[0].code, "glb-fit-missing");
});

test("plane fits: out-of-band pitch → spec null, error still recorded; slab band at 1:2", () => {
  const shallow = stairRunSpecFromPlane(PLANE([0.5, 0]));
  assert.equal(shallow.spec, null);
  assert.ok(shallow.findings.some((f) => f.code === "pitch-not-stairRun-legal"));
  assert.equal(shallow.fitError.pitch, 0.5);

  const slab = slabStepSpecFromPlane(PLANE([0.5, 0]));
  assert.deepEqual(slab.spec, { generator: "slabStep", ascent: "+x", winding: "walk", riseOverRun: 0.5 });
  assert.equal(slab.fitError.pitchDelta, 0);
  assert.equal(slabStepSpecFromPlane(PLANE([0.3, 0])).spec, null);
  assert.equal(slabStepSpecFromPlane(PLANE([1.0, 0])).spec, null);

  const none = stairRunSpecFromPlane({});
  assert.equal(none.spec, null);
  assert.equal(none.findings[0].code, "no-fit");
});

test("real cottage record: at least one roof plane yields a stair-legal spec (fit evidence)", () => {
  const rec = loadRecord("cottage");
  const results = (rec.roofPlanes ?? []).map((p) => stairRunSpecFromPlane(p));
  assert.ok(results.some((r) => r.spec !== null), "cottage pitched roof should be stair-legal");
  for (const r of results) if (r.spec) assert.ok(["+x", "-x", "+z", "-z"].includes(r.spec.ascent));
});
