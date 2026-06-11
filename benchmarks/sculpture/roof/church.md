# Roof as program — church (T-104-01)

The sampled roof replaced by a roof GENERATED from parameters fitted against the component record's GLB fits — stair courses, slab half-steps, solid wedge — swapped under the T-102 cage, behind `npm run roof:church`. **Status: ACCEPTED** — reproducible, artifact sha256 `b107b729df7b3ecf…`.

## Fitted gables
- **gable-roof-1-roof-5** (insane: ridge y 17.5 not above eave y 18.5 (roof-1); ridge y 17.5 not above eave y 17.5 (roof-5); run 0.5 < minRun 2 (roof-5)) ridge x @ y 17.5, hip ends — roof-1 → -z: pitch **0.435** (voxel, glb∠ 23.397°), eave y 18.5, overhang -1; roof-5 → +z: pitch **1.095** (voxel, glb∠ 16.003°), eave y 17.5, overhang -21
- **gable-roof-3-roof-7** (sane) ridge z @ y 18, hip ends — roof-3 → +x: pitch **1.585** (glb, glb∠ 7.04°), eave y 14, overhang -29; roof-7 → -x: pitch **0.221** (voxel, glb∠ 12.58°), eave y 17, overhang -8
- **gable-roof-14-roof-15** (insane: no sane pitch (voxel 19, glb 189.361); run 1.444 < minRun 2 (roof-15)) ridge x @ y 32, hip ends — roof-14 → +z: pitch **1.355** (voxel, glb∠ 16.431°), eave y 28, overhang -4; roof-15 → -z: pitch **null** (null, glb∠ 10.914°), eave y 11, overhang 1

## Fitted ends (T-108-01)
- **gable-roof-3-roof-7**: lo unfitted (named); hi unfitted (named)
- **gable-roof-3-roof-7** (gable-ends variant): lo unfitted (named); hi unfitted (named)

Ends fitted in the accepted geometry: 0

## Per-component outcomes (T-110-01)
- **mass-0** (primary): ACCEPTED (`end-fitted-gable-ends`) — rmse gable-roof-3-roof-7 0.104 (gables: gable-roof-1-roof-5, gable-roof-3-roof-7)
- **mass-1** (attached): FALLBACK — nothing generated (no sane in-tolerance gable or no kit family) (gables: gable-roof-14-roof-15)

## Hip/pyramid fit (T-112-01)
- **mass-0**: cap refused (named in findings)
- **mass-1**: cap **FITTED** — band 11, apex 18 (glb evidence 32.5); faces +x **1.716** (glb-quadrant), -x **1.674** (glb-quadrant), +z **1.355** (voxel), -z **1.732** (glb-quadrant)

## Ridge fit (T-109-01)
- **gable-roof-3-roof-7**: record ridge y 18; intersect **y 18.378** @ v -9.762 (Δ vs record 0.378); GLB apex line: y 28.723, slope 0°, length 1, rmse 0

Cap course cells in the accepted geometry: 0.

## Upper-edge terminations (T-109-01)
Planes: roof-12 (flat, 125), roof-13 (flat, 53), roof-16 (flat, 13), roof-0 (pitched, 566), roof-1 (pitched, 267), roof-2 (pitched, 144), roof-14 (pitched, 21), roof-4 (pitched, 21), roof-5 (pitched, 21), roof-6 (pitched, 18), roof-8 (pitched, 15), roof-9 (pitched, 15), roof-10 (pitched, 13), roof-11 (pitched, 11), roof-15 (pitched, 8) — 12 accepted / 3 rolled back.
- `terminate:roof-12`: rolled back — iou:+x-z 0.9172 < 0.9264; closure: 13 interior cells exterior-reachable (input had 11)
- `terminate:roof-13`: accepted (−15/+4)
- `terminate:roof-16`: accepted (−0/+0)
- `terminate:roof-0`: accepted (−244/+0)
- `terminate:roof-1`: rolled back — closure: 24 interior cells exterior-reachable (input had 11)
- `terminate:roof-2`: accepted (−59/+0)
- `terminate:roof-14`: accepted (−10/+0)
- `terminate:roof-4`: accepted (−4/+0)
- `terminate:roof-5`: rolled back — closure: 22 interior cells exterior-reachable (input had 11)
- `terminate:roof-6`: accepted (−18/+0)
- `terminate:roof-8`: accepted (−6/+0)
- `terminate:roof-9`: accepted (−8/+0)
- `terminate:roof-10`: accepted (−16/+0)
- `terminate:roof-11`: accepted (−4/+0)
- `terminate:roof-15`: accepted (−2/+0)

## Silhouette residual (T-109-01)
Dilation 3px (one voxel); removed 18 cells.
- **res-0** (18 cells): removed — refuted @ +x+z (58px)
- **res-1** (5 cells): exempt-shown — GLB accounts for the mass at every gate azimuth

## The cage
IoU vs GLB — baseline: +x+z 0.8978 · +x-z 0.9464 · -x-z 0.9248 · -x+z 0.8663; final: +x+z 0.8978 · +x-z 0.9464 · -x-z 0.9248 · -x+z 0.8663 (tolerance 0.02, anchored to the input shell). Closure reached 10 → 9. Chimney: 17 columns protected, 0 cells re-seated.

## Roof-band protrusions
| before | after |
|---|---|
| 0 | 1 |

Carved 131 sampled cells; generated 163 full / 14 stairs / 12 slabs (family spruce_planks / spruce_stairs / spruce_slab). Fit error (program rmse): gable-roof-3-roof-7 0.104.

## Findings
- `roof-region-unfitted` @ roof-0: ridge pair not reciprocal — regularized mass stays
- `fit-source-voxel` @ roof-1: glb fit disagrees (23.397° > 15°) — voxel gradient stands (the cage-held shell)
- `fit-source-voxel` @ roof-5: glb fit disagrees (16.003° > 15°) — voxel gradient stands (the cage-held shell)
- `gable-insane` @ gable-roof-1-roof-5: ridge y 17.5 not above eave y 18.5 (roof-1); ridge y 17.5 not above eave y 17.5 (roof-5); run 0.5 < minRun 2 (roof-5)
- `fit-source-voxel` @ roof-7: glb fit insane pitch 0 — voxel gradient stands (the cage-held shell)
- `fit-source-voxel` @ roof-14: glb fit disagrees (16.431° > 15°) — voxel gradient stands (the cage-held shell)
- `gable-insane` @ gable-roof-14-roof-15: no sane pitch (voxel 19, glb 189.361); run 1.444 < minRun 2 (roof-15)
- `roof-region-unfitted` @ roof-2: pitched, no ridge pair (area 144) — regularized mass stays
- `roof-region-unfitted` @ roof-4: pitched, no ridge pair (area 21) — regularized mass stays
- `roof-region-unfitted` @ roof-6: pitched, no ridge pair (area 18) — regularized mass stays
- `roof-region-unfitted` @ roof-8: pitched, no ridge pair (area 15) — regularized mass stays
- `roof-region-unfitted` @ roof-9: pitched, no ridge pair (area 15) — regularized mass stays
- `roof-region-unfitted` @ roof-10: pitched, no ridge pair (area 13) — regularized mass stays
- `roof-region-unfitted` @ roof-11: pitched, no ridge pair (area 11) — regularized mass stays
- `roof-region-unfitted` @ roof-12: flat, no ridge pair (area 125) — regularized mass stays
- `roof-region-unfitted` @ roof-13: flat, no ridge pair (area 53) — regularized mass stays
- `roof-region-unfitted` @ roof-16: flat, no ridge pair (area 13) — regularized mass stays
- `end-hip` @ gable-roof-3-roof-7:-z: hip demanded — the end is a slope, not a face; not fitted
- `end-hip` @ gable-roof-3-roof-7:+z: hip demanded — the end is a slope, not a face; not fitted
- `end-unfitted` @ gable-roof-3-roof-7:-z: anchor window empty (wall anchor -18 outside the footprint end -7 — a buried interior end) — as-built end stays (Rule 2)
- `end-unfitted` @ gable-roof-3-roof-7:+z: anchor window empty (wall anchor 17 outside the footprint end 1 — a buried interior end) — as-built end stays (Rule 2)
- `hip-end-unfitted` @ gable-roof-3-roof-7:hi: no sane GLB end slope (pitch n/a over 0 sane tris, 97 rejected) — mean-of-sides heuristic stays (Rule 2)
- `hip-cap-candidate-refused` @ mass-1 @ eave 28: face +x unfittable (recorded none, glb n/a over 0 sane tris, 480 rejected)

## Renders (45°/135°/225°/315° — the gate azimuths; 45°/315° are the T-108 gable-end views)
- before +x+z: benchmarks/sculpture/roof/church/view-oblique45-before.png
- after +x+z: benchmarks/sculpture/roof/church/view-oblique45-after.png
- before +x-z: benchmarks/sculpture/roof/church/view-oblique135-before.png
- after +x-z: benchmarks/sculpture/roof/church/view-oblique135-after.png
- before -x-z: benchmarks/sculpture/roof/church/view-oblique225-before.png
- after -x-z: benchmarks/sculpture/roof/church/view-oblique225-after.png
- before -x+z: benchmarks/sculpture/roof/church/view-oblique315-before.png
- after -x+z: benchmarks/sculpture/roof/church/view-oblique315-after.png
- before right: benchmarks/sculpture/roof/church/view-ridge-before.png
- after right: benchmarks/sculpture/roof/church/view-ridge-after.png

Frames: pr/assets/frames/roof-church-before.png, pr/assets/frames/roof-church-after.png, pr/assets/frames/roof-church-end45-before.png, pr/assets/frames/roof-church-end45-after.png, pr/assets/frames/roof-church-end315-before.png, pr/assets/frames/roof-church-end315-after.png, pr/assets/frames/roof-church-cap45-before.png, pr/assets/frames/roof-church-cap45-after.png, pr/assets/frames/roof-church-cap135-before.png, pr/assets/frames/roof-church-cap135-after.png, pr/assets/frames/roof-church-ridge-before.png, pr/assets/frames/roof-church-ridge-after.png

> stairs-rendered (T-107-01, supersedes the T-097 stairs-invisible pin): the lens defect was getModelVariants' substring air-check matching every *_stairs name; fixed by render/scripts/patch-viewer-lens.mjs. Stair courses are visible in renders; placement remains proven by the unmapped gate + the committed states.

> ONE judged step with the T-102 cage's checks: per-azimuth silhouette IoU vs the GLB on a MASS VIEW (generated stair/slab courses count as silhouette mass; all other fixtures stay dressing), closure no-regress, protected chimney byte-identical (re-seat additions listed, judged without them). Any regression → auto-rollback, the regularized roof stays, the failure is named (Rule 1).
