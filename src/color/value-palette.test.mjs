// Unit suite for the value-true palette resolver (T-039-01, story S-039, epic E-14).
//
// Offline, deterministic, no model/GL/network — auto-collected by the `src/**/*.test.mjs` glob.
// Fixtures use REAL ids from the committed table: `gray_concrete` (present), `oak_stairs` (non-cube,
// absent), `gold_leaf` (imaginary, absent) — the exact AC cases. Tests assert PROPERTIES (snapped,
// real-id membership, determinism, value-honesty) plus pin the deterministic snap targets so the
// determinism AC is locked, not brittle exact-Lab numbers.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveValueTruePalette,
  hexToRgb,
  normalizeName,
  stemTokens,
  VALUE_TRUE_SCHEMA,
} from "./value-palette.mjs";
import { loadBlockTable } from "./block-table.mjs";

const TABLE = loadBlockTable();
const TABLE_NAMES = new Set(TABLE.blocks.map((b) => b.block));
const HEX_RE = /^#[0-9a-f]{6}$/;
const round1 = (n) => Math.round(n * 10) / 10;

// --- Group A: passthrough (real full-cube blocks) -------------------------

test("A: a real block passes through with its table value, unsnapped, ΔE 0", () => {
  const row = TABLE.blocks.find((b) => b.block === "gray_concrete");
  const { card } = resolveValueTruePalette(["gray_concrete"]);
  assert.equal(card.length, 1);
  const c = card[0];
  assert.equal(c.snapped, false);
  assert.equal(c.name, "gray_concrete");
  assert.equal(c.block, "gray_concrete");
  assert.equal(c.deltaE, 0);
  assert.deepEqual(c.lab, row.lab);
  assert.deepEqual(c.rgb, row.rgb);
  assert.equal(c.value, round1(row.lab[0]));
});

test("A: namespaced `minecraft:` input normalizes to the same row", () => {
  const bare = resolveValueTruePalette(["gray_concrete"]).card[0];
  const ns = resolveValueTruePalette(["minecraft:gray_concrete"]).card[0];
  assert.deepEqual(ns, bare);
});

test("A: a color hint does NOT override a real block (value-honesty)", () => {
  // Hint a wildly different color; the real block must still report its own table value.
  const { card } = resolveValueTruePalette([{ name: "gray_concrete", hex: "#ff0000" }]);
  assert.equal(card[0].snapped, false);
  assert.equal(card[0].block, "gray_concrete");
  assert.equal(card[0].deltaE, 0);
});

// --- Group B: snap of non-cube + imaginary names (the AC) -----------------

test("B: a non-cube name (oak_stairs) snaps to a real full-cube block, name preserved", () => {
  const { card } = resolveValueTruePalette(["oak_stairs"]);
  const c = card[0];
  assert.equal(c.snapped, true);
  assert.equal(c.name, "oak_stairs"); // original preserved
  assert.ok(TABLE_NAMES.has(c.block), `block ${c.block} must be a real table id`);
  assert.notEqual(c.block, "oak_stairs");
  assert.equal(c.block, "oak_log"); // deterministic token-snap target (oak_* cube)
});

test("B: an imaginary name (gold_leaf) snaps to a real full-cube block, name preserved", () => {
  const { card } = resolveValueTruePalette(["gold_leaf"]);
  const c = card[0];
  assert.equal(c.snapped, true);
  assert.equal(c.name, "gold_leaf"); // original preserved
  assert.ok(TABLE_NAMES.has(c.block), `block ${c.block} must be a real table id`);
  assert.equal(c.block, "gold_ore"); // deterministic token-snap (shares `gold`, shortest tiebreak)
});

// --- Group C: hinted snap (the co-design path) ----------------------------

test("C: a hinted imaginary name snaps to the nearest table block by ΔE (ΔE > 0)", () => {
  // A teal that is no real block — must snap to the nearest, with a positive honest ΔE.
  const { card } = resolveValueTruePalette([{ name: "mithril", hex: "#1f8a7a" }]);
  const c = card[0];
  assert.equal(c.snapped, true);
  assert.equal(c.name, "mithril");
  assert.ok(TABLE_NAMES.has(c.block));
  assert.ok(c.deltaE > 0, `expected positive ΔE, got ${c.deltaE}`);
});

test("C: a hint equal to a real block's exact rgb lands on that block with tiny ΔE", () => {
  const target = TABLE.blocks.find((b) => b.block === "gold_block");
  const { card } = resolveValueTruePalette([{ name: "fake_gold", rgb: target.rgb }]);
  const c = card[0];
  assert.equal(c.snapped, true);
  assert.equal(c.block, "gold_block");
  assert.ok(c.deltaE < 0.5, `expected ~0 ΔE, got ${c.deltaE}`);
});

// --- Group D: determinism + dedupe ----------------------------------------

test("D: two identical calls produce deep-equal output", () => {
  const input = ["minecraft:gray_concrete", "oak_stairs", "gold_leaf"];
  assert.deepEqual(resolveValueTruePalette(input), resolveValueTruePalette(input));
});

test("D: card is deduped by name; manifest deduped & first-seen ordered; snappedCount correct", () => {
  const r = resolveValueTruePalette([
    "gray_concrete",
    "minecraft:gray_concrete", // dup after normalization
    "oak_stairs",
    "gold_leaf",
  ]);
  assert.equal(r.card.length, 3); // dup collapsed
  assert.deepEqual(
    r.card.map((c) => c.name),
    ["gray_concrete", "oak_stairs", "gold_leaf"],
  );
  assert.deepEqual(r.manifest, ["gray_concrete", "oak_log", "gold_ore"]);
  assert.equal(r.snappedCount, 2);
  assert.equal(r.schema, VALUE_TRUE_SCHEMA);
});

// --- Group E: input unions & errors ---------------------------------------

test("E: accepts string[], {manifest}, and a DesignArtifact {palette:{manifest}}", () => {
  const names = ["gray_concrete", "gold_leaf"];
  const a = resolveValueTruePalette(names);
  const b = resolveValueTruePalette({ manifest: names });
  const c = resolveValueTruePalette({ palette: { manifest: names } });
  assert.deepEqual(b, a);
  assert.deepEqual(c, a);
});

test("E: empty palette throws", () => {
  assert.throws(() => resolveValueTruePalette([]), /empty/);
  assert.throws(() => resolveValueTruePalette({ manifest: [] }), /empty/);
});

test("E: bad input shape throws", () => {
  assert.throws(() => resolveValueTruePalette(42), /expected string\[\]/);
  assert.throws(() => resolveValueTruePalette([{ noName: 1 }]), /must be a string or/);
});

test("E: an imaginary name with no token signal and no hint throws actionably", () => {
  // `zzqqxx` shares no token with any table id and has no hint → cannot snap honestly.
  assert.throws(() => resolveValueTruePalette(["zzqqxx"]), /cannot resolve "zzqqxx"/);
});

// --- Group F: value-honesty contract --------------------------------------

test("F: every card row carries a value-honest L* and a #rrggbb hex", () => {
  const { card } = resolveValueTruePalette([
    "gray_concrete",
    "oak_stairs",
    { name: "mithril", hex: "#1f8a7a" },
  ]);
  for (const c of card) {
    assert.equal(c.value, round1(c.lab[0]), `value must equal round1(L*) for ${c.name}`);
    assert.ok(HEX_RE.test(c.hex), `hex ${c.hex} must be #rrggbb`);
    assert.ok(TABLE_NAMES.has(c.block), `${c.block} must be a real table id`);
    assert.equal(typeof c.snapped, "boolean");
  }
});

// --- Group G: exported helpers --------------------------------------------

test("G: hexToRgb / normalizeName / stemTokens behave", () => {
  assert.deepEqual(hexToRgb("#ff8800"), [255, 136, 0]);
  assert.deepEqual(hexToRgb("ff8800"), [255, 136, 0]);
  assert.throws(() => hexToRgb("#xyz"), /expected "#rrggbb"/);
  assert.equal(normalizeName("MineCraft:Gray_Concrete"), "gray_concrete");
  assert.throws(() => normalizeName(""), /non-empty string/);
  assert.deepEqual([...stemTokens("stone_brick_stairs")].sort(), ["brick", "stair", "stone"]);
});
