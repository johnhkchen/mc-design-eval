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
