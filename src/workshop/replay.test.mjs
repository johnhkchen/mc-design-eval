// workshop replay tests (T-126-01) — a synthetic loop run produces the ledger; replay must
// reproduce its final artifact byte-identically; offlineAssert passes the honest record and
// catches every tampered variant. Groups: R (replay), O (offline tamper matrix).

import { test } from "node:test";
import assert from "node:assert/strict";

import { runConformance } from "../pack/conformance.mjs";
import { artifactOccupancy } from "../view/occupancy.mjs";
import { runWorkshopLoop } from "./loop.mjs";
import { assertWorkshopProgram, WORKSHOP_PROGRAM_SCHEMA } from "./program.mjs";
import { serializeArtifact, replayLedger, offlineAssert } from "./replay.mjs";

const PACK = {
  palette: [{ role: "wall.field", block: "oak_planks" }, { role: "wall.trim", block: "cobblestone" }],
  decoration: [],
  conformance: { checks: ["courses-even", "palette-in-pack"] },
};
const conform = (artifact, declarations) =>
  runConformance({ occ: artifactOccupancy(artifact), declarations }, PACK);

const seedProgram = () => assertWorkshopProgram({
  schema: WORKSHOP_PROGRAM_SCHEMA, subject: "synthetic", pack: "test-pack",
  budget: { rounds: 3 },
  declarations: { bands: [{ name: "walls", yRange: [0, 2], blocks: ["oak_planks"] }] },
  elements: [{
    id: "shell", kind: "shell",
    spec: {
      footprint: { x0: 0, x1: 4, z0: 0, z1: 3 }, y0: 0, height: 3, wallBlock: "oak_planks",
      courses: [{ yRange: [1, 1], block: "pink_wool" }],
    },
  }],
});

/** One accepted paint, one rolled-back paint, one accepted adjust, then done? budget 3 → use:
 *  r1 paint accepted, r2 adjust accepted (height 4 — taller wall, pink band unchanged → lateral
 *  but more oak cells... still no regression), r3 done. */
const verdicts = () => [
  {
    critique: { issues: [{ region: "south wall", issue: "pink band", severity: "major" }] },
    decision: "revise",
    action: { action: "spray-paint", dir: "+z", toBlock: "oak_planks", fromBlock: "pink_wool" },
    rationale: "repaint the foreign band",
  },
  {
    critique: { issues: [{ region: "walls", issue: "too squat vs concept", severity: "minor" }] },
    decision: "revise",
    action: { action: "adjust-params", elementId: "shell", params: { height: 4 } },
    rationale: "raise the walls a course",
  },
  { critique: { issues: [] }, decision: "done", rationale: "reads as the concept now" },
];

async function run() {
  const script = verdicts();
  const exchange = async () => ({
    verdict: script.shift(),
    replies: [{ attempt: 1, parsed: true, rawReply: "synthetic", source: "live" }],
    askCount: 1,
  });
  return runWorkshopLoop({ program: seedProgram(), pack: PACK, seams: { exchange } });
}

// --- R: replay ------------------------------------------------------------------------------------

test("R1 replay reproduces the loop's final artifact byte-identically (paint + adjust mix)", async () => {
  const { ledger, artifact } = await run();
  assert.equal(ledger.rounds.filter((r) => r.conformance.accepted && r.decision === "revise").length, 2);
  const replayed = replayLedger({ ledger });
  assert.equal(serializeArtifact(replayed.artifact), serializeArtifact(artifact));
  assert.deepEqual(replayed.applied,
    { programAdjusts: 1, geometryAdjusts: 0, recognized: 0, paintPlacements: 5, paintPruned: 0 });
  assert.equal(replayed.program.elements[0].spec.height, 4, "the accepted adjust is in the replayed program");
});

test("R2 rejected rounds are skipped exactly as the cage skipped them (ledger round-trip)", async () => {
  const { ledger, artifact } = await run();
  // tamper a COPY: flip the rolled-back? none here — instead drop the accepted adjust round and
  // confirm replay diverges (proves accepted rounds are load-bearing, rejected ones not)
  const sansAdjust = structuredClone(ledger);
  sansAdjust.rounds = sansAdjust.rounds.filter((r) => r.applied?.kind !== "program");
  const replayed = replayLedger({ ledger: sansAdjust });
  assert.notEqual(serializeArtifact(replayed.artifact), serializeArtifact(artifact));
});

test("R4 throughRound bounds the replay to a prefix; the full default is byte-identical (T-135-01)", async () => {
  const { ledger, artifact } = await run();
  const seedOnly = replayLedger({ ledger, throughRound: 0 });
  assert.deepEqual(seedOnly.applied,
    { programAdjusts: 0, geometryAdjusts: 0, recognized: 0, paintPlacements: 0, paintPruned: 0 });
  const bare = replayLedger({ ledger: { ...structuredClone(ledger), rounds: [] } });
  assert.equal(serializeArtifact(seedOnly.artifact), serializeArtifact(bare.artifact));

  const afterPaint = replayLedger({ ledger, throughRound: 1 });
  assert.deepEqual(afterPaint.applied,
    { programAdjusts: 0, geometryAdjusts: 0, recognized: 0, paintPlacements: 5, paintPruned: 0 });
  assert.notEqual(serializeArtifact(afterPaint.artifact), serializeArtifact(artifact));

  const full = replayLedger({ ledger, throughRound: ledger.rounds.length });
  assert.equal(serializeArtifact(full.artifact), serializeArtifact(artifact));

  assert.throws(() => replayLedger({ ledger, throughRound: -1 }), /throughRound/);
  assert.throws(() => replayLedger({ ledger, throughRound: 1.5 }), /throughRound/);
});

test("R3 an unreplayable accepted round throws (corrupt ledger, not a judgement call)", async () => {
  const { ledger } = await run();
  const bad = structuredClone(ledger);
  const adj = bad.rounds.find((r) => r.applied?.kind === "program");
  adj.action = { action: "re-recognize", elementId: "shell" };
  assert.throws(() => replayLedger({ ledger: bad }), /not replayable/);
});

// --- O: offline tamper matrix -----------------------------------------------------------------------

test("O1 the honest record passes offline, including the final-conformance re-derivation", async () => {
  const { ledger, artifact } = await run();
  const r = offlineAssert({ ledger, finalArtifactText: serializeArtifact(artifact), conform });
  assert.deepEqual(r.problems, []);
  assert.equal(r.ok, true);
});

test("O2 tamper matrix: every forgery is caught", async () => {
  const { ledger, artifact } = await run();
  const text = serializeArtifact(artifact);
  const tampered = (mutate) => {
    const l = structuredClone(ledger);
    mutate(l);
    return offlineAssert({ ledger: l, finalArtifactText: text, conform });
  };

  const cases = [
    [(l) => { l.schema = "workshop-ledger/v999"; }, /schema/],
    [(l) => { l.program.elements = []; }, /seed program invalid/],
    [(l) => { l.budget.rounds = 2; }, /exceed the declared budget/],
    [(l) => { l.final.rounds = 99; }, /final\.rounds/],
    [(l) => { l.final.outcome = "victory"; }, /outcome/],
    [(l) => { delete l.rounds[0].replies; }, /raw replies missing/],
    [(l) => { l.rounds[0].askCount = 9; }, /reply-policy bound/],
    [(l) => { delete l.rounds[0].action; }, /"revise" without an action/],
    // forge an acceptance the recorded reports refute: claim the paint round regressed-but-accepted
    [(l) => { l.rounds[0].conformance.after = l.rounds[0].conformance.before; l.rounds[0].conformance.before = structuredClone(l.rounds[1].conformance.after); l.rounds[0].conformance.before.checks.push({ name: "watertight", passed: true, findings: [] }); }, /show a regression/],
    // edit a recorded placement → replay diverges from the committed final artifact
    [(l) => { l.rounds[0].applied.placements[0].block = "minecraft:cobblestone"; }, /REPLAY DIVERGES/],
    // drop the accepted adjust round → replay diverges
    [(l) => { l.rounds.splice(1, 1); l.final.rounds = 2; }, /REPLAY DIVERGES|outcome/],
    // forge the final conformance report
    [(l) => { l.final.conformance.checks[0].findings.push("forged"); }, /re-derivation differs/],
  ];
  for (const [mutate, rx] of cases) {
    const r = tampered(mutate);
    assert.equal(r.ok, false, `expected failure for ${rx}`);
    assert.ok(r.problems.some((m) => rx.test(m)), `problems ${JSON.stringify(r.problems)} should match ${rx}`);
  }
});

test("O3 missing final artifact text is itself a problem", async () => {
  const { ledger } = await run();
  const r = offlineAssert({ ledger, finalArtifactText: "" });
  assert.ok(r.problems.some((m) => /finalArtifactText missing/.test(m)));
});

// --- RG: geometry-bearing replay (T-136-01) — the AC's integration case ---------------------------

import { resolve as resolvePath, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadStylePack } from "../pack/style-pack.mjs";
import { assertBuildingProgram } from "../recognition/program.mjs";
import { substituteMass } from "./geometry.mjs";
import { seedWorkshopProgram } from "./seed.mjs";

const rustic = loadStylePack(resolvePath(dirname(fileURLToPath(import.meta.url)), "..", "..", "packs", "rustic.json"));

const sourceProgram = () => assertBuildingProgram({
  schema: "building-program/v1",
  subject: "synthetic",
  pack: "rustic",
  reading: { summary: "two touching gabled masses" },
  masses: [
    {
      id: "main", rect: { x0: 0, z0: 0, w: 13, d: 9 }, storeys: 2, storeyHeight: 4,
      walls: { ground: { role: "wall.field.ground" }, upper: { role: "wall.infill.upper" } },
      roof: { idiom: "roof.gable", ridgeAxis: "x", pitchClass: 1, fieldRole: "roof.field" },
      openings: [],
    },
    {
      id: "annex", rect: { x0: 13, z0: 2, w: 5, d: 5 }, storeys: 2, storeyHeight: 4,
      walls: { ground: { role: "wall.field.ground" }, upper: { role: "wall.infill.upper" } },
      roof: { idiom: "roof.gable", ridgeAxis: "z", pitchClass: 1, fieldRole: "roof.field" },
      openings: [],
    },
  ],
});

/** Constant-pass gate: this block tests REPLAY semantics, not the cage (the cage has its own). */
const passConform = () => ({ schema: "pack-conformance/v1", passed: true, checks: [{ name: "ok", passed: true, findings: [] }] });

/** A synthetic injected re-recognize applier — async (the await path) returning the runner's
 *  shape: the fragment + its raw replies + the substituted pair. */
const recognizeApplier = (fragmentOf) => async ({ program, source, pack }, action) => {
  const mass = fragmentOf(source);
  const r = substituteMass(
    { source, pack, budget: { ...program.budget }, proportions: program.declarations?.proportions ?? null },
    { massId: action.massId, mass },
  );
  return { kind: "recognize", mass, replies: [{ attempt: 1, parsed: true, rawReply: "synthetic fragment", source: "live" }], askCount: 1, program: r.program, source: r.source };
};

async function runGeometry() {
  const source = sourceProgram();
  const { workshopProgram } = seedWorkshopProgram({ program: source, pack: rustic, budget: { rounds: 4 } });
  // round 1: paint two wall cells (one will survive the shrink, one will orphan)
  const groundBlock = rustic.palette.find((p) => p.role === "wall.field.ground").block;
  const paintApplier = () => ({
    kind: "paint", painted: 2, skipped: {},
    placements: [
      { op: "voxel", pos: [0, 1, 0], block: `minecraft:${groundBlock}` },   // ground course — survives
      { op: "voxel", pos: [6, 13, 4], block: `minecraft:${groundBlock}` },  // ridge-line cell — orphans once the eave drops to 6 (new ridge 11)
    ],
  });
  const script = [
    { critique: { issues: [{ region: "walls", issue: "banding", severity: "minor" }] }, decision: "revise",
      action: { action: "spray-paint", dir: "+z", toBlock: groundBlock }, rationale: "recolor" },
    { critique: { issues: [{ region: "proportion", issue: "walls too tall vs concept", severity: "major" }] }, decision: "revise",
      action: { action: "adjust-params", elementId: "main", massId: "main", params: { eaveHeight: 6 } }, rationale: "lower the eave" },
    { critique: { issues: [{ region: "annex", issue: "mis-read storey count", severity: "major" }] }, decision: "revise",
      action: { action: "re-recognize", elementId: "annex", massId: "annex" }, rationale: "re-read the annex" },
    { critique: { issues: [] }, decision: "done", rationale: "reads right" },
  ];
  const exchange = async () => ({
    verdict: script.shift(),
    replies: [{ attempt: 1, parsed: true, rawReply: "synthetic", source: "live" }],
    askCount: 1,
  });
  const appliers = {
    ...((await import("./actions.mjs")).DEFAULT_APPLIERS),
    "spray-paint": paintApplier,
    "re-recognize": recognizeApplier((src) => ({ ...structuredClone(src.masses.find((m) => m.id === "annex")), storeys: 1 })),
  };
  return runWorkshopLoop({
    program: workshopProgram, pack: rustic, source,
    seams: { exchange, conform: passConform }, appliers,
  });
}

test("RG1 a geometry revision round-trips through replay byte-identically (AC #1's integration case)", async () => {
  const { ledger, artifact, program } = await runGeometry();
  assert.equal(ledger.final.outcome, "done");
  const kinds = ledger.rounds.map((r) => r.applied?.kind ?? null);
  assert.deepEqual(kinds, ["paint", "geometry", "recognize", null]);
  assert.ok(ledger.rounds.every((r) => r.conformance.accepted));
  assert.equal(ledger.rounds[1].applied.paintPruned, 1, "the top-course recolor orphaned at eave 6");
  assert.ok(Array.isArray(ledger.rounds[2].applied.replies) && ledger.rounds[2].applied.mass.storeys === 1);
  assert.deepEqual(ledger.source, sourceProgram(), "the SEED source rides the ledger");

  const replayed = replayLedger({ ledger, pack: rustic });
  assert.equal(serializeArtifact(replayed.artifact), serializeArtifact(artifact), "byte-identical replay");
  assert.equal(JSON.stringify(replayed.program), JSON.stringify(program), "the final program re-derives");
  assert.deepEqual(replayed.applied,
    { programAdjusts: 0, geometryAdjusts: 1, recognized: 1, paintPlacements: 1, paintPruned: 1 });
  assert.equal(replayed.source.masses.find((m) => m.id === "annex").storeys, 1, "the fragment re-applied verbatim");
  assert.equal(replayed.program.elements.find((e) => e.id === "main-shell").spec.height, 6, "the lever re-derived");
});

test("RG2 geometry-bearing replay refuses without its committed inputs (pack, source)", async () => {
  const { ledger } = await runGeometry();
  assert.throws(() => replayLedger({ ledger }), /pass the pack/);
  const sansSource = structuredClone(ledger);
  delete sansSource.source;
  assert.throws(() => replayLedger({ ledger: sansSource, pack: rustic }), /no seed source/);
});

test("RG3 offlineAssert covers the geometry record: honest passes, tampered recognize rounds named", async () => {
  const { ledger, artifact } = await runGeometry();
  const finalArtifactText = serializeArtifact(artifact);
  const honest = offlineAssert({ ledger, finalArtifactText, pack: rustic, conform: passConform });
  assert.deepEqual(honest, { ok: true, problems: [] });

  const noReplies = structuredClone(ledger);
  delete noReplies.rounds[2].applied.replies;
  const r1 = offlineAssert({ ledger: noReplies, finalArtifactText, pack: rustic });
  assert.ok(r1.problems.some((m) => /raw fragment replies/.test(m)), r1.problems.join("; "));

  const noFragment = structuredClone(ledger);
  delete noFragment.rounds[2].applied.mass;
  const r2 = offlineAssert({ ledger: noFragment, finalArtifactText, pack: rustic });
  assert.ok(r2.problems.some((m) => /ledgered fragment/.test(m)), r2.problems.join("; "));

  const overAsked = structuredClone(ledger);
  overAsked.rounds[2].applied.askCount = 99;
  const r3 = offlineAssert({ ledger: overAsked, finalArtifactText, pack: rustic });
  assert.ok(r3.problems.some((m) => /re-recognize askCount 99/.test(m)), r3.problems.join("; "));
});
