// Tests for the roof-region diff instrument (T-118-01, story S-118, epic E-30).
//
// All synthetic — hand-built gables, tiny occupancies, hand-made masks, minimal triangle sheets.
// No fixtures, no fs, no GL (the module is pure; the suite must stay byte-deterministic).
//   A roofRegions       — partition, precedence, fitted vs unfitted ends, fallback, guards
//   B attributeMismatch — partition invariant, nearest-region assignment, empty inputs
//   C heightProfiles    — exact sampled heights, raw vs eave-relative anchoring, uncovered
//   D roofRegionDiff    — end-to-end semantics (a raised ridge reads as ridge mismatch), determinism

import test from "node:test";
import assert from "node:assert/strict";
import { occupancyFromCells } from "./occupancy.mjs";
import { MULTI_ANGLE_GATE } from "../config.mjs";
import { voxelSilhouettes } from "./shell-regularize.mjs";
import { gableSurfaceHeight } from "../form/roof-fit.mjs";
import {
  ROOF_DIFF_SCHEMA,
  ROOF_DIFF_DEFAULTS,
  roofRegions,
  projectRegions,
  attributeMismatch,
  heightProfiles,
  roofRegionDiff,
} from "./roof-region-diff.mjs";

// --- synthetic fixtures ------------------------------------------------------

/** A symmetric x-ridge gable: ridge y 8 at z=0, eaves y 5 at z=±3, pitch 1, footprint 5×7. */
function makeGable(overrides = {}) {
  const cols = new Set();
  for (let x = -2; x <= 2; x++) for (let z = -3; z <= 3; z++) cols.add(`${x},${z}`);
  return {
    id: "gable-test",
    ridge: { axis: "x", y: 8 },
    sides: [
      { planeId: "roof-a", eaveDir: "+z", pitch: 1, eaveY: 5, eaveEdge: 3 },
      { planeId: "roof-b", eaveDir: "-z", pitch: 1, eaveY: 5, eaveEdge: -3 },
    ],
    footprint: { cols, bbox: { minX: -2, maxX: 2, minZ: -3, maxZ: 3 }, area: cols.size },
    hip: { lo: false, hi: false, demanded: false },
    ...overrides,
  };
}

/** Realize the gable as a solid occupancy: every footprint column filled to its surface height.
 *  `wideRidge` raises the z=±1 shoulder columns to the ridge height — a roof-band difference that
 *  PRESERVES the overall bbox (the bbox-crop normalization is scale-invariant, so only
 *  bbox-preserving differences localize on the grid; a taller ridge rescales everything). */
function makeOcc(gable, { wideRidge = false } = {}) {
  const cells = [];
  for (const k of gable.footprint.cols) {
    const [x, z] = k.split(",").map(Number);
    let top = Math.floor(gableSurfaceHeight(gable, x, z));
    if (wideRidge && Math.abs(z) === 1) top = gable.ridge.y;
    for (let y = 0; y <= top; y++) cells.push({ pos: [x, y, z], block: "stone" });
  }
  return occupancyFromCells(cells);
}

/** Two triangles forming the plane y = x + 10 over x∈[-3,4], z∈[-4,4] (only verts are read). */
const slopedSheet = () => {
  const y = (x) => x + 10;
  return [
    { verts: [[-3, y(-3), -4], [4, y(4), -4], [4, y(4), 4]] },
    { verts: [[-3, y(-3), -4], [4, y(4), 4], [-3, y(-3), 4]] },
  ];
};

/** Hand-made mask with a full-frame bbox (corner pins) so grid-8 normalization is the identity. */
function pinnedMask(fill) {
  const w = 8, h = 8;
  const data = new Uint8Array(w * h);
  data[0] = 1; // (0,0) pin
  data[w * h - 1] = 1; // (7,7) pin
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (fill(x, y)) data[y * w + x] = 1;
  let fgCount = 0;
  for (const v of data) if (v) fgCount++;
  return { w, h, data, fgCount, bbox: { x0: 0, y0: 0, x1: 8, y1: 8 } };
}

// --- Group A: roofRegions ----------------------------------------------------

test("A1 partition: every footprint column gets exactly one region, counts add up", () => {
  const g = makeGable();
  const r = roofRegions([g], makeOcc(g));
  assert.equal(r.assign.size, g.footprint.cols.size);
  const total = Object.values(r.counts).reduce((s, n) => s + n, 0);
  assert.equal(total, g.footprint.cols.size);
  assert.equal(r.fallback, null);
});

test("A2 precedence: ridge beats ends at the corner column; ends beat eaves", () => {
  const g = makeGable();
  const r = roofRegions([g], makeOcc(g));
  assert.equal(r.assign.get("2,0"), "ridge"); // ridge column at the end of the gable
  assert.equal(r.assign.get("2,3"), "ends"); // end column at the eave edge
  assert.equal(r.assign.get("0,3"), "eaves"); // eave strip away from the ends
  assert.equal(r.assign.get("0,1"), "slopes");
  assert.deepEqual(r.counts, { ridge: 5, ends: 12, eaves: 6, slopes: 12 });
});

test("A3 fitted ends widen to the face plane (faceCoord), unfitted stay a 1-column band", () => {
  const g = makeGable({ ends: { lo: { faceCoord: -1 }, hi: { faceCoord: 1 } } });
  const r = roofRegions([g], makeOcc(g));
  // along ≤ −1 and ≥ 1 → x ∈ {−2,−1,1,2}: 4 column-lines of 7, minus 4 ridge cells
  assert.equal(r.counts.ends, 4 * 7 - 4);
});

test("A4 bandFloor defaults to the lowest eave; explicit override wins", () => {
  const g = makeGable();
  assert.equal(roofRegions([g], makeOcc(g)).bandFloor, 5);
  assert.equal(roofRegions([g], makeOcc(g), { bandFloor: 3 }).bandFloor, 3);
});

test("A5 fallback: no gables → whole roof band unpartitioned, reason named", () => {
  const g = makeGable();
  const r = roofRegions([], makeOcc(g), { bandFloor: 5 });
  assert.equal(r.fallback.region, "unpartitioned");
  assert.ok(r.counts.unpartitioned > 0);
  for (const v of r.assign.values()) assert.equal(v, "unpartitioned");
});

test("A6 no gables and no bandFloor throws (caller error, not a silent guess)", () => {
  const g = makeGable();
  assert.throws(() => roofRegions([], makeOcc(g)), /bandFloor/);
});

// --- Group B: attributeMismatch ------------------------------------------------

test("B1 partition invariant: extra+missing === Σ byRegion + unattributed", () => {
  const build = pinnedMask((x, y) => x >= 2 && x < 6 && y >= 3 && y < 7);
  const ref = pinnedMask((x, y) => x >= 2 && x < 6 && y >= 1 && y < 7);
  const points = [
    { region: "ridge", sx: 3.5, sy: 3.2 },
    { region: "wall", sx: 3.5, sy: 6.5 },
  ];
  const r = attributeMismatch({ buildSil: build, refSil: ref, points, grid: 8 });
  const attributed = Object.values(r.byRegion).reduce((s, c) => s + c.extra + c.missing, 0);
  assert.equal(r.mismatchPx, r.extra + r.missing);
  assert.equal(r.mismatchPx, attributed + r.unattributed);
  assert.equal(r.unattributed, 0);
});

test("B2 nearest assignment: missing rows above the build land on the ridge point, not the wall", () => {
  const build = pinnedMask((x, y) => x >= 2 && x < 6 && y >= 3 && y < 7);
  const ref = pinnedMask((x, y) => x >= 2 && x < 6 && y >= 1 && y < 7);
  const points = [
    { region: "ridge", sx: 3.5, sy: 3.2 },
    { region: "wall", sx: 3.5, sy: 6.5 },
  ];
  const r = attributeMismatch({ buildSil: build, refSil: ref, points, grid: 8 });
  assert.equal(r.byRegion.ridge.missing, 8); // 2 missing rows × 4 cols above the build top
  assert.equal(r.byRegion.ridge.extra, 0);
  assert.ok(!r.byRegion.wall || r.byRegion.wall.missing === 0);
});

test("B3 identical masks → iou 1, zero mismatch, empty byRegion", () => {
  const m = pinnedMask((x, y) => x >= 2 && x < 6 && y >= 2 && y < 6);
  const r = attributeMismatch({ buildSil: m, refSil: m, points: [], grid: 8 });
  assert.equal(r.iou, 1);
  assert.equal(r.mismatchPx, 0);
  assert.deepEqual(r.byRegion, {});
});

test("B4 no points → mismatch counted but unattributed (never silently dropped)", () => {
  const build = pinnedMask((x, y) => x >= 2 && x < 6 && y >= 3 && y < 7);
  const ref = pinnedMask((x, y) => x >= 2 && x < 6 && y >= 1 && y < 7);
  const r = attributeMismatch({ buildSil: build, refSil: ref, points: [], grid: 8 });
  assert.ok(r.mismatchPx > 0);
  assert.equal(r.unattributed, r.mismatchPx);
});

// --- Group C: heightProfiles ---------------------------------------------------

test("C1 sampled GLB heights are exact on a sloped sheet; profiles sorted by coordinate", () => {
  const g = makeGable();
  const occ = makeOcc(g);
  const r = heightProfiles({ gable: g, tops: roofRegions([g], occ).tops, aTris: slopedSheet() });
  // plane y = x + 10 sampled at column centers: glb(x) = x + 10.5, ridge profile groups by x
  for (const e of r.ridge.profile) assert.equal(e.glb, e.v + 10.5);
  const vs = r.ridge.profile.map((e) => e.v);
  assert.deepEqual(vs, [...vs].sort((a, b) => a - b));
  assert.equal(r.ridge.stats.uncovered, 0);
});

test("C2 eave anchors: build = mean recorded eaveY; glb = median over eave-edge samples", () => {
  const g = makeGable();
  const occ = makeOcc(g);
  const r = heightProfiles({ gable: g, tops: roofRegions([g], occ).tops, aTris: slopedSheet() });
  assert.equal(r.anchors.buildEave, 5);
  // eave strips z=±3, x∈[−2..2] → glb = x+10.5 per column, 5 samples per side, median 10.5 each
  assert.equal(r.anchors.glbEave, 10.5);
  assert.deepEqual(r.anchors.perSide.map((s) => ({ samples: s.samples, median: s.median })),
    [{ samples: 5, median: 10.5 }, { samples: 5, median: 10.5 }]);
  assert.deepEqual(r.anchors.dropped, []);
});

test("C2b asymmetric eaves with one-sided sampling: like-for-like anchors, no phantom offset", () => {
  // Two sides with DIFFERENT eaves (build 4 and 8); the GLB sheet covers only side A's eave
  // strip. The old pooled-median paired build mean (4+8)/2=6 with side-A-only glb samples —
  // a phantom −2 offset on every eave-relative delta. Like-for-like drops side B from BOTH.
  const g = makeGable();
  g.sides[0].eaveY = 8; // +z side: eave strip z=+3 — NOT covered by the half sheet below
  g.sides[1].eaveY = 4; // −z side: eave strip z=−3 — sampled
  const occ = makeOcc(g);
  // flat sheet y=12 covering only the z≤0 half (side B's eave strip; side A unsampled)
  const half = [
    { verts: [[-3, 12, -4], [4, 12, -4], [4, 12, 0]] },
    { verts: [[-3, 12, -4], [4, 12, 0], [-3, 12, 0]] },
  ];
  const r = heightProfiles({ gable: g, tops: roofRegions([g], occ).tops, aTris: half });
  assert.equal(r.anchors.buildEave, 4); // the sampled side only — NOT the (8+4)/2=6 declared mean
  assert.equal(r.anchors.glbEave, 12);
  assert.deepEqual(r.anchors.dropped, ["roof-a"]);
  // per-x column max tops out at 8 (z=+1: min of ridge cap 8 / sideA 10 / sideB 8), glb flat 12:
  // the build rises 4 above ITS eave anchor, the GLB 0 above ITS OWN → delta +4. The old pooled
  // anchors (buildEave (8+4)/2 = 6) would have read +2 — a phantom −2 from pairing a two-side
  // declared mean with one-side samples.
  for (const e of r.ridge.profile) {
    assert.equal(e.build, 8);
    assert.equal(e.glb, 12);
    assert.equal(e.delta, 4);
  }
});

test("C3 eave-relative delta anchors each side to its own eave (constant glb offset cancels)", () => {
  const g = makeGable();
  const occ = makeOcc(g);
  const r = heightProfiles({ gable: g, tops: roofRegions([g], occ).tops, aTris: slopedSheet() });
  // build rise at ridge: 8−5 = 3; glb rise at x: (x+10.5)−10.5 = x → eaveRel = 3 − x
  for (const e of r.ridge.profile) assert.equal(e.delta, 3 - e.v);
});

test("C4 columns the sheet does not cover are uncovered, excluded from rmse, still counted", () => {
  const g = makeGable();
  const occ = makeOcc(g);
  // sheet covering only z<0 half: x∈[-3,4], z∈[-4,0]
  const half = [
    { verts: [[-3, 1, -4], [4, 1, -4], [4, 1, 0]] },
    { verts: [[-3, 1, -4], [4, 1, 0], [-3, 1, 0]] },
  ];
  const r = heightProfiles({ gable: g, tops: roofRegions([g], occ).tops, aTris: half });
  const lo = r.rakes.find((k) => k.end === "lo");
  assert.ok(lo.stats.uncovered > 0);
  assert.ok(lo.stats.count + lo.stats.uncovered === lo.profile.length);
});

test("C5 rakes: unfitted ends profile at the footprint extreme; fitted at faceCoord", () => {
  const g = makeGable();
  const occ = makeOcc(g);
  const r = heightProfiles({ gable: g, tops: roofRegions([g], occ).tops, aTris: slopedSheet() });
  assert.deepEqual(r.rakes.map((k) => [k.end, k.at, k.fitted]), [["lo", -2, false], ["hi", 2, false]]);
  const gf = makeGable({ ends: { lo: { faceCoord: -1 }, hi: { faceCoord: 2 } } });
  const rf = heightProfiles({ gable: gf, tops: roofRegions([gf], occ).tops, aTris: slopedSheet() });
  assert.deepEqual(rf.rakes.map((k) => [k.end, k.at, k.fitted]), [["lo", -1, true], ["hi", 2, true]]);
});

// --- Group D: roofRegionDiff end-to-end ------------------------------------------

test("D1 a bbox-preserving ridge-band difference reads as roof-dominated MISSING mismatch", () => {
  const g = makeGable();
  const occ = makeOcc(g);
  const widened = makeOcc(g, { wideRidge: true }); // the "GLB": blockier ridge shoulders, same bbox
  const refSils = voxelSilhouettes(widened, MULTI_ANGLE_GATE.azimuths);
  const r = roofRegionDiff({ occ, gables: [g], refSils, aTris: null });
  assert.equal(r.schema, ROOF_DIFF_SCHEMA);
  const ROOF = ["ridge", "ends", "eaves", "slopes"];
  for (const a of MULTI_ANGLE_GATE.azimuths) {
    const v = r.views[a];
    assert.ok(v.mismatchPx > 0, `${a}: expected mismatch`);
    assert.ok(v.missing >= v.extra, `${a}: reference is a superset — missing should dominate`);
    const roofPx = ROOF.reduce((s, n) => s + (v.byRegion[n]?.extra ?? 0) + (v.byRegion[n]?.missing ?? 0), 0);
    assert.ok(roofPx >= 0.6 * v.mismatchPx, `${a}: roof regions should carry the mismatch (${roofPx} of ${v.mismatchPx})`);
  }
  assert.ok(r.summary.roofSharePct > 50, `roofSharePct ${r.summary.roofSharePct}`);
});

test("D2 identical build and reference → iou 1 everywhere, zero mismatch, profiles assembled", () => {
  const g = makeGable();
  const occ = makeOcc(g);
  const refSils = voxelSilhouettes(occ, MULTI_ANGLE_GATE.azimuths);
  const r = roofRegionDiff({ occ, gables: [g], refSils, aTris: slopedSheet() });
  for (const a of MULTI_ANGLE_GATE.azimuths) {
    assert.equal(r.views[a].iou, 1);
    assert.equal(r.views[a].mismatchPx, 0);
  }
  assert.equal(r.profiles.length, 1);
  assert.equal(r.summary.mismatchPx, 0);
});

test("D3 deterministic: two assemblies are byte-identical", () => {
  const g = makeGable();
  const occ = makeOcc(g);
  const refSils = voxelSilhouettes(makeOcc(g, { wideRidge: true }), MULTI_ANGLE_GATE.azimuths);
  const a = roofRegionDiff({ occ, gables: [g], refSils, aTris: slopedSheet() });
  const b = roofRegionDiff({ occ, gables: [g], refSils, aTris: slopedSheet() });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("D4 fallback roof: mismatch still localized, profiles empty, fallback named in the record", () => {
  const g = makeGable();
  const occ = makeOcc(g);
  const refSils = voxelSilhouettes(makeOcc(g, { wideRidge: true }), MULTI_ANGLE_GATE.azimuths);
  const r = roofRegionDiff({ occ, gables: [], refSils, aTris: slopedSheet(), bandFloor: 5 });
  assert.equal(r.regions.fallback.region, "unpartitioned");
  assert.equal(r.profiles.length, 0);
  assert.ok(Object.values(r.views).some((v) => (v.byRegion.unpartitioned?.missing ?? 0) > 0));
});

test("D5 projectRegions: every exposed cell lands once, wall below the band floor", () => {
  const g = makeGable();
  const occ = makeOcc(g);
  const regions = roofRegions([g], occ);
  const points = projectRegions(regions, occ, { azimuthDeg: 45, elevationDeg: 30 }, { width: 64, height: 64 });
  assert.ok(points.length > 0);
  assert.ok(points.every((p) => Number.isFinite(p.sx) && Number.isFinite(p.sy)));
  assert.ok(points.some((p) => p.region === "wall"));
  assert.ok(points.some((p) => p.region === "ridge"));
});
