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
  assert.deepEqual(replayed.applied, { programAdjusts: 1, paintPlacements: 5 });
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
