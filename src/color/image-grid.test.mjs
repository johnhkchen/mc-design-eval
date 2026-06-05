// Unit suite for the image → real-block grid sampler (T-022-01, AC #5).
//
// Offline, deterministic, decode-free: the whole pipeline runs on synthetic RGBA buffers built from
// EXACT block colors read out of the committed table (loadBlockTable), so expectations are derived
// independently of the sampler — a region filled at gold_block's own rgb must come back named
// gold_block by definition of nearest-match, not because the code said so. No binary fixture is
// committed and jpeg-js/pngjs never load on the test path (decode lives in gridFromImage, untested
// here — mirrors palette-extract.test.mjs / block-table.test.mjs).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  gridDims,
  gridFromPixels,
  comparePalettes,
  renderGridSwatch,
  describeGrid,
} from "./image-grid.mjs";
import { loadBlockTable } from "./block-table.mjs";

const TABLE = loadBlockTable();
const rgbOf = (name) => {
  const e = TABLE.blocks.find((b) => b.block === name);
  assert.ok(e, `expected "${name}" in the committed table`);
  return e.rgb;
};

/**
 * Build a W×H RGBA image: black background everywhere, then paint a solid rectangle [x0,x1)×[y0,y1)
 * with `color`. Models a bright silhouette on the locked near-black field.
 */
function imageWithRegion(W, H, color, [x0, y0, x1, y1]) {
  const data = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) << 2;
      const inside = x >= x0 && x < x1 && y >= y0 && y < y1;
      const c = inside ? color : [0, 0, 0];
      data[p] = c[0];
      data[p + 1] = c[1];
      data[p + 2] = c[2];
      data[p + 3] = 255;
    }
  }
  return { width: W, height: H, data };
}

// --- Group A: geometry -----------------------------------------------------

test("gridDims: n columns, aspect-correct rows m = round(n·H/W)", () => {
  assert.deepEqual(gridDims(100, 100, 48), { n: 48, m: 48 }); // square
  assert.deepEqual(gridDims(1265, 832, 48), { n: 48, m: 32 }); // taj-A aspect → wide
  assert.deepEqual(gridDims(100, 400, 10), { n: 10, m: 40 }); // tall
  assert.equal(gridDims(1000, 1, 48).m, 1); // never below 1 row
});

test("gridDims rejects bad arguments", () => {
  assert.throws(() => gridDims(10, 10, 0), /positive integer/);
  assert.throws(() => gridDims(10, 10, 2.5), /positive integer/);
  assert.throws(() => gridDims(0, 10, 8), /≥ 1/);
});

test("grid shape: m rows of n cols, matching gridDims", () => {
  const img = imageWithRegion(80, 40, rgbOf("gold_block"), [0, 0, 80, 40]);
  const r = gridFromPixels(img, { n: 16 });
  const { n, m } = gridDims(80, 40, 16);
  assert.equal(r.n, n);
  assert.equal(r.m, m);
  assert.equal(r.grid.length, m);
  for (const row of r.grid) assert.equal(row.length, n);
  assert.equal(r.totalCells, n * m);
});

// --- Group B: cell assignment ----------------------------------------------

test("a known foreground region maps to the expected block; background is air", () => {
  // Right half painted at gold_block's exact table color; left half black background.
  const W = 16, H = 8;
  const img = imageWithRegion(W, H, rgbOf("gold_block"), [8, 0, 16, 8]);
  const r = gridFromPixels(img, { n: 8 }); // 8×4 grid; columns 4..7 are the gold region
  for (let gy = 0; gy < r.m; gy++) {
    for (let gx = 0; gx < r.n; gx++) {
      const cell = r.grid[gy][gx];
      if (gx < 4) assert.equal(cell, null, `col ${gx} should be air`);
      else assert.equal(cell, "gold_block", `col ${gx} should be gold_block`);
    }
  }
  assert.equal(r.airCells, r.totalCells / 2);
  assert.equal(r.filledCells, r.totalCells / 2);
  assert.equal(r.blockCounts.gold_block, r.filledCells);
});

test("every filled cell is one of the matched palette blocks; air is null", () => {
  const img = imageWithRegion(40, 40, rgbOf("redstone_block"), [10, 10, 30, 30]);
  const r = gridFromPixels(img, { n: 20 });
  const used = new Set(r.usedBlocks);
  for (const row of r.grid) {
    for (const cell of row) {
      if (cell === null) continue;
      assert.ok(used.has(cell), `${cell} must be in usedBlocks`);
    }
  }
  assert.ok(r.filledCells > 0);
  assert.equal(r.airCells + r.filledCells, r.totalCells);
});

// --- Group C: palette adherence (spec §9) ----------------------------------

test("validate mode: zero out-of-palette cells, every cell in the whitelist", () => {
  // Region painted near gold; whitelist excludes gold so it must snap to a whitelisted block.
  const whitelist = ["stone", "white_concrete", "iron_block", "oak_planks"];
  const img = imageWithRegion(32, 32, [240, 220, 60], [4, 4, 28, 28]);
  const r = gridFromPixels(img, { n: 16, whitelist });
  assert.equal(r.paletteMode, "validate");
  assert.equal(r.outOfPalette, 0);
  const allowed = new Set(whitelist);
  for (const row of r.grid) {
    for (const cell of row) {
      if (cell !== null) assert.ok(allowed.has(cell), `${cell} not in whitelist`);
    }
  }
});

test("discover mode uses only real table blocks; outOfPalette is 0", () => {
  const img = imageWithRegion(24, 24, rgbOf("emerald_block"), [0, 0, 24, 24]);
  const r = gridFromPixels(img, { n: 12 });
  assert.equal(r.paletteMode, "discover");
  assert.equal(r.outOfPalette, 0);
  for (const block of r.usedBlocks) {
    assert.ok(TABLE.blocks.some((b) => b.block === block), `${block} must be a real table block`);
  }
});

test("validate mode surfaces whitelist ids absent from the table as `missing`", () => {
  // quartz_stairs is non-full-cube → not in the table; stone is.
  const r = gridFromPixels(imageWithRegion(16, 16, rgbOf("stone"), [0, 0, 16, 16]), {
    n: 8,
    whitelist: ["stone", "quartz_stairs", "totally_not_a_block"],
  });
  assert.deepEqual(r.missing.sort(), ["quartz_stairs", "totally_not_a_block"]);
});

// --- Group D: comparePalettes ----------------------------------------------

test("comparePalettes partitions declared vs used into present/missing/added", () => {
  const used = ["stone", "white_concrete", "glass"];
  const declared = ["stone", "white_concrete", "quartz_block"];
  const { present, missing, added } = comparePalettes(used, declared);
  assert.deepEqual(present, ["stone", "white_concrete"]);
  assert.deepEqual(missing, ["quartz_block"]);
  assert.deepEqual(added, ["glass"]);
  // present ∪ missing = declared; present and missing disjoint
  assert.deepEqual([...present, ...missing].sort(), [...declared].sort());
});

test("comparePalettes: empty used → all declared missing, nothing added", () => {
  const { present, missing, added } = comparePalettes([], ["a", "b"]);
  assert.deepEqual(present, []);
  assert.deepEqual(missing, ["a", "b"]);
  assert.deepEqual(added, []);
});

// --- Group E: swatch render ------------------------------------------------

test("renderGridSwatch: dims n·cell × m·cell; filled cell = block color, air transparent", () => {
  const W = 16, H = 8;
  const img = imageWithRegion(W, H, rgbOf("gold_block"), [8, 0, 16, 8]);
  const r = gridFromPixels(img, { n: 8 }); // cols 0..3 air, 4..7 gold
  const cell = 5;
  const sw = renderGridSwatch(r, { cell });
  assert.equal(sw.width, r.n * cell);
  assert.equal(sw.height, r.m * cell);
  assert.equal(sw.data.length, sw.width * sw.height * 4);

  const pixelAt = (cx, cy) => {
    // center of grid cell (cx,cy)
    const px = cx * cell + (cell >> 1);
    const py = cy * cell + (cell >> 1);
    const q = (py * sw.width + px) << 2;
    return [sw.data[q], sw.data[q + 1], sw.data[q + 2], sw.data[q + 3]];
  };
  const [gr, gg, gb] = rgbOf("gold_block");
  assert.deepEqual(pixelAt(5, 1), [gr, gg, gb, 255]); // a gold cell
  assert.deepEqual(pixelAt(0, 1), [0, 0, 0, 0]); // an air cell — transparent
});

test("renderGridSwatch rejects a non-positive cell size", () => {
  const r = gridFromPixels(imageWithRegion(8, 8, rgbOf("stone"), [0, 0, 8, 8]), { n: 4 });
  assert.throws(() => renderGridSwatch(r, { cell: 0 }), /positive integer/);
});

// --- Group F: determinism + description ------------------------------------

test("gridFromPixels is deterministic (two runs deep-equal)", () => {
  const img = imageWithRegion(60, 30, rgbOf("lapis_block"), [5, 5, 55, 25]);
  const a = gridFromPixels(img, { n: 24 });
  const b = gridFromPixels(img, { n: 24 });
  assert.deepEqual(a, b);
});

test("describeGrid reflects dims, fill, block count", () => {
  const img = imageWithRegion(16, 16, rgbOf("gold_block"), [0, 0, 16, 16]);
  const r = gridFromPixels(img, { n: 8 });
  assert.equal(describeGrid(r), r.description);
  assert.match(r.description, /8×8 grid · 64\/64 cells filled · 1 blocks/);
});
