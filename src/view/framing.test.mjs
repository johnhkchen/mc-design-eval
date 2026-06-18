// FRAMING AXIS — flags-when-wrong / quiet-when-right (T-196-01, story S-196, epic E-51). The deterministic
// proof of the wider eyes: orientation flags a rotated roof and is quiet on a gable that faces the gate;
// scale flags a proportion DISTORTION and is QUIET on a uniform up-scale (the no-pixel-false-positive crux).
// PURE — runs under the src/**/*.test.mjs glob.

import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import {
  frontAxisOf, buildRidgeAxis, orientationFraming, proportionRatios, targetRatiosOf,
  scaleFraming, framingReport, SCALE_TOL,
} from "./framing.mjs";

// ----- fixtures: a solid gabled box. eaveH solid layers (full footprint), then a roof tapering perp-to-ridge
// to a ridge line. ridgeAxis "x" → the ridge runs along x and the perp (z) section narrows with height. -----
function gabledBox({ w, d, eaveH, ridgeAxis = "x", roof = true }) {
  const cells = [];
  for (let y = 0; y < eaveH; y++)
    for (let x = 0; x < w; x++)
      for (let z = 0; z < d; z++) cells.push({ pos: [x, y, z], block: "stone" });
  if (roof) {
    const perp = ridgeAxis === "x" ? d : w;
    const kMax = Math.floor((perp - 1) / 2);
    for (let k = 1; k <= kMax; k++) {
      const y = eaveH - 1 + k;
      if (ridgeAxis === "x") {
        for (let x = 0; x < w; x++) for (let z = k; z <= d - 1 - k; z++) cells.push({ pos: [x, y, z], block: "spruce_planks" });
      } else {
        for (let z = 0; z < d; z++) for (let x = k; x <= w - 1 - k; x++) cells.push({ pos: [x, y, z], block: "spruce_planks" });
      }
    }
  }
  return occupancyFromCells(cells);
}
const scaleCells = (occ, f) => occupancyFromCells([...occ.cells].map(([key, block]) => ({ pos: key.split(",").map(Number).map((c) => c * f), block })));

// the recognized gatehouse intent: 15×15, 4 storeys × 5 = eave 20, gable ridge x (faces the -x gate), pitch 1.
const PROGRAM = {
  masses: [{
    rect: { x0: 0, z0: 0, w: 15, d: 15 }, storeys: 4, storeyHeight: 5,
    roof: { idiom: "roof.gable", ridgeAxis: "x", pitchClass: 1 },
    openings: [{ wall: "-x", kind: "door", w: 4, h: 8, head: "arch" }],
  }],
};
const CORRECT = gabledBox({ w: 15, d: 15, eaveH: 20, ridgeAxis: "x" });

test("FR0: frontAxisOf reads the declared gate wall (door on -x → axis x)", () => {
  assert.deepEqual(frontAxisOf(PROGRAM), { axis: "x", side: "-x", source: "door" });
  assert.equal(frontAxisOf({ masses: [{ openings: [] }] }), null); // no entry declared → null (→ SKIP)
});

test("FR1: orientation QUIET when the gable faces the declared front", () => {
  const o = orientationFraming(PROGRAM, CORRECT);
  assert.equal(buildRidgeAxis(CORRECT), "x");
  assert.equal(o.gableFacesFront, true);
  assert.equal(o.flagged, false);
  assert.equal(o.severity, null);
});

test("FR2: orientation FLAGS the deliberately-rotated roof (ridge ⟂ to the gate)", () => {
  const rotated = gabledBox({ w: 15, d: 15, eaveH: 20, ridgeAxis: "z" }); // gable now faces ±z, gate is on -x
  const o = orientationFraming(PROGRAM, rotated);
  assert.equal(buildRidgeAxis(rotated), "z");
  assert.equal(o.gableFacesFront, false);
  assert.equal(o.flagged, true);
  assert.equal(o.severity, "major");
});

test("FR3: orientation SKIPS (quiet) on insufficient evidence — flat top OR no declared front", () => {
  const flat = gabledBox({ w: 15, d: 15, eaveH: 20, roof: false }); // square flat top → ridge ambiguous
  assert.equal(buildRidgeAxis(flat), null);
  assert.equal(orientationFraming(PROGRAM, flat).flagged, false);
  // a clear roof but no declared front → also skipped, never flagged
  assert.equal(orientationFraming({ masses: [{ openings: [] }] }, CORRECT).flagged, false);
});

test("FR4: scale QUIET when the build's proportions match the recognized intent", () => {
  const build = proportionRatios(CORRECT), target = targetRatiosOf(PROGRAM);
  assert.equal(build.aspect, 1);
  assert.equal(target.aspect, 1);
  assert.equal(build.ridgeToEave, target.ridgeToEave); // 27/20 = 1.35 both
  const s = scaleFraming(PROGRAM, CORRECT);
  assert.equal(s.flagged, false);
  assert.equal(s.severity, null);
});

test("FR5: scale FLAGS a proportion distortion — stretched footprint (aspect) AND a tall roof (ridgeToEave)", () => {
  const stretched = gabledBox({ w: 30, d: 15, eaveH: 20, ridgeAxis: "x" }); // footprint 2:1 vs the 1:1 intent
  const sa = scaleFraming(PROGRAM, stretched);
  assert.equal(proportionRatios(stretched).aspect, 2);
  assert.equal(sa.flagged, true);
  assert.ok(sa.deltas.aspect > SCALE_TOL);

  const tallRoof = gabledBox({ w: 15, d: 15, eaveH: 8, ridgeAxis: "x" }); // squat walls, oversized roof share
  const sr = scaleFraming(PROGRAM, tallRoof);
  assert.equal(sr.flagged, true);
  assert.ok(sr.deltas.ridgeToEave > SCALE_TOL); // 15/8=1.875 vs 1.35
});

test("FR6 (crux): scale QUIET on a UNIFORM up-scale — proportion, not pixels", () => {
  const big = scaleCells(CORRECT, 2); // every dimension ×2: a bigger build, identical proportions
  const s = scaleFraming(PROGRAM, big);
  assert.equal(proportionRatios(big).aspect, 1);
  assert.equal(s.flagged, false, "a uniform up-scale is a framing/zoom caveat, NOT a divergence");
  assert.equal(orientationFraming(PROGRAM, big).flagged, false); // and orientation still reads correctly
});

test("FR7: framingReport shape + purity (no mutation, byte-stable)", () => {
  const before = JSON.stringify([...CORRECT.cells].length);
  const a = framingReport(PROGRAM, CORRECT);
  const b = framingReport(PROGRAM, CORRECT);
  assert.deepEqual(Object.keys(a).sort(), ["flags", "orientation", "residual", "scale"]);
  assert.ok(Array.isArray(a.flags) && Array.isArray(a.residual));
  assert.equal(a.flags.length, 0); // the correct build names no framing residual
  assert.deepEqual(a, b); // deterministic
  assert.equal([...CORRECT.cells].length, JSON.parse(before)); // occ unmutated

  // a flagged build surfaces both axes in flags + residual
  const bad = framingReport(PROGRAM, gabledBox({ w: 30, d: 15, eaveH: 20, ridgeAxis: "z" }));
  assert.equal(bad.orientation.flagged, true);
  assert.equal(bad.scale.flagged, true);
  assert.equal(bad.residual.length, 2);
  assert.deepEqual(bad.residual.map((r) => r.axis).sort(), ["orientation", "scale"]);

  assert.throws(() => framingReport(null, CORRECT), /program is required/);
  assert.throws(() => framingReport(PROGRAM, {}), /Occupancy/);
});
