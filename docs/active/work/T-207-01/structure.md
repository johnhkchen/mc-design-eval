# T-207-01 Structure — files & artifacts (no source change)

This is a run-and-judge ticket. **No file under `src/`, `experiments/`, `packs/`, `benchmarks/`, or
`measurements/` is created, modified, or deleted.** The runner (`picture-climb.mjs`) is already committed by
T-206-01 with the footprint metric threaded. The only artifacts produced are evidence + RDSPI docs under
`docs/active/work/T-207-01/`.

## Files produced (all under `docs/active/work/T-207-01/`)

| File | Origin | Purpose |
|---|---|---|
| `research.md` | written | codebase map (done) |
| `design.md` | written | run config + judgment protocol (done) |
| `structure.md` | this file | the artifact blueprint |
| `plan.md` | written next | ordered run + judge steps |
| `trajectory.json` | **runner output** (`CLIMB_OUT`) | the machine-readable climb record (schema `picture-climb/v1`) |
| `climb.log` | **runner stderr** (redirected) | round-by-round picks, gate reasons, close_shell/relief/arch logs |
| `beside-first.png` | copied post-run | seed glance beside concept (`round-0/beside-concept.png`) |
| `beside-best.png` | copied post-run | the highest-scoring kept round's glance |
| `beside-final.png` | copied post-run | the final kept build's glance |
| `progress.md` | written during Implement | run log + deviations |
| `review.md` | written last | the handoff verdict |

The runner *also* writes (not tracked as ticket deliverables, left in place): per-round views + beside sheets
under `builds/gatehouse/picture-climb/round-*/` (the `builds/` tree is the draft area, not the frozen
instrument).

## Invocation contract (exact)

Working dir = repo root. Subscription shim only (no `ANTHROPIC_API_KEY`).

```
# 1. Pre-flight — zero spend, proves GL + render seam in this environment
GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs

# 2. The metered climb — 8-round budget, output to this ticket's work dir
CLIMB_MAX_ROUNDS=8 \
CLIMB_OUT=docs/active/work/T-207-01/trajectory.json \
  node experiments/eval-alignment/picture-climb.mjs 2> docs/active/work/T-207-01/climb.log

# 3. Copy the glance renders into the work dir (first / best / final)
#    first  = builds/gatehouse/picture-climb/round-0/beside-concept.png
#    best   = the round-N with the max kept score (read from trajectory.json)
#    final  = the last kept round's beside-concept.png
```

The metered run may take ~20–40 min (8 rounds × up to ~4 candidate scorings × 3 strong votes, each ≤180 s).
Run it in the **background** and poll; the T-198 guard prevents a hang.

## The data contract read for the verdict (`trajectory.json`, schema `picture-climb/v1`)

Top level (written at lines 808–818 of the runner):
- `closureFirst` — the seed's footprint closure (expect ≈ 0.608, OPEN).
- `closureLast` — the kept build's closure after the climb (expect ≥ 0.9 if the shell closed and stayed).
- `formReadyClosure` — 0.9 (the gate threshold).
- `stopReason` — `maxRounds` | `agent-done` | `round cap` | `stalled (…)` | `round-aborted-…`.
- `observedScoreSpread.allRoundVotes` — every per-round vote (the variance check, branch 3).
- `votesTimedOut` — degraded-but-survived count (health of the metered diagnose).
- `framingResidual` — the wider-eyes orientation/scale gap on the kept build (→ E-49).
- `inventory.verdict` — `{ climbed, stalled, oscillated, delta, actionableFrac }`.
- `inventory.actedOn` / `inventory.eyesOnly` — departments acted-on vs named-without-a-lever.

Per `trajectory[]` entry:
- `round`, `score` (the build score *before* the round), `pick {tool, reason}`, `accepted`, `gate {accept,
  reason, …}`, `scoreAfter {score, scores}`, `closure`, `closureAfter`.
- `deptMajorsBefore`/`deptMajorsAfter`, `deptItemsBefore`/`deptItemsAfter` — the major-cleared check (B3).
- `blocked` (form-before-detail block) / `noop` (no-op guard) flags.
- `framing` — the per-round wider-eyes flags.

## The judgment is read, not written into source

No assertion file, no new test. The T-206 fix is already unit-tested (WG-CS10–14); this ticket's evidence is
the *live run* of that fix. The verdict (review.md) cites every claim to a `trajectory.json` field or a named
glance render — the same discipline as the T-205 review.

## Ordering that matters

1. GUARD_ONLY pre-flight **before** the metered run (catch a GL-absent environment with zero spend).
2. The metered run **before** copying renders (the renders are its output).
3. Read `trajectory.json` **before** judging (cite fields, do not infer from the log alone).
4. `npm test` + `git status measurements/` **after** the run (prove nothing leaked, instrument untouched).
5. progress.md during, review.md last.
