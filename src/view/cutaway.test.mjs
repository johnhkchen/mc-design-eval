// Tests for the render-only cutaway core (T-083-01). Synthetic occupancy — no GL, no model. Pins: planar
// removal exactness, the round-trip with carveArtifact/carveOccupancy (a section is a faithful clip), and
// the roof/front-half conveniences from a structural read.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { occupancyFromCells } from "./occupancy.mjs";
import { carveOccupancy, carveArtifact } from "./hollow-carve.mjs";
import { storeyBands } from "./structural-read.mjs";
import { sectionKeys, roofCut, frontHalfCut } from "./cutaway.mjs";

/** Solid box [0..s-1]^3. */
function solidBoxCells(s, block = "minecraft:stone") {
  const cells = [];
  for (let x = 0; x < s; x++) for (let y = 0; y < s; y++) for (let z = 0; z < s; z++) cells.push({ pos: [x, y, z], block });
  return cells;
}
const artifactOf = (cells) => ({ schema_version: "1.0.0", placements: cells.map((c) => ({ op: "voxel", pos: c.pos, block: c.block })) });

// ----------------------------------------------------------------------------------------------------
// sectionKeys — planar removal exactness
// ----------------------------------------------------------------------------------------------------

test("sectionKeys: side:above removes exactly the cells with coord >= at", () => {
  const occ = occupancyFromCells(solidBoxCells(4)); // y 0..3
  const rm = sectionKeys(occ, { axis: "y", at: 2, side: "above" });
  for (const k of rm) assert.ok(Number(k.split(",")[1]) >= 2, `${k} should be y>=2`);
  // 4×4 footprint × 2 layers (y=2,3) = 32 removed
  assert.equal(rm.size, 32);
});

test("sectionKeys: side:below removes exactly the cells with coord < at", () => {
  const occ = occupancyFromCells(solidBoxCells(4));
  const rm = sectionKeys(occ, { axis: "z", at: 1, side: "below" });
  for (const k of rm) assert.ok(Number(k.split(",")[2]) < 1, `${k} should be z<1`);
  assert.equal(rm.size, 16); // one z-layer
});

test("sectionKeys: the kept complement is everything not removed (partition)", () => {
  const occ = occupancyFromCells(solidBoxCells(5));
  const rm = sectionKeys(occ, { axis: "x", at: 3, side: "above" });
  const kept = carveOccupancy(occ, rm);
  assert.equal(kept.size + rm.size, occ.size);
  for (const k of kept.cells.keys()) assert.ok(!rm.has(k));
});

test("sectionKeys: a plane past the max removes all (or none) — boundary safe", () => {
  const occ = occupancyFromCells(solidBoxCells(3)); // 0..2
  assert.equal(sectionKeys(occ, { axis: "y", at: 99, side: "above" }).size, 0);
  assert.equal(sectionKeys(occ, { axis: "y", at: -99, side: "above" }).size, occ.size);
  assert.equal(sectionKeys(occ, { axis: "y", at: 99, side: "below" }).size, occ.size);
});

test("sectionKeys: empty occupancy → empty set; bad axis/side/at throw", () => {
  const empty = occupancyFromCells([]);
  assert.equal(sectionKeys(empty, { axis: "y", at: 0 }).size, 0);
  const occ = occupancyFromCells(solidBoxCells(2));
  assert.throws(() => sectionKeys(occ, { axis: "w", at: 0 }), /axis must be/);
  assert.throws(() => sectionKeys(occ, { axis: "y", at: NaN }), /at must be/);
  assert.throws(() => sectionKeys(occ, { axis: "y", at: 0, side: "left" }), /side must be/);
});

// ----------------------------------------------------------------------------------------------------
// round-trip — a section is a faithful clip of the build (composes with carveArtifact)
// ----------------------------------------------------------------------------------------------------

test("round-trip: carveArtifact(artifact, sectionKeys) == occ minus the section set", () => {
  const cells = solidBoxCells(4);
  const occ = occupancyFromCells(cells);
  const rm = sectionKeys(occ, { axis: "z", at: 2, side: "above" });
  const sectioned = carveArtifact(artifactOf(cells), rm);
  // every placement of the section is a kept (not-removed) cell
  assert.equal(sectioned.placements.length, occ.size - rm.size);
  for (const p of sectioned.placements) {
    assert.ok(!rm.has(p.pos.join(",")), `section kept a removed cell ${p.pos}`);
    assert.equal(p.op, "voxel"); // flatten-by-exclusion, no air op
  }
});

// ----------------------------------------------------------------------------------------------------
// roofCut / frontHalfCut — the conveniences
// ----------------------------------------------------------------------------------------------------

/** A two-storey shelled box: solid floor slabs at y=0 and y=4, a perimeter wall between, a roof cap at y=8. */
function twoStoreyCells() {
  const cells = [];
  const S = 6;
  const slab = (y) => { for (let x = 0; x < S; x++) for (let z = 0; z < S; z++) cells.push({ pos: [x, y, z], block: "minecraft:oak_planks" }); };
  const wallRing = (y) => {
    for (let x = 0; x < S; x++) for (let z = 0; z < S; z++) {
      if (x === 0 || x === S - 1 || z === 0 || z === S - 1) cells.push({ pos: [x, y, z], block: "minecraft:stone" });
    }
  };
  slab(0); slab(4); slab(8); // floor, mid-floor, roof slabs (fill ≥ 0.6 → floor lines)
  for (let y = 1; y <= 3; y++) wallRing(y);
  for (let y = 5; y <= 7; y++) wallRing(y);
  return cells;
}

test("roofCut: removes everything at/above the top floor line (reveals the storeys below from above)", () => {
  const occ = occupancyFromCells(twoStoreyCells());
  const read = { storeyBands: storeyBands(occ) };
  assert.ok(read.storeyBands.floorLines.length >= 2, "fixture should read multiple floor lines");
  const top = read.storeyBands.floorLines[read.storeyBands.floorLines.length - 1];
  const rm = roofCut(occ, read);
  for (const k of rm) assert.ok(Number(k.split(",")[1]) >= top, `${k} should be y>=${top}`);
  const kept = carveOccupancy(occ, rm);
  // nothing kept above the cut, something kept below (the lower storey + its grid survive)
  for (const k of kept.cells.keys()) assert.ok(Number(k.split(",")[1]) < top);
  assert.ok(kept.size > 0);
});

test("roofCut: single-storey fallback drops the top third (still reveals interior)", () => {
  const occ = occupancyFromCells(solidBoxCells(9)); // one floor line at most; height 9
  const read = { storeyBands: { floorLines: [] } };
  const rm = roofCut(occ, read);
  assert.ok(rm.size > 0 && rm.size < occ.size, "should remove some but not all");
});

test("frontHalfCut: removes the front (z >= mid) half, keeps the back", () => {
  const occ = occupancyFromCells(solidBoxCells(6)); // z 0..5, mid → keep back half incl mid plane
  const rm = frontHalfCut(occ);
  const kept = carveOccupancy(occ, rm);
  assert.ok(rm.size > 0 && kept.size > 0);
  // the highest kept z is below the lowest removed z (a clean planar split)
  let maxKeptZ = -Infinity, minRmZ = Infinity;
  for (const k of kept.cells.keys()) maxKeptZ = Math.max(maxKeptZ, Number(k.split(",")[2]));
  for (const k of rm) minRmZ = Math.min(minRmZ, Number(k.split(",")[2]));
  assert.ok(maxKeptZ < minRmZ, "kept back half must sit behind the removed front half");
});

test("frontHalfCut: empty occupancy → empty set", () => {
  assert.equal(frontHalfCut(occupancyFromCells([])).size, 0);
});

// ----------------------------------------------------------------------------------------------------
// purity — no model / GL / API-key / Date / random import (mirrors hollow-carve.test.mjs)
// ----------------------------------------------------------------------------------------------------

test("source guard: cutaway.mjs is pure (no GL/model/API-key/Date/random)", () => {
  const src = readFileSync(fileURLToPath(new URL("./cutaway.mjs", import.meta.url)), "utf8");
  assert.ok(!/ANTHROPIC_API_KEY/.test(src), "no API key");
  assert.ok(!/sdk-binding|model-tier|requestText/.test(src), "no model import");
  assert.ok(!/render-tool|prismarine|playwright|gl\b/.test(src), "no GL import");
  assert.ok(!/Date\.now|Math\.random|new Date\(/.test(src), "no Date/random");
});
