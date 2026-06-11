# Roof as program — cottage (T-104-01)

The sampled roof replaced by a roof GENERATED from parameters fitted against the component record's GLB fits — stair courses, slab half-steps, solid wedge — swapped under the T-102 cage, behind `npm run roof:cottage`. **Status: ACCEPTED** — reproducible, artifact sha256 `df4f749f27bc47ce…`.

## Fitted gables
- **gable-roof-0-roof-4** (sane) ridge z @ y 24 — roof-0 → +x: pitch **0.773** (glb, glb∠ 11.544°), eave y 15, overhang 1; roof-4 → -x: pitch **1.884** (voxel, glb∠ 20.383°), eave y 18.5, overhang -3
- **gable-roof-2-roof-3** (sane) ridge x @ y 21 — roof-2 → -z: pitch **0.448** (glb, glb∠ 13.249°), eave y 14.5, overhang -3; roof-3 → +z: pitch **0.924** (glb, glb∠ 3.221°), eave y 15, overhang -7

## The cage
IoU vs GLB — baseline: +x+z 0.9273 · +x-z 0.893 · -x-z 0.941 · -x+z 0.9425; final: +x+z 0.9317 · +x-z 0.8927 · -x-z 0.9324 · -x+z 0.9345 (tolerance 0.02, anchored to the input shell). Closure reached 0 → 0. Chimney: 8 columns protected, 0 cells re-seated.

## Roof-band protrusions
| before | after |
|---|---|
| 16 | 0 |

Carved 2967 sampled cells; generated 3015 full / 168 stairs / 179 slabs (family spruce_planks / spruce_stairs / spruce_slab). Fit error (program rmse): gable-roof-0-roof-4 0.128, gable-roof-2-roof-3 0.288.

## Findings
- `fit-source-voxel` @ roof-4: glb fit insane pitch 7.474 — voxel gradient stands (the cage-held shell)
- `roof-region-unfitted` @ roof-1: flat, no ridge pair (area 101) — regularized mass stays
- `roof-region-unfitted` @ roof-5: pitched, no ridge pair (area 52) — regularized mass stays
- `roof-region-unfitted` @ roof-6: pitched, no ridge pair (area 31) — regularized mass stays
- `roof-region-unfitted` @ roof-7: pitched, no ridge pair (area 13) — regularized mass stays

## Renders (135°/225°/315° — the azimuths the gate failed)
- before +x-z: benchmarks/sculpture/roof/cottage/view-oblique135-before.png
- after +x-z: benchmarks/sculpture/roof/cottage/view-oblique135-after.png
- before -x-z: benchmarks/sculpture/roof/cottage/view-oblique225-before.png
- after -x-z: benchmarks/sculpture/roof/cottage/view-oblique225-after.png
- before -x+z: benchmarks/sculpture/roof/cottage/view-oblique315-before.png
- after -x+z: benchmarks/sculpture/roof/cottage/view-oblique315-after.png

Frames: pr/assets/frames/roof-cottage-before.png, pr/assets/frames/roof-cottage-after.png

> stairs-invisible (pinned, T-097): prismarine-viewer 1.33.0 meshes NO stair block at any state — stair placement is proven by the unmapped gate + the committed states, not by pixels; renders show the solid wedge with tread notches.

> ONE judged step with the T-102 cage's checks: per-azimuth silhouette IoU vs the GLB on a MASS VIEW (generated stair/slab courses count as silhouette mass; all other fixtures stay dressing), closure no-regress, protected chimney byte-identical (re-seat additions listed, judged without them). Any regression → auto-rollback, the regularized roof stays, the failure is named (Rule 1).
