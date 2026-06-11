// Unit tests for shell-regularize.mjs (T-102-01, story S-102, epic E-27) — synthetic spiky shells
// only; the three-subject evidence runs live in the runner (benchmarks/sculpture/regularize-shell.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { rebuildArtifact } from "./shell-integrity.mjs";
import { MULTI_ANGLE_GATE } from "../config.mjs";
import {
  REGULARIZE_DEFAULTS, protrusionCensus, raggedColumnRate, protrudingStackRegion,
  openShell, closeShell, exposedFaceMesh, voxelSilhouettes, silhouetteIoUs, regularizeShell,
} from "./shell-regularize.mjs";

/** Solid box of `block` over inclusive ranges. */
function boxCells(x0, x1, y0, y1, z0, z1, block = "stone") {
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    cells.push({ pos: [x, y, z], block });
  }
  return cells;
}

const keysOf = (occ) => new Set(occ.cells.keys());

/** An 8×4×8 solid box (ground at y=0) with 3 one-cell roof spikes and a 3-cell fin. */
function spikyBox() {
  return occupancyFromCells([
    ...boxCells(0, 7, 0, 3, 0, 7),
    { pos: [2, 4, 2], block: "stone" }, { pos: [5, 4, 6], block: "stone" }, { pos: [7, 4, 0], block: "stone" },
    { pos: [3, 4, 4], block: "stone" }, { pos: [3, 5, 4], block: "stone" }, { pos: [4, 4, 4], block: "stone" },
  ]);
}

/** The box with a legitimate 2×2×4 chimney (16 cells ≥ minKeep=9). */
function chimneyBox() {
  return occupancyFromCells([
    ...boxCells(0, 7, 0, 3, 0, 7),
    ...boxCells(1, 2, 4, 7, 1, 2, "bricks"),
  ]);
}

/** The box with a SLENDER 1×2-footprint chimney (10 cells) — its 2-column cap is below
 *  protrudingStackRegion's minPlateau, so the roof plane is the ridge and the stack is detected. */
function stackBox() {
  return occupancyFromCells([
    ...boxCells(0, 7, 0, 3, 0, 7),
    ...boxCells(1, 2, 4, 8, 1, 1, "bricks"),
  ]);
}

/** Reference silhouettes for a given occupancy at the 4 gate azimuths (self-reference idiom). */
const refsOf = (occ) => voxelSilhouettes(occ, MULTI_ANGLE_GATE.azimuths);

// ---------------------------------------------------------------- census metrics

test("protrusionCensus: hand-counted exposures — isolated cube is a 6-face spike", () => {
  const r = protrusionCensus(occupancyFromCells([{ pos: [0, 0, 0], block: "stone" }]));
  assert.equal(r.spikes, 1);
  assert.equal(r.byExposure[6], 1);
});

test("protrusionCensus: solid box has corner cells at 3 exposed faces — zero spikes", () => {
  const r = protrusionCensus(occupancyFromCells(boxCells(0, 3, 0, 3, 0, 3)));
  assert.equal(r.spikes, 0);
  assert.equal(r.byExposure[3], 8); // the 8 corners
});

test("protrusionCensus: spiky box counts its spikes and fin edges", () => {
  const r = protrusionCensus(spikyBox());
  // 3 isolated roof spikes (5 faces each) + the fin's top cell (5) and its 1-wide end cell (4);
  // the fin cell with both a fin neighbor and the fin top above it sits at 3 — not a spike
  assert.equal(r.spikes, 5);
});

test("raggedColumnRate: flat slab → 0; one tower column cliffs itself and its 4 present neighbors", () => {
  assert.equal(raggedColumnRate(occupancyFromCells(boxCells(0, 4, 0, 0, 0, 4))).ragged, 0);
  const r = raggedColumnRate(occupancyFromCells([
    ...boxCells(0, 4, 0, 0, 0, 4),
    ...boxCells(2, 2, 1, 4, 2, 2),
  ]));
  assert.equal(r.ragged, 5); // the tower column + its 4 edge-adjacent neighbors
  assert.equal(r.total, 25);
});

test("raggedColumnRate: footprint edges never count (absent neighbors are form, not noise)", () => {
  const r = raggedColumnRate(occupancyFromCells(boxCells(0, 3, 0, 5, 0, 3)));
  assert.equal(r.ragged, 0);
});

// ---------------------------------------------------------------- protrudingStackRegion (lifted)

test("protrudingStackRegion: box + slender chimney — ridge is the roof plane, stack columns flagged", () => {
  const r = protrudingStackRegion(stackBox());
  assert.equal(r.ridgeY, 3);
  assert.equal(r.columns.size, 2);
  assert.ok(r.contains([1, 4, 1]));
  assert.ok(!r.contains([1, 3, 1])); // below the ridge — roof mass, not stack
  assert.ok(!r.contains([5, 4, 5])); // air column off the stack
});

test("protrudingStackRegion: a chimney cap as wide as minPlateau IS the ridge plane (the known limit)", () => {
  // the 2×2 cap is an 8-connected plateau of exactly minPlateau=4 equal-top columns → it becomes
  // the ridge and no stack is detected; minKeep restore (not the region) protects such chimneys
  const r = protrudingStackRegion(chimneyBox());
  assert.equal(r.ridgeY, 7);
  assert.equal(r.columns.size, 0);
});

test("protrudingStackRegion: flat box has no protrusion — empty region", () => {
  const r = protrudingStackRegion(occupancyFromCells(boxCells(0, 5, 0, 2, 0, 5)));
  assert.equal(r.columns.size, 0);
  assert.ok(!r.contains([0, 3, 0]));
});

// ---------------------------------------------------------------- openShell

test("openShell removes spikes and fins; the box mass survives intact (ground-solid: no bottom peel)", () => {
  const occ = spikyBox();
  const r = openShell(occ, { radius: 1, minKeep: 9 });
  assert.equal(r.removedCells, 6);
  assert.equal(r.restored.length, 0);
  assert.equal(protrusionCensus(r.occ).spikes, 0);
  // exactly the 8×4×8 box remains — every box cell incl. the y=0 layer kept
  assert.equal(r.occ.size, 8 * 4 * 8);
  assert.deepEqual(r.occ.bounds, { min: [0, 0, 0], max: [7, 3, 7] });
});

test("openShell restores a coherent thin feature (the chimney) via minKeep and declares it", () => {
  const occ = chimneyBox();
  const r = openShell(occ, { radius: 1, minKeep: 9 });
  assert.equal(r.removedCells, 0); // the 16-cell chimney came back whole
  assert.equal(r.restored.length, 1);
  assert.equal(r.restored[0].size, 16);
  assert.ok(r.occ.cells.has("1,7,1"), "chimney top survives");
});

test("openShell with minKeep above the feature size removes it — the threshold is the policy", () => {
  const r = openShell(chimneyBox(), { radius: 1, minKeep: 17 });
  assert.equal(r.removedCells, 16);
  assert.equal(r.removed[0].size, 16);
});

test("openShell honors a protect predicate: protected spike cells are never removed", () => {
  const occ = spikyBox();
  const protect = [{ name: "keep", contains: ([x, y, z]) => x === 2 && y === 4 && z === 2 }];
  const r = openShell(occ, { radius: 1, minKeep: 9, protect });
  assert.ok(r.occ.cells.has("2,4,2"), "protected spike survives");
  assert.equal(r.removedCells, 5); // the other 5 noise cells still go
});

// ---------------------------------------------------------------- closeShell

test("closeShell fills a 1-wide notch with the majority neighbor block", () => {
  const cells = boxCells(0, 5, 0, 3, 0, 5, "minecraft:stone_bricks")
    .filter(({ pos: [x, y, z] }) => !(x === 2 && y === 3 && z === 2)); // a 1-cell pit in the roof
  const r = closeShell(occupancyFromCells(cells), { radius: 1 });
  assert.equal(r.addedCells, 1);
  assert.deepEqual(r.added[0].pos, [2, 3, 2]);
  assert.equal(r.added[0].block, "minecraft:stone_bricks");
  assert.equal(r.occ.size, 6 * 4 * 6);
});

test("closeShell is ADD-only and never adds inside a protect region (a window slit stays open)", () => {
  const cells = boxCells(0, 5, 0, 3, 0, 5).filter(({ pos: [x, y, z] }) => !(x === 2 && y === 3 && z === 2));
  const occ = occupancyFromCells(cells);
  const protect = [{ name: "slit", contains: ([x, y, z]) => x === 2 && y === 3 && z === 2 }];
  const r = closeShell(occ, { radius: 1, protect });
  assert.equal(r.addedCells, 0);
  assert.equal(r.occ.size, occ.size);
  for (const k of occ.cells.keys()) assert.ok(r.occ.cells.has(k)); // closing ⊇ input, structurally
});

test("closeShell tie-break is lexicographic on the bare block id", () => {
  // pit at (1,1,1) inside a 3×3×3 box: 5 in-box neighbors; recolor so two blocks tie 2–2
  const cells = boxCells(0, 2, 0, 2, 0, 2, "stone").filter(({ pos }) => pos.join(",") !== "1,1,1");
  const recolor = new Map([["0,1,1", "andesite"], ["2,1,1", "andesite"], ["1,0,1", "bricks"], ["1,2,1", "bricks"], ["1,1,0", "cobblestone"], ["1,1,2", "diorite"]]);
  const r = closeShell(occupancyFromCells(cells.map((c) => ({ ...c, block: recolor.get(c.pos.join(",")) ?? c.block }))), { radius: 1 });
  assert.equal(r.addedCells, 1);
  assert.equal(r.added[0].block, "andesite"); // 2×andesite ties 2×bricks → lexicographic
});

// ---------------------------------------------------------------- the silhouette path

test("exposedFaceMesh: a unit cube exposes 6 faces = 12 tris, bounds are [min, max+1]", () => {
  const m = exposedFaceMesh(occupancyFromCells([{ pos: [2, 3, 4], block: "stone" }]));
  assert.equal(m.triCount, 12);
  assert.equal(m.positions.length, 6 * 4 * 3);
  assert.deepEqual(m.bounds, { min: [2, 3, 4], max: [3, 4, 5] });
});

test("exposedFaceMesh: interior faces are culled (2×1×1 bar shares one face pair)", () => {
  const m = exposedFaceMesh(occupancyFromCells([{ pos: [0, 0, 0], block: "stone" }, { pos: [1, 0, 0], block: "stone" }]));
  assert.equal(m.triCount, 20); // 12 + 12 − 2·2 shared
});

test("exposedFaceMesh: cells subset keeps the FULL bounds and faces relative to the subset (T-109-01)", () => {
  const occ = occupancyFromCells([
    { pos: [0, 0, 0], block: "stone" }, { pos: [1, 0, 0], block: "stone" },
    { pos: [5, 5, 5], block: "stone" },
  ]);
  const m = exposedFaceMesh(occ, { cells: new Set(["5,5,5"]) });
  assert.equal(m.triCount, 12); // the lone subset cube exposes all 6 faces
  assert.deepEqual(m.bounds, { min: [0, 0, 0], max: [6, 6, 6] }); // full-occupancy framing
  // a single bar cell in the subset exposes the face its bar buddy used to cover
  const half = exposedFaceMesh(occ, { cells: new Set(["0,0,0"]) });
  assert.equal(half.triCount, 12);
});

test("exposedFaceMesh: no subset option is byte-identical to the legacy path", () => {
  const occ = occupancyFromCells(boxCells(0, 2, 0, 2, 0, 2));
  const a = exposedFaceMesh(occ);
  const b = exposedFaceMesh(occ, {});
  assert.deepEqual([...a.positions], [...b.positions]);
  assert.deepEqual([...a.indices], [...b.indices]);
});

test("silhouetteIoUs ≈ 1 against a same-shape reference at a different scale (framing cancels)", () => {
  const small = occupancyFromCells(boxCells(0, 3, 0, 3, 0, 3));
  const big = occupancyFromCells(boxCells(0, 7, 0, 7, 0, 7));
  const ious = silhouetteIoUs(small, refsOf(big));
  for (const a of MULTI_ANGLE_GATE.azimuths) assert.ok(ious[a] > 0.97, `${a}: ${ious[a]}`);
});

test("silhouetteIoUs < 1 against a genuinely different shape", () => {
  const cube = occupancyFromCells(boxCells(0, 3, 0, 3, 0, 3));
  const slab = occupancyFromCells(boxCells(0, 11, 0, 1, 0, 11));
  const ious = silhouetteIoUs(cube, refsOf(slab));
  for (const a of MULTI_ANGLE_GATE.azimuths) assert.ok(ious[a] < 0.9, `${a}: ${ious[a]}`);
});

// ---------------------------------------------------------------- the cage

test("regularizeShell: spiky box vs its clean GLB-twin — open accepted, census drops to zero", () => {
  const clean = occupancyFromCells(boxCells(0, 7, 0, 3, 0, 7));
  const r = regularizeShell(spikyBox(), { refSils: refsOf(clean) });
  assert.equal(r.rejected, 0);
  assert.equal(r.census.before.spikes, 5);
  assert.equal(r.census.after.spikes, 0);
  assert.ok(r.trace.every((s) => s.accepted && s.reasons.length === 0));
  for (const a of MULTI_ANGLE_GATE.azimuths) assert.ok(r.iou.final[a] >= r.iou.baseline[a] - 0.02);
});

test("regularizeShell: a destructive step is rejected, rolled back, and recorded with reasons", () => {
  const occ = occupancyFromCells(boxCells(0, 7, 0, 3, 0, 7));
  const wingless = occupancyFromCells(boxCells(0, 3, 0, 3, 0, 7)); // half the box gone
  const r = regularizeShell(occ, {
    refSils: refsOf(occ),
    iouTolerance: 0.02,
    steps: [{ op: "open", fn: () => ({ occ: wingless, removedCells: occ.size - wingless.size }) }],
  });
  assert.equal(r.accepted, 0);
  assert.equal(r.rejected, 1);
  assert.equal(r.occ, occ); // rolled back — the input occupancy stands
  assert.equal(r.trace[0].accepted, false);
  assert.ok(r.trace[0].reasons.some((m) => m.startsWith("iou:")), r.trace[0].reasons.join("; "));
  assert.deepEqual(r.census.after, r.census.before);
});

// hollow-interior box (closed): walls + roof + floor, on ground
const hollowCells = () => boxCells(0, 5, 0, 4, 0, 5).filter(({ pos: [x, y, z] }) =>
  x === 0 || x === 5 || z === 0 || z === 5 || y === 4 || y === 0);
const dropAt = (cells, ...keys) => {
  const dropSet = new Set(keys);
  return cells.filter(({ pos }) => !dropSet.has(pos.join(",")));
};

test("regularizeShell: a hole poked into a CLOSED shell is plug-remediated and recorded", () => {
  const occ = occupancyFromCells(hollowCells());
  const holed = occupancyFromCells(dropAt(hollowCells(), "2,4,2"));
  const r = regularizeShell(occ, {
    refSils: refsOf(occ),
    steps: [{ op: "open", fn: () => ({ occ: holed }) }],
  });
  assert.equal(r.accepted, 1, r.trace[0].reasons.join("; "));
  assert.ok(r.trace[0].cells.plugged >= 1, "plug remediation recorded");
  assert.equal(r.trace[0].closure.reached, 0);
});

test("regularizeShell: closure NO-REGRESS — an already-open input shell gates on not getting worse", () => {
  // two chambers split by a full wall at x=3; the roof hole over chamber A makes the input OPEN
  // with only chamber A reached — chamber B's sealed interior is what no-regress protects
  const chambered = () => [
    ...boxCells(0, 6, 0, 4, 0, 5).filter(({ pos: [x, y, z] }) =>
      x === 0 || x === 6 || z === 0 || z === 5 || y === 4 || y === 0),
    ...boxCells(3, 3, 1, 3, 1, 4), // the dividing wall
  ];
  const input = occupancyFromCells(dropAt(chambered(), "1,4,1")); // roof hole over chamber A
  const same = regularizeShell(input, {
    refSils: refsOf(input),
    steps: [{ op: "open", fn: (o) => ({ occ: o }) }],
  });
  assert.equal(same.accepted, 1, same.trace[0].reasons.join("; ")); // no-op never regresses
  const breached = occupancyFromCells(dropAt(chambered(), "1,4,1", "3,2,2")); // wall hole → chamber B reached
  const regress = regularizeShell(input, {
    refSils: refsOf(input),
    steps: [{ op: "open", fn: () => ({ occ: breached }) }],
  });
  assert.equal(regress.rejected, 1, JSON.stringify(regress.trace[0].closure));
  assert.ok(regress.trace[0].reasons.some((m) => m.startsWith("closure:")), regress.trace[0].reasons.join("; "));
  assert.ok(regress.trace[0].closure.reached > regress.trace[0].closure.inputReached);
});

test("regularizeShell: a plug that would touch a protected region still rejects the step", () => {
  const occ = occupancyFromCells(hollowCells());
  const holed = occupancyFromCells(dropAt(hollowCells(), "2,4,2"));
  const r = regularizeShell(occ, {
    refSils: refsOf(occ),
    iouTolerance: 1, // isolate checks (b)+(c)
    protect: [{ name: "interior", contains: ([x, y, z]) => x > 0 && x < 5 && z > 0 && z < 5 && y > 0 && y < 4 }],
    steps: [{ op: "open", fn: () => ({ occ: holed }) }],
  });
  assert.equal(r.rejected, 1);
  assert.ok(r.trace[0].reasons.some((m) => m.startsWith("protect:")), r.trace[0].reasons.join("; "));
});

test("regularizeShell: a protect-violating step is rejected (defense in depth beyond the ops)", () => {
  const occ = stackBox();
  const noChimney = occupancyFromCells(boxCells(0, 7, 0, 3, 0, 7));
  const stack = protrudingStackRegion(occ);
  const r = regularizeShell(occ, {
    refSils: refsOf(occ),
    iouTolerance: 1, // disarm the IoU check — this test isolates check (c)
    protect: [{ name: "chimney", contains: stack.contains }],
    steps: [{ op: "open", fn: () => ({ occ: noChimney }) }],
  });
  assert.equal(r.rejected, 1);
  assert.ok(r.trace[0].reasons.some((m) => m.startsWith("protect:")), r.trace[0].reasons.join("; "));
});

test("regularizeShell refuses to run without all four gate azimuths — the cage is not optional", () => {
  const occ = occupancyFromCells(boxCells(0, 3, 0, 3, 0, 3));
  assert.throws(() => regularizeShell(occ, {}), /refSils/);
  const partial = voxelSilhouettes(occ, ["+x+z"]);
  assert.throws(() => regularizeShell(occ, { refSils: partial }), /missing gate azimuth/);
});

test("regularizeShell is deterministic: two runs rebuild byte-identical artifacts", () => {
  const template = { schema_version: "1.0.0", metadata: { trial_id: "t" }, style: { name: "s" }, palette: { manifest: ["minecraft:stone"] } };
  const refs = refsOf(occupancyFromCells(boxCells(0, 7, 0, 3, 0, 7)));
  const run = () => {
    const r = regularizeShell(spikyBox(), { refSils: refs });
    return JSON.stringify(rebuildArtifact(r.occ, template));
  };
  assert.equal(run(), run());
});

test("REGULARIZE_DEFAULTS are the declared op parameters (frozen, no subject names anywhere)", () => {
  assert.ok(Object.isFrozen(REGULARIZE_DEFAULTS));
  assert.equal(REGULARIZE_DEFAULTS.radius, 1);
  assert.equal(REGULARIZE_DEFAULTS.minKeep, 9);
  assert.equal(REGULARIZE_DEFAULTS.iouTolerance, 0.02);
});
