// Unit suite for the shared palette loader/formatter (T-004-02, AC #3).
//
// Offline and deterministic: `loadPalette` reads the real shipped industrial
// palette (a repo file), `formatPaletteBlocks` is pure. No SDK, no network.

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadPalette, formatPaletteBlocks, PALETTES_DIR } from "./palette.mjs";

// --- loadPalette ----------------------------------------------------------

test("loadPalette reads the shipped industrial palette", () => {
  const p = loadPalette("industrial");
  assert.equal(p.id, "industrial");
  assert.equal(p.minecraftVersion, "1.20.1");
  assert.ok(Array.isArray(p.blocks) && p.blocks.length > 0);
  assert.ok(p.blocks.includes("iron_block"), "whitelist includes iron_block");
});

test("loadPalette throws a clear error for an unknown palette id", () => {
  assert.throws(() => loadPalette("does-not-exist"), /unknown palette "does-not-exist"/);
  assert.throws(() => loadPalette("does-not-exist"), new RegExp(PALETTES_DIR.replace(/[/\\]/g, "[/\\\\]")));
});

test("loadPalette rejects an empty id", () => {
  assert.throws(() => loadPalette(""), /non-empty string/);
});

// --- formatPaletteBlocks --------------------------------------------------

test("formatPaletteBlocks groups blocks and names every group when groups exist", () => {
  const p = loadPalette("industrial");
  const out = formatPaletteBlocks(p);
  for (const group of Object.keys(p.groups)) {
    assert.ok(out.includes(group), `output mentions group "${group}"`);
  }
  for (const block of p.blocks) {
    assert.ok(out.includes(block), `output mentions block "${block}"`);
  }
});

test("formatPaletteBlocks collects ungrouped blocks under 'other'", () => {
  const out = formatPaletteBlocks({
    blocks: ["stone", "glass", "loose_extra"],
    groups: { structure: ["stone"], glazing: ["glass"] },
  });
  assert.match(out, /- structure: stone/);
  assert.match(out, /- other: loose_extra/);
});

test("formatPaletteBlocks returns a flat comma list when there are no groups", () => {
  const out = formatPaletteBlocks({ blocks: ["stone", "glass", "iron_block"] });
  assert.equal(out, "stone, glass, iron_block");
});

test("formatPaletteBlocks is deterministic across calls", () => {
  const p = loadPalette("industrial");
  assert.equal(formatPaletteBlocks(p), formatPaletteBlocks(p));
});
