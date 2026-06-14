// Unified-chain artifact-base seed tests (T-154-01, E-37). The workshop's NEW seed mode: a frozen
// generate-first artifact instead of a revisable program. Synthetic exchange seams over the REAL pure
// conformance gate (no GL, no model). Groups:
//   AA — articulateArtifact (the artifact-input relief twin)
//   AB — the loop in artifact-base mode (paint accepted/rolled-back, geometry unavailable, done)
//   AR — replay + offline on an artifact-base ledger (Rule 5, artifact-anchored)
//   AS — the build seam constants (BUILD_BUDGET, buildRels)

import { test } from "node:test";
import assert from "node:assert/strict";

import { runWorkshopLoop, conformanceScore } from "./loop.mjs";
import { realizeProgram, assertWorkshopProgram, WORKSHOP_PROGRAM_SCHEMA } from "./program.mjs";
import { articulateArtifact } from "./articulate.mjs";
import { replayLedger, offlineAssert, serializeArtifact } from "./replay.mjs";
import { DEFAULT_APPLIERS } from "./actions.mjs";
import { BUILD_BUDGET, PATTERN_BOOK_BUDGET, buildRels } from "./seed.mjs";

/** Same test pack as loop.test: two pure checks; pink_wool is OUT of vocabulary. */
const PACK = {
  palette: [{ role: "wall.field", block: "oak_planks" }, { role: "wall.trim", block: "cobblestone" }],
  decoration: [],
  conformance: { checks: ["courses-even", "palette-in-pack"] },
};

const DECLARATIONS = { bands: [{ name: "walls", yRange: [0, 2], blocks: ["oak_planks"] }] };

/** A program whose y=1 course is pink_wool — realized to a frozen ARTIFACT, the generate-first seed
 *  stand-in (the loop never sees this program; only its realization). */
const SEED_PROGRAM = assertWorkshopProgram({
  schema: WORKSHOP_PROGRAM_SCHEMA, subject: "synthetic", pack: "test-pack", budget: { rounds: 1 },
  declarations: DECLARATIONS,
  elements: [{
    id: "shell", kind: "shell",
    spec: {
      footprint: { x0: 0, x1: 4, z0: 0, z1: 3 }, y0: 0, height: 3, wallBlock: "oak_planks",
      courses: [{ yRange: [1, 1], block: "pink_wool" }],
    },
  }],
});
const seedArtifact = () => realizeProgram(SEED_PROGRAM).artifact;

/** The artifact-base seed envelope the runner builds (NOT a workshop-program — no elements to realize). */
const envelope = (rounds = 2) => ({
  subject: "synthetic", pack: "test-pack", budget: { rounds }, declarations: DECLARATIONS, elements: [],
});

/** Paint-only appliers — the runner's artifact-base table; geometry/re-recognize ⇒ unavailable. */
const PAINT_ONLY = { "spray-paint": DEFAULT_APPLIERS["spray-paint"] };

const PAINT_PINK_OAK = { action: "spray-paint", dir: "+z", toBlock: "oak_planks", fromBlock: "pink_wool" };
const PAINT_OAK_COBBLE = { action: "spray-paint", dir: "+z", toBlock: "cobblestone" };

const verdictRevise = (action) => ({
  critique: { issues: [{ region: "south wall", issue: "pink band", severity: "major" }] },
  decision: "revise", action, rationale: "fix the foreign band",
});
const verdictDone = () => ({ critique: { issues: [] }, decision: "done", rationale: "good enough" });

const scripted = (verdicts) => {
  const ctxs = [];
  const seam = async (ctx) => {
    ctxs.push(ctx);
    const v = verdicts.shift();
    return { verdict: v, replies: [{ attempt: 1, parsed: v !== null, rawReply: "synthetic", source: "live" }], askCount: 1 };
  };
  return { seam, ctxs };
};

const run = (verdicts, rounds = 2, extra = {}) =>
  runWorkshopLoop({
    program: envelope(rounds), pack: PACK, seams: { exchange: scripted(verdicts).seam },
    appliers: PAINT_ONLY, seedArtifact: seedArtifact(), ...extra,
  });

// --- AA: articulateArtifact ---------------------------------------------------------------------

test("AA1 articulateArtifact with empty articulation returns the base byte-identical", () => {
  const base = seedArtifact();
  assert.equal(serializeArtifact(articulateArtifact(base, [])), serializeArtifact(base));
  assert.equal(serializeArtifact(articulateArtifact(base, undefined)), serializeArtifact(base));
});

// --- AB: the loop in artifact-base mode ----------------------------------------------------------

test("AB1 accept path: paint revises the FROZEN seed; findings drop; final carries the paint", async () => {
  const { ledger, artifact } = await run([verdictRevise(PAINT_PINK_OAK), verdictDone()], 3);
  const r1 = ledger.rounds[0];
  assert.equal(r1.applied.kind, "paint");
  assert.equal(r1.applied.painted, 5); // the +z wall's five y=1 cells
  assert.equal(r1.conformance.accepted, true);
  const b = conformanceScore(r1.conformance.before), a = conformanceScore(r1.conformance.after);
  assert.ok(a.findings < b.findings, `findings must drop (${b.findings}→${a.findings})`);
  assert.equal(ledger.final.outcome, "done");
  const painted = artifact.placements.filter((p) => p.block === "minecraft:oak_planks" && p.pos[1] === 1 && p.pos[2] === 3);
  assert.equal(painted.length, 5);
});

test("AB2 the seed artifact is recorded on the ledger for replay (the ledger IS the input)", async () => {
  const { ledger } = await run([verdictDone()], 2);
  assert.deepEqual(ledger.seedArtifact, seedArtifact());
  assert.equal(ledger.final.outcome, "done");
});

test("AB3 geometry/program levers are UNAVAILABLE on a fixed-geometry seed (the named difference)", async () => {
  const adjust = { action: "adjust-params", elementId: "shell", params: { height: 4 } };
  const { ledger } = await run([verdictRevise(adjust)], 1);
  const r1 = ledger.rounds[0];
  assert.equal(r1.applied.kind, "unavailable");
  assert.equal(r1.conformance.accepted, false);
  // liveActions offered to the model is paint-only
  assert.deepEqual(ledger.liveActions, ["spray-paint"]);
});

test("AB4 a regressing paint rolls back; the frozen seed is unchanged", async () => {
  const { ledger, artifact } = await run([verdictRevise(PAINT_OAK_COBBLE)], 1);
  const r1 = ledger.rounds[0];
  assert.equal(r1.conformance.accepted, false);
  assert.match(r1.conformance.reason, /^regressed: /);
  assert.ok(!artifact.placements.some((p) => p.block === "minecraft:cobblestone"));
  assert.equal(serializeArtifact(artifact), serializeArtifact(seedArtifact()), "rolled back to the seed");
});

// --- AR: replay + offline ------------------------------------------------------------------------

test("AR1 replayLedger reproduces the loop's final artifact byte-identically (seed + paint trail)", async () => {
  const { ledger, artifact } = await run([verdictRevise(PAINT_PINK_OAK), verdictDone()], 3);
  const { artifact: replayed, applied } = replayLedger({ ledger, pack: PACK });
  assert.equal(serializeArtifact(replayed), serializeArtifact(artifact));
  assert.equal(applied.paintPlacements, 5);
  assert.equal(applied.geometryAdjusts, 0);
});

test("AR2 replay throughRound 0 is the seed alone; an unreplayable accepted kind throws", async () => {
  const { ledger } = await run([verdictRevise(PAINT_PINK_OAK), verdictDone()], 3);
  const seedOnly = replayLedger({ ledger, pack: PACK, throughRound: 0 });
  assert.equal(serializeArtifact(seedOnly.artifact), serializeArtifact(seedArtifact()));

  const corrupt = { ...ledger, rounds: [{ round: 1, decision: "revise", conformance: { accepted: true }, applied: { kind: "geometry" }, action: {} }] };
  assert.throws(() => replayLedger({ ledger: corrupt, pack: PACK }), /artifact-base round 1 accepted with unreplayable/);
});

test("AR3 offlineAssert re-asserts a clean artifact-base ledger and flags a tampered seed", async () => {
  const { ledger, artifact } = await run([verdictRevise(PAINT_PINK_OAK), verdictDone()], 3);
  // omit `conform`: the round checks + replay byte-equality (the Rule 5 teeth) still run
  const ok = offlineAssert({ ledger, finalArtifactText: serializeArtifact(artifact), pack: PACK });
  assert.equal(ok.ok, true, `clean ledger must pass: ${ok.problems.join("; ")}`);

  const tampered = { ...ledger, seedArtifact: { ...ledger.seedArtifact, placements: "not-an-array" } };
  const bad = offlineAssert({ ledger: tampered, finalArtifactText: serializeArtifact(artifact), pack: PACK });
  assert.equal(bad.ok, false);
  assert.ok(bad.problems.some((p) => /seed artifact invalid/.test(p)));
});

// --- AS: the build seam constants ----------------------------------------------------------------

test("AS1 BUILD_BUDGET is the single calibration; buildRels derives namespaced paths", () => {
  assert.equal(BUILD_BUDGET, PATTERN_BOOK_BUDGET);
  const r = buildRels("cottage");
  assert.equal(r.buildKey, "cottage-build");
  assert.equal(r.seedArtifact, "benchmarks/sculpture/workshop/cottage-build/seed-artifact.json");
  assert.equal(r.ledger, "benchmarks/sculpture/workshop/cottage-build.json");
  assert.equal(r.final, "benchmarks/sculpture/workshop/cottage-build/final-artifact.json");
  assert.equal(r.record, "benchmarks/sculpture/build/cottage.json");
  // the build ledger never collides with the committed pattern-book program-seed ledger
  assert.notEqual(r.ledger, "benchmarks/sculpture/workshop/cottage.json");
  const ns = buildRels("barn", "packs/saltcrag.json");
  assert.equal(ns.runKey, "barn--saltcrag");
  assert.equal(ns.seedArtifact, "benchmarks/sculpture/workshop/barn--saltcrag-build/seed-artifact.json");
});
