# T-058-02 — Research: enforce design-doc palette as a guarantee

Epic **E-18**. Descriptive map of every voxel-build path that assigns block colors, what palette each
currently snaps within, where the discipline is already kept, and where it leaks. No solutions here.

## The root cause (recap, for grounding)

The persistent speckle/palette-bloat was a single defect: the CIE-Lab voxel picker (`nearestLab`) snapped
each occupied cell to the nearest of a **large candidate universe** instead of the few blocks the design
doc chose. Two flavors of "large universe" existed:
1. **Full 305-block table** (`blockPaletteFromTable`) — R1's original default.
2. **Median-cut of the noisy TRELLIS texture** (`extractTexturePalette(...).snapPalette`) — R2/seg default
   when no palette is supplied.

The fix (commit `62dadc4`, T-058-01/T-058-03): `paletteFromManifest(manifest, table)` restricts candidates
to the design-doc manifest; `glbVoxelBuild` and `segmentMaterials` both accept `opts.palette`; T-058-03 adds
`augmentPalette` — design-doc palette ∪ **≤K=2 gated secondary** table blocks (a strictly gated escape valve
for genuine texture colors the manifest under-serves). This ticket makes the discipline a **guarantee**:
audit every path, regenerate the committed artifacts, add a guard.

## The build paths (entry points that assign block colors)

### Color primitives — `src/form/glb-voxel-build.mjs`
- `blockPaletteFromTable(table)` → the **full 305-block** palette. This is the "universe" the fix moved
  away from. Still the **default** of `colorVoxelsToArtifact` when `opts.palette` is absent (line 165:
  `opts.palette ?? blockPaletteFromTable()`). Any caller that forgets `palette` silently reopens the bloat.
- `paletteFromManifest(manifest, table)` → the **design-doc palette** (namespace-tolerant; non-full-cube
  manifest entries dropped; throws if nothing resolves). The candidate set the fix mandates.
- `colorVoxelsToArtifact(occupancy, colors, {palette})` → snaps each cell color via `nearestLab` over
  `palette`. `keysToArtifact` builds the manifest from placed blocks (`[...new Set(...)].sort()`).
- `glbVoxelBuild(glb, {palette, augment, ...})` → R1 core. After decode, **if `augment && palette`** it
  replaces `pal` with `augmentPalette(pal, texture, ...)` (lines 253–257), then `colorVoxelsToArtifact`.
  So R1 honors the design-doc palette only when the **runner** passes `palette`, and augments only when the
  runner passes `augment`.

### Gated secondary — `src/form/palette-augment.mjs` (T-058-03)
- `augmentReport` / `augmentPalette(designDocPalette, texture, table=loadBlockTable(), opts)`. Pure,
  GL-free. Four gates (drift>12, coverage≥5%, fit≤6, gain≥6) + cap **K=2**. Returns design-doc ∪ secondary.
  Most subjects add 0–2 (see `secondary-palette.json`: dancing-man 0, pineapple 0, koi 1, the rest 2).

### R-seg — `src/form/material-segment.mjs`
- `segmentMaterials(build, {palette, augment, ...})`. Candidate set = `opts.palette ?? extractTexture
  Palette(...).snapPalette` (line 470) — **falls back to the texture median-cut** when no palette given.
  If `opts.augment`, augments `snapPalette` (lines 473–476). `keysToArtifact` builds the manifest.
- All region fills (`fillRegion`/`bandRegion`) snap within `snapPalette`, so off-palette is 0 **relative
  to whatever `snapPalette` is** — design-doc only if the runner supplied it.
- `offPaletteCount(keys, palette)` — the leakage metric: count of placed keys not in `palette`'s key set.

## The runners (where `palette` / `augment` are actually decided)

| Path | Runner | `palette`? | `augment`? | Verdict |
| ---- | ------ | ---------- | ---------- | ------- |
| **R1** | `glb-voxel-breadth.mjs` | ✅ `paletteFromManifest(designManifest)` (l.197–199) | ❌ none | design-doc, **not augmented** |
| **R2/seg** | `glb-voxel-seg.mjs` | ✅ `paletteFromManifest` (l.211) | ❌ none | design-doc, **not augmented**, + **bug** |
| **integrate** | `e18-remeasure.mjs` | ❌ **none passed** (l.177–186) | ❌ none | **texture median-cut — VIOLATION** |
| **R3 surgical** | `glb-voxel-surgical.mjs` | inherits R1 artifact | n/a | no color-snap step; LLM `swap` caveat |
| (secondary record) | `secondary-palette.mjs` | ✅ `paletteFromManifest` | ✅ `{table}` | already correct (the T-058-03 record) |

### R1 — `glb-voxel-breadth.mjs`
Reads `runs/<run>/artifact.json`.`palette.manifest`, builds `paletteFromManifest(designManifest)`, calls
`glbVoxelBuild(glb, {scale, decodeTexture, palette, ...})`. **Honors the design-doc palette.** Does **not**
pass `augment`, so the gated secondary is never applied — AC#1 wants the *augmented* design-doc palette as
the candidate set everywhere. Writes `glb-voxel/<subj>/{artifact,summary}.json` + `r1.{md,json}`.

### R2/seg — `glb-voxel-seg.mjs`
Builds `palette = paletteFromManifest(designManifest)` (l.211), passes it to `segmentMaterials`. **But** the
local was renamed from `snapPalette` to `palette` and **five later references still read `snapPalette`**
(l.233, 248, 263, 280, 281) — an undeclared identifier → **`ReferenceError` on any live run**. It is GL/host
(not in `npm test`) so it has never surfaced. Flagged in T-058-03 review concern #1 as an E-18 follow-up;
this ticket is the place to fix it. Also does not pass `augment`.

### integrate — `e18-remeasure.mjs` (T-060-01) — the core violation
Line 174 extracts `segPalette = extractTexturePalette(texture, {k:6}).snapPalette` (texture median-cut) and
line 177–186 calls `segmentMaterials({occupancy: occThin, surface, texture}, {metadata, style})` **with no
`palette`** → `segmentMaterials` falls back to its own texture median-cut. So the combined build snaps over
a **noisy-texture median-cut palette**, exactly the universe the fix forbids. Worse, `offPalette` is measured
against `segPalette` (the same median-cut), so it reads **0 by construction against the wrong reference** —
the record *looks* compliant but is not the design-doc discipline. This is the build T-061 consolidates, so
it must be corrected. (Confirmed in session observation 11721.)

### R3 surgical — `glb-voxel-surgical.mjs`
Reads the R1 `glb-voxel/<subj>/artifact.json` as input and runs the E-15 region loop with a 3-D form target.
It does **not** re-snap colors over any palette — it edits geometry within regions. The only block-
introducing step is the LLM editor's `swap` op (`form-edit.mjs` l.168–172) which sets an arbitrary block
string; `applyRegionEdit` (`region.mjs` l.308) rebuilds the manifest from placed blocks. So R3 *could*
introduce a block outside the inherited palette — but that is a deliberate **form** edit, not a universe
color-snap, and in the committed run every region rolled back (`keptCount` per subject). For the palette
audit R3 is **compliant by inheritance**: it carries R1's palette and has no median-cut/full-table snap. The
LLM-`swap` unconstraint is a noted caveat, out of this ticket's color-snapping scope.

## Verification & guard surfaces

- **`offPaletteCount(keys, palette)`** (material-segment.mjs) — the leakage count. Reusable for both the
  record and a guard, but currently only *counts*; it does not throw.
- **`assertArtifact`** (src/artifact.mjs) — the AJV gate every runner already calls; a palette guard is the
  analogous "consumer-side assert" but over palette membership, not schema.
- **No guard exists today** that fails loudly when a manifest block falls outside the (augmented) design-doc
  palette. AC#5 requires one.
- **The record `palette-discipline.{md,json}`** (AC#4) does not yet exist. The closest precedent is
  `secondary-palette.{md,json}` (per-subject design-doc size, added secondary, off-palette 0, total ≤ size+K)
  — generated live at scale 32, all 7 subjects, GLBs + dwebp present on this host.

## Constraints & assumptions

- **Form IoU is invariant under palette choice for a fixed voxelization** — palette only changes block
  *colors*, never which cells are occupied. So R1/seg/integrate form IoU cannot be harmed by the augmented
  palette vs the design-doc-only or full-table palette over the *same* occupancy (AC#6 is provable, not just
  measured). The committed summaries' `silhouetteIoU`/`formIoUAfter` are the recorded reference.
- **GL/host split holds:** the pure cores (`glbVoxelBuild`, `segmentMaterials`, `augmentPalette`,
  `paletteFromManifest`, `offPaletteCount`) are unit-tested offline; renders/dwebp/GLBs live only in runners,
  not CI. A new guard belongs in `src/` (pure, unit-tested); the record belongs in a runner.
- **The pre-fix "before" numbers** (e.g. heart 91 distinct) come from the full-table snap. To show the
  before→after drop honestly, the record can recompute the full-table distinct count per subject (same
  voxelization, `blockPaletteFromTable` candidate set) alongside the augmented-palette build.
- **dwebp on this host is `/opt/homebrew/bin/dwebp`;** `timeout` is absent on macOS (`gtimeout`) — run sweeps
  without a shell timeout. All 7 GLBs + `runs/<run>/artifact.json` design manifests are present.
