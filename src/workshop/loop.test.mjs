// workshop loop unit tests (T-126-01) — synthetic exchange seams over the REAL pure conformance
// gate (no GL, no model). Groups:
//   SC — conformanceScore / isRegression (incl. the findings-cap recovery)
//   L  — the loop: accept, rollback, done, budget, unavailable, refused, apply-failed
//   LG — ledger invariants
//   LE — import boundary: no top-level model/GL/judge imports (the E-15 LE pattern)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  WORKSHOP_LEDGER_SCHEMA, LOOP_DEFAULTS, conformanceScore, isRegression, proportionRegression,
  runWorkshopLoop,
} from "./loop.mjs";
import { assertWorkshopProgram, WORKSHOP_PROGRAM_SCHEMA } from "./program.mjs";

void LOOP_DEFAULTS;

/** Test pack: two pure checks; pink_wool is OUT of vocabulary. */
const PACK = {
  palette: [{ role: "wall.field", block: "oak_planks" }, { role: "wall.trim", block: "cobblestone" }],
  decoration: [],
  conformance: { checks: ["courses-even", "palette-in-pack"] },
};

/** Seed: a hollow shell whose y=1 course is pink_wool — 14 foreign-in-band cells (the seeded
 *  defect; > the 12-finding cap, so the cap-recovery path is exercised). */
const seedProgram = (rounds = 2) => assertWorkshopProgram({
  schema: WORKSHOP_PROGRAM_SCHEMA,
  subject: "synthetic",
  pack: "test-pack",
  budget: { rounds },
  declarations: { bands: [{ name: "walls", yRange: [0, 2], blocks: ["oak_planks"] }] },
  elements: [{
    id: "shell", kind: "shell",
    spec: {
      footprint: { x0: 0, x1: 4, z0: 0, z1: 3 }, y0: 0, height: 3, wallBlock: "oak_planks",
      courses: [{ yRange: [1, 1], block: "pink_wool" }],
    },
  }],
});

const PAINT_PINK_OAK = { action: "spray-paint", dir: "+z", toBlock: "oak_planks", fromBlock: "pink_wool" };
const PAINT_OAK_COBBLE = { action: "spray-paint", dir: "+z", toBlock: "cobblestone" };

const verdictRevise = (action, issue = "pink band off the palette") => ({
  critique: { issues: [{ region: "south wall", issue, severity: "major" }] },
  decision: "revise", action, rationale: "fix the foreign band",
});
const verdictDone = () => ({ critique: { issues: [] }, decision: "done", rationale: "matches well enough" });

/** A scripted exchange seam: pops verdicts in order; records the round CONTEXTS it saw
 *  (T-129-01: the loop hands over round context; prompt rendering is the runner's). */
const scripted = (verdicts) => {
  const ctxs = [];
  const seam = async (ctx) => {
    ctxs.push(ctx);
    const v = verdicts.shift();
    return { verdict: v, replies: [{ attempt: 1, parsed: v !== null, rawReply: "synthetic", source: "live" }], askCount: 1 };
  };
  return { seam, ctxs };
};

// --- SC: the score ----------------------------------------------------------------------------

test("SC1 findings-cap recovery: 14 capped findings count as 14, not 13", () => {
  const report = { checks: [{ name: "x", passed: false, findings: [...Array(12).fill("f"), "… 2 more"] }] };
  assert.deepEqual(conformanceScore(report), { passed: 0, findings: 14 });
});

test("SC2 isRegression is lexicographic and strict (lateral moves are not regressions)", () => {
  const rep = (passed, findings) => ({
    checks: [
      ...Array.from({ length: passed }, (_, i) => ({ name: `p${i}`, passed: true, findings: [] })),
      ...(findings > 0 ? [{ name: "f", passed: false, findings: Array(findings).fill("x") }] : []),
    ],
  });
  assert.equal(isRegression(rep(2, 3), rep(1, 0)), true, "fewer checks passed = regression even with fewer findings");
  assert.equal(isRegression(rep(1, 3), rep(1, 5)), true, "same passed, more findings = regression");
  assert.equal(isRegression(rep(1, 3), rep(1, 3)), false, "equal score is lateral, accepted");
  assert.equal(isRegression(rep(1, 3), rep(2, 9)), false, "more checks passed wins outright");
});

// --- SC: the proportion no-regress arm (T-135-01) ----------------------------------------------

const propRow = (ratio, excess, withinTolerance, extra = {}) =>
  ({ ratio, excess, withinTolerance, basis: "relative", ...extra });
const propReport = (rows, others = 1) => ({
  checks: [
    ...Array.from({ length: others }, (_, i) => ({ name: `p${i}`, passed: true, findings: [] })),
    {
      name: "proportion-vs-concept",
      passed: rows.every((r) => r.withinTolerance !== false),
      findings: rows.filter((r) => r.withinTolerance === false).map((r) => r.ratio),
      ratios: { tolerance: 0.1, rows },
    },
  ],
});

test("SC3 proportionRegression: an already-bad ratio drifting worse rolls back despite a findings tie", () => {
  const before = propReport([propRow("aspect", 0.25, false)]);
  const worse = propReport([propRow("aspect", 1.5, false)]);
  const betterButBad = propReport([propRow("aspect", 0.12, false)]);
  const within = propReport([propRow("aspect", 0.05, true)]);

  assert.match(proportionRegression(before, worse), /aspect Δ 0\.25→1\.5 beyond tolerance/);
  assert.equal(isRegression(before, worse), true, "the lexicographic tie alone would have accepted it");
  assert.equal(proportionRegression(before, betterButBad), null, "hill-climbing toward the target is accepted");
  assert.equal(proportionRegression(before, within), null);
  assert.match(proportionRegression(within, before), /aspect/, "within→beyond is caught by both arms");
  assert.equal(isRegression(within, before), true);
});

test("SC4 proportionRegression: inert without the check (old ledgers), per-mass matched, unmeasurable named", () => {
  const plain = { checks: [{ name: "p0", passed: true, findings: [] }] };
  const withProp = propReport([propRow("aspect", 0.25, false)]);
  assert.equal(proportionRegression(plain, plain), null);
  assert.equal(proportionRegression(plain, withProp), null);
  assert.equal(proportionRegression(withProp, plain), null);

  const bMass = propReport([propRow("roofShare", 0.2, false, { mass: "wing" }), propRow("roofShare", 0.5, false)]);
  const aMass = propReport([propRow("roofShare", 0.3, false, { mass: "wing" }), propRow("roofShare", 0.4, false)]);
  assert.match(proportionRegression(bMass, aMass), /mass "wing" roofShare Δ 0\.2→0\.3/);

  const gone = propReport([propRow("roofShare", null, false, { basis: "unmeasurable" })]);
  const was = propReport([propRow("roofShare", 0.2, false)]);
  assert.match(proportionRegression(was, gone), /became unmeasurable/);
  assert.equal(proportionRegression(gone, was), null, "unmeasurable-before rows don't compare");
});

// --- L: the loop --------------------------------------------------------------------------------

test("L1 accept path: paint shrinks the foreign band; round accepted; final artifact carries the paint", async () => {
  const { seam, ctxs } = scripted([verdictRevise(PAINT_PINK_OAK), verdictDone()]);
  const { ledger, artifact } = await runWorkshopLoop({ program: seedProgram(3), pack: PACK, seams: { exchange: seam } });

  const r1 = ledger.rounds[0];
  assert.equal(r1.conformance.accepted, true);
  assert.equal(r1.conformance.reason, "accepted");
  assert.equal(r1.applied.kind, "paint");
  assert.equal(r1.applied.painted, 5); // the +z wall's five y=1 cells
  const b = conformanceScore(r1.conformance.before);
  const a = conformanceScore(r1.conformance.after);
  assert.ok(a.findings < b.findings, `findings must drop (${b.findings}→${a.findings})`);

  assert.equal(ledger.final.outcome, "done");
  assert.equal(ledger.rounds.length, 2);
  // the paint survives into the final artifact (applied after realization)
  const painted = artifact.placements.filter((p) => p.block === "minecraft:oak_planks" && p.pos[1] === 1 && p.pos[2] === 3);
  assert.equal(painted.length, 5);
  // round 2's context tells the runner (and so the model) about round 1's acceptance, and
  // carries everything the critique prompt needs
  assert.equal(ctxs[1].lastRound.accepted, true);
  assert.equal(ctxs[1].round, 2);
  assert.equal(ctxs[1].budget, 3);
  assert.ok(Array.isArray(ctxs[1].liveActions) && ctxs[1].liveActions.includes("spray-paint"));
  assert.ok(ctxs[1].conformance.checks, "the round's BEFORE conformance rides the seam");
});

test("L2 rollback path: a regressing paint is rolled back — program and paint unchanged, recorded", async () => {
  const { seam, ctxs } = scripted([verdictRevise(PAINT_OAK_COBBLE, "wrong trim")]);
  const { ledger, artifact } = await runWorkshopLoop({ program: seedProgram(1), pack: PACK, seams: { exchange: seam } });

  const r1 = ledger.rounds[0];
  assert.equal(r1.conformance.accepted, false);
  assert.match(r1.conformance.reason, /^regressed: /);
  assert.ok(!artifact.placements.some((p) => p.block === "minecraft:cobblestone"), "rolled-back paint never lands");
  assert.equal(ledger.final.outcome, "budget-exhausted");
  void ctxs;
});

test("L3 a rolled-back round is reported to the next round's context", async () => {
  const { seam, ctxs } = scripted([verdictRevise(PAINT_OAK_COBBLE), verdictDone()]);
  await runWorkshopLoop({ program: seedProgram(2), pack: PACK, seams: { exchange: seam } });
  assert.equal(ctxs[1].lastRound.accepted, false);
  assert.match(ctxs[1].lastRound.reason, /^regressed: /);
});

test("L4 done stops immediately; budget exhaustion records honestly", async () => {
  const done = scripted([verdictDone()]);
  const { ledger: l1 } = await runWorkshopLoop({ program: seedProgram(3), pack: PACK, seams: { exchange: done.seam } });
  assert.equal(l1.final.outcome, "done");
  assert.equal(l1.rounds.length, 1);

  const lateral = { action: "spray-paint", dir: "+z", toBlock: "oak_planks", fromBlock: "oak_planks" }; // no-op
  const churn = scripted([verdictRevise(lateral), verdictRevise(lateral)]);
  const { ledger: l2 } = await runWorkshopLoop({ program: seedProgram(2), pack: PACK, seams: { exchange: churn.seam } });
  assert.equal(l2.final.outcome, "budget-exhausted");
  assert.equal(l2.rounds.length, 2);
});

test("L5 unavailable action (re-recognize, uninjected) consumes the round, never crashes", async () => {
  const { seam } = scripted([verdictRevise({ action: "re-recognize", elementId: "shell" })]);
  const { ledger } = await runWorkshopLoop({ program: seedProgram(1), pack: PACK, seams: { exchange: seam } });
  const r1 = ledger.rounds[0];
  assert.equal(r1.applied.kind, "unavailable");
  assert.equal(r1.conformance.accepted, false);
  assert.match(r1.conformance.reason, /runner injects/);
});

test("L6 exchange refusal (reply policy exhausted) stops the loop, recorded", async () => {
  const { seam } = scripted([null]);
  const { ledger } = await runWorkshopLoop({ program: seedProgram(3), pack: PACK, seams: { exchange: seam } });
  assert.equal(ledger.final.outcome, "exchange-refused");
  assert.equal(ledger.rounds[0].conformance.reason, "exchange-refused");
  assert.equal(ledger.rounds.length, 1);
});

test("L7 an action that breaks the element contract is a rolled-back round, not a crash", async () => {
  const bad = { action: "adjust-params", elementId: "shell", params: { height: 0 } }; // boxShell throws
  const { seam } = scripted([verdictRevise(bad), verdictDone()]);
  const { ledger } = await runWorkshopLoop({ program: seedProgram(2), pack: PACK, seams: { exchange: seam } });
  const r1 = ledger.rounds[0];
  assert.equal(r1.conformance.accepted, false);
  assert.match(r1.conformance.reason, /^apply-failed: .*height/);
  assert.equal(ledger.final.outcome, "done"); // the loop carried on
});

// --- LG: ledger invariants ------------------------------------------------------------------------

test("L8 declared proportions gate the round: worsening a bad ratio rolls back, improving is accepted, ratios ride the ledger", async () => {
  // clean shell (no foreign band) so regularity stays at 0 findings throughout; footprint 5×4 →
  // aspect 1.25 vs target 1 (tolerance 0.1) — beyond tolerance from the seed
  const program = assertWorkshopProgram({
    schema: WORKSHOP_PROGRAM_SCHEMA, subject: "synthetic", pack: "test-pack",
    budget: { rounds: 3 },
    declarations: {
      bands: [{ name: "walls", yRange: [0, 2], blocks: ["oak_planks"] }],
      proportions: { targets: { aspect: 1 }, sources: { aspect: "sketch" }, tolerance: 0.1 },
    },
    elements: [{
      id: "shell", kind: "shell",
      spec: { footprint: { x0: 0, x1: 4, z0: 0, z1: 3 }, y0: 0, height: 3, wallBlock: "oak_planks" },
    }],
  });
  const stretch = { action: "adjust-params", elementId: "shell", params: { footprint: { x0: 0, x1: 9, z0: 0, z1: 3 } } }; // aspect 2.5
  const square = { action: "adjust-params", elementId: "shell", params: { footprint: { x0: 0, x1: 3, z0: 0, z1: 3 } } }; // aspect 1.0
  const { seam } = scripted([
    verdictRevise(stretch, "build reads too long vs the concept"),
    verdictRevise(square, "square the footprint"),
    verdictDone(),
  ]);
  const { ledger } = await runWorkshopLoop({ program, pack: PACK, seams: { exchange: seam } });

  const r1 = ledger.rounds[0];
  assert.equal(r1.conformance.accepted, false, "a findings-count tie alone would have accepted the stretch");
  assert.match(r1.conformance.reason, /aspect Δ 0\.25→1\.5 beyond tolerance/);

  const r2 = ledger.rounds[1];
  assert.equal(r2.conformance.accepted, true, "the squared footprint reaches the target");

  // every round's ledger entry carries the ratio table — the number the critique can aim at
  for (const round of ledger.rounds.slice(0, 2)) {
    const check = round.conformance.before.checks.find((c) => c.name === "proportion-vs-concept");
    assert.ok(check, "the proportion check rides the round's before-report");
    const aspect = check.ratios.rows.find((r) => r.ratio === "aspect");
    assert.equal(aspect.measured, 1.25);
    assert.equal(aspect.target, 1);
  }
  const finalCheck = ledger.final.conformance.checks.find((c) => c.name === "proportion-vs-concept");
  assert.equal(finalCheck.passed, true);
  assert.equal(finalCheck.ratios.rows.find((r) => r.ratio === "aspect").measured, 1);
});

test("LG1 the ledger carries schema, seed program, budget, and per-round raw replies", async () => {
  const { seam } = scripted([verdictRevise(PAINT_PINK_OAK), verdictDone()]);
  const program = seedProgram(2);
  const { ledger } = await runWorkshopLoop({
    program, pack: PACK, seams: { exchange: seam },
    meta: { packRef: { path: "packs/test.json", sha256: "0".repeat(64) }, tier: "strong" },
  });
  assert.equal(ledger.schema, WORKSHOP_LEDGER_SCHEMA);
  assert.equal(ledger.program, program); // the SEED, not the revised program
  assert.equal(ledger.budget.rounds, 2);
  assert.equal(ledger.tier, "strong");
  assert.deepEqual(ledger.liveActions, ["adjust-params", "spray-paint"]);
  for (const r of ledger.rounds) {
    assert.ok(Array.isArray(r.replies) && r.replies.length >= 1, "raw replies are ledgered");
    assert.ok(r.conformance.before, "every round records the before-gate");
  }
  assert.ok(ledger.final.conformance.checks.length === 2);
});

// --- LE: import boundary ----------------------------------------------------------------------------

test("LE1 loop.mjs has no top-level model/GL/judge imports (seams arrive injected)", () => {
  const src = readFileSync(fileURLToPath(new URL("./loop.mjs", import.meta.url)), "utf8");
  const importLines = src.split("\n").filter((l) => /^\s*import\b|\bfrom\s+"/.test(l));
  for (const banned of ["sdk-binding", "model-tier", "/render", "prismarine", "multi-angle-gate", "judge-reply", "gate-instrument"]) {
    for (const line of importLines) {
      assert.ok(!line.includes(banned), `loop.mjs import line must not reference "${banned}": ${line.trim()}`);
    }
  }
});
