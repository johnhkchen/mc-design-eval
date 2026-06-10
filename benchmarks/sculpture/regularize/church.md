# Shell regularization — church (T-102-01)

Morphological open/close on the committed shell, every step caged against the GLB (silhouette IoU at the 4 gate azimuths · closure no-regress · protected regions), behind `npm run regularize:church`. **Reproducible**: double-run byte-identical, artifact sha256 `02e78adb5cd445ac…`.

## Census (declared targets: spikes −50.0%, ragged −10.0% rel)
| metric | before | after | reduction |
|---|---|---|---|
| protrusions (≥4/6 faces) | 602 | 242 | 59.8% |
| ragged columns (≥3 cliff) | 334/1376 (24.3%) | 198/1376 (14.4%) | 40.7% rel |

## The cage (1 accepted / 1 rejected)
- **open** REJECTED — closure: 225 interior cells exterior-reachable (input had 213): removed 6, added 0, plugged 0, restored [8890]; spikes→596, ragged→24.2%
- **close** ACCEPTED: removed 0, added 3104, plugged 0, restored [—]; spikes→242, ragged→14.4%

IoU vs GLB — baseline: +x+z 0.8984 · +x-z 0.9453 · -x-z 0.9229 · -x+z 0.8609; final: +x+z 0.898 · +x-z 0.9464 · -x-z 0.9248 · -x+z 0.8663 (tolerance 0.02, anchored to the input shell).

Protect: chimney stack ridgeY=32 (0 cols) + 32 declared openings — verified untouched.

## Renders
- before -x-z: benchmarks/sculpture/regularize/church/view-oblique225-before.png
- after -x-z: benchmarks/sculpture/regularize/church/view-oblique225-after.png

Frames: pr/assets/frames/regularize-church-before.png, pr/assets/frames/regularize-church-after.png

> every step gated on (a) per-azimuth silhouette IoU vs the GLB ≥ input − tolerance, (b) closure no-regress (strict 'closed' when the input is closed; plug remediation recorded), (c) protected regions byte-identical. Rejected steps rolled back and recorded.

> derived from geometry: the protruding stack above the highest roof plane (lifted protrudingStackRegion) + the build's own declared openings. The cage verifies both untouched independently of the ops honoring them.
