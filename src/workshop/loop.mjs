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
import { compileProgram } from "../recognition/compile.mjs";
import { realizeWithArticulation } from "./articulate.mjs";
import { applyAction, DEFAULT_APPLIERS } from "./actions.mjs";
import { prunePaint } from "./geometry.mjs";
import { liveActionNames } from "./critique.mjs";

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

/**
 * Ratio-level no-regress (T-135-01, the E-15 cage lesson): a revision whose proportion ratio
 * ENDS beyond tolerance strictly worse than before must roll back even when the findings COUNT
 * ties (an already-bad ratio drifting further is invisible to the lexicographic score). Compares
 * the proportion check's `excess` per row (matched by ratio + mass) between two reports; returns
 * the offending row's description, or null. Reports without the check — every pre-T-135 ledger —
 * are inert, so the offline re-assert of committed records is unchanged.
 */
export function proportionRegression(before, after) {
  const rowsOf = (rep) => rep?.checks?.find((c) => c.name === "proportion-vs-concept")?.ratios?.rows ?? null;
  const b = rowsOf(before);
  const a = rowsOf(after);
  if (!b || !a) return null;
  for (const row of a) {
    if (row.withinTolerance !== false) continue;
    const prev = b.find((x) => x.ratio === row.ratio && (x.mass ?? null) === (row.mass ?? null));
    if (!prev || !Number.isFinite(prev.excess)) continue; // new/unmeasured-before rows don't compare
    const where = `${row.mass ? `mass "${row.mass}" ` : ""}${row.ratio}`;
    if (row.basis === "unmeasurable") return `${where} became unmeasurable (was Δ ${prev.excess})`;
    if (Number.isFinite(row.excess) && row.excess > prev.excess) {
      return `${where} Δ ${prev.excess}→${row.excess} beyond tolerance`;
    }
  }
  return null;
}

/** Strictly-worse comparison — the rollback predicate: the lexicographic score (checks passed,
 *  then findings), OR a proportion ratio worsening beyond tolerance. Equal scores are NOT
 *  regressions (a lateral move is accepted; the budget bounds wandering). */
export function isRegression(before, after) {
  const b = conformanceScore(before);
  const a = conformanceScore(after);
  return a.passed < b.passed || (a.passed === b.passed && a.findings > b.findings)
    || proportionRegression(before, after) !== null;
}

/**
 * RUN THE WORKSHOP LOOP.
 * @param {object} opts
 * @param {object} opts.program  a validated workshop program (the seed — committed for replay)
 * @param {object} opts.pack  a validated style pack
 * @param {object|null} [opts.source]  the recognized building-program/v1 behind the seed
 *   (T-136-01). When present, the geometry levers and mass-grounded re-recognize are reachable:
 *   the exchange context and the appliers receive it, accepted geometry-bearing rounds advance
 *   it alongside the compiled program, and the ledger records the SEED source for replay.
 * @param {object} opts.seams
 * @param {(args:{round:number, budget:number, renders:object[]|null, program:object, pack:object, conformance:object, lastRound:object|null, liveActions:string[], azimuths:string[]}) => Promise<{verdict:object|null, replies:object[], askCount:number}>} opts.seams.exchange
 *   the metered exchange (runner: BAML render → reply-policy over the tiered shim; tests:
 *   synthetic). The loop hands over the ROUND CONTEXT — everything the critique prompt needs
 *   (T-129-01: prompt rendering is the runner's, through the BAML bridge; the pure core never
 *   touches it). `program` is the CURRENT program so the runner's reply parser grounds actions
 *   against it. A null verdict means the bounded re-asks were exhausted — the loop records it
 *   and STOPS.
 * @param {(args:{artifact:object, round:number}) => Promise<object[]|null>} [opts.seams.render]
 *   evidence renders (runner: the 4 gate azimuths; tests/replay: absent → null)
 * @param {(args:{artifact:object, declarations:object}) => object} [opts.seams.conform]
 *   the round gate (default: pure occupancy + runConformance)
 * @param {object} [opts.appliers]  action applier table (default: DEFAULT_APPLIERS)
 * @param {object} [opts.meta]  runner-side header fields (packRef, tier, instrument…)
 * @returns {Promise<{ledger:object, program:object, artifact:object}>}
 */
export async function runWorkshopLoop({ program, pack, source = null, seams, appliers = DEFAULT_APPLIERS, meta = {} }) {
  const { exchange, render } = seams ?? {};
  if (typeof exchange !== "function") throw new Error("runWorkshopLoop: seams.exchange is required");
  const conform = seams.conform
    ?? (({ artifact, declarations }) => runConformance({ occ: artifactOccupancy(artifact), declarations }, pack));
  const budget = program.budget?.rounds ?? LOOP_DEFAULTS.rounds;
  const azimuths = meta.instrument?.azimuths ?? ["+x+z", "+x-z", "-x-z", "-x+z"];
  const liveActions = liveActionNames(appliers);

  let current = program;
  let currentSource = source;
  let paint = []; // accepted spray-paint placements, applied after realization in arrival order
  const realize = (prog, paintTrail) => {
    // T-149-01 (E-35): construct the recognized facade grammar's relief onto the skin each round, so
    // the build the loop renders + critiques carries it. The plan is recompiled from currentSource so
    // a re-recognition that changes a facade re-plans; the brushes resolve positions against the live
    // occupancy. Facade-less rounds (no source / no facade) compile to [] ⇒ a bare realize.
    const articulation = currentSource ? compileProgram(currentSource, pack).articulation : [];
    const { artifact } = realizeWithArticulation(prog, articulation);
    return paintTrail.length ? applyPaint(artifact, paintTrail) : artifact;
  };

  const rounds = [];
  let outcome = "budget-exhausted";
  let lastRound = null;

  for (let r = 1; r <= budget; r++) {
    const artifact = realize(current, paint);
    const before = conform({ artifact, declarations: current.declarations });
    const renders = render ? await render({ artifact, round: r }) : null;

    const ex = await exchange({
      round: r, budget, renders, program: current, pack, source: currentSource,
      conformance: before, lastRound, liveActions, azimuths,
    });
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
    let candidateSource = currentSource;
    let candidatePaint = paint;
    let after = null;
    let accepted = false;
    let reason;
    try {
      const result = await applyAction(
        { program: current, occ: artifactOccupancy(artifact), source: currentSource, pack, critique },
        action, { appliers },
      );
      if (result.kind === "unavailable") {
        applied = { kind: "unavailable" };
        reason = result.reason;
      } else {
        if (result.kind === "program") {
          candidateProgram = result.program;
          applied = { kind: "program" };
        } else if (result.kind === "geometry" || result.kind === "recognize") {
          // a geometry-bearing revision: the compiled program AND its source advance together;
          // the accepted paint trail is pruned to surfaces the new realization still has (an
          // orphaned recolor would be a floating voxel — watertight bait, an unfair veto)
          candidateProgram = result.program;
          candidateSource = result.source;
          const pruned = prunePaint(candidateProgram, paint);
          candidatePaint = pruned.paint;
          applied = result.kind === "geometry"
            ? { kind: "geometry", paintPruned: pruned.pruned }
            : { kind: "recognize", massId: action.massId, mass: result.mass,
                replies: result.replies, askCount: result.askCount, paintPruned: pruned.pruned };
        } else {
          candidatePaint = [...paint, ...result.placements];
          applied = { kind: "paint", painted: result.painted, skipped: result.skipped, placements: result.placements };
        }
        const candidateArtifact = realize(candidateProgram, candidatePaint);
        after = conform({ artifact: candidateArtifact, declarations: candidateProgram.declarations });
        if (isRegression(before, after)) {
          const b = conformanceScore(before);
          const a = conformanceScore(after);
          const prop = proportionRegression(before, after);
          reason = `regressed: passed ${b.passed}→${a.passed}, findings ${b.findings}→${a.findings}`
            + (prop ? `; ${prop}` : "");
        } else {
          accepted = true;
          current = candidateProgram;
          currentSource = candidateSource;
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
    ...(source !== null ? { source } : {}), // the SEED source (geometry/recognize replay tracks it)
    rounds,
    final,
  };
  return { ledger, program: current, artifact };
}
