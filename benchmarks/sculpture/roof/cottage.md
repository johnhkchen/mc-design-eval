# Roof as program — cottage (T-104-01)

The sampled roof replaced by a roof GENERATED from parameters fitted against the component record's GLB fits — stair courses, slab half-steps, solid wedge — swapped under the T-102 cage, behind `npm run roof:cottage`. **Status: ACCEPTED** — reproducible, artifact sha256 `477399990e7c8b68…`.

## Fitted gables
- **gable-roof-0-roof-4** (sane) ridge z @ y 24 — roof-0 → +x: pitch **0.773** (glb, glb∠ 11.544°), eave y 15, overhang 1; roof-4 → -x: pitch **1.884** (voxel, glb∠ 20.383°), eave y 18.5, overhang -3
- **gable-roof-2-roof-3** (sane) ridge x @ y 21 — roof-2 → -z: pitch **0.448** (glb, glb∠ 13.249°), eave y 14.5, overhang -3; roof-3 → +z: pitch **0.924** (glb, glb∠ 3.221°), eave y 15, overhang -7

## Fitted ends (T-108-01)
- **gable-roof-0-roof-4**: lo face **-14**, verge tip **-16** (overhang 2, glb face rmse 1.541, anchor -13); hi face **13**, verge tip **15** (overhang 2, glb face rmse 1.116, anchor 12)
- **gable-roof-2-roof-3**: lo unfitted (named); hi face **11**, verge tip **12** (overhang 1, glb face rmse 1.038, anchor 10)

Ends fitted in the accepted geometry: 3 — gable-roof-0-roof-4 [lo -16 · hi 15], gable-roof-2-roof-3 [lo — · hi 12]

## Per-component outcomes (T-110-01)
- **mass-0** (primary): ACCEPTED (`end-fitted-voxel-pitch-ridge-fit`) — rmse gable-roof-0-roof-4 0.161, gable-roof-2-roof-3 0.288 (gables: gable-roof-0-roof-4, gable-roof-2-roof-3)

## Ridge fit (T-109-01)
- **gable-roof-0-roof-4**: record ridge y 24; intersect **y 22.596** @ v -5.826 (Δ vs record -1.404); GLB apex line: y 23.963, slope 0.002°, length 20, rmse 0.001
- **gable-roof-2-roof-3**: record ridge y 21; intersect **y 18.887** @ v 0.793 (Δ vs record -2.113); GLB apex line: y 22.445, slope 0.001°, length 14, rmse 0

Cap course cells in the accepted geometry: 0.

## Upper-edge terminations (T-109-01)
Planes: roof-1 (flat, 101), roof-5 (pitched, 52), roof-6 (pitched, 31), roof-7 (pitched, 13) — 4 accepted / 0 rolled back.
- `terminate:roof-1`: accepted (−47/+6)
- `terminate:roof-5`: accepted (−23/+0)
- `terminate:roof-6`: accepted (−4/+0)
- `terminate:roof-7`: accepted (−4/+0)

## Silhouette residual (T-109-01)
Dilation 4px (one voxel); removed 0 cells.
- **res-0** (48 cells): exempt-shown — GLB accounts for the mass at every gate azimuth

## The cage
IoU vs GLB — baseline: +x+z 0.9273 · +x-z 0.893 · -x-z 0.941 · -x+z 0.9425; final: +x+z 0.9307 · +x-z 0.891 · -x-z 0.9316 · -x+z 0.9329 (tolerance 0.02, anchored to the input shell). Closure reached 0 → 0. Chimney: 8 columns protected, 0 cells re-seated.

## Roof-band protrusions
| before | after |
|---|---|
| 16 | 0 |

Carved 2967 sampled cells; generated 2785 full / 168 stairs / 179 slabs (family spruce_planks / spruce_stairs / spruce_slab). Fit error (program rmse): gable-roof-0-roof-4 0.161, gable-roof-2-roof-3 0.288.

## Findings
- `fit-source-voxel` @ roof-4: glb fit insane pitch 7.474 — voxel gradient stands (the cage-held shell)
- `roof-region-unfitted` @ roof-1: flat, no ridge pair (area 101) — regularized mass stays
- `roof-region-unfitted` @ roof-5: pitched, no ridge pair (area 52) — regularized mass stays
- `roof-region-unfitted` @ roof-6: pitched, no ridge pair (area 31) — regularized mass stays
- `roof-region-unfitted` @ roof-7: pitched, no ridge pair (area 13) — regularized mass stays
- `end-unfitted` @ gable-roof-2-roof-3:-x: anchor window empty (wall anchor -13 outside the footprint end -1 — a buried interior end) — as-built end stays (Rule 2)

## Renders (45°/135°/225°/315° — the gate azimuths; 45°/315° are the T-108 gable-end views)
- before +x+z: benchmarks/sculpture/roof/cottage/view-oblique45-before.png
- after +x+z: benchmarks/sculpture/roof/cottage/view-oblique45-after.png
- before +x-z: benchmarks/sculpture/roof/cottage/view-oblique135-before.png
- after +x-z: benchmarks/sculpture/roof/cottage/view-oblique135-after.png
- before -x-z: benchmarks/sculpture/roof/cottage/view-oblique225-before.png
- after -x-z: benchmarks/sculpture/roof/cottage/view-oblique225-after.png
- before -x+z: benchmarks/sculpture/roof/cottage/view-oblique315-before.png
- after -x+z: benchmarks/sculpture/roof/cottage/view-oblique315-after.png
- before right: benchmarks/sculpture/roof/cottage/view-ridge-before.png
- after right: benchmarks/sculpture/roof/cottage/view-ridge-after.png

Frames: pr/assets/frames/roof-cottage-before.png, pr/assets/frames/roof-cottage-after.png, pr/assets/frames/roof-cottage-end45-before.png, pr/assets/frames/roof-cottage-end45-after.png, pr/assets/frames/roof-cottage-end315-before.png, pr/assets/frames/roof-cottage-end315-after.png, pr/assets/frames/roof-cottage-ridge-before.png, pr/assets/frames/roof-cottage-ridge-after.png

> stairs-rendered (T-107-01, supersedes the T-097 stairs-invisible pin): the lens defect was getModelVariants' substring air-check matching every *_stairs name; fixed by render/scripts/patch-viewer-lens.mjs. Stair courses are visible in renders; placement remains proven by the unmapped gate + the committed states.

> ONE judged step with the T-102 cage's checks: per-azimuth silhouette IoU vs the GLB on a MASS VIEW (generated stair/slab courses count as silhouette mass; all other fixtures stay dressing), closure no-regress, protected chimney byte-identical (re-seat additions listed, judged without them). Any regression → auto-rollback, the regularized roof stays, the failure is named (Rule 1).
