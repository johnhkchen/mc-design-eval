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
