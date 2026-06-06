// LLM material-map PARSE + VALIDATE core (E-21 / S-071 / T-071-01) — the PURE heart of the "define
// style" step. A multimodal BAML function (baml_src/materialmap.baml) names the material per region
// from the concept image + design doc; this module turns its RAW reply into a clean, validated
// material map `[{ role, block, placementRule, rationale }]` — or a clear record of what was dropped.
//
// WHY THIS EXISTS: mean-color CIE-Lab matching COLLAPSES near-tone-distinct materials (stone_bricks vs
// cobblestone — a deliberate concept distinction merged into one grey). The model that SEES the concept
// names them apart. This core never merges by color — it only validates membership and shape, so a
// preserved distinction stays preserved. `preservesDistinctGreys` makes that property TESTABLE.
//
// PURITY (the project idiom — runs under `node --test "src/**/*.test.mjs"`): no GL, no I/O, no BAML, no
// network, no Date/random. The LIVE multimodal call + fence-strip live in the tsx bridge
// (src/form/material-map.mts); the impure runner (benchmarks/sculpture/material-map.mjs) does file I/O.
//
// REUSE, NOT REIMPLEMENTATION: the namespace boundary (tableKey/blockId) is material.mjs; the survival
// block vocabulary + Lab values are the E-10 block→Lab table (block-table.mjs). No new color math.
//
// COLLECT-DON'T-THROW: the live call is METERED — one hallucinated block id must not void an otherwise
// good map. `parseMaterialMap` collects bad rows into `dropped` (loud, surfaced by the runner) and keeps
// the rest. `assertMaterialMap` is the consumer-side guard for a map that came back entirely empty.

import { tableKey, blockId } from "../sculptor/material.mjs";
import { loadBlockTable } from "../color/block-table.mjs";

/** The committed block→Lab table, loaded once (runtime path, zero asset deps). The survival vocabulary. */
const TABLE = loadBlockTable();
const TABLE_INDEX = new Map(TABLE.blocks.map((b) => [b.block, b]));

/** The CLOSED region/feature vocabulary the AC names — the kebab form `placementRule` normalizes to. */
export const PLACEMENT_RULES = Object.freeze([
  "walls",
  "corners-edges",
  "roof",
  "base",
  "trim",
  "openings",
]);

const RULE_SET = new Set(PLACEMENT_RULES);

/** BAML PascalCase enum → kebab vocabulary (+ identity for already-kebab and a couple of tolerant forms). */
export const PLACEMENT_RULE_MAP = Object.freeze({
  Walls: "walls",
  CornersEdges: "corners-edges",
  Roof: "roof",
  Base: "base",
  Trim: "trim",
  Openings: "openings",
});

/** Thrown by `assertMaterialMap` when the normalized map is empty/invalid — loud, never silent. */
export class MaterialMapError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = "MaterialMapError";
    this.code = context.code ?? "invalid_material_map";
    Object.assign(this, context);
  }
}

/**
 * Normalize a raw placementRule (PascalCase enum, kebab, spaced, or loose case) to the kebab vocabulary,
 * or `null` if it is not a recognized region. PURE.
 * @param {unknown} raw
 * @returns {string|null}
 */
export function normalizePlacementRule(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (PLACEMENT_RULE_MAP[trimmed]) return PLACEMENT_RULE_MAP[trimmed]; // exact PascalCase
  const kebab = trimmed
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2") // CornersEdges → Corners-Edges
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
  return RULE_SET.has(kebab) ? kebab : null;
}

/**
 * Normalize a raw block to a namespaced survival-block id (`minecraft:<bare>`), or `null` if it is not a
 * string. Does NOT check table membership (that is `isKnownBlock`). PURE.
 * @param {unknown} raw
 * @returns {string|null}
 */
export function normalizeBlock(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return blockId(tableKey(trimmed)); // strip any namespace then re-add minecraft: — canonical form
}

/**
 * Is `raw` a real survival block — i.e. `tableKey(raw)` is present in the block→Lab table? PURE.
 * `table` is injectable for tests (default is the committed table).
 * @param {unknown} raw
 * @param {{blocks: Array<{block:string}>}} [table]
 * @returns {boolean}
 */
export function isKnownBlock(raw, table) {
  if (typeof raw !== "string") return false;
  const key = tableKey(raw.trim());
  if (!table) return TABLE_INDEX.has(key);
  return table.blocks.some((b) => b.block === key);
}

/** The Lab triple for a block id (namespaced or bare), or `null` if not in the table. PURE. */
function labOf(block) {
  const row = TABLE_INDEX.get(tableKey(block));
  return row ? row.lab : null;
}

const dedupKey = (e) => `${e.block}|${e.placementRule}`;

/**
 * Parse + validate a RAW model reply (already JSON-parsed) into a clean material map. PURE.
 * Drops invalid rows into `dropped` (collect-don't-throw) — never merges by color.
 *
 * Validation per entry:
 *   - `role` must be a non-empty string;
 *   - `placementRule` must normalize into the closed vocabulary;
 *   - `block` must be a real survival block (table membership) — the design-doc palette is a PRIOR, the
 *     map is NOT capped to it (the LLM may add concept-justified blocks back), so the ONLY block gate is
 *     "is it a real block";
 *   - duplicates on `(block, placementRule)` keep the first.
 *
 * @param {{materials?: Array<object>}} rawObj  the model reply, `{ materials:[…] }`
 * @param {{table?: object}} [opts]
 * @returns {{ map: Array<{role,block,placementRule,rationale}>, dropped: Array<{reason,entry}>,
 *            palette: string[], stats: object }}
 */
export function parseMaterialMap(rawObj, opts = {}) {
  const table = opts.table;
  const rows = Array.isArray(rawObj?.materials) ? rawObj.materials : [];
  const map = [];
  const dropped = [];
  const seen = new Set();

  for (const entry of rows) {
    if (!entry || typeof entry !== "object") {
      dropped.push({ reason: "not-an-object", entry });
      continue;
    }
    const role = typeof entry.role === "string" ? entry.role.trim() : "";
    if (!role) {
      dropped.push({ reason: "empty-role", entry });
      continue;
    }
    const placementRule = normalizePlacementRule(entry.placementRule);
    if (!placementRule) {
      dropped.push({ reason: "unknown-placement-rule", entry });
      continue;
    }
    const block = normalizeBlock(entry.block);
    if (!block) {
      dropped.push({ reason: "missing-block", entry });
      continue;
    }
    if (!isKnownBlock(block, table)) {
      dropped.push({ reason: "unknown-block", entry });
      continue;
    }
    const clean = {
      role,
      block,
      placementRule,
      rationale: typeof entry.rationale === "string" ? entry.rationale.trim() : "",
    };
    const k = dedupKey(clean);
    if (seen.has(k)) {
      dropped.push({ reason: "duplicate", entry });
      continue;
    }
    seen.add(k);
    map.push(clean);
  }

  const palette = paletteFromMap(map);
  const stats = {
    in: rows.length,
    kept: map.length,
    dropped: dropped.length,
    distinctBlocks: palette.length,
    placementRules: [...new Set(map.map((e) => e.placementRule))],
  };
  return { map, dropped, palette, stats };
}

/**
 * Assert a normalized map is non-empty and well-formed. Throws `MaterialMapError`. The consumer-side
 * guard (the `assertArtifact` idiom): a metered call that returned nothing usable should fail loudly.
 * @param {Array<{role,block,placementRule}>} map
 */
export function assertMaterialMap(map) {
  if (!Array.isArray(map) || map.length === 0) {
    throw new MaterialMapError("material map is empty", { code: "empty_material_map" });
  }
  for (const e of map) {
    if (!e || !e.role || !e.block || !RULE_SET.has(e.placementRule)) {
      throw new MaterialMapError("material map has an invalid entry", { code: "invalid_entry", entry: e });
    }
  }
}

/**
 * The distinct namespaced blocks in `map`, in first-seen order — "the map defines E-21's allowed
 * palette" (AC). The bridge to the downstream geometric-feature assignment. PURE.
 * @param {Array<{block:string}>} map
 * @returns {string[]}
 */
export function paletteFromMap(map) {
  const out = [];
  const seen = new Set();
  for (const e of map ?? []) {
    if (e?.block && !seen.has(e.block)) {
      seen.add(e.block);
      out.push(e.block);
    }
  }
  return out;
}

/**
 * Pairs of DISTINCT blocks in the map whose table Lab LIGHTNESS (L*) is within `tol` — the materials a
 * mean-color match would be at risk of collapsing. Returns `[blockA, blockB, dL]` (dL = |L*a − L*b|),
 * ascending dL. PURE. Default tol=12 L* — near-tone, the stone_bricks/cobblestone regime.
 * @param {Array<{block:string}>} map
 * @param {{tol?:number}} [opts]
 * @returns {Array<[string, string, number]>}
 */
export function nearTonePairs(map, opts = {}) {
  const tol = opts.tol ?? 12;
  const blocks = paletteFromMap(map);
  const pairs = [];
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const la = labOf(blocks[i]);
      const lb = labOf(blocks[j]);
      if (!la || !lb) continue;
      const dL = Math.abs(la[0] - lb[0]);
      if (dL <= tol) pairs.push([blocks[i], blocks[j], Math.round(dL * 1000) / 1000]);
    }
  }
  return pairs.sort((a, b) => a[2] - b[2]);
}

/**
 * Does the map PRESERVE at least one near-tone material distinction? True iff it contains TWO DISTINCT
 * near-tone blocks (`nearTonePairs` non-empty) — two distinct block ids ARE two distinct materials, so a
 * surviving near-tone pair is exactly a distinction a mean-color match would have collapsed (the AC#2
 * property: gatehouse keeps stone_bricks AND cobblestone, not one merged grey). PURE.
 * @param {Array<{role,block}>} map
 * @param {{tol?:number}} [opts]
 * @returns {boolean}
 */
export function preservesDistinctGreys(map, opts = {}) {
  return nearTonePairs(map, opts).length > 0;
}
