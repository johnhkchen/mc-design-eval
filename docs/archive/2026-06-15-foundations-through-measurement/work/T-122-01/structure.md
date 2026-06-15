# T-122-01 ridge-height-closure — Structure

The blueprint for design.md's five parts. Pure cores first; the shared surface definition
(`gableSurfaceHeight`/`evalSideHeight`/`hipEndPlanes`) and the generator are **not modified**.

## Files modified (code)

### 1. `src/form/roof-fit.mjs` — shared geometry home (+2 exports)

- **`glbHeightAt(aTris, x, z)`** — MOVED here verbatim from `src/view/roof-region-diff.mjs:275`
  (barycentric GLB surface sample at a column center). Motivation: the closure (form) must use
  THE instrument's sampler (one ruler, one composition point); view→form is the established
  import direction (roof-region-diff already imports `gableSurfaceHeight` from here), while
  form→view would thread a needle through an import cycle.
- **`gableEaveAnchors(gable, glbAt)`** — NEW: the like-for-like anchor arithmetic, single
  implementation consumed by BOTH the instrument and the closure. Per side: collect GLB samples
  (`glbAt(x, z)`) at that side's eave-edge columns over the gable footprint; a side with zero
  samples drops out of **both** means. Returns
  `{buildEave, glbEave, perSide: [{planeId, eaveY, samples, median}], dropped: [planeId]}`;
  both anchors `null` when no side samples (caller refuses, named).

### 2. `src/view/roof-region-diff.mjs` — anchor repair (instrument)

- Delete local `glbHeightAt` (line 275); import it from `../form/roof-fit.mjs` (extend the
  existing import at line 33).
- `heightProfiles` (line 322): replace the buildEave/pooled-median block (lines ~335–346) with
  `gableEaveAnchors(gable, (x, z) => sampled.get(colKey(x, z))?.glb ?? null)`. The `anchors`
  field in every profile gains `perSide`/`dropped` (additive; `buildEave`/`glbEave` keep their
  names). Docstring updated to match what the code now actually does. Nothing else changes —
  `entry()`, `profileStats`, regions, attribution all untouched.

### 3. `src/form/roof-ridge-fit.mjs` — profile fit + closure (the core of the ticket)

- **`dominantLine(apex, o)`** (internal): EXTRACTED from `fitRidgeLine` lines ~158–219 (cluster
  expansion within `apexGap`, longest-wins ranking, spike record, least-squares line, stats).
  Operates on a `Map(bin → height)`. `fitRidgeLine` becomes: build the vertex-max apex map
  (unchanged lines ~101–148) → `dominantLine`. Output byte-identical for identical inputs
  (regression-asserted in tests).
- **`fitRidgeProfile(gable, aTris, opts)`** — NEW export: the SAMPLED-surface ridge line. Per
  footprint column (same `exclude` + `excludeDilate` dilation logic as `fitRidgeLine`, shared
  via a small extracted `buildExclusion` helper), sample `glbHeightAt(aTris, x+?, z+?)` at the
  column center; per ridge-axis bin keep the max across the cross-section; → `dominantLine`.
  Returns the same shape as `fitRidgeLine` (`height`, `slopeDeg`, `span`, `length`, `rmse`,
  `slices`, `excludedColumns`, `spike?`) or `{reason: "ridge-profile-unfitted", detail}`.
- **`closeRidge(gable, {profile, anchors, apexLine, opts})`** — NEW export, pure:
  `{gable, closure}`. Steps, each refusable (a refusal returns the input gable unchanged and
  the named reason in `closure.refusals[]` — Rule 2):
  1. preconditions: `profile.height` present; anchors complete; profile coverage
     `length / (bbox span)` ≥ `minProfileCoverage` (new shared default, `RIDGE_FIT_DEFAULTS`).
  2. target: `toY = roundHalf(anchors.buildEave + (profile.height − anchors.glbEave))`; sanity
     `toY > eaveY + 0.5` for every side.
  3. sides: per side `pitchTo = (toY − eaveY) / run` (recorded `run`; refuse if `run` missing
     or `pitchTo ∉ (0, maxPitch]`); side keeps prior pitch as `pitchFitted`.
  4. hips: per demanded end — if the profile's dominant span reaches within 1 bin of the
     footprint edge at that end → demand cleared, `hip.refuted = "ridge-profile-to-edge"`;
     else hip kept, `hip.fitted[end].pitch ← (toY − eave) / |edge − ridgeEnd|` (same sanity),
     source `"ridge-closure"`.
  5. cross-check: `apexCheck = round3(toY − apexLine.height)` recorded; `|apexCheck| > apexGap`
     adds a NAMED finding (`apex-vs-profile-divergence`) — recorded, never blocking (the barn's
     3-bin vertex apex is exactly why the profile is primary).
  `closure = {applied, from, to, profile: {height, span, length, rmse}, anchors, apexCheck,
  sides: [{planeId, pitchFrom, pitchTo}], hip, refusals}`.

### 4. `src/form/provision-fit.mjs` — closure step in `fitProvision`

After the `ridgeFit` evidence map (line ~120), for each gable in `grpGables` (only when
`tris.length`): `fitRidgeProfile(g, tris, {exclude: protrusionCols})` +
`gableEaveAnchors(g, (x, z) => glbHeightAt(tris, x, z))` + `closeRidge(...)`. The CLOSED gables
are what `roofs.push` records (the generator consumes them); each `ridgeFit[]` entry gains its
gable's `closure` block. Refusal findings surface into `findings` with `stage: "ridge-closure"`.
Note `wallTop` derives from `Math.floor(s.eaveY)` (line ~140) — eaves untouched by closure, so
wall heights are provably stable. `serializeProvisionFit`/`reviveProvisionFit` need no change
(closure block is plain JSON; Sets only live in `footprint.cols`).

### 5. `benchmarks/sculpture/generated-milestone.mjs` — `--skip-gate` flag

New flag parsed beside `--offline`/`--repro` (line ~431). Runs the full deterministic chain
(double-run byte-equality, zero-blob check) and persists the chain artifacts + fit + plan via
the existing `writeRec` (pin-guard applies — combined with `--rotate-pins` on committed
artifacts), then **returns before `spawnGate`** without touching `generated/<subj>.json` /
`.md` (the committed record stays pinned until the owned gated run). Prints a named summary.
Registry-only; no subject keys. This is what satisfies "verified by the instrument, before any
judging": skip-gate run → `diff:roof` → only then the gated run.

### 6. `benchmarks/sculpture/roof-diff.mjs` — comment hygiene

Line 16 `(the barn, until T-117 lands)` → de-specialized (e.g. "a subject whose committed
inputs are absent"). No behavior change; honors the file's own header rule.

## Test files (all pure, under the `src/**/*.test.mjs` glob)

- `src/form/roof-fit.test.mjs` — `glbHeightAt` (known triangle, sample inside/outside),
  `gableEaveAnchors` (symmetric two-side; asymmetric eaves; one side unsampled → dropped from
  both; no samples → nulls).
- `src/view/roof-region-diff.test.mjs` — anchor repair: synthetic asymmetric-eave gable + flat
  offset GLB where the OLD pooled median manufactured a phantom delta → eave-relative ridge
  delta ≈ 0; symmetric case numerically unchanged.
- `src/form/roof-ridge-fit.test.mjs` — `fitRidgeLine` regression (existing fixtures byte-stable
  through the `dominantLine` extraction); `fitRidgeProfile` on synthetic prisms, BOTH ridge
  axes; `closeRidge`: **the −4.015 witness** (committed cottage cross-gable values literal:
  ridge.y 21, sides eaveY 14.5/pitch 0.453 and 15/0.885, profile height 22.445, anchors
  14.75/14.794 → asserts the OLD gable's max `gableSurfaceHeight` ≤ 19 — the −4-class deficit,
  provenance footnote −4.324 committed ridge mean / −4.015 T-118-era rake rawDelta — and the
  closed gable's ridge realized within ±1 of target); sanity refusals (maxPitch, eave order,
  coverage); hip refuted at-edge (barn-shaped: span = bbox); hip kept + re-anchored (profile
  genuinely stopping short); apexCheck divergence named.
- `src/form/provision-fit.test.mjs` — integration: synthetic occ+glb through `fitProvision` →
  gables closed, `ridgeFit[].closure` recorded, refusal path leaves gables untouched.
- `src/view/roof-generate.test.mjs` — closed gable through `generateRoof`: ridge cells at the
  fitted height ±1 (both axes); cross-gable pair (two overlapping closed gables, heightfield
  max); stair/slab cap states still map (`unmapped` empty).

## Records rotated in Implement (all under `--rotate-pins`, owned by this ticket)

- `benchmarks/sculpture/generated/{cottage,barn}/…` artifacts + `provision-fit.json` (+ plan),
  then `generated/{cottage,barn}.{json,md}` + `multi-angle/{cottage,barn}-generated.json` on
  the gated runs.
- `benchmarks/sculpture/roof-diff/*` — all 8 subject×path records + md + committed sheets
  (anchor repair moves every record; `--repro` must hold after).
- NOT rotated: church/gatehouse generated chain records/artifacts (not re-run — named handoff),
  all styled/reconstructed records (their artifacts are untouched; only their roof-diff
  re-derivations move, which is the instrument's own refresh).

## Ordering (matters)

1. roof-fit + roof-region-diff (sampler move + anchors + instrument repair) — tests green.
2. roof-ridge-fit (extraction + profile + closure) — witness + synthetic tests green.
3. provision-fit integration + roof-generate realization tests.
4. generated-milestone `--skip-gate`; roof-diff comment hygiene.
5. Chains: skip-gate runs (cottage, barn) → `diff:roof` before/after verification → gated runs
   (one judge run per view) → roof-diff full refresh → `--repro`/`--offline` → review.

Each of 1–4 is an atomic commit candidate; 5 is records-then-verdicts commits as in T-121.
