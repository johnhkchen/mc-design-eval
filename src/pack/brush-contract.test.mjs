// Brush contract tests (T-128-01, story S-128, epic E-32): the descriptor gate both ways, then
// every semantic rule with a passing AND a failing fixture (the conformance both-ways pattern).
// The real-registry meta-test (19 brushes, clean) lands with the preview realizer (plan step 3).

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  BRUSH_SCHEMA,
  BRUSH_CONSUMES,
  BRUSH_EMITS,
  brushDescriptor,
  parseBrushDescriptor,
  assertBrushDescriptor,
  validateBrushRegistry,
} from "./brush-contract.mjs";

// ---------------------------------------------------------------- fixtures

const FIX_CARD_SPECS = [{ id: "fixture-plot", idiom: "fix.construct", spec: {} }];

function goodConstruct() {
  return {
    kind: "construct",
    generate: function fixtureGen() { return { cells: [{ pos: [0, 0, 0], block: "stone" }] }; },
    source: "src/pack/fixture-gen.mjs",
    tests: "src/pack/fixture-gen.test.mjs",
    composition: { consumes: ["spec"], emits: ["cells"] },
    paramsSchema: { type: "object", properties: { pitch: { type: "number" } }, additionalProperties: false },
    preview: { card: ["fixture-plot"] },
  };
}

function goodPass() {
  return {
    kind: "pass",
    fn: function fixturePass() { return { placements: [] }; },
    apply: function fixtureApply(a) { return a; },
    source: "src/pack/fixture-pass.mjs",
    tests: "src/pack/fixture-pass.test.mjs",
    composition: { consumes: ["occupancy", "zones"], emits: ["placements", "report"] },
    paramsSchema: { type: "object", additionalProperties: true },
    preview: {
      substrate: { kind: "solid", spec: { footprint: { x0: 0, x1: 2, z0: 0, z1: 2 }, y0: 0, height: 2, block: "stone" } },
      params: {},
      realize: () => ({ cells: [{ pos: [0, 0, 0], block: "stone" }] }),
    },
  };
}

const FIX_FILES = {
  "src/pack/fixture-gen.mjs": "export function fixtureGen() {}",
  "src/pack/fixture-gen.test.mjs": "test fix.construct via fixtureGen",
  "src/pack/fixture-pass.mjs": "export function fixturePass() {}",
  "src/pack/fixture-pass.test.mjs": "test fixturePass on a box",
};

const fixOpts = (overrides = {}) => ({
  cardSpecs: FIX_CARD_SPECS,
  readFile: (rel) => {
    if (rel in FIX_FILES) return FIX_FILES[rel];
    throw new Error(`no fixture file ${rel}`);
  },
  realizePreview: (name, entry) => entry.preview.realize(),
  ...overrides,
});

const fixRegistry = () => ({ "fix.construct": goodConstruct(), "fix.pass": goodPass() });

const errorsOf = (r) => r.findings.filter((f) => f.level === "error").map((f) => `${f.brush}: ${f.msg}`);

// ---------------------------------------------------------------- descriptor gate

test("brushDescriptor projects the serializable contract and strips functions", () => {
  const d = brushDescriptor("fix.pass", goodPass());
  assert.equal(d.schema, BRUSH_SCHEMA);
  assert.equal(d.kind, "pass");
  assert.deepEqual(d.composition, { consumes: ["occupancy", "zones"], emits: ["placements", "report"] });
  assert.deepEqual(Object.keys(d.preview).sort(), ["params", "substrate"]);
  assert.equal(JSON.stringify(d).includes("function"), false);
});

test("parseBrushDescriptor: both fixture descriptors are schema-valid", () => {
  for (const [name, entry] of Object.entries(fixRegistry())) {
    const r = parseBrushDescriptor(brushDescriptor(name, entry));
    assert.equal(r.ok, true, JSON.stringify(r));
  }
});

test("parseBrushDescriptor rejects: bad name, unknown vocab term, bad tests suffix, missing preview", () => {
  const base = brushDescriptor("fix.construct", goodConstruct());
  for (const mutate of [
    (d) => { d.name = "Bad.Name"; },
    (d) => { d.composition.consumes = ["telepathy"]; },
    (d) => { d.composition.emits = []; },
    (d) => { d.tests = "src/pack/fixture-gen.mjs"; },
    (d) => { delete d.preview; },
    (d) => { d.kind = "stage"; },
  ]) {
    const d = structuredClone(base);
    mutate(d);
    assert.equal(parseBrushDescriptor(d).ok, false, JSON.stringify(d));
  }
});

test("assertBrushDescriptor throws with formatted errors; accepts JSON text", () => {
  assert.throws(() => assertBrushDescriptor({ schema: "brush/v1" }), /invalid brush descriptor/);
  const ok = assertBrushDescriptor(JSON.stringify(brushDescriptor("fix.construct", goodConstruct())));
  assert.equal(ok.name, "fix.construct");
});

test("the composition vocabularies are closed and mirrored by the schema enums", () => {
  const d = brushDescriptor("fix.construct", goodConstruct());
  for (const term of BRUSH_CONSUMES) {
    const v = structuredClone(d);
    v.composition.consumes = [term];
    // schema accepts every vocabulary term (kind-consistency is the semantic layer's job)
    assert.equal(parseBrushDescriptor(v).ok, true, term);
  }
  for (const term of BRUSH_EMITS) {
    const v = structuredClone(d);
    v.composition.emits = [term];
    assert.equal(parseBrushDescriptor(v).ok, true, term);
  }
});

// ---------------------------------------------------------------- semantic rules, both ways

test("validateBrushRegistry: the fixture registry is clean", () => {
  const r = validateBrushRegistry(fixRegistry(), fixOpts());
  assert.deepEqual(errorsOf(r), []);
  assert.equal(r.ok, true);
  assert.equal(r.count, 2);
});

test("rule 2: paramsSchema must compile and accept {}", () => {
  const reg = fixRegistry();
  reg["fix.construct"].paramsSchema = { type: "object", required: ["pitch"], properties: { pitch: { type: "number" } } };
  reg["fix.pass"].paramsSchema = { type: "object", properties: 5 };
  const errs = errorsOf(validateBrushRegistry(reg, fixOpts()));
  assert.ok(errs.some((e) => e.includes("must accept {}")), errs.join("\n"));
  assert.ok(errs.some((e) => e.includes("does not compile")), errs.join("\n"));
});

test("rule 3: kind consistency (functions present, composition matches the kind)", () => {
  const reg = fixRegistry();
  delete reg["fix.construct"].generate;
  reg["fix.pass"].composition = { consumes: ["zones"], emits: ["report"] };
  reg["fix.pass"].apply = "not-a-function";
  const errs = errorsOf(validateBrushRegistry(reg, fixOpts()));
  assert.ok(errs.some((e) => e.includes("must carry generate()")));
  assert.ok(errs.some((e) => e.includes('must consume "occupancy"')));
  assert.ok(errs.some((e) => e.includes('"placements" or "removeSet"')));
  assert.ok(errs.some((e) => e.includes("apply must be a function")));
});

test("rule 4a: a construct's card ids must exist and realize THIS brush", () => {
  const reg = fixRegistry();
  reg["fix.construct"].preview = { card: ["missing-plot", "fixture-plot"] };
  const errs = errorsOf(validateBrushRegistry(reg, fixOpts()));
  assert.ok(errs.some((e) => e.includes('"missing-plot" not found')));
  const reg2 = fixRegistry();
  reg2["fix.pass"] = { ...goodConstruct(), preview: { card: ["fixture-plot"] } }; // realizes fix.construct
  const errs2 = errorsOf(validateBrushRegistry(reg2, fixOpts()));
  assert.ok(errs2.some((e) => e.includes('realizes "fix.construct", not this brush')));
});

test("rule 4b: a pass preview must realize ≥1 cell through the realizer", () => {
  const reg = fixRegistry();
  reg["fix.pass"].preview.realize = () => ({ cells: [] });
  const errs = errorsOf(validateBrushRegistry(reg, fixOpts()));
  assert.ok(errs.some((e) => e.includes("realized no cells")));

  const reg2 = fixRegistry();
  reg2["fix.pass"].preview.realize = () => { throw new Error("boom"); };
  const errs2 = errorsOf(validateBrushRegistry(reg2, fixOpts()));
  assert.ok(errs2.some((e) => e.includes("did not realize: boom")));

  // no realizer wired at all (pre-step-3 state) is an error, not a silent skip
  const errs3 = errorsOf(validateBrushRegistry(fixRegistry(), fixOpts({ realizePreview: null })));
  assert.ok(errs3.some((e) => e.includes("no preview realizer")));
});

test("rule 5: the tests file must exist and mention the brush or its realizer", () => {
  const reg = fixRegistry();
  reg["fix.pass"].tests = "src/pack/nowhere.test.mjs";
  const errs = errorsOf(validateBrushRegistry(reg, fixOpts()));
  assert.ok(errs.some((e) => e.includes("not readable")));

  const reg2 = fixRegistry();
  const files = { ...FIX_FILES, "src/pack/fixture-gen.test.mjs": "mentions nothing relevant" };
  const errs2 = errorsOf(validateBrushRegistry(reg2, fixOpts({ readFile: (rel) => {
    if (rel in files) return files[rel];
    throw new Error("missing");
  } })));
  assert.ok(errs2.some((e) => e.includes("mentions neither")));
});

test("rule 6: the source file must exist", () => {
  const reg = fixRegistry();
  reg["fix.construct"].source = "src/pack/ghost.mjs";
  const errs = errorsOf(validateBrushRegistry(reg, fixOpts()));
  assert.ok(errs.some((e) => e.includes("source file src/pack/ghost.mjs is not readable")));
});

test("a schema-invalid entry reports its descriptor errors and skips the semantic rules", () => {
  const reg = { "fix.broken": { ...goodConstruct(), kind: "stage" } };
  const r = validateBrushRegistry(reg, fixOpts());
  assert.equal(r.ok, false);
  assert.ok(errorsOf(r).every((e) => e.startsWith("fix.broken: descriptor:")));
});
