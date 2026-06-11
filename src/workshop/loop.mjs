// THE WORKSHOP LOOP (T-126-01, story S-126, epic E-31) — look, adjust, look again, legally.
//
// E-31 Rule 1 split the modes: iteration is the workshop's nature; the frozen judge convenes
// once, later (S-127), and the workshop may never call it. This module is the loop the split
// makes legal: build → 4-azimuth renders (evidence) → the model critiques its own build → ONE
// sanctioned action → the pack's conformance checks gate the round (a revision that regresses
// regularity/integrity is ROLLED BACK, recorded) → repeat within the declared budget → the model
// declares done. Every round is LEDGERED — critique, action, conformance both sides, render
// references, raw replies — nothing the loop did is unreviewable (Rule 5's substrate).
//
// THE CAGE GATES ON DETERMINISTIC DATA ONLY. Renders are the model's eyes, never the gate's:
// GL bytes never decide (the E-24/E-28 principle). The round gate is the conformance score —
// lexicographic (checks passed, then −total findings); strictly worse rolls back. A model action
// that breaks an element's own contract (realize throws) is a rolled-back round, not a crash.
//
// TERMINATION IS STRUCTURAL (the E-15 lesson): at most `budget.rounds` exchanges, each consuming
// one round whatever its outcome (accepted, rolled back, unavailable). Convergence is a property
// of the cage, not a hope about the model.
//
// PURE CONTROL FLOW OVER INJECTED SEAMS. `exchange` (the metered model call) and `render` (GL)
// arrive injected — this module imports neither sdk-binding nor the render stack, and the
// isolation test pins the absence of every judge seam. The default `conform` is pure
// (artifactOccupancy + runConformance) so unit tests run the real gate with no GL and no model.

import { runConformance } from "../pack/conformance.mjs";
import { artifactOccupancy } from "../view/occupancy.mjs";
import { applyPaint } from "../view/face-paint.mjs";
import { realizeProgram } from "./program.mjs";
import { applyAction, DEFAULT_APPLIERS } from "./actions.mjs";
import { buildWorkshopPrompt, liveActionNames } from "./critique.mjs";

export const WORKSHOP_LEDGER_SCHEMA = "workshop-ledger/v1";

/** Loop defaults — the budget is DECLARED (program.budget.rounds wins; this is the backstop). */
export const LOOP_DEFAULTS = Object.freeze({ rounds: 4 });

/** Exact findings count for one check verdict, undoing the presentation cap ("… N more"). */
function findingsCount(check) {
  const f = check.findings;
  const m = f.length > 0 ? String(f[f.length - 1]).match(/^… (\d+) more$/) : null;
  return m ? f.length - 1 + Number(m[1]) : f.length;
}

/** The round score: checks passed, then total findings (fewer is better). */
export function conformanceScore(report) {
  return {
    passed: report.checks.filter((c) => c.passed).length,
    findings: report.checks.reduce((n, c) => n + findingsCount(c), 0),
  };
}

/** Strictly-worse comparison on the lexicographic score — the rollback predicate. Equal scores
 *  are NOT regressions (a lateral move is accepted; the budget bounds wandering). */
export function isRegression(before, after) {
  const b = conformanceScore(before);
  const a = conformanceScore(after);
  return a.passed < b.passed || (a.passed === b.passed && a.findings > b.findings);
}

/**
 * RUN THE WORKSHOP LOOP.
 * @param {object} opts
 * @param {object} opts.program  a validated workshop program (the seed — committed for replay)
 * @param {object} opts.pack  a validated style pack
 * @param {object} opts.seams
 * @param {(args:{prompt:string, round:number, renders:object[]|null}) => Promise<{verdict:object|null, replies:object[], askCount:number}>} opts.seams.exchange
 *   the metered exchange (runner: reply-policy over the tiered shim; tests: synthetic). A null
 *   verdict means the bounded re-asks were exhausted — the loop records it and STOPS.
 * @param {(args:{artifact:object, round:number}) => Promise<object[]|null>} [opts.seams.render]
 *   evidence renders (runner: the 4 gate azimuths; tests/replay: absent → null)
 * @param {(args:{artifact:object, declarations:object}) => object} [opts.seams.conform]
 *   the round gate (default: pure occupancy + runConformance)
 * @param {object} [opts.appliers]  action applier table (default: DEFAULT_APPLIERS)
 * @param {object} [opts.meta]  runner-side header fields (packRef, tier, instrument…)
 * @returns {Promise<{ledger:object, program:object, artifact:object}>}
 */
export async function runWorkshopLoop({ program, pack, seams, appliers = DEFAULT_APPLIERS, meta = {} }) {
  const { exchange, render } = seams ?? {};
  if (typeof exchange !== "function") throw new Error("runWorkshopLoop: seams.exchange is required");
  const conform = seams.conform
    ?? (({ artifact, declarations }) => runConformance({ occ: artifactOccupancy(artifact), declarations }, pack));
  const budget = program.budget?.rounds ?? LOOP_DEFAULTS.rounds;
  const azimuths = meta.instrument?.azimuths ?? ["+x+z", "+x-z", "-x-z", "-x+z"];
  const liveActions = liveActionNames(appliers);

  let current = program;
  let paint = []; // accepted spray-paint placements, applied after realization in arrival order
  const realize = (prog, paintTrail) => {
    const { artifact } = realizeProgram(prog);
    return paintTrail.length ? applyPaint(artifact, paintTrail) : artifact;
  };

  const rounds = [];
  let outcome = "budget-exhausted";
  let lastRound = null;

  for (let r = 1; r <= budget; r++) {
    const artifact = realize(current, paint);
    const before = conform({ artifact, declarations: current.declarations });
    const renders = render ? await render({ artifact, round: r }) : null;
    const prompt = buildWorkshopPrompt({
      program: current, pack, round: r, budget, liveActions, azimuths, conformance: before, lastRound,
    });

    const ex = await exchange({ prompt, round: r, renders });
    const base = { round: r, renders, replies: ex.replies, askCount: ex.askCount };

    if (ex.verdict === null || ex.verdict === undefined) {
      rounds.push({ ...base, decision: null, action: null, applied: null, conformance: { before, after: null, accepted: false, reason: "exchange-refused" } });
      outcome = "exchange-refused";
      break;
    }
    const { critique, decision, action = null, rationale } = ex.verdict;

    if (decision === "done") {
      rounds.push({ ...base, critique, decision, rationale, action: null, applied: null, conformance: { before, after: null, accepted: true, reason: "done-declared" } });
      outcome = "done";
      break;
    }

    // revise: apply the ONE sanctioned action, gate the round, roll back on regression
    let applied;
    let candidateProgram = current;
    let candidatePaint = paint;
    let after = null;
    let accepted = false;
    let reason;
    try {
      const result = applyAction({ program: current, occ: artifactOccupancy(artifact) }, action, { appliers });
      if (result.kind === "unavailable") {
        applied = { kind: "unavailable" };
        reason = result.reason;
      } else {
        if (result.kind === "program") {
          candidateProgram = result.program;
          applied = { kind: "program" };
        } else {
          candidatePaint = [...paint, ...result.placements];
          applied = { kind: "paint", painted: result.painted, skipped: result.skipped, placements: result.placements };
        }
        const candidateArtifact = realize(candidateProgram, candidatePaint);
        after = conform({ artifact: candidateArtifact, declarations: candidateProgram.declarations });
        if (isRegression(before, after)) {
          const b = conformanceScore(before);
          const a = conformanceScore(after);
          reason = `regressed: passed ${b.passed}→${a.passed}, findings ${b.findings}→${a.findings}`;
        } else {
          accepted = true;
          current = candidateProgram;
          paint = candidatePaint;
          reason = "accepted";
        }
      }
    } catch (e) {
      applied = applied ?? { kind: "failed" };
      reason = `apply-failed: ${e.message}`;
    }

    rounds.push({ ...base, critique, decision, rationale, action, applied, conformance: { before, after, accepted, reason } });
    lastRound = { action, accepted, reason };
  }

  const artifact = realize(current, paint);
  const final = {
    outcome,
    rounds: rounds.length,
    conformance: conform({ artifact, declarations: current.declarations }),
  };
  const ledger = {
    schema: WORKSHOP_LEDGER_SCHEMA,
    subject: program.subject,
    budget: { rounds: budget },
    liveActions,
    instrument: { azimuths },
    ...meta,
    program, // the SEED — replay starts here
    rounds,
    final,
  };
  return { ledger, program: current, artifact };
}
