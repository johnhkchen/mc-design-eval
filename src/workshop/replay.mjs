// Workshop replay + offline re-assert (T-126-01, story S-126, epic E-31) — Rule 5 made
// mechanical: "reproducible by replay of the committed program + ledger, not by denial of
// drafts." The final build is a pure function of the SEED program and the ACCEPTED rounds'
// recorded actions — no model calls, no GL, no re-asking anything.
//
// REPLAY RE-APPLIES, NEVER RE-DECIDES. An accepted adjust-params re-runs the deterministic
// applier on the recorded parameters; accepted paint re-applies the recorded placements (they
// were deterministic at record time and are carried verbatim — the ledger IS an input). Rejected
// rounds are skipped exactly as the cage skipped them live.
//
// OFFLINE RE-ASSERTS THE COMMITTED RECORD'S INTERNAL CONSISTENCY (the multi-angle --offline
// precedent): schema/budget bounds, reply-policy invariants, the cage's arithmetic on the
// recorded conformance reports, and byte-equality of the replayed artifact against the committed
// final — exit-code material for the named npm runs.
//
// PURE — no GL, no IO, no Date/random — runs under the `src/**/*.test.mjs` glob.

import { MAX_REPLY_ATTEMPTS } from "../form/judge-reply.mjs";
import { applyPaint } from "../view/face-paint.mjs";
import { assertBuildingProgram } from "../recognition/program.mjs";
import { compileProgram } from "../recognition/compile.mjs";
import { realizeWithArticulation } from "./articulate.mjs";
import { WORKSHOP_LEDGER_SCHEMA, isRegression } from "./loop.mjs";
import { applyGeometryAdjust, substituteMass, prunePaint } from "./geometry.mjs";
import { parseWorkshopProgram, assertWorkshopProgram, applyParamAdjust } from "./program.mjs";

/** THE canonical artifact serialization — byte identity is equality of this function's output.
 *  The runner writes final artifacts through it; replay compares through it. One definition. */
export function serializeArtifact(artifact) {
  return JSON.stringify(artifact, null, 2) + "\n";
}

/**
 * Replay a committed ledger: seed program + accepted rounds → the final artifact. Throws on a
 * ledger whose accepted rounds it cannot re-apply (an unreplayable action is a corrupt ledger,
 * not a judgement call). `throughRound` (T-135-01) bounds the replay to rounds ≤ N — the
 * per-round witness's prefix view (0 = the seed alone); omitted, the full-replay byte-identity
 * contract is untouched.
 *
 * GEOMETRY-BEARING ROUNDS (T-136-01) re-enter the deterministic levers: an accepted geometry
 * adjust is RE-DERIVED (applyGeometryAdjust on the tracked source — re-derivation is stronger
 * evidence than a copy), an accepted re-recognition re-applies the LEDGERED fragment verbatim
 * (a model output; the ledger IS the input — the paint precedent). Both need `pack` (a committed
 * input, sha-pinned in the ledger's packRef) and the ledger's seed `source`.
 * @param {{ledger:object, pack?:object, throughRound?:number}} args
 * @returns {{artifact:object, program:object, source:object|null,
 *            applied:{programAdjusts:number, geometryAdjusts:number, recognized:number,
 *                     paintPlacements:number, paintPruned:number}}}
 */
export function replayLedger({ ledger, pack = null, throughRound }) {
  if (ledger?.schema !== WORKSHOP_LEDGER_SCHEMA) {
    throw new Error(`replayLedger: ledger.schema must be "${WORKSHOP_LEDGER_SCHEMA}"`);
  }
  if (throughRound !== undefined && (!Number.isInteger(throughRound) || throughRound < 0)) {
    throw new Error(`replayLedger: throughRound must be an integer ≥ 0, got ${throughRound}`);
  }
  let program = assertWorkshopProgram(ledger.program);
  let source = ledger.source != null ? assertBuildingProgram(ledger.source) : null;
  let paint = [];
  let programAdjusts = 0;
  let geometryAdjusts = 0;
  let recognized = 0;
  let paintPruned = 0;
  const geometryCtx = (round) => {
    if (!pack) throw new Error(`replayLedger: round ${round.round} is geometry-bearing — pass the pack (a committed, sha-pinned input)`);
    if (!source) throw new Error(`replayLedger: round ${round.round} is geometry-bearing but the ledger carries no seed source`);
    return { source, pack, budget: { ...program.budget }, proportions: program.declarations?.proportions ?? null };
  };
  const advance = (r) => {
    program = r.program;
    source = r.source;
    const pruned = prunePaint(program, paint); // the loop pruned at the same acceptance point
    paint = pruned.paint;
    paintPruned += pruned.pruned;
  };
  for (const round of ledger.rounds ?? []) {
    if (throughRound !== undefined && round.round > throughRound) continue;
    if (round.decision !== "revise" || !round.conformance?.accepted) continue;
    const kind = round.applied?.kind;
    if (kind === "program") {
      if (round.action?.action !== "adjust-params") {
        throw new Error(`replayLedger: round ${round.round} accepted a program change via "${round.action?.action}" — not replayable here`);
      }
      program = applyParamAdjust(program, { elementId: round.action.elementId, params: round.action.params });
      programAdjusts++;
    } else if (kind === "geometry") {
      advance(applyGeometryAdjust(geometryCtx(round), { massId: round.action.massId, params: round.action.params }));
      geometryAdjusts++;
    } else if (kind === "recognize") {
      advance(substituteMass(geometryCtx(round), { massId: round.applied.massId, mass: round.applied.mass }));
      recognized++;
    } else if (kind === "paint") {
      paint.push(...round.applied.placements);
    } else {
      throw new Error(`replayLedger: round ${round.round} accepted with unreplayable applied.kind "${kind}"`);
    }
  }
  // T-149-01 (E-35): a relieved build reproduces only if replay re-constructs the same articulation
  // the loop did — from the (re-recognition-updated) seed source + the sha-pinned pack. Facade-less
  // ledgers compile to an empty plan ⇒ byte-identical to a bare realize (every committed chain today).
  const articulation = source && pack ? compileProgram(source, pack).articulation : [];
  const { artifact: realized } = realizeWithArticulation(program, articulation);
  const artifact = paint.length ? applyPaint(realized, paint) : realized;
  return { artifact, program, source,
           applied: { programAdjusts, geometryAdjusts, recognized, paintPlacements: paint.length, paintPruned } };
}

const OUTCOMES = Object.freeze(["done", "budget-exhausted", "exchange-refused"]);

/**
 * Re-assert a committed workshop record without renders or model calls. Collects every problem
 * (never stops at the first — the record is reviewed as a whole).
 * @param {{ledger:object, finalArtifactText:string, conform?:(artifact:object, declarations:object)=>object,
 *          pack?:object}} args
 *   `conform` (the pure gate closed over the pack) re-checks the recorded FINAL conformance;
 *   omit it to skip that re-derivation (replay byte-equality still runs). `pack` is required
 *   for ledgers with geometry-bearing rounds (replay re-derives them — T-136-01).
 * @returns {{ok:boolean, problems:string[]}}
 */
export function offlineAssert({ ledger, finalArtifactText, conform, pack = null }) {
  const problems = [];
  const p = (msg) => problems.push(msg);

  if (ledger?.schema !== WORKSHOP_LEDGER_SCHEMA) p(`schema is "${ledger?.schema}", want "${WORKSHOP_LEDGER_SCHEMA}"`);
  const seed = parseWorkshopProgram(ledger?.program ?? null);
  if (!seed.ok) p(`seed program invalid: ${seed.errors.join("; ")}`);
  const rounds = Array.isArray(ledger?.rounds) ? ledger.rounds : (p("rounds must be an array"), []);
  const budget = ledger?.budget?.rounds;
  if (!Number.isInteger(budget) || budget < 1) p("budget.rounds must be an integer ≥ 1");
  else if (rounds.length > budget) p(`rounds used (${rounds.length}) exceed the declared budget (${budget})`);
  if (ledger?.final?.rounds !== rounds.length) p(`final.rounds (${ledger?.final?.rounds}) ≠ rounds recorded (${rounds.length})`);
  if (!OUTCOMES.includes(ledger?.final?.outcome)) p(`final.outcome "${ledger?.final?.outcome}" not in ${OUTCOMES.join("|")}`);

  rounds.forEach((r, i) => {
    const where = `round ${i + 1}`;
    if (!Array.isArray(r.replies) || r.replies.length === 0) p(`${where}: raw replies missing — the round is unreviewable`);
    if (Number.isInteger(r.askCount) && r.askCount > MAX_REPLY_ATTEMPTS) {
      p(`${where}: askCount ${r.askCount} exceeds the reply-policy bound (${MAX_REPLY_ATTEMPTS})`);
    }
    if (r.decision === "revise" && !r.action) p(`${where}: decision "revise" without an action`);
    if (r.decision === "done" && r.action) p(`${where}: decision "done" carries an action`);
    if (r.applied?.kind === "recognize") {
      // the inner exchange is ledger material (T-114): without its raw replies the round is unreviewable
      if (!Array.isArray(r.applied.replies) || r.applied.replies.length === 0) {
        p(`${where}: re-recognize accepted without its raw fragment replies`);
      }
      if (Number.isInteger(r.applied.askCount) && r.applied.askCount > MAX_REPLY_ATTEMPTS) {
        p(`${where}: re-recognize askCount ${r.applied.askCount} exceeds the reply-policy bound (${MAX_REPLY_ATTEMPTS})`);
      }
      if (r.applied.mass == null) p(`${where}: re-recognize accepted without the ledgered fragment`);
    }
    const c = r.conformance ?? {};
    if (c.accepted) {
      if (r.decision === "revise") {
        if (!c.after) p(`${where}: accepted without an after-gate report`);
        else if (isRegression(c.before, c.after)) p(`${where}: accepted but the recorded reports show a regression`);
      }
    } else if (c.after && !isRegression(c.before, c.after)) {
      p(`${where}: rolled back but the recorded reports show no regression (${c.reason})`);
    }
  });

  // outcome consistency with the last round
  const last = rounds[rounds.length - 1];
  const outcome = ledger?.final?.outcome;
  if (last && outcome === "done" && last.decision !== "done") p('outcome "done" but the last round did not declare done');
  if (last && outcome === "exchange-refused" && last.conformance?.reason !== "exchange-refused") {
    p('outcome "exchange-refused" but the last round was not a refusal');
  }
  if (outcome === "budget-exhausted" && budget && rounds.length !== budget) {
    p(`outcome "budget-exhausted" but only ${rounds.length}/${budget} rounds recorded`);
  }

  // Rule 5: the replayed build byte-matches the committed final artifact
  if (problems.length === 0 || seed.ok) {
    try {
      const { artifact, program: replayedProgram } = replayLedger({ ledger, pack });
      if (typeof finalArtifactText !== "string" || finalArtifactText.length === 0) {
        p("finalArtifactText missing — nothing to byte-compare against");
      } else if (serializeArtifact(artifact) !== finalArtifactText) {
        p("REPLAY DIVERGES: serializeArtifact(replay) ≠ the committed final artifact");
      }
      if (conform) {
        // the REPLAYED program's declarations (geometry rounds re-derive bands — T-136-01;
        // constant across spec-merge adjusts, so legacy records re-derive identically)
        const recheck = conform(artifact, replayedProgram.declarations);
        if (JSON.stringify(recheck) !== JSON.stringify(ledger?.final?.conformance)) {
          p("final conformance re-derivation differs from the recorded report");
        }
      }
    } catch (e) {
      p(`replay failed: ${e.message}`);
    }
  }

  return { ok: problems.length === 0, problems };
}
