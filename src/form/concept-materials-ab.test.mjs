// Pure unit tests for the E-21 concept-grounded materials A/B assembler (T-074-01). No GL, no I/O, no model
// — the durable AC#2/#4 contract. Mirrors the e19-cleanup.test.mjs idiom.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CONCEPT_MATERIALS_AB_SCHEMA,
  JUDGES,
  nearToneRestoration,
  paletteGrowth,
  trueByFeatureOf,
  judgeSubject,
  abRow,
  assembleConceptMaterialsAb,
} from "./concept-materials-ab.mjs";

// A near-tone pair the colorimetric build collapses (only stone_bricks survives) and the concept-grounded
// build restores + separates by feature (the gatehouse story).
const NEAR = [{ a: "minecraft:stone_bricks", b: "minecraft:cobblestone", dL: 2.082 }];
const MATRIX_SEPARATED = {
  stone_bricks: { "flat-face": 500, "edge-corner": 10 },
  cobblestone: { "flat-face": 5, "edge-corner": 200 },
};
const RULE_FEATURE = { walls: "flat-face", "corners-edges": "edge-corner", roof: "top-roof" };

test("schema + judge labels are stable", () => {
  assert.equal(CONCEPT_MATERIALS_AB_SCHEMA, "concept-materials-ab/v1");
  assert.deepEqual(JUDGES, ["restored", "clean-held", "no-distinction", "over-reach", "deferred"]);
});

test("nearToneRestoration: collapsed in before, restored + separated in after", () => {
  const r = nearToneRestoration({
    nearTonePairs: NEAR,
    beforeManifest: ["minecraft:stone_bricks"], // colorimetric merge: cobblestone gone
    afterManifest: ["minecraft:stone_bricks", "minecraft:cobblestone"],
    afterMatrix: MATRIX_SEPARATED,
  });
  assert.equal(r.collapsedBefore, 1);
  assert.equal(r.restoredAfter, 1);
  assert.equal(r.separatedAfter, 1);
  assert.equal(r.pairs[0].restored, true);
  assert.equal(r.pairs[0].separated, true);
});

test("nearToneRestoration: present in both but NOT feature-separated", () => {
  const r = nearToneRestoration({
    nearTonePairs: NEAR,
    beforeManifest: ["minecraft:stone_bricks", "minecraft:cobblestone"],
    afterManifest: ["minecraft:stone_bricks", "minecraft:cobblestone"],
    afterMatrix: { stone_bricks: { "flat-face": 100 }, cobblestone: { "flat-face": 80 } }, // same dominant feature
  });
  assert.equal(r.collapsedBefore, 0); // both present in before
  assert.equal(r.restoredAfter, 0); // not collapsed → not "restored"
  assert.equal(r.separatedAfter, 0); // same dominant feature → not separated
});

test("nearToneRestoration: tuple form + no pairs", () => {
  const tuple = nearToneRestoration({ nearTonePairs: [["stone_bricks", "cobblestone", 2]], beforeManifest: [], afterManifest: ["stone_bricks", "cobblestone"], afterMatrix: MATRIX_SEPARATED });
  assert.equal(tuple.restoredAfter, 1);
  const none = nearToneRestoration({ nearTonePairs: [], beforeManifest: ["stone"], afterManifest: ["stone"] });
  assert.deepEqual(none.pairs, []);
  assert.equal(none.collapsedBefore, 0);
});

test("paletteGrowth: added blocks joined to map role/rationale; justified", () => {
  const g = paletteGrowth({
    afterManifest: ["minecraft:stone_bricks", "minecraft:white_terracotta", "minecraft:bricks"],
    designDocManifest: ["minecraft:stone_bricks"],
    map: [
      { block: "minecraft:white_terracotta", placementRule: "walls", role: "plaster", rationale: "the white plaster field" },
      { block: "minecraft:bricks", placementRule: "trim", role: "chimney", rationale: "the brick chimney cap" },
    ],
  });
  assert.equal(g.count, 2);
  assert.equal(g.justified, true);
  assert.equal(g.added[0].block, "white_terracotta");
  assert.equal(g.added[0].rationale, "the white plaster field");
});

test("paletteGrowth: unjustified when an added block is absent from the map (colour fallback)", () => {
  const g = paletteGrowth({
    afterManifest: ["stone_bricks", "andesite"],
    designDocManifest: ["stone_bricks"],
    map: [{ block: "stone_bricks", placementRule: "walls" }], // andesite not in map
  });
  assert.equal(g.count, 1);
  assert.equal(g.justified, false);
  assert.equal(g.added[0].inMap, false);
});

test("paletteGrowth: no growth → justified true, empty", () => {
  const g = paletteGrowth({ afterManifest: ["stone_bricks"], designDocManifest: ["stone_bricks", "cobblestone"], map: [] });
  assert.deepEqual(g.added, []);
  assert.equal(g.justified, true);
});

test("trueByFeatureOf: ok when each block dominates its rule's feature; skips no-feature rules", () => {
  const t = trueByFeatureOf({
    map: [
      { block: "minecraft:stone_bricks", placementRule: "walls" },
      { block: "minecraft:cobblestone", placementRule: "corners-edges" },
      { block: "minecraft:dark_oak_log", placementRule: "trim" }, // no geometric feature → skipped
    ],
    afterMatrix: MATRIX_SEPARATED,
    ruleFeature: RULE_FEATURE,
  });
  assert.equal(t.ok, true);
  assert.equal(t.perRule.length, 2); // trim skipped
});

test("trueByFeatureOf: not ok when a block dominates the wrong feature; null without a matrix", () => {
  const t = trueByFeatureOf({
    map: [{ block: "stone_bricks", placementRule: "corners-edges" }], // expected edge-corner, dominates flat-face
    afterMatrix: MATRIX_SEPARATED,
    ruleFeature: RULE_FEATURE,
  });
  assert.equal(t.ok, false);
  assert.equal(trueByFeatureOf({ map: [], afterMatrix: null }), null);
});

test("judgeSubject: restored when a collapse is recovered and clean held", () => {
  const nearTone = nearToneRestoration({ nearTonePairs: NEAR, beforeManifest: ["stone_bricks"], afterManifest: ["stone_bricks", "cobblestone"], afterMatrix: MATRIX_SEPARATED });
  const j = judgeSubject({
    nearTone,
    before: { speckle: 0.05, offPalette: 0 },
    after: { speckle: 0.04, offPalette: 0 },
    growth: { count: 1, justified: true },
    trueByFeature: { ok: true },
  });
  assert.equal(j, "restored");
});

test("judgeSubject: over-reach on mis-assignment or unjustified growth", () => {
  const nearTone = nearToneRestoration({ nearTonePairs: NEAR, beforeManifest: ["stone_bricks"], afterManifest: ["stone_bricks", "cobblestone"], afterMatrix: MATRIX_SEPARATED });
  assert.equal(judgeSubject({ nearTone, before: {}, after: { distinct: 5 }, growth: { count: 0, justified: true }, trueByFeature: { ok: false } }), "over-reach");
  assert.equal(judgeSubject({ nearTone, before: {}, after: { distinct: 9 }, growth: { count: 2, justified: false }, trueByFeature: { ok: true } }), "over-reach");
});

test("judgeSubject: no-distinction (monochrome) and deferred", () => {
  const empty = nearToneRestoration({ nearTonePairs: [], beforeManifest: ["stone"], afterManifest: ["stone"] });
  assert.equal(judgeSubject({ nearTone: empty, before: {}, after: { distinct: 1 }, growth: { count: 0, justified: true }, trueByFeature: { ok: true } }), "no-distinction");
  assert.equal(judgeSubject({ nearTone: empty, before: {}, after: null, deferred: true }), "deferred");
  assert.equal(judgeSubject({ nearTone: empty, before: {}, after: null }), "deferred");
});

test("abRow: deltas + judge; null after tolerated → deferred", () => {
  const row = abRow({
    subject: "gatehouse",
    kind: "architectural",
    before: { distinct: 4, speckle: 0.06, offPalette: 0 },
    after: { distinct: 5, speckle: 0.03, offPalette: 0 },
    nearTone: nearToneRestoration({ nearTonePairs: NEAR, beforeManifest: ["stone_bricks"], afterManifest: ["stone_bricks", "cobblestone"], afterMatrix: MATRIX_SEPARATED }),
    growth: { count: 1, justified: true },
    trueByFeature: { ok: true },
  });
  assert.equal(row.delta.distinct, 1);
  assert.equal(row.delta.speckle, -0.03);
  assert.equal(row.judge, "restored");
  const def = abRow({ subject: "moai", kind: "sculpture", before: { distinct: 5 }, after: null, deferred: true });
  assert.equal(def.judge, "deferred");
});

test("assembleConceptMaterialsAb: tallies, headline, both tables; empty rows degenerate-but-valid", () => {
  const rows = [
    abRow({ subject: "gatehouse", kind: "architectural", before: { distinct: 4, speckle: 0.06, offPalette: 0 }, after: { distinct: 5, speckle: 0.03, offPalette: 0 }, nearTone: nearToneRestoration({ nearTonePairs: NEAR, beforeManifest: ["stone_bricks"], afterManifest: ["stone_bricks", "cobblestone"], afterMatrix: MATRIX_SEPARATED }), growth: paletteGrowth({ afterManifest: ["stone_bricks", "cobblestone"], designDocManifest: ["stone_bricks"], map: [{ block: "cobblestone", placementRule: "corners-edges", rationale: "the corner quoins" }] }), trueByFeature: { ok: true } }),
    abRow({ subject: "moai", kind: "sculpture", before: { distinct: 5, speckle: 0.1, offPalette: 0 }, after: { distinct: 5, speckle: 0.1, offPalette: 0 }, nearTone: nearToneRestoration({ nearTonePairs: [], beforeManifest: ["stone"], afterManifest: ["stone"] }), growth: { count: 0, justified: true }, trueByFeature: { ok: true } }),
  ];
  const { md, json } = assembleConceptMaterialsAb({ rows, scale: 32, ledger: ["trim has no geometric feature (T-072 gap)"] });
  assert.equal(json.schema, "concept-materials-ab/v1");
  assert.deepEqual(json.judges.restored, ["gatehouse"]);
  assert.deepEqual(json.judges["no-distinction"], ["moai"]);
  assert.equal(json.headline.collapsedPairsBefore, 1);
  assert.equal(json.headline.restoredPairsAfter, 1);
  assert.match(md, /Concept-grounded materials A\/B/);
  assert.match(md, /Palette growth/);
  assert.match(md, /Honesty ledger/);
  assert.match(md, /trim has no geometric feature/);

  const empty = assembleConceptMaterialsAb({ rows: [] });
  assert.equal(empty.json.subjects.length, 0);
  assert.match(empty.md, /Subjects: 0/);
  assert.throws(() => assembleConceptMaterialsAb({ rows: "nope" }));
});
