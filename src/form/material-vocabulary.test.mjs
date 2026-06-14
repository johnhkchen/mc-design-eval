// Unit tests for material-vocabulary.mjs (T-113-01, story S-113, epic E-29) — the one composition
// point. Synthetic policies/kits plus the committed church/cottage kits (committed-JSON idiom);
// the live proof is the styled chain (benchmarks/sculpture/styled-milestone.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  MATERIAL_VOCABULARY_SCHEMA, composeVocabulary, ownSetsOf,
} from "./material-vocabulary.mjs";
import { treatmentsFromKit } from "../view/opening-dressing.mjs";
import { loadBlockVocab } from "./kit.mjs";

const VOCAB = loadBlockVocab();
const kitOf = (name) => JSON.parse(
  readFileSync(new URL(`../../benchmarks/sculpture/kit/${name}.json`, import.meta.url), "utf8"));

const POLICY = Object.freeze({
  band0: Object.freeze({
    dominant: "cobblestone",
    preserve: Object.freeze(["stone_bricks", "black_stained_glass"]),
    splat: Object.freeze(["stone_bricks", "mossy_cobblestone"]),
  }),
  roof: Object.freeze({ dominant: "dark_oak_planks", preserve: Object.freeze(["stone_bricks"]) }),
});
const CHURCH_SUB = { cobblestone: "stone", stone_bricks: "polished_basalt" };

test("kit overrides compose OVER the value-true substitution (recognition beats snap)", () => {
  const v = composeVocabulary({
    policyNamed: POLICY,
    substitution: { stone_bricks: "tuff", white_terracotta: "sandstone" },
    kitOverrides: { white_terracotta: "smooth_sandstone" },
  });
  assert.equal(v.schema, MATERIAL_VOCABULARY_SCHEMA);
  assert.equal(v.combined.white_terracotta, "smooth_sandstone");
  assert.equal(v.combined.stone_bricks, "tuff");
  assert.equal(v.sub("white_terracotta"), "smooth_sandstone");
  assert.equal(v.sub("unmapped_block"), "unmapped_block");
});

test("named-space zones map through the renaming point with deduped preserve/splat (mapPolicy parity)", () => {
  const v = composeVocabulary({ policyNamed: POLICY, substitution: CHURCH_SUB });
  assert.deepEqual(v.zones.band0, {
    dominant: "stone",
    preserve: ["polished_basalt", "black_stained_glass"],
    splat: ["polished_basalt", "mossy_cobblestone"],
  });
  assert.deepEqual(v.zones.roof, { dominant: "dark_oak_planks", preserve: ["polished_basalt"] });
  // splat is mirrored only where the input zone carries one
  assert.equal("splat" in v.zones.roof, false);
});

test("guarded ship applies a rename only where the manifest carries the target (the gate rule)", () => {
  const v = composeVocabulary({
    policyNamed: POLICY,
    substitution: CHURCH_SUB,
    allowed: new Set(["stone", "dark_oak_planks", "black_stained_glass"]), // no polished_basalt
  });
  assert.equal(v.zones.band0.dominant, "stone");                      // carried → renamed
  assert.deepEqual(v.zones.band0.preserve, ["stone_bricks", "black_stained_glass"]); // not carried → named
  assert.equal(v.sub("minecraft:stone_bricks"), "stone_bricks");      // guarded sub bares its input
  assert.equal(v.record.guarded, true);
});

test('policySpace "shipped" passes zones through while sub/ownSets still compose', () => {
  const shipped = { band0: { dominant: "stone", preserve: ["polished_basalt"] } };
  const v = composeVocabulary({
    policyNamed: shipped, policySpace: "shipped", substitution: CHURCH_SUB,
  });
  assert.deepEqual(v.zones, shipped);
  assert.notEqual(v.zones.band0, shipped.band0); // a copy, not the caller's object
  assert.equal(v.sub("stone_bricks"), "polished_basalt");
  assert.deepEqual([...v.ownSets.get("band0")].sort(), ["polished_basalt", "stone"]);
  assert.throws(() => composeVocabulary({ policyNamed: shipped, policySpace: "raw" }), /policySpace/);
});

test("component roof family joins roof.preserve once, filtered, without mutating the input (T-106 push)", () => {
  const plan = { roof: { family: { stairs: "spruce_stairs", slab: "spruce_slab" } } };
  const v = composeVocabulary({
    policyNamed: POLICY, substitution: CHURCH_SUB, componentPlan: plan,
    roofFamilyAllowed: new Set(["spruce_stairs"]), // slab not in the shipped manifest
  });
  assert.deepEqual(v.zones.roof.preserve, ["polished_basalt", "spruce_stairs"]);
  assert.deepEqual(v.record.roofFamilyAppended, ["spruce_stairs"]);
  assert.deepEqual(POLICY.roof.preserve, ["stone_bricks"]); // input untouched (frozen would throw too)
  // unfiltered when no roofFamilyAllowed is given; never duplicated
  const v2 = composeVocabulary({
    policyNamed: { roof: { dominant: "planks", preserve: ["spruce_stairs"] } }, componentPlan: plan,
  });
  assert.deepEqual(v2.zones.roof.preserve, ["spruce_stairs", "spruce_slab"]);
});

test("the church shape: a substituted trim cube ships the FRAME slot — dressing speaks shipped space", () => {
  const v = composeVocabulary({
    policyNamed: POLICY, substitution: CHURCH_SUB, kit: kitOf("church").kit,
  });
  assert.equal(v.treatments.slots.frame.block, "polished_basalt"); // stone_bricks, shipped
  assert.equal(v.treatments.slots.frame.source, "kit-trim");
  assert.equal(v.treatments.slots.door.block, "spruce_door");      // fixtures are fixed points
  assert.ok(v.fixtures.includes("polished_basalt"));
});

test("derived species-fence ships after routing; routing itself stays recognition (named space)", () => {
  const kit = [
    { block: "oak_trapdoor", whereUsed: ["openings"], confidence: "high" },
  ];
  const v = composeVocabulary({
    policyNamed: { band0: { dominant: "stone", preserve: [] } },
    substitution: { oak_fence: "spruce_fence" }, // contrived: the derived fence is substituted
    kit, treatmentsOpts: { vocab: VOCAB },
  });
  assert.equal(v.treatments.slots.infill.block, "spruce_fence");
  assert.equal(v.treatments.slots.infill.source, "derived-species-fence");
  assert.equal(v.treatments.derivations[0].block, "spruce_fence");
  assert.equal(v.treatments.derivations[0].from, "oak_trapdoor"); // provenance stays named
});

test("a fixed-point kit composes treatments identical to raw treatmentsFromKit (cottage parity)", () => {
  const kitRec = kitOf("cottage");
  const v = composeVocabulary({
    policyNamed: POLICY,
    substitution: { stone_bricks: "tuff", white_terracotta: "sandstone" },
    kitOverrides: kitRec.overrides,
    kit: kitRec.kit,
  });
  const raw = treatmentsFromKit(kitRec);
  assert.deepEqual(v.treatments, raw); // every cottage slot block is a fixed point of combined
});

test("ownSetsOf = dominant ∪ preserve per zone, bare names (the settle/kit-presence criterion)", () => {
  const sets = ownSetsOf({
    band0: { dominant: "minecraft:stone", preserve: ["polished_basalt", "minecraft:polished_basalt"] },
    roof: { dominant: "dark_oak_planks" },
  });
  assert.deepEqual([...sets.get("band0")].sort(), ["polished_basalt", "stone"]);
  assert.deepEqual([...sets.get("roof")], ["dark_oak_planks"]);
});

test("the record round-trips as JSON and names the composition", () => {
  const v = composeVocabulary({
    policyNamed: POLICY, substitution: CHURCH_SUB, kit: kitOf("church").kit,
    componentPlan: { roof: { family: { stairs: "spruce_stairs", slab: null } } },
  });
  const back = JSON.parse(JSON.stringify(v.record));
  assert.deepEqual(back, v.record);
  assert.equal(back.schema, MATERIAL_VOCABULARY_SCHEMA);
  assert.equal(back.policySpace, "named");
  assert.equal(back.guarded, false);
  assert.deepEqual(back.substitution, CHURCH_SUB);
  assert.equal(back.treatmentSlots.frame, "polished_basalt");
  assert.deepEqual(back.roofFamilyAppended, ["spruce_stairs"]);
  // the lineage snapshot is detached from the live zones object
  v.zones.band0.preserve.push("tampered");
  assert.equal(back.zones.band0.preserve.includes("tampered"), false);
});

test("deterministic and total: identical calls deep-equal; empty kit / null plan never throw", () => {
  const opts = { policyNamed: POLICY, substitution: CHURCH_SUB, kit: [], componentPlan: null };
  const a = composeVocabulary(opts);
  const b = composeVocabulary(opts);
  assert.deepEqual(a.record, b.record);
  assert.deepEqual(a.zones, b.zones);
  assert.deepEqual(a.treatments.unfulfilled.map((u) => u.slot).sort(),
    ["door", "frame", "infill", "light", "shutter"].sort());
  assert.throws(() => composeVocabulary({}), /policyNamed/);
});
