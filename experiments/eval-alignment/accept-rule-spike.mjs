#!/usr/bin/env node
// ACCEPT-RULE SPIKE (T-213-01, story S-213, epic E-55) — the CONTEST. Judges the candidate accept-rules
// (a non-median aggregator family + batch-while-improving) against the S-212 bar AND a deliberately-worse
// build battery, and names the winner. PURE: no GL, no LLM, no network, no metered spend — it reuses the
// committed corpus (docs/active/work/T-212-01/corpus.json) and the REAL gate (src/workshop/climb-gate.mjs),
// never a copy of either. The frozen DiagnoseBuild scorer is UNTOUCHED — this contests how the climb
// AGGREGATES votes and WHEN it batches, never how a build is scored.
//
// THE TRAP (research §1): the corpus is MONOTONIC (S0<…<S5, every applied move but M5 is glance-KEEP), so an
// all-KEEP rule scores 5/5 by rubber-stamping. Corpus-agreement ALONE cannot distinguish a good rule from
// "keep everything." The NO-RUBBER-STAMP reject battery is therefore load-bearing: a candidate must keep the
// arch AND reject builds that are genuinely worse. `max` exposes this — it ties the winner on the corpus but
// rubber-stamps the lone-spike worse build, so it is disqualified.
//
// Reuses the S-212 bar (loadCorpus/replayMove/agreement) — the fair-contest requirement.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { loadCorpus, replayMove, agreement } from "./accept-rule-replay.mjs";
import {
  aggregateVotes, acceptsRound, acceptsBatch, closureDecidedMove,
  CLIMB_DEFAULTS, BATCH_DEFAULTS, TOOL_DEPARTMENTS, deptItemCounts,
} from "../../src/workshop/climb-gate.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../..");
const DEFAULT_CORPUS = join(REPO, "docs/active/work/T-212-01/corpus.json");
const OUT_DIR = join(REPO, "docs/active/work/T-213-01");

const MARGIN = CLIMB_DEFAULTS.margin;                 // 4
const AGGREGATORS = ["median", "max", "mean", "trimmedMean"];

const ev = (s) => ({ score: 0, nMajor: s?.evidence?.nMajor, wrongStyleBreadth: s?.evidence?.wrongStyleBreadth });
const glanceKeepOf = (move, corpus) =>
  move.glanceVerdict === "keep" ? true
  : move.glanceVerdict === "ambiguous-excluded" ? null
  : (corpus.states[move.to]?.rank ?? null) > (corpus.states[move.from]?.rank ?? null);

// One candidate's keep/roll for one move, via the REAL gate. Form moves (close_shell/construct_walls) are
// closure-decided → aggregator-invariant → delegate to the current-rule replay. Detail per-move moves run
// acceptsRound; batch moves run acceptsBatch — both with before/after.score = aggregateVotes(state.scores).
function candidateDecision(move, corpus, aggregator) {
  const from = corpus.states[move.from], to = corpus.states[move.to];
  const glanceKeep = glanceKeepOf(move, corpus);
  const base = { id: move.id, tool: move.tool, from: move.from, to: move.to, kind: move.kind, glanceKeep };

  // Form moves + any move whose to-state is not a corpus state (M5's S3+frame) → current-rule replay (the
  // closure path is aggregator-invariant; M5 is glance-excluded so its decision never enters the fraction).
  if (closureDecidedMove(move.tool) || !to) {
    const r = replayMove(move, corpus, move.to === "S5" ? { closureOverride: to?.closureAfterCorrected } : {});
    return { ...base, scores: r.scores, ruleDecision: r.ruleDecision, ruleReason: r.ruleReason,
      agree: glanceKeep == null ? null : glanceKeep === r.ruleDecision };
  }

  const beforeScore = aggregateVotes(from.scores, aggregator);
  const afterScore = aggregateVotes(to.scores, aggregator);
  const targetDepartments = TOOL_DEPARTMENTS[move.tool] ?? null;
  const deptOpts = {
    targetDepartments,
    beforeDeptMajors: from.deptMajors ?? null, afterDeptMajors: to.deptMajors ?? null,
    beforeDeptItems: null, afterDeptItems: null, // corpus carries majors only → net guard degrades (research §5)
  };

  let gate;
  if (move.kind === "batch") {
    const atFloor = !!move.atFloor;
    const closureAfter = to.closureAfterCorrected ?? to.closure; // post-T-209 true behavior (not the stale reopen)
    gate = acceptsBatch({ ...ev(from), score: beforeScore }, { ...ev(to), score: afterScore }, {
      ...deptOpts, batchMargin: atFloor ? BATCH_DEFAULTS.batchMargin : MARGIN,
      closureBefore: from.closure, closureAfter,
    });
  } else {
    gate = acceptsRound({ ...ev(from), score: beforeScore }, { ...ev(to), score: afterScore }, {
      ...deptOpts, margin: MARGIN, isFormMove: false,
    });
  }
  return { ...base, scores: to.scores, aggBefore: beforeScore, aggAfter: afterScore,
    ruleDecision: gate.accept, ruleReason: gate.reason, agree: glanceKeep == null ? null : glanceKeep === gate.accept };
}

// The NO-RUBBER-STAMP battery (the AC falsification, CG-B2/B8 style). Three builds that are genuinely worse;
// a sound aggregator must ROLL all three. Synthetic (not corpus moves) so the reject set lives OUTSIDE the
// monotonic corpus — exactly where "keep everything" is exposed.
const REJECT_FIXTURES = [
  { id: "spike", note: "good build, two judges crater + one euphoric vote", before: [40, 40, 40], after: [0, 0, 48] },
  { id: "regression", note: "every vote drops", before: [8, 8, 8], after: [2, 2, 2] },
  { id: "sideways", note: "M5-style: one vote holds, two drop (a recess-only frame)", before: [8, 8, 8], after: [8, 0, 0] },
];
function rejectBattery(aggregator) {
  const results = REJECT_FIXTURES.map((f) => {
    const before = { score: aggregateVotes(f.before, aggregator), nMajor: 3, wrongStyleBreadth: 2 };
    const after = { score: aggregateVotes(f.after, aggregator), nMajor: 3, wrongStyleBreadth: 2 };
    const g = acceptsRound(before, after, { margin: MARGIN });
    return { id: f.id, note: f.note, before: f.before, after: f.after, rejected: !g.accept, reason: g.reason };
  });
  return { passed: results.every((r) => r.rejected), results };
}

// Robustness tiebreak: among reject-passing candidates with equal agreement, prefer the one whose corpus
// KEEP decisions clear the margin by the largest minimum slack (least knife-edge). mean keeps M2 at exactly
// +4.0 (slack 0); trimmedMean at +6 (slack 2) — so trimmedMean is the more robust winner.
function minKeepSlack(decisions) {
  const slacks = decisions
    .filter((d) => d.ruleDecision && d.aggAfter != null && d.aggBefore != null && d.kind !== "batch")
    .map((d) => (d.aggAfter - d.aggBefore) - MARGIN);
  return slacks.length ? Math.min(...slacks) : Infinity;
}

function contest(corpus) {
  const candidates = AGGREGATORS.map((agg) => {
    const decisions = corpus.moves.map((m) => candidateDecision(m, corpus, agg));
    const agr = agreement(decisions);
    const reject = rejectBattery(agg);
    return { aggregator: agg, agreement: agr, reject, minKeepSlack: minKeepSlack(decisions), decisions };
  });

  // current-rule baseline BOTH ways (S-212 led with the recorded STALE closure = 40%; the true post-T-209
  // behavior uses the corrected closure where M6-at-floor keeps = 60%). median candidate above already uses
  // corrected, so it IS the corrected baseline.
  const median = candidates.find((c) => c.aggregator === "median");

  const eligible = candidates.filter((c) => c.reject.passed);
  const best = Math.max(...eligible.map((c) => c.agreement.fraction));
  const topTier = eligible.filter((c) => c.agreement.fraction === best);
  topTier.sort((a, b) => b.minKeepSlack - a.minKeepSlack);          // robustness tiebreak
  const winner = topTier[0] ?? null;

  return { candidates, baselineMedianCorrected: median, winner };
}

function main() {
  const args = process.argv.slice(2);
  const corpusPath = args.includes("--corpus") ? args[args.indexOf("--corpus") + 1] : DEFAULT_CORPUS;
  const corpus = loadCorpus(corpusPath);
  const { candidates, baselineMedianCorrected, winner } = contest(corpus);

  const report = {
    schema: "accept-rule-contest/v1",
    ticket: "T-213-01", story: "S-213", epic: "E-55", subject: corpus.subject, corpus: corpusPath,
    note: "Candidate accept-rules judged on the S-212 bar (agreement with the glance) AND a no-rubber-stamp " +
      "reject battery. The monotonic corpus rewards keeping everything, so the reject battery is the " +
      "discriminator. Frozen DiagnoseBuild scorer untouched; this contests aggregation/acceptance only.",
    margin: MARGIN,
    glanceRank: corpus.glanceRank,
    candidates: candidates.map((c) => ({
      aggregator: c.aggregator,
      agreement: c.agreement,
      rejectBattery: c.reject,
      minKeepSlack: c.minKeepSlack,
      moves: c.decisions.map((d) => ({ id: d.id, tool: d.tool, transition: `${d.from}->${d.to}`,
        scores: d.scores, glance: d.glanceKeep == null ? "excluded" : d.glanceKeep ? "keep" : "roll",
        rule: d.ruleDecision ? "keep" : "roll", ruleReason: d.ruleReason, agree: d.agree })),
    })),
    batchWhileImproving: {
      note: "On THIS corpus batch-while-improving changes no verdict: the only compound (M6) is AT the floor, " +
        "so floor-mode already batches it. Its value is the OFF-floor compound the corpus cannot isolate (it " +
        "manifests as M4-style per-move rolls, which the aggregator already rescues). Falsified in the unit " +
        "tests (CG-BWI3: off-floor full-margin rejects a +2 nudge, keeps a +12). Complementary entry-symmetry " +
        "change → carried to S-214, not credited as an independent corpus win.",
    },
    winner: winner ? {
      aggregator: winner.aggregator,
      agreement: winner.agreement.fraction,
      rejectPassed: winner.reject.passed,
      reason: `${winner.aggregator} agrees ${winner.agreement.matches}/${winner.agreement.total} ` +
        `(vs median ${baselineMedianCorrected.agreement.matches}/${baselineMedianCorrected.agreement.total} corrected) ` +
        `AND rejects all ${winner.reject.results.length} worse-build fixtures; chosen over equal-agreement ` +
        `candidates by robustness (min keep-slack ${winner.minKeepSlack}). Carry with batch-while-improving (CLIMB_BATCH_MODE=improving) to S-214.`,
      disqualified: candidates.filter((c) => !c.reject.passed).map((c) => ({
        aggregator: c.aggregator, agreement: c.agreement.fraction,
        why: `rubber-stamps the worse-build battery: ${c.reject.results.filter((r) => !r.rejected).map((r) => r.id).join(", ")}`,
      })),
    } : null,
    judgeGradientRedirect: winner ? false : true, // true iff NO candidate beat the rule without rubber-stamping
    frozenInstrument: "untouched (aggregateVotes/batchEligible/acceptsRound/acceptsBatch imported read-only; no measurements/ change)",
  };

  const outJSON = args.includes("--json") ? args[args.indexOf("--json") + 1] : join(OUT_DIR, "contest-report.json");
  writeFileSync(outJSON, JSON.stringify(report, null, 2) + "\n");

  // stderr summary (human glance).
  console.error(`\n=== accept-rule contest: ${corpus.subject} (margin ${MARGIN}) ===`);
  console.error(`  candidate     agreement   reject-battery   minKeepSlack`);
  for (const c of candidates) {
    const a = `${c.agreement.matches}/${c.agreement.total}=${(c.agreement.fraction * 100).toFixed(0)}%`;
    const rb = c.reject.passed ? "PASS (3/3)" : `FAIL (${c.reject.results.filter((r) => r.rejected).length}/3)`;
    const flag = winner && c.aggregator === winner.aggregator ? "  <-- WINNER" : (!c.reject.passed ? "  <-- rubber-stamps" : "");
    console.error(`  ${c.aggregator.padEnd(12)}  ${a.padEnd(10)}  ${rb.padEnd(15)}  ${String(c.minKeepSlack).padEnd(6)}${flag}`);
  }
  console.error(`\nwinner: ${winner ? winner.aggregator : "NONE → judge-gradient redirect (S-214)"}`);
  console.error(`wrote ${outJSON}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

export { candidateDecision, rejectBattery, contest };
