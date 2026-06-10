// Unit tests for the kit-extraction pure core (T-096-01 / S-096 / E-26).
//
// The three AC pins live here:
//   1. the E-21 dropped fixtures (spruce_door / dark_oak_trapdoor / lantern) SURVIVE parseKit —
//      the full-vocabulary validator ends the "recognition discarded as unknown-block" defect;
//   2. a Lab mismatch FLAGS the entry and never rewrites its block (no silent color-snap);
//   3. only VERIFIED cube entries override a band (recognition beats snap; flagged never ships).

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  KIT_SCHEMA, FORM_CLASSES, CONFIDENCES, WHERE_FEATURE_TERMS, KIT_VERIFY_DELTA_MAX,
  loadBlockVocab, derivedFormClass, bandRefsFromZoneRecord, buildKitPrompt,
  parseKit, assertKit, verifyKitValues, kitOverrides, diffKitVsMap,
} from "./kit.mjs";

const VOCAB = loadBlockVocab();

const entry = (over = {}) => ({
  block: "stone_bricks",
  role: "wall field",
  formClass: "cube",
  whereUsed: ["band0"],
  confidence: "high",
  rationale: "coursed grey ashlar with tight joints",
  ...over,
});

// --- vocabulary -----------------------------------------------------------------------------

test("vocab: full survival set — fixtures and rails are members, creative blocks are not", () => {
  assert.equal(VOCAB.schema, "block-vocab/v1");
  assert.equal(VOCAB.minecraftVersion, "1.20.1");
  for (const b of ["oak_trapdoor", "oak_fence", "smooth_sandstone", "lantern", "spruce_door", "stripped_dark_oak_log"]) {
    assert.ok(VOCAB.names.has(b), `${b} should be in the vocabulary`);
  }
  for (const b of ["barrier", "air", "command_block", "water"]) {
    assert.ok(!VOCAB.names.has(b), `${b} should be excluded`);
  }
});

// --- derivedFormClass -----------------------------------------------------------------------

test("derivedFormClass: cube via Lab table, rail via name pattern, fixture otherwise", () => {
  assert.equal(derivedFormClass("stone_bricks"), "cube");
  assert.equal(derivedFormClass("minecraft:stone_bricks"), "cube");
  assert.equal(derivedFormClass("oak_fence"), "rail");
  assert.equal(derivedFormClass("cobblestone_wall"), "rail");
  assert.equal(derivedFormClass("glass_pane"), "rail");
  assert.equal(derivedFormClass("iron_bars"), "rail");
  assert.equal(derivedFormClass("dark_oak_trapdoor"), "fixture");
  assert.equal(derivedFormClass("spruce_door"), "fixture");
  assert.equal(derivedFormClass("lantern"), "fixture");
  assert.equal(derivedFormClass("oak_fence_gate"), "fixture"); // ends in "gate", not "fence"
  assert.equal(derivedFormClass("oak_stairs"), "fixture");
});

// --- parseKit: the E-21 regression pin --------------------------------------------------------

test("parseKit: the fixtures E-21 dropped as unknown-block now survive", () => {
  // The literal entries from material-map/cottage.json `dropped[]`, reshaped to the kit contract.
  const raw = {
    ingredients: [
      { block: "minecraft:spruce_door", role: "entry door", formClass: "fixture", whereUsed: ["openings"], confidence: "high", rationale: "panelled door in the stone reveal" },
      { block: "minecraft:dark_oak_trapdoor", role: "window shutters", formClass: "fixture", whereUsed: ["openings"], confidence: "high", rationale: "slatted shutters with horizontal grain" },
      { block: "minecraft:lantern", role: "door lantern", formClass: "fixture", whereUsed: ["openings"], confidence: "medium", rationale: "glowing warm light beside the door" },
    ],
  };
  const { kit, dropped, stats } = parseKit(raw, { vocab: VOCAB, bandNames: ["band0", "band1", "roof"] });
  assert.equal(dropped.length, 0);
  assert.deepEqual(kit.map((e) => e.block), ["spruce_door", "dark_oak_trapdoor", "lantern"]);
  assert.ok(kit.every((e) => e.formClass === "fixture"));
  assert.equal(stats.kept, 3);
});

test("parseKit: hallucinated block drops as unknown-block; bad rows collected, good rows kept", () => {
  const raw = {
    ingredients: [
      entry(),
      entry({ block: "marble_bricks", role: "fancy wall" }),
      entry({ block: "", role: "ghost" }),
      { role: "" },
      "not-an-object",
    ],
  };
  const { kit, dropped } = parseKit(raw, { vocab: VOCAB, bandNames: ["band0"] });
  assert.equal(kit.length, 1);
  assert.deepEqual(dropped.map((d) => d.reason), ["unknown-block", "missing-block", "empty-role", "not-an-object"]);
});

test("parseKit: declared form class is ground-truthed — derived wins, declared preserved, flagged", () => {
  const raw = { ingredients: [entry({ block: "dark_oak_trapdoor", formClass: "cube", role: "shutters" })] };
  const { kit } = parseKit(raw, { vocab: VOCAB, bandNames: ["band0"] });
  assert.equal(kit[0].formClass, "fixture");
  assert.equal(kit[0].declaredFormClass, "cube");
  assert.ok(kit[0].flags.includes("form-class-corrected"));
});

test("parseKit: missing/invalid formClass drops; unknown whereUsed flags but keeps", () => {
  const noFc = parseKit({ ingredients: [entry({ formClass: undefined })] }, { vocab: VOCAB });
  assert.deepEqual(noFc.dropped.map((d) => d.reason), ["unknown-form-class"]);
  const badRef = parseKit(
    { ingredients: [entry({ whereUsed: ["band9", "band0"] })] },
    { vocab: VOCAB, bandNames: ["band0", "band1"] },
  );
  assert.equal(badRef.kit.length, 1);
  assert.ok(badRef.kit[0].flags.includes("unknown-where-ref"));
  const featRef = parseKit(
    { ingredients: [entry({ whereUsed: [...WHERE_FEATURE_TERMS] })] },
    { vocab: VOCAB, bandNames: [] },
  );
  assert.equal(featRef.kit[0].flags.length, 0);
});

test("parseKit: confidence defaults to medium with a flag; (block, role) dedups keep-first", () => {
  const raw = { ingredients: [entry({ confidence: "certain" }), entry(), entry({ role: "other role" })] };
  const { kit, dropped } = parseKit(raw, { vocab: VOCAB, bandNames: ["band0"] });
  assert.equal(kit[0].confidence, "medium");
  assert.ok(kit[0].flags.includes("default-confidence"));
  assert.deepEqual(dropped.map((d) => d.reason), ["duplicate"]);
  assert.equal(kit.length, 2);
});

test("parseKit: declared-unidentifiable surfaces carry the RECORDED color-snap fallback", () => {
  const raw = { ingredients: [entry()], unidentified: [{ surface: "mossy patch on the north wall", reason: "no clean block read" }] };
  const { unidentified } = parseKit(raw, { vocab: VOCAB });
  assert.equal(unidentified.length, 1);
  assert.deepEqual(unidentified[0].fallback, { mode: "color-snap" });
});

test("assertKit: empty kit throws; valid kit passes", () => {
  assert.throws(() => assertKit([]), /empty/);
  assert.doesNotThrow(() => assertKit([{ block: "stone_bricks", role: "wall", formClass: "cube" }]));
});

// --- band refs + prompt -----------------------------------------------------------------------

const ZONE_RECORD = {
  schema: "zone-map/v1",
  source: "concept",
  derived: {
    bands: [
      { name: "band0", yRange: [0, 6], dominantBlock: "stone_bricks", dominantRole: "ground wall field" },
      { name: "band1", yRange: [7, 13], dominantBlock: "white_terracotta", dominantRole: "upper plaster infill" },
    ],
    roof: { dominantBlock: "dark_oak_planks", dominantRole: "roof field" },
  },
};

test("bandRefsFromZoneRecord: names + positions only — NO block ids, NO role text (anti-anchoring)", () => {
  const { bandNames, promptBands } = bandRefsFromZoneRecord(ZONE_RECORD);
  assert.deepEqual(bandNames, ["band0", "band1", "roof"]);
  const dumped = JSON.stringify(promptBands);
  for (const leak of ["white_terracotta", "stone_bricks", "dark_oak_planks", "plaster", "dominant"]) {
    assert.ok(!dumped.includes(leak), `promptBands must not leak "${leak}"`);
  }
  assert.equal(promptBands[0].position, "the lowest wall band");
  assert.equal(promptBands[2].name, "roof");
});

test("bandRefsFromZoneRecord: refuses wrong schema and prior-fallback records", () => {
  assert.throws(() => bandRefsFromZoneRecord({ schema: "zone-map/v2" }), /zone-map\/v1/);
  assert.throws(() => bandRefsFromZoneRecord({ schema: "zone-map/v1", source: "prior-fallback" }), /concept-derived/);
});

test("buildKitPrompt: names every band, states the recognition contract and the JSON keys", () => {
  const { promptBands } = bandRefsFromZoneRecord(ZONE_RECORD);
  const p = buildKitPrompt({ subject: "cottage", promptBands });
  for (const want of ["band0", "band1", "roof", "ingredients", "unidentified", "formClass",
    "RECOGNIZE", "whereUsed", "confidence", "rationale", ...FORM_CLASSES, ...CONFIDENCES]) {
    assert.ok(p.includes(want), `prompt should mention "${want}"`);
  }
  assert.ok(!p.includes("white_terracotta"));
});

// --- value verification (AC #2) ----------------------------------------------------------------

const SWATCH = (lab, cells) => new Map([["stone_bricks", { lab, cells }]]);
const TABLE_LAB = new Map([["stone_bricks", [60, 1, 2]], ["smooth_sandstone", [80, 2, 14]]]);
const cube = (over = {}) => ({ ...entry(), flags: [], ...over });

test("verifyKitValues: swatch at the block's own Lab verifies (ΔEw ≈ 0)", () => {
  const { kit: out, valueParams } = verifyKitValues([cube()], SWATCH([60, 1, 2], 100), { tableLab: TABLE_LAB });
  assert.equal(out[0].valueCheck.verdict, "verified");
  assert.equal(out[0].valueCheck.deltaE, 0);
  assert.equal(out[0].valueCheck.rawDeltaE, 0);
  assert.equal(out[0].valueCheck.flaggedForReview, false);
  assert.equal(valueParams.lightnessOffset, 0); // 1 sample < KIT_OFFSET_MIN_SAMPLES — no offset
});

test("verifyKitValues: a mismatch FLAGS for review and NEVER rewrites the block (no silent snap)", () => {
  const { kit: out } = verifyKitValues([cube()], SWATCH([85, -10, 30], 100), { tableLab: TABLE_LAB });
  assert.equal(out[0].valueCheck.verdict, "flagged-mismatch");
  assert.equal(out[0].valueCheck.flaggedForReview, true);
  assert.ok(out[0].valueCheck.deltaE > KIT_VERIFY_DELTA_MAX);
  assert.equal(out[0].block, "stone_bricks"); // the recognition stands; a human reviews it
});

test("verifyKitValues: thin-sample, no-swatch, and non-cube verdicts", () => {
  const thin = verifyKitValues([cube()], SWATCH([60, 1, 2], 3), { tableLab: TABLE_LAB }).kit;
  assert.equal(thin[0].valueCheck.verdict, "thin-sample");
  assert.equal(thin[0].valueCheck.flaggedForReview, true);
  const none = verifyKitValues([cube()], new Map(), { tableLab: TABLE_LAB }).kit;
  assert.equal(none[0].valueCheck.verdict, "no-swatch");
  const fix = verifyKitValues([cube({ block: "spruce_door", formClass: "fixture" })], new Map(), { tableLab: TABLE_LAB }).kit;
  assert.equal(fix[0].valueCheck.verdict, null);
  assert.equal(fix[0].valueCheck.reason, "non-cube");
  assert.equal(fix[0].valueCheck.flaggedForReview, false);
});

test("verifyKitValues: shared concept-shading ΔL is removed from the verdict, kept in rawDeltaE", () => {
  // three cubes, all exactly 14 L* darker than their blocks (global shading), hue/chroma true
  const table = new Map([["stone_bricks", [60, 1, 2]], ["smooth_sandstone", [80, 2, 14]], ["spruce_planks", [38, 8, 26]]]);
  const swatches = new Map([
    ["stone_bricks", { lab: [46, 1, 2], cells: 100 }],
    ["smooth_sandstone", { lab: [66, 2, 14], cells: 100 }],
    ["spruce_planks", { lab: [24, 8, 26], cells: 100 }],
  ]);
  const kit = [cube(), cube({ block: "smooth_sandstone", role: "panels" }), cube({ block: "spruce_planks", role: "roof" })];
  const { kit: out, valueParams } = verifyKitValues(kit, swatches, { tableLab: table });
  assert.equal(valueParams.lightnessOffset, -14);
  assert.equal(valueParams.offsetSamples, 3);
  for (const e of out) {
    assert.equal(e.valueCheck.verdict, "verified", `${e.block} should verify after offset removal`);
    assert.equal(e.valueCheck.deltaE, 0);
    assert.equal(e.valueCheck.rawDeltaE, 14); // the true distance stays on the record
  }
});

test("verifyKitValues: the offset never rescues a genuine hue mismatch", () => {
  const table = new Map([["stone_bricks", [60, 1, 2]], ["smooth_sandstone", [80, 2, 14]], ["bricks", [40, 18, 12]]]);
  const swatches = new Map([
    ["stone_bricks", { lab: [46, 1, 2], cells: 100 }],
    ["smooth_sandstone", { lab: [66, 2, 14], cells: 100 }],
    ["bricks", { lab: [26, -15, -10], cells: 100 }], // cool blue-green region — NOT bricks
  ]);
  const kit = [cube(), cube({ block: "smooth_sandstone", role: "panels" }), cube({ block: "bricks", role: "chimney" })];
  const { kit: out } = verifyKitValues(kit, swatches, { tableLab: table });
  assert.equal(out.find((e) => e.block === "bricks").valueCheck.verdict, "flagged-mismatch");
  assert.equal(out.find((e) => e.block === "stone_bricks").valueCheck.verdict, "verified");
});

// --- overrides (AC #3) -------------------------------------------------------------------------

const verified = (block, where, conf = "high") => ({
  block, role: `${block} role`, formClass: "cube", whereUsed: where, confidence: conf, flags: [],
  valueCheck: { verdict: "verified", flaggedForReview: false },
});
const ZONE_DERIVED = ZONE_RECORD.derived;

test("kitOverrides: a verified cube covering a band overrides the band's named dominant", () => {
  const kit = [verified("smooth_sandstone", ["band1"])];
  const { overrides, rows } = kitOverrides(kit, ZONE_DERIVED);
  assert.deepEqual(overrides, { white_terracotta: "smooth_sandstone" });
  assert.deepEqual(rows.find((r) => r.bandName === "band1"),
    { bandName: "band1", named: "white_terracotta", recognized: "smooth_sandstone", verdict: "override" });
  assert.equal(rows.find((r) => r.bandName === "band0").verdict, "no-candidate");
});

test("kitOverrides: a FLAGGED entry never ships but stays VISIBLE as a flagged-candidate row", () => {
  const flagged = { ...verified("smooth_sandstone", ["band1"]), valueCheck: { verdict: "flagged-mismatch", flaggedForReview: true } };
  const r1 = kitOverrides([flagged], ZONE_DERIVED);
  assert.deepEqual(r1.overrides, {});
  assert.deepEqual(r1.rows.find((r) => r.bandName === "band1"),
    { bandName: "band1", named: "white_terracotta", recognized: "smooth_sandstone", verdict: "flagged-candidate" });
  const r2 = kitOverrides([verified("stone_bricks", ["band0"])], ZONE_DERIVED);
  assert.deepEqual(r2.overrides, {});
  assert.equal(r2.rows.find((r) => r.bandName === "band0").verdict, "identity");
});

test("kitOverrides: roof covered via whereUsed roof; higher confidence wins among equals", () => {
  const kit = [verified("spruce_planks", ["roof"], "low"), verified("dark_oak_planks", ["roof"], "high")];
  const { overrides, rows } = kitOverrides(kit, ZONE_DERIVED);
  assert.equal(rows.find((r) => r.bandName === "roof").verdict, "identity"); // high-conf wins, matches named
  assert.deepEqual(overrides, {});
  const swap = kitOverrides([verified("spruce_planks", ["roof"], "high")], ZONE_DERIVED);
  assert.deepEqual(swap.overrides, { dark_oak_planks: "spruce_planks" });
});

test("kitOverrides: band-specificity beats confidence — an exclusive entry is the band's field", () => {
  // the live-cottage regression: spruce_planks (high conf, crossing roof+band1+trim) must not
  // beat smooth_sandstone (medium conf, exclusively band1) for the band1 field material
  const kit = [
    verified("spruce_planks", ["roof", "band1", "trim"], "high"),
    verified("smooth_sandstone", ["band1"], "medium"),
  ];
  const { overrides, rows } = kitOverrides(kit, ZONE_DERIVED);
  assert.equal(rows.find((r) => r.bandName === "band1").recognized, "smooth_sandstone");
  assert.equal(overrides.white_terracotta, "smooth_sandstone");
});

// --- diff (AC #4) ------------------------------------------------------------------------------

test("diffKitVsMap: terracotta correction visible; formerly-dropped fixtures recovered", () => {
  const matMap = { map: [
    { role: "upper-storey plaster infill", block: "minecraft:white_terracotta" },
    { role: "ground wall field", block: "minecraft:stone_bricks" },
  ] };
  const kit = [
    verified("smooth_sandstone", ["band1"]),
    verified("stone_bricks", ["band0"]),
    { block: "dark_oak_trapdoor", role: "shutters", formClass: "fixture", whereUsed: ["openings"], confidence: "high", flags: [], valueCheck: { verdict: null, reason: "non-cube" } },
  ];
  const ov = kitOverrides(kit, ZONE_DERIVED);
  const diff = diffKitVsMap(kit, matMap, ov);
  assert.deepEqual(diff.corrections, [{ band: "band1", old: "white_terracotta", new: "smooth_sandstone", ships: true, oldRole: "upper-storey plaster infill" }]);
  assert.deepEqual(diff.recovered, [{ block: "dark_oak_trapdoor", role: "shutters", formClass: "fixture" }]);
  assert.deepEqual(diff.unchanged, ["stone_bricks"]);
});

test("diffKitVsMap: a flagged candidate is a VISIBLE correction with ships:false", () => {
  const matMap = { map: [{ role: "upper-storey plaster infill", block: "minecraft:white_terracotta" }] };
  const flagged = { ...verified("smooth_sandstone", ["band1"]), valueCheck: { verdict: "flagged-mismatch", flaggedForReview: true } };
  const ov = kitOverrides([flagged], ZONE_DERIVED);
  const diff = diffKitVsMap([flagged], matMap, ov);
  assert.deepEqual(diff.corrections, [{ band: "band1", old: "white_terracotta", new: "smooth_sandstone", ships: false, oldRole: "upper-storey plaster infill" }]);
  assert.deepEqual(diff.recovered, []); // it's a correction, not a recovery
});

test("schema tag exported for the runner", () => {
  assert.equal(KIT_SCHEMA, "kit/v1");
});
