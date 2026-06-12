// Unit tests for style-pack.mjs (T-124-01) — schema gate, semantic validation both ways, the
// authority seam, and the committed rustic pack itself.
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  STYLE_PACK_SCHEMA, MATERIAL_PRECEDENCE,
  parseStylePack, assertStylePack, validateStylePack, loadStylePack, packPolicy,
} from "./style-pack.mjs";
import { composeVocabulary } from "../form/material-vocabulary.mjs";
import { CONFORMANCE_CHECK_NAMES } from "./conformance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const RUSTIC_PATH = resolve(here, "..", "..", "packs", "rustic.json");

/** Synthetic mini block table (array form, injectable). */
const MINI_TABLE = [
  { block: "stone_bricks", lab: [51.223, -0.002, 0] },
  { block: "cobblestone", lab: [53.305, 0.571, -0.409] },
  { block: "gravel", lab: [50, 0, 0] }, // excluded candidate (gravity)
];

function minimalPack(overrides = {}) {
  return {
    schema: STYLE_PACK_SCHEMA,
    style: "testpack",
    provenance: { setting: "a test place", sources: { "local-stone": "stone everywhere" } },
    palette: [{
      role: "wall.field", block: "stone_bricks",
      rationale: "stone is local", provenance: ["local-stone"],
      zone: { band: "base", tier: "dominant" },
      valueCheck: { formClass: "cube", inTable: true, family: "stone", lab: [51.223, -0.002, 0] },
    }],
    idioms: [{ name: "plinth", params: { block: "stone_bricks", courses: 1 } }],
    proportions: { storeyHeight: { min: 3, max: 4 }, pitchClasses: [1], openingRhythm: { minSpacing: 2, maxSpacing: 5 } },
    decoration: [],
    conformance: { checks: ["palette-in-pack"] },
    ...overrides,
  };
}

const errsOf = (r) => r.findings.filter((f) => f.level === "error").map((f) => `${f.where}: ${f.msg}`);

// ---------------------------------------------------------------- schema gate

test("schema gate: the minimal pack parses; each missing field is a located error", () => {
  const ok = parseStylePack(minimalPack());
  assert.equal(ok.ok, true);
  assert.ok(Object.isFrozen(ok.pack));

  for (const field of ["schema", "style", "provenance", "palette", "idioms", "proportions", "decoration", "conformance"]) {
    const broken = minimalPack();
    delete broken[field];
    const r = parseStylePack(broken);
    assert.equal(r.ok, false, field);
    assert.equal(r.code, "schema_invalid");
    assert.ok(r.errors.some((e) => e.includes(field)), `${field}: ${r.errors.join("|")}`);
  }
  const junk = parseStylePack("not json{");
  assert.equal(junk.code, "invalid_json");
  assert.throws(() => assertStylePack({ schema: "style-pack/v2" }), /invalid style pack/);
  // additionalProperties are rejected (line-by-line reviewability)
  const extra = parseStylePack({ ...minimalPack(), swagger: 1 });
  assert.equal(extra.ok, false);
});

// ---------------------------------------------------------------- semantic validation, both ways

test("semantic: the minimal pack validates clean against the mini table", () => {
  const r = validateStylePack(assertStylePack(minimalPack()), { blockTable: MINI_TABLE });
  assert.equal(r.ok, true, errsOf(r).join("\n"));
});

test("semantic: dangling provenance ref is an error", () => {
  const pack = minimalPack();
  pack.palette[0].provenance = ["imported-marble"];
  const r = validateStylePack(assertStylePack(pack), { blockTable: MINI_TABLE });
  assert.equal(r.ok, false);
  assert.match(errsOf(r)[0], /provenance key "imported-marble"/);
});

test("semantic: unknown idiom and off-paramsSchema style params are errors", () => {
  const bad = minimalPack({ idioms: [{ name: "porch" }] });
  const r = validateStylePack(assertStylePack(bad), { blockTable: MINI_TABLE });
  assert.ok(errsOf(r).some((e) => /unknown idiom "porch"/.test(e)));

  const badParams = minimalPack({ idioms: [{ name: "plinth", params: { courses: 0 } }] });
  const r2 = validateStylePack(assertStylePack(badParams), { blockTable: MINI_TABLE });
  assert.ok(errsOf(r2).some((e) => /paramsSchema/.test(e)));
});

test("semantic: valueCheck snapshot is re-derived — stale lab, wrong class, off-table cube, excluded", () => {
  const stale = minimalPack();
  stale.palette[0].valueCheck.lab = [50, 0, 0];
  assert.ok(errsOf(validateStylePack(assertStylePack(stale), { blockTable: MINI_TABLE })).some((e) => /stale/.test(e)));

  const wrongClass = minimalPack();
  wrongClass.palette[0].valueCheck.formClass = "fixture";
  assert.ok(errsOf(validateStylePack(assertStylePack(wrongClass), { blockTable: MINI_TABLE })).some((e) => /formClass/.test(e)));

  const offTable = minimalPack();
  offTable.palette[0].block = "sponge"; // not in mini table → fixture re-derived, inTable false
  offTable.palette[0].valueCheck = { formClass: "cube", inTable: true, family: "stone", lab: [1, 2, 3] };
  const r = validateStylePack(assertStylePack(offTable), { blockTable: MINI_TABLE });
  assert.equal(r.ok, false);

  const excluded = minimalPack();
  excluded.palette[0].block = "gravel";
  excluded.palette[0].valueCheck = { formClass: "cube", inTable: true, family: "stone", lab: [50, 0, 0] };
  assert.ok(errsOf(validateStylePack(assertStylePack(excluded), { blockTable: MINI_TABLE })).some((e) => /excluded candidate/.test(e)));
});

test("semantic: proportions sanity and conformance vocabulary", () => {
  const upside = minimalPack({ proportions: { storeyHeight: { min: 5, max: 3 }, pitchClasses: [1], openingRhythm: { minSpacing: 2, maxSpacing: 5 } } });
  assert.ok(errsOf(validateStylePack(assertStylePack(upside), { blockTable: MINI_TABLE })).some((e) => /min exceeds max/.test(e)));

  const weirdPitch = minimalPack({ proportions: { storeyHeight: { min: 3, max: 4 }, pitchClasses: [0.75], openingRhythm: { minSpacing: 2, maxSpacing: 5 } } });
  assert.ok(errsOf(validateStylePack(assertStylePack(weirdPitch), { blockTable: MINI_TABLE })).some((e) => /generator vocabulary/.test(e)));

  // T-134-01: the steep classes are declarable (roof.gable.steep realizes 2 and 3)
  const steep = minimalPack({ proportions: { storeyHeight: { min: 3, max: 4 }, pitchClasses: [3, 2, 1], openingRhythm: { minSpacing: 2, maxSpacing: 5 } } });
  assert.ok(!errsOf(validateStylePack(assertStylePack(steep), { blockTable: MINI_TABLE })).some((e) => /generator vocabulary/.test(e)));

  const vibes = minimalPack({ conformance: { checks: ["vibes"] } });
  assert.ok(errsOf(validateStylePack(assertStylePack(vibes), { blockTable: MINI_TABLE })).some((e) => /unknown check "vibes"/.test(e)));
});

test("semantic: one dominant per band; preserve without dominant is an error", () => {
  const two = minimalPack();
  two.palette.push({
    role: "wall.other", block: "cobblestone", rationale: "also local", provenance: ["local-stone"],
    zone: { band: "base", tier: "dominant" },
    valueCheck: { formClass: "cube", inTable: true, family: "stone", lab: [53.305, 0.571, -0.409] },
  });
  assert.ok(errsOf(validateStylePack(assertStylePack(two), { blockTable: MINI_TABLE })).some((e) => /already has a dominant/.test(e)));

  const orphan = minimalPack();
  orphan.palette[0].zone = { band: "base", tier: "preserve" };
  assert.ok(errsOf(validateStylePack(assertStylePack(orphan), { blockTable: MINI_TABLE })).some((e) => /no dominant/.test(e)));
});

// ---------------------------------------------------------------- authority seam

test("packPolicy reshapes zone seats and feeds the real composeVocabulary", () => {
  const pack = minimalPack();
  pack.palette.push({
    role: "wall.dressing", block: "cobblestone", rationale: "quoins", provenance: ["local-stone"],
    zone: { band: "base", tier: "preserve" },
    valueCheck: { formClass: "cube", inTable: true, family: "stone", lab: [53.305, 0.571, -0.409] },
  });
  const policy = packPolicy(assertStylePack(pack));
  assert.deepEqual(policy, { base: { dominant: "stone_bricks", preserve: ["cobblestone"] } });

  const vocab = composeVocabulary({ policyNamed: policy });
  assert.equal(vocab.zones.base.dominant, "stone_bricks");
  assert.deepEqual([...vocab.ownSets.get("base")].sort(), ["cobblestone", "stone_bricks"]);

  assert.deepEqual(packPolicy(assertStylePack(pack), ["base"]), policy);
  assert.throws(() => packPolicy(assertStylePack(pack), ["roof"]), /no zone seats for band "roof"/);
});

test("MATERIAL_PRECEDENCE is the documented three-tier contract", () => {
  assert.deepEqual([...MATERIAL_PRECEDENCE], ["concept-evidence", "pack-assignment", "vernacular-default"]);
  assert.ok(Object.isFrozen(MATERIAL_PRECEDENCE));
});

// ---------------------------------------------------------------- the rustic pack (the artifact under test)

test("rustic.json loads, schema-gates, and validates clean against the committed block table", () => {
  const pack = loadStylePack(RUSTIC_PATH);
  assert.equal(pack.style, "rustic");
  // warns allowed (recorded gaps), errors none — loadStylePack already threw on errors
  const r = validateStylePack(pack);
  assert.equal(r.ok, true);
  // the pack covers the milestone idioms (incl. all three gap generators)
  const names = new Set(pack.idioms.map((i) => i.name));
  for (const required of ["dormer", "chimney", "jetty", "roof.gable", "plinth", "arch"]) {
    assert.ok(names.has(required), `rustic pack missing idiom ${required}`);
  }
  // every palette role cites the provenance story (diegetic derivation is total)
  for (const p of pack.palette) assert.ok(p.provenance.length >= 1, p.role);
  // the pack lists the full conformance vocabulary
  assert.deepEqual(pack.conformance.checks, [...CONFORMANCE_CHECK_NAMES]);
  // zone seats produce a real three-band policy for composeVocabulary
  const policy = packPolicy(pack, ["base", "upper", "roof"]);
  assert.equal(policy.base.dominant, "cobblestone");
  assert.equal(policy.upper.dominant, "white_terracotta");
  assert.equal(policy.roof.dominant, "spruce_planks");
  assert.ok(policy.roof.preserve.includes("dark_oak_planks"));
});

// ---------------------------------------------------------------- ratification (T-130-01)

test("ratification: optional, but when present it is the complete who/when receipt", () => {
  // a pack without ratification predates the formation chain — stays valid (rustic's case)
  assert.equal(parseStylePack(minimalPack()).ok, true);

  const stamped = minimalPack({
    ratification: { by: "john", date: "2026-06-11T22:00:00Z", note: "taste pass on the draft README" },
  });
  assert.equal(parseStylePack(stamped).ok, true, "a stamped pack must parse");

  for (const broken of [
    { date: "2026-06-11T22:00:00Z" },               // missing by
    { by: "john" },                                  // missing date
    { by: "", date: "2026-06-11T22:00:00Z" },        // empty by
    { by: "john", date: "yesterday" },               // not a date-time
    { by: "john", date: "2026-06-11T22:00:00Z", sworn: true }, // extras rejected
  ]) {
    const r = parseStylePack(minimalPack({ ratification: broken }));
    assert.equal(r.ok, false, JSON.stringify(broken));
    assert.equal(r.code, "schema_invalid");
  }
});

test("ratification: a draft-tagged bundle is structurally NOT a pack (the gate by construction)", () => {
  const draft = { ...minimalPack(), schema: "style-pack/draft-v1" };
  const r = parseStylePack(draft);
  assert.equal(r.ok, false, "a draft must be rejected by the schema const");
  assert.equal(r.code, "schema_invalid");
});
