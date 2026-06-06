// Value-true palette resolver (T-039-01, story S-039, epic E-14).
//
// THE SHARED COLOR CONTRACT. The E-13 frontier showed the dominant failure on angular forms was
// VALUE DRIFT, not structure or palette identity: the design doc *names* a block, the concept
// preview shows a *hue*, and only the render exposes the block's true *value* (L*) — and the three
// were never pinned to one source of truth. `resolveValueTruePalette` pins all three to the
// committed block->Lab table up front. Given a design's proposed palette (block names, optionally
// with proposed colors), it returns a VALUE-HONEST CARD: per block the real, full-cube, survival
// block id it actually maps to, that block's true rendered hex/Lab and L* value, and whether the
// name had to be SNAPPED (it was non-cube / biome-tinted / imaginary). The card is the contract
// S-040 (concept swatch grid) and S-041 (build target values) both import — designed for both.
//
// PURE, GL-FREE, NETWORK-FREE. The whole call chain is committed-JSON read (loadBlockTable, via
// resolvePalette) + arithmetic (srgbToLab, nearestLab). No model, no Playwright/headless-gl, no
// network — so it runs under the `src/**/*.test.mjs` glob with nothing mocked.
//
// REUSE: every piece of color math is borrowed from epic E-10's engine — srgbToLab/nearestLab
// (cielab.mjs, the portable core) and resolvePalette/rgbToHex (palette-extract.mjs). This module
// adds ZERO new color math and no Minecraft/asset/GL deps, so it stays on the pure runtime path and
// leaves cielab.mjs's reuse boundary untouched.
//
// KEY INVARIANT (from block-table.mjs's classifier): the table contains ONLY real, survival-
// obtainable, full-cube, untinted blocks. So "is a real full-cube block" === "present in the table".
// That equivalence is the spine of the resolve order below.

import { srgbToLab, nearestLab } from "./cielab.mjs";
import { resolvePalette, rgbToHex } from "./palette-extract.mjs";

/** Schema tag stamped on the returned card so downstream (S-040/S-041) can version-check it. */
export const VALUE_TRUE_SCHEMA = "value-true-palette/v1";

const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

// --- table candidates (lazy, memoized once — mirrors palette-extract's TABLE-at-load pattern) ---

let _memo = null;

/**
 * The full table as nearest-ready candidates, plus name and stemmed-token indexes.
 * Memoized: the committed table never changes within a process.
 * @returns {{candidates:{key:string,lab:number[],rgb:number[]}[],
 *   byName:Map<string,{key:string,lab:number[],rgb:number[]}>,
 *   tokenIndex:{key:string,tokens:Set<string>}[]}}
 */
function candidatesOnce() {
  if (_memo) return _memo;
  const candidates = resolvePalette().palette; // [{ key, lab, rgb }] — full survival full-cube set
  const byName = new Map(candidates.map((e) => [e.key, e]));
  const tokenIndex = candidates.map((e) => ({ key: e.key, tokens: stemTokens(e.key) }));
  _memo = { candidates, byName, tokenIndex };
  return _memo;
}

// --- pure helpers ----------------------------------------------------------

/** Normalize a block id: trim, lowercase, strip a leading `namespace:` (drops `minecraft:`). */
export function normalizeName(raw) {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new Error(`resolveValueTruePalette: block name must be a non-empty string, got ${raw}`);
  }
  return raw.trim().toLowerCase().replace(/^[a-z0-9_]+:/, "");
}

/**
 * Parse a `#rrggbb` / `rrggbb` hex string into an 8-bit [r,g,b] triple. Exported as a small,
 * reusable utility for callers building color hints from concept output.
 * @param {string} hex
 * @returns {[number,number,number]}
 */
export function hexToRgb(hex) {
  if (typeof hex !== "string") throw new Error(`hexToRgb: expected a string, got ${hex}`);
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`hexToRgb: expected "#rrggbb", got "${hex}"`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Coerce a color hint (hex string | [r,g,b]) to a validated 8-bit triple, or null if absent. */
function toRgbHint(v) {
  if (v == null) return null;
  if (typeof v === "string") return hexToRgb(v);
  if (Array.isArray(v) && v.length === 3) {
    for (const c of v) {
      if (typeof c !== "number" || !Number.isFinite(c) || c < 0 || c > 255) {
        throw new Error(`resolveValueTruePalette: hint rgb channels must be 0–255, got ${v}`);
      }
    }
    return [v[0], v[1], v[2]];
  }
  throw new Error(`resolveValueTruePalette: color hint must be "#rrggbb" or [r,g,b], got ${v}`);
}

/** Split a block id into stemmed tokens: split on `_`, drop a trailing plural `s` (len>3). */
export function stemTokens(id) {
  const out = new Set();
  for (const tok of id.split("_")) {
    if (!tok) continue;
    out.add(tok.length > 3 && tok.endsWith("s") ? tok.slice(0, -1) : tok);
  }
  return out;
}

/**
 * Normalize any accepted input into deduped `[{ name, hint }]`. Accepts a `string[]` (items may be
 * a bare string or `{ name, hex?|rgb? }`), a `{ manifest:[...] }`, or a DesignArtifact with
 * `palette.manifest`. `hints` (name -> hex|rgb) supplies colors out-of-band. Dedupe is by
 * normalized name, first occurrence wins (a palette is a set).
 */
function toEntries(input, hints) {
  let items;
  if (Array.isArray(input)) items = input;
  else if (input && input.palette && Array.isArray(input.palette.manifest)) {
    items = input.palette.manifest;
  } else if (input && Array.isArray(input.manifest)) items = input.manifest;
  else {
    throw new Error(
      "resolveValueTruePalette: expected string[], { manifest }, or a DesignArtifact with palette.manifest",
    );
  }
  if (items.length === 0) {
    throw new Error("resolveValueTruePalette: palette is empty (no block names to resolve)");
  }
  const seen = new Set();
  const entries = [];
  for (const it of items) {
    let name;
    let rawHint;
    if (typeof it === "string") {
      name = normalizeName(it);
    } else if (it && typeof it === "object" && typeof it.name === "string") {
      name = normalizeName(it.name);
      rawHint = it.hex ?? it.rgb;
    } else {
      throw new Error(`resolveValueTruePalette: palette item must be a string or { name }, got ${it}`);
    }
    if (seen.has(name)) continue;
    seen.add(name);
    const hint = toRgbHint(rawHint ?? hints[name]);
    entries.push({ name, hint });
  }
  return entries;
}

/**
 * Derive a proxy color for a name absent from the table, by matching table block names on stemmed
 * tokens. Returns the rgb of the best-scoring table block. Total tiebreak: most shared tokens →
 * fewest total tokens (closest) → shortest name → lexicographic. Throws if no table block shares a
 * single token (a name with no color signal — caller should pass a hint instead).
 * @returns {[number,number,number]}
 */
function deriveProxyRgb(name) {
  const { byName, tokenIndex } = candidatesOnce();
  const want = stemTokens(name);
  let best = null;
  for (const { key, tokens } of tokenIndex) {
    let shared = 0;
    for (const t of want) if (tokens.has(t)) shared++;
    if (shared === 0) continue;
    const cand = { key, shared, ntokens: tokens.size, len: key.length };
    if (
      best === null ||
      cand.shared > best.shared ||
      (cand.shared === best.shared &&
        (cand.ntokens < best.ntokens ||
          (cand.ntokens === best.ntokens &&
            (cand.len < best.len || (cand.len === best.len && cand.key < best.key)))))
    ) {
      best = cand;
    }
  }
  if (best === null) {
    throw new Error(
      `resolveValueTruePalette: cannot resolve "${name}" — not a real block and no name token ` +
        `matches the table. Pass a color hint (hex/rgb) so it can snap by ΔE.`,
    );
  }
  return byName.get(best.key).rgb;
}

/** Build one value-honest card row from a resolved table entry. */
function makeCard(name, blockId, entry, snapped, deltaE) {
  return {
    name, // requested id, normalized — the ORIGINAL is preserved here even when snapped
    block: blockId, // the REAL full-cube table id this maps to (what S-041 places)
    hex: rgbToHex(entry.rgb), // true rendered color (what S-040's swatch grid shows)
    rgb: entry.rgb,
    lab: entry.lab, // table Lab (3-dec)
    value: round1(entry.lab[0]), // L* — the value-honest number, the point of S-039
    snapped,
    deltaE, // 0 for passthrough; honest ΔE(wished→matched) for a snap
  };
}

/** Resolve a single normalized entry to its card row. */
function resolveOne(entry) {
  const { candidates, byName } = candidatesOnce();
  const direct = byName.get(entry.name);
  if (direct) {
    // Real full-cube block: value-honesty means it renders as ITSELF. A hint never overrides truth.
    return makeCard(entry.name, direct.key, direct, false, 0);
  }
  // Not a real block: snap by ΔE. Color source = caller hint, else derived from the name.
  const proxyRgb = entry.hint ?? deriveProxyRgb(entry.name);
  const hit = nearestLab(srgbToLab(proxyRgb), candidates); // { key, deltaE, lab }
  const matched = byName.get(hit.key);
  return makeCard(entry.name, hit.key, matched, true, round2(hit.deltaE));
}

/**
 * Snap a design's proposed palette to the block→Lab table and emit a value-honest card.
 *
 * @param {string[] | {manifest:string[]} | {palette:{manifest:string[]}}} input
 *   Block names (namespaced or bare). Array items may be `"name"` or `{ name, hex?|rgb? }`.
 * @param {{ hints?: Record<string, string|number[]> }} [opts]
 *   `hints`: name → proposed color (hex or [r,g,b]) for names absent from the table.
 * @returns {{schema:string, card:object[], manifest:string[], snappedCount:number}}
 *   `card` (deduped by name, first-seen order); `manifest` (deduped real block ids to place);
 *   `snappedCount` (health signal for the co-design gate).
 */
export function resolveValueTruePalette(input, opts = {}) {
  const entries = toEntries(input, opts.hints || {});
  const card = entries.map(resolveOne);
  const manifest = [];
  const seenBlocks = new Set();
  for (const c of card) {
    if (!seenBlocks.has(c.block)) {
      seenBlocks.add(c.block);
      manifest.push(c.block);
    }
  }
  return {
    schema: VALUE_TRUE_SCHEMA,
    card,
    manifest,
    snappedCount: card.filter((c) => c.snapped).length,
  };
}
