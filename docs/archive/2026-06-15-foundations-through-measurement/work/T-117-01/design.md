# T-117-01 design — role-aware zone lens

## The decision in one paragraph

Add a second, **conditionally-engaged rung** to the wall-band segmentation inside
`extractConceptZoneMap`: when the existing field-restricted segmentation finds *zero* field cells
(exactly today's `no-field-cells` condition), re-segment with a **role-aware field resolution** —
a key→field-block mapping derived entirely from the committed material map's own data
(`placementRule` + `nearTonePairs`). A cell that snapped to a *feature-rule* block which the map
records as a near-tone twin of a *walls-rule* block is counted, for the dominance decision only,
as that field block. The barn's stone_bricks-snapped field cells (corners-edges twin of
cobblestone at the recorded ΔL 2.082) then classify cobble-dominant; concepts whose wall rows are
dominated by blocks with no recorded near-tone walls partner still refuse `no-field-cells`
verbatim. Legacy subjects never reach the rung (their rung-1 segmentation succeeds), so their
records regenerate byte-identical.

## Why the decision sits at the role level, not the pixel level

The research probe is decisive: all 752 grey cells flip to stone_bricks with a uniform ≈ −2.1 ΔE
margin — a **global lightness offset** in the concept render, the same phenomenon kit-extract
already corrects with a median `lightnessOffset`. A pair whose distinction is almost purely L\*
cannot be split per-pixel under an unknown global L\* shift; no metric tweak fixes that. What CAN
decide it is committed semantic structure: the map says stone_bricks is `corners-edges` — a linear
feature that by the lens's own model **never dominates a row** — and says cobblestone is the walls
field sitting ΔL 2.082 away. "Which of the map's own blocks explains a feature-dominated field?"
is the binary Lab decision the ticket names, taken between the map's blocks (the recorded pair),
not re-quantized against any table.

## Options considered

**A. Global lightness-offset normalization before quantize** (kit-extract's trick at the grid
stage). Rejected: changes every subject's grid → breaks legacy byte-identity wholesale; the offset
estimate needs trusted anchor regions, which is circular at zone-map time (the kit that supplies
them is downstream of the zone map).

**B. Chroma-weighted or alternative metric in `gridFromPixels`.** Rejected: cobblestone and
stone_bricks differ by (0.6, −0.4) vs (0, 0) in a\*b\* — there is no chroma signal to weight; and
any metric change re-snaps legacy grids too.

**C. Unconditional per-cell re-snap against walls-role blocks.** Rejected: every concept becomes
"readable" (any grey, any wood, any sky resolves to the nearest field block) — destroys the honest
refusal the AC explicitly protects.

**D. Role-aware field resolution as a gated second rung — CHOSEN.** Detailed below. Engages only
in today's failure state, uses only committed map data, adds no thresholds, refuses honestly when
the data doesn't license a resolution.

**E. Relax the refusal / let kit-extract accept prior-fallback records.** Banned by the ticket
(E-30 Rule 1: no contract relaxed).

**F. Hand-author zone-map/barn.json.** Banned by the ticket (no hand-edits).

## The chosen mechanism, precisely

### Resolution map (new pure function, exported, unit-tested)

`fieldResolution(materialMap)` → `Map<bareKey, bareFieldKey>`:

For each map block K (bare key) that is **not** walls-rule under any of its rows:
- K is eligible only if **none** of K's rows has `placementRule:"roof"` — roof blocks appearing in
  wall rows are the foreshortening leak the anchor machinery exists to stop; resolving them into
  the field would manufacture wall bands from roof rows. Eligible rules are therefore the
  wall-adjacent feature/base rules: `corners-edges`, `trim`, `openings`, `base` (none of which can
  be a band dominant today either, so no capability is removed).
- Find walls-rule blocks F with a recorded pair {K, F} in `materialMap.nearTonePairs` (either
  orientation; entries are `{a, b, dL}` with `minecraft:` prefixes — compare bare). Pick the F
  with minimum dL; tie → lexicographic (the module's determinism idiom).
- Record K → F.

Maps without `nearTonePairs` (or with none touching a walls block) yield an empty map — behavior
identical to today, including for the existing synthetic test fixtures, which carry no pairs.

### Segmentation (compatible extension)

`segmentLayerBands` gains optional `fieldResolve` (Map, default null). The per-layer dominant and
the band `share` are computed over **projected** counts: key → key if in `fieldBlocks`, else
`fieldResolve.get(key)` if present, else dropped. Band `counts` stay the ORIGINAL histograms, so
`resolveBandRoles` still reports stone_bricks as a genuine corners-edges secondary with its real
share (CROSS_BAND_RULES already forces its inclusion). With `fieldResolve` null the projection
degenerates to the existing `filterCounts` — bitwise-identical behavior.

### Orchestrator (the gate keeps its shape)

```
bands = segmentLayerBands(byY, { yLo, yHi: wallYHi, minBandHeight, fieldBlocks });
if (!bands.length && fieldBlocks) {
  const resolve = fieldResolution(materialMap);
  if (resolve.size) {
    bands = segmentLayerBands(byY, { ..., fieldBlocks, fieldResolve: resolve });
    if (bands.length) params.fieldResolution = Object.fromEntries([...resolve]);
  }
}
if (!bands.length) return refuse("no-field-cells");   // verbatim — the gate survives
```

`params.fieldResolution` is **conditional** (the existing `anchor` precedent), so legacy records'
params are unchanged. The barn's new record carries the engagement audit trail. All three
`extractConceptZoneMap` call sites in buildSkin (pin attempt, occupancy re-read, main) get the
rung automatically — no runner changes.

### What stays out of scope

- The roof's symmetric starvation (`weak-dominant:roof`) — same mechanism would apply, but the
  barn witness is walls-only and the AC names field bands; noted as a future seam, not built.
- Pin protection on kit-extract sweeps (T-119) and the terminal barn proof with judges (S-121).
- `minDominantShare` and every other threshold: untouched. A rung-2 band still must pass the
  weak-dominant and role-resolution gates downstream of segmentation.

## Why refusal honestly survives (the AC's negative test)

Rung 2 engages only from the exact state that refuses today, and resolves only keys the committed
map *both* role-classifies as wall-adjacent features *and* Lab-pairs with a field block. A concept
whose wall extent is dominated by: a roof-rule block → ineligible; a block with no recorded pair
to any walls block → no resolution entry; nothing at all → empty projection. All three still fall
through to `refuse("no-field-cells")` on the same line. The synthetic negative test fixes one of
these (feature dominant, no near-tone walls partner in the map literal) and asserts the verdict.

## Acceptance-criteria mapping

| AC | How this design meets it |
|---|---|
| Role-aware classification, pure, unit-tested | `fieldResolution` + `fieldResolve` projection in band-profile.mjs (pure); barn ΔL 2.082 witness test with real table colors + a map literal transcribing barn's roles/pairs |
| Refusal survives, no contract relaxed | gated rung; same refusal line; kit.mjs / generated-milestone untouched |
| Barn unblocked, recorded | regenerate zone-map/barn.json via `zone:map -- --subject barn`; refusal record preserved as `zone-map/barn.prior-fallback.json` beside it; registry `zoneMapRecord`/`kitRecord` flip (data-only); kit via direct `node kit-extract.mjs --subject=barn` |
| Legacy byte-identical | rung never engages for cottage/gatehouse/church; conditional params key; verified by regenerating all and `git diff` on the three legacy records |
| No judges, no constants, tests green | recognition call only; zero new thresholds (committed map data only); `npm test` |
