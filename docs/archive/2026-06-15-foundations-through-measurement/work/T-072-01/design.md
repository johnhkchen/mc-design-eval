# T-072-01 — feature-aware-assignment · Design

Decision-led. Two pure cores — a **geometric feature classifier** and a **feature→block assigner** — plus
an impure runner that applies them to the gatehouse GLB and verifies the restored brick≠cobble
distinction. Grounded in Research; reuses `voxel-components` adjacency, E-14 `nearestLab`, `keysToArtifact`.

## Decision 1 — Classifier output shape: `Map<"i,j,k", feature>`

The AC says `classifyFeatures(occupancy) → Map<cell, feature>`. Cell key = `"i,j,k"` (the established
`indexCells` idiom in `voxel-components`/`material-segment`). **Rejected**: returning an array aligned to
`occupiedCells` order — a Map keyed by coord is what the AC names, is order-independent, and lets the
assigner look a cell up directly while iterating `occupiedCells`. Features are the 5 AC strings, frozen as
`FEATURES`.

## Decision 2 — Feature definitions: band ∪ exposure, deterministic priority

A cell gets **exactly one** feature via a fixed priority. Two axes of geometry: **vertical band** (j
extremes → base/roof) and **horizontal exposure** (how many sides are open → corner/face, and whether the
opening is recessed). Precompute per cell from a `Set` of occupied `"i,j,k"` keys (reuse `FACE_DIRS`):

- `surface` = any of 6 face-neighbors empty (interior cells default to flat-face — hidden body).
- `upwardFacing` = +y neighbor empty.
- `horizExposed` = count of empty neighbors among ±x, ±z (0–4).
- `jMin`/`jMax` over occupied cells.

**Priority (first match wins):**
1. **base** — `j < jMin + BASE_BAND` (default 1). The lowest layer. Symmetric with roof; matches the
   synthetic "lowest layer → base."
2. **top-roof** — `upwardFacing AND j ≥ jMin + ceil(UPPER_FRAC·(jMax−jMin))` (UPPER_FRAC=0.6). Upward-
   facing surface in the upper region. Catches a gable's whole slope (all slope cells face up) *and* a
   flat prism's top course, without painting every wall's top course as roof low down.
3. **opening-recess** — a surface cell exposed horizontally in some direction `d` where the empty exterior
   cell `C+d` is itself **flanked by occupied wall** (≥ `RECESS_FLANK`=2 occupied in-plane face-neighbors).
   This is the "inset/reveal" test: open air outside a flat wall has 0 flanking; the back of a notch/jamb
   has 2 (the side walls). Local, deterministic, color-free.
4. **edge-corner** — surface cell with `horizExposed ≥ 2` (exposed on two+ horizontal sides = a convex
   vertical edge / corner column). "Few-neighbor / convex verticals" per the AC.
5. **flat-face** — everything else: `horizExposed == 1` (a broad wall face) or interior body.

**Why band beats edge-corner:** the synthetic top/bottom layers' corner cells must read top-roof/base
(the AC's "top→top-roof, lowest→base"), so the band claims them; a corner *column*'s long mid-run still
reads edge-corner. **Why recess beats edge-corner:** an arch reveal is exposed on 2 sides too, but its
identity is the opening, not a corner.

**Rejected alternatives:**
- *Pure upward-facing → roof* (no band gate): paints every wall's top course as roof on a flat-top
  building. Rejected — the upper-region gate fixes it.
- *Convex/concave curvature via 26-neighborhood eigenanalysis*: heavyweight, GL-adjacent in spirit,
  non-obvious determinism. The 6-neighbor band∪exposure rules are enough for architectural zoning (the
  ticket: "most architectural material zoning follows form, so a pure geometric classifier suffices").
- *SAM / learned segmentation*: explicitly out of scope ("no SAM").

## Decision 3 — Feature → placementRule mapping (the join to the map)

A frozen 1:1 table `FEATURE_RULE`:
| feature | placementRule |
|---|---|
| flat-face | walls |
| edge-corner | corners-edges |
| top-roof | roof |
| base | base |
| opening-recess | openings |

`trim` has **no feature** — the coarse classifier can't isolate a 1-block voussoir ring from geometry
alone. Consequence: a map's `trim` block is **not placed geometrically**. Documented as a known limitation
(the colorimetric fallback may still surface it for a cell whose color is nearest the trim block). This is
honest to "most architectural zoning follows form" — trim is the exception that doesn't.

## Decision 4 — Assigner: feature-primary, colorimetric fallback

`assignFeatureBlocks(occupancy, features, map, opts) → keys[]` (bare keys, `occupiedCells` order):

For each cell, in `occupiedCells` order:
1. `feature = features.get("i,j,k")` → `rule = FEATURE_RULE[feature]` → look up the map entry for that
   rule. **If present → place that block (PRIMARY).** This is what restores brick≠cobble: the block is
   chosen by *where the cell is*, never by its color.
2. **Silent-map fallback** — no map entry for the rule (e.g. gatehouse `base`): use the **colorimetric
   matcher**. If `opts.colors` (3·count, `occupiedCells` order) is provided, `nearestLab(srgbToLab(rgb),
   palette)` over the **map's palette** (`paletteFromMap` + block-table Lab). Else use `opts.defaultBlock`
   (default: the `walls` block, else the first palette block) — keeps the core usable without colors.
3. Strip namespace → bare key for `keysToArtifact`.

"Within-material value" = the same `nearestLab` machinery stays available for cells the map doesn't speak
to; color still drives those. The assigner is **pure** — colors are injected, not sampled here.

**Rejected**: color-primary with geometry as tie-breaker — that's the failure mode E-21 exists to kill
(color collapses brick/cobble). Geometry must be primary; color only fills silence.

## Decision 5 — Where things live (purity)

- `src/form/feature-classify.mjs` — **PURE**: `classifyFeatures`, `assignFeatureBlocks`, `FEATURES`,
  `FEATURE_RULE`, tunables. No GL, no IO, no color sampling, no Date/random. Unit-tested on synthetic mass.
- `benchmarks/sculpture/material-assign.mjs` — **IMPURE runner**: voxelize the gatehouse GLB, sample
  colors, load the saved map, classify → assign → `keysToArtifact` → `assertArtifact` → render → verify
  the manifest carries cobblestone (edge-corner) AND stone_bricks (flat-face), and that sampled corner
  cells are cobble. `--offline` re-verifies from the committed artifact with no GL.

Mirrors the `material-map.mjs` (pure) + `material-map.mjs` runner split, and `e19-build.mjs`'s GL edge.

## Decision 6 — Verification of AC#4 (the brick≠cobble proof)

A pure helper `featureManifest(keys, features, occupancy)` (or inline in the runner) tabulates block ×
feature counts. The committed `material-assign.json` records: distinct blocks in manifest, that
`cobblestone` dominates `edge-corner` cells and `stone_bricks` dominates `flat-face` cells, and a
`brickNotCobbleByFeature: true` flag (both present, assigned by feature not color). This is the manifest
half of "verified in the manifest + render"; the PNG is the render half (gitignored).

## Risks

- **Lumpy GLB** → fuzzy corners; mitigated because the metric is "both materials present, edges trend
  cobble," not pixel-perfect zoning. Documented.
- **BASE_BAND/UPPER_FRAC tuning** — defaults chosen for prism + gable; exposed as opts for the runner to
  override per subject if a render looks wrong. Recorded in `progress.md` if tuned.
- **trim unplaced** — accepted limitation, flagged for the epic (same spirit as T-071-01's door/lantern
  note).
