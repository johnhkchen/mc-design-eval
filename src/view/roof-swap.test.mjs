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
  assert.equal(res.attempts.length, 2);
  assert.equal(res.attempts[0].accepted, false);
  assert.ok(res.attempts[0].reasons.some((r) => /silhouette IoU regressed/.test(r)));
  assert.deepEqual(res.attempts[1].pitches[0].sides.map((s) => s.source), ["voxel", "voxel"]);
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
