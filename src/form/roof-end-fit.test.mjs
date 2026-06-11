// Unit tests for roof-end-fit.mjs (T-108-01, story S-108, epic E-28) — synthetic meshes/gables
// only; the cottage/gatehouse evidence runs live in the runner (benchmarks/sculpture/roof-program.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "../view/occupancy.mjs";
import { gableEndsVariant } from "./roof-fit.mjs";
import { END_FIT_DEFAULTS, alignedTriangles, fitGableEnds } from "./roof-end-fit.mjs";

/** Identity alignment — test meshes are authored directly in voxel space. */
const IDENTITY = { mode: "test-identity", scales: [1, 1, 1], toVoxel: (p) => [...p] };

/** A quad as two triangles (counter-clockwise as given); returns 18 floats. */
function quad(p0, p1, p2, p3) {
  return [...p0, ...p1, ...p2, ...p0, ...p2, ...p3];
}

function meshOf(...quadFloats) {
  const positions = Float64Array.from(quadFloats.flat());
  return { positions, triangleCount: positions.length / 9 };
}

/**
 * The synthetic end-fit scene (z-axis ridge): wall storey x −4..4 × z 0..5 × y 6..9 with one
 * residue cell poking to z=7; gable record footprint z −2..7 (the blob's extent overruns BOTH
 * walls, as voxelization spread does), ridge y 14, eaves y 10 → bandFloor 10, wall window y ∈ [6, 10).
 */
function gableOf(mut = (g) => g) {
  return mut({
    id: "gable-roof-0-roof-1",
    ridge: { axis: "z", y: 14 },
    sides: [
      { planeId: "roof-0", eaveDir: "+x", eaveY: 10, pitch: 1 },
      { planeId: "roof-1", eaveDir: "-x", eaveY: 10, pitch: 1 },
    ],
    footprint: { cols: new Set(), bbox: { minX: -4, maxX: 4, minZ: -2, maxZ: 7 }, area: 90 },
    hip: { demanded: false },
    sane: true,
    reasons: [],
  });
}

function occOf() {
  const cells = [];
  for (let x = -4; x <= 4; x++) for (let z = 0; z <= 5; z++) for (let y = 6; y <= 9; y++) {
    cells.push({ pos: [x, y, z], block: "stone" });
  }
  cells.push({ pos: [0, 8, 7], block: "stone" }); // blob residue past the wall — median ignores it
  return occupancyFromCells(cells);
}

/** Quads for the +z end: wall face at z=5.5, band gable face at z=5.5, roof sheet tip at 5.5+overhang. */
function hiEndQuads(overhang) {
  return [
    quad([-4.5, 5.5, 5.5], [4.5, 5.5, 5.5], [4.5, 9.5, 5.5], [-4.5, 9.5, 5.5]),     // wall plane
    quad([-4.5, 10, 5.5], [4.5, 10, 5.5], [0.5, 13.5, 5.5], [-0.5, 13.5, 5.5]),     // gable face (band)
    quad([-4.5, 11.5, 3.6], [4.5, 11.5, 3.6], [4.5, 11.5, 5.5 + overhang], [-4.5, 11.5, 5.5 + overhang]), // roof sheet
  ];
}

/** Mirrored quads for the −z end (wall face at z=−0.5, sheet tip at −0.5−overhang). */
function loEndQuads(overhang) {
  return [
    quad([-4.5, 5.5, -0.5], [4.5, 5.5, -0.5], [4.5, 9.5, -0.5], [-4.5, 9.5, -0.5]),
    quad([-4.5, 10, -0.5], [4.5, 10, -0.5], [0.5, 13.5, -0.5], [-0.5, 13.5, -0.5]),
    quad([-4.5, 11.5, 3.4], [4.5, 11.5, 3.4], [4.5, 11.5, -0.5 - overhang], [-4.5, 11.5, -0.5 - overhang]),
  ];
}

test("alignedTriangles transforms vertices and recomputes normals/areas in voxel space", () => {
  const mesh = meshOf(quad([0, 0, 0], [2, 0, 0], [2, 2, 0], [0, 2, 0]));
  const half = { ...IDENTITY, toVoxel: (p) => [p[0] / 2, p[1] / 2, p[2]] };
  const tris = alignedTriangles(mesh, half);
  assert.equal(tris.length, 2);
  assert.deepEqual(tris[0].normal.map(Math.abs), [0, 0, 1]);
  assert.ok(Math.abs(tris[0].area + tris[1].area - 1) < 1e-9); // 2×2 quad halved per axis → area 1
});

test("clean gable end: face anchored to the as-built wall, verge overhang from the GLB differential", () => {
  const { gables, findings } = fitGableEnds([gableOf()], occOf(), meshOf(...hiEndQuads(1), ...loEndQuads(1)), IDENTITY);
  const { ends } = gables[0];
  assert.equal(findings.length, 0);
  assert.deepEqual(
    [ends.hi.faceCoord, ends.hi.coord, ends.hi.overhang, ends.hi.source],
    [5, 6, 1, "glb"]);
  assert.deepEqual([ends.lo.faceCoord, ends.lo.coord, ends.lo.overhang], [0, -1, 1]);
  assert.ok(ends.hi.glb.faceRmse < 0.1, `flat face fits tightly, got ${ends.hi.glb.faceRmse}`);
  assert.equal(ends.hi.anchor.wall, 5); // the residue cell at z=7 did not move the median
  assert.equal(ends.hi.asBuiltEnd, 7);
});

test("deeper verge: a 2-cell GLB overhang lands 2 cells past the fitted face", () => {
  const { gables } = fitGableEnds([gableOf()], occOf(), meshOf(...hiEndQuads(2), ...loEndQuads(1)), IDENTITY);
  assert.deepEqual([gables[0].ends.hi.faceCoord, gables[0].ends.hi.coord, gables[0].ends.hi.overhang], [5, 7, 2]);
});

test("fitted tip outside the as-built footprint is insane — named, end not fitted", () => {
  const { gables, findings } = fitGableEnds([gableOf()], occOf(), meshOf(...hiEndQuads(3), ...loEndQuads(1)), IDENTITY);
  assert.equal(gables[0].ends.hi, null);
  const f = findings.find((x) => x.code === "end-fit-insane" && x.where === "gable-roof-0-roof-1:+z");
  assert.ok(f, "insane end named");
  assert.match(f.detail, /outside the as-built footprint end 7/);
  assert.notEqual(gables[0].ends.lo, null); // the other end still fits
});

test("no below-band wall triangles: differential anchorless — named, end not fitted", () => {
  const noWall = meshOf(...hiEndQuads(1).slice(1), ...loEndQuads(1)); // drop the hi wall quad
  const { gables, findings } = fitGableEnds([gableOf()], occOf(), noWall, IDENTITY);
  assert.equal(gables[0].ends.hi, null);
  assert.ok(findings.some((x) => x.code === "end-unfitted" && x.where.endsWith(":+z") && /wall triangles below the band/.test(x.detail)));
});

test("no band face triangles in the cone: named, end not fitted", () => {
  const sheetOnly = meshOf(hiEndQuads(1)[0], hiEndQuads(1)[2], ...loEndQuads(1));
  const { gables, findings } = fitGableEnds([gableOf()], occOf(), sheetOnly, IDENTITY);
  assert.equal(gables[0].ends.hi, null);
  assert.ok(findings.some((x) => x.code === "end-unfitted" && x.where.endsWith(":+z") && /roof band/.test(x.detail)));
});

test("hip-demanded ends are not fitted; the suppressed variant is", () => {
  const hip = gableOf((g) => ({ ...g, hip: { demanded: true, lo: true, hi: true } }));
  const mesh = meshOf(...hiEndQuads(1), ...loEndQuads(1));
  const occ = occOf();
  const a = fitGableEnds([hip], occ, mesh, IDENTITY);
  assert.deepEqual(a.gables[0].ends, { lo: null, hi: null });
  assert.equal(a.findings.filter((f) => f.code === "end-hip").length, 2);
  const b = fitGableEnds(gableEndsVariant([hip]), occ, mesh, IDENTITY);
  assert.notEqual(b.gables[0].ends.hi, null);
  assert.equal(b.gables[0].hip.suppressed, true);
});

test("insane gables pass through untouched; inputs are never mutated", () => {
  const insane = gableOf((g) => ({ ...g, sane: false, reasons: ["test"] }));
  const sane = gableOf();
  const { gables } = fitGableEnds([insane, sane], occOf(), meshOf(...hiEndQuads(1), ...loEndQuads(1)), IDENTITY);
  assert.equal(gables[0], insane);          // same reference, no ends attached
  assert.equal(sane.ends, undefined);       // input object untouched
  assert.notEqual(gables[1].ends.hi, null); // output carries the fit
});

test("declared defaults are frozen and named", () => {
  assert.equal(END_FIT_DEFAULTS.faceAngleDeg, 25);
  assert.ok(Object.isFrozen(END_FIT_DEFAULTS));
});
