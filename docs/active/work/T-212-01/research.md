# T-212-01 — Research: the rankable bar and the current accept-rule

**Epic E-55 / Story S-212.** Map what exists for building a quality-varied, human-rankable climb-state
corpus and replaying it through the *current* accept-rule. Descriptive only — no solution here.

## 1. What the ticket needs (restated from the source)

Two instruments, both cheap (no metered spend, no GL):

1. **A rankable corpus** — climb-state builds spanning a real quality range, each with a recorded
   *human glance-rank*. The states already exist on disk (T-208/T-211 trajectories + beside renders).
2. **A replay harness** — runs each state through the current accept-rule (per-move median +
   floor-only batch) and reports *keep/rollback vs the glance rank* (the `8/0/48`-arch case quantified).

The output is **the bar S-213 candidates are judged against**, so it must be specified crisply.

## 2. The on-disk climb states (the corpus material)

The trajectory JSONs record, per round: the *before* `evidence` bundle, the applied `pick.tool`, the
gate decision (`accepted`, `gate.reason`), the *after* `scoreAfter.{score, scores}` (median + the three
per-vote scores), per-department major/item counts before/after, `targetDepartments`, and `closure`/
`closureAfter`. The beside renders give the glance subject.

**T-211 trajectory** (current code: T-209 relief-tolerant closure + T-210 centered gate present):

| round | tool | per-vote scores | median | decision | render |
|---|---|---|---|---|---|
| 0 | (seed) | [0,0,0] | 0 | — | `beside-first.png` (open colonnade) |
| 1 | close_shell | [0,0,0] | 0 | KEPT (form-credit, closure 0.667→1.000) | — |
| 2 | apply_gable_roof | [0,12,0] | 0 | ROLLED BACK ("compound tie at floor") | — |
| 3 | construct_walls | [8,8,8] | 8 | KEPT (+8) | `beside-kept.png` (dark dressed walls, quoins, stepped cap) |
| 4 | rebuild_arch | [8,0,48] | 8 | ROLLED BACK ("tie (0): no shrink") | `beside-arch-rolledback.png` (dark walls + centered arch) |
| 5 | frame_arch | [8,0,0] | 8 | ROLLED BACK ("regressed -8") | — |

**T-208 trajectory** (batch escape ON; ran *before* the T-209 closure fix):

| round | tool(s) | per-vote scores | median | decision | render |
|---|---|---|---|---|---|
| 0 | (seed) | [0,0,0] | 0 | — | `beside-first.png` (open colonnade, same seed) |
| 1 | close_shell | [0,0,8] | 0 | KEPT (form-credit, closure 0.608→1.000) | — |
| 2 | BATCH [apply_gable_roof + rebuild_arch + relief_walls] | [20,20,0] | 20 | ROLLED BACK ("batch reopened the form 1.000→0.068") | `beside-batch-rollback.png` (**pale** dressed walls, quoins, **brown gable roof**) |

The T-208 `beside-batch-rollback.png` is the **+dressed compound** — pale stone + quoins + a real gabled
roof — the single most concept-like build the climb has ever produced (median 20). It was rejected by the
**old** form-integrity guard because the pre-T-209 `eaveRingClosure` read the relief as a reopened shell
(1.000→0.068). [[wall-construct-needs-dense-shell]] / [[generate-first-wall-watertightness]] context;
T-209 ([[e48-e49-build-climb]]) later made closure relief-tolerant so this collapse no longer fires.

## 3. The concept target (what the glance ranks against)

`runs/015-…gatehouse…/concept.png`: a compact gatehouse — **pale coursed dressed-stone** walls, **rubble
quoins** at the corners, a **dark steep peaked gable roof**, a **centered dark-timber arched gateway**, and
**slit windows** on the eave walls. Five reads; mass-level ones (pale stone field, the roof, the centered
arch) dominate the glance over the minor banding/slits.

## 4. The current accept-rule (`src/workshop/climb-gate.mjs`) — what it actually does

Pure module, unit-tested, no GL/LLM/IO. The runner (`experiments/eval-alignment/picture-climb.mjs`) wires
it. Two accept paths:

- **`acceptsRound(before, after, opts)`** — the *per-move* gate. `before.score`/`after.score` are the
  **median** of the three DiagnoseBuild votes (`median = xs.sort()[floor(n/2)]`, line 96 of the runner).
  Decision ladder: form-move→closure-only; `delta ≥ margin(4)`→keep; department-dominant override;
  form-credit; `delta ≤ -margin`→reject; else **tie zone** broken only by whole-build coverage shrink
  (fewer wrong-style depts OR fewer majors), else **rollback**.
- **`acceptsBatch(before, after, opts)`** — the *cold-start* escape (T-208). Engaged **only** by
  `coldStartFloor({score, closure})` = `score ≤ scoreFloor(0)` **and** `closure ≥ 0.9`. Stacks N detail
  moves un-credited, judges the COMPOUND median once. Guards: form-integrity (no reopen), `delta<0`
  reject, new-major reject, `delta ≥ batchMargin(1)`→keep, dept-dominant→keep, else reject.

**The two structural properties the ticket targets:**

- **The median discards a strong minority.** `median([8,0,48]) = 8` — the 48 (one judge seeing the
  centered arch land) is thrown away. `median([0,12,0]) = 0` — the gable's 12 likewise. Verified live
  (§harness). Deterministic: same votes → same discard, every replay.
- **The batch escape is floor-scoped.** `coldStartFloor` is false the instant any move credits off 0.
  In T-211, `construct_walls` credited **+8** (round 3) → off the floor → the escape went inert → the
  centered arch (round 4) fell to the per-move median gate → rolled back. The exact mechanism the
  T-211 review ([[e48-e49-build-climb]]) named at full strength.

## 5. How the runner builds the evidence bundles (shapes the replay must match)

`picture-climb.mjs:524` `scoreBuild` → `{...critiqueEvidence(critique), score, items, scores, …}`. `evOf`
(`:563`) projects the *before* bundle: `{score, nItems, nMajor, nWrongStyle, wrongStyleBreadth,
departments, missing}`. Gate call sites: `acceptsRound(prev, candScore, {margin, targetDepartments,
beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems, closureBefore, closureAfter,
isFormMove: closureDecidedMove(tool)})` (`:878`); `acceptsBatch(prev, compound, {…same…})` (`:812`).

**What the trajectory JSON preserves for replay (per round):** `score` (before median), `evidence`
(before bundle: nMajor, wrongStyleBreadth, …), `scoreAfter.{score, scores}` (after median + per-vote),
`deptMajorsBefore/After`, `deptItemsBefore/After`, `targetDepartments`, `closure`, `closureAfter`. This
is **exactly** the input `acceptsRound`/`acceptsBatch` consume — so a replay can re-run the *real* rule on
recorded inputs with no re-render and no re-judge. The one gap: the *after* bundle's `nMajor`/
`wrongStyleBreadth` aren't stored as a bundle, but `nMajor`-after is recoverable as `sum(deptMajorsAfter)`
and `wrongStyleBreadth` carries forward (the dark roof/wall wrong-style reads are unchanged by an added
arch). Each round also records `gate.accept` — the rule's *actual* run-time decision — so the replay can
**assert its recomputed decision == the recorded one** (reproducibility check).

## 6. Boundaries, assumptions, constraints

- **Frozen instrument untouched.** The glance-rank validates the *creation-loop accept-rule*, never the
  frozen `DiagnoseBuild` scorer. No `measurements/` or `bakeoff-score.mjs` change. [[milestone-ladder]].
- **Zero metered spend.** Replay is over *recorded* votes; the glance-rank is a human (here: a
  vision-read of the on-disk renders, flagged for human confirmation). No `claude -p`, no GL.
- **`npm test` green by construction** — add no source under `src/`; the harness lives beside
  `picture-climb.mjs` in `experiments/eval-alignment/` (out of the suite, like the metered runner).
- **Cross-trajectory caveat.** S5 (the +dressed compound) is from the T-208 run; S0/S3/S4 from T-211.
  Same seed/program/pack/concept, so the renders are comparable, but two of six states (S1 closed box,
  S2 +gable) have **no standalone render** — their glance position is inferred from the trajectory, not
  seen. Name this in the corpus; the rankable *core* is the four rendered states.
- **Stale-closure caveat.** S5's recorded `closureAfter=0.068` predates T-209; under current code the
  closure would stay ≥0.9 (T-211 confirmed it holds through dressing). The replay must report S5 both
  ways and not present the stale reject as the current rule's true behavior.
