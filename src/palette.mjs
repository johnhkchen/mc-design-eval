// Shared style-palette access (T-004-02).
//
// Consumer #1 of the T-001-04 palette whitelist (palettes/README.md): the single-
// shot archetype injects a palette's `blocks` into the trial prompt as the binding
// material constraint (spec §6/§7). This module is the seam that turns a palette id
// into prompt-ready material; the future E-04 adherence check is consumer #2 and
// can share it.
//
// It reads palette *data* by file path — it does NOT import the `palettes/` module
// (which carries its own validator + node_modules). It does NOT re-validate: a
// palette is validated at authoring time by `palettes/validate.mjs` (the
// authority); this is a plain data read. `loadPalette` is the only I/O;
// `formatPaletteBlocks` is pure and unit-tested.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

/**
 * @typedef {Object} Palette A style palette (T-001-04). See palettes/palette.schema.json.
 * @property {string} id                  kebab-case style id (the file stem)
 * @property {string} name                human display name
 * @property {string} minecraftVersion    Java version the block ids are valid for
 * @property {string} description          one-line, prompt-facing material intent
 * @property {string[]} blocks            THE whitelist — bare block ids (single source of truth)
 * @property {Record<string, string[]>} [groups] advisory grouping; every member also in `blocks`
 */

const here = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the sibling palettes/ data directory (T-001-04). */
export const PALETTES_DIR = resolve(here, "..", "palettes");

/**
 * Load a palette by id from `palettes/<id>.json`. The id is the file stem and the
 * palette's own `id` field (e.g. "industrial"). Throws a clear, actionable error
 * if no such palette file exists — a misconfigured archetype must fail before any
 * metered call.
 * @param {string} id
 * @returns {Palette}
 */
export function loadPalette(id) {
  if (typeof id !== "string" || id.length === 0) {
    throw new Error("loadPalette: palette id must be a non-empty string");
  }
  const path = join(PALETTES_DIR, `${id}.json`);
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch (err) {
    if (err && err.code === "ENOENT") {
      throw new Error(`unknown palette "${id}" (looked in ${PALETTES_DIR})`);
    }
    throw err;
  }
  return /** @type {Palette} */ (JSON.parse(raw));
}

/**
 * Render a palette's whitelist as prompt-ready text. When the palette declares
 * `groups`, the blocks are presented group-by-group (the legible "structure /
 * metal / glazing / accent" framing T-001-04 built `groups` for), with any blocks
 * absent from every group collected under "other"; otherwise a single flat list.
 * Bare names exactly as authored (the prompt instructs `minecraft:`-prefixed
 * emission separately). Pure and deterministic — stable key order, no I/O.
 * @param {Palette} palette
 * @returns {string}
 */
export function formatPaletteBlocks(palette) {
  const blocks = (palette && palette.blocks) || [];
  const groups = palette && palette.groups;
  if (!groups) return blocks.join(", ");

  const lines = [];
  const grouped = new Set();
  for (const [group, members] of Object.entries(groups)) {
    for (const m of members) grouped.add(m);
    lines.push(`- ${group}: ${members.join(", ")}`);
  }
  const other = blocks.filter((b) => !grouped.has(b));
  if (other.length) lines.push(`- other: ${other.join(", ")}`);
  return lines.join("\n");
}
