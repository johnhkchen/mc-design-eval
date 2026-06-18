# T-201-01 — Structure: artifacts, not code

No source files are created, modified, or deleted. This is a run-and-judge ticket; the "structure" is the set
of **artifacts produced** and the **commands that produce them**, plus the one invariant on the existing tree.

## Files touched

### Created (all under `docs/active/work/T-201-01/`)
- `research.md`, `design.md`, `structure.md`, `plan.md` — RDSPI phase artifacts (this and the prior three).
- `trajectory.json` — the structured climb record (written by the runner via `CLIMB_OUT`).
- `climb.log` — full stderr capture of the metered run.
- `beside-first.png`, `beside-best.png`, `beside-final.png` — the glance evidence, copied from
  `builds/gatehouse/picture-climb/round-*/beside-concept.png`.
- `progress.md` — the Implement-phase running record (the run, deviations, the trajectory read).
- `review.md` — the Review-phase handoff (verdict, autonomy/cost, the glance call or named fifth gap).

### Modified
- **None in `src/` or `experiments/`.** The runner and both gate fixes are used **as-is**.

### Untouched (hard invariant — verified before and after)
- `measurements/` — the frozen instrument. `git status measurements/` must be clean throughout.
- `src/workshop/climb-gate.mjs`, `experiments/eval-alignment/picture-climb.mjs` — read, never edited.

## The production code under exercise (read-only map)

The run drives this already-built call chain (no edits, just confirming the boundary the run depends on):

```
picture-climb.mjs main()
  ├─ guard: assets present + assertGlAvailable()        [proven via GUARD_ONLY]
  ├─ scoreBuild(occ, …, round 0)                        seed score + framingReport (wider eyes)
  │    └─ diagnose() × VOTES  → runTieredOp(strong, timeoutMs)   [metered; subprocess-timeout guarded]
  ├─ agentPick(prev, history, closure)                  [claude-sonnet-4-6; parseFirstJsonObject; re-ask→done]
  └─ loop round=1..maxRounds:
       formReadyGate(pick, closure)                     detail LOCKED below FORM_READY_CLOSURE (no spend)
       buildDigest no-op guard                          identical build → rolled back, no spend
       scoreBuild(cand, round)                          metered
       acceptsRound(prev, cand, {                       ← THE FIX UNDER TEST
         closureBefore, closureAfter,                     (T-199 form-credit)
         isFormMove: closureDecidedMove(pick.tool) })     (T-200 form-move routing)
       stoppingDecision(...)                            convergence
```

The only behavioral seam this ticket *introduces* is the **environment**: `CLIMB_OUT` redirects the trajectory
into the work dir. Everything else is the committed runner.

## Command structure (the producing steps)

1. **Pre-flight (zero spend):** `GUARD_ONLY=1 CLIMB_OUT=… node …/picture-climb.mjs` — already run clean in
   research; re-confirm only if the tree changed.
2. **The metered run:** `CLIMB_OUT=docs/active/work/T-201-01/trajectory.json node …/picture-climb.mjs
   > docs/active/work/T-201-01/climb.log 2>&1`. Long-running (metered strong-tier subprocess per vote) → run in
   background, monitor for completion or an abort record.
3. **Collect renders:** copy `round-0/beside-concept.png` → `beside-first.png`; the highest-score round →
   `beside-best.png`; the final kept round → `beside-final.png`.
4. **Read the trajectory:** answer the Decision-3 rubric table from `trajectory.json` (the close_shell `gate`
   object is the decisive read).
5. **Inspect the glance:** open `beside-final.png`, judge vs concept (Decision 4).
6. **Verify invariants:** `npm test` green; `git status measurements/` clean.

## Ordering that matters

- GUARD_ONLY **before** any spend (done).
- The metered run **before** render collection / trajectory read (they consume its outputs).
- `npm test` + `measurements/` check can run any time (independent of the metered run) — do both at the end so
  the review reports the final tree state.

## Interfaces relied upon (no change, just the contract)

- `CLIMB_OUT` env → trajectory path (runner line 543).
- `trajectory.json` schema `picture-climb/v1`: per-round `{round, score, pick, applied, accepted, gate,
  closure, closureAfter, deptMajors*, framing, voteOutcomes}`; top-level `{stopReason, closureFirst,
  closureLast, votesTimedOut, inventory}` (or the `aborted`/`abort` block on an all-votes-failed round).
- Beside renders: `builds/gatehouse/picture-climb/round-N/beside-concept.png`.
