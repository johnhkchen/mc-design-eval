# Form sketch — cottage

Conditioned form sketch (`form-sketch/v1`): a sketch for recognition, **never a fit target**
(E-31 Rule 3). Check `cottage-sheet.png` against the GLB at a glance: gray = conditioned
occupancy, black = raw mesh outline, red = footprint, blue = mirror, green/purple = eave/ridge.

| measure | value |
| --- | --- |
| mesh | 137257 triangles, sha `ed95b351ecb8…` |
| coarse faces | 100 kept of 8981 regions (target 100); dropped area 59.6% |
| grammar fit | mean snap residual 0.57° |
| orientation shares | `+y` 25.7%, `-y` 22.6%, `+x` 14.0%, `-x` 13.1%, `+z` 12.3%, `-z` 12.1%, `eave+x-y` 0.1%, `eave-x-y` 0.1%, `roof-x+y` 0.0%, `roof+x+y` 0.0%, `eave+z-y` 0.0%, `eave-z-y` 0.0%, `roof+z+y` 0.0%, `roof-z+y` 0.0% |
| roof pitch | **pitched45** (dominant tilt 38.16°) |
| symmetry | axis x @ 13.5 cells, score 0.5396 (threshold 0.8) → not applied — stays asymmetric |
| footprint | 8 vertices, 1496 cells² over a 40×48 plan |
| masses | 1 body (primary, protrusion, protrusion) |
| proportions | eave 18.7 blocks / ridge 27.3 blocks (eaveFrac 0.6829); storeys 1→18.7 (out of band), 2→9.3 (out of band), 3→6.2 (out of band), 4→4.7 |
