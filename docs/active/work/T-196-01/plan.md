# T-196-01 — PLAN: ordered steps + testing strategy

Goal: a deterministic **framing axis** (wider eyes) that flags-when-wrong / quiet-when-right on orientation +
proportion, wired into the climb, then the metered gatehouse re-climb. Each step commits atomically.

Confirmed data shape (from the real gatehouse program): `mass.rect={x0,z0,w:15,d:15}`,
`mass.roof.ridgeAxis="x"`, `mass.openings[0]={wall:"-x",kind:"door",w:4,head:"arch"}` (the gate),
`storeys:4, storeyHeight:5`. So the gable faces the `-x` gate → the correct build must be QUIET (the
no-false-positive anchor). Occupancy API: `occ.cells` Map `"x,y,z"→block`, `occ.bounds={min,max}`, `occ.dims`,
`bareBlock(id)`.

## Step 1 — `src/view/framing.mjs` (the pure core) + `framing.test.mjs`  [commit 1]
Implement, then test red→green in isolation. Pure: no GL/IO/Date/random.

- `frontAxisOf(program)`: scan `masses[].openings`; prefer the first `kind:"door"`, else the widest opening;
  map `wall ∈ {"-x","+x","-z","+z"}` → `{axis, side, source}`. `null` if none.
- `bbox(occ)` (internal): from `occ.bounds`/`occ.dims` → `{w,d,h, minY,maxY}` (w=dims[0], d=dims[2], h=dims[1]).
- `buildRidgeAxis(occ)`: among cells in the top `RIDGE_TOP_LAYERS=2` layers (`y ≥ maxY-1`), measure x-extent vs
  z-extent; ridge = the longer axis. `null` if the two extents are within `RIDGE_TIE=2` (flat/pyramidal top —
  insufficient evidence → SKIP, never a false flag).
- `orientationFraming(program, occ)`: `frontAxis=frontAxisOf(...).axis`, `ridgeAxis=buildRidgeAxis(occ)`;
  `gableFacesFront = frontAxis===ridgeAxis`; `flagged = frontAxis && ridgeAxis && !gableFacesFront`;
  `severity:"major"` when flagged. Quiet (false) on any null input.
- `eaveYOf(occ, ridgeAxis)` (internal): highest y where the perp-to-ridge occupied extent ≥
  `EAVE_FULL=0.9 × maxPerp`; above it the roof tapers. Fallback `null` if monotone (no taper).
- `proportionRatios(occ)`: `{ aspect: max(w,d)/min(w,d), ridgeToEave: total/eave, roofShare: (total-eave)/total }`
  using `eaveYOf`; mirrors `silhouetteRatios`' definitions (E-33/E-34 vocabulary). `eave`-dependent ratios are
  `null` when `eaveYOf` is null.
- `targetRatiosOf(program)`: from `mass.rect` (aspect = max(w,d)/min(w,d)), `eave = storeys×storeyHeight`,
  `ridge = eave + floor(perp/2)×pitch` where `perp` = the footprint dim ⟂ to declared ridgeAxis, `pitch` from
  `pitchClass` (1). Returns the same `{aspect, ridgeToEave, roofShare}`. `null` if geometry missing.
- `relDelta(build,target)` (internal): `|build-target|/max(|target|,ε)`.
- `scaleFraming(program, occ, {tol=SCALE_TOL})`: per-ratio `relDelta`; `flagged = relDelta(aspect)>tol ||
  relDelta(ridgeToEave)>tol` (the two E-33 NAMED ratios; `roofShare` reported as evidence). **Uniform up-scale →
  ratios identical → deltas 0 → quiet** (the proportion-not-pixels guarantee). `null` target/eave → quiet.
- `framingReport(program, occ, opts)`: `{ orientation, scale, flags:[...human...], residual:[{axis,note,severity}] }`.
- Constants: `SCALE_TOL=0.20`, `RIDGE_TOP_LAYERS=2`, `RIDGE_TIE=2`, `EAVE_FULL=0.9`. Fail-loud guards.

**Tests (`framing.test.mjs`, in `npm test`):** FR1 orientation quiet (gable‖front), FR2 orientation flags
(rotated), FR3 orientation SKIP (no door / flat top), FR4 scale quiet (ratios match), FR5 scale flags
(doubled height), **FR6 scale QUIET on uniform 2× up-scale (the crux — no pixel false-positive)**, FR7
report-shape + purity (inputs unmutated, byte-stable). Build small synthetic `occupancyFromCells` fixtures
(a gabled box: full footprint walls + a ridge line) so the geometry is exact and the assertions are clean.

Verify: `npm test` green.

## Step 2 — `docs/active/work/T-196-01/framing-evidence.mjs` (zero-spend real-subject proof)  [commit 2]
Load the real `PROGRAM` + seed occupancy (`artifactOccupancy(seed)`); print `framingReport` for: (a) seed,
(b) ridge-swapped, (c) height-doubled, (d) uniform-upscaled. Capture the numbers; **calibrate `SCALE_TOL`** so
(a) is quiet and (b)/(c) flag. Record the real values in `progress.md`. This is the falsifiable deliverable that
does not need GL/LLM.

## Step 3 — wire the eyes into `picture-climb.mjs` (runner; out of `npm test`)  [commit 3]
- Import `framingReport`.
- In `scoreBuild`, after the median is chosen, compute `framing = framingReport(PROGRAM, occ)` and include it in
  the returned bundle. (GUARD_ONLY path: compute + log it too — GL-free, zero spend.) Note: round-0 occ and each
  candidate occ are available at the call sites; pass the occ being scored.
- In `agentPick`, append a `FRAMING (orientation/scale — no tool fixes these; if only these remain, `done` is
  honest):` block from `build.framing.flags`.
- Trajectory: add `framing` to each round entry; add top-level `framingResidual` = kept build's
  `framing.residual`; print it in the summary beside `eyes-only (named, no lever)`.
- Smoke: `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` → renders + framing log, zero spend.

## Step 4 — the metered re-climb (AC 2-4)  [commit 4, evidence]
- Probe `GL_AVAILABLE` (the render/ nested project — `assertGlAvailable`). 
- **If GL + `claude -p` auth live:** run `CLIMB_OUT=docs/active/work/T-196-01/trajectory.json node
  experiments/eval-alignment/picture-climb.mjs`. Collect trajectory + first/best/final `beside-concept.png`.
  Record: did the WALL major clear (relief)? did carve_arch get picked live? orientation/scale residual named?
  the glance verdict + intervention count.
- **If GL/auth absent:** deliver the Step-2 framing evidence + the GUARD_ONLY render seam; name the metered LLM
  run as the live-env step (the framing axis — the new contribution — is fully proven without it). Record
  honestly in `progress.md`/`review.md`.

## Step 5 — `review.md`  [commit 5]
Glance verdict vs concept (reached-its-picture or the named residual ceiling → E-49), intervention count,
test coverage + gaps, frozen-instrument-untouched confirmation.

## Testing strategy
- **Unit (in `npm test`):** the entire `framing.mjs` core — flags-when-wrong / quiet-when-right + the
  uniform-upscale no-false-positive crux (FR6). Deterministic, the heart of the AC.
- **Evidence (zero-spend, not in `npm test`):** `framing-evidence.mjs` on the real gatehouse + the three
  variants; the GUARD_ONLY render seam.
- **Integration (metered, live-env):** the re-climb trajectory + beside renders.
- **Verification criteria:** `npm test` green; framing quiet on the correct seed, flagged on rotated/distorted;
  `measurements/` + `department.baml` + `bakeoff-score.mjs` + schema untouched (`git status`).

## Risks / mitigations
- **Eave detection noisy on the voxelized seed** → flag on `aspect` (most robust) + `ridgeToEave`; report
  `roofShare`; calibrate tol on real numbers; if eave is null, scale degrades to aspect-only (still quiet on
  correct). Documented in review.
- **Metered run unavailable** → Step-4 fallback; the new logic is proven by Steps 1-2 regardless.
- **False positive on the real seed** (the named anti-hedge failure) → re-localize tol; report honestly.
