# T-211-01 — Structure: artifacts, files touched, and boundaries

**Epic E-54 / Story S-211.** This is a run-and-judge ticket. The "structure" is not new code — it is the set of
**artifacts the run produces** and the **boundary discipline** that keeps the instrument frozen. No source
module is created or modified (the fixes are landed in T-209/T-210). Below: exactly what is written, where, and
the invariants that gate the close.

## Files — created (all under `docs/active/work/T-211-01/`)

| Path | Producer | Content |
|---|---|---|
| `research.md` | this phase set | (done) the map |
| `design.md` | this phase set | (done) run params + verdict procedure + stop-line discipline |
| `structure.md` | this file | the artifact blueprint + boundaries |
| `plan.md` | next | ordered run + capture + judge steps |
| `progress.md` | Implement | run results, trajectory facts, glance verdict, deviations |
| `review.md` | Review | the handoff verdict + the explicit stop-line invocation |
| `trajectory.json` | the runner (`CLIMB_OUT`) | per-round picks, scores, closure, batch composition, final record |
| `climb.log` | the runner (`2>`) | the human-readable round-by-round log incl. the T-198 guard summary |
| `beside-first.png` | copied from `builds/.../round-0/` | the seed colonnade baseline |
| `beside-kept.png` | copied from the kept-batch round | the build the glance judges |
| `beside-final.png` | copied from the last round | the plateau |

If a second confirming run is warranted (Design decision 3), its artifacts get a `-run2` suffix
(`trajectory-run2.json`, `climb-run2.log`) — mirroring T-208's `*-reclimb1.*` convention.

## Files — modified

**None expected.** The capstone runs the existing runner against landed source. The only modification that would
occur is if the run surfaces a defect that the stop-line classifies as a *finding* (→ S-209 or T-210), not a
fix-in-this-ticket. Source modules (`picture-climb.mjs`, `wall-generate.mjs`, `aperture-carve.mjs`,
`climb-gate.mjs`) are read-only for this ticket.

## Files — deleted

None.

## The run command (the central "interface" of this ticket)

```
CLIMB_MAX_ROUNDS=8 CLIMB_BATCH_SIZE=4 \
  CLIMB_OUT=docs/active/work/T-211-01/trajectory.json \
  node experiments/eval-alignment/picture-climb.mjs \
  2> docs/active/work/T-211-01/climb.log
```

- Run **in the background** (metered, multi-round, multi-vote — wall-clock is minutes) under the T-198 guard.
- Pre-flight asserted by the runner itself: GL available, assets present, `ANTHROPIC_API_KEY` unset.
- Exit code: 0 on a clean finish; non-zero on an all-votes-failed abort (T-198) — both leave a valid trajectory.

## Boundaries (the invariants that gate the close)

1. **Frozen instrument.** `git status --short measurements/` must be empty before and after. The run writes only
   `builds/gatehouse/picture-climb/**` (regenerable drafts) and the work dir. The frozen judge
   (`DiagnoseBuild`, `styleFidelityScore`) is read, never written.
2. **Subscription shim only.** `ANTHROPIC_API_KEY` unset for the whole run. The runner routes through the
   `claude -p` headless shim (`src/sdk-binding.mjs` seam). Never the metered API.
3. **Source untouched.** `git diff --stat src/ experiments/` empty at close (no source edit this ticket).
4. **`npm test` green.** 2438/2438 (unchanged from T-209 — this ticket adds no test and no source change).
5. **Comparison runs unperturbed.** `CLIMB_BATCH_SIZE` is opt-in; the frozen comparison climbs
   (T-201/T-205/T-207) still re-run byte-identically with the knob unset. This run's params are explicit and
   do not change any default.

## The verdict structure (what `progress.md` → `review.md` must contain)

Ordered, anti-hedge (lead with how it fails):

1. **Trajectory facts** — kept batch? composition? stayed-closed (`closureAfter`/`closureLast` ≥ 0.9)? left 0?
   plateau? round-by-round picks. Autonomy (intervention count — expected 0). Metered cost (rounds, votes,
   wall-clock, `votesTimedOut`).
2. **Glance verdict** — kept build beside concept: **M1 landed** (the four glance criteria) **or** the precise
   residual at full strength.
3. **Stop-line invocation** — explicit, win or lose: this is the last gatehouse fix-and-climb. If not M1, the
   named next epic is the step-back (can the picture-climb finish any subject to M1), not a seventh gatehouse
   fix.

## Ordering that matters

- Pre-flight (clean tree, key unset, baseline `npm test`) **before** the run.
- The run **before** any verdict (the verdict reads the trajectory + renders the run produced).
- The glance **after** the trajectory facts (the trajectory tells you which round to render/judge).
- The stop-line invocation **last** — it consumes the glance verdict.
- `measurements/` clean-check **after** the run (the close-out invariant).
