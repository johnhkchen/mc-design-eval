# T-090-01 full-shell-zone-fill — Research

Epic E-25 / Story S-090. Descriptive map of what exists; no solutions proposed here.

## 1. The ticket in one line

The E-24 zone-fill (T-085-01) recolors only the **projection skin** (union of five `projectSurface`
views); the camera sees the **whole exposed shell**. Cells exposed on faces no projection ray reaches
(side faces of stepped roof courses, under-eave wall cells) keep their collapsed grey material, so at
oblique azimuths the roof reads as a grey-brown jumble. The fix: enumerate the zone surface by
**6-direction exposure**, not by projection membership.

## 2. Modules and how they connect

### `src/view/zone-fill.mjs` (169 lines, PURE) — the module this ticket extends

- `FILL_FACES = ["+x","-x","+z","-z","+y"]` — the five visible faces (no `-y` underside).
- `surfaceVoxelEntries(occ, faces)` — **THE canonical skin iterator**: union of the per-face
  `projectSurface` grids, deduped by voxel key. Yields `{key, voxel, block}`.
- `zoneFill(occ, {zoneOf, zones, faces, minRun=2})` — for each skin voxel with a zone policy:
  keep if already the zone dominant, keep if in the zone's `preserve` set AND part of a same-material
  6-connected RUN ≥ `minRun` (flood over the FULL occupancy, memoized — `inRun`), else emit a recolor
  placement `{op:"voxel", pos, block: dominant}`. Returns `{placements, filled, kept, byZone}`.
  **Recolor-only invariant**: every placement targets an existing voxel; no air op; geometry untouched.
- `surfaceZoneHistogram(occ, zoneOf, {faces})` — per-zone `{total, byBlock}` census of the same skin.
- `dominantCoverage(hist, zones)` — decorates the census with `dominant`/`dominantFraction` (‰-rounded);
  consumed by the T-088-01 coverage gate.

### `src/view/surface-grid.mjs` — why the enumeration under-covers

`projectSurface(occ, dir)` marches each (u,v) ray from the camera plane and keeps the **first occupied
voxel** — a bijective paint canvas by design. Consequence: a voxel occluded along all five ray
directions but still air-adjacent (e.g. the +x side face of a roof course whose ray is blocked by the
eave overhang, or an under-eave wall cell shadowed from +y by the eave and from ±x/±z by the course
above) is **never enumerated**, yet its exposed face is visible from any oblique camera. Ortho + 45°
diag only; arbitrary oblique throws.

### `src/view/structural-read.mjs` — zone classification

`structuralZones(occ)` → `{zoneOf, storeyDivide, upperTop, roofKeys, floorLines}`. Geometry-derived:
`roof` = membership in the +y top-exposed `roofRegion` OR `y >= upperTop`; `upper` = `y >= storeyDivide`;
`base` below. On the committed cottage: `storeyDivide=7`, `upperTop=14` — exactly the ticket's bands.
Floor-line-bounded as the ticket requires.

### `benchmarks/sculpture/spray-paint.mjs` (impure runner, `npm run spray:paint`)

Pipeline stages: §0 seal (`sealRoof`/`sealWalls`) → §0b `structuralZones` + per-zone splat palettes →
§0c **zone-fill base coat** (`zoneFill` on the sealed occ; `applyPaint` → `based`) → §1 per-face targets
(concept quantize for +z, GLB splat for +x) → §2 splat paints secondaries over the coat → §2b proof
replays (unmasked smear; legacy splat-only baseline + its coverage + its **coverage-gate REJECT**) →
§4 per-face accept gates (coverage precondition `acceptWithCoverage`, then accept-if-closer) →
§5 commit, strip off-zone plaster, **two hard throws** (base/roof surface plaster ≠ 0; final-skin
coverage gate fail) → §6 durable record `spray-paint/cottage.json` + `cottage.md` +
`cottage/artifact.json`. `--offline` replays assertions against the committed record with
skip-if-absent degradation for fields older records lack.

`ZONE_POLICY` (runner-owned, derived from the E-21 material map): base `stone_bricks`
(preserve cobblestone, dark_oak_log) · upper `white_terracotta` (preserve dark_oak_log, spruce_planks,
dark_oak_planks) · roof `spruce_planks` (preserve dark_oak_planks, cobblestone, bricks). The chimney
is preserved today **via runs** of roof-preserve cobble/bricks, not via any region concept.
`dark_oak_log` is NOT in roof preserve.

### Render path for the AC #4 evidence

`src/view/multi-angle.mjs` `renderViews(artifact, angles, {outDir, label})` accepts named diagonals
`"+x-z"` (azimuth 135°) and `"-x-z"` (azimuth 225°) — exactly the oblique azimuths the ticket names.
PNGs land in the runner's subject dir; the existing `tryRenderFace` helper wraps render + decode +
optional resemblance. Per-runner PNGs are gitignored by dedicated entries (obs 12853), though
`spray-paint/cottage/view-*.png` exist on disk today.

## 3. Measured baseline (committed artifact, regenerated 2026-06-10 9:46 by T-088-01)

Reproduced with a throwaway script (6-neighbor air test per occupied cell; `structuralZones` zoneOf):

- Occupancy: 6,438 cells, bounds [-13,0,-16]..[12,26,15].
- **6-dir exposed cells: 5,338** vs the 5-face projection skin's **2,450** (roof 1,214 + upper 638 +
  base 598) — the projection enumerates under half the exposed shell.
- Exterior-reachable vs any-air exposure differ by only **10 cells** (the cottage mass is solid; no
  meaningful internal cavity in this artifact).
- Per zone, 6-dir exposed composition (the camera's truth):
  - **roof** (2,373): spruce_planks 55.4%, stone_bricks 25.9% (615), cobblestone 9.0% (214),
    dark_oak_log 7.5% (179), dark_oak_planks 2.1%. On the projection skin the same zone reads
    spruce 89% — the grey lives almost entirely on un-projected side faces.
  - **upper** (1,409): stone_bricks **48.8%** (687), white_terracotta 32.2% (454), dark_oak_log 16.0%,
    cobblestone 2.6%. The projection skin shows upper stone = **0** — every residue cell is
    under-eave/edge cells the wall-field enumeration missed.
  - **base** (1,546): stone_bricks 60.2%, dark_oak_log 27.7%, cobblestone 8.0%, spruce 3.6%.
- The ticket's figures (42.7% roof spruce, 28.3% upper stone) were measured on the pre-09:46 artifact;
  the regenerated artifact reads 55.4% / 48.8%. Same defect, same direction; fresh numbers above are
  the working baseline. The AC targets (roof ≥90% roof materials, upper stone ≤5%) are unchanged.
- Subset relation (verified by construction): every projected surface cell's camera-side neighbor at
  depth−1 is air, so the **projection skin ⊆ the 6-dir exposed set**. A full-shell fill strictly
  supersets the E-24 wall-field fill.

## 4. Tests and proof patterns

- `zone-fill.test.mjs`: synthetic 5×5 two-storey hut (stone base + quoin run, collapsed stone upper +
  stud run + speck, spruce slab roof + stray + 2-cell bricks chimney); hand-counted surface censuses;
  geometry-safety via `expandArtifact` pos-set equality; `minRun` behavior; histogram/coverage
  composition. The ticket's named synthetic cases (stepped roof with grey side cells; stud run) slot
  into this exact pattern. Hut surface counts are projection-based (48/48/26) — exposure-based counts
  for the same hut will differ (interior column bottoms at y=0, occluded step sides).
- Full suite: **1,014 tests green** (`npm test`, 1.5 s) as of HEAD `ada0472`.
- Offline replay (`--offline`) asserts on recorded fields with graceful degradation when a field is
  absent — the precedent for adding new record fields.

## 5. Constraints and live concurrency

- **`surfaceVoxelEntries` has an external consumer**: `surface-pattern.mjs` (T-087-01, committed
  `ada0472`, runner wiring still in flight on a parallel thread) calls it with `faces = FILL_FACES`.
  Its contract (projection-skin iterator) must not change semantics under that consumer.
- The T-088-01 coverage gate (`coverageGate`, `acceptWithCoverage`, threshold 0.5) consumes
  `dominantCoverage(surfaceZoneHistogram(...))` — the census **basis** (projection vs exposure) is a
  decision this ticket must make and record; predicted post-fill exposure-based fractions (upper ≈.84,
  roof ≈.89, base ≈.64) all clear 0.5 either way.
- E-24 Rule 1: no hand edits — everything reproduced by `npm run spray:paint`. E-25 Rule 1: the render
  is the evidence, the histogram is support. E-25 Rule 3: no subject-specific constants in the pure op.
- PURE module rules: no GL/I-O/Date/random in `src/view/*`; runners are the impure wiring.
- Memory `facade-recess-by-exclusion`: there is no air op — fills are recolors, never carves; the
  recolor-only invariant must hold for the full-shell op too.
- `-y` faces: the 6-dir exposure definition counts bottom faces (every y=min cell is "exposed" below);
  these are render-invisible but inflate the census. The ticket's own measurement ("6-dir exposure per
  band") includes them; the baseline numbers above include them.
- Hollow interiors: a 6-dir exposure fill would also recolor interior-cavity skins (future hollowed
  builds; E-23 cutaway/floorplan path). On this artifact the difference is 10 cells; the
  exterior-reachable flood (border flood over the padded AABB) is the known discriminator if needed.
- `dark_oak_log` in the roof zone (179 exposed cells, likely gable framing classified "roof" by
  `y>=upperTop`) is not in roof preserve — a full-shell fill under the current policy recolors it to
  spruce. Whether to extend the policy is a Design-phase call (policy is runner-owned, not a constant
  in the pure op).

## 6. Open questions carried to Design

1. New enumerator alongside `surfaceVoxelEntries` vs an option on it — additive change required
   (T-087-01 consumes the current one).
2. Replace the E-24 wall-field fill stage or run full-shell after it (ticket: implementer's call,
   recorded). Subset relation says replace is loss-free.
3. Census basis for the recorded coverage + gate after this ticket (projection vs exposure).
4. "Declared sub-regions" (chimney): runs-based preserve already keeps it on the cottage; does the op
   need an explicit region mechanism to satisfy AC #1 as written?
5. Roof-zone `dark_oak_log`: preserve (policy extension) or fill (current policy)?
