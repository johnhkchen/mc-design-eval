# Shell regularization — cottage (T-102-01)

Morphological open/close on the committed shell, every step caged against the GLB (silhouette IoU at the 4 gate azimuths · closure no-regress · protected regions), behind `npm run regularize:cottage`. **Reproducible**: double-run byte-identical, artifact sha256 `33b1ca02f2589f49…`.

## Census (declared targets: spikes −50.0%, ragged −10.0% rel)
| metric | before | after | reduction |
|---|---|---|---|
| protrusions (≥4/6 faces) | 276 | 57 | 79.3% |
| ragged columns (≥3 cliff) | 157/656 (23.9%) | 63/657 (9.6%) | 59.9% rel |

## The cage (2 accepted / 0 rejected)
- **open** ACCEPTED: removed 5, added 0, plugged 0, restored [4808]; spikes→274, ragged→23.9%
- **close** ACCEPTED: removed 0, added 2332, plugged 0, restored [—]; spikes→57, ragged→9.6%

IoU vs GLB — baseline: +x+z 0.9253 · +x-z 0.8927 · -x-z 0.9438 · -x+z 0.9447; final: +x+z 0.9273 · +x-z 0.893 · -x-z 0.941 · -x+z 0.9425 (tolerance 0.02, anchored to the input shell).

Protect: chimney stack ridgeY=24 (3 cols) + 8 declared openings — verified untouched.

## Renders
- before -x-z: benchmarks/sculpture/regularize/cottage/view-oblique225-before.png
- after -x-z: benchmarks/sculpture/regularize/cottage/view-oblique225-after.png

Frames: pr/assets/frames/regularize-cottage-before.png, pr/assets/frames/regularize-cottage-after.png

> every step gated on (a) per-azimuth silhouette IoU vs the GLB ≥ input − tolerance, (b) closure no-regress (strict 'closed' when the input is closed; plug remediation recorded), (c) protected regions byte-identical. Rejected steps rolled back and recorded.

> derived from geometry: the protruding stack above the highest roof plane (lifted protrudingStackRegion) + the build's own declared openings. The cage verifies both untouched independently of the ops honoring them.
