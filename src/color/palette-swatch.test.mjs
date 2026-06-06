// Unit suite for the value-true palette → swatch grid (T-040-01, story S-040, epic E-14).
//
// Offline, deterministic, no model/GL/network — auto-collected by the `src/**/*.test.mjs` glob. Tests
// assert PROPERTIES (layout, color fidelity, legend shape, determinism, validation) and prove the
// T-039-01 → pixels round-trip: a dark block (gray_concrete, L*24) paints a dark swatch pixel.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cardToSwatchGrid,
  paletteSwatchLegend,
  buildPaletteSwatch,
} from "./palette-swatch.mjs";
import { renderGridSwatch } from "./image-grid.mjs";
import { resolveValueTruePalette } from "./value-palette.mjs";

// A small synthetic card (the resolver's `.card` shape) for layout/legend tests.
const CARD = [
  { name: "gray_concrete", block: "gray_concrete", hex: "#373a3e", rgb: [55, 58, 62], lab: [24.3, 0, 0], value: 24.3, snapped: false, deltaE: 0 },
  { name: "andesite", block: "andesite", hex: "#888889", rgb: [136, 136, 137], lab: [56.7, 0, 0], value: 56.7, snapped: false, deltaE: 0 },
  { name: "honey_block", block: "hay_block", hex: "#a68826", rgb: [166, 136, 38], lab: [57.9, 0, 0], value: 57.9, snapped: true, deltaE: 0 },
];

// --- Group A: layout -------------------------------------------------------

test("A: N entries → n=cols, m=ceil(N/cols), grid is m×n", () => {
  const g = cardToSwatchGrid(CARD, { cols: 2 });
  assert.equal(g.n, 2);
  assert.equal(g.m, 2); // ceil(3/2)
  assert.equal(g.grid.length, 2);
  for (const row of g.grid) assert.equal(row.length, 2);
});

test("A: default cols = min(len, 4)", () => {
  assert.equal(cardToSwatchGrid(CARD).n, 3); // 3 entries < 4
  const five = [...CARD, ...CARD].slice(0, 5);
  assert.equal(cardToSwatchGrid(five).n, 4); // capped at 4
});

test("A: entries fill row-major; trailing cells are null", () => {
  const g = cardToSwatchGrid(CARD, { cols: 2 });
  assert.equal(g.grid[0][0], "gray_concrete");
  assert.equal(g.grid[0][1], "andesite");
  assert.equal(g.grid[1][0], "hay_block");
  assert.equal(g.grid[1][1], null); // 4th cell empty
});

test("A: single entry → 1×1 grid", () => {
  const g = cardToSwatchGrid([CARD[0]]);
  assert.deepEqual(g.grid, [["gray_concrete"]]);
  assert.equal(g.n, 1);
  assert.equal(g.m, 1);
});

// --- Group B: color fidelity (the value-honesty point) ---------------------

test("B: legend carries each entry's true block→rgb", () => {
  const g = cardToSwatchGrid(CARD);
  assert.deepEqual(g.legend, [
    { block: "gray_concrete", rgb: [55, 58, 62] },
    { block: "andesite", rgb: [136, 136, 137] },
    { block: "hay_block", rgb: [166, 136, 38] },
  ]);
});

test("B: rendered swatch paints the true (dark) value at the right cell", () => {
  const { swatch } = buildPaletteSwatch(CARD, { cols: 3, cell: 10 });
  assert.equal(swatch.width, 30); // 3 cols × 10px
  assert.equal(swatch.height, 10); // 1 row × 10px
  // top-left pixel = cell 0 (gray_concrete) — the dark value, fully opaque
  assert.deepEqual([swatch.data[0], swatch.data[1], swatch.data[2], swatch.data[3]], [55, 58, 62, 255]);
  // first pixel of cell 1 (andesite) is at x=10 → offset (10)*4
  const o = 10 * 4;
  assert.deepEqual([swatch.data[o], swatch.data[o + 1], swatch.data[o + 2]], [136, 136, 137]);
});

// --- Group C: legend text --------------------------------------------------

test("C: one line per entry, with name → block, hex, and L*value", () => {
  const lines = paletteSwatchLegend(CARD).split("\n");
  assert.equal(lines.length, 3);
  assert.match(lines[0], /gray_concrete → gray_concrete/);
  assert.match(lines[0], /#373a3e/);
  assert.match(lines[0], /L\*24\.3/);
});

test("C: snapped entries carry ΔE; unsnapped do not", () => {
  const lines = paletteSwatchLegend(CARD).split("\n");
  assert.doesNotMatch(lines[0], /snapped/); // gray_concrete unsnapped
  assert.match(lines[2], /snapped ΔE0/); // honey_block → hay_block snapped
});

// --- Group D: determinism --------------------------------------------------

test("D: same card → deep-equal grid and legend across calls", () => {
  assert.deepEqual(cardToSwatchGrid(CARD), cardToSwatchGrid(CARD));
  assert.equal(paletteSwatchLegend(CARD), paletteSwatchLegend(CARD));
});

// --- Group E: validation ---------------------------------------------------

test("E: empty or non-array card throws", () => {
  assert.throws(() => cardToSwatchGrid([]), /non-empty array/);
  assert.throws(() => cardToSwatchGrid(null), /non-empty array/);
  assert.throws(() => paletteSwatchLegend([]), /non-empty array/);
});

test("E: malformed entry (missing rgb) throws", () => {
  assert.throws(() => cardToSwatchGrid([{ block: "x" }]), /block:string, rgb/);
  assert.throws(() => cardToSwatchGrid([{ block: "x", rgb: [1, 2] }]), /rgb:\[r,g,b\]/);
});

test("E: non-positive cols throws", () => {
  assert.throws(() => cardToSwatchGrid(CARD, { cols: 0 }), /positive integer/);
});

// --- Group F: round-trip through the real resolver -------------------------

test("F: resolveValueTruePalette → buildPaletteSwatch reflects the real dark value", () => {
  const { card } = resolveValueTruePalette(["gray_concrete", "andesite"]);
  const { swatch, legend, cols, rows } = buildPaletteSwatch(card);
  assert.equal(cols, 2);
  assert.equal(rows, 1);
  // gray_concrete is genuinely dark (L* ~24) — its swatch pixel must be dark (all channels < 90)
  const gray = card.find((c) => c.block === "gray_concrete");
  assert.ok(gray.value < 30, `expected gray_concrete dark, got L*${gray.value}`);
  assert.ok(swatch.data[0] < 90 && swatch.data[1] < 90 && swatch.data[2] < 90, "cell 0 should paint dark");
  assert.match(legend, /gray_concrete/);
});

test("F: cardToSwatchGrid output is consumable by renderGridSwatch directly", () => {
  const { card } = resolveValueTruePalette(["gray_concrete", "andesite", "stone_bricks"]);
  const g = cardToSwatchGrid(card);
  const sw = renderGridSwatch(g, { cell: 8 });
  assert.equal(sw.width, g.n * 8);
  assert.equal(sw.height, g.m * 8);
});
