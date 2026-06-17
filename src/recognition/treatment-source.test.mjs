// Treatment sourcing + critique→amplitude refinement unit tests (T-176-01, story S-176, epic E-43). The
// load-bearing claim: sourcing the gatehouse program + rustic pack reproduces the HAND-AUTHORED T-175-01
// spec's MATERIALS (sourced, not hand-authored), the no-op guard has teeth, and the critique loop transforms
// amplitude deterministically (see thin trim → amplify) while NEVER amplifying a wrong-material `replace`.
// PURE — no GL/LLM/IO beyond reading the committed program/pack/spec fixtures.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import { sourceTreatment, refineAmplitude, AMPLITUDE_CAPS } from "./treatment-source.mjs";
import { TREATMENT_GRAMMAR_SCHEMA } from "../view/treatment-grammar.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
const PROGRAM = read("benchmarks/sculpture/recognition/gatehouse.program.json");
const PACK = read("packs/rustic.json");
const HAND = read("docs/active/work/T-175-01/rustic-gatehouse.treatment.json");

// ---- sourcing reproduces the hand-authored materials -----------------------------------------
test("TS1 sourceTreatment — gatehouse materials match the hand-authored T-175-01 spec (sourced, not authored)", () => {
  const spec = sourceTreatment(PROGRAM, PACK);
  // field is the recess (wall body) — stone_bricks via wall.dressing; edges are cobblestone via wall.field.ground.
  assert.equal(spec.field.material, "stone_bricks");
  assert.equal(spec.edges.corners.material, "cobblestone", "corners = the dressing/quoin role");
  assert.equal(spec.base.material, "cobblestone");
  assert.equal(spec.edges.top.material, "cobblestone");
  // the hand-authored spec used cobblestone edges against the stone_bricks field — same materials, sourced.
  assert.equal(spec.edges.corners.material, HAND.edges.corners.material);
  assert.equal(spec.base.material, HAND.base.material);
  assert.equal(spec.edges.top.material, HAND.edges.top.material);
  // opening sourced from the door headRole (frame.timber) + door.main leaf + door-lantern decoration.
  assert.equal(spec.edges.opening.frame, "dark_oak_log");
  assert.equal(spec.edges.opening.door, "spruce_door");
  assert.equal(spec.edges.opening.light, "lantern");
  assert.equal(spec.edges.opening.frame, HAND.edges.opening.frame);
  assert.equal(spec.edges.opening.door, HAND.edges.opening.door);
  assert.equal(spec.edges.opening.light, HAND.edges.opening.light);
});

test("TS2 sourceTreatment — roof edge sourced from trimRole, distinct from the roof field", () => {
  const spec = sourceTreatment(PROGRAM, PACK);
  assert.equal(spec.roof.edge.material, "stone_bricks", "roof trim = wall.dressing (the lighter stone band)");
  assert.equal(spec.roof.field.material, "dark_oak_planks", "roof field = roof.trim (the dark slopes)");
  assert.notEqual(spec.roof.edge.material, spec.roof.field.material, "edge must differ from field");
});

test("TS3 sourceTreatment — the no-op guard trips when the edge role resolves to the field block", () => {
  // a program whose dressing role equals the ground role → both resolve to the same block → silent no-op.
  const bad = structuredClone(PROGRAM);
  bad.masses[0].walls.dressing = { role: bad.masses[0].walls.ground.role };
  assert.throws(() => sourceTreatment(bad, PACK), /same-material|no-?ops?/i);
});

test("TS4 sourceTreatment — schema + amplitude defaults present; round-trips JSON (serializable)", () => {
  const spec = sourceTreatment(PROGRAM, PACK);
  assert.equal(spec.schema, TREATMENT_GRAMMAR_SCHEMA);
  assert.equal(spec.provenance, "sourced");
  assert.equal(spec.field.recess, true);
  assert.equal(spec.edges.corners.amplitude.headerDepth, 2);
  assert.equal(spec.edges.top.amplitude.courses, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(spec)), spec, "spec is pure JSON");
});

// ---- the critique → amplitude refinement loop ------------------------------------------------
const wallQuoinItem = { department: "WALL", kind: "add", severity: "major",
  present: "flat walls with no dressed framing", missing: "the stone_bricks quoins, piers and plinth band" };
const roofReplaceItem = { department: "ROOF", kind: "replace", severity: "major",
  present: "a pale spruce gable", missing: "the dark_oak_planks field and the steeper pitch" };
const openingAddItem = { department: "OPENING", kind: "add", severity: "minor",
  present: "two plain holes", missing: "the arch reveal and door leaves" };

test("TS5 refineAmplitude — WALL·add 'quoins…plinth' bumps headerDepth and ensures the base", () => {
  const spec = sourceTreatment(PROGRAM, PACK);
  const before = spec.edges.corners.amplitude.headerDepth;
  const { spec: refined, changes } = refineAmplitude(spec, { items: [wallQuoinItem] });
  assert.equal(refined.edges.corners.amplitude.headerDepth, before + 1, "quoins amplified");
  assert.ok(refined.base, "plinth ensured");
  assert.ok(changes.some((c) => c.layer === "edges.corners" && c.knob === "headerDepth"));
  // purity: the source spec is untouched.
  assert.equal(spec.edges.corners.amplitude.headerDepth, before);
});

test("TS6 refineAmplitude — OPENING·add ensures the opening layer is present", () => {
  const spec = sourceTreatment(PROGRAM, PACK);
  delete spec.edges.opening; // simulate a source with no opening
  const { spec: refined, changes } = refineAmplitude(spec, { items: [openingAddItem] });
  assert.ok(refined.edges.opening, "opening reveal/arch ensured");
  assert.ok(changes.some((c) => c.layer === "edges.opening"));
});

test("TS7 refineAmplitude — ROOF·replace (wrong material) is noted, NEVER amplified", () => {
  const spec = sourceTreatment(PROGRAM, PACK);
  const before = JSON.stringify(spec);
  const { spec: refined, changes, notes } = refineAmplitude(spec, { items: [roofReplaceItem] });
  assert.equal(changes.length, 0, "a replace item drives no amplitude change");
  assert.ok(notes.some((n) => n.kind === "materialMismatch" && n.dept === "ROOF"));
  assert.equal(JSON.stringify(refined), before, "wrong-material replace leaves amplitude untouched");
});

test("TS8 refineAmplitude — repeated WALL·add caps headerDepth and never mutates the input spec", () => {
  let spec = sourceTreatment(PROGRAM, PACK);
  const input = JSON.stringify(spec);
  for (let i = 0; i < 5; i++) spec = refineAmplitude(spec, { items: [wallQuoinItem] }).spec;
  assert.ok(spec.edges.corners.amplitude.headerDepth <= AMPLITUDE_CAPS.headerDepth, "capped");
  // the ORIGINAL sourced spec object is never mutated across calls (each refine is a fresh clone).
  const fresh = sourceTreatment(PROGRAM, PACK);
  assert.equal(JSON.stringify(fresh), input);
});
