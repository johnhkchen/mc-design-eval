# T-214-01 — Structure: artifacts, not code

**Epic E-55 / Story S-214.** This is a run-and-judge ticket: **zero source files created/modified/deleted.**
The "structure" is the set of run artifacts and the boundary that no frozen/source file is touched.

## Files CREATED (all under `docs/active/work/T-214-01/`)

| Path | Producer | Content |
|---|---|---|
| `research.md` | this pass | (done) the map |
| `design.md` | this pass | (done) the run plan + verdict method |
| `structure.md` | this pass | this file |
| `plan.md` | this pass | the ordered run steps |
| `trajectory.json` | the runner (`CLIMB_OUT`) | `picture-climb/v1` — per-round scores arrays, gate decisions, closure, inventory, vote spread |
| `climb.log` | the runner (`2> climb.log`) | the human-readable per-round KEEP/ROLL stream |
| `verdict.md` | judge step | the glance verdict (M1 landed / ceiling named), trajectory read, reproducibility read, autonomy + metered cost |
| `progress.md` | implement | run log + deviations |
| `review.md` | review | handoff |
| `trajectory-2.json` | runner (conditional) | a second run, ONLY if the within-run spread is knife-edge (Design D3 tier 2) |

## Files the runner writes OUTSIDE the work dir (ephemeral renders — expected, not tracked as source)

- `builds/gatehouse/picture-climb/round-{0..8}/view-*.png` + `beside-concept.png` — the per-round renders the
  glance verdict reads (first = round-0, best/final per the trajectory's accepted high-water round).

## Files that MUST stay byte-unchanged (the boundary — verified post-run)

- `experiments/eval-alignment/picture-climb.mjs` — the runner. The knobs are env-vars; **no edit.**
- `src/workshop/climb-gate.mjs` and all of `src/**` — the rule is already wired (T-213). **No edit.**
- `measurements/**`, `benchmarks/**`, `src/baml/**` (the frozen DiagnoseBuild scorer) — **no edit.**
- No file added to `npm test`.

`git status --porcelain -- src measurements benchmarks experiments` must show **empty** after the run
(only `docs/active/work/T-214-01/**` and ephemeral `builds/**` change).

## Interfaces consumed (read-only, no change)

- `picture-climb.mjs` env contract: `CLIMB_AGGREGATOR`, `CLIMB_BATCH_MODE`, `CLIMB_BATCH_SIZE`,
  `CLIMB_MAX_ROUNDS`, `CLIMB_OUT`, `GUARD_ONLY`, `CLAUDE_TIMEOUT_MS`.
- `trajectory.json` schema `picture-climb/v1`: `trajectory[]` (each round: `score`, `pick`, `applied`,
  `accepted`, `gate{accept,delta,reason}`, `scoreAfter{score,scores}`, `closure`, `closureAfter`, `batch`,
  `voteOutcomes`), `inventory{actedOn,eyesOnly,verdict{climbed,delta,...}}`, `observedScoreSpread`,
  `closureFirst/Last`, `votesTimedOut`.

## Ordering that matters

1. RDSPI artifacts (research → design → structure → plan) — done before any spend.
2. `GUARD_ONLY=1` parse/render/GL check — zero spend — BEFORE the metered run.
3. The metered run (background) → `trajectory.json` + `climb.log`.
4. Read `trajectory.json` + the beside renders → `verdict.md`.
5. (conditional) second run if tier-1 variance read is ambiguous.
6. `npm test` + `git status` boundary check → `progress.md` → `review.md`.

## Verdict.md internal structure (the deliverable's shape)

1. **Headline:** M1 landed (→ generalization opens) OR architecture ceiling named (rule removed as confound).
2. **The trajectory read:** trend; did the dressing COMPOUND (gable + centered arch + roof kept together);
   is the KEPT build the high-water mark (not a rolled-back better build); the two T-211-discarded moves'
   new fate (the `(8,0,48)` arch + the `(0,12,0)` gable).
3. **The glance:** first / best / final beside the concept, vs the four M1 criteria, scored vs the concept.
4. **Reproducibility:** within-run vote spread on the load-bearing KEEPs (+ second run if it was needed).
5. **The two adversarial checks the ticket names:** did the winning rule REGRESS a frozen comparison run
   (it should not — default-OFF); is the verdict reproducible (variance read).
6. **Cost + autonomy:** rounds, scored builds, votes, dropped/timed-out votes, agent autonomy fraction.
7. **Reviewer decision** if the ceiling is named (different climb architecture / M1 by another route / E-56).
