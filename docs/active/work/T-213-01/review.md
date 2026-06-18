# T-213-01 — Review: the accept-rule spike

**Epic E-55 / Story S-213.** Self-assessment for handoff. The diverge: ≥2 candidate accept-rules implemented,
judged on the S-212 bar AND a no-rubber-stamp battery, winner picked with the reason recorded. Frozen
instrument untouched; zero metered spend.

## What changed

| File | Change | Notes |
|---|---|---|
| `src/workshop/climb-gate.mjs` | **+~55 lines, additive** | `VOTE_AGGREGATORS` (median/max/mean/trimmedMean), `aggregateVotes`, `BATCH_MODES`, `batchEligible`. Pure, exported, default-OFF. **No existing function body edited.** |
| `src/workshop/climb-gate.test.mjs` | **+8 cases** | CG-AGG1–4 (aggregator: default-identity, KEEP, no-rubber-stamp, shape) + CG-BWI1–4 (batch-while-improving: default-identity, off-floor entry, off-floor reject, shape). |
| `experiments/eval-alignment/accept-rule-spike.mjs` | **new** | The offline contest. Reuses the S-212 bar (`loadCorpus`/`replayMove`/`agreement`) + the real gate. Exports `candidateDecision`/`rejectBattery`/`contest` for S-214. Out of `npm test`. |
| `experiments/eval-alignment/picture-climb.mjs` | **3 edits, opt-in** | Import; `CLIMB_AGGREGATOR`/`CLIMB_BATCH_MODE` knobs; `scoreBuild` scalar; batch entry + off-floor margin. All default-OFF. |
| `docs/active/work/T-213-01/` | **artifacts** | research, design, structure, plan, contest-report.{json,md}, review. |

Three commits: gate+tests → harness+report+RDSPI → runner wiring.

## The result (the contest)

| candidate | agreement vs glance | reject battery | outcome |
|---|---|---|---|
| median (current) | 3/5 = 60%* | PASS 3/3 | the baseline |
| max | 5/5 = 100% | **FAIL 2/3** | rubber-stamps the lone-spike build → **disqualified** |
| mean | 5/5 = 100% | PASS 3/3 | passes; knife-edge on a per-move gable |
| **trimmedMean** | **5/5 = 100%** | PASS 3/3 | **WINNER** (+ batch-while-improving) |

*60% is the post-T-209 corrected-closure baseline; S-212 led with 40% on the recorded stale closure. Both
correct; reconciled in `contest-report.md`. Either way trimmedMean reaches 100%.

**The headline holds:** trimmedMean keeps the +48 centered arch (M4, +20 over the margin) and the +12 gable
(M2, +6) the median rolled back, while rejecting all three deliberately-worse builds. `max` ties on the
*monotonic* corpus but rubber-stamps the spike — proving the reject battery (not corpus-agreement) is the
discriminator, the anti-hedge core of the ticket.

## Acceptance criteria — status

- [x] **≥2 candidate accept-rules in the climb-gate, pure/opt-in/default-OFF.** Aggregator family
  (`aggregateVotes`) + batch-while-improving (`batchEligible`). Default `median`/`floor` are byte-identical
  to today (asserted: CG-AGG1, CG-BWI1).
- [x] **Each scored on the bar AND a deliberately-worse build it must reject (CG-B2/B8 style).** Agreement via
  the contest harness; reject via the synthetic battery (spike/regression/sideways) in the harness AND in unit
  tests CG-AGG3 (the spike: max keeps, others reject) + CG-BWI3 (off-floor +2 rejected, +12 kept).
- [x] **Contest recorded; strongest picked with reason.** `contest-report.{json,md}`; winner = trimmedMean +
  batch-while-improving, with the robustness tiebreak (min keep-slack 16 vs mean 6.7) and max's
  disqualification documented.
- [x] **Judge-gradient redirect recorded if every candidate had to rubber-stamp.** It did NOT — a passing
  candidate beat the rule cleanly, so `judgeGradientRedirect: false` is recorded with the reasoning (the gap
  was the median's discard of a minority read, not the scorer's gradient).
- [x] **`npm test` green; frozen instrument untouched.** 2446/2446 (+8). No `measurements/**`/`benchmarks/**`/
  scorer edit — `aggregateVotes`/`batchEligible` are pure helpers; the gate decision functions are unchanged.

## Test coverage

- **Default-OFF byte-identity** is asserted FIRST (CG-AGG1: `aggregateVotes(_, "median")` ≡ runner median for
  6 shapes; CG-BWI1: `batchEligible({mode:"floor"})` ≡ `coldStartFloor` for 6 fixtures). This is the
  load-bearing safety guarantee — prior climbs re-run unchanged.
- **The KEEP side** (agreement): CG-AGG2 — every non-median aggregator keeps the [8,0,48] arch the median rolls.
- **The REJECT side** (no-rubber-stamp): CG-AGG3 — the spike `[40,40,40]→[0,0,48]`: median/mean/trimmedMean
  reject, max keeps (the recorded trade). CG-BWI3 — off-floor full-margin rejects a +2, keeps a +12.
- **Shape/frozen guards:** CG-AGG4, CG-BWI4.
- The contest harness is verified by a deterministic re-run (byte-identical `contest-report.json`) and a
  cross-check against the S-212 replay (median agreement reconciles).

## Open concerns / limitations

1. **Monotonic, single-subject corpus.** The bar has no genuine glance-ROLL move except M5, so the *keep* side
   is tested only on KEEP-worthy moves; the reject battery (synthetic, off-corpus) carries the no-rubber-stamp
   weight. A corpus with real glance-ROLL moves (E-56) would harden the keep side. **Not a blocker** for
   S-214 — the winner is proven to reject worse builds.
2. **trimmedMean is tuned for n=3 votes** ("drop the single lowest"). It generalizes to "drop lowest, mean the
   rest," but robustness margins shift at other `VOTES`. The runner's `VOTES=3` matches; flagged if that changes.
3. **batch-while-improving has no isolated corpus win** — the corpus's only compound is at-floor. It is carried
   as a complementary entry-symmetry change (falsified in CG-BWI3), not credited as a second win. Its real
   value shows only in a live off-floor climb (S-214).
4. **The winner is proven offline.** S-214 owns the metered re-climb (`CLIMB_AGGREGATOR=trimmedMean
   CLIMB_BATCH_MODE=improving`) and the can-it-finish-to-M1 verdict. This ticket proves the *decision* is
   right on recorded inputs, exactly as S-212 proved the disagreement.

## For the human reviewer

- The **central claim to check** is CG-AGG3 + the contest's reject battery: the win is real only because the
  winner rejects worse builds on a corpus that would otherwise reward keeping everything. If you trust one
  thing, trust that the reject set is off-corpus and that `max` fails it.
- **No frozen-instrument risk:** the gate's decision functions (`acceptsRound`/`acceptsBatch`) are byte-unchanged;
  the new code only chooses which scalar the caller passes and when it batches. `git show` the gate commit to
  confirm the diff is purely additive.
- **Handoff to S-214** (`T-214-01`): re-climb the gatehouse with the two knobs; either the architecture
  finishes to M1 (generalization opens) or it names the next ceiling. The rule class is **not** exhausted —
  the median was leaving a 40-point minority read on the floor on every detail move.
