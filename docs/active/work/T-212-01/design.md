# T-212-01 — Design: the corpus, the glance-rank, and the replay harness

**Epic E-55 / Story S-212.** Decide how to assemble the rankable corpus and the replay harness, grounded
in the Research. Three decisions: (A) what the corpus is and where it lives; (B) how the glance-rank is
recorded; (C) what the replay computes and how "agreement" is defined.

## Decision A — Corpus = the on-disk climb states, declared in one manifest

**Chosen:** a single committed JSON manifest (`corpus.json`) that *references* the existing trajectory
JSONs + beside renders — it does not copy builds. Each entry: a stable `id`, a human label, the source
`trajectory` + `round`, the `render` path (or `null`), the per-vote `scores`, `medianScore`, the
`evidence`/dept counts/closure needed to re-run the rule, and the recorded `glanceRank`.

- **Rejected — re-render every state fresh.** Needs GL + the build cells for intermediate states (S1/S2
  were rolled back, never re-rendered). Violates "zero/minimal spend" and "reuse on-disk builds".
- **Rejected — copy build artifacts into the work dir.** Redundant; the trajectory JSON already holds the
  exact rule inputs. A manifest of *references* keeps one source of truth and stays diff-light.

**The six states** (worst→best by quality, ids `S0`–`S5`):

| id | label | source | scores | render |
|---|---|---|---|---|
| S0 | seed open colonnade | T-211 r0 | [0,0,0] | `beside-first.png` |
| S1 | closed dark box | T-211 r1 (close_shell kept) | [0,0,0] | — (inferred) |
| S2 | dark box + gable | T-211 r2 (apply_gable_roof, rolled back) | [0,12,0] | — (inferred) |
| S3 | dark dressed walls + quoins (**KEPT high-water**) | T-211 r3 (construct_walls kept) | [8,8,8] | `beside-kept.png` |
| S4 | + centered arched gate (dark) | T-211 r4 (rebuild_arch, rolled back) | [8,0,48] | `beside-arch-rolledback.png` |
| S5 | + dressed compound: pale walls + quoins + gabled roof | T-208 r2 (batch, rolled back) | [20,20,0] | `beside-batch-rollback.png` |

The **rankable core** is the four *rendered* states {S0, S3, S4, S5}; S1/S2 are intermediate, scored but
unrendered — included for the replay (their decisions matter) and ranked from the trajectory, flagged
`renderless: true`.

## Decision B — Glance-rank recorded now from the renders, flagged for human confirmation

The ticket says the glance-rank is human. Running autonomously, I record the rank by **reading the
on-disk renders against the concept** (a vision glance — the same act a human reviewer performs) and mark
it `source: "agent-vision-glance, pending human confirmation"`. This is honest: it is a real glance over
the real renders, not a fabricated or score-derived order, and it is cheap to re-confirm.

**Recorded glance order (worst→best), against the concept** (pale dressed stone + dark peaked gable +
centered arched gate + quoins + slits):

`S0 (1) < S1 (2) < S2 (3) < S3 (4) < S4 (5) < S5 (6)`

Rationale, mass-reads first (the glance weights big forms over minor banding):
- **S0** open ribbed colonnade, roofless — nothing of the gatehouse reads. Worst.
- **S1** a featureless closed dark box — form reads, nothing else.
- **S2** box + a dark partial gable — a roof begins; still dark, no quoins, no gate.
- **S3** dark walls + light **quoins** + stepped cap — masonry articulation begins; no roof, no gate.
- **S4** S3 + a **centered arched gateway** — the single defining gatehouse feature now present (dark, roofless).
- **S5** **pale** dressed walls + quoins + a real **gabled roof** — two of the three dominant concept
  reads (pale stone + roof) plus quoins; the most building-like, most concept-like mass. Best.

**The one contestable adjacency: S4 vs S5.** S4 has a crisp centered arch but is dark and roofless; S5
has roof + pale stone (mass-level) but a weaker/ambiguous arch. I rank **S5 > S4**: at a glance a roofed
pale-stone mass reads as "the picture" more than a dark roofless box with a hole. Both sit far above S3.
Recorded as the only adjacency a human might flip — and it does **not** affect the headline finding
(both S4 and S5 are KEEP-worthy moves the current rule rolled back).

The corpus is **clearly rankable** → the ticket's STOP condition (states not separable, all near-D-,
[[workshop-progress-decoupled-from-quality]] recurring) **does not fire**. We proceed.

## Decision C — Replay re-runs the *real* rule; "agreement" = keep/rollback vs the glance

**Chosen:** the harness imports `acceptsRound`/`acceptsBatch`/`coldStartFloor` from
`src/workshop/climb-gate.mjs` (the *real* current rule, never a copy) and, for each applied transition,
reconstructs the before/after bundles from the recorded fields and recomputes the decision. It then
**asserts the recomputed decision == the recorded `gate.accept`** — proving the rule is deterministic over
recorded inputs (the "is the disagreement reproducible?" AC).

- **Rejected — read only the recorded `gate.accept`.** Sufficient for the agreement table, but proves
  nothing about reproducibility and gives S-213 no live rule to diff candidates against. Re-running the
  real functions is what makes this a *harness*, not a spreadsheet.
- **Rejected — re-implement the rule in the harness.** Forks the logic; a candidate spike (S-213) judged
  against a drifted copy is an unfair bar. Import the real module.

**Agreement definition (the metric S-213 inherits).** For each *applied* move (transition `before→after`):
- **glance verdict** = KEEP iff `glanceRank(afterState) > glanceRank(beforeState)` (the move made it look
  more like the concept), else ROLLBACK.
- **rule verdict** = the recomputed `accept` from the current rule.
- **agreement** = fraction of moves where the two match. Disagreements are listed explicitly (which move,
  glance vs rule, why).

The before/after *states* for each move are the corpus ids the runner's path visited (e.g. T-211 round 4
is S3→S4). For rolled-back moves the build returns to the before-state, but the *move's* glance verdict is
still "did this attempt improve the look?" — which is the question the accept-rule is supposed to answer.

**The headline quantified.** S3→S4 (`rebuild_arch`, votes `[8,0,48]`): glance KEEP (arch is the defining
feature); rule ROLLBACK (`median=8`, delta 0, tie-no-shrink → the 48 discarded). S1→S2 (`apply_gable_roof`,
votes `[0,12,0]`): glance KEEP; rule ROLLBACK (`median=0`, the 12 discarded). Both deterministic.

**The asymmetry, surfaced honestly.** S5 (the +20 compound) was recorded as rolled back by the *old*
form-integrity guard (stale `closure=0.068`, pre-T-209). The harness reports S5 **two ways**:
(1) with the recorded stale closure → batch rejects (the bug T-209 fixed); (2) with a T-209-corrected
closure (≥0.9, per the T-211 evidence that closure holds through dressing) → the batch rule **accepts**
(compound +20 off the floor) — *but only because S5 was reached at the score floor*. In T-211 the same
dressing was reached *off* the floor (after construct_walls' +8), where the batch escape is inert and the
per-move median governs. This is the floor-only-batch disagreement the ticket points S-213 at; T-212
**measures** it, does not fix it.

## What this design explicitly is NOT

- **Not** a candidate accept-rule (max/mean/quantile aggregator, batch-while-improving). That is S-213.
  T-212 may *illustrate* what a max-aggregator would decide on the recorded votes (one cheap line) to show
  the disagreement is addressable, clearly labelled "S-213 preview, not a deliverable".
- **Not** a frozen-instrument change. No `measurements/`, no `bakeoff-score.mjs`, no schema touch.
- **Not** a new metered run. Pure replay over committed data.
