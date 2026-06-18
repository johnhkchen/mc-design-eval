# T-205-01 — Research: the M1 capstone re-climb

Descriptive map of what the run touches. This is a **run-and-judge** ticket (E-52 / S-205): re-run the
metered gatehouse climb now that the three E-52 geometry fixes (T-202, T-203, T-204) are committed, and judge
the result on the glance. No new hand. The precedent is T-201 (the E-49 capstone) — same runner, same subject,
older gate.

## The runner — `experiments/eval-alignment/picture-climb.mjs` (826 lines)

The single entry point. Not in `npm test` (metered; spends the subscription via `claude -p`). Key constants:

- `SUBJECT = "gatehouse"`, `PROGRAM_PATH = benchmarks/sculpture/recognition/gatehouse.program.json` (present),
  `CONCEPT = …/runs/015-…-arched-gate/concept.png` (present, 412 KB).
- `TIER = "strong"` (`claude-opus-4-8`), `VOTES = 3` (median out the 0–76 same-seed score swing).
- `AGENT_MODEL = "claude-sonnet-4-6"` (the pick agent).
- `const { margin, stallK, maxRounds, minRounds } = CLIMB_DEFAULTS` (line 78) —
  `CLIMB_DEFAULTS = {margin:4, stallK:2, maxRounds:5, minRounds:3}` (frozen in `climb-gate.mjs:23`).
- Env seams: `GUARD_ONLY=1` (wiring + render seam, zero spend), `ROOF_MATERIAL_PROBE=1` (T-204 roof glance,
  zero spend), `REBUILD_ARCH_PROBE=1` (T-203 wide-arch glance + gate numbers, zero spend), `CLIMB_OUT=<path>`
  (trajectory destination). **There is no round-budget env override** (confirmed by grep).

### Climb loop (lines 690–793)
- Round 0: `scoreBuild(seed)`, agent picks, recorded with `closure`.
- Rounds 1..maxRounds: `formReadyGate` blocks DETAIL tools until `closure ≥ FORM_READY_CLOSURE` (T-197); a
  no-op guard rolls back byte-identical re-picks (T-190); `acceptsRound` decides keep/rollback with the
  department-dominant override (T-191), form-credit (T-199), and form-move routing (T-200). A kept
  `rebuild_arch` promotes its aperture columns into `openColumns` for closure-except-aperture (T-203, line 773).
- `closureAfter` for the gate is `eaveRingClosure(cand, { floor, eaveY, openCols })` (line 764) — **this is the
  T-202 fix's consumer**: `eaveRingClosure` now clamps proud band columns via `robustExtent`/`PROUD_TRIM` so
  relief no longer craters it.
- Terminal entry carries the final kept score; `classifyInventory` produces the `{climbed, stalled, oscillated,
  actionableFrac, delta}` verdict; output schema `picture-climb/v1` written to `CLIMB_OUT`.

### Output (lines 801–813)
`trajectory.json`: `{schema, subject, seed, program, pack:"rustic", concept, tier, votes, margin, stopReason,
observedScoreSpread, framingResidual, formReadyClosure, closureFirst, closureLast, subprocessTimeoutMs,
votesTimedOut, trajectory[], inventory}`. Per-round beside renders under `builds/gatehouse/picture-climb/`.

## The three E-52 fixes now in the tree (the thing under test)

1. **T-202 — form metric invariant to proud detail** (`src/view/wall-generate.mjs`, commit `47b7688`).
   `eaveRingClosure` clamps band columns to `robustExtent(cols, {pLo:PROUD_TRIM, pHi:1−PROUD_TRIM})`,
   `PROUD_TRIM=0.05`, before `closureOf(perimeterColumns(footprint))`. Probe: relief-on-closed reads **0.9375**
   (was 0.111 naive / 0.068 live in T-201) → `formReadyGate` returns `allow:true` for detail post-relief. The
   fix that should stop the oscillation T-201 named (detail → "re-opened" → close_shell no-op → detail).

2. **T-203 — wide arched gate by rebuild** (5 commits, `bee5955`..`1fddbf1`). `rebuild_arch` hand registered
   (OPENING / detail), wired into the runner; `archedVoidCoherence` credits the arch spandrels the old
   `carve_arch` coherence check refuted; closure-except-aperture via `eaveRingClosure` `openCols`.
   `REBUILD_ARCH_PROBE` (zero spend) shows: `width=7 carved=351 framed arched voussoir=7 (curved head)`, gate
   `ok=true`, closure-except-aperture stays **1.000**. The arch reads on the beside glance.

3. **T-204 — roof slate + pitch** (3 commits, ends `bb2ccef`). `recolor_roof` → `deepslate_tiles` (value-true,
   census 2106/2106 cells slate); `gableRidgeForRatio` pitch lever wired into both roof hands, targeting
   `targetRatiosOf(program).ridgeToEave (~1.35)`. Probe: lever fires (ratio 1.63→1.32 via pitch 0.5); honest
   gabled build reads **ridgeToEave 1.25, flagged:false**, post-relief **1.32, flagged:false** (vs T-201's
   pitch-1 path: 1.55 → **1.6316 flagged major**).

## T-201 precedent — what the older gate produced (the bar to beat)

`trend 0→0→0→12→12→32→32 (Δ+32)`, `stopReason: round cap`, `votesTimedOut:0`, `oscillated:true`,
`actionableFrac:0.6`. Autonomous picks: `close_shell → apply_gable_roof → carve_arch(rolled back) →
relief_walls → close_shell(no-op) → recolor_roof(never ran)`. Glance: closed dressed-stone gabled mass, relief
reads as construction; **but** no arched gate, brown (not slate) roof, too-steep pitch — and the form metric
**collapsed 1.000→0.068** under relief (the fifth gap → E-52). Cost: 5 scored rounds × 3 strong votes = 15
strong `DiagnoseBuild` calls + 6 sonnet picks.

## The structural constraint this run must reckon with

T-201 hit **`maxRounds=5`** and its terminal `recolor_roof` pick **never executed** — the cap cut the climb
before the roof could be recoloured. With T-203 adding `rebuild_arch`, the climb now needs **five productive
moves** to express every fix — `close_shell → apply_gable_roof → rebuild_arch → relief_walls → recolor_roof` —
with **zero** rollbacks to fit in 5 rounds. T-201 already burned a round on a `carve_arch` rollback. So at the
frozen `maxRounds=5`, the capstone is **structurally unable to test its own roof claim**: it would re-hit the
identical truncation regardless of whether the fixes work. There is no env knob for the round budget (grep
confirms). This is the central design question (→ design.md): give the climb room, or run-and-name-the-cap.

## Invariants / constraints (hard)

- **Frozen instrument** `benchmarks/sculpture/measurements/**` must stay byte-clean (currently clean).
- **Subscription shim only** — `runTieredOp → claude -p`; never `ANTHROPIC_API_KEY` / the metered API.
- **`npm test` green** before and after (2411/2411 at HEAD per T-203 progress).
- **No hang** — per-call `CLAUDE_SUBPROCESS_TIMEOUT_MS=180_000` guard (T-198); a timed-out vote is dropped, an
  all-votes-timed-out round writes an abort record and exits clean.
- GL must be available for renders (T-201 confirmed it is in this environment; verify via GUARD_ONLY).
