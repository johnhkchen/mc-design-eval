// Unit + integration tests — the chain seed seam (T-127-01). Pure throughout: a synthetic
// building-program (the compile.test.mjs fixture pattern), the REAL pack, the REAL registry and
// conformance gate on the integration legs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadStylePack } from "../pack/style-pack.mjs";
import { assertBuildingProgram, validateProgramAgainstPack } from "../recognition/program.mjs";
import { PATTERN_BOOK_BUDGET, seedWorkshopProgram, workshopSubjectsFrom } from "./seed.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const pack = loadStylePack(resolve(here, "..", "..", "packs", "rustic.json"));

function makeProgram(mutate = () => {}) {
  const p = {
    schema: "building-program/v1",
    subject: "test-subject",
    pack: "rustic",
    reading: { summary: "synthetic two-storey gabled mass" },
    masses: [
      {
        id: "main",
        rect: { x0: 0, z0: 0, w: 13, d: 9 },
        storeys: 2,
        storeyHeight: 4,
        walls: {
          ground: { role: "wall.field.ground" },
          upper: { role: "wall.infill.upper" },
          dressing: { role: "wall.dressing" },
        },
        roof: {
          idiom: "roof.gable", ridgeAxis: "x", pitchClass: 1,
          fieldRole: "roof.field", trimRole: null, gableRole: null,
        },
        openings: [
          { wall: "+z", kind: "door", count: 1, w: 2, h: 3, sill: 0, head: "flat", headRole: "wall.dressing" },
          { wall: "-z", kind: "window", count: 2, w: 1, h: 2, sill: 5, head: "flat", headRole: "wall.dressing" },
        ],
      },
    ],
  };
  mutate(p);
  const program = assertBuildingProgram(p);
  assert.deepEqual(validateProgramAgainstPack(program, pack).findings, []);
  return program;
}

test("SEED1 the declared budget replaces compile's commit-the-draft rounds", () => {
  const { workshopProgram } = seedWorkshopProgram({ program: makeProgram(), pack });
  assert.deepEqual(workshopProgram.budget, { rounds: PATTERN_BOOK_BUDGET.rounds });
  assert.equal(PATTERN_BOOK_BUDGET.rounds, 6, "D3: the fixture-calibrated budget");
  const custom = seedWorkshopProgram({ program: makeProgram(), pack, budget: { rounds: 3 } });
  assert.equal(custom.workshopProgram.budget.rounds, 3);
});

test("SEED2 byte-stable: two seeds of the same program serialize identically (--repro substrate)", () => {
  const a = seedWorkshopProgram({ program: makeProgram(), pack });
  const b = seedWorkshopProgram({ program: makeProgram(), pack });
  assert.equal(a.serialized, b.serialized);
  assert.equal(JSON.stringify(a.artifact), JSON.stringify(b.artifact));
});

test("SEED3 integration: the seeded program realizes and passes the real conformance gate", () => {
  const { artifact, cells, elements, conformance } = seedWorkshopProgram({ program: makeProgram(), pack });
  assert.ok(cells.length > 0);
  assert.ok(elements.length >= 2, "shell + at least the roof");
  assert.equal(typeof artifact, "object", "assertArtifact already gated it inside the seed");
  assert.equal(conformance.passed, true,
    `expected PASS, findings: ${JSON.stringify(conformance.checks.filter((c) => !c.passed))}`);
});

test("SEED4 a pack-invalid role throws at compile (never a silent fallback)", () => {
  const program = makeProgram();
  // bypass the building-program freeze with a mutated clone that re-validates structurally but
  // names a role the pack does not carry — roleBlock must throw inside the seed
  const broken = structuredClone(program);
  broken.masses[0].walls.ground.role = "wall.marble";
  assert.throws(() => seedWorkshopProgram({ program: broken, pack }), /wall\.marble|not in the pack/);
});

test("SEED5 workshopSubjectsFrom derives data rows by the recognize predicate, paths only", () => {
  const registry = {
    a: { key: "a", concept: "runs/x/concept.png", glb: "glb/a.glb", generated: { scale: 32 } },
    b: { key: "b", concept: "runs/y/concept.png", glb: "glb/b.glb" }, // no generate-first scale
    c: { key: "c", concept: "runs/z/concept.png", generated: { scale: 48 } }, // no GLB
  };
  const subjects = workshopSubjectsFrom(registry, { relDir: "benchmarks/sculpture/workshop", packRel: "packs/rustic.json" });
  assert.deepEqual(Object.keys(subjects), ["a"]);
  assert.deepEqual(subjects.a, {
    program: "benchmarks/sculpture/workshop/a/program.json",
    concept: "benchmarks/sculpture/runs/x/concept.png",
    pack: "packs/rustic.json",
  });
  assert.ok(Object.isFrozen(subjects) && Object.isFrozen(subjects.a));
});

test("SEED6 the real registry derives the milestone subjects without touching the fixture key", async () => {
  const { SUBJECTS } = await import("../../benchmarks/sculpture/durable-skin.mjs");
  const subjects = workshopSubjectsFrom(SUBJECTS, { relDir: "benchmarks/sculpture/workshop", packRel: "packs/rustic.json" });
  for (const key of ["cottage", "barn"]) {
    assert.ok(subjects[key], `${key} derived`);
    assert.equal(subjects[key].program, `benchmarks/sculpture/workshop/${key}/program.json`);
  }
  assert.ok(!("fixture" in subjects), "the synthetic fixture is the runner's own explicit row");
});
