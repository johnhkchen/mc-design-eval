# T-117-01 progress

All plan steps executed in order; no deviations except where noted. Suite green at every commit.

## Completed

- **Step 1 — lens core** (`src/color/band-profile.mjs`): module-header T-117 paragraph;
  `fieldResolution(materialMap)` exported (placementRule + nearTonePairs → Map, min-dL/lexicographic,
  roof-rule ineligible); `projectFieldCounts` helper; `fieldResolve` threaded through
  `segmentLayerBands` (dominant loop + share); rung-2 block in `extractConceptZoneMap` with
  conditional `params.fieldResolution`. Existing 22 tests passed UNCHANGED before any new tests.
- **Step 2 — tests** (`band-profile.test.mjs` Group H, 7 tests): fieldResolution barn transcription /
  roof ineligibility / min-dL + empty cases; segmentLayerBands projection (incl. null-resolve ≡ old,
  original counts preserved); **the barn ΔL 2.082 witness** end-to-end (stone_bricks-flipped wall
  rows → cobble-dominant band, role resolved, fieldResolution param recorded, stone_bricks kept as
  secondary); honest-refusal negative (trim-dominated walls, no walls pair → `no-field-cells`,
  no param); legacy invariance (rung-1 readable → no param). 29/29; full suite 1526/0.
  **Commit 1: 4ee2b5a.**
- **Step 3 — barn derivation**: refusal record preserved byte-identical as
  `zone-map/barn.prior-fallback.json`; `node zone-map.mjs --subject barn --no-render` derived
  `source:"concept"`, band0 y0..12 cobblestone share 1.0,
  `params.fieldResolution {stone_bricks, oak_planks}→cobblestone`, roof dark_oak_planks share 1.0,
  diff vs prior empty (the transcribed prior was right; now it is *derived*). buildSkin ran the full
  downstream pipeline without throwing (risk #4 did not materialize).
- **Step 4 — legacy byte-identity**: full sweep regenerated cottage/gatehouse/church `.json`+`.md`
  **byte-identical** (git diff clean; only barn files modified). No diffs to name.
- **Step 5 — registry flip 1**: `zoneMapRecord: "zone-map/barn.json"`; armed agrees-with-record
  assert passes on re-run, record byte-stable. **Commit 2: e59d216.**
- **Step 6 — kit extraction**: `node kit-extract.mjs --subject=barn` (direct node, single subject —
  legacy pins untouched, verified by git status). kept=5 (cube=4 fixture=1), verified=0 flagged=4,
  overrides={} (church precedent: flag-for-review, never silent snap). `bandRefsFromZoneRecord`
  accepted the record — the kit.mjs:122 contract held verbatim. Kit diff records a non-shipping
  roof correction (dark_oak→spruce, ships:false) and recovers smooth_stone (base) + oak_door
  (fixture) as kit evidence.
- **Step 7 — registry flip 2**: `kitRecord: "kit/barn.json"`; zone-map re-run byte-stable with the
  kit composed into the vocabulary; `--offline --subject=barn` reproduces the kit record from the
  committed raw reply. **Commit 3: a907836.**
- **Step 8 — final**: `npm test` 1526 pass / 0 fail.

## Deviations

- None functional. progress.md was written at the end of Implement rather than incrementally
  (single uninterrupted session; the four commits are the incremental record).
- Sibling-session note: T-118-01 work (`src/view/roof-region-diff.mjs`, its work dir) is in flight
  in this working tree — deliberately not touched, not committed with this ticket's changes.

## Remaining

- review.md (next phase artifact). Lisa owns the frontmatter flips.
