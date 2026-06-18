#!/usr/bin/env node
// ACCEPT-RULE REPLAY (T-212-01, story S-212, epic E-55) — the BAR for the S-213 accept-rule spike.
//
// Replays a quality-varied climb-state corpus (docs/active/work/T-212-01/corpus.json) through the *current*
// creation-loop accept-rule (per-move median `acceptsRound` + floor-only batch `acceptsBatch`, imported from
// src/workshop/climb-gate.mjs — the REAL rule, never a copy) and reports keep/rollback vs a recorded human
// glance-rank. PURE: no GL, no LLM, no network, no metered spend — it reads committed trajectory JSONs and
// recomputes deterministic decisions. The frozen DiagnoseBuild scorer is NOT touched; this validates the
// creation-loop ACCEPT-RULE only (the E-38 [[workshop-progress-decoupled-from-quality]] thread).
//
// Two outputs: (1) a REPRODUCIBILITY assertion — the recomputed decision must equal the trajectory's recorded
// gate.accept for every move (proves the disagreement is structural, not a fluke; exits nonzero on mismatch);
// (2) the AGREEMENT metric — fraction of moves where the rule's keep/rollback matches the glance verdict
// (rank(to) > rank(from) => the move improved the look => should be kept).
//
// S-213 reuse: import { loadCorpus, replayMove, agreement } and swap the aggregator / accept-fn, judged
// against the SAME corpus + the SAME metric (a fair contest — "specify the bar crisply").

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { acceptsRound, acceptsBatch, coldStartFloor } from "../../src/workshop/climb-gate.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../..");
const DEFAULT_CORPUS = join(REPO, "docs/active/work/T-212-01/corpus.json");

const readJSON = (p) => JSON.parse(readFileSync(p, "utf8"));
const sum = (o) => Object.values(o ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);
// Identical to the runner's aggregator (picture-climb.mjs:96) — the per-move/median operator under test.
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

export function loadCorpus(path = DEFAULT_CORPUS) {
  const corpus = readJSON(path);
  const states = Object.fromEntries(corpus.states.map((s) => [s.id, s]));
  return { ...corpus, states, _path: path };
}

// Find the trajectory round backing a move (batch rounds match by round#+batch field; per-move by round#+tool).
function roundOf(move) {
  const traj = readJSON(join(REPO, move.trajectory));
  const r = move.kind === "batch"
    ? traj.trajectory.find((x) => x.round === move.round && x.batch)
    : traj.trajectory.find((x) => x.round === move.round && x.pick?.tool === move.tool && x.applied);
  if (!r) throw new Error(`replay: no trajectory round for ${move.id} (${move.tool} @ round ${move.round})`);
  return r;
}

// Reconstruct the before/after evidence bundles the rule consumes (Research §5). after.nMajor is recovered as
// sum(deptMajorsAfter); after.wrongStyleBreadth carries forward from before (the dark roof/wall wrong-style
// reads are unchanged by an added arch — and only the acceptsRound tie-zone reads it, where this is exact).
function bundles(r) {
  const before = {
    score: r.score,
    nMajor: r.evidence?.nMajor,
    nWrongStyle: r.evidence?.nWrongStyle,
    wrongStyleBreadth: r.evidence?.wrongStyleBreadth,
  };
  const after = {
    score: r.scoreAfter?.score,
    scores: r.scoreAfter?.scores,
    nMajor: r.deptMajorsAfter ? sum(r.deptMajorsAfter) : r.evidence?.nMajor,
    wrongStyleBreadth: r.evidence?.wrongStyleBreadth, // carry-forward (documented)
  };
  return { before, after };
}

// Recompute the CURRENT rule's decision on a move's recorded inputs, via the real climb-gate functions.
export function replayMove(move, corpus, { closureOverride = null } = {}) {
  const r = roundOf(move);
  const { before, after } = bundles(r);
  const opts = {
    targetDepartments: r.targetDepartments ?? null,
    beforeDeptMajors: r.deptMajorsBefore ?? null,
    afterDeptMajors: r.deptMajorsAfter ?? null,
    beforeDeptItems: r.deptItemsBefore ?? null,
    afterDeptItems: r.deptItemsAfter ?? null,
    closureBefore: r.closure,
    closureAfter: closureOverride ?? r.closureAfter,
  };

  let gate;
  if (move.kind === "batch") {
    // Batch path is engaged only at the cold-start floor (score<=0 on a closed form). Record whether the
    // escape would even fire — the floor-only-batch property the ticket targets.
    gate = acceptsBatch(before, after, opts);
  } else {
    gate = acceptsRound(before, after, { ...opts, isFormMove: !!move.isFormMove });
  }

  const recompute = gate.accept;
  const recorded = move.recordedDecision;
  const reproducible = recompute === recorded;

  const rankFrom = corpus.states[move.from]?.rank ?? null;
  const rankTo = corpus.states[move.to]?.rank ?? null;
  const glanceKeep = move.glanceVerdict === "keep" ? true
    : move.glanceVerdict === "ambiguous-excluded" ? null
    : (rankTo != null && rankFrom != null ? rankTo > rankFrom : null);

  const agree = glanceKeep == null ? null : (glanceKeep === recompute);

  return {
    id: move.id, tool: move.tool, from: move.from, to: move.to, kind: move.kind,
    scores: after.scores, median: after.scores ? median(after.scores) : null, max: after.scores ? Math.max(...after.scores) : null,
    glanceVerdict: move.glanceVerdict, glanceKeep,
    ruleDecision: recompute, ruleReason: gate.reason,
    recordedDecision: recorded, reproducible,
    agree,
    atFloor: move.kind === "batch" ? coldStartFloor({ score: before.score, closure: opts.closureBefore }) : null,
  };
}

// S-213 PREVIEW (read-only illustration, NOT a deliverable): what a max-of-votes aggregator would decide on
// the recorded votes if it replaced the median in the delta. Shows the headline disagreement is addressable.
export function aggregatorPreview(move, corpus) {
  const r = roundOf(move);
  const beforeMed = r.score;
  const after = r.scoreAfter?.scores ?? [];
  if (!after.length) return null;
  const med = median(after), mx = Math.max(...after), mean = after.reduce((a, b) => a + b, 0) / after.length;
  const margin = 4;
  return {
    id: move.id, votes: after, beforeMedian: beforeMed,
    medianDelta: med - beforeMed, medianKeep: (med - beforeMed) >= margin,
    maxDelta: mx - beforeMed, maxKeep: (mx - beforeMed) >= margin,
    meanDelta: +(mean - beforeMed).toFixed(1), meanKeep: (mean - beforeMed) >= margin,
  };
}

export function agreement(results) {
  const scored = results.filter((x) => x.agree != null);
  const matches = scored.filter((x) => x.agree).length;
  const disagreements = scored.filter((x) => !x.agree).map((x) => ({
    id: x.id, tool: x.tool, transition: `${x.from}->${x.to}`, scores: x.scores,
    glance: x.glanceKeep ? "keep" : "rollback", rule: x.ruleDecision ? "keep" : "rollback", ruleReason: x.ruleReason,
  }));
  return { matches, total: scored.length, fraction: scored.length ? +(matches / scored.length).toFixed(3) : 0, disagreements };
}

function main() {
  const args = process.argv.slice(2);
  const corpusPath = args.includes("--corpus") ? args[args.indexOf("--corpus") + 1] : DEFAULT_CORPUS;
  const corpus = loadCorpus(corpusPath);

  // The current-rule replay. For the stale-closure batch (M6) run BOTH ways: recorded stale closure (the
  // pre-T-209 false reopen) AND the T-209-corrected closure (current-rule true behavior).
  const results = corpus.moves.map((m) => {
    if (m.to === "S5") {
      const corrected = corpus.states[m.to]?.closureAfterCorrected ?? null;
      const stale = replayMove(m, corpus);
      const fixed = corrected != null ? replayMove(m, corpus, { closureOverride: corrected }) : null;
      return { ...stale, stale, corrected: fixed };
    }
    return replayMove(m, corpus);
  });

  const reproFailures = results.filter((x) => !x.reproducible).map((x) => x.id);
  const agree = agreement(results);
  const previews = corpus.moves.map((m) => aggregatorPreview(m, corpus)).filter(Boolean);

  const report = {
    schema: "accept-rule-agreement/v1",
    ticket: "T-212-01", subject: corpus.subject, corpus: corpusPath,
    glanceRank: corpus.glanceRank,
    reproducibility: { allReproducible: reproFailures.length === 0, failures: reproFailures },
    agreement: agree,
    moves: results,
    aggregatorPreview: previews,
    frozenInstrument: "untouched (acceptsRound/acceptsBatch imported read-only; no measurements/ change)",
  };

  const outJSON = args.includes("--json") ? args[args.indexOf("--json") + 1]
    : join(dirname(corpusPath), "agreement-report.json");
  writeFileSync(outJSON, JSON.stringify(report, null, 2) + "\n");

  // stderr summary (human glance at the run).
  console.error(`\n=== accept-rule replay: ${corpus.subject} (${corpus.moves.length} moves) ===`);
  console.error(`reproducibility: ${report.reproducibility.allReproducible ? "PASS — recomputed == recorded for every move" : "FAIL: " + reproFailures.join(", ")}`);
  console.error(`agreement vs glance: ${agree.matches}/${agree.total} = ${(agree.fraction * 100).toFixed(0)}%`);
  for (const m of results) {
    const g = m.glanceKeep == null ? "excl " : m.glanceKeep ? "keep " : "roll ";
    const ru = m.ruleDecision ? "KEEP" : "ROLL";
    const flag = m.agree === false ? "  <-- DISAGREE" : "";
    console.error(`  ${m.id} ${m.tool.padEnd(28)} [${(m.scores ?? []).join("/").padEnd(8)}] glance=${g} rule=${ru} (${m.ruleReason})${flag}`);
    if (m.corrected) console.error(`       ^ stale-closure batch: stale->${m.stale.ruleDecision ? "KEEP" : "ROLL"} | T-209-corrected->${m.corrected.ruleDecision ? "KEEP" : "ROLL"} (${m.corrected.ruleReason})`);
  }
  console.error(`\nwrote ${outJSON}`);

  if (!report.reproducibility.allReproducible) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
