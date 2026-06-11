// workshop program unit tests (T-126-01). Groups:
//   P — parseWorkshopProgram / assertWorkshopProgram (the contract gate)
//   S — boxShell (hollow, true holes, floorless, banded courses)
//   R — realizeProgram (determinism, artifact validity, element census)
//   A — applyParamAdjust (merge semantics, immutability, unknown element)

import { test } from "node:test";
import assert from "node:assert/strict";

import { assertArtifact } from "../artifact.mjs";
import {
  WORKSHOP_PROGRAM_SCHEMA, parseWorkshopProgram, assertWorkshopProgram,
  boxShell, realizeProgram, applyParamAdjust,
} from "./program.mjs";

/** A minimal valid program: one shell + one hip roof (all-cube: stairs/slab null). */
const goodProgram = () => ({
  schema: WORKSHOP_PROGRAM_SCHEMA,
  subject: "synthetic",
  pack: "rustic",
  budget: { rounds: 3 },
  declarations: { bands: [], openings: [] },
  elements: [
    {
      id: "shell",
      kind: "shell",
      spec: {
        footprint: { x0: 0, x1: 6, z0: 0, z1: 4 }, y0: 0, height: 4, wallBlock: "oak_planks",
        courses: [{ yRange: [0, 0], block: "cobblestone" }],
        openings: [{ wall: "+z", at: [3, 0], w: 1, h: 2 }],
      },
    },
    {
      id: "roof",
      kind: "idiom",
      idiom: "roof.hip",
      spec: {
        footprint: { x0: 0, x1: 6, z0: 0, z1: 4 }, ridgeAxis: "x", eaveY: 4, ridgeY: 6,
        blocks: { field: "spruce_planks", stairs: null, slab: null },
      },
    },
  ],
});

// --- P: the contract gate ---------------------------------------------------------------------

test("P1 a good program parses, deep-frozen", () => {
  const r = parseWorkshopProgram(goodProgram());
  assert.equal(r.ok, true);
  assert.ok(Object.isFrozen(r.program) && Object.isFrozen(r.program.elements[0].spec));
});

test("P2 rejection matrix: every malformed field is named", () => {
  const cases = [
    [(p) => { p.schema = "nope/v9"; }, /schema/],
    [(p) => { delete p.subject; }, /subject/],
    [(p) => { p.pack = ""; }, /pack/],
    [(p) => { p.budget = { rounds: 0 }; }, /budget\.rounds/],
    [(p) => { p.declarations = null; }, /declarations/],
    [(p) => { p.elements = []; }, /elements/],
    [(p) => { p.elements[1].id = "shell"; }, /duplicated/],
    [(p) => { p.elements[1].idiom = "no-such-idiom"; }, /not in the registry/],
    [(p) => { p.elements[1].idiom = "timber-frame"; }, /pass, not a construct/],
    [(p) => { p.elements[0].kind = "blob"; }, /kind/],
    [(p) => { p.elements[0].spec = null; }, /spec/],
  ];
  for (const [mutate, rx] of cases) {
    const p = goodProgram();
    mutate(p);
    const r = parseWorkshopProgram(p);
    assert.equal(r.ok, false, `expected rejection for ${rx}`);
    assert.ok(r.errors.some((e) => rx.test(e)), `errors ${JSON.stringify(r.errors)} should match ${rx}`);
  }
});

test("P3 assertWorkshopProgram throws naming every problem; accepts JSON text", () => {
  assert.throws(() => assertWorkshopProgram({ schema: "x" }), /invalid program/);
  const p = assertWorkshopProgram(JSON.stringify(goodProgram()));
  assert.equal(p.subject, "synthetic");
});

// --- S: boxShell --------------------------------------------------------------------------------

test("S1 hollow and floorless: perimeter cells only, no y-cap, no interior", () => {
  const { cells } = boxShell({ footprint: { x0: 0, x1: 4, z0: 0, z1: 3 }, y0: 0, height: 3, wallBlock: "oak_planks" });
  const keys = new Set(cells.map((c) => c.pos.join(",")));
  assert.ok(!keys.has("2,1,1") && !keys.has("2,1,2"), "interior must be empty (hollow)");
  assert.ok(!keys.has("2,0,1"), "no floor (floorless contract)");
  // perimeter ring count per course: 2*(5+4) - 4 = 14; three courses
  assert.equal(cells.length, 14 * 3);
});

test("S2 openings are TRUE holes (cells never placed), validated against the wall", () => {
  const spec = {
    footprint: { x0: 0, x1: 4, z0: 0, z1: 3 }, y0: 0, height: 3, wallBlock: "oak_planks",
    openings: [{ wall: "+z", at: [2, 0], w: 1, h: 2 }],
  };
  const { cells } = boxShell(spec);
  const keys = new Set(cells.map((c) => c.pos.join(",")));
  assert.ok(!keys.has("2,0,3") && !keys.has("2,1,3"), "opening cells must be absent");
  assert.ok(keys.has("2,2,3"), "above the opening the wall continues");
  // out-of-wall and corner-eating openings throw
  assert.throws(() => boxShell({ ...spec, openings: [{ wall: "+z", at: [0, 0], w: 1, h: 1 }] }), /corner/);
  assert.throws(() => boxShell({ ...spec, openings: [{ wall: "+z", at: [2, 2], w: 1, h: 2 }] }), /leaves the wall/);
  assert.throws(() => boxShell({ ...spec, openings: [{ wall: "up", at: [2, 0], w: 1, h: 1 }] }), /wall must be one of/);
});

test("S3 banded courses: per-y override, single material per course", () => {
  const { cells } = boxShell({
    footprint: { x0: 0, x1: 3, z0: 0, z1: 3 }, y0: 0, height: 3, wallBlock: "oak_planks",
    courses: [{ yRange: [0, 0], block: "cobblestone" }],
  });
  for (const c of cells) {
    assert.equal(c.block, c.pos[1] === 0 ? "cobblestone" : "oak_planks");
  }
});

test("S4 degenerate footprints and bad params throw", () => {
  assert.throws(() => boxShell({ footprint: { x0: 0, x1: 0, z0: 0, z1: 3 }, y0: 0, height: 2, wallBlock: "x" }), /interior/);
  assert.throws(() => boxShell({ footprint: { x0: 0, x1: 3, z0: 0, z1: 3 }, y0: 0, height: 0, wallBlock: "x" }), /height/);
  assert.throws(() => boxShell({ footprint: { x0: 0, x1: 3, z0: 0, z1: 3 }, y0: 0, height: 2, wallBlock: "" }), /wallBlock/);
});

// --- R: realizeProgram --------------------------------------------------------------------------

test("R1 realization is deterministic: double-run byte equality; artifact passes the live AJV gate", () => {
  const program = assertWorkshopProgram(goodProgram());
  const a = realizeProgram(program);
  const b = realizeProgram(program);
  assert.equal(JSON.stringify(a.artifact), JSON.stringify(b.artifact));
  assertArtifact(a.artifact); // the live schema gate, not a looser local echo
  assert.deepEqual(a.elements.map((e) => e.id), ["shell", "roof"]);
  assert.ok(a.elements.every((e) => e.cellCount > 0));
  assert.ok(a.artifact.palette.manifest.includes("minecraft:spruce_planks"));
});

test("R2 element order is placement order (later elements win on overlap)", () => {
  const program = assertWorkshopProgram(goodProgram());
  const { artifact, elements } = realizeProgram(program);
  const shellCount = elements[0].cellCount;
  assert.equal(artifact.placements[0].block, "minecraft:cobblestone"); // shell first
  assert.equal(artifact.placements[shellCount].block, "minecraft:spruce_planks"); // then roof
});

// --- A: applyParamAdjust ------------------------------------------------------------------------

test("A1 merges top-level spec keys, returns a NEW frozen program, input untouched", () => {
  const program = assertWorkshopProgram(goodProgram());
  const next = applyParamAdjust(program, { elementId: "roof", params: { ridgeY: 8 } });
  assert.equal(next.elements[1].spec.ridgeY, 8);
  assert.equal(next.elements[1].spec.eaveY, 4, "untouched keys survive");
  assert.equal(program.elements[1].spec.ridgeY, 6, "input program is immutable");
  assert.ok(Object.isFrozen(next));
  // the adjusted program still realizes (taller roof)
  const { artifact } = realizeProgram(next);
  assertArtifact(artifact);
});

test("A2 unknown element and empty params throw", () => {
  const program = assertWorkshopProgram(goodProgram());
  assert.throws(() => applyParamAdjust(program, { elementId: "nope", params: { a: 1 } }), /unknown element "nope"/);
  assert.throws(() => applyParamAdjust(program, { elementId: "roof", params: {} }), /non-empty object/);
});

test("A3 an adjust that breaks the element's own contract fails loudly at realize", () => {
  const program = assertWorkshopProgram(goodProgram());
  const broken = applyParamAdjust(program, { elementId: "roof", params: { ridgeY: 3 } }); // ≤ eaveY
  assert.throws(() => realizeProgram(broken), /ridgeY must exceed/);
});
