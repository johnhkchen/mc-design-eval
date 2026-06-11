# Form sketch — barn

Conditioned form sketch (`form-sketch/v1`): a sketch for recognition, **never a fit target**
(E-31 Rule 3). Check `barn-sheet.png` against the GLB at a glance: gray = conditioned
occupancy, black = raw mesh outline, red = footprint, blue = mirror, green/purple = eave/ridge.

| measure | value |
| --- | --- |
| mesh | 141220 triangles, sha `38de9931c26a…` |
| coarse faces | 100 kept of 11854 regions (target 100); dropped area 65.1% |
| grammar fit | mean snap residual 0.24° |
| orientation shares | `+y` 26.6%, `+z` 23.4%, `-y` 16.7%, `-z` 13.9%, `+x` 10.2%, `-x` 9.2%, `roof+x+y` 0.0%, `roof-x+y` 0.0%, `eave+x-y` 0.0%, `eave-x-y` 0.0%, `eave-z-y` 0.0%, `roof+z+y` 0.0%, `roof-z+y` 0.0%, `eave+z-y` 0.0% |
| roof pitch | **steep** (dominant tilt 78.69°) |
| symmetry | axis z @ 12.5 cells, score 0.5518 (threshold 0.8) → not applied — stays asymmetric |
| footprint | 4 vertices (clean rectangle), 1152 cells² over a 48×26 plan |
| masses | 1 body (primary, protrusion, protrusion, protrusion, protrusion, protrusion, protrusion) |
| proportions | eave 11 blocks / ridge 21 blocks (eaveFrac 0.5238); storeys 1→11 (out of band), 2→5.5, 3→3.7, 4→2.8 (out of band) |
