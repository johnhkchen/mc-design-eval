# T-211-01 — Plan: ordered steps to run, capture, and judge the capstone climb

**Epic E-54 / Story S-211.** Each step is independently verifiable. The run is metered and slow, so it is
launched in the background and polled. The verdict steps consume the run's artifacts. No source change is
planned; any defect the run surfaces is recorded as a finding (stop-line), not patched here.

## Step 0 — pre-flight (verify the run will be valid)

- `git status --short measurements/ src/ experiments/` → empty (clean tree; baseline for the frozen-instrument
  invariant).
- Confirm `ANTHROPIC_API_KEY` unset (subscription shim — done in research; re-confirm at launch).
- `npm test` → 2438/2438 green (baseline; the run changes no source, so this is the close-out value too).
- Confirm the seed/program/concept assets exist (`benchmarks/sculpture/...gatehouse...`).
- **Verify:** all empty/green/present. **Commit:** none (read-only).

## Step 1 — launch the metered climb (batch on)

```
CLIMB_MAX_ROUNDS=8 CLIMB_BATCH_SIZE=4 \
  CLIMB_OUT=docs/active/work/T-211-01/trajectory.json \
  node experiments/eval-alignment/picture-climb.mjs \
  2> docs/active/work/T-211-01/climb.log
```

- Run in the **background** (wall-clock is minutes: ≤8 rounds × 3 votes strong-tier diagnose + agent picks).
- The T-198 guard bounds each diagnose child; an all-votes-failed round aborts cleanly with a valid trajectory.
- **Verify:** process exits (0 = clean; non-zero = T-198 abort, still valid). `trajectory.json` + `climb.log`
  present and non-empty.
- **Commit:** `trajectory.json` + `climb.log` once the run completes (Step 4 bundles all evidence).

## Step 2 — read the trajectory facts

From `trajectory.json` + `climb.log`:

- Per-round trend (the score sequence) and `stopReason`, `climbed`.
- Was a **batch KEPT**? Its composition (`batch.picks`) — does it include relief + centered arch + roof?
- `closure` / `closureAfter` per kept round and `closureLast` — did the form **stay closed (≥0.9)**?
- Did the build **leave 0**? The plateau score. `votesTimedOut` (judge health).
- Autonomy: any manual intervention (expected none — fully autonomous run).
- **Verify:** the facts are extracted and unambiguous. **Commit:** none yet (folded into progress.md).

## Step 3 — capture the glance evidence

- Copy `builds/gatehouse/picture-climb/round-0/beside-concept.png` → `beside-first.png`.
- Identify the **kept-batch round** from the trajectory; copy its `beside-concept.png` → `beside-kept.png`.
- Copy the **final round's** `beside-concept.png` → `beside-final.png`.
- View `beside-kept.png` against the concept and form the glance read: M1 (closed dressed walls + centered arch
  + dark gabled roof + right proportion) or the precise residual.
- **Verify:** three sheets present (or noted if first==final); the glance read is written. **Commit:** with
  Step 4.

## Step 4 — write progress.md + commit the run evidence

- `progress.md`: the trajectory facts (Step 2), the glance read (Step 3), any deviation from this plan, and the
  metered cost. Honest, anti-hedge (lead with how it failed if it did).
- Re-check the frozen-instrument invariant: `git status --short measurements/` empty;
  `git diff --stat src/ experiments/` empty.
- **Commit:** `docs(T-211-01): metered re-climb evidence — trajectory + log + beside renders` (trajectory.json,
  climb.log, beside-*.png, progress.md, the RDSPI artifacts).

## Step 5 — reproducibility gate (conditional second run)

Per Design decision 3:

- **If the kept build clearly misses the glance** (obvious residual): the verdict is complete. **Skip** a second
  run (re-rolling to chase a number is the hedge the stop-line forbids). Proceed to Review.
- **If the kept build lands or is near the M1 line:** launch a **second confirming run** (same params,
  `*-run2` artifacts). If the verdict flips (M1 ↔ near-miss), the honest output is "the judge can't certify M1"
  → the stop-line fires. If it holds, M1 is certified-reproducible.
- **Verify:** the gate decision is recorded with its rationale. **Commit:** second-run artifacts if produced.

## Step 6 — Review: the verdict + the explicit stop-line invocation

- `review.md`: what changed (artifacts only — no source), test coverage (the run is evidence, not a unit test;
  `npm test` green unchanged; the AC falsifications are unit-tested upstream in T-208/T-209), and the open
  concerns.
- The verdict, ordered: trajectory facts → glance → **stop-line invoked explicitly** (win or lose, last
  gatehouse fix-and-climb; if not M1, next epic = the step-back, named not buried).
- Record autonomy + metered cost.
- **Verify:** review.md is a complete handoff; AC items each addressed. **Commit:** `docs(T-211-01): review —
  capstone verdict + stop-line`.

## Testing strategy

- **No new unit tests** — this ticket adds no source. The decision logic it exercises (`acceptsBatch`
  form-integrity guard, `eaveRingClosure` relief tolerance, `centerOnFace`) is already unit-tested in
  `climb-gate.test.mjs` / `wall-generate.test.mjs` / `aperture-carve.test.mjs` (T-208/T-209/T-210).
- **`npm test` green** is the close-out invariant (2438/2438, unchanged).
- **The metered run is the integration evidence** — reproducible by replay (the trajectory + renders), not in
  the suite (metered, per repo convention for T-201/T-205/T-207).

## Rollback

- The run writes only drafts (`builds/`) and the work dir — nothing to roll back in source.
- If a defect is surfaced, it is recorded as a finding; no source patch is made under this ticket, so there is
  no risky change to revert.

## Definition of done (maps to AC)

- [ ] Metered climb re-run (T-209 + T-210 + batch on); trajectory + log + first/kept/final beside renders saved.
- [ ] Trajectory verdict: kept-batch composition, stayed-closed, left-0, plateau, round-by-round picks.
- [ ] Human-glance verdict vs concept: M1 or the precise residual at full strength.
- [ ] Stop-line invoked explicitly; if not M1, next epic named as the step-back. Autonomy + cost recorded.
- [ ] `npm test` green; `measurements/` untouched; subscription shim only.
