// Pure unit tests for the E-20 high-res building build scale selector (T-068-01). No GL, no I/O — the
// durable AC#1 contract ("a couple of scales tried, the best-reading kept, recorded which + why").

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  BUILDING_BUILD_SCHEMA,
  AXES,
  buildingRow,
  pickBestScale,
  assembleBuildingBuild,
} from "./building-build.mjs";

test("schema + axes are stable", () => {
  assert.equal(BUILDING_BUILD_SCHEMA, "building-build/v1");
  assert.equal(AXES.formIoU, "up");
  assert.equal(AXES.speckle, "down");
  assert.equal(AXES.largestFraction, "up");
});

test("buildingRow: pass-through with guards; missing fields → null", () => {
  const r = buildingRow({ scale: 48, blocks: 5012, formIoU: 0.7123, speckle: 0.012, distinct: 4, offPalette: 0, valueDeltaE: 9.811, largestFraction: 1.0 });
  assert.equal(r.scale, 48);
  assert.equal(r.blocks, 5012);
  assert.equal(r.formIoU, 0.712);
  assert.equal(r.valueDeltaE, 9.81);
  assert.equal(r.distinct, 4);
  const empty = buildingRow({ scale: 64 });
  assert.equal(empty.formIoU, null);
  assert.equal(empty.blocks, null);
});

test("pickBestScale: clear winner (highest form IoU)", () => {
  const p = pickBestScale([buildingRow({ scale: 48, formIoU: 0.68 }), buildingRow({ scale: 64, formIoU: 0.74 }), buildingRow({ scale: 96, formIoU: 0.71 })]);
  assert.equal(p.scale, 64);
  assert.equal(p.tieBreak, false);
  assert.match(p.reason, /highest form IoU/);
  assert.deepEqual(p.ranked.map((r) => r.scale), [64, 96, 48]);
});

test("pickBestScale: tie within eps → keep the LOWER scale (best-reading, not biggest)", () => {
  const p = pickBestScale([buildingRow({ scale: 48, formIoU: 0.735 }), buildingRow({ scale: 64, formIoU: 0.74 })], { iouEps: 0.01 });
  assert.equal(p.scale, 48); // within 0.01 of 64's 0.74 → lower scale kept
  assert.equal(p.tieBreak, true);
  assert.match(p.reason, /lower scale is kept/);
});

test("pickBestScale: NON-monotonic — 48 reads best though 96 has more blocks", () => {
  const p = pickBestScale([buildingRow({ scale: 48, formIoU: 0.72, blocks: 5000 }), buildingRow({ scale: 96, formIoU: 0.61, blocks: 30000 })]);
  assert.equal(p.scale, 48);
  assert.match(p.reason, /non-monotonic/);
});

test("pickBestScale: null formIoU rows rank last; all-null graceful; empty → no scales", () => {
  const p = pickBestScale([buildingRow({ scale: 48, formIoU: null }), buildingRow({ scale: 64, formIoU: 0.7 })]);
  assert.equal(p.scale, 64);
  const allNull = pickBestScale([buildingRow({ scale: 48 }), buildingRow({ scale: 64 })]);
  assert.equal(allNull.scale, 48); // tie on -Infinity IoU → lower scale
  assert.equal(pickBestScale([]).scale, null);
});

test("assembleBuildingBuild: table + chosen line + non-monotonicity note; chosen marked", () => {
  const rows = [
    { scale: 48, blocks: 5012, formIoU: 0.72, speckle: 0.01, distinct: 4, offPalette: 0, valueDeltaE: 9.8, strayCount: 0, largestFraction: 1.0 },
    { scale: 64, blocks: 11890, formIoU: 0.69, speckle: 0.02, distinct: 5, offPalette: 0, valueDeltaE: 10.2, strayCount: 0, largestFraction: 1.0 },
  ];
  const { md, json } = assembleBuildingBuild({ rows });
  assert.equal(json.schema, "building-build/v1");
  assert.equal(json.chosen.scale, 48);
  assert.deepEqual(json.scalesTried, [48, 64]);
  assert.equal(json.clean.offPaletteZero, true);
  assert.equal(json.clean.speckleOk, true);
  assert.equal(json.clean.singleMass, true);
  assert.match(md, /High-res building build/);
  assert.match(md, /Chosen scale/);
  assert.match(md, /48 ✓/); // chosen scale marked in the table
  assert.match(md, /non-monotonic/);
});

test("assembleBuildingBuild: empty rows degenerate-but-valid; throws on non-array", () => {
  const { md, json } = assembleBuildingBuild({ rows: [] });
  assert.equal(json.rows.length, 0);
  assert.equal(json.chosen.scale, null);
  assert.match(md, /Scales tried: —/);
  assert.throws(() => assembleBuildingBuild({ rows: "nope" }));
});

test("assembleBuildingBuild: flags an unclean chosen build honestly", () => {
  const rows = [{ scale: 96, blocks: 30000, formIoU: 0.7, speckle: 0.09, distinct: 6, offPalette: 12, valueDeltaE: 14, strayCount: 3, largestFraction: 0.8 }];
  const { json } = assembleBuildingBuild({ rows });
  assert.equal(json.clean.offPaletteZero, false);
  assert.equal(json.clean.speckleOk, false);
  assert.equal(json.clean.singleMass, false);
});
