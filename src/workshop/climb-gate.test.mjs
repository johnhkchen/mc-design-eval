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
  formReadyGate,
  FORM_READY_CLOSURE,
  CLOSURE_GAIN_MARGIN,
  TOOL_STAGE,
  closureDecidedMove,
  acceptsBatch,
  coldStartFloor,
  BATCH_DEFAULTS,
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
  assert.deepEqual(TOOL_DEPARTMENTS.rebuild_arch, ["OPENING"]); // T-203-01: the wide-arch REBUILD hand
  assert.equal(TOOL_STAGE.rebuild_arch, "detail"); // gated on form-readiness like the other detail hands
});

// CG-REB1 (T-203-01): the wide-arch rebuild is a DETAIL OPENING tool — blocked on an open form, allowed closed.
test("CG-REB1 rebuild_arch gates on form-readiness (detail stage)", () => {
  assert.equal(formReadyGate({ tool: "rebuild_arch", closure: 0.05 }).allow, false);
  assert.equal(formReadyGate({ tool: "rebuild_arch", closure: 0.95 }).allow, true);
});

// ==================== T-197-01 — form-before-detail ordering gate (S-197, E-51) ====================
// CG-FR1: a DETAIL tool is BLOCKED on an open form (the colonnade — you can't carve a doorway into holes)
test("CG-FR1 formReadyGate blocks a detail tool on an open form", () => {
  const g = formReadyGate({ tool: "carve_arch", closure: 0.05 });
  assert.equal(g.allow, false);
  assert.equal(g.stage, "detail");
  assert.match(g.reason, /form not ready/);
});

// CG-FR2: the SAME detail tool is ALLOWED once the form is closed
test("CG-FR2 formReadyGate allows a detail tool on a closed form", () => {
  const g = formReadyGate({ tool: "carve_arch", closure: 0.95 });
  assert.equal(g.allow, true);
  assert.match(g.reason, /form ready/);
});

// CG-FR3: FORM tools are always eligible (you must be able to close the shell, even when it is open)
test("CG-FR3 formReadyGate always allows a form tool regardless of closure", () => {
  assert.equal(formReadyGate({ tool: "close_shell", closure: 0.05 }).allow, true);
  assert.equal(formReadyGate({ tool: "construct_walls", closure: 0 }).allow, true);
  assert.equal(formReadyGate({ tool: "apply_gable_roof", closure: 0.1 }).allow, true);
  assert.equal(formReadyGate({ tool: "close_shell", closure: 0.05 }).stage, "form");
});

// CG-FR4: boundary + the REAL measured seed closure (0.615) blocks detail; exactly-at-threshold allows
test("CG-FR4 formReadyGate boundary: ≥threshold allows, the real 0.615 seed blocks detail", () => {
  assert.equal(formReadyGate({ tool: "relief_walls", closure: FORM_READY_CLOSURE }).allow, true, "exactly at threshold is ready (≥)");
  assert.equal(formReadyGate({ tool: "relief_walls", closure: 0.615 }).allow, false, "the real gatehouse seed band is not ready");
  assert.equal(formReadyGate({ tool: "band_eave", closure: 0.615 }).allow, false);
});

// CG-FR5: `done` / unknown tools are never blocked (the gate never invents a block; a stop stays honest)
test("CG-FR5 formReadyGate never blocks done or an unknown tool", () => {
  assert.equal(formReadyGate({ tool: "done", closure: 0 }).allow, true);
  assert.equal(formReadyGate({ tool: "nonexistent_tool", closure: 0 }).allow, true);
});

// CG-FR6: registry membership — close_shell labelled (WALL) and staged (form)
test("CG-FR6 close_shell is registered as a WALL form tool", () => {
  assert.deepEqual(TOOL_DEPARTMENTS.close_shell, ["WALL"]);
  assert.equal(TOOL_STAGE.close_shell, "form");
  assert.equal(TOOL_STAGE.carve_arch, "detail");
});

// CG-FR7: NaN/garbage closure fails safe (blocks detail rather than passing it on an unknown form)
test("CG-FR7 formReadyGate fails safe on a non-finite closure", () => {
  assert.equal(formReadyGate({ tool: "carve_arch", closure: NaN }).allow, false);
  assert.equal(formReadyGate({ tool: "carve_arch", closure: undefined }).allow, false);
});

// ==================== T-199-01 — the form-credit accept clause (S-199, E-49) ====================
// The form-analog of the department-dominant override: credit a form-readiness win (closure↑ toward 0.9)
// over the noisy picture scalar — but guarded so a flood/regress/new-major "closing" move is rejected.
// Falsified BOTH ways: CG-FC1 (the real T-198 KEEP) + CG-FC2/3/4 (the bad-move REJECTs).

// CG-FC1: KEEP the real T-198 close_shell tie — the exact recorded round-1 counts. The seed band closes
// 0.615→1.000 but the picture critique scores 16→16 (a tie); the OLD gate rolled this back as
// "tie (0): no shrink", deadlocking the climb at a colonnade. Form credit fires → KEEP.
test("CG-FC1 form-credit keeps the real T-198 close_shell tie (0.615→1.000, no new major)", () => {
  const r = acceptsRound(
    { score: 16, nMajor: 3, wrongStyleBreadth: 2 },
    { score: 16, nMajor: 3, wrongStyleBreadth: 2 },
    {
      margin: 4, targetDepartments: ["WALL"],
      closureBefore: 0.6153846153846154, closureAfter: 1.0,
      beforeDeptMajors: { ROOF: 1, WALL: 1, OPENING: 1 },
      afterDeptMajors: { ROOF: 1, WALL: 1, OPENING: 1 },
      beforeDeptItems: { ROOF: { major: 1, minor: 0 }, WALL: { major: 1, minor: 0 }, OPENING: { major: 1, minor: 0 } },
      afterDeptItems: { ROOF: { major: 1, minor: 0 }, WALL: { major: 1, minor: 0 }, OPENING: { major: 1, minor: 0 } },
    },
  );
  assert.equal(r.accept, true);
  assert.equal(r.delta, 0);
  assert.match(r.reason, /form-credit/);
  assert.match(r.reason, /0\.615->1\.000|0\.615.+1\.000/); // reports the observed closure gain
});

// CG-FC2: REJECT a "closing" move that ADDS A MAJOR (floods interior / regresses roof). Closure rises but
// a new major appears (ROOM flood-major + ROOF promoted) → (b′) whole-build no-new-major blocks the form
// clause; the whole-build score also regressed → reject as "regressed". No rubber-stamp.
test("CG-FC2 form-credit rejects a closing move that adds a major (flood/roof regress)", () => {
  const r = acceptsRound(
    { score: 16, nMajor: 3 }, { score: 4, nMajor: 5 },
    {
      margin: 4, targetDepartments: ["WALL"],
      closureBefore: 0.615, closureAfter: 1.0, // closure DID rise — the lure
      beforeDeptMajors: { ROOF: 1, WALL: 1, OPENING: 1 },
      afterDeptMajors: { ROOF: 2, WALL: 1, OPENING: 1, ROOM: 1 }, // ROOF regressed + a new ROOM major
      beforeDeptItems: { ROOF: { major: 1, minor: 0 }, WALL: { major: 1, minor: 0 }, OPENING: { major: 1, minor: 0 } },
      afterDeptItems: { ROOF: { major: 2, minor: 0 }, WALL: { major: 1, minor: 0 }, OPENING: { major: 1, minor: 0 }, ROOM: { major: 1, minor: 0 } },
    },
  );
  assert.equal(r.accept, false);
  assert.match(r.reason, /regressed/);
});

// CG-FC3: REJECT on the NET GUARD — closure rises, NO new major, but the TARGETED dept (WALL) total burden
// grows via added minors (1→3). This is CG15's net-minor analog for the form clause: "closed the wall but
// degraded its own target." (c′) blocks → falls through to the tie reject.
test("CG-FC3 form-credit rejects when the targeted dept's net total grows (net guard)", () => {
  const r = acceptsRound(
    { score: 16, nMajor: 3, wrongStyleBreadth: 2 },
    { score: 16, nMajor: 3, wrongStyleBreadth: 2 },
    {
      margin: 4, targetDepartments: ["WALL"],
      closureBefore: 0.615, closureAfter: 1.0,
      beforeDeptMajors: { ROOF: 1, WALL: 1, OPENING: 1 },
      afterDeptMajors: { ROOF: 1, WALL: 1, OPENING: 1 }, // no new major
      beforeDeptItems: { WALL: { major: 1, minor: 0 } },
      afterDeptItems: { WALL: { major: 1, minor: 2 } },  // WALL total 1→3 (net degradation)
    },
  );
  assert.equal(r.accept, false);
  assert.match(r.reason, /no shrink/);
});

// CG-FC4: REJECT a move with NO REAL FORM GAIN. A tie, no major change, but closure barely moved
// (0.615→0.62, gain 0.005 < margin 0.1) → guard (3) makes the clause inert → tie reject. Proves the clause
// is NOT "accept any closure wobble" — it demands a real rise toward form-ready.
test("CG-FC4 form-credit does not fire on a trivial closure wobble", () => {
  const r = acceptsRound(
    { score: 16, nMajor: 3, wrongStyleBreadth: 2 },
    { score: 16, nMajor: 3, wrongStyleBreadth: 2 },
    {
      margin: 4, targetDepartments: ["WALL"],
      closureBefore: 0.615, closureAfter: 0.62, // gain 0.005 < CLOSURE_GAIN_MARGIN
      beforeDeptMajors: { WALL: 1 }, afterDeptMajors: { WALL: 1 },
      beforeDeptItems: { WALL: { major: 1, minor: 0 } }, afterDeptItems: { WALL: { major: 1, minor: 0 } },
    },
  );
  assert.equal(r.accept, false);
  assert.match(r.reason, /no shrink/);
});

// CG-FC5: INERT / backward compatibility. With NO closure opts the form clause never fires — the CG3 tie
// inputs reject exactly as before. And when the form is ALREADY ready (closureBefore ≥ 0.9), a further
// closure rise earns no credit (guard 2) — the detail-gate governs there, not this clause.
test("CG-FC5 form-credit is inert without closure data and once the form is already ready", () => {
  // no closure context → legacy tie verdict, unchanged
  const legacy = acceptsRound(
    { score: 20, wrongStyleBreadth: 2, nMajor: 1 },
    { score: 21, wrongStyleBreadth: 2, nMajor: 1 },
    { margin: 4 },
  );
  assert.equal(legacy.accept, false);
  assert.match(legacy.reason, /no shrink/);

  // form already ready (0.95 ≥ 0.9) → no credit even on a rise + tie → tie reject
  const ready = acceptsRound(
    { score: 16, nMajor: 1, wrongStyleBreadth: 1 },
    { score: 16, nMajor: 1, wrongStyleBreadth: 1 },
    {
      margin: 4, targetDepartments: ["WALL"],
      closureBefore: 0.95, closureAfter: 1.0,
      beforeDeptMajors: { WALL: 1 }, afterDeptMajors: { WALL: 1 },
    },
  );
  assert.equal(ready.accept, false);
  assert.match(ready.reason, /no shrink/);

  assert.equal(CLOSURE_GAIN_MARGIN, 0.1);
});

// CG-FC6: REGRESSION-TOLERANT KEEP. The form clause, like the department override, fires even when the
// picture score REGRESSED past the margin — the close is a real structural win the noisy critique
// under-rates. Closure 0.615→1.0, no new major, net flat, score 16→8 (delta -8, past margin) → KEEP.
test("CG-FC6 form-credit keeps a real close even on a past-margin score regression", () => {
  const r = acceptsRound(
    { score: 16, nMajor: 3 }, { score: 8, nMajor: 3 },
    {
      margin: 4, targetDepartments: ["WALL"],
      closureBefore: 0.615, closureAfter: 1.0,
      beforeDeptMajors: { ROOF: 1, WALL: 1, OPENING: 1 },
      afterDeptMajors: { ROOF: 1, WALL: 1, OPENING: 1 },
      beforeDeptItems: { WALL: { major: 1, minor: 0 } },
      afterDeptItems: { WALL: { major: 1, minor: 0 } },
    },
  );
  assert.equal(r.accept, true);
  assert.equal(r.delta, -8);
  assert.match(r.reason, /form-credit/);
});

// ============================ T-200-01 (S-200, E-49): de-noise the form decision ============================
// A wall-shell FORM move is judged on closureOf (deterministic), never the noisy picture vote (a documented
// 0–76 same-seed swing). CG-FS1/2 are the abstracted re-run-stability fixtures: the SAME form move → the SAME
// decision across every simulated vote draw. The flat dept maps below keep formCredit's guards satisfied.
const FLAT_MAJORS = { ROOF: 1, WALL: 1, OPENING: 1 };
const FLAT_ITEMS = { ROOF: { major: 1, minor: 0 }, WALL: { major: 1, minor: 0 }, OPENING: { major: 1, minor: 0 } };
const VOTE_DRAWS = [[16, 16], [0, 76], [76, 0], [0, 0], [76, 76]]; // the documented picture-scalar swing
const formOpts = (closureAfter) => ({
  isFormMove: true, closureBefore: 0.6153846153846154, closureAfter,
  beforeDeptMajors: FLAT_MAJORS, afterDeptMajors: FLAT_MAJORS,
  beforeDeptItems: FLAT_ITEMS, afterDeptItems: FLAT_ITEMS, targetDepartments: ["WALL"],
});

// CG-FS1: a real closure win (0.615→1.0) is KEPT for EVERY picture draw — the keep does not flip with noise.
test("CG-FS1 form KEEP is invariant to the picture vote draw", () => {
  for (const [before, after] of VOTE_DRAWS) {
    const r = acceptsRound({ score: before }, { score: after }, formOpts(1.0));
    assert.equal(r.accept, true, `draw ${before}→${after} should KEEP`);
    assert.match(r.reason, /form-credit/);
  }
});

// CG-FS2: no closure gain (0.615→0.615) is ROLLED BACK for EVERY draw — a noisy spike cannot accept it.
test("CG-FS2 form ROLLBACK is invariant to the picture vote draw", () => {
  for (const [before, after] of VOTE_DRAWS) {
    const r = acceptsRound({ score: before }, { score: after }, formOpts(0.6153846153846154));
    assert.equal(r.accept, false, `draw ${before}→${after} should ROLL BACK`);
    assert.match(r.reason, /no closure gain/);
  }
});

// CG-FS3: only the wall-shell form moves are closure-decided; roof-form / detail / unknown are not.
test("CG-FS3 closureDecidedMove selects only wall-shell form moves", () => {
  for (const t of ["close_shell", "construct_walls"]) assert.equal(closureDecidedMove(t), true, t);
  for (const t of ["apply_gable_roof", "recolor_roof", "relief_walls", "carve_arch", "done", undefined]) {
    assert.equal(closureDecidedMove(t), false, String(t));
  }
});

// CG-FS4: a roof-form move (isFormMove false) keeps the picture gradient — closureOf is blind to the roof.
test("CG-FS4 roof-form move is decided on the picture gradient", () => {
  const up = acceptsRound({ score: 20 }, { score: 30 }, { isFormMove: false, closureBefore: 0.6, closureAfter: 0.6 });
  assert.equal(up.accept, true);
  assert.match(up.reason, /improved/);
  const down = acceptsRound({ score: 30 }, { score: 20 }, { isFormMove: false, closureBefore: 0.6, closureAfter: 0.6 });
  assert.equal(down.accept, false);
  assert.match(down.reason, /regressed/);
});

// CG-FS5: a wall-form move on an ALREADY form-ready shell falls through to the picture path — it is not
// rejected for "no closure gain" when the form job is already done.
test("CG-FS5 form-ready wall move falls through to the picture gradient", () => {
  const r = acceptsRound({ score: 20 }, { score: 30 }, {
    isFormMove: true, closureBefore: 0.95, closureAfter: 0.95, margin: 4,
    beforeDeptMajors: FLAT_MAJORS, afterDeptMajors: FLAT_MAJORS,
  });
  assert.equal(r.accept, true);
  assert.match(r.reason, /improved/);
});

// CG-FS6: the detail gradient is byte-stable — passing isFormMove:false is identical to omitting it.
test("CG-FS6 detail decision is byte-stable with vs without the flag", () => {
  const before = { score: 20, nMajor: 3, wrongStyleBreadth: 2 };
  const after = { score: 20, nMajor: 3, wrongStyleBreadth: 2 }; // CG3-shape tie, no shrink
  const withFlag = acceptsRound(before, after, { margin: 4, isFormMove: false });
  const without = acceptsRound(before, after, { margin: 4 });
  assert.deepEqual(withFlag, without);
  assert.equal(without.accept, false);
  assert.match(without.reason, /no shrink/);
});

// ============================ CG-B: the cold-start batch escape (T-208-01, S-208, E-53) ============================
// acceptsBatch keeps a COMPOUND of N provisionally-stacked detail moves vs the pre-batch build, judged by the
// picture score over the compound — the escape from the score-0 floor where every per-move detail gate ties at 0
// (T-207 live: a clean wide arch scored 0→0 and rolled back). The deliberately-bad-compound reject (CG-B2/B3) is
// the AC falsification: the escape must reject a worse batch, never rubber-stamp.

// CG-B1: a good compound that LEFT the floor is kept (the whole point — several reads moved the judge off 0).
test("CG-B1 acceptsBatch keeps a compound that escapes the score-0 floor", () => {
  const r = acceptsBatch({ score: 0, nMajor: 3 }, { score: 14, nMajor: 3 }, { batchMargin: 1 });
  assert.equal(r.accept, true);
  assert.equal(r.delta, 14);
  assert.match(r.reason, /compound \+14 \(off the floor\)/);
});

// CG-B2: THE FALSIFICATION — a deliberately-bad compound that ADDS a whole-build major is rejected (a bad batch
// that paints wrong / floods openings raises a major). The escape must reject a worse batch.
test("CG-B2 acceptsBatch REJECTS a deliberately-bad compound that adds a major", () => {
  const r = acceptsBatch({ score: 0, nMajor: 3 }, { score: 0, nMajor: 5 }, { batchMargin: 1 });
  assert.equal(r.accept, false);
  assert.match(r.reason, /added a major \(3→5\)/);
});

// CG-B3: a compound that REGRESSED the scalar (a scoreFloor>0 caller) is rejected — the regression guard.
test("CG-B3 acceptsBatch REJECTS a compound that regressed the scalar", () => {
  const r = acceptsBatch({ score: 8, nMajor: 2 }, { score: 3, nMajor: 2 }, { batchMargin: 1 });
  assert.equal(r.accept, false);
  assert.match(r.reason, /regressed -5/);
});

// CG-B4: a USELESS compound (tie at the floor, no major change) is rejected — NO rubber-stamp. The honest
// residual: even the compound can't move the judge off 0 → the ticket's failure-mode-3 (de-noise the judge).
test("CG-B4 acceptsBatch REJECTS a tie at the floor — no rubber-stamp", () => {
  const r = acceptsBatch({ score: 0, nMajor: 3 }, { score: 0, nMajor: 3 }, { batchMargin: 1 });
  assert.equal(r.accept, false);
  assert.match(r.reason, /compound tie at floor — no read/);
});

// CG-B5: a compound that CLEARED a targeted major (WALL) with the whole-build scalar still saturated at 0 is
// kept via the department-dominant override (reused over the batch's targeted depts), net-guarded.
test("CG-B5 acceptsBatch keeps a batch that cleared a targeted major at a flat scalar", () => {
  const r = acceptsBatch(
    { score: 0, nMajor: 1 }, { score: 0, nMajor: 1 }, // whole-build nMajor flat (attention shifted)
    {
      batchMargin: 1, targetDepartments: ["WALL"],
      beforeDeptMajors: { WALL: 1 }, afterDeptMajors: { WALL: 0, ROOF: 1 },
      beforeDeptItems: { WALL: { major: 1, minor: 0 } },
      afterDeptItems: { WALL: { major: 0, minor: 0 }, ROOF: { major: 1, minor: 0 } },
    },
  );
  assert.equal(r.accept, true);
  assert.match(r.reason, /WALL cleared a major \(department-dominant, batch\)/);
});

// CG-B6: the net guard still bites in a batch — cleared the WALL major but grew WALL's total burden (added
// minors in its own target) → rejected (the departmentDominant net guard (c), as in CG15).
test("CG-B6 acceptsBatch net guard rejects 'cleared a major but added minors in its own target'", () => {
  const r = acceptsBatch(
    { score: 0, nMajor: 1 }, { score: 0, nMajor: 1 },
    {
      batchMargin: 1, targetDepartments: ["WALL"],
      beforeDeptMajors: { WALL: 1 }, afterDeptMajors: { WALL: 0 },
      beforeDeptItems: { WALL: { major: 1, minor: 0 } },
      afterDeptItems: { WALL: { major: 0, minor: 3 } }, // total 1 → 3: net degradation in its own target
    },
  );
  assert.equal(r.accept, false);
  assert.match(r.reason, /compound tie at floor — no read/);
});

// CG-B7: acceptsBatch requires both evidence bundles (same contract as acceptsRound).
test("CG-B7 acceptsBatch throws without before/after evidence", () => {
  assert.throws(() => acceptsBatch(null, { score: 1 }), /before and after evidence are required/);
});

// CG-B8: FORM-INTEGRITY — a batch that REOPENED a closed shell is rejected even on a picture-score gain (the
// re-climb-1 failure: construct_walls dropped closure 1.000→0.068 yet scored +12; dressing over a broken form).
test("CG-B8 acceptsBatch REJECTS a batch that reopened a closed shell despite a score gain", () => {
  const r = acceptsBatch(
    { score: 0, nMajor: 3 }, { score: 12, nMajor: 3 },
    { batchMargin: 1, closureBefore: 1.0, closureAfter: 0.068 },
  );
  assert.equal(r.accept, false);
  assert.match(r.reason, /batch reopened the form \(closure 1\.000→0\.068\)/);
  // The guard is inert when the form STAYED closed → the +12 gain is kept.
  const kept = acceptsBatch(
    { score: 0, nMajor: 3 }, { score: 12, nMajor: 3 },
    { batchMargin: 1, closureBefore: 1.0, closureAfter: 1.0 },
  );
  assert.equal(kept.accept, true);
  assert.match(kept.reason, /compound \+12/);
  // Inert without closure evidence (backward-compatible): the +12 gain is kept.
  const nocl = acceptsBatch({ score: 0, nMajor: 3 }, { score: 12, nMajor: 3 }, { batchMargin: 1 });
  assert.equal(nocl.accept, true);
});

// CG-coldStart1: the entry predicate is TRUE only on a closed form stuck at the floor.
test("CG-coldStart1 coldStartFloor true on a closed form at the score floor", () => {
  assert.equal(coldStartFloor({ score: 0, closure: 1.0 }), true);
  assert.equal(coldStartFloor({ score: 0, closure: FORM_READY_CLOSURE }), true); // boundary: ≥ threshold
});

// CG-coldStart2: FALSE off the floor or on an open form, and fail-safe on NaN closure (never batch unknown).
test("CG-coldStart2 coldStartFloor false off the floor, on an open form, and on NaN closure", () => {
  assert.equal(coldStartFloor({ score: 12, closure: 1.0 }), false);   // already off the floor
  assert.equal(coldStartFloor({ score: 0, closure: 0.6 }), false);    // form still open (T-206 seed)
  assert.equal(coldStartFloor({ score: 0, closure: NaN }), false);    // fail-safe: unknown form
  assert.equal(coldStartFloor({ score: 5, closure: 1.0, scoreFloor: 5 }), true); // configurable floor
});

// CG-coldStart3: BATCH_DEFAULTS are frozen and shaped as the runner expects.
test("CG-coldStart3 BATCH_DEFAULTS are frozen with the documented knobs", () => {
  assert.deepEqual(BATCH_DEFAULTS, { batchSize: 4, scoreFloor: 0, batchMargin: 1 });
  assert.equal(Object.isFrozen(BATCH_DEFAULTS), true);
});
