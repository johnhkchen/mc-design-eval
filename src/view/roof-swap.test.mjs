// Unit tests for roof-swap.mjs (T-104-01, story S-104, epic E-27) — synthetic shells only; the
// cottage/gatehouse evidence runs live in the runner (benchmarks/sculpture/roof-program.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { voxelSilhouettes } from "./shell-regularize.mjs";
import { generateRoof } from "./roof-generate.mjs";
import { MULTI_ANGLE_GATE } from "../config.mjs";
import { massView, chimneyColumns, roofBandCensus, swapRoof } from "./roof-swap.mjs";

const SPRUCE = { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab", findings: [] };
const refsOf = (occ) => voxelSilhouettes(occ, MULTI_ANGLE_GATE.azimuths);

/** A sane symmetric gable: ridge along z at x=4 (y=14), eaves y=10 at x=0/8, pitch 1. */
function gable({ ridgeY = 14, eaveY = 10 } = {}) {
  const cols = new Set();
  for (let x = 0; x <= 8; x++) for (let z = 0; z <= 7; z++) cols.add(`${x},${z}`);
  return {
    id: "gable-main",
    ridge: { axis: "z", y: ridgeY },
    sides: [
      { planeId: "roof-a", eaveDir: "+x", pitch: 1, pitchSource: "glb", eaveY, eaveEdge: 8,
        extentCells: cellsRect(5, 8, 0, 7) },
      { planeId: "roof-b", eaveDir: "-x", pitch: 1, pitchSource: "glb", eaveY, eaveEdge: 0,
        extentCells: cellsRect(0, 3, 0, 7) },
    ],
    footprint: { cols, bbox: { minX: 0, maxX: 8, minZ: 0, maxZ: 7 }, area: cols.size },
    hip: { demanded: false, lo: false, hi: false },
    sane: true, reasons: [],
  };
}

function cellsRect(x0, x1, z0, z1) {
  const out = [];
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) out.push([x, z]);
  return out;
}

/** Solid base mass x0..8 × y0..9 × z0..7 (the walls below the roof band). */
function baseCells() {
  const cells = [];
  for (let x = 0; x <= 8; x++) for (let y = 0; y <= 9; y++) for (let z = 0; z <= 7; z++) {
    cells.push({ pos: [x, y, z], block: "stone" });
  }
  return cells;
}

/** The clean ideal: base + a full-block gable wedge (+ the chimney when the scene has one) — the
 *  test's stand-in for the GLB, which contains every real feature including the stack. */
function idealOcc({ chimneyAt = null, chimneyTop = 17 } = {}) {
  const wedge = generateRoof([gable()], { ...SPRUCE, stairs: null, slab: null, findings: [] });
  const cells = [...baseCells(), ...wedge.cells];
  if (chimneyAt) {
    const [x, z] = chimneyAt;
    for (let y = 10; y <= chimneyTop; y++) cells.push({ pos: [x, y, z], block: "cobblestone" });
  }
  return occupancyFromCells(cells);
}

/** The input: base + a NOISY sampled roof (gable-ish heights with spikes and pits). */
function spikyInput({ chimneyAt = null, chimneyY = [10, 15] } = {}) {
  const cells = baseCells();
  for (let x = 0; x <= 8; x++) for (let z = 0; z <= 7; z++) {
    if (chimneyAt && chimneyAt[0] === x && chimneyAt[1] === z) continue;
    const ideal = Math.min(14, 10 + Math.min(8 - x, x));
    let top = ideal;
    if ((x * 31 + z * 17) % 5 === 0) top = ideal + 2;      // spikes
    if ((x * 13 + z * 7) % 6 === 0) top = Math.max(10, ideal - 2); // pits
    for (let y = 10; y <= top; y++) cells.push({ pos: [x, y, z], block: "stone" });
  }
  if (chimneyAt) {
    const [x, z] = chimneyAt;
    for (let y = chimneyY[0]; y <= chimneyY[1]; y++) cells.push({ pos: [x, y, z], block: "cobblestone" });
  }
  return occupancyFromCells(cells);
}

test("accept path: spikes carved to zero, stair courses placed, cage holds", () => {
  const input = spikyInput();
  const res = swapRoof(input, { gables: [gable()], family: SPRUCE, refSils: refsOf(idealOcc()) });
  assert.equal(res.accepted, true, res.reasons.join("; "));
  assert.ok(res.census.before.spikes > 0, "the synthetic input must actually be spiky");
  // ≈0 (the AC): a clean gable's ridge LINE exposes 4 faces at its two end cells — geometry, not
  // noise. The principled residual is ≤ 2 per generated gable, never the input's spike field.
  assert.ok(res.census.after.spikes <= 2, `after ${res.census.after.spikes}`);
  assert.ok(res.census.after.spikes < res.census.before.spikes);
  assert.ok(res.carve.removed > 0);
  assert.ok(res.generated.counts.stairs > 0);
  // a stair tread carries the proven state vocabulary and the fixture form
  const stairKey = [...res.occ.cells.entries()].find(([, b]) => b === "spruce_stairs")?.[0];
  assert.ok(stairKey, "stairs present in the swapped shell");
  assert.deepEqual(Object.keys(res.occ.states.get(stairKey)).sort(), ["facing", "half", "shape"]);
  assert.equal(res.occ.forms.get(stairKey), "fixture");
  // fit error is recorded regardless of verdict
  assert.ok(res.fitError.length === 1 && res.fitError[0].rmse !== null);
  // closure did not regress (solid wedge seals the band by construction)
  assert.ok(res.closure.candidate.reached <= res.closure.input.reached);
});

test("chimney passes through byte-identical and is re-seated when its base floats", () => {
  const input = spikyInput({ chimneyAt: [2, 3], chimneyY: [15, 17] }); // floats above new h=12
  const chimney = new Set(["2,3"]);
  const protect = [{ name: "chimney", contains: ([x, y, z]) => x === 2 && z === 3 && y >= 10 }];
  const res = swapRoof(input, { gables: [gable()], family: SPRUCE,
    refSils: refsOf(idealOcc({ chimneyAt: [2, 3] })), protect, chimney });
  assert.equal(res.accepted, true, res.reasons.join("; "));
  // original stack cells byte-identical
  for (let y = 15; y <= 17; y++) assert.equal(res.occ.cells.get(`2,${y},3`), "cobblestone");
  // the gap between the new surface (h=12) and the stack base (15) is filled with the stack's block
  assert.deepEqual(res.reseat.added.sort(), [[2, 13, 3], [2, 14, 3]].sort());
  for (const [x, y, z] of res.reseat.added) assert.equal(res.occ.cells.get(`${x},${y},${z}`), "cobblestone");
});

test("rollback: IoU regression returns the input unchanged with a named reason", () => {
  const input = spikyInput();
  // the reference IS the spiky input — any change regresses; tolerance 0 forces the trip
  const res = swapRoof(input, { gables: [gable()], family: SPRUCE, refSils: refsOf(input),
    opts: { iouTolerance: 0 } });
  assert.equal(res.accepted, false);
  assert.equal(res.occ, input, "auto-rollback returns the input occupancy itself");
  assert.ok(res.reasons.some((r) => /silhouette IoU regressed/.test(r)), res.reasons.join("; "));
  // the fit error and censuses are still recorded — honest fallback, not a silent skip
  assert.ok(res.fitError.length === 1);
  assert.deepEqual(res.census.after, res.census.before);
});

test("rollback: a protected region inside the carve is a violation", () => {
  const input = spikyInput();
  const protect = [{ name: "dormer", contains: ([x, y, z]) => x === 6 && z === 2 && y >= 10 }];
  const res = swapRoof(input, { gables: [gable()], family: SPRUCE, refSils: refsOf(idealOcc()), protect });
  assert.equal(res.accepted, false);
  assert.equal(res.occ, input);
  assert.ok(res.reasons.some((r) => /protected regions touched/.test(r)));
});

test("out-of-tolerance gable drops with a named finding; the rest re-compose", () => {
  // a second, lower gable over the same columns: the main gable buries its extent → huge rmse
  const buried = {
    ...gable({ ridgeY: 11, eaveY: 10 }),
    id: "gable-buried",
    sides: gable({ ridgeY: 11, eaveY: 10 }).sides.map((s) => ({ ...s, pitch: 0.5 })),
  };
  const input = spikyInput();
  const res = swapRoof(input, { gables: [gable(), buried], family: SPRUCE, refSils: refsOf(idealOcc()) });
  assert.equal(res.accepted, true, res.reasons.join("; "));
  assert.deepEqual(res.generated.gables, ["gable-main"]);
  assert.ok(res.findings.some((f) => f.code === "gable-fit-out-of-tolerance" && f.where === "gable-buried"));
});

test("nothing generated (no sane gable) is a named non-swap, not an error", () => {
  const input = spikyInput();
  const bad = { ...gable(), sane: false, reasons: ["synthetic"] };
  const res = swapRoof(input, { gables: [bad], family: SPRUCE, refSils: refsOf(idealOcc()) });
  assert.equal(res.accepted, false);
  assert.equal(res.occ, input);
  assert.ok(res.reasons[0].includes("nothing generated"));
});

test("massView counts only the named keys as mass; other fixtures stay dressing", () => {
  const occ = occupancyFromCells([
    { pos: [0, 0, 0], block: "stone" },
    { pos: [1, 0, 0], block: "spruce_stairs", form: "fixture", state: { facing: "east", half: "bottom", shape: "straight" } },
    { pos: [2, 0, 0], block: "spruce_trapdoor", form: "fixture", state: { facing: "north", half: "bottom", open: "true" } },
  ]);
  const mv = massView(occ, new Set(["1,0,0"]));
  assert.equal(mv.solid(1, 0, 0), true, "generated stair counts as mass");
  assert.equal(mv.solid(2, 0, 0), false, "the trapdoor stays dressing");
  assert.deepEqual(mv.states.get("1,0,0"), { facing: "east", half: "bottom", shape: "straight" });
});

test("roofBandCensus restricts to the band and the given columns", () => {
  const occ = spikyInput();
  const all = new Set();
  for (let x = 0; x <= 8; x++) for (let z = 0; z <= 7; z++) all.add(`${x},${z}`);
  const band = roofBandCensus(occ, { cols: all, bandFloor: 10 });
  assert.ok(band.spikes > 0);
  const below = roofBandCensus(occ, { cols: all, bandFloor: 20 });
  assert.equal(below.cells, 0);
  const narrow = roofBandCensus(occ, { cols: new Set(["0,0"]), bandFloor: 10 });
  assert.ok(narrow.cells <= 5 && narrow.cells > 0);
});

test("chimneyColumns unions the record's protrusion masses with the geometric stack", () => {
  const record = { masses: [
    { id: "mass-0", role: "primary" },
    { id: "mass-1", role: "protrusion", plan: { runs: [{ z: 3, x0: 2, x1: 2 }] } },
  ] };
  const occ = spikyInput({ chimneyAt: [2, 3], chimneyY: [10, 17] });
  const cols = chimneyColumns(record, occ);
  assert.ok(cols.has("2,3"));
});

test("attempt ladder: a glb pitch inconsistent with the geometry falls back to voxel under the cage", () => {
  // as-fitted (glb) pitch 0.25 never reaches the ridge → flat-topped wedge → IoU rejection;
  // the declared second attempt (all-voxel, pitch 1) realizes the recorded geometry and passes.
  const g = gable();
  for (const s of g.sides) Object.assign(s, { pitch: 0.25, pitchSource: "glb", glbPitch: 0.25, voxelPitch: 1 });
  const input = spikyInput();
  const res = swapRoof(input, { gables: [g], family: SPRUCE, refSils: refsOf(idealOcc()) });
  assert.equal(res.accepted, true, res.reasons.join("; "));
  assert.equal(res.attempt, "voxel-pitch");
  // T-109-01: the insane glb pitch also MOVES the intersection ridge, so the as-fitted candidate
  // now carries a leading ridge-fit flavor (3 rungs); the voxel candidate's intersection lands on
  // the recorded ridge and collapses into the plain rung.
  assert.equal(res.attempts.length, 3);
  assert.equal(res.attempts[0].name, "as-fitted-ridge-fit");
  assert.equal(res.attempts[0].accepted, false);
  assert.equal(res.attempts[1].accepted, false);
  assert.ok(res.attempts[1].reasons.some((r) => /silhouette IoU regressed/.test(r)));
  assert.deepEqual(res.attempts.at(-1).pitches[0].sides.map((s) => s.source), ["voxel", "voxel"]);
});

test("attempt ladder: a refuted hip demand falls back to plain gable ends under the cage", () => {
  // hip demand (a fragmented-ridge false positive) deletes real end mass → IoU rejection; the
  // gable-ends rung regenerates the full-length prism and passes.
  const g = { ...gable(), hip: { demanded: true, lo: true, hi: true } };
  const input = spikyInput();
  // tolerance tightened for the small synthetic scene so the hip's end-mass loss registers
  const res = swapRoof(input, { gables: [g], family: SPRUCE, refSils: refsOf(idealOcc()),
    opts: { iouTolerance: 0.005 } });
  assert.equal(res.accepted, true, res.reasons.join("; "));
  assert.equal(res.attempt, "as-fitted-gable-ends");
  assert.ok(res.attempts.find((a) => a.name === "as-fitted" && !a.accepted));
});

test("attempt ladder: identical pitch sources collapse to a single attempt", () => {
  const input = spikyInput();
  const res = swapRoof(input, { gables: [gable()], family: SPRUCE, refSils: refsOf(idealOcc()) });
  assert.equal(res.attempts.length, 1, "no voxelPitch on the synthetic sides → no second variant");
  assert.equal(res.attempt, "as-fitted");
});

test("determinism: two swaps report identical metrics", () => {
  const args = () => ({ gables: [gable()], family: SPRUCE, refSils: refsOf(idealOcc()) });
  const a = swapRoof(spikyInput(), args());
  const b = swapRoof(spikyInput(), args());
  assert.deepEqual(a.iou, b.iou);
  assert.deepEqual(a.census, b.census);
  assert.deepEqual(a.generated, b.generated);
  assert.deepEqual([...a.occ.cells.entries()].sort(), [...b.occ.cells.entries()].sort());
});

// --- fitted ends (T-108-01): end-fitted rungs, carve over the untrimmed footprint ----------------

/** The gable with fitted ends: blob footprint z 0..7, gable face at z=5, verge tip at z=6. */
function endedGable(opts = {}) {
  const g = gable(opts);
  return {
    ...g,
    ends: {
      lo: null, // the lo end stays as-built (an unfitted end is a named finding upstream)
      hi: { dir: "+z", coord: 6, faceCoord: 5, overhang: 1, source: "glb" },
    },
  };
}

/** The clean ideal for the END-FITTED scene: walls to z=5, roof courses overhanging to z=6. */
function endedIdealOcc() {
  const cells = [];
  for (let x = 0; x <= 8; x++) for (let y = 0; y <= 9; y++) for (let z = 0; z <= 5; z++) {
    cells.push({ pos: [x, y, z], block: "stone" });
  }
  const wedge = generateRoof([endedGable()], { ...SPRUCE, stairs: null, slab: null, findings: [] });
  cells.push(...wedge.cells);
  return occupancyFromCells(cells);
}

/** The input: walls to z=5, blob roof over the FULL footprint z 0..7 (overrun past the wall). */
function endedSpikyInput() {
  const cells = [];
  for (let x = 0; x <= 8; x++) for (let y = 0; y <= 9; y++) for (let z = 0; z <= 5; z++) {
    cells.push({ pos: [x, y, z], block: "stone" });
  }
  for (let x = 0; x <= 8; x++) for (let z = 0; z <= 7; z++) {
    const ideal = Math.min(14, 10 + Math.min(8 - x, x));
    const top = (x * 31 + z * 17) % 5 === 0 ? ideal + 2 : ideal;
    for (let y = 10; y <= top; y++) cells.push({ pos: [x, y, z], block: "stone" });
  }
  return occupancyFromCells(cells);
}

test("end-fitted rung: blob past the fitted verge tip is carved, not regenerated", () => {
  const input = endedSpikyInput();
  const res = swapRoof(input, {
    gables: [gable()], endFit: { gables: [endedGable()] },
    family: SPRUCE, refSils: refsOf(endedIdealOcc()),
  });
  assert.equal(res.accepted, true, res.reasons.join("; "));
  assert.equal(res.attempt, "end-fitted");
  // columns past the fitted tip (z=7) are gone above the band floor
  for (let x = 0; x <= 8; x++) for (let y = 10; y <= 16; y++) {
    assert.equal(res.occ.cells.has(`${x},${y},7`), false, `residue at ${x},${y},7 must be carved`);
  }
  // the sheet strip (z=6) carries the surface course with an OPEN underside
  assert.equal(res.occ.cells.has("4,14,6"), true, "ridge course present on the verge sheet");
  assert.equal(res.occ.cells.has("4,13,6"), false, "no fill under the verge sheet");
  // sheet courses are excluded from the after-census BY KEY and counted, never hidden
  assert.ok(res.census.after.excluded.cells > 0, "sheet cells reported in the census exclusion");
  assert.ok(res.census.after.spikes <= 2, `non-sheet residual stays in the ridge-end class, got ${res.census.after.spikes}`);
  // ends are named in the result for the durable record
  assert.equal(res.generated.fittedEnds, 1);
  assert.deepEqual(res.generated.endCoords, [{ id: "gable-main", lo: null, hi: { coord: 6, faceCoord: 5, overhang: 1 } }]);
  assert.deepEqual(res.attempts[0].ends, [{ id: "gable-main", lo: null, hi: 6 }]);
});

test("no endFit → ladder, names, and result are byte-identical to the legacy swap", () => {
  const a = swapRoof(spikyInput(), { gables: [gable()], family: SPRUCE, refSils: refsOf(idealOcc()) });
  const b = swapRoof(spikyInput(), { gables: [gable()], endFit: null, family: SPRUCE, refSils: refsOf(idealOcc()) });
  assert.deepEqual(a.attempts.map((x) => x.name), b.attempts.map((x) => x.name));
  assert.deepEqual([...a.occ.cells.entries()].sort(), [...b.occ.cells.entries()].sort());
});

test("endFit with no fitted ends collapses onto the legacy rungs (dedup by shape)", () => {
  const unfitted = { ...gable(), ends: { lo: null, hi: null } };
  const res = swapRoof(spikyInput(), {
    gables: [gable()], endFit: { gables: [unfitted] },
    family: SPRUCE, refSils: refsOf(idealOcc()),
  });
  assert.equal(res.attempts.length, 1, "no-end fit has the legacy shape — one attempt only");
  assert.equal(res.attempt, "end-fitted", "the first-named rung wins the dedup");
});

test("all end-fitted rungs rejected → the legacy tail still stands (Rule 1 fallback order)", () => {
  // refSils match the UNTRIMMED ideal and the fitted end trims MOST of the roof away → the
  // silhouettes regress past tolerance, the end-fitted rung is rejected (named), and the legacy
  // as-fitted rung accepts. (A 1-cell trim sits inside the cage's declared tolerance by design.)
  const badEnds = {
    ...gable(),
    ends: { lo: null, hi: { dir: "+z", coord: 2, faceCoord: 1, overhang: 1, source: "glb" } },
  };
  const input = spikyInput();
  const res = swapRoof(input, {
    gables: [gable()], endFit: { gables: [badEnds] },
    family: SPRUCE, refSils: refsOf(idealOcc()),
  });
  assert.equal(res.accepted, true, res.reasons.join("; "));
  assert.equal(res.attempt, "as-fitted");
  assert.equal(res.attempts[0].name, "end-fitted");
  assert.equal(res.attempts[0].accepted, false);
  assert.ok(res.attempts[0].reasons.length > 0, "the rejection is named");
});

// ---------------------------------------------------------------- ridge-fitted rungs (T-109-01)

test("ridge-fit rung repairs an apex shortfall: low recorded ridge raised to the plane intersection", () => {
  // recorded ridge y12 sits BELOW the side planes' intersection (y14) → the as-built surface is a
  // flat-topped wedge; the ideal (the GLB stand-in) has the sharp apex. The ridge-fit rung leads
  // and accepts; the ridge info is on the attempt.
  const input = spikyInput();
  const res = swapRoof(input, { gables: [gable({ ridgeY: 12 })], family: SPRUCE,
    refSils: refsOf(idealOcc()), opts: { iouTolerance: 0.005 } });
  assert.equal(res.accepted, true, res.reasons.join("; "));
  assert.equal(res.attempt, "as-fitted-ridge-fit");
  const a = res.attempts[0];
  assert.equal(a.name, "as-fitted-ridge-fit");
  assert.equal(a.ridge.length, 1);
  assert.equal(a.ridge[0].y, 14);
  assert.equal(a.ridge[0].deltaVsRecord, 2);
  // the swapped shell carries the sharp apex (cap at y14), not the flat top at y12
  assert.ok(res.occ.cells.has("4,14,3"), "apex cell at the fitted ridge height");
});

test("ridge-fit rung rejected by the cage falls through to the as-built ridge (Rule 1 order)", () => {
  // here the flat top IS the reference shape (ideal built at ridge y12) — raising the ridge to
  // the intersection regresses the silhouette, the ridge-fit rung is rejected (named) and the
  // plain rung stands. The input must be flat-topped too (a spiky FLAT roof), or the baseline
  // anchor would already absorb the apex.
  const flatIdeal = occupancyFromCells([
    ...baseCells(),
    ...generateRoof([gable({ ridgeY: 12 })], { ...SPRUCE, stairs: null, slab: null }).cells,
  ]);
  const flatSpiky = (() => {
    const cells = baseCells();
    for (let x = 0; x <= 8; x++) for (let z = 0; z <= 7; z++) {
      const ideal = Math.min(12, 10 + Math.min(8 - x, x));
      let top = ideal;
      if ((x * 31 + z * 17) % 5 === 0) top = ideal + 1;
      for (let y = 10; y <= top; y++) cells.push({ pos: [x, y, z], block: "stone" });
    }
    return occupancyFromCells(cells);
  })();
  const res = swapRoof(flatSpiky, { gables: [gable({ ridgeY: 12 })], family: SPRUCE,
    refSils: refsOf(flatIdeal), opts: { iouTolerance: 0.005 } });
  assert.equal(res.accepted, true, res.reasons.join("; "));
  assert.equal(res.attempt, "as-fitted");
  assert.equal(res.attempts[0].name, "as-fitted-ridge-fit");
  assert.equal(res.attempts[0].accepted, false);
  assert.ok(res.attempts[0].reasons.some((r) => /silhouette IoU regressed/.test(r)));
});

test("a consistent recorded ridge collapses the ridge-fit flavor (no extra rung, findings none)", () => {
  // gable() is self-consistent: intersection = recorded y14 → the flavor never appears
  const res = swapRoof(spikyInput(), { gables: [gable()], family: SPRUCE, refSils: refsOf(idealOcc()) });
  assert.ok(res.attempts.every((a) => !a.name.includes("ridge-fit")));
  assert.ok(!res.findings.some((f) => f.code === "ridge-unfitted"));
});

test("an unfittable ridge keeps the plain rungs and surfaces the named finding", () => {
  const g = gable();
  g.sides[0].pitch = null;
  g.sides[0].reasons = []; // keep the gable nominally sane to reach ridgeVariant's gate
  const res = swapRoof(spikyInput(), { gables: [g], family: SPRUCE, refSils: refsOf(idealOcc()) });
  assert.ok(res.attempts.every((a) => !a.name.includes("ridge-fit")));
  assert.ok(res.findings.some((f) => f.code === "ridge-unfitted"));
});
