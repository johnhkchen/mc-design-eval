// Unit suite for the concept band-profile extractor (T-092-01, S-092, E-25).
//
// Offline, deterministic, decode-free. Two layers of coverage:
//   • direct plain-data tests per pure function (hand-built grids/histograms — the contract cases);
//   • an end-to-end SYNTHETIC IMAGE test (the AC's wording): a striped "building" painted in EXACT
//     committed-table block colors (stone plinth / plaster+studs storey / roof / a thin chimney rising
//     past the ridge on a white field), run through the REAL validate-mode quantize (gridFromPixels)
//     into extractConceptZoneMap — proving the chimney is excluded from calibration, the boundary
//     snaps to the floor-line, studs surface as secondaries, and the roof split stays geometric.
// No binary fixture committed; decode never loads (mirrors image-grid.test.mjs).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rowProfile, robustExtent, mapRowsToLayers, segmentLayerBands, snapBands,
  resolveBandRoles, extractConceptZoneMap,
  EXTENT_WIDTH_FLOOR, MIN_BAND_HEIGHT, SNAP_TOLERANCE, SECONDARY_MIN_SHARE,
} from "./band-profile.mjs";
import { gridFromPixels } from "./image-grid.mjs";
import { loadBlockTable } from "./block-table.mjs";

const TABLE = loadBlockTable();
const rgbOf = (name) => {
  const e = TABLE.blocks.find((b) => b.block === name);
  assert.ok(e, `expected "${name}" in the committed table`);
  return e.rgb;
};

/** Synthetic E-21 material map (shape of material-map/v1's .map). */
const MAT_MAP = {
  map: [
    { role: "ground wall field", block: "minecraft:stone_bricks", placementRule: "walls" },
    { role: "plaster infill", block: "minecraft:white_terracotta", placementRule: "walls" },
    { role: "timber frame", block: "minecraft:dark_oak_log", placementRule: "trim" },
    { role: "roof field", block: "minecraft:spruce_planks", placementRule: "roof" },
    { role: "chimney shaft", block: "minecraft:cobblestone", placementRule: "corners-edges" },
  ],
};
const WHITELIST = ["stone_bricks", "white_terracotta", "dark_oak_log", "spruce_planks", "cobblestone"];

// --- Group A: row profile + robust extent ----------------------------------

test("rowProfile tallies per-row histograms, max width, total", () => {
  const grid = [
    [null, "a", "a", null],
    ["a", "b", "a", "a"],
    [null, null, null, null],
  ];
  const p = rowProfile({ grid });
  assert.deepEqual(p.rows[0], { filled: 2, counts: { a: 2 } });
  assert.deepEqual(p.rows[1], { filled: 4, counts: { a: 3, b: 1 } });
  assert.equal(p.rows[2].filled, 0);
  assert.equal(p.maxWidth, 4);
  assert.equal(p.totalFilled, 6);
});

test("robustExtent keeps rows ≥ floor·max and excludes narrow spurs; null on empty", () => {
  assert.deepEqual(robustExtent([0, 0, 10, 10, 2, 10, 0], 0.25), { lo: 2, hi: 5 });
  assert.equal(robustExtent([0, 0, 0]), null);
  // a 4-wide chimney over a 24-wide building is below the default floor
  assert.ok(4 < 24 * EXTENT_WIDTH_FLOOR);
});

// --- Group B: row→layer mapping --------------------------------------------

test("mapRowsToLayers maps top row to yHi, bottom row to yLo, accumulating histograms", () => {
  const rows = [
    { filled: 1, counts: { roof: 1 } },
    { filled: 1, counts: { mid: 1 } },
    { filled: 1, counts: { mid: 1 } },
    { filled: 2, counts: { base: 2 } },
  ];
  const byY = mapRowsToLayers(rows, { lo: 0, hi: 3 }, { yLo: 0, yHi: 3 });
  assert.deepEqual(byY.get(3), { filled: 1, counts: { roof: 1 } });
  assert.deepEqual(byY.get(2), { filled: 1, counts: { mid: 1 } });
  assert.deepEqual(byY.get(0), { filled: 2, counts: { base: 2 } });
});

test("mapRowsToLayers skips rows outside the robust extent", () => {
  const rows = [
    { filled: 9, counts: { chimney: 9 } }, // a spur row, outside the extent
    { filled: 1, counts: { a: 1 } },
    { filled: 1, counts: { a: 1 } },
  ];
  const byY = mapRowsToLayers(rows, { lo: 1, hi: 2 }, { yLo: 0, yHi: 1 });
  let total = 0;
  for (const h of byY.values()) total += h.filled;
  assert.equal(total, 2); // the spur's 9 cells never land
});

// --- Group C: segmentation --------------------------------------------------

function byYOf(layers) {
  const m = new Map();
  for (const [y, counts] of Object.entries(layers)) {
    const filled = Object.values(counts).reduce((a, b) => a + b, 0);
    m.set(Number(y), { filled, counts });
  }
  return m;
}

test("segmentLayerBands groups consecutive same-dominant layers bottom-up with shares", () => {
  const byY = byYOf({
    0: { stone: 8 }, 1: { stone: 8 }, 2: { stone: 6, log: 2 },
    3: { plaster: 6, log: 2 }, 4: { plaster: 7, log: 1 }, 5: { plaster: 8 },
  });
  const bands = segmentLayerBands(byY, { yLo: 0, yHi: 5 });
  assert.equal(bands.length, 2);
  assert.deepEqual(bands[0].yRange, [0, 2]);
  assert.equal(bands[0].dominant, "stone");
  assert.deepEqual(bands[1].yRange, [3, 5]);
  assert.equal(bands[1].dominant, "plaster");
  assert.ok(bands[1].share > 0.8 && bands[1].share < 0.9); // 21/24
});

test("a band thinner than MIN_BAND_HEIGHT merges into its neighbour", () => {
  assert.equal(MIN_BAND_HEIGHT, 2);
  const byY = byYOf({
    0: { stone: 8 }, 1: { stone: 8 }, 2: { stone: 8 },
    3: { log: 8 }, // 1-layer transition noise
    4: { plaster: 8 }, 5: { plaster: 8 }, 6: { plaster: 8 },
  });
  const bands = segmentLayerBands(byY, { yLo: 0, yHi: 6 });
  assert.equal(bands.length, 2);
  assert.deepEqual(bands.map((b) => b.dominant), ["stone", "plaster"]);
  assert.equal(bands[0].yRange[1] + 1, bands[1].yRange[0]); // still tiling
});

test("a layer with no mapped rows inherits the previous layer's dominant", () => {
  const byY = byYOf({ 0: { stone: 8 }, 2: { stone: 8 }, 3: { plaster: 8 }, 4: { plaster: 8 } });
  const bands = segmentLayerBands(byY, { yLo: 0, yHi: 4 });
  assert.deepEqual(bands[0].yRange, [0, 2]); // y=1 inherited "stone"
  assert.equal(bands.length, 2);
});

// --- Group D: floor-line snapping --------------------------------------------

test("snapBands snaps a boundary within tolerance onto the floor-line", () => {
  const bands = [
    { yRange: [0, 4], dominant: "stone" },
    { yRange: [5, 9], dominant: "plaster" },
  ];
  const out = snapBands(bands, [6], SNAP_TOLERANCE);
  assert.deepEqual(out[0].yRange, [0, 5]);
  assert.deepEqual(out[1].yRange, [6, 9]);
});

test("snapBands leaves a far boundary alone — the plinth top is NOT forced to a floor-line", () => {
  const bands = [
    { yRange: [0, 3], dominant: "stone" }, // plinth: boundary at 4
    { yRange: [4, 11], dominant: "plaster" },
  ];
  const out = snapBands(bands, [0, 7], SNAP_TOLERANCE); // storey divide at 7, |7-4| > 2
  assert.deepEqual(out[0].yRange, [0, 3]);
  assert.deepEqual(out[1].yRange, [4, 11]);
});

test("snapBands drops a band emptied by the snap and keeps the tiling contiguous", () => {
  const bands = [
    { yRange: [0, 4], dominant: "stone" },
    { yRange: [5, 6], dominant: "log" },
    { yRange: [7, 9], dominant: "plaster" },
  ];
  const out = snapBands(bands, [7], 2); // log band's lower boundary 5 → 7 empties it
  assert.equal(out.length, 2);
  assert.deepEqual(out[0].yRange, [0, 6]);
  assert.deepEqual(out[1].yRange, [7, 9]);
});

// --- Group E: role resolution -------------------------------------------------

test("resolveBandRoles: dominant role, share-qualified secondaries, cross-band union", () => {
  const band = { dominant: "white_terracotta", filled: 100, counts: { white_terracotta: 70, dark_oak_log: 25, spruce_planks: 5, stone_bricks: 2 } };
  const r = resolveBandRoles(band, MAT_MAP);
  assert.equal(r.dominantRole, "plaster infill");
  const byBlock = Object.fromEntries(r.secondaries.map((s) => [s.block, s]));
  assert.equal(byBlock.dark_oak_log.share, 0.25); // share-qualified (also trim)
  assert.ok(byBlock.spruce_planks.share >= SECONDARY_MIN_SHARE); // share-qualified only
  assert.ok(byBlock.cobblestone); // corners-edges → unioned in even at zero share
  assert.equal(byBlock.cobblestone.share, 0);
  assert.equal(byBlock.stone_bricks, undefined); // walls rule, below the share floor
});

test("resolveBandRoles returns null when the dominant has no map row", () => {
  const band = { dominant: "oak_planks", filled: 10, counts: { oak_planks: 10 } };
  assert.equal(resolveBandRoles(band, MAT_MAP), null);
});

// --- Group F: the orchestrator on a synthetic image ---------------------------
//
// 32×48 px on a white field, 1 px per grid cell (n=32 → m=48):
//   rows  4..11  chimney, 4 cells wide (cobblestone)        — a spur past the ridge
//   rows 12..23  roof, 24 cells wide (spruce_planks)
//   rows 24..35  plaster storey + 3 two-cell timber studs (white_terracotta / dark_oak_log)
//   rows 36..47  stone plinth (stone_bricks)
// Voxel side: walls y 0..11 (upperTop=12), roof 12..19, chimney 20..23 (narrow → excluded);
// floor-lines [0, 6, 12]. The plaster/stone boundary maps near y≈7 and must SNAP to 6.

function syntheticConcept() {
  const W = 32, H = 48;
  const data = new Uint8Array(W * H * 4).fill(255); // white field
  const paint = (x0, x1, y0, y1, [r, g, b]) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const p = (y * W + x) << 2;
        data[p] = r; data[p + 1] = g; data[p + 2] = b; data[p + 3] = 255;
      }
    }
  };
  paint(14, 17, 4, 11, rgbOf("cobblestone"));
  paint(4, 27, 12, 23, rgbOf("spruce_planks"));
  paint(4, 27, 24, 35, rgbOf("white_terracotta"));
  for (const x0 of [6, 14, 22]) paint(x0, x0 + 1, 24, 35, rgbOf("dark_oak_log"));
  paint(4, 27, 36, 47, rgbOf("stone_bricks"));
  return { width: W, height: H, data };
}

function syntheticGeometry() {
  const counts = [];
  for (let y = 0; y <= 23; y++) counts.push(y <= 11 ? 100 : y <= 19 ? 80 : 6);
  return { layerCounts: { yMin: 0, counts }, floorLines: [0, 6, 12], upperTop: 12 };
}

function extractSynthetic(overrides = {}) {
  const gridResult = gridFromPixels(syntheticConcept(), {
    n: 32, whitelist: WHITELIST, dropColor: [255, 255, 255], cellMeans: true,
  });
  const { layerCounts, floorLines, upperTop } = syntheticGeometry();
  return extractConceptZoneMap({ gridResult, floorLines, layerCounts, upperTop, materialMap: MAT_MAP, ...overrides });
}

test("end-to-end synthetic image: plinth band + plaster band, boundary snapped to the floor-line", () => {
  const zm = extractSynthetic();
  assert.equal(zm.readable, true);
  assert.equal(zm.bands.length, 2);
  const [plinth, storey] = zm.bands;
  assert.equal(plinth.dominantBlock, "stone_bricks");
  assert.equal(plinth.dominantRole, "ground wall field");
  assert.equal(plinth.yRange[0], 0); // tiles from the build's true bottom
  assert.equal(storey.dominantBlock, "white_terracotta");
  assert.equal(storey.yRange[0], 6); // snapped onto floor-line 6 (detected ≈7)
  assert.equal(storey.yRange[1], 11); // tiles to the eave (upperTop − 1)
  assert.equal(plinth.yRange[1] + 1, storey.yRange[0]);
});

test("end-to-end: timber studs surface as a plaster-band secondary; roles resolved", () => {
  const zm = extractSynthetic();
  const storey = zm.bands[1];
  const log = storey.secondaries.find((s) => s.block === "dark_oak_log");
  assert.ok(log, "studs must be recorded as a secondary");
  assert.equal(log.role, "timber frame");
  assert.ok(log.share > 0.15 && log.share < 0.35); // 6 of 24 columns
});

test("end-to-end: roof histogram is geometric (y ≥ upperTop) and the chimney spur never lands", () => {
  const zm = extractSynthetic();
  assert.equal(zm.roof.dominantBlock, "spruce_planks");
  assert.equal(zm.roof.dominantRole, "roof field");
  // chimney rows are outside the robust extent → cobble contributes ZERO cells; it appears only
  // via the corners-edges cross-band union, at share 0
  const cobble = zm.roof.secondaries.find((s) => s.block === "cobblestone");
  assert.ok(cobble);
  assert.equal(cobble.share, 0);
});

// --- Group G: honest refusals (the fallback contract) -------------------------

const GEO = syntheticGeometry();

test("too-few-cells: a near-empty concept region refuses", () => {
  const grid = Array.from({ length: 48 }, () => new Array(32).fill(null));
  grid[40][10] = "stone_bricks";
  const zm = extractConceptZoneMap({ gridResult: { grid, n: 32, m: 48 }, ...GEO, materialMap: MAT_MAP });
  assert.deepEqual([zm.readable, zm.reason], [false, "too-few-cells"]);
});

test("extent-too-short: a silhouette under MIN_EXTENT_LAYERS wide rows refuses", () => {
  const grid = Array.from({ length: 48 }, () => new Array(64).fill(null));
  for (let y = 45; y <= 47; y++) for (let x = 0; x < 64; x++) grid[y][x] = "stone_bricks"; // 3 wide rows only
  for (let y = 0; y <= 44; y++) for (let x = 31; x <= 32; x++) grid[y][x] = "stone_bricks"; // narrow spur lifts the total ≥ 200
  const zm = extractConceptZoneMap({ gridResult: { grid, n: 64, m: 48 }, ...GEO, materialMap: MAT_MAP });
  assert.deepEqual([zm.readable, zm.reason], [false, "extent-too-short"]);
});

test("weak-dominant: a band that is an unreadable mix refuses with the band named", () => {
  const grid = Array.from({ length: 48 }, () => new Array(32).fill(null));
  const four = ["stone_bricks", "white_terracotta", "dark_oak_log", "spruce_planks"];
  for (let y = 8; y <= 47; y++) for (let x = 0; x < 32; x++) grid[y][x] = four[(x + y) % 4]; // 25% each
  const zm = extractConceptZoneMap({ gridResult: { grid, n: 32, m: 48 }, ...GEO, materialMap: MAT_MAP });
  assert.equal(zm.readable, false);
  assert.match(zm.reason, /^weak-dominant:/);
});

test("unmapped-dominant: a dominant block with no material-map row refuses by name", () => {
  const grid = Array.from({ length: 48 }, () => new Array(32).fill(null));
  for (let y = 8; y <= 47; y++) for (let x = 0; x < 32; x++) grid[y][x] = "oak_planks";
  const zm = extractConceptZoneMap({ gridResult: { grid, n: 32, m: 48 }, ...GEO, materialMap: MAT_MAP });
  assert.deepEqual([zm.readable, zm.reason], [false, "unmapped-dominant:oak_planks"]);
});

test("fallback results still report the params used (recorded, not silent)", () => {
  const grid = Array.from({ length: 8 }, () => new Array(8).fill(null));
  const zm = extractConceptZoneMap({ gridResult: { grid, n: 8, m: 8 }, ...GEO, materialMap: MAT_MAP });
  assert.equal(zm.readable, false);
  assert.equal(zm.params.minProfileCells, 200);
});
