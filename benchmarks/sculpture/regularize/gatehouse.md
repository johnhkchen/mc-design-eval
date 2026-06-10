# Shell regularization — gatehouse (T-102-01)

Morphological open/close on the committed shell, every step caged against the GLB (silhouette IoU at the 4 gate azimuths · closure no-regress · protected regions), behind `npm run regularize:gatehouse`. **Reproducible**: double-run byte-identical, artifact sha256 `b6c899187d50efee…`.

## Census (declared targets: spikes −50.0%, ragged −10.0% rel)
| metric | before | after | reduction |
|---|---|---|---|
| protrusions (≥4/6 faces) | 132 | 44 | 66.7% |
| ragged columns (≥3 cliff) | 191/679 (28.1%) | 92/665 (13.8%) | 50.8% rel |

## The cage (2 accepted / 0 rejected)
- **open** ACCEPTED: removed 23, added 0, plugged 0, restored [1487, 110, 15, 15, 10, 10]; spikes→125, ragged→28.7%
- **close** ACCEPTED: removed 0, added 642, plugged 2, restored [—]; spikes→44, ragged→13.8%

IoU vs GLB — baseline: +x+z 0.914 · +x-z 0.9271 · -x-z 0.9314 · -x+z 0.9171; final: +x+z 0.9135 · +x-z 0.9299 · -x-z 0.9343 · -x+z 0.9226 (tolerance 0.02, anchored to the input shell).

Protect: chimney stack ridgeY=31 (0 cols) + 6 declared openings — verified untouched.

## Renders
- before -x-z: benchmarks/sculpture/regularize/gatehouse/view-oblique225-before.png
- after -x-z: benchmarks/sculpture/regularize/gatehouse/view-oblique225-after.png

Frames: pr/assets/frames/regularize-gatehouse-before.png, pr/assets/frames/regularize-gatehouse-after.png

> every step gated on (a) per-azimuth silhouette IoU vs the GLB ≥ input − tolerance, (b) closure no-regress (strict 'closed' when the input is closed; plug remediation recorded), (c) protected regions byte-identical. Rejected steps rolled back and recorded.

> derived from geometry: the protruding stack above the highest roof plane (lifted protrudingStackRegion) + the build's own declared openings. The cage verifies both untouched independently of the ops honoring them.
