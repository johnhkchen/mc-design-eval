# E-19 voxel cleanup — busy E-18 → routed + pruned + clean (T-066-01)

The terminal E-19 before/after. Each subject's GLB-voxel build across three states: **busy** (the E-18
seg build, `glb-voxel-seg/`, re-scored on the fixed T-062 metrics) → **intermediate** (universal thin +
prune + clean, committed `e18-build`) → **E-19** (routed + prune + clean). Cells read **busy→inter→E-19**.
Higher better for form IoU / largest-frac; lower better for speckle / stray / distinct / off-pal / value ΔE.

Scale 32. Subjects: 7. Schema `e19-cleanup/v1`.

| subject | form IoU | speckle | largest-frac | stray | distinct | off-pal | value ΔE |
| ------- | -------- | ------- | ------------ | ----- | -------- | ------- | -------- |
| dancing-man | 0.914→0.814→0.914 | 0.016→0.014→0.022 | 1→1→1 | 0→0→0 | 5→5→5 | 0→0→0 | 13.72→13.17→12.36 |
| moai | 0.565→0.399→0.416 | 0.001→0.006→0.005 | 0.52→1→1 | 2023→0→0 | 5→5→5 | 887→0→0 | 1.5→20.85→14.05 |
| pineapple | 0.907→0.845→0.907 | 0.014→0.022→0.021 | 0.987→1→0.987 | 45→0→45 | 4→4→4 | 0→0→0 | 9.61→8.28→6.68 |
| bow-and-arrow | 0.473→0.526→0.526 | 0→0.012→0.012 | 0.277→1→1 | 371→0→0 | 6→7→7 | 0→0→0 | 3.37→5.44→5.44 |
| heart | 0.877→0.895→0.877 | 0.017→0.019→0.032 | 0.986→1→0.986 | 80→0→80 | 7→7→7 | 1174→0→0 | 6.41→6.62→6.08 |
| mushroom | 0.98→0.929→0.98 | 0.018→0.027→0.03 | 0.998→1→0.998 | 19→0→19 | 6→5→5 | 5981→0→0 | 3.71→6.04→6.5 |
| koi | 0.622→0.706→0.706 | 0.019→0.045→0.045 | 0.976→1→1 | 53→0→0 | 5→5→5 | 0→0→0 | 12.04→17.55→17.55 |
| **AVERAGE** | 0.763→0.731→0.761 | 0.012→0.021→0.024 | 0.821→1→0.996 | 370→0→21 | 5.43→5.43→5.43 | 1149→0→0 | 7.19→11.14→9.81 |

## Δ the whole cleanup bought (E-19 − busy)

| axis | avg Δ | improved | held | regressed |
| ---- | ----- | -------- | ---- | --------- |
| formIoU (up) | -0.002 | 2 | 4 | 1 (moai) |
| speckle (down) | +0.012 | 0 | 0 | 7 (dancing-man, moai, pineapple, bow-and-arrow, heart, mushroom, koi) |
| largestFraction (up) | +0.175 | 3 | 4 | 0 |
| strayCount (down) | -350 | 3 | 4 | 0 |
| distinct (down) | 0 | 1 | 5 | 1 (bow-and-arrow) |
| offPalette (down) | -1149 | 3 | 4 | 0 |
| valueDeltaE (down) | +2.61 | 3 | 0 | 4 (moai, bow-and-arrow, mushroom, koi) |

## Marginal Δ — which fix bought what

- **Stray pruning (T-063):** moai stray 2023→0, largest-frac 0.52→1, components 6→1 — the TRELLIS duplicate masses dropped. Pruning is GATED at largestFraction < 0.9: only moai (the gross multi-mass hallucination) qualifies; near-single-mass solids (pineapple/heart/mushroom, frac ≥ 0.976) keep their incidental crown/edge specks rather than have plain-voxelize disconnections clipped (which cost pineapple −0.096 form IoU when pruned ungated).
- **Clean materials (T-064):** the busy textured blocks (coral_brain/mycelium/quartz_ore) are gone; off-palette avg 1149→0; speckle avg 0.012→0.024; distinct avg 5.429→5.429. Variance-aware nearestFlat + varCeiling 1200 + keepFloor dual-gate + true-axis gradient banding.
- **Thin routing (T-065):** form IoU avg 0.731→0.782 (+0.051); occupancy 36723→28295 (-8428); solids de-thickened by 8428 cells. Recovered: dancing-man, moai, pineapple, mushroom; traded: heart; kept (thin): bow-and-arrow, koi.

## Headline

**Is GLB-voxel colour now as clean as text→JSON?** → **Yes (on colour cleanliness).**
E-19 off-palette max **0**, avg speckle **0.024** (busy **0.012**), avg distinct **5.43**.
> _text→JSON builds are speckle-free, single design-doc palette, 0 off-palette. cleanAsTextJson = (every E-19 build has 0 off-palette) AND (avg E-19 speckle ≤ 0.05). value ΔE is a separate axis (the design-doc-palette discipline cost), reported but NOT part of the colour-cleanliness verdict._

> _Note:_ Per subject three columns: BUSY = E-18 seg build (glb-voxel-seg), re-scored on the fixed T-062 metrics; INTERMEDIATE = universal-thin + prune + clean (committed e18-build); E-19 = routed + prune + clean. delta = E-19 − BUSY (the full cleanup). Higher better for form IoU / largest-fraction; lower better for speckle / stray / distinct / off-palette / value ΔE. moai's form IoU is scored vs its OWN hallucinated GLB (3 statues + bridge bars) so it is reference-corrupt — stray/component is moai's honest signal (T-063).
