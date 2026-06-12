// Unit tests for conformance.mjs (T-124-01) — every check both ways on synthetic fixtures.
import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "../view/occupancy.mjs";
import {
  CONFORMANCE_CHECK_NAMES,
  coursesEvenCheck, symmetryHeldCheck, openingsRhythmCheck,
  paletteInPackCheck, watertightCheck, singleComponentCheck, proportionCheck, runConformance,
} from "./conformance.mjs";

/** A closed 5×3×5 box shell (hollow), symmetric about x=2: walls stone, roof course planks. */
function boxCells({ wallBlock = "stone_bricks", roofBlock = "oak_planks", mutate = null } = {}) {
  const cells = [];
  for (let x = 0; x <= 4; x++) {
    for (let z = 0; z <= 4; z++) {
      for (let y = 0; y <= 3; y++) {
        const shell = x === 0 || x === 4 || z === 0 || z === 4 || y === 0 || y === 3;
        if (!shell) continue;
        cells.push({ pos: [x, y, z], block: y === 3 ? roofBlock : wallBlock });
      }
    }
  }
  return mutate ? mutate(cells) : cells;
}

const BANDS = [
  { name: "walls", yRange: [0, 2], blocks: ["stone_bricks"] },
  { name: "roof", yRange: [3, 3], blocks: ["oak_planks"] },
];

// ---------------------------------------------------------------- courses-even

test("courses-even: clean banded box passes; foreign block and mixed course fail", () => {
  const clean = coursesEvenCheck(occupancyFromCells(boxCells()), { bands: BANDS });
  assert.equal(clean.passed, true);

  const foreign = boxCells({ mutate: (cs) => { cs[0] = { ...cs[0], block: "sponge" }; return cs; } });
  const f = coursesEvenCheck(occupancyFromCells(foreign), { bands: BANDS });
  assert.equal(f.passed, false);
  assert.match(f.findings[0], /foreign block sponge/);

  // mixed course: half the y=1 ring in a second (in-band) block
  const bands2 = [{ name: "walls", yRange: [0, 2], blocks: ["stone_bricks", "cobblestone"] }];
  const mixed = boxCells({ mutate: (cs) => cs.map((c) => (c.pos[1] === 1 && c.pos[0] <= 2 ? { ...c, block: "cobblestone" } : c)) });
  const m = coursesEvenCheck(occupancyFromCells(mixed), { bands: bands2 });
  assert.equal(m.passed, false);
  assert.match(m.findings[0], /course y=1 is mixed/);
  // the same band declared mixed opts out of single-material, not of vocabulary
  const ok = coursesEvenCheck(occupancyFromCells(mixed), { bands: [{ ...bands2[0], mixed: true }] });
  assert.equal(ok.passed, true);
});

test("courses-even: missing declarations throw", () => {
  assert.throws(() => coursesEvenCheck(occupancyFromCells(boxCells()), {}), /bands/);
});

// ---------------------------------------------------------------- symmetry-held

test("symmetry-held: mirrored box passes; perturbation fails; undeclared is vacuous", () => {
  const occ = occupancyFromCells(boxCells());
  assert.equal(symmetryHeldCheck(occ, { symmetry: { axis: "x", at: 2 } }).passed, true);
  assert.equal(symmetryHeldCheck(occ, { symmetry: { axis: "z", at: 2 } }).passed, true);

  const bent = occupancyFromCells([...boxCells(), { pos: [5, 1, 2], block: "stone_bricks" }]);
  const r = symmetryHeldCheck(bent, { symmetry: { axis: "x", at: 2 } });
  assert.equal(r.passed, false);
  assert.match(r.findings[0], /no mirror/);

  const recolored = boxCells({ mutate: (cs) => cs.map((c) => (c.pos[0] === 0 && c.pos[1] === 1 && c.pos[2] === 2 ? { ...c, block: "cobblestone" } : c)) });
  const r2 = symmetryHeldCheck(occupancyFromCells(recolored), { symmetry: { axis: "x", at: 2 } });
  assert.equal(r2.passed, false);
  assert.ok(r2.findings.some((f) => /mirrors to/.test(f)));

  assert.equal(symmetryHeldCheck(occ, { symmetry: null }).passed, true);
  assert.equal(symmetryHeldCheck(occ, {}).passed, true);
  assert.throws(() => symmetryHeldCheck(occ, { symmetry: { axis: "y", at: 2 } }), /axis/);
});

// ---------------------------------------------------------------- openings-rhythm

const RHYTHM = { minSpacing: 2, maxSpacing: 4 };
const win = (x, wall = "front") => ({ wall, min: [x, 1, 0], max: [x + 1, 2, 0] });

test("openings-rhythm: even spacing + shared sill passes; off-rhythm and split sills fail", () => {
  const ok = openingsRhythmCheck({ openings: [win(0), win(4), win(8)] }, RHYTHM); // gaps of 2
  assert.equal(ok.passed, true);

  const crowded = openingsRhythmCheck({ openings: [win(0), win(3)] }, RHYTHM); // gap 1 < 2
  assert.equal(crowded.passed, false);
  assert.match(crowded.findings[0], /off rhythm/);

  const sparse = openingsRhythmCheck({ openings: [win(0), win(8)] }, RHYTHM); // gap 6 > 4
  assert.equal(sparse.passed, false);

  const sills = openingsRhythmCheck({ openings: [win(0), { ...win(4), min: [4, 2, 0] }] }, RHYTHM);
  assert.equal(sills.passed, false);
  assert.ok(sills.findings.some((f) => /sill lines differ/.test(f)));

  // one opening per wall is vacuously rhythmic; walls are independent groups
  const single = openingsRhythmCheck({ openings: [win(0, "front"), win(0, "back")] }, RHYTHM);
  assert.equal(single.passed, true);
  assert.throws(() => openingsRhythmCheck({}, RHYTHM), /openings/);
  assert.throws(() => openingsRhythmCheck({ openings: [] }, { minSpacing: 4, maxSpacing: 2 }), /openingRhythm/);
});

// ---------------------------------------------------------------- palette-in-pack

const PACK_VOCAB = {
  palette: [{ block: "stone_bricks" }, { block: "oak_planks" }],
  decoration: [{ block: "lantern" }],
};

test("palette-in-pack: pack vocabulary passes (incl. decoration); foreign block named", () => {
  const occ = occupancyFromCells([...boxCells(), { pos: [0, 4, 0], block: "lantern", form: "fixture" }]);
  assert.equal(paletteInPackCheck(occ, PACK_VOCAB).passed, true);

  const alien = occupancyFromCells([...boxCells(), { pos: [2, 4, 2], block: "minecraft:sponge" }]);
  const r = paletteInPackCheck(alien, PACK_VOCAB);
  assert.equal(r.passed, false);
  assert.match(r.findings[0], /foreign block sponge ×1 \(e\.g\. 2,4,2\)/);
  assert.throws(() => paletteInPackCheck(alien, { palette: [], decoration: [] }), /empty vocabulary/);
});

// ---------------------------------------------------------------- watertight / single-component

test("watertight: closed shell passes; a punched hole fails; a declared opening is honorary skin", () => {
  const occ = occupancyFromCells(boxCells());
  assert.equal(watertightCheck(occ, {}).passed, true);

  const holed = boxCells({ mutate: (cs) => cs.filter((c) => !(c.pos[0] === 2 && c.pos[1] === 1 && c.pos[2] === 0)) });
  const r = watertightCheck(occupancyFromCells(holed), {});
  assert.equal(r.passed, false);
  assert.ok(r.findings.length > 0);

  const declared = watertightCheck(occupancyFromCells(holed), {
    openings: [{ min: [2, 1, 0], max: [2, 1, 0] }],
  });
  assert.equal(declared.passed, true);
});

test("single-component: one mass passes; floating debris fails; grounded annex is legitimate", () => {
  assert.equal(singleComponentCheck(occupancyFromCells(boxCells())).passed, true);

  const floating = occupancyFromCells([...boxCells(), { pos: [10, 10, 10], block: "stone_bricks" }]);
  const r = singleComponentCheck(floating);
  assert.equal(r.passed, false);
  assert.match(r.findings[0], /floating component of 1 cell/);

  // a detached but GROUNDED standing structure is not debris (E-25 componentStrip semantics)
  const annex = occupancyFromCells([...boxCells(), { pos: [10, 0, 10], block: "stone_bricks" }]);
  assert.equal(singleComponentCheck(annex).passed, true);
});

// ---------------------------------------------------------------- proportion-vs-concept

/** The closed box measures: eaveH 3 (flat roof → topmost row is the "eave"), totalH 4, aspect 1
 *  → ridgeToEave 1.3333, roofShare 0.25. */
const BOX_TRUE_TARGETS = Object.freeze({
  targets: { ridgeToEave: 1.3333, roofShare: 0.25, aspect: 1 },
  sources: { ridgeToEave: "concept", roofShare: "concept", aspect: "sketch" },
  tolerance: 0.15,
});

test("proportion-vs-concept: undeclared is vacuous; in-tolerance passes with the ratio table", () => {
  const occ = occupancyFromCells(boxCells());
  assert.equal(proportionCheck(occ, {}).passed, true);
  assert.equal(proportionCheck(occ, { proportions: null }).passed, true);

  const r = proportionCheck(occ, { proportions: BOX_TRUE_TARGETS });
  assert.equal(r.passed, true);
  assert.equal(r.ratios.tolerance, 0.15);
  assert.deepEqual(r.ratios.rows.map((x) => x.ratio), ["ridgeToEave", "roofShare", "aspect"]);
  assert.ok(r.ratios.rows.every((x) => x.withinTolerance === true));
});

test("proportion-vs-concept: an off-target ratio fails with the numbers in the finding", () => {
  const occ = occupancyFromCells(boxCells());
  const squat = { ...BOX_TRUE_TARGETS, targets: { ...BOX_TRUE_TARGETS.targets, roofShare: 0.6 } };
  const r = proportionCheck(occ, { proportions: squat });
  assert.equal(r.passed, false);
  assert.equal(r.findings.length, 1);
  assert.match(r.findings[0], /roofShare 0\.25 vs target 0\.6 \(concept\) — Δrel 0\.5833 > tolerance 0\.15/);
  const row = r.ratios.rows.find((x) => x.ratio === "roofShare");
  assert.equal(row.withinTolerance, false);
  assert.equal(row.excess, 0.5833);
});

test("proportion-vs-concept: a malformed declaration throws (bug, not finding)", () => {
  const occ = occupancyFromCells(boxCells());
  assert.throws(() => proportionCheck(occ, { proportions: { targets: {}, tolerance: 0.1 } }), /at least one/);
});

// ---------------------------------------------------------------- runConformance

const PACK = {
  palette: PACK_VOCAB.palette,
  decoration: PACK_VOCAB.decoration,
  proportions: { storeyHeight: { min: 3, max: 4 }, pitchClasses: [1], openingRhythm: RHYTHM },
  conformance: { checks: [...CONFORMANCE_CHECK_NAMES] },
};

test("runConformance: clean fixture passes all six pack-listed checks in order", () => {
  const build = {
    occ: occupancyFromCells(boxCells()),
    declarations: { bands: BANDS, symmetry: { axis: "x", at: 2 }, openings: [] },
  };
  const r = runConformance(build, PACK);
  assert.equal(r.passed, true);
  assert.deepEqual(r.checks.map((c) => c.name), [...CONFORMANCE_CHECK_NAMES]);
  assert.ok(r.checks.every((c) => c.passed));
});

test("runConformance: one failing check fails the gate; unknown check name throws", () => {
  const build = {
    occ: occupancyFromCells([...boxCells(), { pos: [2, 4, 2], block: "sponge" }]),
    declarations: { bands: BANDS, symmetry: null, openings: [] },
  };
  const r = runConformance(build, PACK);
  assert.equal(r.passed, false);
  assert.equal(r.checks.find((c) => c.name === "palette-in-pack").passed, false);

  assert.throws(
    () => runConformance(build, { ...PACK, conformance: { checks: ["vibes"] } }),
    /unknown check "vibes"/,
  );
  assert.throws(() => runConformance(build, { ...PACK, conformance: { checks: [] } }), /non-empty/);
});

test("runConformance: proportion activates by declaration, never duplicates, never infers", () => {
  const SIX = { ...PACK, conformance: { checks: CONFORMANCE_CHECK_NAMES.filter((n) => n !== "proportion-vs-concept") } };
  const decl = { bands: BANDS, symmetry: null, openings: [] };
  const occ = occupancyFromCells(boxCells());

  // undeclared + unlisted (every committed chain): exactly the pack's checks — report unchanged
  const before = runConformance({ occ, declarations: decl }, SIX);
  assert.equal(before.checks.length, 6);
  assert.ok(!before.checks.some((c) => c.name === "proportion-vs-concept"));

  // declared + unlisted: appended after the pack's list, ratios carried
  const declared = runConformance({ occ, declarations: { ...decl, proportions: BOX_TRUE_TARGETS } }, SIX);
  assert.equal(declared.checks.length, 7);
  assert.equal(declared.checks[6].name, "proportion-vs-concept");
  assert.ok(Array.isArray(declared.checks[6].ratios.rows));

  // declared + pack-listed: runs once, in the pack's position
  const listed = runConformance({ occ, declarations: { ...decl, proportions: BOX_TRUE_TARGETS } }, PACK);
  assert.equal(listed.checks.filter((c) => c.name === "proportion-vs-concept").length, 1);
});
