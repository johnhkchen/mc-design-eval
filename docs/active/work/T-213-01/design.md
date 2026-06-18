# T-213-01 — Design: candidate accept-rules + the contest

**Epic E-55 / Story S-213.** Diverge-before-converge: implement ≥2 candidate accept-rules, judge each on the
S-212 bar AND a deliberately-worse build, let the strong one (or hybrid) win — with the reason recorded.

## The two candidate classes (the ticket names them)

1. **Non-median aggregator** — the median discarded the arch's `[8,0,48]` (M4) and the gable's `[0,12,0]`
   (M2). Replace it with an aggregator that keeps a strong-minority read.
2. **Batch-while-improving** — the batch escape fires only at the score floor (`coldStartFloor`). Let detail
   COMPOUND whenever the form is closed, not only at the floor — kill the floor-only asymmetry (M6).

## Decision 1 — WHERE the aggregator lives: the caller, not the gate

**Chosen: a pure exported helper `aggregateVotes(scores, kind)` + a frozen `VOTE_AGGREGATORS` table; the gate
functions are UNCHANGED.** Research §2 found the median lives in the runner's `scoreBuild`, not the gate —
the gate consumes a single `.score` scalar. So the aggregator is purely "which scalar the caller derives from
the per-vote `scores`." The runner sets `score = aggregateVotes(scores, CLIMB_AGGREGATOR)` (default
`"median"` → byte-identical). The spike feeds the same helper the corpus `scores`.

- **Rejected: add an `aggregator` branch inside `acceptsRound`.** It would thread `scores` arrays through the
  gate and risk perturbing the frozen per-move path. The helper-at-the-seam keeps the gate byte-stable and
  the change a one-liner at each call site — strictly less surface, same effect.

## Decision 2 — WHICH aggregators to contest

Implement three, contest all against the median (margin 4; batchMargin 1 in the batch path):

| aggregator | M2 batch `[0,12,0]`Δ | M4 per-move `[8,0,48]`Δ | spike `[40,40,40]→[0,0,48]` | verdict |
|---|---|---|---|---|
| **median** (current) | 0 → ROLL ✗ | 0 → ROLL ✗ | −40 → roll ✓ | agreement FAIL |
| **max** | +12 → keep ✓ | +40 → keep ✓ | **+8 → KEEP ✗** | **rubber-stamps the spike** |
| **mean** | +4 → keep ✓ (knife-edge) | +10.7 → keep ✓ | −24 → roll ✓ | passes, fragile on M2 |
| **trimmedMean** (drop-lowest, mean rest) | +6 → keep ✓ | +20 → keep ✓ | −16 → roll ✓ | **strongest** |

`trimmedMean` for n=3 = mean of the top 2 votes. It rescues a strong-minority read (one judge sees the arch)
**without** `max`'s lone-spike rubber-stamp: two craters + one euphoric vote still average low, because
dropping ONE low vote still leaves a low vote. It is the ticket's "upper quantile" candidate, made robust.

**The contest's discriminator is the spike fixture `[40,40,40]→[0,0,48]`** (a good build two judges now hate,
one loves). `max` KEEPS it (rubber-stamp); `mean`/`trimmedMean`/`median` REJECT it. This is the no-rubber-
stamp falsification — and it is what separates the aggregators, because the **monotonic corpus alone gives
`max` a false 5/5** (research §1). Reporting this is the anti-hedge core: corpus-agreement is necessary but
not sufficient; the reject set decides.

## Decision 3 — batch-while-improving: relax the ENTRY predicate, reuse acceptsBatch

**Chosen: a pure `batchEligible({score, closure, mode})` predicate.** `mode:"floor"` (default) delegates to
`coldStartFloor` (byte-identical to T-208). `mode:"improving"` returns eligible on ANY closed form regardless
of score. The COMPOUND is still judged by `acceptsBatch`'s full guard stack (form-integrity → regression →
added-major → net-minor → tie) — **no-rubber-stamp preserved** (reuse, not fork: the ticket's instruction).

- **Off-floor margin:** at the floor, escaping 0 is the signal (`batchMargin 1`). Off the floor you are
  already up, so the compound must clear the REAL margin (4). The runner passes
  `batchMargin = coldStartFloor(...) ? BATCH_DEFAULTS.batchMargin : margin`. This stops batch-while-improving
  from rubber-stamping a +1 nudge on an already-decent build (the ticket's "batch-while-improving rubber-
  stamps" failure mode).
- **Rejected: a new `acceptsBatchWhileImproving` gate.** Forking duplicates the guard stack and drifts. The
  entry predicate + the existing `acceptsBatch` is the whole change.

## Decision 4 — what batch-while-improving actually buys on THIS corpus (honest scope)

The corpus's only compound (M6) is **at the floor**, so current(corrected) already KEEPS it — batch-while-
improving changes **no corpus verdict** the aggregator doesn't. Its value is the OFF-floor compound the
corpus cannot isolate as a single labelled move (it manifests as M4-style per-move rolls, which the
**aggregator already rescues**). So on the bar, the aggregator is the load-bearing fix; batch-while-improving
is a **complementary entry-symmetry change** carried into S-214, reported at lower confidence — not claimed
as an independent corpus win. Saying this plainly is the anti-hedge honesty the ticket demands (don't
manufacture a second win the bar can't show). The contest still **implements and falsifies it** (it must
reject a worse off-floor compound), satisfying the "≥2 candidates" AC.

## Decision 5 — the contest harness: reuse the S-212 bar, don't fork it

`accept-rule-spike.mjs` imports `loadCorpus`, `replayMove`, `agreement` from `accept-rule-replay.mjs` (the
S-212 instruction: "reuse the bar"). For **form moves** (M1/M3, closure-decided, aggregator-invariant) it
calls `replayMove` unchanged. For **detail/batch moves** it calls the *real* `acceptsRound`/`acceptsBatch`
with `before.score`/`after.score` set via `aggregateVotes(state.scores, kind)`. Agreement is computed by the
**same `agreement()`** over the same corpus — a fair contest. The no-rubber-stamp battery (M5 + two synthetic
worse builds) is run per candidate and reported beside the agreement fraction.

## The expected result (led with how it fails)

- **trimmedMean** beats the current median materially (40%→100% on the corpus; 60%→100% vs the T-209-corrected
  baseline) AND rejects every worse-build fixture (M5, spike, regression) → a clean, non-rubber-stamp win.
- **max** ties trimmedMean on the corpus but FAILS the spike → disqualified (the documented trade).
- **mean** passes but is knife-edge on M2 (+4.0 at margin 4) → second.
- **batch-while-improving** adds entry-symmetry but no isolated corpus win → complementary, → S-214.
- **It would FAIL** if every passing candidate had to rubber-stamp (it doesn't — trimmedMean rejects 3/3 worse
  builds), or if none beat the median (trimmedMean does). Neither fires → not architecture-ceiling territory;
  the rule class has headroom the median did not use. Pick: **trimmedMean aggregator + batch-while-improving**,
  handed to S-214 for the re-climb.
