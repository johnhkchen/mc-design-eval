# T-196-01 — STRUCTURE: files, interfaces, ordering

The shape of the code. New pure module + tests (in `npm test`), thin runner wiring (out of `npm test`), and a
zero-spend evidence reproducer. No department / BAML / scorer / `measurements/` edits.

## New files

### `src/view/framing.mjs` — the wider eyes (PURE: no GL, no IO, no Date/random; runs under `src/**/*.test.mjs`)
The deterministic framing axis. Operates on the recognition program (`masses[]`) + a build occupancy (the same
`Occupancy` the hands pass around). Reuses the E-33/E-34 ratio definitions (`ridgeToEave, roofShare, aspect`).

Public interface:
- `frontAxisOf(program) -> { axis:"x"|"z", side:"-x"|"+x"|"-z"|"+z", source:string } | null`
  The declared gate/entry wall. Reads `program.masses[].openings` for the primary entry (prefer a `kind:"door"`,
  else the widest opening); maps its wall side to an axis. `null` when no entry is declared (→ orientation check
  is SKIPPED, never flagged — no false positive on a frontless subject).
- `buildRidgeAxis(occ, program) -> "x"|"z" | null`
  The build's ACTUAL roof ridge axis, read from occupancy (not from `program.ridgeAxis`). Take the highest
  roof-band cells (top K occupied layers within the roof y-range); the horizontal axis along which the top course
  spans longest is the ridge. `null` when the roof band is degenerate (flat/absent) → orientation SKIPPED.
- `orientationFraming(program, occ) -> { axis, frontAxis, gableFacesFront:boolean, flagged:boolean, severity, note }`
  `flagged = (frontAxis && ridgeAxis && frontAxis !== ridgeAxis)`. Quiet (flagged:false) when the gable faces the
  declared front, or when either input is null (insufficient evidence → never a false positive).
- `proportionRatios(occ) -> { aspect, ridgeToEave, roofShare }`  build ratios from the occupancy bbox + roof band.
- `targetRatiosOf(program) -> { aspect, ridgeToEave, roofShare } | null`  the recognized intent's ratios from
  `masses[].rect.{w,d}` (footprint aspect) + `storeys×storeyHeight` (eave) + pitch→ridge (height). `null` when
  the program lacks the geometry → scale SKIPPED.
- `scaleFraming(program, occ, { tol = SCALE_TOL } = {}) -> { build, target, deltas, flagged, severity, note }`
  Per-ratio relative delta vs target; `flagged = some |delta| > tol`. **Uniform up-scale → all ratios equal →
  deltas 0 → quiet** (the framing-caveat / no-pixel-judgement guard). `null` target → quiet (skipped).
- `framingReport(program, occ, opts) -> { orientation, scale, flags:string[], residual:Array<{axis,note,severity}> }`
  The bundle. `flags` is a short human list for the agent prompt; `residual` is the named-gap list for the
  trajectory + summary (→ E-49). Pure; deterministic in its inputs.
- Constants: `SCALE_TOL = 0.20` (a 20% proportion drift; calibrated so the gatehouse build is quiet and a 2×
  height distortion flags — tuned on real numbers in Implement, reported in review).

Internals (not exported): `roofBand(occ)` (y-range of roof-material/top cells), `bbox(occ)`, `relDelta(a,b)`.
Fail-loud on malformed inputs (`fail("framing", …)`), mirroring the codebase guard idiom.

### `src/view/framing.test.mjs` — the flags-when-wrong / quiet-when-right proof (in `npm test`)
- **FR1 orientation quiet (correct):** gatehouse-shaped occ whose ridge faces the declared front → `flagged:false`.
- **FR2 orientation flags (rotated fixture):** same occ with the roof ridge axis swapped 90° → `flagged:true`,
  `gableFacesFront:false`. *(the deliberately-rotated fixture from the AC.)*
- **FR3 orientation SKIP (no front / flat roof):** `frontAxisOf`→null OR `buildRidgeAxis`→null → `flagged:false`
  (insufficient evidence is never a false positive).
- **FR4 scale quiet (correct):** build ratios ≈ target within tol → `flagged:false`.
- **FR5 scale flags (proportion-distorted fixture):** doubled height (same footprint) → `ridgeToEave`/`roofShare`
  off → `flagged:true`. *(the oversized-in-proportion fixture.)*
- **FR6 scale QUIET on uniform up-scale (the crux / no-false-positive):** every dimension ×2, ratios identical →
  `flagged:false`. *Proves scale is judged on proportion, not absolute size — the ticket's framing caveat.*
- **FR7 report shape + purity:** `framingReport` returns `{orientation,scale,flags,residual}`; inputs unmutated;
  byte-stable across two calls.

### `docs/active/work/T-196-01/framing-evidence.mjs` — zero-spend evidence reproducer (NOT in `npm test`)
Loads the real gatehouse `PROGRAM` + seed occupancy, prints `framingReport` on: (a) the seed build,
(b) a rotated variant, (c) a proportion-distorted variant, (d) a uniform-upscale variant. The falsifiable
deliverable independent of GL/LLM: flags-when-wrong, quiet-when-right, on the REAL subject. Mirrors the
`carve-evidence.mjs` / `render-relief.mjs` sibling precedent.

## Modified files

### `experiments/eval-alignment/picture-climb.mjs` — wire the eyes (runner, out of `npm test`)
- Import `framingReport` from `../../src/view/framing.mjs`.
- `scoreBuild` (or a thin wrapper around it): after scoring, compute `framing = framingReport(PROGRAM, occ)` for
  the scored build and attach it to the returned bundle (`{ ...med.ev, score, items, framing, … }`). (GUARD_ONLY
  path computes framing too — it is GL-free, so the seam proof carries the framing evidence with zero spend.)
- `agentPick` prompt: add a **FRAMING** block listing `build.framing.flags` (orientation/scale residuals) under
  the critique items, with an explicit note that no tool fixes them so `done` is the honest pick if only framing
  remains. The eyes widen; the agent can no longer be blind to orientation/scale.
- Trajectory: add `framing` to each round entry and a top-level `framingResidual` (rolled up from the kept
  build's `framingReport.residual`). Print the residual in the summary beside `eyes-only`.

### (No change) `src/workshop/climb-gate.mjs`, `bakeoff-score.mjs`, `department.baml`, `diagnose.mjs`, schema
The framing axis is reported, not scored — `classifyInventory` keeps keying on departments; the framing residual
is a parallel channel in the trajectory. Explicitly NOT touched (frozen-instrument / pinned-fixture discipline).

## Ordering of changes
1. `framing.mjs` + `framing.test.mjs` (pure core first; red→green in isolation; `npm test` stays green).
2. `framing-evidence.mjs` → run it → capture the real-gatehouse numbers (calibrate `SCALE_TOL`).
3. Wire `picture-climb.mjs` (import + scoreBuild attach + agentPick block + trajectory). Smoke with `GUARD_ONLY=1`.
4. Re-climb: check `GL_AVAILABLE`; if live, run the metered climb → trajectory + first/best/final beside renders.
   If not, deliver the framing evidence + GUARD_ONLY seam and name the metered run as the live-env step.
5. `review.md` with the glance verdict + intervention count.

## Module boundaries / invariants
- `framing.mjs` is pure and self-contained — the ONLY new logic in `npm test`. It imports nothing GL/LLM.
- The runner stays thin (compute + attach + print); all judgement lives in the pure module.
- Insufficient-evidence → SKIP (quiet), never flag — the structural guarantee against false positives.
- Nothing writes to `measurements/`; no department-set, BAML-prompt, or scorer change.
