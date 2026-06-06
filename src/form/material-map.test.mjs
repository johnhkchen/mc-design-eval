// Unit tests for the E-21 material-map parse/validate core (T-071-01). PURE — no GL, no I/O, no BAML,
// no live call. Guards: the closed placementRule vocabulary; the normalizers (PascalCase/kebab/spaced/
// unknown); block membership against the survival table (real + injected stub); parseMaterialMap's
// collect-don't-throw (bad rows → `dropped`, never thrown), dedup, palette, stats; assertMaterialMap;
// and the AC#2 near-tone-preservation property (gatehouse keeps stone_bricks AND cobblestone).

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PLACEMENT_RULES,
  PLACEMENT_RULE_MAP,
  MaterialMapError,
  normalizePlacementRule,
  normalizeBlock,
  isKnownBlock,
  parseMaterialMap,
  assertMaterialMap,
  paletteFromMap,
  nearTonePairs,
  preservesDistinctGreys,
} from "./material-map.mjs";

// A gatehouse-like reply: the canonical collapse case — four near-tone greys/browns the design doc names.
const GATEHOUSE_RAW = {
  materials: [
    { role: "structural walls", block: "minecraft:stone_bricks", placementRule: "Walls", rationale: "smooth brick coursing on the field" },
    { role: "corner buttresses", block: "cobblestone", placementRule: "CornersEdges", rationale: "rough cobble grain on the quoins" },
    { role: "roof", block: "deepslate_tiles", placementRule: "Roof", rationale: "dark cool roof" },
    { role: "arch voussoir", block: "dark_oak_log", placementRule: "Trim", rationale: "warm timber ring round the gate" },
  ],
};

// A 4-row stub table whose membership we control (decoupled from the committed 305-table).
const STUB_TABLE = {
  blocks: [
    { block: "stone_bricks", lab: [52, 0, 0] },
    { block: "cobblestone", lab: [51, 0, 0] },
    { block: "deepslate_tiles", lab: [22, 0, 0] },
    { block: "dark_oak_log", lab: [25, 4, 8] },
  ],
};

test("PLACEMENT_RULES: the closed, frozen region vocabulary", () => {
  assert.deepEqual([...PLACEMENT_RULES].sort(), ["base", "corners-edges", "openings", "roof", "trim", "walls"]);
  assert.throws(() => PLACEMENT_RULES.push("x"), TypeError);
});

test("normalizePlacementRule: PascalCase, kebab, spaced, loose, unknown→null", () => {
  assert.equal(normalizePlacementRule("Walls"), "walls");
  assert.equal(normalizePlacementRule("CornersEdges"), "corners-edges");
  assert.equal(normalizePlacementRule("corners-edges"), "corners-edges");
  assert.equal(normalizePlacementRule("Corners Edges"), "corners-edges");
  assert.equal(normalizePlacementRule("ROOF"), "roof");
  assert.equal(normalizePlacementRule("base_course"), null); // not a vocabulary term
  assert.equal(normalizePlacementRule("gable"), null);
  assert.equal(normalizePlacementRule(42), null);
  for (const r of PLACEMENT_RULES) assert.equal(normalizePlacementRule(r), r); // idempotent on kebab
});

test("PLACEMENT_RULE_MAP: every PascalCase enum maps to a vocabulary term", () => {
  for (const [pascal, kebab] of Object.entries(PLACEMENT_RULE_MAP)) {
    assert.ok(PLACEMENT_RULES.includes(kebab), `${pascal} → ${kebab} in vocab`);
  }
});

test("normalizeBlock: bare→namespaced, namespaced passthrough, non-string→null", () => {
  assert.equal(normalizeBlock("cobblestone"), "minecraft:cobblestone");
  assert.equal(normalizeBlock("minecraft:stone_bricks"), "minecraft:stone_bricks");
  assert.equal(normalizeBlock("  spruce_planks  "), "minecraft:spruce_planks");
  assert.equal(normalizeBlock("othermod:foo"), "minecraft:foo"); // namespace stripped then re-canonicalized
  assert.equal(normalizeBlock(""), null);
  assert.equal(normalizeBlock(null), null);
  assert.equal(normalizeBlock(7), null);
});

test("isKnownBlock: real table + injected stub", () => {
  // real committed table — the collapse case is present and distinct as ids
  assert.equal(isKnownBlock("stone_bricks"), true);
  assert.equal(isKnownBlock("minecraft:cobblestone"), true);
  assert.equal(isKnownBlock("deepslate_tiles"), true);
  assert.equal(isKnownBlock("not_a_real_block"), false);
  assert.equal(isKnownBlock(123), false);
  // injected stub — membership follows the stub, not the real table
  assert.equal(isKnownBlock("stone_bricks", STUB_TABLE), true);
  assert.equal(isKnownBlock("oak_planks", STUB_TABLE), false); // real block, absent from the stub
});

test("parseMaterialMap: happy path keeps all four near-tone materials", () => {
  const { map, dropped, palette, stats } = parseMaterialMap(GATEHOUSE_RAW);
  assert.equal(map.length, 4);
  assert.equal(dropped.length, 0);
  assert.deepEqual(palette, [
    "minecraft:stone_bricks",
    "minecraft:cobblestone",
    "minecraft:deepslate_tiles",
    "minecraft:dark_oak_log",
  ]);
  assert.equal(stats.in, 4);
  assert.equal(stats.kept, 4);
  assert.equal(stats.distinctBlocks, 4);
  // placementRules normalized to kebab
  assert.deepEqual(map.map((e) => e.placementRule), ["walls", "corners-edges", "roof", "trim"]);
  assert.equal(map[1].rationale, "rough cobble grain on the quoins");
});

test("parseMaterialMap: unknown block is DROPPED, not thrown (collect-don't-throw)", () => {
  const raw = { materials: [...GATEHOUSE_RAW.materials, { role: "x", block: "unobtanium", placementRule: "Walls" }] };
  const { map, dropped } = parseMaterialMap(raw);
  assert.equal(map.length, 4);
  assert.equal(dropped.length, 1);
  assert.equal(dropped[0].reason, "unknown-block");
});

test("parseMaterialMap: bad placementRule and empty role are dropped with reasons", () => {
  const raw = {
    materials: [
      { role: "ok", block: "stone_bricks", placementRule: "Gable" }, // not a vocab term
      { role: "", block: "cobblestone", placementRule: "Walls" }, // empty role
      { role: "noblock", placementRule: "Roof" }, // missing block
      "garbage", // not an object
    ],
  };
  const { map, dropped } = parseMaterialMap(raw);
  assert.equal(map.length, 0);
  assert.deepEqual(
    dropped.map((d) => d.reason).sort(),
    ["empty-role", "missing-block", "not-an-object", "unknown-placement-rule"],
  );
});

test("parseMaterialMap: dedup on (block, placementRule) keeps the first", () => {
  const raw = {
    materials: [
      { role: "walls a", block: "stone_bricks", placementRule: "Walls", rationale: "first" },
      { role: "walls b", block: "minecraft:stone_bricks", placementRule: "Walls", rationale: "dup" },
      { role: "walls-as-trim", block: "stone_bricks", placementRule: "Trim" }, // same block, diff rule → kept
    ],
  };
  const { map, dropped } = parseMaterialMap(raw);
  assert.equal(map.length, 2);
  assert.equal(map[0].rationale, "first");
  assert.equal(dropped.length, 1);
  assert.equal(dropped[0].reason, "duplicate");
});

test("parseMaterialMap: membership uses the injected table when provided", () => {
  const raw = { materials: [{ role: "x", block: "oak_planks", placementRule: "Walls" }] };
  assert.equal(parseMaterialMap(raw).map.length, 1); // real table has oak_planks
  assert.equal(parseMaterialMap(raw, { table: STUB_TABLE }).map.length, 0); // stub does not
});

test("parseMaterialMap: tolerates a missing/empty materials array", () => {
  assert.deepEqual(parseMaterialMap({}).map, []);
  assert.deepEqual(parseMaterialMap(null).map, []);
  assert.equal(parseMaterialMap({ materials: [] }).stats.in, 0);
});

test("paletteFromMap: distinct namespaced blocks, first-seen order", () => {
  const map = [
    { block: "minecraft:a" },
    { block: "minecraft:b" },
    { block: "minecraft:a" },
  ];
  assert.deepEqual(paletteFromMap(map), ["minecraft:a", "minecraft:b"]);
  assert.deepEqual(paletteFromMap([]), []);
});

test("assertMaterialMap: throws on empty / invalid, passes a good map", () => {
  assert.throws(() => assertMaterialMap([]), MaterialMapError);
  assert.throws(() => assertMaterialMap(null), MaterialMapError);
  assert.throws(
    () => assertMaterialMap([{ role: "x", block: "minecraft:stone", placementRule: "gable" }]),
    (e) => e instanceof MaterialMapError && e.code === "invalid_entry",
  );
  const good = parseMaterialMap(GATEHOUSE_RAW).map;
  assert.doesNotThrow(() => assertMaterialMap(good));
});

test("nearTonePairs: surfaces the stone_bricks/cobblestone near-tone collapse risk", () => {
  const map = parseMaterialMap(GATEHOUSE_RAW).map;
  const pairs = nearTonePairs(map);
  const hasGreyPair = pairs.some(
    ([a, b]) =>
      (a.includes("stone_bricks") && b.includes("cobblestone")) ||
      (a.includes("cobblestone") && b.includes("stone_bricks")),
  );
  assert.ok(hasGreyPair, "stone_bricks vs cobblestone is a near-tone pair");
  // a tiny tol finds nothing; pairs are sorted ascending by dL
  assert.equal(nearTonePairs(map, { tol: 0.001 }).length, 0);
  for (let i = 1; i < pairs.length; i++) assert.ok(pairs[i][2] >= pairs[i - 1][2]);
});

test("preservesDistinctGreys: true for the gatehouse map, false for a single-block map", () => {
  const map = parseMaterialMap(GATEHOUSE_RAW).map;
  assert.equal(preservesDistinctGreys(map), true); // AC#2: near-tone materials kept distinct
  const single = [{ role: "walls", block: "minecraft:stone_bricks", placementRule: "walls" }];
  assert.equal(preservesDistinctGreys(single), false); // one block → nothing to preserve
  // two FAR-tone blocks are not a "collapse risk" — preservation is about NEAR tones
  const farPair = [
    { role: "walls", block: "minecraft:white_concrete", placementRule: "walls" },
    { role: "roof", block: "minecraft:deepslate_tiles", placementRule: "roof" },
  ];
  assert.equal(preservesDistinctGreys(farPair), false);
});
