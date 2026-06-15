# T-087-01 coherent-surface — Research

Descriptive map of what exists. No solutions proposed here (Design's job).

## 1. The ticket in one line

After the T-085-01 zone-fill, the cottage roof still **reads chunky/speckled** and walls carry **stray-
material salt**. S-084 made the roof watertight (coverage), this ticket raises **surface-pattern read**:
(a) roof-course coherence (regular stepped courses), (b) intra-zone stray-salt strip (isolated speck →
field; legitimate secondary run/line → kept). Both pure + unit-tested, run on the cottage, before/after
recorded, `npm test` green.

## 2. Witnessed state of the cottage (measured on `spray-paint/cottage/artifact.json`)

Measured with the existing pure modules (`artifactOccupancy` → `roofRegion`/`structuralZones`/
`surfaceZoneHistogram`), 2026-06-10:

- **Roof top surface (+y projection)**: 662 columns, yRange [7, 26], outline coverage 0.796 over bbox.
  Per-y spread is messy (no clean course bands): y22=122, y20=72, y19=71 … y13=1, y7=1.
- **Course noise (the "chunky jumble")**: of 1262 adjacent-column pairs, **626 flat (Δy=0), 363 step-1,
  273 cliff (Δy>1)** — 21.6% of adjacent pairs jump more than one block; mean |Δy| = 0.983. The concept's
  roof is clean stepped plank courses (step-1 bands); the render confirms the jagged read.
- **Roof material salt**: on the top surface, **13 isolated cobblestone singletons** and **3 isolated
  dark_oak_planks singletons** (4-connected plan components, ramp |Δy|≤1); spruce_planks itself fragments
  into 32 components (318, 118, 54, 45, 42, 14, …) — fragmentation is geometric, not material.
- **Zone-skin histogram** (5-face skin, `surfaceZoneHistogram`): roof 1214 = spruce 1080 / cobble 91 /
  dark_oak_planks 43; upper 638 = plaster 454 / dark_oak_log 184; base 598 = stone 370 / log 159 /
  cobble 69. The 91 roof-zone cobble ≈ the chimney shaft (legit, side-exposed) + the top-surface salt.

## 3. Why the salt survived T-085-01 (the precise gap)

`zoneFill` (src/view/zone-fill.mjs) keeps an off-dominant skin cell iff its material is in the zone's
`preserve` set AND it sits in a **6-connected same-material component ≥ minRun (=2) over the FULL
occupancy** (`inRun`, interior continuation counts). Two consequences:

1. **minRun=2 is weak**: a surface speck with ONE same-material neighbour — even a buried interior one —
   survives. The 13 roof cobble singles each connect to something cobble below/behind the skin.
2. cobble/dark_oak_planks are in roof's `preserve` (chimney, eaves/verge are legit) — so the *material*
   is lawful; only its *pattern* (isolated speck vs coherent run) is wrong. Pattern is exactly what
   zoneFill does not model.

Prior art for speck-stripping, and why neither closes this:

- `faceIntrusions` (surface-coherence.mjs): per-elevation 2-D test — non-field cell whose present
  4-neighbours are strict-majority field. Runs at SEAL time (§0, pre-fill) with the *face* dominant, not
  the zone dominant; misses 2-cell cliques and anything on the +y roof grid; never re-run post-splat.
- `roofCandidates` (roof-patch.mjs): flags ALL non-dominant roof cells as stray (would strip the chimney);
  it is a detector prior for the light-tier LLM, not a pattern-aware op.

## 4. Where the roof noise comes from / what bounds a fix

- The roof geometry accreted across passes: seal fills holes at neighbour-flush height
  (`neighbourDepthW`), splats recolor only — nobody ever regularized the height field. Dents/pits and
  ±2 cliffs are the residue.
- **No-delete invariant** (`facade-recess-by-exclusion`, restated in surface-coherence.mjs header): the
  artifact contract has NO air op; ops emit appended `{op:"voxel"}` placements only — a RECOLOR at an
  existing voxel or an ADD at an empty one. Bumps above a course **cannot be lowered**; only pits/dents
  can be raised and materials recolored. Any regularizer must be add+recolor-only.
- The cottage roof is **cross-gabled** (concept: two intersecting ridges + chimney): real **valleys**
  exist where roof planes meet. A valley drains to an eave (open at the boundary); a defect-pit does not.
  Any smoothing rule must distinguish draining concavities (keep) from enclosed basins (defects).
- The chimney (cobble shaft, cap cells at y=26) legitimately pokes above the roof field — a course rule
  keyed on "everything at one y" would mangle it.

## 5. The module landscape (what a fix composes with)

All pure cores live in `src/view/`, tested under `npm run test:unit` glob `src/**/*.test.mjs`:

- `occupancy.mjs` — `artifactOccupancy` (via `expandArtifact`, last-write-wins), `bareBlock`,
  `occupancyFromCells`. The one artifact→occupancy adapter.
- `surface-grid.mjs` — `projectSurface(occ, dir)` → per-cell `{block, depth, voxel, normal}`;
  `orthoSpec`, `cellWorldPos` (world pos for an EMPTY cell — how seals place new voxels), `gridMaskOf`.
- `structural-read.mjs` — `roofRegion` (+y top cells `{x,z,y,block}`, coverage), `structuralZones`
  (geometry-derived `zoneOf`: base/upper/roof; roof = membership + y≥upperTop), `airComponents`.
- `zone-fill.mjs` — `zoneFill` (the base coat; policy as data), `surfaceZoneHistogram` (per-zone skin
  census — the coverage seam), `FILL_FACES` = 4 elevations + roof top. `surfaceVoxelEntries` (the skin
  iterator) is module-private.
- `surface-coherence.mjs` — `sealRoof`/`sealWalls`/`watertightCheck`, `overlay` (occ + deltas, measure
  without re-render), `applyDeltas` (artifact + deltas). Establishes the op-result idiom:
  `{placements, counts, before:{...}, after:{...}}` with ‰-rounded metrics.
- `face-paint.mjs` — `applyPaint` (same append semantics as `applyDeltas`).

## 6. The runner landscape (where the cottage run lives)

- `benchmarks/sculpture/spray-paint.mjs` (`npm run spray:paint`) — T-085-01's runner: seal → zone-fill
  base coat → splat secondaries → gates → `spray-paint/cottage.json` (record incl. `fill.policy` = the
  ZONE_POLICY: dominants + preserve + splat sets) + `cottage/artifact.json` (AJV-valid painted build) +
  before/after face PNGs (gitignored). Has an `--offline` re-assert mode. **Owned by T-085/T-088 turf**:
  T-086-01 explicitly did NOT touch it ("T-085 owns it") and built its own runner instead.
- `benchmarks/sculpture/value-select/` (T-086-01 precedent) — a sibling runner that CONSUMES
  `spray-paint/cottage/artifact.json`, applies its pure op, writes its own durable record
  (`value-select/cottage.{json,md}` + recolored `artifact.json`), best-effort GL renders, `--offline`
  re-assert. This is the established pattern for a post-spray-paint surface op.
- Render helper idiom: `tryRenderFace` (spray-paint.mjs) — best-effort `renderViews` import, degrades to
  a recorded `{error}` instead of crashing (GL is never load-bearing for the deterministic record).
- npm scripts are one-per-runner (`spray:paint`, `value:select` style) in package.json.

## 7. Test conventions

`zone-fill.test.mjs` is the template: a hand-counted synthetic hut (`occupancyFromCells`), policy passed
as data, hand-rolled `zoneOf` (tests must not depend on `structuralZones`), geometry-safety asserted via
`expandArtifact` pos-set equality after `applyPaint`, per-zone counts asserted exactly. node:test +
assert/strict. Current suite: 1005 tests green.

## 8. Constraints & assumptions surfaced

1. **Recolor + add only; never delete** (artifact contract, §4). Bumps are unfixable; honest residual
   metrics are the house style (T-085 recorded 71% vs the wished-for 77%).
2. **Pure core / impure runner split** is mandatory (every module header restates it); the metered/GL
   work stays in benchmarks/.
3. **Policy as data**: nothing cottage-specific may land in src/ (zone names, materials come from the
   caller; the runner reads `rec.fill.policy` or its own copy).
4. **Concurrency**: T-088-01 (coverage gate, same `depends_on: [T-085-01]`) runs in parallel and wires
   into the per-face/resemblance gate; `parallel-roots-duplicate-shared-deps` says avoid shared-file
   edits — spray-paint.mjs should not be modified by this ticket.
5. **Skin definition**: "visible skin" = `FILL_FACES` 5-face union, deduped by voxel — the lens-visible
   set every E-24 metric uses. A new op should reuse, not refork, this definition (currently private).
6. **Zone membership**: `structuralZones().zoneOf` is geometry-derived and stable post-recolor; adding
   voxels on top of the roof keeps them in "roof" (membership by +y exposure / y≥upperTop).
7. **The concept's roof banding is single-material**: stepped geometry + lighting produce the bands;
   dark_oak eave/verge trim are linear runs. So "course coherence" is mostly a GEOMETRY property plus
   salt removal, not a multi-material striping scheme.
8. T-086-01's value-select record may later swap dominants (white_terracotta→sandstone etc.); any new op
   must take dominants as parameters so it composes with either palette.

## 9. Open questions for Design

- Course regularization mechanics under add-only: local pit-raise vs basin-fill-to-spill-level vs
  course-model fit; how valleys (must drain, must not fill) and the chimney are excluded.
- Run/line test for salt: skin-component size threshold vs shape (elongation) test; what keeps a 3-cell
  stud but strips a 2-cell clump; whether connectivity is per-zone or whole-skin (chimney crosses zones).
- Metric to record: step-smoothness (fraction of adjacent pairs |Δy|≤1, today 0.784), mean |Δy| (0.983),
  cliff count (273), salt component count (16 on the roof top alone).
- Runner shape: sibling runner consuming spray-paint's artifact (T-086 precedent) vs editing
  spray-paint.mjs (turf conflict with T-088).
