// Unit suite for the pre-spend registration smoke (T-120-01, S-120, E-30). Offline,
// deterministic, decode-free (the band-profile.test.mjs idiom — synthetic grids, no PNG ever
// loads, no network can be reached: zero spend is structural). The two AC fixtures live here at
// unit level: the barn-shaped flipped-field witness PASSES through the smoke (post-T-117), and a
// synthetic lens-unreadable concept is REFUSED with the lens's verbatim named reason.

import { test } from "node:test";
import assert from "node:assert/strict";

import { proxyGeometry, registrationSmoke, REGISTRATION_SMOKE_SCHEMA } from "./registration-smoke.mjs";
import { bandRefsFromZoneRecord } from "./kit.mjs";

/** Grid of `rows` specs: {width, key} paints `width` cells of `key` left-aligned in a 32-col row. */
function gridOf(rows, cols = 32) {
  const grid = rows.map(({ width, key }) => {
    const row = new Array(cols).fill(null);
    for (let x = 0; x < width; x++) row[x] = key;
    return row;
  });
  return { grid, n: cols, m: rows.length };
}

/** The barn transcription (the band-profile.test.mjs group-H literal — committed data, not tuning). */
const BARN_MAP = {
  map: [
    { role: "structural wall infill", block: "minecraft:cobblestone", placementRule: "walls" },
    { role: "buttress piers, quoins and opening frames", block: "minecraft:stone_bricks", placementRule: "corners-edges" },
    { role: "plinth / ground banding course", block: "minecraft:stone_bricks", placementRule: "base" },
    { role: "roof shingle planes", block: "minecraft:dark_oak_planks", placementRule: "roof" },
    { role: "wagon-door leaves", block: "minecraft:oak_planks", placementRule: "openings" },
  ],
  nearTonePairs: [
    { a: "minecraft:cobblestone", b: "minecraft:stone_bricks", dL: 2.082 },
    { a: "minecraft:cobblestone", b: "minecraft:oak_planks", dL: 3.26 },
    { a: "minecraft:stone_bricks", b: "minecraft:oak_planks", dL: 5.342 },
  ],
};

/** A plain readable map (cottage shape): plaster walls, spruce roof, log trim. */
const PLAIN_MAP = {
  map: [
    { role: "plaster infill", block: "minecraft:white_terracotta", placementRule: "walls" },
    { role: "timber frame", block: "minecraft:dark_oak_log", placementRule: "trim" },
    { role: "roof field", block: "minecraft:spruce_planks", placementRule: "roof" },
  ],
};

// --- proxyGeometry: the upperTop ladder --------------------------------------

test("proxyGeometry rung 1: a narrow widest-row bulge is the eave anchor", () => {
  // 8 roof rows ramping up, one 32-wide eave row, 14 wall rows at 28
  const rows = [];
  for (const w of [8, 12, 16, 20, 24, 26, 28, 30]) rows.push({ width: w, key: "spruce_planks" });
  rows.push({ width: 32, key: "white_terracotta" }); // the eave bulge (row 8)
  for (let i = 0; i < 14; i++) rows.push({ width: 28, key: "white_terracotta" });
  const p = proxyGeometry(gridOf(rows), PLAIN_MAP);
  assert.equal(p.undecidable, undefined);
  assert.equal(p.eave.source, "anchor");
  assert.equal(p.eave.row, 8);
  // rows 0..22 all inside the extent (floor 0.25·32 = 8); proxy y of row 8 = 22 - 8 = 14
  assert.equal(p.upperTop, 14);
  assert.equal(p.layerCounts.yMin, 0);
  assert.equal(p.layerCounts.counts.length, 23);
  // layer counts are the reversed in-extent row widths (the identity-shaped map)
  assert.equal(p.layerCounts.counts[0], 28);
  assert.equal(p.layerCounts.counts[22], 8);
  assert.deepEqual(p.floorLines, []);
});

test("proxyGeometry rung 2: flat-sided mass falls back to the roof-run bottom", () => {
  // constant width 32 → the plateau is the whole extent → anchor null
  const rows = [];
  for (let i = 0; i < 8; i++) rows.push({ width: 32, key: "spruce_planks" });
  for (let i = 0; i < 24; i++) rows.push({ width: 32, key: "white_terracotta" });
  const p = proxyGeometry(gridOf(rows), PLAIN_MAP);
  assert.equal(p.eave.source, "roof-run");
  assert.equal(p.eave.row, 8); // first row where field cells win
  assert.equal(p.upperTop, (31 - 8) + 1); // rows above map at/above the split
});

test("proxyGeometry rung 2 counts field THROUGH the near-tone resolution (the barn flip)", () => {
  // every wall cell flipped to the stone_bricks twin — a raw class scan would see zero field
  const rows = [];
  for (let i = 0; i < 8; i++) rows.push({ width: 32, key: "dark_oak_planks" });
  for (let i = 0; i < 32; i++) rows.push({ width: 32, key: "stone_bricks" });
  const p = proxyGeometry(gridOf(rows), BARN_MAP);
  assert.equal(p.eave.source, "roof-run");
  assert.equal(p.eave.row, 8);
});

test("proxyGeometry rung 3: no anchor and no roof class → named undecidable refusal", () => {
  const rows = [];
  for (let i = 0; i < 20; i++) rows.push({ width: 32, key: "white_terracotta" });
  const noRoofMap = { map: [{ role: "f", block: "minecraft:white_terracotta", placementRule: "walls" }] };
  const p = proxyGeometry(gridOf(rows), noRoofMap);
  assert.deepEqual(p, { undecidable: true, reason: "proxy-eave-undecidable" });
});

test("proxyGeometry: an empty grid refuses before anything else", () => {
  const p = proxyGeometry({ grid: [[null, null], [null, null]] }, PLAIN_MAP);
  assert.deepEqual(p, { undecidable: true, reason: "proxy-extent-empty" });
});

// --- registrationSmoke: pass paths -------------------------------------------

test("PASS end-to-end: a readable synthetic concept yields lens bands + a working kit dry-run", () => {
  const rows = [];
  for (let i = 0; i < 8; i++) rows.push({ width: 32, key: "spruce_planks" });
  for (let i = 0; i < 32; i++) rows.push({ width: 32, key: "white_terracotta" });
  const r = registrationSmoke({ gridResult: gridOf(rows), materialMap: PLAIN_MAP, subject: "synthetic" });
  assert.equal(r.schema, REGISTRATION_SMOKE_SCHEMA);
  assert.equal(r.pass, true);
  assert.equal(r.refusal, null);
  assert.equal(r.lens.readable, true);
  assert.equal(r.lens.bands[0].dominantBlock, "white_terracotta");
  assert.equal(r.lens.roof.dominantBlock, "spruce_planks");
  assert.deepEqual(r.kitDryRun.bandNames, ["band0", "roof"]);
  assert.ok(r.kitDryRun.promptChars > 0);
  assert.match(r.note, /proxy-true/);
});

test("THE BARN FIXTURE: wholesale-flipped field rows pass the smoke with the T-117 rung engaged", () => {
  const rows = [];
  for (let i = 0; i < 8; i++) rows.push({ width: 32, key: "dark_oak_planks" });
  for (let i = 0; i < 32; i++) rows.push({ width: 32, key: "stone_bricks" });
  const r = registrationSmoke({ gridResult: gridOf(rows), materialMap: BARN_MAP, subject: "barn-shape" });
  assert.equal(r.pass, true);
  assert.equal(r.lens.bands[0].dominantBlock, "cobblestone");
  assert.deepEqual(r.lens.params.fieldResolution,
    { oak_planks: "cobblestone", stone_bricks: "cobblestone" });
  assert.equal(r.lens.roof.dominantBlock, "dark_oak_planks");
  assert.equal(r.kitDryRun.ok, true);
});

// --- registrationSmoke: refusal paths (cheap, named, zero spend) --------------

test("THE SYNTHETIC-UNREADABLE FIXTURE: unlicensed wall dominant refuses no-field-cells verbatim", () => {
  // an eave anchor makes the proxy decidable; the walls are all trim-rule timber the map does
  // not license as a field — the lens's exact barn-era refusal, now pre-spend
  const rows = [];
  for (const w of [8, 12, 16, 20, 24, 26, 28, 30]) rows.push({ width: w, key: "spruce_planks" });
  rows.push({ width: 32, key: "dark_oak_log" }); // eave bulge
  for (let i = 0; i < 14; i++) rows.push({ width: 28, key: "dark_oak_log" });
  const r = registrationSmoke({ gridResult: gridOf(rows), materialMap: PLAIN_MAP, subject: "unreadable" });
  assert.equal(r.pass, false);
  assert.deepEqual(r.refusal, { stage: "lens", reason: "no-field-cells" });
  assert.equal(r.lens.readable, false);
  assert.equal(r.kitDryRun, null);
});

test("a near-empty concept refuses too-few-cells through the proxy", () => {
  const rows = [
    { width: 3, key: "white_terracotta" }, { width: 3, key: "white_terracotta" },
    { width: 8, key: "white_terracotta" }, // narrow bulge → anchor decidable
    { width: 3, key: "white_terracotta" }, { width: 3, key: "white_terracotta" },
  ];
  const r = registrationSmoke({ gridResult: gridOf(rows, 8), materialMap: PLAIN_MAP, subject: "tiny" });
  assert.equal(r.pass, false);
  assert.deepEqual(r.refusal, { stage: "lens", reason: "too-few-cells" });
});

test("an undecidable proxy refuses at the proxy stage, lens never runs", () => {
  const rows = [];
  for (let i = 0; i < 20; i++) rows.push({ width: 32, key: "white_terracotta" });
  const noRoofMap = { map: [{ role: "f", block: "minecraft:white_terracotta", placementRule: "walls" }] };
  const r = registrationSmoke({ gridResult: gridOf(rows), materialMap: noRoofMap, subject: "flat" });
  assert.equal(r.pass, false);
  assert.deepEqual(r.refusal, { stage: "proxy", reason: "proxy-eave-undecidable" });
  assert.equal(r.lens, null);
});

// --- the kit dry-run guards the REAL precondition ----------------------------

test("the ephemeral record satisfies bandRefsFromZoneRecord; a prior-fallback record throws", () => {
  // what the dry-run hands kit is exactly what kit-extract demands of a committed record
  const ok = { schema: "zone-map/v1", source: "concept", derived: { bands: [{ name: "band0", yRange: [0, 12] }] } };
  assert.deepEqual(bandRefsFromZoneRecord(ok).bandNames, ["band0", "roof"]);
  // the barn's old refusal shape — the precondition the smoke now front-runs
  assert.throws(() => bandRefsFromZoneRecord({ schema: "zone-map/v1", source: "prior-fallback", derived: null }),
    /not a concept-derived zone map/);
});

// --- determinism --------------------------------------------------------------

test("the smoke is deterministic: identical inputs → deep-equal records", () => {
  const rows = [];
  for (let i = 0; i < 8; i++) rows.push({ width: 32, key: "dark_oak_planks" });
  for (let i = 0; i < 32; i++) rows.push({ width: 32, key: "stone_bricks" });
  const input = { gridResult: gridOf(rows), materialMap: BARN_MAP, subject: "barn-shape" };
  assert.deepEqual(registrationSmoke(input), registrationSmoke(input));
});

test("registrationSmoke validates its inputs loudly", () => {
  assert.throws(() => registrationSmoke({ gridResult: { grid: [] }, materialMap: null }), /materialMap/);
});
