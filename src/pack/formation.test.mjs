// Unit tests for the style-formation pure half (T-130-01, story S-130, epic E-32). Everything
// runs against an INJECTED mini block-table + vocabulary — except the round-trip case, which
// uses the REAL committed table and registry on purpose: the draft → ratified pack must pass
// the real assertStylePack + validateStylePack gates (the proof the chain's stamping matches
// validation's re-derivation exactly).

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DRAFT_SCHEMA_TAG,
  blockVocabularyDigest,
  storyDigest,
  sourcesFromStory,
  sourceKeysDigest,
  paletteDigest,
  styleSummaryFromParts,
  classifyPalette,
  classifyProportions,
  classifyBacklog,
  danglingSeats,
  stampValueChecks,
  seedIdiomParams,
  assembleDraftPack,
  deriveDraftFromStages,
  nearToneReport,
  comparePacks,
  draftReadme,
} from "./formation.mjs";
import { parseStylePack, assertStylePack, validateStylePack } from "./style-pack.mjs";
import { REGULARITY_CHECK_NAMES } from "./conformance.mjs";

// ---------------------------------------------------------------- fixtures (injected)

const T = {
  blocks: [
    { block: "cobblestone", texture: "x", rgb: [127, 127, 128], lab: [53.305, 0.571, -0.409], var: 10 },
    { block: "stone_bricks", texture: "x", rgb: [123, 123, 123], lab: [51.223, -0.002, 0], var: 8 },
    { block: "white_terracotta", texture: "x", rgb: [209, 178, 161], lab: [74.899, 8.925, 12.982], var: 5 },
    { block: "spruce_planks", texture: "x", rgb: [114, 84, 48], lab: [38.489, 7.86, 25.664], var: 6 },
    { block: "dark_oak_planks", texture: "x", rgb: [66, 43, 20], lab: [19.931, 8.325, 19.228], var: 6 },
    { block: "bricks", texture: "x", rgb: [150, 97, 83], lab: [46.897, 19.66, 17.39], var: 7 },
    { block: "iron_ore", texture: "x", rgb: [140, 140, 135], lab: [60, 1, 1], var: 9 },
    { block: "sand", texture: "x", rgb: [219, 207, 163], lab: [80, 2, 20], var: 4 },
  ],
};
const V = {
  names: new Set([
    ...T.blocks.map((b) => b.block),
    "spruce_door", "dark_oak_trapdoor", "spruce_fence", "lantern", "spruce_stairs", "spruce_slab",
    "oak_sapling", "poppy", // non-architectural — must NOT enter the digest
  ]),
};

const STORY = {
  style_name: "testcrag",
  setting: "A test village on a cold coast.",
  geology: "Granite headland.",
  timber: "Wind-stunted softwood.",
  wealth_class: "Working families, nothing spared for show.",
  roofing_economy: "Steep tarred shingle.",
  trade: "Salted fish out, sawn deals in.",
  available_materials: [
    { material: "Gathered Fieldstone!", source: "geology — cleared boulders", abundance: "abundant", typical_use: "cottage walls" },
    { material: "gathered fieldstone", source: "geology — strand cobble", abundance: "abundant", typical_use: "footings" },
    { material: "2nd-grade deals", source: "trade — landed softwood", abundance: "common", typical_use: "cladding" },
  ],
};

const ROLES = [
  { role: "wall.field", block: "cobblestone", rationale: "cheap cleared fieldstone", provenance: ["gathered-fieldstone"], band: "base", tier: "dominant" },
  { role: "wall.dressing", block: "stone_bricks", rationale: "dressed stone where it earns its keep", provenance: ["gathered-fieldstone"], band: "base", tier: "preserve" },
  { role: "roof.field", block: "spruce_planks", rationale: "sawn deals", provenance: ["m-2nd-grade-deals"], band: "roof", tier: "dominant" },
  { role: "roof.course", block: "spruce_stairs", rationale: "the stair member", provenance: ["m-2nd-grade-deals"], band: null, tier: null },
  { role: "roof.step", block: "spruce_slab", rationale: "the half-step member", provenance: ["m-2nd-grade-deals"] },
  { role: "door.main", block: "spruce_door", rationale: "boarded leaf", provenance: ["m-2nd-grade-deals"] },
  { role: "chimney.cap", block: "bricks", rationale: "fired cap", provenance: ["gathered-fieldstone"] },
];
const SOURCE_KEYS = ["gathered-fieldstone", "gathered-fieldstone-2", "m-2nd-grade-deals"];
const GATE = { sourceKeys: SOURCE_KEYS, vocabNames: blockVocabularyDigest({ table: T, vocab: V }).names };

const PROPS = { storey_min: 3, storey_max: 4, pitch_classes: [1], opening_min: 2, opening_max: 5 };

// ---------------------------------------------------------------- digests

test("sourcesFromStory: kebab slugs, collision suffixing, digit-leading prefix, narrative carries source + use", () => {
  const s = sourcesFromStory(STORY);
  assert.deepEqual(Object.keys(s), SOURCE_KEYS);
  for (const k of Object.keys(s)) assert.match(k, /^[a-z][a-z0-9-]*$/);
  assert.equal(s["gathered-fieldstone"], "geology — cleared boulders (abundant) — typical use: cottage walls");
  assert.match(s["m-2nd-grade-deals"], /landed softwood/);
});

test("blockVocabularyDigest: families grouped with L, excluded candidates absent, non-cube section curated", () => {
  const { text, names } = blockVocabularyDigest({ table: T, vocab: V });
  assert.match(text, /- stone: cobblestone \(L 53\), stone_bricks \(L 51\)/);
  assert.match(text, /- planks: dark_oak_planks \(L 20\), spruce_planks \(L 38\)/);
  assert.match(text, /- smooth: white_terracotta \(L 75\)/);
  assert.match(text, /- brick: bricks \(L 47\)/);
  assert.doesNotMatch(text, /iron_ore|(^|[^a-z_])sand\b/, "excluded candidates never enter the prompt");
  assert.match(text, /Non-cube placed members/);
  assert.match(text, /spruce_door/);
  assert.doesNotMatch(text, /oak_sapling|poppy/, "the flora tail is not palette material");
  assert.ok(names.has("cobblestone") && names.has("spruce_door") && names.has("lantern"));
  assert.ok(!names.has("iron_ore") && !names.has("sand") && !names.has("poppy"));
});

test("storyDigest / paletteDigest / styleSummaryFromParts are stable prose over the parts", () => {
  const sd = storyDigest(STORY);
  assert.match(sd, /Style name: testcrag/);
  assert.match(sd, /- Gathered Fieldstone! \(abundant; geology — cleared boulders\) — typical use: cottage walls/);
  const pd = paletteDigest(ROLES);
  assert.match(pd, /- wall\.field → cobblestone \[base\/dominant\]: cheap cleared fieldstone/);
  assert.match(pd, /- roof\.step → spruce_slab: the half-step member/);
  const ss = styleSummaryFromParts({ story: STORY, roles: ROLES, proportions: PROPS });
  assert.match(ss, /Style: testcrag — A test village on a cold coast\./);
  assert.match(ss, /storey height 3–4 blocks; pitch classes \[1\]; opening spacing 2–5 cells\./);
  assert.match(sourceKeysDigest(sourcesFromStory(STORY)), /^- gathered-fieldstone: /);
});

// ---------------------------------------------------------------- gates

test("classifyPalette: a valid parse passes", () => {
  assert.deepEqual(classifyPalette({ roles: ROLES, decoration: [{ item: "door-lantern", block: "lantern", where: ["door"] }] }, GATE), { ok: true });
});

test("classifyPalette: each taught rule fails with the offender named", () => {
  const one = (roles, re) => {
    const v = classifyPalette({ roles, decoration: [] }, GATE);
    assert.equal(v.ok, false);
    assert.match(v.reason, re);
  };
  one([], /zero roles/);
  one([{ ...ROLES[0], block: "emerald_block" }], /outside the supplied vocabulary/);
  one([{ ...ROLES[0], block: "iron_ore" }], /outside the supplied vocabulary/);
  one([{ ...ROLES[0], provenance: ["imported-marble"] }], /not a supplied source key/);
  one([{ ...ROLES[0], provenance: [] }], /no provenance citation/);
  one([ROLES[0], { ...ROLES[1], tier: "dominant" }], /two dominants/);
  one([{ ...ROLES[1] }], /preserve entries but no dominant/);
  one([{ ...ROLES[0], role: "Wall Field" }], /not a lowercase dotted name/);
  one([ROLES[0], { ...ROLES[1], role: "wall.field", band: null, tier: null }], /duplicate role/);
  const deco = classifyPalette({ roles: ROLES, decoration: [{ item: "pot", block: "poppy", where: ["sill"] }] }, GATE);
  assert.equal(deco.ok, false);
  assert.match(deco.reason, /outside the supplied vocabulary/);
});

test("classifyPalette + danglingSeats: half-seats are ABSORBED, never rejected (handle, don't reject)", () => {
  // the live failure shape: tier without band starved 3 re-asks before absorption
  const dangling = [
    { ...ROLES[0] },
    { role: "wall.quoin", block: "stone_bricks", rationale: "dressed corners", provenance: ["gathered-fieldstone"], band: null, tier: "preserve" },
    { role: "wall.jamb", block: "stone_bricks", rationale: "dressed jambs", provenance: ["gathered-fieldstone"], band: "trimband", tier: null },
  ];
  assert.deepEqual(classifyPalette({ roles: dangling, decoration: [] }, GATE), { ok: true });
  assert.deepEqual(danglingSeats(dangling), [
    { role: "wall.quoin", band: null, tier: "preserve" },
    { role: "wall.jamb", band: "trimband", tier: null },
  ]);
  // the assembler drops the half-seats: no zone key survives
  const entries = stampValueChecks(dangling, { table: T });
  assert.equal("zone" in entries[1], false);
  assert.equal("zone" in entries[2], false);
  // a half-seated preserve never triggers the no-dominant rule (its band is not a named band)
  assert.equal(classifyPalette({ roles: [ROLES[0], dangling[1]], decoration: [] }, GATE).ok, true);
});

test("classifyProportions: vocabulary + ordering gates (SAP coercion survivors)", () => {
  assert.deepEqual(classifyProportions(PROPS), { ok: true });
  assert.match(classifyProportions({ ...PROPS, pitch_classes: [1, 1.5] }).reason, /outside the realizable vocabulary/);
  assert.match(classifyProportions({ ...PROPS, storey_min: 5 }).reason, /storey_min exceeds storey_max/);
  assert.match(classifyProportions({ ...PROPS, opening_min: 9 }).reason, /opening_min exceeds opening_max/);
  assert.match(classifyProportions({ ...PROPS, storey_min: 0 }).reason, /integer >= 1/);
  assert.match(classifyProportions({ ...PROPS, pitch_classes: [] }).reason, /empty/);
});

test("classifyBacklog: the empty union is MALFORMED (FX-D1 discharge); one-sided unions pass", () => {
  assert.equal(classifyBacklog({ items: [], parametrization_notes: [] }).ok, false);
  assert.match(classifyBacklog({ items: [], parametrization_notes: [] }).reason, /FX-D1/);
  assert.equal(classifyBacklog({ items: [{ name: "x" }], parametrization_notes: [] }).ok, true);
  assert.equal(classifyBacklog({ items: [], parametrization_notes: [{ need: "y" }] }).ok, true);
});

// ---------------------------------------------------------------- stamping + seeding

test("stampValueChecks: cube/fixture/rail snapshots match the validator's derivation", () => {
  const entries = stampValueChecks(ROLES, { table: T });
  const by = new Map(entries.map((e) => [e.role, e]));
  assert.deepEqual(by.get("wall.field").valueCheck, { formClass: "cube", inTable: true, family: "stone", lab: [53.305, 0.571, -0.409] });
  assert.deepEqual(by.get("door.main").valueCheck, { formClass: "fixture", inTable: false, family: null });
  const rail = stampValueChecks([{ role: "window.infill", block: "spruce_fence", rationale: "lattice", provenance: ["m-2nd-grade-deals"] }], { table: T });
  assert.deepEqual(rail[0].valueCheck, { formClass: "rail", inTable: false, family: null });
  assert.deepEqual(by.get("wall.field").zone, { band: "base", tier: "dominant" });
  assert.equal("zone" in by.get("roof.course"), false, "null band/tier never becomes a zone seat");
});

test("seedIdiomParams: mechanical rules only; the rest emit {name} bare", () => {
  const entries = stampValueChecks(ROLES, { table: T });
  const idioms = seedIdiomParams({
    owned: ["roof.gable", "course.stairs", "course.slab", "plinth", "arch", "chimney", "hollow", "floorplan"],
    paletteEntries: entries,
  });
  const by = new Map(idioms.map((i) => [i.name, i]));
  assert.deepEqual(by.get("roof.gable").params, { blocks: { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab" } });
  assert.deepEqual(by.get("course.stairs").params, { block: "spruce_stairs" });
  assert.deepEqual(by.get("course.slab").params, { block: "spruce_slab" });
  assert.deepEqual(by.get("plinth").params, { block: "stone_bricks" });
  assert.deepEqual(by.get("arch").params, { block: "stone_bricks" });
  assert.deepEqual(by.get("chimney").params, { cap: "crown", capBlock: "bricks" });
  assert.deepEqual(by.get("hollow"), { name: "hollow" });
  assert.deepEqual(by.get("floorplan"), { name: "floorplan" });
  assert.deepEqual(idioms.map((i) => i.name), [...idioms.map((i) => i.name)].sort(), "deterministic order");
});

// ---------------------------------------------------------------- assembly + the ratification round-trip

test("assembleDraftPack: draft tag, full conformance set, parseStylePack REJECTS the draft", () => {
  const entries = stampValueChecks(ROLES, { table: T });
  const idioms = seedIdiomParams({ owned: ["roof.gable", "hollow"], paletteEntries: entries });
  const draft = assembleDraftPack({
    story: STORY, paletteEntries: entries, decoration: [{ item: "door-lantern", block: "lantern", where: ["door"] }],
    proportions: PROPS, idioms, styleSlug: "testcrag",
  });
  assert.equal(draft.schema, DRAFT_SCHEMA_TAG);
  assert.deepEqual(draft.conformance.checks, [...REGULARITY_CHECK_NAMES]);
  assert.deepEqual(draft.proportions, { storeyHeight: { min: 3, max: 4 }, pitchClasses: [1], openingRhythm: { minSpacing: 2, maxSpacing: 5 } });
  const r = parseStylePack(draft);
  assert.equal(r.ok, false, "a draft is structurally not a pack");
  assert.equal(r.code, "schema_invalid");
  assert.throws(() => assembleDraftPack({ story: STORY, paletteEntries: entries, decoration: [], proportions: PROPS, idioms: [], styleSlug: "x" }), /no owned idioms/);
});

test("round-trip: tag swap + ratification stamp passes the REAL pack gates (real table, real registry)", () => {
  // real-table stamping so the Lab snapshots match validateStylePack's re-derivation byte-for-byte
  const entries = stampValueChecks(ROLES);
  const idioms = seedIdiomParams({ owned: ["roof.gable", "course.stairs", "course.slab", "plinth", "chimney", "hollow"], paletteEntries: entries });
  const draft = assembleDraftPack({
    story: STORY, paletteEntries: entries, decoration: [{ item: "door-lantern", block: "lantern", where: ["door"] }],
    proportions: PROPS, idioms, styleSlug: "testcrag",
  });
  const ratified = { ...draft, schema: "style-pack/v1", ratification: { by: "formation.test.mjs", date: "2026-06-11T00:00:00Z" } };
  const pack = assertStylePack(ratified); // throws on schema failure
  const { ok, findings } = validateStylePack(pack);
  assert.ok(ok, `semantic validation failed:\n${findings.filter((f) => f.level === "error").map((f) => `${f.where}: ${f.msg}`).join("\n")}`);
});

test("deriveDraftFromStages: the one stage→draft derivation — dedup feeds owned, idioms seed, draft assembles", () => {
  const backlog = {
    items: [
      { name: "plinth", purpose: "skirt", parameter_sketch: "courses" }, // owned → demoted to a note
      { name: "gable-lucarne", purpose: "roof light", parameter_sketch: "w,h" }, // genuinely new
    ],
    parametrization_notes: [
      { need: "gable roofs", existing_brush: "roof.gable", note: "pitch 1" },
      { need: "interior", existing_brush: "hollow", note: "inset 1" },
      { need: "phantom", existing_brush: "not-a-brush", note: "warned" },
    ],
  };
  const { draft, deduped, owned, nearTone } = deriveDraftFromStages({
    story: STORY,
    palette: { roles: ROLES, decoration: [{ item: "door-lantern", block: "lantern", where: ["door"] }] },
    proportions: PROPS,
    backlog,
    styleSlug: "testcrag",
    ownedNames: ["roof.gable", "hollow", "plinth"],
    table: T,
  });
  assert.deepEqual(owned, ["hollow", "plinth", "roof.gable"], "owned = notes ∩ registry, incl. the demotion");
  assert.deepEqual(deduped.items.map((i) => i.name), ["gable-lucarne"], "owned work items demote, new ones survive");
  assert.equal(deduped.demotions.length, 1);
  assert.equal(deduped.warnings.length, 1, "a note citing an unowned brush is flagged");
  assert.deepEqual(draft.idioms.map((i) => i.name), ["hollow", "plinth", "roof.gable"]);
  assert.equal(draft.schema, DRAFT_SCHEMA_TAG);
  assert.equal(nearTone.length, 1);
});

// ---------------------------------------------------------------- evidence + comparison + sheet

test("nearToneReport: same-family cube pairs only, weighted + true ΔE, closest first", () => {
  const entries = stampValueChecks(ROLES, { table: T });
  const report = nearToneReport(entries);
  assert.equal(report.length, 1, "one stone pair; planks appears once; fixtures never pair");
  assert.equal(report[0].family, "stone");
  assert.deepEqual([report[0].a.block, report[0].b.block], ["cobblestone", "stone_bricks"]);
  assert.ok(report[0].weightedDeltaE >= report[0].deltaE76, "chroma weighting never shrinks the distance");
});

test("comparePacks: name-then-unambiguous-zone alignment, three verdicts, named divergences, deltas", () => {
  const mk = (roles, idioms, pitch) => ({
    style: "x", provenance: { sources: { s: "n" } },
    palette: roles, idioms: idioms.map((name) => ({ name })),
    proportions: { storeyHeight: { min: 3, max: 4 }, pitchClasses: pitch, openingRhythm: { minSpacing: 2, maxSpacing: 5 } },
  });
  const vc = (block) => {
    const e = T.blocks.find((b) => b.block === block);
    return e ? { formClass: "cube", inTable: true, family: null, lab: e.lab } : { formClass: "fixture", inTable: false, family: null };
  };
  const derived = mk([
    { role: "wall.field", block: "cobblestone", valueCheck: vc("cobblestone") },                                  // name + same-block
    { role: "roof.main", block: "spruce_planks", zone: { band: "roof", tier: "dominant" }, valueCheck: vc("spruce_planks") }, // zone + same-family
    { role: "trim", block: "bricks", valueCheck: vc("bricks") },                                                  // name + different
    { role: "extra.role", block: "white_terracotta", valueCheck: vc("white_terracotta") },                        // extra
  ], ["roof.gable", "hollow"], [1]);
  const curated = mk([
    { role: "wall.field", block: "cobblestone", valueCheck: vc("cobblestone") },
    { role: "roof.field", block: "dark_oak_planks", zone: { band: "roof", tier: "dominant" }, valueCheck: vc("dark_oak_planks") },
    { role: "trim", block: "stone_bricks", valueCheck: vc("stone_bricks") },
    { role: "door.main", block: "spruce_door", valueCheck: vc("spruce_door") },                                   // missing
  ], ["roof.gable", "plinth"], [0.5, 1]);
  const c = comparePacks(derived, curated);
  const byRole = new Map(c.roles.map((r) => [r.role.derived, r]));
  assert.equal(byRole.get("wall.field").verdict, "same-block");
  assert.equal(byRole.get("roof.main").verdict, "same-family");
  assert.equal(byRole.get("roof.main").alignedBy, "zone");
  assert.equal(byRole.get("roof.main").role.curated, "roof.field");
  assert.ok(byRole.get("roof.main").deltaE76 > 0);
  assert.equal(byRole.get("trim").verdict, "different");
  assert.deepEqual(c.extra.map((e) => e.role), ["extra.role"]);
  assert.deepEqual(c.missing.map((m) => m.role), ["door.main"]);
  assert.deepEqual(c.idioms, { common: ["roof.gable"], onlyDerived: ["hollow"], onlyCurated: ["plinth"] });
  assert.deepEqual(c.proportions.pitchClasses.common, [1]);
});

test("draftReadme: the ratification sheet carries story, palette, evidence, needs, comparison, and the ratify flow", () => {
  const entries = stampValueChecks(ROLES, { table: T });
  const idioms = seedIdiomParams({ owned: ["roof.gable", "hollow"], paletteEntries: entries });
  const pack = assembleDraftPack({
    story: STORY, paletteEntries: entries, decoration: [], proportions: PROPS, idioms, styleSlug: "testcrag",
  });
  const md = draftReadme({
    pack,
    nearTone: nearToneReport(entries),
    needs: { items: [{ name: "gable-lucarne", purpose: "a roof light" }], parametrization_notes: [{ existing_brush: "plinth", need: "low skirt" }] },
    comparison: comparePacks(pack, pack),
  });
  assert.match(md, /# Style draft: `testcrag` — ratification sheet/);
  assert.match(md, /style-pack\/draft-v1/);
  assert.match(md, /npm run style:ratify -- --style testcrag --by/);
  assert.match(md, /\| wall\.field \| `cobblestone` \| base\/dominant \| 53 \|/);
  assert.match(md, /stone: wall\.field \(`cobblestone`\) vs wall\.dressing \(`stone_bricks`\)/);
  assert.match(md, /NEW: `gable-lucarne`/);
  assert.match(md, /owned `plinth`: low skirt/);
  assert.match(md, /aligned roles: \d+ \(\d+ same-block/);
  assert.match(md, /## Taste checklist/);
});
