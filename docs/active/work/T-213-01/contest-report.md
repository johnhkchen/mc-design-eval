# T-213-01 — The accept-rule contest: trimmedMean beats the median without rubber-stamping

**Epic E-55 / Story S-213.** The diverge. Candidate accept-rules judged on the S-212 bar (agreement with the
glance) AND a no-rubber-stamp reject battery, by `experiments/eval-alignment/accept-rule-spike.mjs` over
`…/T-212-01/corpus.json` + the *real* gate. `contest-report.json` is the machine output. Zero metered spend;
frozen instrument untouched.

## Verdict (anti-hedge — led with how it could fail)

- **Does a candidate beat the current rule materially WITHOUT rubber-stamping? YES.** `trimmedMean`
  (drop-lowest, mean the rest) agrees with the glance on **5/5** corpus moves vs the median's **3/5**, AND
  rejects **all 3** deliberately-worse builds. It keeps the +48 arch (M4) and the dressed compound (M6) the
  median rolled back, while still rolling a build that two judges crater.
- **Did agreement require keeping everything? NO — and this is the crux.** The corpus is **monotonic** (every
  applied move but M5 is glance-KEEP), so an all-KEEP rule scores 5/5 by rubber-stamping. The reject battery
  is what discriminates: `trimmedMean` rejects the spike (`[40,40,40]→[0,0,48]`, −16), the flat regression
  (−6), and the M5-style sideways frame (−4). It is **not** an all-keep rule.
- **Did the candidates trade? YES — exactly as the ticket predicted, and the trade names the loser.** `max`
  ties `trimmedMean` at 5/5 on the corpus **but rubber-stamps the spike** (one euphoric 48 vote lifts max
  +8 → KEEP a build two judges hate). The monotonic corpus gave `max` a *false* pass; the reject battery
  caught it. `max` is **disqualified.**
- **Judge-gradient redirect? NO.** A passing candidate beat the rule without rubber-stamping, so the gap was
  the *rule* (the median's discard of a minority read), not the scorer's gradient. **Not redirected** — the
  rule class had headroom the median did not use. (Had every candidate needed to rubber-stamp, this would be
  recorded as the judge-gradient redirect and handed to S-214; it is not.)

## The contest (margin 4)

| candidate | agreement | reject battery | min keep-slack | outcome |
|---|---|---|---|---|
| **median** (current) | 3/5 = 60% | PASS (3/3) | n/a | the baseline it must beat |
| **max** | 5/5 = 100% | **FAIL (2/3)** | 36 | **rubber-stamps the spike → disqualified** |
| **mean** | 5/5 = 100% | PASS (3/3) | 6.7 | passes; less robust (see M2) |
| **trimmedMean** | 5/5 = 100% | PASS (3/3) | **16** | **WINNER** |

`min keep-slack` = the smallest `(delta − margin)` over the corpus's per-move KEEP decisions (M4, the only
per-move detail keep) — how far the keep clears the bar. Larger = less knife-edge.

### A note on the median baseline: 60% here vs 40% in S-212
S-212 led with **2/5 = 40%**, computed on the **recorded stale closure** for M6 (the pre-T-209 false reopen
that rejected the compound). This contest uses the **T-209-corrected** closure — the rule's *true* current
behavior — under which M6-at-floor KEEPS (compound +20 off the floor), so the median baseline is **3/5 = 60%**.
Both are correct readings of the same rule; 60% is the honest bar the candidates must clear post-T-209. Either
way `trimmedMean` reaches **100%**.

## Per-move: where the candidates diverge from the median

| move | scores | glance | median | trimmedMean | the fix |
|---|---|---|---|---|---|
| M1 close_shell (form) | [0,0,0] | keep | KEEP ✓ | KEEP ✓ | closure form-credit (aggregator-invariant) |
| **M2** apply_gable_roof (batch@floor) | [0,12,0] | keep | **ROLL ✗** | **KEEP ✓ (+6)** | median compound 0 discards the 12 |
| M3 construct_walls (form) | [8,8,8] | keep | KEEP ✓ | KEEP ✓ | improved +8 (aggregator-invariant) |
| **M4** rebuild_arch (per-move) | [8,0,48] | keep | **ROLL ✗** | **KEEP ✓ (+20)** | **THE HEADLINE** — median 8 discards the 48 |
| M5 frame_arch (per-move) | [8,0,0] | *excluded* | roll | roll | both roll (not a rubber-stamp) |
| M6 batch (compound@floor) | [20,20,0] | keep | KEEP ✓ | KEEP ✓ | both keep under corrected closure |

The median's two disagreements (M2, M4) are the **same defect**: a deterministic central operator throws away
a strong-minority read. `trimmedMean` keeps both — M4 by **+20** (vs `mean` +11, `max` +40) and M2 by **+6**.

## Why trimmedMean over mean (the robustness tiebreak)

Both pass at 5/5. `trimmedMean` wins on robustness:
- **M4 (per-move):** trimmedMean clears the margin by **+16 slack** vs mean's **+6.7** — a wider, safer keep.
- **The per-move M2 knife-edge:** on the corpus M2 is a *batch* move (batchMargin 1, so mean's +4 is fine
  there). But if a gable is ever picked **per-move** off the floor (margin 4), `mean([0,12,0]) = 4.0` lands
  **exactly on the margin** — one judge scoring 11 instead of 12 flips it to ROLL. `trimmedMean([0,12,0]) = 6`
  clears it robustly. trimmedMean degrades gracefully where mean is brittle.
- **Same reject behavior:** both reject all 3 worse builds; trimmedMean rejects the spike by −16, mean by −24
  (both safely negative). No reject-side cost to choosing the more robust keep.

`trimmedMean` is the ticket's "upper quantile" candidate, made robust: it rescues a lone-judge read (drops the
single most-pessimistic vote) **without** `max`'s lone-spike rubber-stamp (two craters still drag the mean of
the remaining votes down).

## Batch-while-improving (the second required candidate) — honest scope

Implemented (`batchEligible({mode:"improving"})`, pure, default-OFF) and falsified (unit test **CG-BWI3**:
off the floor with the full margin, a +2 compound is REJECTED, a +12 KEPT — no off-floor rubber-stamp). But
**on this corpus it changes no verdict**: the only compound (M6) is *at* the floor, where floor-mode already
batches. Its value is the **off-floor compound the corpus cannot isolate** — which manifests as M4-style
per-move rolls, and **the aggregator already rescues those**. So it is a **complementary entry-symmetry
change**, carried to S-214, **not** credited as an independent corpus win. (Reporting this plainly rather than
manufacturing a second win the bar can't show is the anti-hedge requirement.)

## The pick, and the handoff to S-214

**Winner: `trimmedMean` aggregator, carried with `batch-while-improving`.** Both are wired into the metered
runner behind opt-in, default-OFF env knobs (prior climbs re-run byte-identically):

- `CLIMB_AGGREGATOR=trimmedMean` — replaces the median in `scoreBuild` (per-move AND batch paths).
- `CLIMB_BATCH_MODE=improving` — lets detail compound off the floor; off-floor compounds judged at the full
  margin (4), not the floor-escape margin (1).

S-214 re-climbs the gatehouse with `CLIMB_AGGREGATOR=trimmedMean CLIMB_BATCH_MODE=improving` and renders the
result against the concept: either the architecture **finishes to M1** (the arch survives, the compound
reads → generalization opens) OR it names the next ceiling. The rule class is **not** exhausted — the median
was leaving a 40-point minority read on the floor on every detail move.

## Honest limitations

1. **One subject, monotonic corpus.** The bar is a gatehouse bar with no glance-ROLL move except M5 — so the
   reject battery (synthetic, off-corpus) carries the no-rubber-stamp weight. A richer corpus with genuine
   glance-ROLL moves would test the *keep* side harder; named for E-56.
2. **trimmedMean is tuned for n=3 votes.** "Drop the single lowest" is calibrated to the 3-vote draw; at
   different `VOTES` it generalizes to "drop the lowest, mean the rest" but the robustness margins shift.
3. **The winner is proven offline, not in a metered climb.** S-214 owns the live re-climb; this contest
   proves the *decision* is right on the recorded inputs, exactly as S-212 proved the disagreement.
