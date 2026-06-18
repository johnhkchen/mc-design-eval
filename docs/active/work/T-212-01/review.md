# T-212-01 — Review: the rankable bar + accept-rule diagnosis

**Epic E-55 / Story S-212. The bar.** Handoff for a human reviewer. **One line:** the missing instrument
the E-38 finding named is built — a quality-varied, human-rankable climb-state corpus + a pure replay
harness that runs each state through the *real* current accept-rule — and it shows, **reproducibly**, that
the rule disagrees with the glance on the moves that land the picture (agreement **2/5 = 40%**;
`median([8,0,48])=8` discards the +48 centered arch). The corpus **is** rankable, so the ticket proceeds
(the STOP-and-redirect condition did not fire). Zero metered spend; frozen instrument untouched.

## What changed (commit `5f936a6`)

| Path | Type | Content |
|---|---|---|
| `docs/active/work/T-212-01/corpus.json` | **new** data | `accept-rule-corpus/v1` — 6 states S0–S5 + glance-rank + 6 moves, rule-inputs copied verbatim from the T-211/T-208 trajectories |
| `experiments/eval-alignment/accept-rule-replay.mjs` | **new** harness | Imports the real `acceptsRound`/`acceptsBatch`/`coldStartFloor`; replays each move; asserts recompute == recorded; reports agreement. Exports `loadCorpus`/`replayMove`/`agreement` for S-213 |
| `docs/active/work/T-212-01/agreement-report.json` | **new** (generated) | Machine output: reproducibility, agreement, per-move, aggregator preview |
| `docs/active/work/T-212-01/agreement-report.md` | **new** | The human bar: corpus, glance-rank, per-move table, headline, asymmetry, limitations |
| `docs/active/work/T-212-01/{research,design,structure,plan,progress}.md` | **new** | RDSPI artifacts |

`src/`, `measurements/`, `benchmarks/` **byte-unchanged** (`git status` empty for all three). No file added
to `npm test`.

## Verdict against the falsifiable claim (anti-hedge — led with how it fails)

Claim: the corpus is **human-rankable** AND the current accept-rule **measurably + reproducibly disagrees**
(discards the +48 arch). **Result: held on every branch.**

- ✅ **Rankable.** A clear glance gradient — open colonnade (S0) → closed box (S1) → +gable (S2) → dressed
  walls (S3) → +centered arch (S4) → pale roofed compound (S5). The E-38 STOP condition
  ([[workshop-progress-decoupled-from-quality]]: states not separable, all near-D-) **did not fire.** Had
  it fired, the ticket would have stopped and redirected upstream — it did not need to.
- ✅ **Measurably disagrees.** Agreement **2/5 = 40%**. The rule rolls back three glance-KEEP moves: the
  +12 gable (M2), the **+48 centered arch (M4 — the headline)**, and the +20 dressed compound (M6).
- ✅ **Reproducible / structural, not a fluke.** The harness recomputes every decision from recorded
  inputs via the *real* gate functions and asserts equality with the recorded run-time `gate.accept`:
  **PASS for all 6 moves.** The median is deterministic — `median([8,0,48])` is always 8.
- ✅ **Corpus narrowness named, not hidden** (one subject; S1/S2 unrendered; S5 cross-trajectory + stale
  closure). The rankable core is the four rendered states; both the current rule and any S-213 candidate
  face the same corpus, so the contest is fair.

## The two findings, isolated for S-213

1. **Median discards a strong minority (M4, the `8/0/48` arch).** The centered arched gateway is the
   defining gatehouse feature; one judge scored it 48; the median takes 8 (= the pre-arch build) → delta 0
   → rolled back. This is the exact seam the T-211 capstone named at full strength.
2. **Floor-only-batch asymmetry (M6, the `+20` compound).** Replayed two ways: stale closure → reject (the
   T-209-fixed false-reopen); T-209-corrected closure → accept — **but only because M6 sat at the score
   floor**. The identical dressing reached *off* the floor (M4's path) gets the per-move median and is
   rolled back. Same moves, opposite outcomes, decided by the score happening to be 0.

The harness's read-only `aggregatorPreview` shows a **max-of-votes** aggregator flips M2 and M4 to KEEP
(agreeing with the glance) **while still rolling back M5** (max delta 0 — not a rubber-stamp). That is the
non-median candidate T-213 names; batch-while-improving addresses M6. **T-212 measures; it does not fix.**

## Test coverage

- **`npm test` 2438/2438 green** before and after — this ticket adds no `src/` source and no suite test.
- **The harness is its own verification:** the in-run reproducibility assertion (recomputed == recorded
  for every move; exits nonzero on any mismatch) is the integration test, and it **passes**. This is the
  same convention the metered runner family follows (`picture-climb.mjs`, T-201/T-205/T-207/T-208) —
  out-of-suite integration evidence, reproducible by replay.
- **Corpus integrity** is guaranteed by that same assertion: a transcription error in `corpus.json` would
  make the recomputed decision diverge from the recorded one and fail the run (the plan's R1 mitigation —
  and it caught the real M2/M3 routing correction during Implement).

### Gaps / not covered
- **No `node:test` unit test** for the harness in the suite — by design (creation-loop tooling, out of the
  frozen suite). If the reviewer wants it hardened, a `replay → agreement` assertion over a tiny fixed
  corpus is the candidate; flagged, not built (it would be a judgment call about what belongs in `npm test`).
- **Glance-rank is an agent vision-read, pending human confirmation.** The S4/S5 adjacency is the one most
  likely to be revisited; it does not move the headline (both are rule-rolled-back KEEP-worthy moves).

## Open concerns / handoff

1. **The bar is ready for S-213 (T-213-01).** Import `{ loadCorpus, replayMove, agreement }` from the
   harness; swap the aggregator / accept-fn; judge against the **same** corpus + agreement metric. Add the
   no-rubber-stamp falsification (a deliberately-worse build the candidate must reject) — not run here.
2. **Confirm the glance-rank** (esp. S4 vs S5) if a human is available; the renders are
   `T-211/beside-first.png` (S0), `beside-kept.png` (S3), `beside-arch-rolledback.png` (S4),
   `T-208/beside-batch-rollback.png` (S5).
3. **No instrument touched.** Frozen scorer unchanged; `measurements/` byte-clean; the harness imports
   `climb-gate.mjs` read-only. The diagnosis is of the *creation-loop accept-rule*, never the frozen gate.

## Bottom line

The E-38 finding — *you can't validate an eval or show an agent climbing one without a quality-varied,
human-rankable test set* — now has its instrument. The set is rankable; the current accept-rule disagrees
with the glance 40% of the time, reproducibly, on exactly the moves that land the picture (the +48 arch,
the +20 compound); and the two responsible seams (median-discards-minority, floor-only-batch) are isolated
and quantified. **S-213 has a fair bar to spike its candidate accept-rules against.**
