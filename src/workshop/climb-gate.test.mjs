// Tests for the picture-driven climb gate (T-188-01, story S-188, epic E-48). Pure — the accept-gate,
// the stopping rule, and the eyes-vs-hands classifier are the climb's DECISIONS; they are correct (or
// not) independent of the metered run's outcome, so they gate `npm test` while the runner does not.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  acceptsRound,
  stoppingDecision,
  classifyInventory,
  deptMajorCounts,
  deptItemCounts,
  buildDigest,
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
  assert.deepEqual(TOOL_DEPARTMENTS.recolor_roof, ["ROOF"]); // T-189-01: the roof-MATERIAL hand
});

// ---- CG9: classifyInventory — empty trajectory is a loud failure, not a silent pass ----
test("CG9 classifyInventory rejects an empty trajectory", () => {
  assert.throws(() => classifyInventory([]), /non-empty/);
});

// ---- CG10: deptMajorCounts — majors counted per department, minors ignored (T-190-01) ----
test("CG10 deptMajorCounts counts majors per department and ignores minors", () => {
  const items = [
    { department: "ROOF", severity: "major" },
    { department: "WALL", severity: "major" },
    { department: "WALL", severity: "major" },
    { department: "WALL", severity: "minor" },   // ignored
    { department: "OPENING", severity: "minor" }, // ignored
    { severity: "major" },                         // no department → skipped
  ];
  assert.deepEqual(deptMajorCounts(items), { ROOF: 1, WALL: 2 });
  assert.deepEqual(deptMajorCounts([]), {});
  assert.deepEqual(deptMajorCounts(undefined), {});
});

// ---- CG11: acceptsRound — department-aware tie-break keeps a tool that cleared its own major (T-190-01) ----
test("CG11 acceptsRound keeps a tool that clears a major in its target department", () => {
  // The T-189 scenario: ROOF major clears but a pre-existing WALL major is promoted, so whole-build nMajor
  // and breadth are FLAT and the score is within margin — yet recolor_roof did its job. Department-aware
  // leg keeps it.
  const accept = acceptsRound(
    { score: 40, wrongStyleBreadth: 1, nMajor: 1 },
    { score: 42, wrongStyleBreadth: 1, nMajor: 1 },
    {
      margin: 4,
      targetDepartments: ["ROOF"],
      beforeDeptMajors: { ROOF: 1, WALL: 0 },
      afterDeptMajors: { ROOF: 0, WALL: 1 }, // attention shifted to WALL
    },
  );
  assert.equal(accept.accept, true);
  assert.match(accept.reason, /ROOF cleared a major/);

  // Negative: the target department did NOT clear → still reject (flat whole-build, no department clear).
  const reject = acceptsRound(
    { score: 40, wrongStyleBreadth: 1, nMajor: 1 },
    { score: 41, wrongStyleBreadth: 1, nMajor: 1 },
    {
      margin: 4,
      targetDepartments: ["ROOF"],
      beforeDeptMajors: { ROOF: 1 },
      afterDeptMajors: { ROOF: 1 },
    },
  );
  assert.equal(reject.accept, false);
  assert.match(reject.reason, /no shrink/);

  // Backward compatibility: no department context → identical to the legacy tie verdict (CG3 inputs).
  const legacy = acceptsRound(
    { score: 20, wrongStyleBreadth: 2, nMajor: 1 },
    { score: 21, wrongStyleBreadth: 2, nMajor: 1 },
    { margin: 4 },
  );
  assert.equal(legacy.accept, false);
  assert.match(legacy.reason, /no shrink/);

  // T-191-01 INTENDED SEMANTIC CHANGE: a past-margin regression where the tool CLEARED a major in its target
  // department and grew no targeted dept's total burden is now KEPT by the department-dominant override (the
  // regression is attention-shift to an UNtargeted dept). This is the case T-190 §ceiling named and T-191
  // deliberately inverts — pre-T-191 this rejected at the regression branch.
  const overrideKeep = acceptsRound(
    { score: 50, nMajor: 1 }, { score: 30, nMajor: 1 },
    {
      margin: 4, targetDepartments: ["ROOF"],
      beforeDeptMajors: { ROOF: 1 }, afterDeptMajors: { ROOF: 0, WALL: 1 },
      beforeDeptItems: { ROOF: { major: 1, minor: 0 } },
      afterDeptItems: { ROOF: { major: 0, minor: 0 }, WALL: { major: 1, minor: 0 } },
    },
  );
  assert.equal(overrideKeep.accept, true);
  assert.match(overrideKeep.reason, /ROOF cleared a major \(department-dominant override\)/);
});

// ---- CG12: buildDigest — order-independent, block-sensitive, stable on empty (T-190-01) ----
test("CG12 buildDigest is order-independent and block-sensitive", () => {
  const a = [{ pos: [0, 0, 0], block: "stone" }, { pos: [1, 0, 0], block: "deepslate_tiles" }];
  const aPermuted = [{ pos: [1, 0, 0], block: "deepslate_tiles" }, { pos: [0, 0, 0], block: "stone" }];
  assert.equal(buildDigest(a), buildDigest(aPermuted)); // permutation → same digest

  // Same positions, different block (recolor_roof vs apply_gable_roof) → DIFFERENT digest.
  const brown = [{ pos: [0, 0, 0], block: "spruce_planks" }];
  const grey = [{ pos: [0, 0, 0], block: "deepslate_tiles" }];
  assert.notEqual(buildDigest(brown), buildDigest(grey));

  // Empty is stable and non-throwing.
  assert.equal(buildDigest([]), "");
  assert.equal(buildDigest(), "");
});

// ---- CG13: deptItemCounts — {major,minor} per department, no-department skipped (T-191-01) ----
test("CG13 deptItemCounts counts majors and minors per department", () => {
  const items = [
    { department: "ROOF", severity: "major" },
    { department: "ROOF", severity: "minor" },
    { department: "WALL", severity: "major" },
    { department: "WALL", severity: "major" },
    { department: "WALL", severity: "minor" },
    { severity: "major" },          // no department → skipped
    { department: "OPENING" },      // no severity → skipped
  ];
  assert.deepEqual(deptItemCounts(items), {
    ROOF: { major: 1, minor: 1 },
    WALL: { major: 2, minor: 1 },
  });
  assert.deepEqual(deptItemCounts([]), {});
  assert.deepEqual(deptItemCounts(undefined), {});
});

// ---- CG14: override KEEPS the glance-correct grey roof on a PAST-MARGIN regression (T-191-01) ----
test("CG14 override keeps the grey roof on a past-margin regression (the real T-190 shape)", () => {
  // The exact recorded T-190-01 round-3 shape: recolor_roof clears the ROOF major (reads brown→grey) and the
  // judge promotes pre-existing WALL+OPENING majors (UNtargeted by recolor_roof). Whole-build score regresses
  // 60→48 (delta -12, past margin). Targeted dept ROOF: total burden FALLS 2→1 (major→0, the eave/verge
  // minor persists). Override fires → KEEP, where the old scalar gate rolled it back.
  const r = acceptsRound(
    { score: 60, nMajor: 1, wrongStyleBreadth: 1 },
    { score: 48, nMajor: 2, wrongStyleBreadth: 2 },
    {
      margin: 4, targetDepartments: ["ROOF"],
      beforeDeptMajors: { ROOF: 1 },
      afterDeptMajors: { WALL: 1, OPENING: 1 },
      beforeDeptItems: { ROOF: { major: 1, minor: 1 } },
      afterDeptItems: { ROOF: { major: 0, minor: 1 }, WALL: { major: 1, minor: 0 }, OPENING: { major: 1, minor: 0 } },
    },
  );
  assert.equal(r.accept, true);
  assert.equal(r.delta, -12);
  assert.match(r.reason, /ROOF cleared a major \(department-dominant override\)/);
});

// ---- CG15: override REJECTS the adversarial fixture (net guard) AND the major-only guard LEAKS (T-191-01) ----
test("CG15 net guard rejects 'cleared a major but added minors in its own target'; major-only leaks", () => {
  // Adversarial: the tool clears the ROOF major but adds 2 new ROOF MINORS in its own target — net
  // degradation (ROOF total 1→2). The score regresses 60→48.
  const opts = {
    margin: 4, targetDepartments: ["ROOF"],
    beforeDeptMajors: { ROOF: 1 }, afterDeptMajors: { ROOF: 0 },
  };
  // With item counts → the net guard (c) blocks the override → regression reject.
  const guarded = acceptsRound(
    { score: 60 }, { score: 48 },
    { ...opts, beforeDeptItems: { ROOF: { major: 1, minor: 0 } }, afterDeptItems: { ROOF: { major: 0, minor: 2 } } },
  );
  assert.equal(guarded.accept, false);
  assert.match(guarded.reason, /regressed/);

  // WITHOUT item counts → major-only guard (a)+(b) LEAKS: it keeps the net-degraded fix. This documents
  // exactly why the net (total-item) guard exists — it is the falsification co-lever, not decoration.
  const leak = acceptsRound({ score: 60 }, { score: 48 }, opts);
  assert.equal(leak.accept, true);
  assert.match(leak.reason, /department-dominant override/);
});

// ---- CG16: override does NOT fire on a genuinely-bad change that clears nothing (T-191-01) ----
test("CG16 override does not fire when no targeted department cleared a major", () => {
  // A tool targets ROOF, regresses the whole-build score, and clears NO ROOF major (1→1). The override must
  // not fire — this is the genuinely-bad change the gate must still reject.
  const r = acceptsRound(
    { score: 60 }, { score: 48 },
    {
      margin: 4, targetDepartments: ["ROOF"],
      beforeDeptMajors: { ROOF: 1 }, afterDeptMajors: { ROOF: 1 },
      beforeDeptItems: { ROOF: { major: 1, minor: 0 } }, afterDeptItems: { ROOF: { major: 1, minor: 0 } },
    },
  );
  assert.equal(r.accept, false);
  assert.match(r.reason, /regressed/);
});

// ---- CG17: the override GENERALIZES past ROOF — frame_arch clearing an OPENING major is KEPT (T-192-01) ----
test("CG17 department-dominant override keeps an OPENING-targeting hand that cleared its major", () => {
  // The S-192 falsification crux: frame_arch (the arched-passage hand) targets OPENING. If it clears the
  // OPENING major and the judge promotes a pre-existing major in an UNtargeted dept (whole-build regression),
  // the override must KEEP it — proving the override is NOT roof-specific. Net guard satisfied (OPENING
  // total 1→0). This is CG14's shape on a DIFFERENT department, asserted deterministically (no spend).
  const r = acceptsRound(
    { score: 60 }, { score: 48 },
    {
      margin: 4, targetDepartments: TOOL_DEPARTMENTS.frame_arch, // ["OPENING"]
      beforeDeptMajors: { OPENING: 1 }, afterDeptMajors: { OPENING: 0, WALL: 1 }, // WALL promoted (untargeted)
      beforeDeptItems: { OPENING: { major: 1, minor: 0 } }, afterDeptItems: { OPENING: { major: 0, minor: 0 }, WALL: { major: 1, minor: 0 } },
    },
  );
  assert.equal(r.accept, true);
  assert.match(r.reason, /OPENING cleared a major \(department-dominant override\)/);

  // and the new hands resolve to their departments
  assert.deepEqual(TOOL_DEPARTMENTS.frame_arch, ["OPENING"]);
  assert.deepEqual(TOOL_DEPARTMENTS.articulate_walls, ["WALL"]);
  assert.deepEqual(TOOL_DEPARTMENTS.relief_walls, ["WALL"]); // T-195-01: the wall-RELIEF hand
  assert.deepEqual(TOOL_DEPARTMENTS.band_eave, ["ROOF"]);
});
