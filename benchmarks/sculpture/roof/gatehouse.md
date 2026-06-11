# Roof as program — gatehouse (T-104-01)

The sampled roof replaced by a roof GENERATED from parameters fitted against the component record's GLB fits — stair courses, slab half-steps, solid wedge — swapped under the T-102 cage, behind `npm run roof:gatehouse`. **Status: ACCEPTED** — reproducible, artifact sha256 `6ed2580cff4ce07d…`.

## Fitted gables
- **gable-roof-0-roof-4** (sane) ridge x @ y 28, hip ends — roof-0 → +z: pitch **0.613** (glb, glb∠ 7.603°), eave y 19, overhang 4; roof-4 → -z: pitch **1.558** (voxel), eave y 26.5, overhang -10
- **gable-roof-1-roof-6** (insane: eave dir -x not perpendicular to ridge axis x; no sane pitch (voxel -0.676, glb n/a); eave dirs not opposing (-z vs -x)) ridge x @ y 21.5, hip ends — roof-1 → -z: pitch **0.809** (glb, glb∠ 5.863°), eave y 19, overhang 4; roof-6 → -x: pitch **null** (null), eave y 19, overhang 0

## Fitted ends (T-108-01)
- **gable-roof-0-roof-4**: lo unfitted (named); hi unfitted (named)
- **gable-roof-0-roof-4** (gable-ends variant): lo unfitted (named); hi face **13**, verge tip **13** (overhang 0, glb face rmse 0.001, anchor 13)

Ends fitted in the accepted geometry: 1 — gable-roof-0-roof-4 [lo — · hi 13]

## Per-component outcomes (T-110-01)
- **mass-0** (primary): ACCEPTED (`end-fitted-voxel-pitch-gable-ends`) — rmse gable-roof-0-roof-4 0.144 (gables: gable-roof-0-roof-4, gable-roof-1-roof-6)

## Ridge fit (T-109-01)
- **gable-roof-0-roof-4**: record ridge y 28; intersect invalid (intersection y 26.397 not above the eaves (26.5)); GLB apex line: y 31.5, slope 0°, length 26, rmse 0

Cap course cells in the accepted geometry: 0.

## Upper-edge terminations (T-109-01)
Planes: roof-2 (flat, 151), roof-1 (pitched, 153), roof-3 (pitched, 28), roof-5 (pitched, 14), roof-6 (pitched, 13), roof-7 (pitched, 9), roof-8 (pitched, 9) — 7 accepted / 0 rolled back.
- `terminate:roof-2`: accepted (−15/+1)
- `terminate:roof-1`: accepted (−55/+0)
- `terminate:roof-3`: accepted (−15/+0)
- `terminate:roof-5`: accepted (−9/+0)
- `terminate:roof-6`: accepted (−4/+0)
- `terminate:roof-7`: accepted (−2/+0)
- `terminate:roof-8`: accepted (−3/+0)

## Silhouette residual (T-109-01)
Dilation 4px (one voxel); removed 0 cells.
- **res-0** (53 cells): exempt-shown — GLB accounts for the mass at every gate azimuth
- **res-1** (3 cells): exempt-shown — GLB accounts for the mass at every gate azimuth

## The cage
IoU vs GLB — baseline: +x+z 0.9135 · +x-z 0.9299 · -x-z 0.9343 · -x+z 0.9226; final: +x+z 0.9133 · +x-z 0.9248 · -x-z 0.922 · -x+z 0.9147 (tolerance 0.02, anchored to the input shell). Closure reached 0 → 0. Chimney: 22 columns protected, 0 cells re-seated.

## Roof-band protrusions
| before | after |
|---|---|
| 18 | 2 |

Carved 1561 sampled cells; generated 1503 full / 50 stairs / 139 slabs (family deepslate_bricks / deepslate_brick_stairs / deepslate_brick_slab). Fit error (program rmse): gable-roof-0-roof-4 0.144.

## Findings
- `fit-source-voxel` @ roof-4: glb fit missing on this plane — voxel gradient stands (the cage-held shell)
- `gable-insane` @ gable-roof-1-roof-6: eave dir -x not perpendicular to ridge axis x; no sane pitch (voxel -0.676, glb n/a); eave dirs not opposing (-z vs -x)
- `roof-region-unfitted` @ roof-2: flat, no ridge pair (area 151) — regularized mass stays
- `roof-region-unfitted` @ roof-3: pitched, no ridge pair (area 28) — regularized mass stays
- `roof-region-unfitted` @ roof-5: pitched, no ridge pair (area 14) — regularized mass stays
- `roof-region-unfitted` @ roof-7: pitched, no ridge pair (area 9) — regularized mass stays
- `roof-region-unfitted` @ roof-8: pitched, no ridge pair (area 9) — regularized mass stays
- `end-hip` @ gable-roof-0-roof-4:-x: hip demanded — the end is a slope, not a face; not fitted
- `end-hip` @ gable-roof-0-roof-4:+x: hip demanded — the end is a slope, not a face; not fitted
- `end-fit-insane` @ gable-roof-0-roof-4:-x: roof end -12.814 inside the gable face -12.253 — as-built end stays (Rule 2)

## Renders (45°/135°/225°/315° — the gate azimuths; 45°/315° are the T-108 gable-end views)
- before +x+z: benchmarks/sculpture/roof/gatehouse/view-oblique45-before.png
- after +x+z: benchmarks/sculpture/roof/gatehouse/view-oblique45-after.png
- before +x-z: benchmarks/sculpture/roof/gatehouse/view-oblique135-before.png
- after +x-z: benchmarks/sculpture/roof/gatehouse/view-oblique135-after.png
- before -x-z: benchmarks/sculpture/roof/gatehouse/view-oblique225-before.png
- after -x-z: benchmarks/sculpture/roof/gatehouse/view-oblique225-after.png
- before -x+z: benchmarks/sculpture/roof/gatehouse/view-oblique315-before.png
- after -x+z: benchmarks/sculpture/roof/gatehouse/view-oblique315-after.png
- before front: benchmarks/sculpture/roof/gatehouse/view-ridge-before.png
- after front: benchmarks/sculpture/roof/gatehouse/view-ridge-after.png

Frames: pr/assets/frames/roof-gatehouse-before.png, pr/assets/frames/roof-gatehouse-after.png, pr/assets/frames/roof-gatehouse-end45-before.png, pr/assets/frames/roof-gatehouse-end45-after.png, pr/assets/frames/roof-gatehouse-end315-before.png, pr/assets/frames/roof-gatehouse-end315-after.png, pr/assets/frames/roof-gatehouse-ridge-before.png, pr/assets/frames/roof-gatehouse-ridge-after.png

> stairs-rendered (T-107-01, supersedes the T-097 stairs-invisible pin): the lens defect was getModelVariants' substring air-check matching every *_stairs name; fixed by render/scripts/patch-viewer-lens.mjs. Stair courses are visible in renders; placement remains proven by the unmapped gate + the committed states.

> ONE judged step with the T-102 cage's checks: per-azimuth silhouette IoU vs the GLB on a MASS VIEW (generated stair/slab courses count as silhouette mass; all other fixtures stay dressing), closure no-regress, protected chimney byte-identical (re-seat additions listed, judged without them). Any regression → auto-rollback, the regularized roof stays, the failure is named (Rule 1).
