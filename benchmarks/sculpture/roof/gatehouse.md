# Roof as program — gatehouse (T-104-01)

The sampled roof replaced by a roof GENERATED from parameters fitted against the component record's GLB fits — stair courses, slab half-steps, solid wedge — swapped under the T-102 cage, behind `npm run roof:gatehouse`. **Status: ACCEPTED** — reproducible, artifact sha256 `5ffc907ebb7ad4c9…`.

## Fitted gables
- **gable-roof-0-roof-4** (sane) ridge x @ y 28, hip ends — roof-0 → +z: pitch **0.613** (glb, glb∠ 7.603°), eave y 19, overhang 4; roof-4 → -z: pitch **1.558** (voxel), eave y 26.5, overhang -10
- **gable-roof-1-roof-6** (insane: eave dir -x not perpendicular to ridge axis x; no sane pitch (voxel -0.676, glb n/a); eave dirs not opposing (-z vs -x)) ridge x @ y 21.5, hip ends — roof-1 → -z: pitch **0.809** (glb, glb∠ 5.863°), eave y 19, overhang 4; roof-6 → -x: pitch **null** (null), eave y 19, overhang 0

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

## Renders (135°/225°/315° — the azimuths the gate failed)
- before +x-z: benchmarks/sculpture/roof/gatehouse/view-oblique135-before.png
- after +x-z: benchmarks/sculpture/roof/gatehouse/view-oblique135-after.png
- before -x-z: benchmarks/sculpture/roof/gatehouse/view-oblique225-before.png
- after -x-z: benchmarks/sculpture/roof/gatehouse/view-oblique225-after.png
- before -x+z: benchmarks/sculpture/roof/gatehouse/view-oblique315-before.png
- after -x+z: benchmarks/sculpture/roof/gatehouse/view-oblique315-after.png

Frames: pr/assets/frames/roof-gatehouse-before.png, pr/assets/frames/roof-gatehouse-after.png

> stairs-invisible (pinned, T-097): prismarine-viewer 1.33.0 meshes NO stair block at any state — stair placement is proven by the unmapped gate + the committed states, not by pixels; renders show the solid wedge with tread notches.

> ONE judged step with the T-102 cage's checks: per-azimuth silhouette IoU vs the GLB on a MASS VIEW (generated stair/slab courses count as silhouette mass; all other fixtures stay dressing), closure no-regress, protected chimney byte-identical (re-seat additions listed, judged without them). Any regression → auto-rollback, the regularized roof stays, the failure is named (Rule 1).
