# T-159-01 Progress — generate-first watertightness

## Status: implement (verifying render proof + replay)

## Done

### Diagnosis (Research, confirmed empirically)
- Rendered final `artifact.json` AND raw `base-artifact.json`: roof is solid (≥4/6 census: 81 cells,
  only 2 spruce), **walls holey** — scattered y4–6 holes + comb slots, front/back aligned (see-through).
- Root cause: walls + openings inherit raw voxelized-blob plan noise. Footprint `mass-0` had **96
  plan-holes** + ragged perimeter; **28 of 42 openings ≤2 cells** (phantom specks). Roof clean because
  it is re-authored parametrically. [[reference-is-spec-not-substrate]].
- A THIRD source found during implement: a giant `head:none` opening (og-2/og-13, 42 of 48 cols wide,
  y10–14) strips the top course off both long walls (eave band). It is the blob's open top, not a
  window — the dimension gate misses it because it is large.

### Code (`src/form/provision-generate.mjs`, additive)
1. **Defaults:** `planCloseRadius:1`, `minOpeningW:2`, `minOpeningH:2`, `maxOpeningSpanFrac:0.8`.
2. **Pure helpers:** `bboxOf`, exported `erodePlan` (hoisted from the inline closure), `dilatePlan`,
   `fillPlanHoles`, exported `regularizePlan` (close + enclosed-hole fill; identity on a clean
   rectangle). Commit pending grouping.
3. **Wall loop:** `cols = regularizePlan(cols, {radius})` before the ring build; both erode call-sites
   use `erodePlan`; inline `erode` closure deleted.
4. **Opening gate (two modes):** skip sub-`minOpeningW×minOpeningH` specks (`opening-incoherent`) and
   skip ≥`maxOpeningSpanFrac×wallExtent` wall-spanning bands (`opening-wall-spanning`); both register
   Rule-1 findings, never silent.

### Tests (`src/form/provision-generate.test.mjs`, additive) — 18/18 green
- erodePlan 4×4→2×2; regularizePlan identity on a clean rect; fills enclosed void; output hole-free +
  extent-preserved; wide-open gap not bridged but loop stays closed.
- opening gate: 1×1 speck skipped + finding; 3×3 real door carved unchanged; 7-wide wall-spanning band
  skipped + finding.

### Empirical proof (first regen, before the span gate)
- `base-artifact` placements 6844→4621; cobblestone 5093→2870 (stray interior-hole rings removed).
- Front wall (z=−13) y4–6 holes **gone**, wall solid. Render
  `pr/assets/frames/diag-base-artifact-barn-fixed.png` shows a solid stone box (was a holey ruin).

## In progress
- Regenerate with the span gate (closes the long-wall eave band y10–13) → re-census + re-render.
- `--repro` determinism; full `npm test`; commit artifacts + proof frame.

## Deviation from plan (documented)
- Added a **third** gate (`opening-wall-spanning`) not in the original design/structure: the giant
  og-2/13 opening is a large-but-spurious aperture the dimension gate cannot catch. It carves a real
  wall-face hole (in scope: "wall faces solid"), so suppressing it is a legitimate extension. General
  fraction default, no per-building constant.

## Known limitation (OUT OF SCOPE — registered)
- **Roof coverage is narrow.** The fitted gable spans only z≈−6..1 (width ~6) of the 26-wide building
  — the loft top is open over most of the plan. This is a **pre-existing roof-FIT defect**
  ([[trellis-facet-normals-lie]]: the barn voxelizes hollow, facet normals misread the pitched roof),
  identical in the committed (pre-fix) artifact. The roof SLOPES are complete (solid wedge) per AC #2;
  roof COVERAGE/footprint width is a separate fit concern for a follow-up ticket (T-123 territory).
  This ticket fixes the wall watertightness it was scoped to fix.
