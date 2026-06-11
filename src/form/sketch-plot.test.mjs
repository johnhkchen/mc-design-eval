// Unit tests for the sketch sheet plotter — pure raster, offline, deterministic.

import { test } from "node:test";
import assert from "node:assert/strict";

import { renderSketchSheet, orthoMask, SHEET_PANEL, SHEET_MARGIN, SHEET_COLORS } from "./sketch-plot.mjs";

// Minimal sketch + cells: a 8×4×6 box, footprint rectangle, mirror applied on x.
function fixture() {
  const occupied = [];
  for (let x = 0; x < 8; x++) for (let y = 0; y < 4; y++) for (let z = 0; z < 6; z++) occupied.push(x, y, z);
  const sketch = {
    substrate: { dims: [8, 4, 6], voxelSize: 1 },
    source: { bounds: { min: [0, 0, 0], max: [8, 4, 6] } },
    footprint: { polygon: [[0, 0], [8, 0], [8, 6], [0, 6]] },
    proportions: { eaveLayer: 2, ridgeLayer: 3 },
    symmetry: { applied: true, axis: "x", offsetCells: 3.5 },
  };
  return { sketch, occupied: Int32Array.from(occupied) };
}

const colorCount = (sheet, color) => {
  let n = 0;
  for (let i = 0; i < sheet.data.length; i += 4) {
    if (sheet.data[i] === color[0] && sheet.data[i + 1] === color[1] && sheet.data[i + 2] === color[2]) n++;
  }
  return n;
};

test("renderSketchSheet: dimensions, panels, and every overlay class present", () => {
  const sheet = renderSketchSheet(fixture());
  assert.equal(sheet.width, 3 * SHEET_PANEL + 4 * SHEET_MARGIN);
  assert.equal(sheet.height, SHEET_PANEL + 2 * SHEET_MARGIN);
  assert.equal(sheet.data.length, sheet.width * sheet.height * 4);
  assert.ok(colorCount(sheet, SHEET_COLORS.cell) > 100, "occupancy cells drawn");
  assert.ok(colorCount(sheet, SHEET_COLORS.footprint) > 50, "footprint polygon drawn");
  assert.ok(colorCount(sheet, SHEET_COLORS.mirror) > 20, "mirror plane drawn");
  assert.ok(colorCount(sheet, SHEET_COLORS.eave) > 50, "eave line drawn");
  assert.ok(colorCount(sheet, SHEET_COLORS.ridge) > 50, "ridge line drawn");
});

test("renderSketchSheet: byte-deterministic; symmetry-off omits the mirror line", () => {
  const a = renderSketchSheet(fixture());
  const b = renderSketchSheet(fixture());
  assert.deepEqual(a.data, b.data);
  const f = fixture();
  f.sketch.symmetry = { applied: false, axis: "x", offsetCells: 3.5 };
  const c = renderSketchSheet(f);
  assert.equal(colorCount(c, SHEET_COLORS.mirror), 0);
});

test("renderSketchSheet: mesh outline overlays in the shared cell frame", () => {
  const f = fixture();
  // one big quad spanning the box's front face → its outline must appear
  const positions = Float64Array.from([
    0, 0, 0, 8, 0, 0, 8, 4, 0,
    0, 0, 0, 8, 4, 0, 0, 4, 6,
  ]);
  const sheet = renderSketchSheet({ ...f, mesh: { positions, triangleCount: 2 } });
  assert.ok(colorCount(sheet, SHEET_COLORS.meshOutline) > 100, "outline pixels present");
});

test("orthoMask: a triangle covers its pixels and only its bbox", () => {
  const positions = Float64Array.from([0, 0, 0, 10, 0, 0, 0, 10, 0]);
  const toPx = (h, v) => [h, v];
  const mask = orthoMask(positions, 1, toPx, 16, { h: 0, v: 1, flipV: false });
  assert.equal(mask[2 * 16 + 2], 1); // well inside the triangle
  assert.equal(mask[12 * 16 + 12], 0); // outside the hypotenuse
  assert.equal(mask[15 * 16 + 15], 0);
});