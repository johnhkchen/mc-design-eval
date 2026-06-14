// Value-true palette → swatch grid (T-040-01, story S-040, epic E-14).
//
// THE CONCEPT END of the co-design loop. T-039-01's `resolveValueTruePalette` pins each named block
// to its REAL rendered value (a value-honest card). This module turns that card into the two inputs
// the palette-aware concept (BAML `SculptureConceptPromptV2`) consumes:
//   • an IMAGE — a swatch grid of the blocks' TRUE colors, attached to Nano Banana so the concept is
//     grounded on the real (often DARKER) value, not an imagined hue;
//   • a TEXT legend — the name→block→hex→L* mapping the image can't label, interpolated into the
//     prompt.
//
// This closes `concept-image-not-color-value-preview`: the concept previewed hue but not value, so
// the render later surprised with a darker block. Showing the real swatch values up front narrows
// that surprise.
//
// PURE, GL-FREE, NETWORK-FREE. Reuses E-10's `renderGridSwatch` (image-grid.mjs) for cell painting —
// ZERO new pixel logic here, only the card→GridResult adapter + the legend text. Returns RGBA +
// string; the runner (benchmarks/sculpture/_archive/concept-ab.mjs) encodes the PNG. Runs under the
// `src/**/*.test.mjs` glob with nothing mocked.

import { renderGridSwatch } from "./image-grid.mjs";

/** Default columns cap — a few blocks read best as a short, wide strip of big swatches. */
const MAX_COLS = 4;
/** Default swatch cell size in px — large so each block's value reads clearly to the image model. */
const DEFAULT_CELL = 96;

/** Validate the card is a non-empty array of `{block, rgb:[r,g,b]}`; throw actionably otherwise. */
function assertCard(card) {
  if (!Array.isArray(card) || card.length === 0) {
    throw new Error("palette-swatch: card must be a non-empty array (a value-true palette card)");
  }
  for (const c of card) {
    if (!c || typeof c.block !== "string" || !Array.isArray(c.rgb) || c.rgb.length !== 3) {
      throw new Error(`palette-swatch: each card entry needs { block:string, rgb:[r,g,b] }, got ${JSON.stringify(c)}`);
    }
  }
}

/**
 * Lay a value-true card into a SYNTHETIC GridResult that `renderGridSwatch` consumes unchanged:
 * one cell per card entry (per requested name — two names that snapped to the same block still get
 * their own swatch, identical color, which is the honest picture), filled row-major into `cols`
 * columns. Trailing cells are `null` (transparent air).
 *
 * @param {{block:string, rgb:number[]}[]} card  a T-039-01 value-true card (its `.card`)
 * @param {{cols?:number}} [opts]
 * @returns {{grid:(string|null)[][], n:number, m:number, legend:{block:string,rgb:number[]}[]}}
 */
export function cardToSwatchGrid(card, { cols } = {}) {
  assertCard(card);
  const n = cols ?? Math.min(card.length, MAX_COLS);
  if (!Number.isInteger(n) || n < 1) throw new Error(`palette-swatch: cols must be a positive integer, got ${cols}`);
  const m = Math.ceil(card.length / n);
  const grid = [];
  for (let gy = 0; gy < m; gy++) {
    const row = new Array(n).fill(null);
    for (let gx = 0; gx < n; gx++) {
      const idx = gy * n + gx;
      if (idx < card.length) row[gx] = card[idx].block;
    }
    grid.push(row);
  }
  // renderGridSwatch keys color off the legend (block -> rgb). One entry per distinct block suffices,
  // but mapping every card entry is harmless (dups collapse in the Map) and keeps this trivially pure.
  const legend = card.map((c) => ({ block: c.block, rgb: c.rgb }));
  return { grid, n, m, legend };
}

/**
 * The value legend text the BAML `.v2` interpolates — one line per card entry, mapping the requested
 * name to its real block, true hex, and L* value (and the snap distance when it was snapped).
 * Deterministic; values already rounded by the resolver.
 *
 * @param {{name:string, block:string, hex:string, value:number, snapped:boolean, deltaE:number}[]} card
 * @returns {string}
 */
export function paletteSwatchLegend(card) {
  assertCard(card);
  return card
    .map((c) => {
      const head = `${c.name ?? c.block} → ${c.block}  ${c.hex}  L*${c.value}`;
      return c.snapped ? `${head}  snapped ΔE${c.deltaE}` : head;
    })
    .join("\n");
}

/**
 * One-call convenience: card → a rendered swatch buffer + the legend text. The swatch is a flat RGBA
 * buffer (from `renderGridSwatch`); the caller encodes it to PNG.
 *
 * @param {object[]} card  a T-039-01 value-true card
 * @param {{cols?:number, cell?:number}} [opts]
 * @returns {{swatch:{width:number,height:number,data:Uint8ClampedArray}, legend:string, cols:number, rows:number}}
 */
export function buildPaletteSwatch(card, { cols, cell = DEFAULT_CELL } = {}) {
  const gridResult = cardToSwatchGrid(card, { cols });
  const swatch = renderGridSwatch(gridResult, { cell });
  return {
    swatch,
    legend: paletteSwatchLegend(card),
    cols: gridResult.n,
    rows: gridResult.m,
  };
}
