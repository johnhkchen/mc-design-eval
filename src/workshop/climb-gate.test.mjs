// Tests for the picture-driven climb gate (T-188-01, story S-188, epic E-48). Pure — the accept-gate,
// the stopping rule, and the eyes-vs-hands classifier are the climb's DECISIONS; they are correct (or
// not) independent of the metered run's outcome, so they gate `npm test` while the runner does not.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  acceptsRound,
  stoppingDecision,
  classifyInventory,
  CLIMB_DEFAULTS,
  TOOL_DEPARTMENTS,
  CLIMB_GATE_SCHEMA,
} from "./climb-gate.mjs";

// ---- CG1: acceptsRound — clear improvement past the margin is accepted ----
test("CG1 acceptsRound accepts a score that improves past the margin", () => {
  const r = acceptsRound({ score: 20 }, { score: 30 }, { margin: 4 });
  assert.equal(r.accept, true);
  assert.equal(r.delta, 10);
  assert.match(r.reason, /improved/);
});

// ---- CG2: acceptsRound — a regression past the margin is rejected (rolled back) ----
test("CG2 acceptsRound rejects a regression past the margin", () => {
  const r = acceptsRound({ score: 30 }, { score: 18 }, { margin: 4 });
  assert.equal(r.accept, false);
  assert.match(r.reason, /regressed/);
});

// ---- CG3: acceptsRound — within-margin tie broken by coverage shrink, else rejected ----
test("CG3 acceptsRound breaks a within-margin tie on coverage shrink", () => {
  // tie (Δ=2 < margin 4) but one fewer wrong-style department → accept
  const accept = acceptsRound(
    { score: 20, wrongStyleBreadth: 3, nMajor: 2 },
    { score: 22, wrongStyleBreadth: 2, nMajor: 2 },
    { margin: 4 },
  );
  assert.equal(accept.accept, true);
  assert.match(accept.reason, /coverage shrank/);
  // tie with no shrink → reject
  const reject = acceptsRound(
    { score: 20, wrongStyleBreadth: 2, nMajor: 1 },
    { score: 21, wrongStyleBreadth: 2, nMajor: 1 },
    { margin: 4 },
  );
  assert.equal(reject.accept, false);
  assert.match(reject.reason, /no shrink/);
  // fewer majors also breaks the tie
  const byMajor = acceptsRound(
    { score: 20, wrongStyleBreadth: 2, nMajor: 3 },
    { score: 20, wrongStyleBreadth: 2, nMajor: 2 },
    { margin: 4 },
  );
  assert.equal(byMajor.accept, true);
});

// ---- CG4: stoppingDecision — never stops before minRounds, even on agent-done ----
test("CG4 stoppingDecision honors the minRounds floor", () => {
  const early = stoppingDecision({ round: 1, agentDone: true, minRounds: 3 });
  assert.equal(early.stop, false);
  assert.equal(early.reason, null);
  // at/after minRounds, agent-done stops
  const done = stoppingDecision({ round: 3, agentDone: true, minRounds: 3 });
  assert.equal(done.stop, true);
  assert.equal(done.reason, "agent-done");
});

// ---- CG5: stoppingDecision — stall (K rolled back) and the round cap both stop ----
test("CG5 stoppingDecision stops on stall and on the round cap", () => {
  const stalled = stoppingDecision({ round: 4, noAcceptStreak: 2, stallK: 2, minRounds: 3, maxRounds: 5 });
  assert.equal(stalled.stop, true);
  assert.match(stalled.reason, /stalled/);
  const capped = stoppingDecision({ round: 5, noAcceptStreak: 0, stallK: 2, minRounds: 3, maxRounds: 5 });
  assert.equal(capped.stop, true);
  assert.equal(capped.reason, "round cap");
  const keepGoing = stoppingDecision({ round: 3, noAcceptStreak: 1, stallK: 2, minRounds: 3, maxRounds: 5 });
  assert.equal(keepGoing.stop, false);
});

// ---- CG6: classifyInventory — acted-on vs eyes-only from a real-shaped trajectory ----
test("CG6 classifyInventory separates acted-on departments from eyes-only", () => {
  const trajectory = [
    // round 0: seed, ROOF + CHIMNEY named; agent will pick the roof tool
    { round: 0, score: 14, items: [
      { department: "ROOF", kind: "replace", severity: "major", missing: "stepped pyramid not a gable" },
      { department: "CHIMNEY", kind: "add", severity: "major", missing: "tall fieldstone chimney absent" },
    ], pick: { tool: "apply_gable_roof" }, applied: false, accepted: false },
    // round 1: applied the gable, accepted (+8); CHIMNEY still named, no tool reaches it
    { round: 1, score: 14, items: [
      { department: "CHIMNEY", kind: "add", severity: "major", missing: "tall fieldstone chimney absent" },
      { department: "OPENING", kind: "add", severity: "minor", missing: "no shuttered reveals" },
    ], pick: { tool: "apply_gable_roof" }, applied: true, accepted: true, scoreAfter: { score: 22 } },
    // terminal: final build score
    { round: 2, score: 22, items: [], pick: { tool: "done" }, applied: false, accepted: false },
  ];
  const inv = classifyInventory(trajectory, { margin: 4 });
  const acted = inv.actedOn.map((a) => a.department).sort();
  assert.deepEqual(acted, ["ROOF"]);
  assert.equal(inv.actedOn[0].byTool[0], "apply_gable_roof");
  assert.deepEqual(inv.actedOn[0].deltas, [8]);
  const eyes = inv.eyesOnly.map((e) => e.department).sort();
  assert.deepEqual(eyes, ["CHIMNEY", "OPENING"]); // named, never reached by an accepted tool
  assert.equal(inv.verdict.climbed, true);
  assert.equal(inv.verdict.delta, 8);
  assert.equal(inv.verdict.actionableFrac, 1); // 1 applied, 1 accepted
});

// ---- CG7: classifyInventory — a tool accepted then later rolled back flags oscillation ----
test("CG7 classifyInventory flags oscillation when a tool is accepted then rolled back", () => {
  const trajectory = [
    { round: 0, score: 20, items: [{ department: "WALL", kind: "add", severity: "minor", missing: "x" }],
      pick: { tool: "construct_walls" }, applied: false, accepted: false },
    { round: 1, score: 20, items: [], pick: { tool: "construct_walls" }, applied: true, accepted: true, scoreAfter: { score: 26 } },
    { round: 2, score: 26, items: [], pick: { tool: "construct_walls" }, applied: true, accepted: false, scoreAfter: { score: 22 } },
    { round: 3, score: 26, items: [], pick: { tool: "done" }, applied: false, accepted: false },
  ];
  const inv = classifyInventory(trajectory, { margin: 4 });
  assert.equal(inv.verdict.oscillated, true);
  assert.equal(inv.verdict.actionableFrac, 0.5); // 2 applied, 1 accepted
});

// ---- CG8: classifyInventory — stalled verdict + purity + schema/map shape ----
test("CG8 classifyInventory reports a flat run as stalled and does not mutate input", () => {
  const trajectory = [
    { round: 0, score: 18, items: [{ department: "ROOM", kind: "add", severity: "minor", missing: "interior" }],
      pick: { tool: "done" }, applied: false, accepted: false },
    { round: 1, score: 18, items: [], pick: { tool: "done" }, applied: false, accepted: false },
  ];
  const frozen = JSON.stringify(trajectory);
  const inv = classifyInventory(trajectory, { margin: 4 });
  assert.equal(inv.verdict.climbed, false);
  assert.equal(inv.verdict.stalled, true);
  assert.equal(inv.verdict.actionableFrac, 0); // nothing applied
  assert.deepEqual(inv.eyesOnly.map((e) => e.department), ["ROOM"]);
  assert.equal(JSON.stringify(trajectory), frozen); // pure

  // sanity on the exported constants/shape
  assert.equal(CLIMB_GATE_SCHEMA, "climb-gate/v1");
  assert.equal(CLIMB_DEFAULTS.minRounds, 3);
  assert.deepEqual(TOOL_DEPARTMENTS.apply_gable_roof, ["ROOF"]);
});

// ---- CG9: classifyInventory — empty trajectory is a loud failure, not a silent pass ----
test("CG9 classifyInventory rejects an empty trajectory", () => {
  assert.throws(() => classifyInventory([]), /non-empty/);
});
