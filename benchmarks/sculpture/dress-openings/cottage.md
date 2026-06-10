# Opening dressing — cottage (T-099-01)

The kit's declared treatment applied to every opening the concept declared. **Reproducible**: double-run placement-identical, dressed artifact sha256 `316246890ce6bf6d…`.

## Treatments (from `kit/cottage.json`)
`infill` → `spruce_fence` (derived-species-fence) · `shutter` → `spruce_trapdoor` (kit-fixture) · `door` → `spruce_door` (kit-fixture) · `light` → `lantern` (kit-fixture) · `frame` → `spruce_planks` (kit-trim)
- derived: `spruce_fence` ← `spruce_trapdoor` — no rail entry in kit; species-matched fence derived from the shutter block (the kit declared the window grille unidentified)

## Openings (measured on `concept-materials/cottage/after-artifact.json`)

| face | kind | bbox | applied | conflicts |
|---|---|---|---|---|
| +x | window | u6..6 v12..12 | infill=1 shutterRight=1 | shutterLeft:shutter-no-jamb-left→shutter-dropped; lintel:lintel-no-band-cells→lintel-skipped; sill:sill-no-band-cells→sill-skipped |
| +x | window | u14..14 v17..17 | infill=1 shutterLeft=1 lintel=1 sill=3 | shutterRight:shutter-no-jamb-right→shutter-dropped |
| +x | window | u5..6 v20..20 | infill=2 shutterRight=1 lintel=4 sill=4 | shutterLeft:shutter-no-jamb-left→shutter-dropped |
| -x | window | u25..25 v12..12 | infill=1 shutterLeft=1 shutterRight=1 lintel=3 | sill:sill-no-band-cells→sill-skipped |
| -x | window | u17..17 v17..17 | infill=1 shutterLeft=1 shutterRight=1 lintel=3 sill=2 | — |
| -x | window | u25..26 v20..20 | infill=2 shutterLeft=1 shutterRight=1 lintel=4 sill=4 | — |

42 placements; 6 conflicts; 0 already dressed.

## Integrity (T-097 semantics)
- openings on the shipped target: **0 before → 6 after** (6 report dressing) — the sealed panes are OPENINGS again, dressed.
- closure (non-regression gate): baseline 2602 reached → dressed 2602 reached, **8 dressed cells** (dressed ≠ hole, dressed ≠ wall). the shipped skin never had a closure stage; the gate is NON-REGRESSION under the concept-declared allow-list (ref openingRegions ∪ the op's footprint regions, D8).
- stray fixtures: 9 under the bare declared regions → **0** under the composed allow-list.

## Acceptance
- windows: **6/6 dressed** (infill everywhere; 3 fully shuttered, 9/12 shutter sides — the misses are named no-jamb reductions where the skin sealed a window as a floating pane with no wall around it).
- door: none detected — none-detected: the doorway is not a through-hole; `openings` is silhouette-based and cannot see it (T-099 design D7 — named honesty row, detector gap for S-101)

## Renders
- before right: benchmarks/sculpture/dress-openings/cottage/view-before-right.png
- after right: benchmarks/sculpture/dress-openings/cottage/view-after-right.png
- before left: benchmarks/sculpture/dress-openings/cottage/view-before-left.png
- after left: benchmarks/sculpture/dress-openings/cottage/view-after-left.png
- before +x+z: benchmarks/sculpture/dress-openings/cottage/view-before-+x+z.png
- after +x+z: benchmarks/sculpture/dress-openings/cottage/view-after-+x+z.png
- before -x-z: benchmarks/sculpture/dress-openings/cottage/view-before--x-z.png
- after -x-z: benchmarks/sculpture/dress-openings/cottage/view-after--x-z.png

Frames: pr/assets/frames/dress-cottage-before.png, pr/assets/frames/dress-cottage-after.png

> no LLM on this path — the kit record, raw reference, and shipped target are committed inputs; the dressing core is pure. Two executions placement-matched.
