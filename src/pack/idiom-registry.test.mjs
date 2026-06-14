// Unit tests for idiom-registry.mjs (T-124-01, story S-124, epic E-31; brush surface T-128-01,
// story S-128, epic E-32).
import { test } from "node:test";
import assert from "node:assert/strict";
import Ajv2020 from "ajv/dist/2020.js";

import {
  IDIOM_REGISTRY, idiomNames, getIdiom,
  BRUSH_REGISTRY, brushNames, getBrush,
} from "./idiom-registry.mjs";

/** Minimal synthetic spec per construct idiom — every construct must realize on these. */
const SYNTH_SPECS = {
  "roof.gable": { footprint: { x0: -4, x1: 4, z0: 0, z1: 5 }, ridgeAxis: "z", eaveY: 10, ridgeY: 14, blocks: { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab" } },
  "roof.gable.steep": { footprint: { x0: -3, x1: 3, z0: 0, z1: 4 }, ridgeAxis: "z", eaveY: 10, ridgeY: 16, pitch: 2, blocks: { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab" } },
  "roof.hip": { footprint: { x0: -4, x1: 4, z0: 0, z1: 9 }, ridgeAxis: "z", eaveY: 10, ridgeY: 14, blocks: { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab" } },
  "roof.pyramid": { footprint: { x0: 0, x1: 6, z0: 0, z1: 6 }, eaveY: 10, blocks: { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab" } },
  "arch": { center: [5, 12], radius: 2.5, span: { axis: "x", range: [2, 8] }, yRange: [12, 15], depth: { axis: "z", range: [0, 0] }, block: "stone_bricks" },
  "head.flat": { level: 12, span: { axis: "x", range: [2, 6] }, yRange: [12, 13], depth: { axis: "z", range: [0, 0] }, block: "stone_bricks" },
  "course.stairs": { origin: [0, 0, 0], ascent: "+x", steps: 4, block: "oak_stairs" },
  "course.slab": { origin: [0, 0, 0], axis: "z", length: 4, kind: "bottom", block: "oak_slab" },
  "dormer": { origin: [0, 10, 0], facing: "+x", width: 3, depth: 3, wallBlock: "oak_planks", roofBlock: "spruce_stairs" },
  "chimney": { base: [0, 0, 0], height: 5, block: "bricks", cap: "crown" },
  "jetty": { edge: { axis: "x", at: 0, side: "+", range: [0, 6] }, y: 4, beamBlock: "dark_oak_planks" },
  "plinth": { footprint: { x0: 0, x1: 6, z0: 0, z1: 4 }, y0: 0, courses: 1, block: "cobblestone" },
  "roof.thatch": { footprint: { x0: 0, x1: 6, z0: 0, z1: 4 }, ridgeAxis: "z", eaveY: 0, pitch: 1, block: "hay_block", thickness: 2, ridgeRoll: true, ridgeBlock: null, eaveOvershoot: 1 },
};

const PROVEN_STATE_KEYS = new Set(["facing", "half", "shape", "type"]);

test("registry shape: frozen, every entry has kind/source/paramsSchema, names sorted", () => {
  assert.ok(Object.isFrozen(IDIOM_REGISTRY));
  for (const [name, entry] of Object.entries(IDIOM_REGISTRY)) {
    assert.ok(Object.isFrozen(entry), name);
    assert.ok(["construct", "pass"].includes(entry.kind), name);
    assert.equal(typeof entry.source, "string", name);
    assert.equal(typeof entry.paramsSchema, "object", name);
    if (entry.kind === "construct") assert.equal(typeof entry.generate, "function", name);
    else assert.equal(typeof entry.fn, "function", name);
  }
  const names = idiomNames();
  assert.deepEqual(names, [...names].sort());
  assert.equal(names.length, Object.keys(IDIOM_REGISTRY).length);
});

test("the milestone idioms are all registered", () => {
  for (const name of ["roof.gable", "roof.hip", "roof.pyramid", "arch", "dormer", "chimney", "jetty", "plinth", "timber-frame", "opening-dressing", "hollow", "floorplan"]) {
    assert.ok(IDIOM_REGISTRY[name], `missing idiom: ${name}`);
  }
});

test("every construct realizes its synthetic spec: non-empty cells, proven states only", () => {
  for (const name of idiomNames()) {
    const entry = IDIOM_REGISTRY[name];
    if (entry.kind !== "construct") continue;
    const spec = SYNTH_SPECS[name];
    assert.ok(spec, `no synthetic spec for construct "${name}"`);
    const r = entry.generate(spec);
    assert.ok(Array.isArray(r.cells) && r.cells.length > 0, `${name}: empty realization`);
    for (const c of r.cells) {
      assert.ok(Array.isArray(c.pos) && c.pos.length === 3 && c.pos.every(Number.isInteger), `${name}: bad pos`);
      assert.ok(typeof c.block === "string" && c.block.length > 0, `${name}: bad block`);
      if (c.state) {
        for (const k of Object.keys(c.state)) assert.ok(PROVEN_STATE_KEYS.has(k), `${name}: unproven state key ${k}`);
      }
    }
  }
});

test("construct realizations are deterministic", () => {
  for (const name of idiomNames()) {
    const entry = IDIOM_REGISTRY[name];
    if (entry.kind !== "construct") continue;
    assert.deepEqual(entry.generate(SYNTH_SPECS[name]), entry.generate(SYNTH_SPECS[name]), name);
  }
});

test("roof constructs: gable ridge realized, hip ends pulled down, pyramid corners turn", () => {
  const gable = IDIOM_REGISTRY["roof.gable"].generate(SYNTH_SPECS["roof.gable"]);
  assert.ok(gable.capKeys.size > 0, "gable has a ridge cap course");
  assert.ok(gable.cells.some((c) => c.pos[1] === 14), "gable reaches ridgeY");

  const hip = IDIOM_REGISTRY["roof.hip"].generate(SYNTH_SPECS["roof.hip"]);
  const hipTopAtEnd = Math.max(...hip.cells.filter((c) => c.pos[2] === 0).map((c) => c.pos[1]));
  const hipTopAtMid = Math.max(...hip.cells.filter((c) => c.pos[2] === 4).map((c) => c.pos[1]));
  assert.ok(hipTopAtEnd < hipTopAtMid, "hip end slopes down from the mid-ridge");

  const pyr = IDIOM_REGISTRY["roof.pyramid"].generate(SYNTH_SPECS["roof.pyramid"]);
  const corner = pyr.cells.find((c) => c.pos[0] === 0 && c.pos[1] === 10 && c.pos[2] === 0);
  assert.equal(corner.block, "spruce_stairs");
  assert.ok(["outer_left", "outer_right"].includes(corner.state.shape), "pyramid corner turns");
  assert.equal(pyr.apexY, 13);
});

test("arch/flat-head constructs require a concrete block and carry the dressing labels", () => {
  const arch = IDIOM_REGISTRY["arch"].generate(SYNTH_SPECS["arch"]);
  assert.ok(arch.aperture.length > 0 && arch.headCells.length > 0 && arch.jambCells.length > 0);
  assert.ok(arch.cells.every((c) => c.block === "stone_bricks"));
  assert.throws(() => IDIOM_REGISTRY["arch"].generate({ ...SYNTH_SPECS["arch"], block: null }), /block/);
  assert.throws(() => IDIOM_REGISTRY["head.flat"].generate({ ...SYNTH_SPECS["head.flat"], block: undefined }), /block/);
});

test("roof construct malformed specs throw", () => {
  const base = SYNTH_SPECS["roof.gable"];
  assert.throws(() => IDIOM_REGISTRY["roof.gable"].generate({ ...base, ridgeY: 9 }), /ridgeY/);
  assert.throws(() => IDIOM_REGISTRY["roof.gable"].generate({ ...base, ridgeAxis: "y" }), /ridgeAxis/);
  assert.throws(() => IDIOM_REGISTRY["roof.gable"].generate({ ...base, pitch: 0 }), /pitch/);
  assert.throws(() => IDIOM_REGISTRY["roof.gable"].generate({ ...base, blocks: { field: "" } }), /field/);
  assert.throws(() => IDIOM_REGISTRY["roof.gable"].generate({ ...base, footprint: { x0: 4, x1: 0, z0: 0, z1: 5 } }), /footprint/);
  assert.throws(() => IDIOM_REGISTRY["roof.pyramid"].generate({ footprint: { x0: 0, x1: 0, z0: 0, z1: 0 }, eaveY: 10, blocks: { field: "spruce_planks" } }), /apex/);
});

test("getIdiom resolves and throws on unknown names", () => {
  assert.equal(getIdiom("dormer").kind, "construct");
  assert.equal(getIdiom("timber-frame").kind, "pass");
  assert.throws(() => getIdiom("porch"), /unknown idiom "porch"/);
});

test("every paramsSchema compiles under Ajv2020 and accepts {} (nothing required)", () => {
  const ajv = new Ajv2020({ strict: true });
  for (const name of idiomNames()) {
    const validate = ajv.compile(IDIOM_REGISTRY[name].paramsSchema);
    assert.ok(validate({}), `${name}: paramsSchema must accept the empty partial`);
  }
});

test("paramsSchema rejects off-contract style params (constructs are closed objects)", () => {
  const ajv = new Ajv2020({ strict: true });
  const validate = ajv.compile(IDIOM_REGISTRY["dormer"].paramsSchema);
  assert.equal(validate({ width: 3, roofBlock: "spruce_stairs" }), true);
  assert.equal(validate({ width: 2.5 }), false);
  assert.equal(validate({ swag: true }), false);
});

// ---------------------------------------------------------------- the brush surface (T-128-01)

test("the brush aliases are the SAME frozen table (one door, two vocabularies)", () => {
  assert.equal(BRUSH_REGISTRY, IDIOM_REGISTRY);
  assert.equal(brushNames, idiomNames);
  assert.equal(getBrush, getIdiom);
});

test("the E-23 surface brushes are registered as passes with closed paramsSchemas", () => {
  const ajv = new Ajv2020({ strict: true });
  for (const name of ["surface.fill", "surface.paint", "surface.roof-courses", "surface.strip-salt"]) {
    const entry = BRUSH_REGISTRY[name];
    assert.ok(entry, `missing brush: ${name}`);
    assert.equal(entry.kind, "pass", name);
    assert.equal(typeof entry.fn, "function", name);
    const validate = ajv.compile(entry.paramsSchema);
    assert.ok(validate({}), `${name}: accepts {}`);
    assert.equal(validate({ swag: true }), false, `${name}: closed schema`);
  }
  assert.equal(typeof BRUSH_REGISTRY["surface.paint"].merge, "function");
  assert.equal(typeof BRUSH_REGISTRY["surface.paint"].apply, "function");
});

test("the E-35 articulation brushes are registered as passes with closed paramsSchemas", () => {
  const ajv = new Ajv2020({ strict: true });
  for (const name of ["pilaster", "quoin", "infill-panel", "eave-overhang"]) {
    const entry = BRUSH_REGISTRY[name];
    assert.ok(entry, `missing brush: ${name}`);
    assert.equal(entry.kind, "pass", name);
    assert.equal(typeof entry.fn, "function", name);
    assert.equal(entry.source, "src/view/facade-articulation.mjs", name);
    const validate = ajv.compile(entry.paramsSchema);
    assert.ok(validate({}), `${name}: accepts {}`);
    assert.equal(validate({ swag: true }), false, `${name}: closed schema`);
  }
});

test("every brush carries the contract metadata: composition, tests, preview", () => {
  for (const name of brushNames()) {
    const entry = BRUSH_REGISTRY[name];
    assert.ok(Array.isArray(entry.composition?.consumes) && entry.composition.consumes.length > 0, `${name}: consumes`);
    assert.ok(Array.isArray(entry.composition?.emits) && entry.composition.emits.length > 0, `${name}: emits`);
    assert.equal(typeof entry.tests, "string", `${name}: tests`);
    if (entry.kind === "construct") {
      assert.ok(Array.isArray(entry.preview?.card) && entry.preview.card.length > 0, `${name}: card preview`);
    } else {
      assert.ok(entry.preview?.substrate && typeof entry.preview.realize === "function", `${name}: pass preview`);
      assert.equal(typeof entry.preview.params, "object", `${name}: preview params`);
    }
  }
});
