import { test } from "node:test";
import assert from "node:assert/strict";
import { occupancyFromCells } from "../view/occupancy.mjs";
import {
  COMPONENT_RECORD_SCHEMA, columnRuns, runCells, fitPlane, heightfield, medianSmooth,
} from "./component-decompose.mjs";

// ---- synthetic shells (shared by the segmentation tests) ---------------------------------------

/** Solid box: x∈[0,w), z∈[0,d), y∈[0,h). */
export function boxCells(w, h, d, { x0 = 0, y0 = 0, z0 = 0, block = "minecraft:stone" } = {}) {
  const out = [];
  for (let x = x0; x < x0 + w; x++) {
    for (let y = y0; y < y0 + h; y++) {
      for (let z = z0; z < z0 + d; z++) out.push({ pos: [x, y, z], block });
    }
  }
  return out;
}

/**
 * Gabled box: walls to y=wallTop, then a symmetric gable ridge along z (height drops 1 per x-step
 * from the center line). 13 wide so the ridge is a single crest column line.
 */
export function gabledBox({ w = 13, d = 9, wallTop = 4 } = {}) {
  const out = boxCells(w, wallTop + 1, d);
  const mid = (w - 1) / 2;
  for (let x = 0; x < w; x++) {
    const top = wallTop + Math.ceil(mid - Math.abs(x - mid));
    for (let y = wallTop + 1; y <= top; y++) {
      for (let z = 0; z < d; z++) out.push({ pos: [x, y, z], block: "minecraft:oak_planks" });
    }
  }
  return out;
}

test("schema id exported", () => {
  assert.equal(COMPONENT_RECORD_SCHEMA, "component-record/v1");
});

test("columnRuns/runCells: round-trip, gaps, duplicates", () => {
  const cells = [[0, 0], [1, 0], [2, 0], [4, 0], [4, 0], [0, 2], [1, 2]];
  const runs = columnRuns(cells);
  assert.deepEqual(runs, [{ z: 0, x0: 0, x1: 2 }, { z: 0, x0: 4, x1: 4 }, { z: 2, x0: 0, x1: 1 }]);
  assert.deepEqual(runCells(runs), [[0, 0], [1, 0], [2, 0], [4, 0], [0, 2], [1, 2]]);
});

test("fitPlane: exact flat and sloped planes, rmse 0", () => {
  const flat = [];
  for (let x = 0; x < 4; x++) for (let z = 0; z < 4; z++) flat.push({ x, z, y: 7 });
  const f = fitPlane(flat);
  assert.deepEqual(f.normal, [0, 1, 0]);
  assert.equal(f.rmse, 0);
  assert.equal(f.degenerate, false);

  const sloped = [];
  for (let x = 0; x < 5; x++) for (let z = 0; z < 3; z++) sloped.push({ x, z, y: 2 * x + 1 });
  const s = fitPlane(sloped);
  assert.deepEqual(s.gradient, [2, 0]);
  assert.equal(s.rmse, 0);
  assert.ok(s.normal[1] > 0, "normal points up");
  // normal ⟂ slope direction: n·(1,2,0) = 0 in (x,y,z) terms
  assert.ok(Math.abs(s.normal[0] * 1 + s.normal[1] * 2) < 1e-6);
});

test("fitPlane: collinear columns are degenerate, horizontal fallback", () => {
  const line = [{ x: 0, z: 0, y: 1 }, { x: 1, z: 0, y: 3 }, { x: 2, z: 0, y: 5 }];
  // x-collinear in z: the z-slope is unconstrained → for safety the whole fit falls back
  const f = fitPlane(line.map((c) => ({ ...c, z: 0 })));
  assert.equal(f.degenerate, true);
  assert.deepEqual(f.gradient, [0, 0]);
  assert.equal(f.point[1], 3); // mean height
});

test("heightfield: top/bottom/count per column", () => {
  const occ = occupancyFromCells(boxCells(3, 4, 2, { y0: 5 }));
  const hf = heightfield(occ);
  assert.equal(hf.h.size, 6);
  assert.equal(hf.h.get("0,0"), 8);
  assert.equal(hf.bottom.get("2,1"), 5);
  assert.equal(hf.count.get("1,0"), 4);
  assert.deepEqual(hf.bbox, { minX: 0, maxX: 2, minZ: 0, maxZ: 1 });
});

test("medianSmooth: kills a single-column spike, preserves a gable crest", () => {
  const cells = boxCells(7, 3, 7);
  cells.push({ pos: [3, 3, 3], block: "minecraft:stone" }, { pos: [3, 4, 3], block: "minecraft:stone" },
    { pos: [3, 5, 3], block: "minecraft:stone" }); // +3 spike at the center column
  const spiked = medianSmooth(heightfield(occupancyFromCells(cells)));
  assert.equal(spiked.h.get("3,3"), 2, "spike flattened to the neighborhood median");
  assert.equal(spiked.raw.get("3,3"), 5, "raw surface is preserved beside the analysis copy");

  const gable = medianSmooth(heightfield(occupancyFromCells(gabledBox())));
  // a 1-wide crest line erodes by exactly one (3 of 9 window values are crest height) — accepted
  // analysis behavior: the crest column lands within plane tolerance of both slope fits
  assert.equal(gable.h.get("6,4"), 4 + 5);
  // mid-slope keeps its step height
  assert.equal(gable.h.get("3,4"), 4 + 3);
});

// ---- segmentMasses ------------------------------------------------------------------------------

import { segmentMasses } from "./component-decompose.mjs";

test("segmentMasses: a single box is one primary mass, no junctions", () => {
  const { masses, columnMass } = segmentMasses(occupancyFromCells(boxCells(8, 4, 6)));
  assert.equal(masses.length, 1);
  assert.equal(masses[0].role, "primary");
  assert.equal(masses[0].plan.area, 48);
  assert.deepEqual(masses[0].yRange, [0, 3]);
  assert.equal(masses[0].volume, 8 * 4 * 6);
  assert.deepEqual(masses[0].junctions, []);
  assert.equal(columnMass.get("0,0"), "mass-0");
});

test("segmentMasses: tower + nave split with a side junction (the church shape)", () => {
  // nave: 20×8 plan, height 6 (y 0..5); tower: 6×6 plan attached at z=8..13, height 14 (y 0..13)
  const cells = [...boxCells(20, 6, 8), ...boxCells(6, 14, 6, { z0: 8 })];
  const { masses } = segmentMasses(occupancyFromCells(cells));
  assert.equal(masses.length, 2);
  const [primary, tower] = masses;
  assert.equal(primary.role, "primary");
  assert.equal(primary.plan.area, 160);
  assert.equal(tower.role, "attached");
  assert.equal(tower.plan.area, 36);
  assert.deepEqual(tower.yRange, [0, 13]);
  // the junction: tower's facing row at z=8, nave's at z=7, overlapping y [0,5]
  const tj = tower.junctions.find((j) => j.withMass === primary.id);
  assert.equal(tj.kind, "side");
  assert.deepEqual(tj.cells, [{ z: 8, x0: 0, x1: 5 }]);
  assert.deepEqual(tj.yRange, [0, 5]);
  const pj = primary.junctions.find((j) => j.withMass === tower.id);
  assert.deepEqual(pj.cells, [{ z: 7, x0: 0, x1: 5 }]);
});

test("segmentMasses: a chimney is a protected protrusion with a base junction (even below ridge height)", () => {
  // 11×9 box, height 4 (y 0..3); 3×3 chimney at x 4..6, z 3..5 rising to y 9
  const cells = boxCells(11, 4, 9);
  for (let x = 4; x <= 6; x++) for (let z = 3; z <= 5; z++) {
    for (let y = 4; y <= 9; y++) cells.push({ pos: [x, y, z], block: "minecraft:bricks" });
  }
  const { masses } = segmentMasses(occupancyFromCells(cells));
  assert.equal(masses.length, 2);
  const chimney = masses.find((m) => m.role === "protrusion");
  assert.ok(chimney, "chimney found");
  assert.equal(chimney.protected, true);
  assert.equal(chimney.plan.area, 9, "median-eroded corners recovered by the raw-height dilation");
  assert.deepEqual(chimney.yRange, [4, 9]);
  assert.equal(chimney.volume, 9 * 6);
  const base = chimney.junctions.find((j) => j.kind === "base");
  assert.equal(base.withMass, masses[0].id);
  assert.deepEqual(base.yRange, [3, 3]);
  // the host's plan excludes the chimney columns
  assert.equal(masses[0].plan.area, 11 * 9 - 9);
});

test("segmentMasses: a continuous gable slope stays one mass (no height-gap split)", () => {
  const { masses } = segmentMasses(occupancyFromCells(gabledBox()));
  assert.equal(masses.length, 1);
  assert.equal(masses[0].role, "primary");
});

test("segmentMasses: single-column voxelization spikes neither split nor protrude", () => {
  const cells = boxCells(10, 3, 10);
  for (const [sx, sz] of [[2, 2], [5, 7], [8, 4]]) {
    for (let y = 3; y <= 8; y++) cells.push({ pos: [sx, y, sz], block: "minecraft:stone" });
  }
  const { masses } = segmentMasses(occupancyFromCells(cells));
  assert.equal(masses.length, 1);
  assert.equal(masses[0].role, "primary");
});

// ---- roofPlanes ---------------------------------------------------------------------------------

import { roofPlanes } from "./component-decompose.mjs";

const planesOf = (cells) => {
  const occ = occupancyFromCells(cells);
  const seg = segmentMasses(occ);
  return { seg, planes: roofPlanes(occ, seg) };
};

test("roofPlanes: a gable is exactly 2 opposing pitched planes with a shared z-ridge", () => {
  const { planes } = planesOf(gabledBox());
  assert.equal(planes.length, 2);
  assert.ok(planes.every((p) => p.kind === "pitched"));
  const [a, b] = planes;
  assert.ok(a.voxelFit.gradient[0] * b.voxelFit.gradient[0] < 0, "opposing x-slopes");
  assert.ok(a.voxelFit.rmse <= 0.5 && b.voxelFit.rmse <= 0.5);
  // ridge: shared, along z, at the crest height (smoothed crest is wallTop+5)
  assert.equal(a.ridge.withPlane, b.id);
  assert.equal(b.ridge.withPlane, a.id);
  assert.equal(a.ridge.axis, "z");
  assert.equal(a.ridge.y, 9);
  // each eave is the full-depth low row on the plane's downhill side
  for (const p of planes) {
    const eave = runCells(p.eave.cells);
    assert.equal(eave.length, 9);
    const ex = new Set(eave.map(([x]) => x));
    assert.equal(ex.size, 1, "eave is a single x row");
    assert.equal([...ex][0], p.eave.dir === "+x" ? 12 : 0);
  }
});

test("roofPlanes: a flat box is one flat plane, perimeter eave, no ridge", () => {
  const { planes } = planesOf(boxCells(10, 5, 8));
  assert.equal(planes.length, 1);
  assert.equal(planes[0].kind, "flat");
  assert.equal(planes[0].ridge, null);
  assert.equal(planes[0].eave.dir, null);
  assert.equal(runCells(planes[0].eave.cells).length, 2 * (10 + 8) - 4);
});

test("roofPlanes: a pyramid is 4 per-face planes; orthogonal faces never ridge-pair", () => {
  const cells = boxCells(13, 3, 13);
  for (let x = 0; x < 13; x++) {
    for (let z = 0; z < 13; z++) {
      const top = 2 + Math.min(x, 12 - x, z, 12 - z) + 1;
      for (let y = 3; y <= top; y++) cells.push({ pos: [x, y, z], block: "minecraft:stone" });
    }
  }
  const { planes } = planesOf(cells);
  assert.equal(planes.length, 4);
  const dirs = planes.map((p) => p.eave.dir).sort();
  assert.deepEqual(dirs, ["+x", "+z", "-x", "-z"].sort(), "one face per direction");
  const byId = new Map(planes.map((p) => [p.id, p]));
  for (const p of planes.filter((p) => p.ridge)) {
    const other = byId.get(p.ridge.withPlane);
    const dot = p.voxelFit.gradient[0] * other.voxelFit.gradient[0] +
      p.voxelFit.gradient[1] * other.voxelFit.gradient[1];
    assert.ok(dot < 0, "ridge partners have opposing gradients");
  }
});

test("roofPlanes: the chimney's columns never pollute the gable fits", () => {
  const cells = gabledBox();
  for (let x = 2; x <= 4; x++) for (let z = 2; z <= 4; z++) {
    for (let y = 8; y <= 13; y++) cells.push({ pos: [x, y, z], block: "minecraft:bricks" });
  }
  const { seg, planes } = planesOf(cells);
  assert.equal(seg.masses.filter((m) => m.role === "protrusion").length, 1);
  assert.equal(planes.length, 2);
  assert.ok(planes.every((p) => p.kind === "pitched" && p.voxelFit.rmse <= 0.5));
  // extent excludes the chimney plan entirely
  const chimney = new Set(runCells(seg.masses.find((m) => m.role === "protrusion").plan.runs)
    .map(([x, z]) => `${x},${z}`));
  for (const p of planes) {
    for (const [x, z] of runCells(p.extent.runs)) assert.ok(!chimney.has(`${x},${z}`));
  }
});

test("roofPlanes: voxelization spikes change nothing (raw vs regularized tolerance)", () => {
  const clean = planesOf(gabledBox()).planes;
  const cells = gabledBox();
  for (const [sx, sz, top] of [[2, 2, 14], [9, 6, 15]]) {
    for (let y = 8; y <= top; y++) cells.push({ pos: [sx, y, sz], block: "minecraft:stone" });
  }
  const spiked = planesOf(cells).planes;
  assert.equal(spiked.length, clean.length);
  for (let i = 0; i < clean.length; i++) {
    assert.deepEqual(spiked[i].voxelFit.gradient, clean[i].voxelFit.gradient);
    assert.equal(spiked[i].extent.area, clean[i].extent.area);
    // the spikes live in rmseRaw, not in the fit
    assert.ok(spiked[i].voxelFit.rmseRaw >= clean[i].voxelFit.rmseRaw);
  }
});
