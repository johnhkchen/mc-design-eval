// Synthetic-silhouette tests for the proportion metrics (T-135-01 AC #1). Hand-built occupancies
// and image-style masks with hand-computed eave/ridge/ratio expectations — the same functions the
// conformance gate and the witness runner consume.

import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "../view/occupancy.mjs";
import {
  PROPORTION_DEFAULTS, RATIO_NAMES,
  elevationMask, planMask, maskProportions, ratiosFromMask, proportionRatios,
  deriveProportionDeclarations, assertProportionDeclarations, compareRatios,
  PROPORTION_LENS, tagLens, TOLERANCE_CALIBRATION, PITCH_TARGET_SCHEMA,
  conceptPitchRatio, derivePitchTarget,
} from "./silhouette-proportion.mjs";

// --- fixtures ----------------------------------------------------------------

/** Gable house: walls 10×14 (x 0..9, z 0..13) y 0..4; roof courses y 5+k over x k..9−k with a
 *  1-cell gable overhang in z (−1..14); ridge y 9 (x 4..5); chimney 2×2 above the ridge.
 *  Hand-derived: eaveH 5 (walls y 0..4), totalH 10 (ground..ridge), aspect 16/10. */
function gableHouse({ chimneyTop = 12 } = {}) {
  const cells = [];
  for (let x = 0; x <= 9; x++) for (let z = 0; z <= 13; z++) for (let y = 0; y <= 4; y++) {
    cells.push({ pos: [x, y, z], block: "stone" });
  }
  for (let k = 0; k <= 4; k++) {
    for (let x = k; x <= 9 - k; x++) for (let z = -1; z <= 14; z++) {
      cells.push({ pos: [x, 5 + k, z], block: "oak_planks" });
    }
  }
  for (let x = 2; x <= 3; x++) for (let z = 3; z <= 4; z++) for (let y = 10; y <= chimneyTop; y++) {
    cells.push({ pos: [x, y, z], block: "bricks" });
  }
  return occupancyFromCells(cells);
}

/** Image-style mask the way extractSilhouette returns one: full-image dims, interior bbox.
 *  A 6-row triangle (extents 2,4,6,8,10,12) on a 5-row 12-wide rectangle, offset inside a
 *  20×20 frame. */
function triangleOnBoxMask() {
  const w = 20, h = 20;
  const data = new Uint8Array(w * h);
  const ox = 4, oy = 5; // top-left of the 12×11 figure
  const rowExtents = [2, 4, 6, 8, 10, 12, 12, 12, 12, 12, 12]; // 6 roof rows + 5 wall rows
  rowExtents.forEach((extent, i) => {
    const start = ox + Math.floor((12 - extent) / 2);
    for (let x = start; x < start + extent; x++) data[(oy + i) * w + x] = 1;
  });
  return { w, h, data, bbox: { x0: ox, y0: oy, x1: ox + 12, y1: oy + 11 } };
}

const SKETCH = Object.freeze({
  params: { sampleScale: 48, registryScale: 32 },
  proportions: { eaveBlocks: 19.3, heightBlocks: 27.3 },
  footprint: { planDims: [40, 48] },
});

// --- masks --------------------------------------------------------------------

test("SP1 elevation/plan masks: tight crop, row 0 at the top, bbox restriction", () => {
  const occ = gableHouse();
  const alongZ = elevationMask(occ, "z"); // u = x
  assert.equal(alongZ.w, 10);
  assert.equal(alongZ.h, 13); // y 0..12 (chimney top)
  assert.equal(alongZ.data[0 * alongZ.w + 2], 1); // chimney at the top row (x 2, y 12)
  assert.equal(alongZ.data[0 * alongZ.w + 0], 0);
  const alongX = elevationMask(occ, "x"); // u = z, roof overhang widens to 16
  assert.equal(alongX.w, 16);
  const plan = planMask(occ);
  assert.equal(plan.w, 10);
  assert.equal(plan.h, 16);
  // bbox restriction: only the chimney's columns
  const chimney = elevationMask(occ, "z", { bbox: { x0: 2, x1: 4, z0: 3, z1: 5 } });
  assert.equal(chimney.w, 2);
  assert.equal(chimney.h, 13); // walls+roof cells in those columns reach down to y 0
  assert.equal(elevationMask(occ, "z", { bbox: { x0: 100, x1: 101, z0: 0, z1: 1 } }), null);
  assert.throws(() => elevationMask(occ, "y"), /axis/);
});

test("SP2 maskProportions: eave is the widest layer's top, thin rows never read as ridge", () => {
  const occ = gableHouse();
  // along-ridge view (project along x): roof rows are full-extent → exact ridge, eave at the top
  const px = maskProportions(elevationMask(occ, "x"));
  assert.equal(px.totalH, 10); // ground y0 .. ridge y9
  // gable view (project along z): chimney (extent 2 < 0.25×10) and the 2-wide ridge row are
  // below the ridge threshold — the view underestimates, the assembly takes the max
  const pz = maskProportions(elevationMask(occ, "z"));
  assert.equal(pz.eaveH, 5); // walls y 0..4 strictly below the eave course y5
  assert.ok(pz.totalH < 10);
  // a taller chimney changes nothing (the T-118 protrusion lesson)
  const tall = maskProportions(elevationMask(gableHouse({ chimneyTop: 18 }), "x"));
  assert.equal(tall.totalH, 10);
});

test("SP3 maskProportions runs unchanged on an image-style mask with an interior bbox", () => {
  const p = maskProportions(triangleOnBoxMask());
  assert.equal(p.maxExtent, 12);
  assert.equal(p.eaveH, 5); // 5 wall rows strictly below the widest roof row
  // ridge threshold 0.25×12 = 3 → the 2-wide apex row is excluded, the 4-wide row is the top
  assert.equal(p.totalH, 10);
  const r = ratiosFromMask(triangleOnBoxMask());
  assert.equal(r.ridgeToEave, 2);
  assert.equal(r.roofShare, 0.5);
});

test("SP4 degenerate masks return null constituents, never throw", () => {
  assert.equal(maskProportions(null), null);
  const empty = { w: 4, h: 4, data: new Uint8Array(16), bbox: { x0: 0, y0: 0, x1: 4, y1: 4 } };
  assert.equal(maskProportions(empty), null);
  assert.deepEqual(ratiosFromMask(empty), { ridgeToEave: null, roofShare: null });
  // single-row mask: eave = ridge = ground → eaveH 0 → unmeasurable ratios
  const row = { w: 4, h: 1, data: new Uint8Array([1, 1, 1, 1]), bbox: { x0: 0, y0: 0, x1: 4, y1: 1 } };
  assert.deepEqual(ratiosFromMask(row), { ridgeToEave: null, roofShare: null });
});

// --- assembly -------------------------------------------------------------------

test("SP5 proportionRatios: min-eave/max-total across views, plan aspect, hand arithmetic", () => {
  const r = proportionRatios(gableHouse());
  assert.equal(r.ridgeToEave, 2); // totalH 10 / eaveH 5
  assert.equal(r.roofShare, 0.5);
  assert.equal(r.aspect, 1.6); // plan 16×10
  assert.equal(r.perMass, undefined);
});

test("SP6 per-mass rows restrict the projection to the named bbox", () => {
  const occ = gableHouse();
  const r = proportionRatios(occ, { masses: [{ id: "mass-0", bbox: { x0: 0, x1: 10, z0: -1, z1: 15 } }] });
  assert.equal(r.perMass.length, 1);
  assert.equal(r.perMass[0].id, "mass-0");
  assert.equal(r.perMass[0].ridgeToEave, r.ridgeToEave); // the whole building in one mass
  const off = proportionRatios(occ, { masses: [{ id: "ghost", bbox: { x0: 50, x1: 60, z0: 0, z1: 1 } }] });
  assert.deepEqual(off.perMass[0], { id: "ghost", ridgeToEave: null, roofShare: null, aspect: null });
});

// --- targets ----------------------------------------------------------------------

test("SP7 deriveProportionDeclarations: concept-first, sketch fallback, aspect always sketch", () => {
  const withConcept = deriveProportionDeclarations({ conceptMask: triangleOnBoxMask(), sketch: SKETCH });
  assert.equal(withConcept.sources.ridgeToEave, "concept");
  assert.equal(withConcept.targets.ridgeToEave, 2);
  assert.equal(withConcept.sources.aspect, "sketch");
  assert.equal(withConcept.targets.aspect, 1.1852); // round(40·⅔)=27 × round(48·⅔)=32
  assert.equal(withConcept.tolerance, PROPORTION_DEFAULTS.tolerance);
  const sketchOnly = deriveProportionDeclarations({ conceptMask: null, sketch: SKETCH, tolerance: 0.2 });
  assert.equal(sketchOnly.sources.ridgeToEave, "sketch");
  assert.equal(sketchOnly.targets.ridgeToEave, 1.4145); // 27.3 / 19.3
  assert.equal(sketchOnly.targets.roofShare, 0.293);
  assert.equal(sketchOnly.tolerance, 0.2);
  // neither side measures heights → throws (never a silent default)
  const blind = { ...SKETCH, proportions: {} };
  assert.throws(() => deriveProportionDeclarations({ conceptMask: null, sketch: blind }), /unmeasurable/);

  // a concept mask covering most of its frame failed to background-segment (a full illustrated
  // scene, the T-127 cottage case) — deterministic guard, sketch takes over, sources say so
  const scene = { w: 10, h: 10, data: new Uint8Array(100).fill(1), bbox: { x0: 0, y0: 0, x1: 10, y1: 10 } };
  const guarded = deriveProportionDeclarations({ conceptMask: scene, sketch: SKETCH });
  assert.equal(guarded.sources.ridgeToEave, "sketch");
  assert.equal(guarded.targets.ridgeToEave, 1.4145);
});

test("SP8 assertProportionDeclarations rejects malformed shapes", () => {
  const good = deriveProportionDeclarations({ sketch: SKETCH });
  assert.equal(assertProportionDeclarations(good), good);
  assert.throws(() => assertProportionDeclarations(null), /object/);
  assert.throws(() => assertProportionDeclarations({ targets: {}, tolerance: 0.1 }), /at least one/);
  assert.throws(
    () => assertProportionDeclarations({ targets: { roofShare: 0.3 }, sources: { roofShare: "vibes" }, tolerance: 0.1 }),
    /sources/,
  );
  assert.throws(
    () => assertProportionDeclarations({ targets: { roofShare: 0.3 }, sources: { roofShare: "sketch" }, tolerance: 0 }),
    /tolerance/,
  );
  assert.throws(
    () => assertProportionDeclarations({
      targets: { roofShare: 0.3 }, sources: { roofShare: "sketch" }, tolerance: 0.1,
      masses: [{ id: "m", bbox: { x0: 5, x1: 5, z0: 0, z1: 1 } }],
    }),
    /bbox/,
  );
});

// --- comparison ----------------------------------------------------------------------

const DECL = Object.freeze({
  targets: { ridgeToEave: 1.4, roofShare: 0.3, aspect: 1.2 },
  sources: { ridgeToEave: "concept", roofShare: "concept", aspect: "sketch" },
  tolerance: 0.15,
});

test("SP9 compareRatios: relative arm, excess is the comparable magnitude", () => {
  const ok = compareRatios({ ridgeToEave: 1.5, roofShare: 0.31, aspect: 1.2 }, DECL);
  assert.equal(ok.pass, true);
  const bad = compareRatios({ ridgeToEave: 2.63, roofShare: 0.62, aspect: 1.2 }, DECL);
  assert.equal(bad.pass, false);
  const roofRow = bad.rows.find((r) => r.ratio === "roofShare" && !r.mass);
  assert.equal(roofRow.withinTolerance, false);
  assert.equal(roofRow.basis, "relative");
  assert.equal(roofRow.excess, 1.0667); // |0.62−0.3| / 0.3
  assert.equal(roofRow.source, "concept");
});

test("SP10 compareRatios: absolute floor below |target| 0.05, unmeasurable build fails the row", () => {
  const decl = { targets: { roofShare: 0.04 }, sources: { roofShare: "sketch" }, tolerance: 0.15 };
  const near = compareRatios({ ridgeToEave: null, roofShare: 0.1, aspect: null }, decl);
  const row = near.rows.find((r) => r.ratio === "roofShare");
  assert.equal(row.basis, "absolute");
  assert.equal(row.excess, 0.06); // |0.1−0.04| compared directly against tolerance
  assert.equal(row.withinTolerance, true); // 0.06 ≤ 0.15 absolute — no near-zero relative blow-up
  const far = compareRatios({ ridgeToEave: null, roofShare: 0.24, aspect: null }, decl);
  assert.equal(far.rows.find((r) => r.ratio === "roofShare").withinTolerance, false); // 0.2 > 0.15
  const unmeasured = compareRatios({ ridgeToEave: null, roofShare: null, aspect: null }, decl);
  const u = unmeasured.rows.find((r) => r.ratio === "roofShare");
  assert.equal(u.basis, "unmeasurable");
  assert.equal(u.withinTolerance, false);
  assert.equal(unmeasured.pass, false);
});

test("SP11 compareRatios: per-mass rows gate only where the mass declares targets", () => {
  const decl = {
    ...DECL,
    masses: [
      { id: "main", bbox: { x0: 0, x1: 10, z0: 0, z1: 14 }, targets: { roofShare: 0.3 } },
      { id: "wing", bbox: { x0: 10, x1: 14, z0: 0, z1: 6 } },
    ],
  };
  const measured = {
    ridgeToEave: 1.4, roofShare: 0.3, aspect: 1.2,
    perMass: [
      { id: "main", ridgeToEave: 2.0, roofShare: 0.6, aspect: 1.1 },
      { id: "wing", ridgeToEave: 3.0, roofShare: 0.8, aspect: 2.0 },
    ],
  };
  const r = compareRatios(measured, decl);
  const mainRow = r.rows.find((x) => x.mass === "main" && x.ratio === "roofShare");
  assert.equal(mainRow.withinTolerance, false); // declared per-mass target → gates
  const wingRows = r.rows.filter((x) => x.mass === "wing");
  assert.ok(wingRows.length > 0);
  assert.ok(wingRows.every((x) => x.withinTolerance === null)); // informational only
  assert.equal(r.pass, false);
});

test("SP12 ratio vocabulary stays closed", () => {
  assert.deepEqual([...RATIO_NAMES], ["ridgeToEave", "roofShare", "aspect"]);
});

// --- skirt-aware eave (T-139-01) -------------------------------------------------------
// The E-33 cottage carries a realized plinth/water-table course wider than the walls. Under the
// old global-max rule the plinth IS the max, only the plinth's rows clear 0.98×plinth, the eave
// lands on the plinth top, and the build read ridge:eave 5.5 / roofShare 0.8182 (vs corrected
// ≈1.7 / 0.45). The fix anchors the eave on the dominant wall band, never on a sub-wall skirt.

/** Build an image-style mask from per-row extents (row 0 = top), each centered within width w —
 *  the shape extractSilhouette/elevationMask produce, extent-faithful (maskProportions reads only
 *  the per-row extent). */
function maskFromExtents(rowExtents, w) {
  const h = rowExtents.length;
  const data = new Uint8Array(w * h);
  rowExtents.forEach((e, i) => {
    const start = Math.floor((w - e) / 2);
    for (let x = start; x < start + e; x++) data[i * w + x] = 1;
  });
  return { w, h, data, bbox: { x0: 0, y0: 0, x1: w, y1: h } };
}

// Pinned row extents of the committed T-138-02 cottage final-artifact elevations (row 0 = top).
// The plinth is the 29/28 pair at rows 20–21 (yFromBottom 3–4); the walls are 28/26 (AC #3: the
// real artifact's elevation masks pinned as a fixture, kept pure — no benchmarks/ read).
const COTTAGE_X_EXTENTS = Object.freeze([3, 1, 1, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 29, 29, 28, 28, 28]);
const COTTAGE_Z_EXTENTS = Object.freeze([3, 1, 1, 2, 4, 6, 8, 10, 23, 24, 25, 26, 27, 26, 26, 26, 26, 26, 26, 26, 28, 28, 26, 26, 26]);

/** gableHouse plus a 1-block-wider course on the bottom two wall rows — the general (non-subject)
 *  plinth/skirt. The widening is in X, so the z-elevation (taper view) carries the skirt. */
function plinthHouse({ plinth = true } = {}) {
  const cells = [];
  for (let x = 0; x <= 9; x++) for (let z = 0; z <= 13; z++) for (let y = 0; y <= 4; y++) {
    cells.push({ pos: [x, y, z], block: "stone" });
  }
  for (let k = 0; k <= 4; k++) for (let x = k; x <= 9 - k; x++) for (let z = -1; z <= 14; z++) {
    cells.push({ pos: [x, 5 + k, z], block: "oak_planks" });
  }
  for (let x = 2; x <= 3; x++) for (let z = 3; z <= 4; z++) for (let y = 10; y <= 12; y++) {
    cells.push({ pos: [x, y, z], block: "bricks" });
  }
  if (plinth) {
    for (let z = -1; z <= 14; z++) for (const y of [0, 1]) {
      cells.push({ pos: [-1, y, z], block: "stone" });
      cells.push({ pos: [10, y, z], block: "stone" });
    }
  }
  return occupancyFromCells(cells);
}

test("SP13 skirt never reads as the eave — the cottage plinth, corrected family not 5.5", () => {
  const px = maskProportions(maskFromExtents(COTTAGE_X_EXTENTS, 29));
  const pz = maskProportions(maskFromExtents(COTTAGE_Z_EXTENTS, 28));
  // eave moves off the plinth top up to the wall band; ridge/maxExtent untouched (global max)
  assert.deepEqual(px, { ridgeRow: 3, eaveRow: 3, groundRow: 24, totalH: 22, eaveH: 21, maxExtent: 29 });
  assert.deepEqual(pz, { ridgeRow: 6, eaveRow: 12, groundRow: 24, totalH: 19, eaveH: 12, maxExtent: 28 });
  // build assembly: eaveH = MIN across views, totalH = MAX → the corrected ≈1.7/0.45 family
  const eaveH = Math.min(px.eaveH, pz.eaveH); // 12
  const totalH = Math.max(px.totalH, pz.totalH); // 22
  assert.equal(Math.round((totalH / eaveH) * 1e4) / 1e4, 1.8333);
  assert.equal(Math.round(((totalH - eaveH) / totalH) * 1e4) / 1e4, 0.4545);
  assert.notEqual(Math.round((totalH / eaveH) * 1e4) / 1e4, 5.5); // not the bent-ruler read
});

test("SP14 both rulers side by side — skirtBandFrac 0 recovers the legacy global-max ruler", () => {
  const xMask = maskFromExtents(COTTAGE_X_EXTENTS, 29);
  const zMask = maskFromExtents(COTTAGE_Z_EXTENTS, 28);
  // legacy: the eave latches the plinth top (eaveH 4 in both views) → 5.5 / 0.8182 assembled
  assert.equal(maskProportions(xMask, { skirtBandFrac: 0 }).eaveH, 4);
  assert.equal(maskProportions(zMask, { skirtBandFrac: 0 }).eaveH, 4);
  // corrected default: the wall band (21 / 12)
  assert.equal(maskProportions(xMask).eaveH, 21);
  assert.equal(maskProportions(zMask).eaveH, 12);
});

test("SP15 skirt-free mask byte-identical (high eave overhang kept); degenerate preserved", () => {
  // a real eave overhang: a 1-row extent-28 course above 26-wide walls (the barn shape). It sits
  // ABOVE the bottom band → it is the body, not a skirt → the eave stays on it, unchanged.
  const barnish = maskFromExtents([4, 8, 12, 16, 28, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26], 30);
  assert.deepEqual(maskProportions(barnish), maskProportions(barnish, { skirtBandFrac: 0 }));
  assert.equal(maskProportions(barnish).eaveRow, 4); // the overhang, not demoted
  // degenerate-mask behavior (AC #3) preserved under the new rule
  assert.equal(maskProportions(null), null);
  const empty = { w: 4, h: 4, data: new Uint8Array(16), bbox: { x0: 0, y0: 0, x1: 4, y1: 4 } };
  assert.equal(maskProportions(empty), null);
  const row = { w: 4, h: 1, data: new Uint8Array([1, 1, 1, 1]), bbox: { x0: 0, y0: 0, x1: 4, y1: 1 } };
  assert.deepEqual(ratiosFromMask(row), { ridgeToEave: null, roofShare: null });
});

test("SP16 assembly corrects through proportionRatios; skirt-free house unchanged", () => {
  // the plinth latched the eave under the legacy ruler (10 / 0.9); the fix reads the walls (2 / 0.5)
  assert.deepEqual(proportionRatios(plinthHouse()), { ridgeToEave: 2, roofShare: 0.5, aspect: 1.3333 });
  assert.deepEqual(
    proportionRatios(plinthHouse(), { skirtBandFrac: 0 }),
    { ridgeToEave: 10, roofShare: 0.9, aspect: 1.3333 },
  );
  // the same house WITHOUT the plinth is byte-identical to the plain gableHouse (no skirt to strip)
  assert.deepEqual(proportionRatios(plinthHouse({ plinth: false })), proportionRatios(gableHouse()));
});

// --- T-140-01: lens naming, tolerance calibration, pitch precedence ----------

/** Image-style mask from per-row extents (top→bottom), centered in a generous frame. */
function maskFromRowExtents(extents, frame = 24) {
  const w = frame, h = frame;
  const data = new Uint8Array(w * h);
  const oy = 2;
  const maxE = Math.max(...extents);
  const ox = Math.floor((frame - maxE) / 2);
  extents.forEach((e, i) => {
    const start = ox + Math.floor((maxE - e) / 2);
    for (let x = start; x < start + e; x++) data[(oy + i) * w + x] = 1;
  });
  return { w, h, data, bbox: { x0: 0, y0: oy, x1: w, y1: oy + extents.length } };
}

test("SP-L1 lens labels: tagLens stamps a copy; compareRatios stamps only when handed opts.lens", () => {
  const occ = tagLens(proportionRatios(gableHouse()), PROPORTION_LENS.OCCUPANCY);
  assert.equal(occ.lens, "occupancy");
  assert.equal(occ.ridgeToEave, 2); // the underlying number is unchanged by the label
  // default compareRatios is byte-identical to the legacy shape (no lens key) — committed records safe
  const decl = deriveProportionDeclarations({ sketch: SKETCH });
  const plain = compareRatios({ ridgeToEave: 1.4, roofShare: 0.29, aspect: 0.8333 }, decl);
  assert.equal("lens" in plain, false);
  assert.equal(plain.rows.every((r) => !("lens" in r)), true);
  // opt-in: the gate names its (occupancy) ruler on the result and every row
  const labeled = compareRatios({ ridgeToEave: 1.4, roofShare: 0.29, aspect: 0.8333 }, decl, { lens: PROPORTION_LENS.OCCUPANCY });
  assert.equal(labeled.lens, "occupancy");
  assert.equal(labeled.rows.every((r) => r.lens === "occupancy"), true);
  assert.equal(labeled.pass, plain.pass); // labeling never changes the verdict
  assert.throws(() => tagLens({ ridgeToEave: 1 }, "bogus"), /lens must be/);
  assert.throws(() => compareRatios({}, decl, { lens: "bogus" }), /opts.lens must be/);
});

test("SP-L2 the cottage 3× divergence reads as two correctly-labeled instruments", () => {
  // PROGRAM lens: clean program/sketch parameters intend a low ridge:eave (the contract ≈1.5).
  const program = tagLens({ ridgeToEave: 1.5, roofShare: 0.33, aspect: 1.19 }, PROPORTION_LENS.PROGRAM);
  // OCCUPANCY lens: the realized voxels read roof-heavy (≈5) — a tall narrowing silhouette, exactly
  // the substrate where the plinth/realization artifact lives. Read by the real occupancy producer.
  const occMask = maskFromRowExtents([1, 1, 2, 3, 12, 12]); // 4 roof rows over 2 wall rows
  const occupancy = tagLens(ratiosFromMask(occMask), PROPORTION_LENS.OCCUPANCY);
  assert.equal(program.lens, "program");
  assert.equal(occupancy.lens, "occupancy");
  // each is correct FOR ITS LENS — the gap is two instruments, not a contradiction (review concern 6)
  assert.ok(occupancy.ridgeToEave >= 4 && program.ridgeToEave <= 2);
  assert.ok(occupancy.ridgeToEave / program.ridgeToEave >= 2.8); // ~3×, as the committed cottage showed
});

test("SP-L3 tolerance carries its calibration evidence and stays the single frozen value", () => {
  assert.equal(TOLERANCE_CALIBRATION.value, PROPORTION_DEFAULTS.tolerance); // not a separate knob
  assert.ok(TOLERANCE_CALIBRATION.conclusion.length > 0);
  assert.ok(Array.isArray(TOLERANCE_CALIBRATION.evidence) && TOLERANCE_CALIBRATION.evidence.length >= 3);
  // the bimodal split the conclusion rests on: an in-cluster and an out-cluster with a wide valley
  const inC = TOLERANCE_CALIBRATION.evidence.filter((e) => e.within).map((e) => e.excess);
  const outC = TOLERANCE_CALIBRATION.evidence.filter((e) => !e.within).map((e) => e.excess);
  assert.ok(Math.max(...inC) <= PROPORTION_DEFAULTS.tolerance + 0.02); // in-cluster near/under the band
  assert.ok(Math.min(...outC) > 0.15); // out-cluster strictly above the band — 0.15 separates them
});

test("SP-P1 conceptPitchRatio: measures a segmentable roofline, null when unusable", () => {
  // a steep concept silhouette: 4 roof rows rising over a 2-row wall (rise 4 / half-span 2 = 2.0)
  const steep = maskFromRowExtents([1, 1, 2, 3, 4, 4]);
  assert.ok(conceptPitchRatio(steep) > 0);
  // over-coverage (a full illustrated scene) → unsegmentable → null (the recorded fallback trigger)
  const full = { w: 4, h: 4, data: new Uint8Array(16).fill(1), bbox: { x0: 0, y0: 0, x1: 4, y1: 4 } };
  assert.equal(conceptPitchRatio(full), null);
  assert.equal(conceptPitchRatio(null), null);
});

test("SP-P2 derivePitchTarget: concept wins when measurable, sketch-fallback otherwise, steep door cited", () => {
  const pack = { proportions: { pitchClasses: [1, 2] } };
  const sketch = { pitch: { dominantTiltDeg: 30 } }; // tan 30 ≈ 0.577 — TRELLIS-flattened
  // measurable concept (ratio ≈2.0, steeper than the flat sketch) → concept WINS
  const steepConcept = maskFromRowExtents([1, 1, 2, 3, 4, 4, 4]); // rise 4 / half-span 2 = 2.0
  const won = derivePitchTarget({ conceptMask: steepConcept, sketch, pack });
  assert.equal(won.schema, PITCH_TARGET_SCHEMA);
  assert.equal(won.source, "concept");
  assert.equal(won.conceptSegmentable, true);
  assert.ok(won.divergence > 1); // concept-measured vs sketch-measured pitch disagree
  assert.equal(won.snapped.pitchClass, 2);
  assert.equal(won.steepDoor, true); // class > 1 opens the T-134 steep gable
  // unsegmentable concept (the committed barns: coverage > 0.5) → sketch-fallback, steep door unused
  const fullConcept = { w: 4, h: 4, data: new Uint8Array(16).fill(1), bbox: { x0: 0, y0: 0, x1: 4, y1: 4 } };
  const fell = derivePitchTarget({ conceptMask: fullConcept, sketch, pack });
  assert.equal(fell.source, "sketch-fallback");
  assert.equal(fell.conceptSegmentable, false);
  assert.equal(fell.steepDoor, false); // 0.577 snaps to class 1 — the steep door stays closed
  assert.equal(fell.divergence, null);
});
