// Unit tests — the measurement-to-program seam (T-133-01, E-33 Rule 1: identity from language,
// quantity from geometry). Synthetic program fixture (the compile.test.mjs pattern), synthetic
// sketches, the REAL rustic pack; compileProgram imported ONLY as the drift tripwire for the
// mirrored ridge formula.

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadStylePack } from "../pack/style-pack.mjs";
import { assertBuildingProgram, validateProgramAgainstPack } from "./program.mjs";
import { compileProgram } from "./compile.mjs";
import { seedWorkshopProgram } from "../workshop/seed.mjs";
import {
  sketchBlocksFactor, sketchMeasurements, factorEave, snapPitch, scaleFootprint,
  impliedRidgeRise, applyMeasuredProportions, silhouetteRatios, sketchTargetRatios,
} from "./measured-program.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const pack = loadStylePack(resolve(here, "..", "..", "packs", "rustic.json"));

function makeProgram(mutate = () => {}) {
  const p = {
    schema: "building-program/v1",
    subject: "test-subject",
    pack: "rustic",
    reading: { summary: "synthetic two-storey gabled mass" },
    masses: [
      {
        id: "main",
        rect: { x0: 0, z0: 0, w: 13, d: 9 },
        storeys: 2,
        storeyHeight: 4,
        walls: {
          ground: { role: "wall.field.ground" },
          upper: { role: "wall.infill.upper" },
          dressing: { role: "wall.dressing" },
        },
        roof: {
          idiom: "roof.gable", ridgeAxis: "x", pitchClass: 1,
          fieldRole: "roof.field", trimRole: null, gableRole: null,
        },
        openings: [
          { wall: "+z", kind: "door", count: 1, w: 2, h: 3, sill: 0, head: "flat", headRole: "wall.dressing" },
          { wall: "-z", kind: "window", count: 2, w: 1, h: 2, sill: 5, head: "flat", headRole: "wall.dressing" },
        ],
      },
    ],
  };
  mutate(p);
  return assertBuildingProgram(p);
}

/** A sketch that measures the fixture exactly as recognized (every parameter measurable). */
function makeSketch(mutate = () => {}) {
  const s = {
    schema: "form-sketch/v1",
    subject: "test-subject",
    params: { sampleScale: 48, registryScale: 48 },
    footprint: { planDims: [13, 9], isRectangle: true },
    pitch: { class: "pitched45", dominantTiltDeg: 45, ridgeAxis: "x", eaveLayer: 7, ridgeLayer: 12 },
    proportions: {
      eaveBlocks: 8, heightBlocks: 13,
      storeyCandidates: [{ n: 2, perStoreyBlocks: 4, plausible: true }],
      massCount: 1,
      masses: [{ id: "mass-0", role: "primary",
                 bbox: { minX: 0, maxX: 12, minZ: 0, maxZ: 8 },
                 pitch: { class: "pitched45", dominantTiltDeg: 45 } }],
    },
  };
  mutate(s);
  return s;
}

test("MP1 unit conversion: *Blocks fields ride as-is; cell fields convert by registry/sample", () => {
  const s = makeSketch((x) => {
    x.params = { sampleScale: 48, registryScale: 32 }; // the cottage-shaped 2/3 factor
    x.footprint.planDims = [40, 48];
    x.proportions.eaveBlocks = 19.3;
    x.proportions.heightBlocks = 27.3;
  });
  assert.equal(sketchBlocksFactor(s), 32 / 48);
  const m = sketchMeasurements(s);
  assert.equal(m.eaveBlocks, 19.3, "already blocks — never re-scaled");
  assert.deepEqual(m.plan, { w: 27, d: 32 }, "planDims are cells — converted and rounded");
  assert.equal(m.pitchRatio, 1, "tan(45°)");
  assert.equal(m.primaries.length, 1);
  assert.throws(() => sketchBlocksFactor({ params: {} }), /cannot convert units/);
});

test("MP1b unmeasurable fields normalize to null (the fallback trigger)", () => {
  const m = sketchMeasurements(makeSketch((x) => {
    delete x.pitch;
    delete x.proportions.eaveBlocks;
    delete x.footprint.planDims;
    x.proportions.masses = [];
  }));
  assert.equal(m.pitchRatio, null);
  assert.equal(m.eaveBlocks, null);
  assert.equal(m.plan, null);
  assert.deepEqual(m.primaries, []);
});

test("MP2 factorEave: exact expression wins; ties prefer band, then recognized storeys, then fewer", () => {
  // the barn case: 10 → 2×5 exact (recognition said 3×3=9; sketch-wins)
  assert.deepEqual(factorEave({ eaveBlocks: 10, recognizedStoreys: 3, packBand: { min: 3, max: 4 } }),
    { storeys: 2, storeyHeight: 5, used: 10, residual: 0 });
  // the cottage case: 19.3 → 4×5=20 (nearest expressible)
  assert.deepEqual(factorEave({ eaveBlocks: 19.3, recognizedStoreys: 2, packBand: { min: 3, max: 4 } }),
    { storeys: 4, storeyHeight: 5, used: 20, residual: 0.7 });
  // tie at 12 (2×6, 3×4, 4×3 all exact): band excludes 2×6; |n−2| picks 3×4 over 4×3
  assert.deepEqual(factorEave({ eaveBlocks: 12, recognizedStoreys: 2, packBand: { min: 3, max: 4 } }),
    { storeys: 3, storeyHeight: 4, used: 12, residual: 0 });
  // no band: 2×6 wins on recognized-storeys proximity
  const noBand = factorEave({ eaveBlocks: 12, recognizedStoreys: 2 });
  assert.deepEqual([noBand.storeys, noBand.storeyHeight], [2, 6]);
  // beyond the schema ceiling: clamps to 4×6=24, residual recorded honestly
  assert.deepEqual(factorEave({ eaveBlocks: 30, recognizedStoreys: 2, packBand: { min: 3, max: 4 } }),
    { storeys: 4, storeyHeight: 6, used: 24, residual: -6 });
});

test("MP3 snapPitch: nearest class; ties to the smaller (deterministic)", () => {
  assert.deepEqual(snapPitch(0.7137, [1]), { pitchClass: 1, residual: 0.2863 });
  assert.equal(snapPitch(1.6, [2, 1, 0.5]).pitchClass, 2);
  assert.equal(snapPitch(0.6, [2, 1, 0.5]).pitchClass, 0.5);
  assert.equal(snapPitch(0.75, [0.5, 1]).pitchClass, 0.5, "equidistant — smaller class");
});

test("MP4 scaleFootprint: shared endpoints stay shared; bbox lands on target; min-width clamp", () => {
  const masses = [
    { id: "a", rect: { x0: 0, z0: 0, w: 18, d: 28 } },
    { id: "b", rect: { x0: 18, z0: 7, w: 8, d: 15 } }, // touches a at x=18
  ];
  const rects = scaleFootprint(masses, { w: 27, d: 32 });
  const a = rects.get("a"), b = rects.get("b");
  assert.equal(a.x0 + a.w, b.x0, "the shared edge maps through one rounding — still touching");
  assert.equal(Math.max(a.x0 + a.w, b.x0 + b.w) - Math.min(a.x0, b.x0), 27);
  assert.equal(Math.max(a.z0 + a.d, b.z0 + b.d) - Math.min(a.z0, b.z0), 32);
  const clamped = scaleFootprint([{ id: "a", rect: { x0: 0, z0: 0, w: 12, d: 12 } }], { w: 3, d: 12 });
  assert.equal(clamped.get("a").w, 3, "min width 3 held");
  const idem = scaleFootprint(masses, { w: null, d: null });
  assert.deepEqual(idem.get("a"), masses[0].rect, "null axis = identity");
});

test("MP5 impliedRidgeRise mirrors compileProgram's ridge (the drift tripwire)", () => {
  for (const mutate of [
    () => {},
    (p) => { p.masses[0].roof.ridgeAxis = "z"; },
    (p) => { p.masses[0].roof.idiom = "roof.hip"; },
    (p) => { p.masses[0].rect = { x0: 0, z0: 0, w: 21, d: 14 }; },
  ]) {
    const program = makeProgram(mutate);
    const { workshopProgram } = compileProgram(program, pack);
    const roof = workshopProgram.elements.find((e) => e.id === "main-roof");
    assert.equal(impliedRidgeRise(program.masses[0]), roof.spec.ridgeY - roof.spec.eaveY,
      `idiom ${program.masses[0].roof.idiom} axis ${program.masses[0].roof.ridgeAxis}`);
  }
});

test("MP6 the ledger is complete: every dimensional parameter of every mass has a source (AC2)", () => {
  const { dimensions } = applyMeasuredProportions({ program: makeProgram(), sketch: makeSketch(), pack });
  const params = dimensions.map((d) => `${d.mass}:${d.parameter}`).sort();
  assert.deepEqual(params, [
    "*:footprint.d", "*:footprint.w",
    "main:eaveHeight", "main:pitchClass", "main:ridgeHeight", "main:storeyFactorization",
  ]);
  for (const d of dimensions) {
    assert.ok(["measured", "fallback"].includes(d.source), `${d.parameter}: ${d.source}`);
    assert.equal(d.source, "measured", `fully measurable sketch — zero defaults (${d.parameter})`);
  }
});

test("MP7 sketch-wins for quantity: measured eave overrides the recognized storeys, band excursion recorded (AC1)", () => {
  const sketch = makeSketch((x) => { x.proportions.eaveBlocks = 19.3; x.proportions.heightBlocks = 27.3; });
  const { program, dimensions, conflicts, attempt } =
    applyMeasuredProportions({ program: makeProgram(), sketch, pack });
  assert.equal(attempt, "fp:xz eave:measured", "the most-measured rung wins");
  assert.equal(program.masses[0].storeys, 4);
  assert.equal(program.masses[0].storeyHeight, 5, "outside the pack band [3,4] — sketch wins");
  const eave = dimensions.find((d) => d.parameter === "eaveHeight");
  assert.deepEqual([eave.source, eave.measured, eave.used, eave.residual], ["measured", 19.3, 20, 0.7]);
  assert.ok(conflicts.some((c) => c.parameter === "eaveHeight" && c.recognition === 8 && c.resolved === "sketch"));
  assert.ok(conflicts.some((c) => c.parameter === "storeyHeight.packBand" && c.resolved === "sketch"));
  // the band excursion is the ONLY tolerated validation finding — everything else still gates
  const { findings } = validateProgramAgainstPack(program, pack);
  assert.ok(findings.every((f) => f.where.endsWith(".storeyHeight")), JSON.stringify(findings));
});

test("MP8 fallbacks are recorded, never silent: an unmeasurable parameter keeps recognition's value (AC2)", () => {
  const sketch = makeSketch((x) => { delete x.pitch; x.proportions.masses = []; delete x.proportions.eaveBlocks; });
  const { program, dimensions } = applyMeasuredProportions({ program: makeProgram(), sketch, pack });
  const pitch = dimensions.find((d) => d.parameter === "pitchClass");
  assert.deepEqual([pitch.source, pitch.used], ["fallback", 1]);
  assert.match(pitch.note, /unmeasurable/);
  const eave = dimensions.find((d) => d.parameter === "eaveHeight");
  assert.deepEqual([eave.source, eave.used], ["fallback", 8]);
  assert.equal(program.masses[0].storeys, 2, "recognition kept");
});

test("MP9 qualitative naming is untouched: roles, idioms, openings, ridgeAxis, reading (AC1)", () => {
  const base = makeProgram();
  const { program } = applyMeasuredProportions({
    program: base,
    sketch: makeSketch((x) => { x.proportions.eaveBlocks = 19.3; x.footprint.planDims = [17, 11]; }),
    pack,
  });
  assert.deepEqual(program.reading, base.reading);
  assert.deepEqual(program.masses[0].walls, base.masses[0].walls);
  assert.deepEqual(program.masses[0].openings, base.masses[0].openings);
  assert.equal(program.masses[0].roof.idiom, base.masses[0].roof.idiom);
  assert.equal(program.masses[0].roof.ridgeAxis, base.masses[0].roof.ridgeAxis);
  assert.equal(program.masses[0].roof.fieldRole, base.masses[0].roof.fieldRole);
});

test("MP10 byte-stable: two applications serialize identically (the --repro substrate)", () => {
  const run = () => applyMeasuredProportions({ program: makeProgram(), sketch: makeSketch(), pack });
  assert.equal(JSON.stringify(run()), JSON.stringify(run()));
});

test("MP11 the attempt ladder: an infeasible measured extent falls back per-axis, recorded", () => {
  // target w=5 leaves the -z window lane 2×w1 @ minSpacing 2 needing 4 of 3 available columns
  const sketch = makeSketch((x) => { x.footprint.planDims = [5, 9]; });
  const { program, dimensions, attempt } =
    applyMeasuredProportions({ program: makeProgram(), sketch, pack });
  assert.equal(attempt, "fp:-z eave:measured");
  assert.equal(program.masses[0].rect.w, 13, "x extent reverted to recognition's");
  const w = dimensions.find((d) => d.parameter === "footprint.w");
  assert.equal(w.source, "fallback");
  assert.match(w.note, /infeasible/);
  const d = dimensions.find((d2) => d2.parameter === "footprint.d");
  assert.equal(d.source, "measured", "the feasible axis still measures");
});

test("MP12 silhouette ratios from compiled geometry, and the sketch's target row", () => {
  const { workshopProgram } = seedWorkshopProgram({ program: makeProgram(), pack });
  // fixture: eaveY 8; d=9 → perpSpan 11 → rise 5 → ridge 13; footprint 13×9
  assert.deepEqual(silhouetteRatios(workshopProgram), {
    ridgeToEave: 1.75,   // (13+1)/8
    roofShare: 0.4286,   // 6/14
    aspect: 1.4444,      // 13/9
  });
  assert.deepEqual(sketchTargetRatios(makeSketch()), {
    ridgeToEave: 1.625,  // 13/8
    roofShare: 0.3846,   // 5/13
    aspect: 1.4444,
  });
  const partial = sketchTargetRatios(makeSketch((x) => { delete x.proportions.eaveBlocks; }));
  assert.equal(partial.ridgeToEave, null);
});

test("MP13 integration: a band-excursion measured program seeds through the real gate", () => {
  const sketch = makeSketch((x) => { x.proportions.eaveBlocks = 19.3; x.proportions.heightBlocks = 27.3; });
  const { program } = applyMeasuredProportions({ program: makeProgram(), sketch, pack });
  const seeded = seedWorkshopProgram({ program, pack });
  assert.equal(seeded.conformance.passed, true, "the workshop contract accepts measured geometry");
  const shell = seeded.workshopProgram.elements.find((e) => e.kind === "shell");
  assert.equal(shell.spec.height, 20, "the eave the sketch measured (expressed 4×5)");
});
