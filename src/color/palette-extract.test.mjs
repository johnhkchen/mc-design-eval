// Unit suite for the canonical palette extractor (T-021-01, AC #3).
//
// Offline, deterministic, decode-free: the whole pipeline is exercised on synthetic RGBA buffers
// built from EXACT block colors read out of the committed table (loadBlockTable), so expectations
// are derived independently of the extractor — a color filled at gold_block's own rgb must come
// back named gold_block, by definition of nearest-match, not because the code said so. No binary
// image fixture is committed and jpeg-js/pngjs never load on the test path (decode lives in
// extractPaletteFromImage, deliberately untested here — mirrors block-table.test.mjs).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rgbToHex,
  isBackground,
  medianCutLab,
  aggregateForeground,
  extractPaletteFromPixels,
  describePalette,
  DEFAULTS,
} from "./palette-extract.mjs";
import { loadBlockTable } from "./block-table.mjs";
import { srgbToLab } from "./cielab.mjs";

const TABLE = loadBlockTable();
const rgbOf = (name) => {
  const e = TABLE.blocks.find((b) => b.block === name);
  assert.ok(e, `expected "${name}" in the committed table`);
  return e.rgb;
};

/** Build an RGBA image as a vertical stack of [color, pixelCount] bands. */
function stackImage(bands, width = 10) {
  const total = bands.reduce((s, [, n]) => s + n, 0);
  const data = new Uint8Array(total * 4);
  let p = 0;
  for (const [c, n] of bands) {
    for (let k = 0; k < n; k++, p++) {
      const i = p * 4;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = c[3] === undefined ? 255 : c[3];
    }
  }
  return { width, height: total / width, data };
}

// --- Group A: pure helpers -------------------------------------------------

test("rgbToHex formats and clamps", () => {
  assert.equal(rgbToHex([0, 0, 0]), "#000000");
  assert.equal(rgbToHex([255, 255, 255]), "#ffffff");
  assert.equal(rgbToHex([246, 208, 62]), "#f6d03e");
  assert.equal(rgbToHex([300, -5, 128]), "#ff0080"); // clamps out-of-range
});

test("isBackground: alpha gate, near-black tolerance, bright kept, null disables", () => {
  const o = { dropColor: [0, 0, 0], dropTolerance: 24, alphaThreshold: 128 };
  assert.equal(isBackground(255, 0, 0, 0, o), true); // transparent → dropped
  assert.equal(isBackground(2, 1, 3, 255, o), true); // near-black within tol
  assert.equal(isBackground(200, 30, 30, 255, o), false); // bright red kept
  assert.equal(isBackground(2, 1, 3, 255, { ...o, dropColor: null }), false); // removal disabled
  assert.equal(isBackground(20, 0, 0, 255, o), true); // exactly on the 24-radius? |20|<=24 → drop
  assert.equal(isBackground(25, 0, 0, 255, o), false); // just outside the radius → keep
});

test("medianCutLab is deterministic (same input → identical clusters)", () => {
  const pts = [
    { rgb: [246, 208, 62], lab: srgbToLab([246, 208, 62]), count: 40 },
    { rgb: [31, 67, 140], lab: srgbToLab([31, 67, 140]), count: 30 },
    { rgb: [176, 25, 5], lab: srgbToLab([176, 25, 5]), count: 20 },
  ];
  const a = medianCutLab(pts, 8);
  const b = medianCutLab(pts, 8);
  assert.deepEqual(a, b);
});

test("medianCutLab stops at the distinct-color count when k exceeds it", () => {
  const pts = [
    { rgb: [246, 208, 62], lab: srgbToLab([246, 208, 62]), count: 5 },
    { rgb: [31, 67, 140], lab: srgbToLab([31, 67, 140]), count: 5 },
  ];
  assert.equal(medianCutLab(pts, 8).length, 2); // only 2 distinct colors → 2 clusters
  assert.equal(medianCutLab([], 8).length, 0);
});

test("medianCutLab splits two well-separated colors into two weighted clusters", () => {
  const pts = [
    { rgb: [255, 255, 255], lab: srgbToLab([255, 255, 255]), count: 7 },
    { rgb: [0, 0, 0], lab: srgbToLab([0, 0, 0]), count: 3 },
  ];
  const cl = medianCutLab(pts, 2).sort((x, y) => y.count - x.count);
  assert.equal(cl.length, 2);
  assert.equal(cl[0].count, 7);
  assert.equal(cl[1].count, 3);
});

test("aggregateForeground tallies survivors and drops the background band", () => {
  const img = stackImage([
    [[246, 208, 62], 40],
    [[2, 1, 3], 20], // near-black background
  ]);
  const { points, foregroundPx, droppedPx } = aggregateForeground(img, DEFAULTS);
  assert.equal(foregroundPx, 40);
  assert.equal(droppedPx, 20);
  assert.equal(points.length, 1); // one unique foreground color
  assert.equal(points[0].count, 40);
});

// --- Group C: synthetic-image AC (independent expectations) -----------------

test("extracts the expected blocks, coverage, ordering, with background excluded", () => {
  // 40/30/20/10 foreground proportions, exact block colors, plus a near-black bg band.
  const img = stackImage([
    [rgbOf("gold_block"), 40],
    [rgbOf("lapis_block"), 30],
    [rgbOf("redstone_block"), 20],
    [rgbOf("quartz_block"), 10],
    [[1, 1, 1], 20], // background → must be dropped, not in palette, not in coverage
  ]);
  const r = extractPaletteFromPixels(img, { k: 8 });

  assert.equal(r.foregroundPx, 100, "coverage denominator is the foreground only");
  assert.equal(r.droppedPx, 20, "the near-black band was dropped");

  const names = r.palette.map((e) => e.block);
  assert.deepEqual(names, ["gold_block", "lapis_block", "redstone_block", "quartz_block"],
    "named blocks, ordered by coverage desc");

  // coverage matches the intended proportions (ΔE 0 since colors are exact table entries).
  const cov = Object.fromEntries(r.palette.map((e) => [e.block, e.coveragePct]));
  assert.equal(cov.gold_block, 40);
  assert.equal(cov.lapis_block, 30);
  assert.equal(cov.redstone_block, 20);
  assert.equal(cov.quartz_block, 10);
  for (const e of r.palette) assert.equal(e.deltaE, 0, `${e.block} exact-color match`);

  // coverage is sorted strictly descending.
  for (let i = 1; i < r.palette.length; i++) {
    assert.ok(r.palette[i - 1].coveragePct >= r.palette[i].coveragePct, "sorted desc");
  }

  // repColor carries hex + lab; no background block leaked in.
  assert.match(r.palette[0].repColor.hex, /^#[0-9a-f]{6}$/);
  assert.equal(r.palette[0].repColor.lab.length, 3);
  assert.ok(!names.includes("coal_block") && !names.includes("blackstone"), "bg not matched to a dark block");
});

test("centroids mapping to the same block are merged with summed coverage", () => {
  // Two separate gold bands → one merged row at the combined coverage.
  const img = stackImage([
    [rgbOf("gold_block"), 30],
    [rgbOf("lapis_block"), 20],
    [rgbOf("gold_block"), 50],
  ]);
  const r = extractPaletteFromPixels(img, { k: 8 });
  const gold = r.palette.filter((e) => e.block === "gold_block");
  assert.equal(gold.length, 1, "gold appears once, not twice");
  assert.equal(gold[0].coveragePct, 80, "30 + 50 summed");
  assert.equal(r.palette.find((e) => e.block === "lapis_block").coveragePct, 20);
});

// --- Group D: modes / edges ------------------------------------------------

test("whitelist restricts matches to the subset and reports missing ids", () => {
  // Force gold pixels to match within a whitelist that EXCLUDES gold_block: they must land on a
  // listed block instead, and a bogus id is surfaced in `missing`.
  const img = stackImage([[rgbOf("gold_block"), 50], [rgbOf("lapis_block"), 50]]);
  const r = extractPaletteFromPixels(img, {
    whitelist: ["quartz_block", "lapis_block", "not_a_real_block"],
  });
  const names = r.palette.map((e) => e.block);
  for (const n of names) assert.ok(["quartz_block", "lapis_block"].includes(n), `${n} within whitelist`);
  assert.ok(!names.includes("gold_block"), "gold_block excluded from the whitelist");
  assert.deepEqual(r.missing, ["not_a_real_block"]);
});

test("an all-background image throws (no foreground survives)", () => {
  const img = stackImage([[[0, 0, 0], 40]]);
  assert.throws(() => extractPaletteFromPixels(img, {}), /no foreground/);
});

test("a whitelist that matches no table block throws", () => {
  const img = stackImage([[rgbOf("gold_block"), 10]]);
  assert.throws(() => extractPaletteFromPixels(img, { whitelist: ["nope", "also_nope"] }), /matched no blocks/);
});

test("describePalette renders a one-line summary", () => {
  const img = stackImage([[rgbOf("gold_block"), 50], [rgbOf("lapis_block"), 50]]);
  const r = extractPaletteFromPixels(img, {});
  const line = describePalette(r);
  assert.match(line, /^2 blocks over \d+% of frame: /);
  assert.match(line, /gold_block 50%/);
  assert.match(line, /mean ΔE/);
});
