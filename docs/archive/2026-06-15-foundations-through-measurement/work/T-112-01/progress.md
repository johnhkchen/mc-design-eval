# T-112-01 hip-pyramid-cap — Progress

All plan steps complete. Commits on `main`, in order:

## Step 0 — Baseline (no commit)
- HEAD `68aff91`; suite 1431 green; `roof:cottage --repro` MATCH (`47739999…`),
  `roof:gatehouse --repro` MATCH (`6ed2580c…`) — confirmed BEFORE any change.

## Step 1 — `dc9d351` refactor: one hip end-plane definition
- `hipEndPlanes`/`hipPlaneHeight` extracted in roof-fit; `gableSurfaceHeight` and
  roof-generate's `gableDownhillAt` consume the single definition; inert `hip.fitted`
  per-end pitch seam. Golden-equivalence tests; repro MATCH ×2 after the refactor.
- Deviation: one test assertion authored backwards (a steeper fitted pitch RAISES the
  surface near its end) — fixed before commit.

## Step 2 — `1312c7d` hip/pyramid fit core
- `src/form/roof-hip-fit.mjs` (+18 synthetic-spec tests): `fitHipCap` (4-sided gable,
  eave ladder highest-first, constructed apex bounded by as-built top), `fitHipEnds`,
  `capFootprint`. `fillBetween` exported from roof-fit for the cap footprint.

## Step 3 — `3d9b870` generator corner states
- `stairShape` (exhaustive unit table: 4 downhills × perpendicular-class²) + gated
  emission via `owner.cornerEligible`. Deviation from the first cut: the legacy stair
  gate (cardinal uphill must rise) never fires on a pyramid arris — outer corners now
  back onto the rising DIAGONAL. Legacy gables (incl. cottage valleys) byte-identical;
  repro MATCH ×2.

## Step 4 — `e7689e4` ladder wiring
- `swapRoof` `hipFit` arg → `hip-end-fitted` + `hip-cap` rungs APPENDED after every
  existing rung; `pitchKey` extended (kind + fitted pitches); `ridgeVariant` passes
  non-2-side gables through. Unit proofs: refused tower group accepts at `hip-cap` with
  outer corners; no-hipFit swap byte-identical; tail order pinned.

## Step 5 — `41e3307` runner wiring
- Per-group cap fit (only when no sane gable) + hip-end fit (only when hip demanded);
  aligned triangles hoisted; accepted caps consume planes/exclude cols for the
  termination pass; `hipFit` record section + markdown + cap45/cap135 frames.

## Step 6 — `ac5d997` church live evidence (two fit-core fixes en route)
- **Fix 1 (live-measured)**: raw area-weighted pitch means exploded to 632–6762 — the
  window is full of near-vertical wall scraps (n_y ≈ 0). → sane cone upper bound
  (shared `maxPitch`), rejected counted.
- **Fix 2 (live-measured)**: the cone then collapsed to 0.001 — flat parapet ledges
  drown the slope. → derived lower bound `minPitch = 1/run` (one cell of rise over the
  face's own run). Both bounds derived/shared, never subject-tuned; regression test for
  the scrap case.
- **The church truth**: with honest bounds, the GLB tower-top window contains NO
  roof-like slope (pitch distribution bimodal: ~0 and ≫4; 0 sane of 480/421/528 tris
  per face). The tower is a crenellated FLAT-TOP, not a pyramid — the cap-band refusal
  is named per face. The eave-11 candidate that fit pure-side was REFUSED BY THE CAGE
  (IoU regressed at 3 azimuths; closure 11 → 203) and is recorded as the
  `mass-1:hip-cap` attempt. This is the AC's "or the residual is named with its fit
  error" branch, now with decisive evidence instead of T-110's "insane gable".
- Artifact byte-identical (sha `b107b729` unchanged — evidence-only record delta);
  `roof:church --repro` MATCH, `--offline` OK; cottage/gatehouse repro MATCH (the
  no-collateral AC); determinism double-run passed; unmapped 0/16522.

## Post-step — live corner-state proof (no commit needed; evidence below)
- The church artifact carries no corner stairs (cap refused), so the AC's "render
  unmapped must be empty" was additionally proven directly through the LIVE
  blockStateId gate (`buildWorldFromVoxels`):
  - generated test pyramid: shapes `{outer_left: 6, straight: 36, outer_right: 6}`,
    unmapped 0/84;
  - full matrix 5 shapes × 4 facings: unmapped 0/20.

## Final state
- `npm test`: **1476/1476 green**. No subject-specific constants introduced
  (HIP_FIT_DEFAULTS = {minTriangles: 1, apexSlack: 1.0}; pitch bounds derived or shared).
- Untouched: styled/settle chain (S-113's seam), judge replies (T-114), fixture card
  CARD_ROWS (the roof generator never drew from it; adding rows would have dirtied the
  committed card record for no AC).
- Sibling-session note: `styled-milestone.mjs`, `styled/church.*`,
  `multi-angle/church-styled.*` were modified by a concurrent thread during this run —
  deliberately NOT staged in any T-112-01 commit.
