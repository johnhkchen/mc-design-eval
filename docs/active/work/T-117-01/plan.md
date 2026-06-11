# T-117-01 plan — ordered, independently verifiable steps

## Step 1 — `fieldResolution` + projection (pure core)

Edit `src/color/band-profile.mjs`:
- module-header paragraph for the T-117 rung (global-offset rationale, committed-data-only rule);
- `fieldResolution(materialMap)` exported after `resolveBandRoles`;
- `projectFieldCounts(counts, fieldBlocks, fieldResolve)` internal helper; thread `fieldResolve`
  through `segmentLayerBands` (dominant loop + share computation), default null;
- rung-2 block in `extractConceptZoneMap` with conditional `params.fieldResolution`.

**Verify:** `node --test src/color/band-profile.test.mjs` — all existing tests pass UNCHANGED
(the null-resolve path must be bitwise the old behavior; existing fixtures carry no
nearTonePairs so even readable paths can't engage the rung).

## Step 2 — unit tests (the AC's witness + negative)

Edit `src/color/band-profile.test.mjs`, Group F per structure.md: fieldResolution direct cases
(barn transcription incl. dL 2.082 pair, roof ineligibility, min-dL pick, pairless/absent-pairs
empty), segmentLayerBands projection cases, the barn witness end-to-end (stone_bricks-keyed wall
rows → cobble-dominant band, fieldResolution param present, stone_bricks secondary), the
honest-refusal negative (no walls partner → `no-field-cells`), legacy invariance (rung-1 readable
→ no fieldResolution param).

**Verify:** `node --test src/color/band-profile.test.mjs` green; then full `npm test` green.
**Commit 1:** `feat(E-30 T-117-01): role-aware field resolution rung in the zone lens — barn ΔL
2.082 witness + honest-refusal negative`

## Step 3 — preserve the refusal record, regenerate barn

```
cp benchmarks/sculpture/zone-map/barn.json benchmarks/sculpture/zone-map/barn.prior-fallback.json
node benchmarks/sculpture/zone-map.mjs --subject barn --no-render
```

**Verify:** stderr shows `zone map: concept` with a cobble-dominant field band; new
`zone-map/barn.json` has `source:"concept"`, `derived.bands[*].dominantBlock` includes
cobblestone, `params.fieldResolution` = `{stone_bricks:"cobblestone", ...}`. If buildSkin throws
downstream of zones: stop, record the failure verbatim in progress.md, surface in review.md
(named risk — do not patch other stages in this ticket).

## Step 4 — legacy byte-identity sweep

```
node benchmarks/sculpture/zone-map.mjs --no-render
git status --short benchmarks/sculpture/zone-map/
```

**Verify:** only `barn.json`/`barn.md` modified + `barn.prior-fallback.json` untracked;
`git diff --quiet` on cottage/gatehouse/church `.json` and `.md` (byte-identical through the
changed lens). Any other diff: stop and name it (T-113 discipline) before proceeding.

## Step 5 — registry flip 1 + armed-assert re-run

Edit `benchmarks/sculpture/durable-skin.mjs` barn def: `zoneMapRecord: "zone-map/barn.json"`
(comment → provenance note). Then:

```
node benchmarks/sculpture/zone-map.mjs --subject barn --no-render
```

**Verify:** runs clean — buildSkin's agrees-with-record assert (now armed for barn) passes and
the rewritten record is byte-identical (`git diff` quiet on barn.json after the re-run).
**Commit 2:** `feat(E-30 T-117-01): barn zone map derived from concept — refusal record preserved
as history, registry zoneMapRecord armed, legacy maps byte-identical`

## Step 6 — barn kit extraction (live recognition, single subject)

```
node benchmarks/sculpture/kit-extract.mjs --subject=barn
```

Direct node (npm flag-swallowing precedent); single-subject (legacy pins are T-119 territory —
`git status` must show only `kit/barn.{json,raw.json,md}` created, nothing else touched).

**Verify:** `bandRefsFromZoneRecord` accepts the record (no throw at kit.mjs:122); stderr summary
shows kept/verified counts; `kit/barn.json` schema `kit/v1`. Bounded re-asks live in the kit
parser already; a malformed live reply after retries = stop and record.

## Step 7 — registry flip 2

Edit durable-skin barn def: `kitRecord: "kit/barn.json"`.

**Verify:** `node benchmarks/sculpture/zone-map.mjs --subject barn --no-render` still clean (kit
overrides now compose into the vocabulary; the zone-map record must STILL agree — if the kit's
overrides change the derived bands' agreement surface, that's a divergence throw = stop/record).
**Commit 3:** `feat(E-30 T-117-01): barn kit extracted on derived bands — kitRecord flipped,
registry data-only`

## Step 8 — full verification + review

```
npm test
```

**Verify:** suite green (≥1514 + new tests, 0 fail). Write `review.md` (changes, coverage, gaps,
open concerns incl. the roof-symmetry seam and any step-3/7 findings).
**Commit 4:** `docs(E-30 T-117-01): RDSPI artifacts`

## Testing strategy summary

| Layer | What | How |
|---|---|---|
| Unit | fieldResolution eligibility/pairing/determinism | direct, map literals |
| Unit | projection in segmentLayerBands; null-resolve ≡ old | direct, synthetic byY |
| Unit (AC witness) | barn ΔL 2.082 → cobble-dominant | end-to-end extractConceptZoneMap |
| Unit (AC negative) | no walls partner → no-field-cells | end-to-end extractConceptZoneMap |
| Integration | legacy byte-identity | full sweep + git diff (Step 4) |
| Integration | armed record assert | Step 5/7 re-runs |
| Live | kit on derived bands | Step 6 (recognition only — no judges anywhere) |

## Rollback points

Each commit is atomic. If Step 3 or 6 hits a downstream wall, commits 1(–2) stand on their own:
the lens fix + witness tests are independently valuable and the registry flips only land beside
their records.
