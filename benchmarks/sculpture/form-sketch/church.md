# Form sketch — church

Conditioned form sketch (`form-sketch/v1`): a sketch for recognition, **never a fit target**
(E-31 Rule 3). Check `church-sheet.png` against the GLB at a glance: gray = conditioned
occupancy, black = raw mesh outline, red = footprint, blue = mirror, green/purple = eave/ridge.

| measure | value |
| --- | --- |
| mesh | 146118 triangles, sha `0c2fa84c6721…` |
| coarse faces | 100 kept of 11226 regions (target 100); dropped area 49.8% |
| grammar fit | mean snap residual 0.71° |
| orientation shares | `-y` 18.8%, `+z` 17.8%, `+y` 17.7%, `-z` 17.6%, `+x` 13.9%, `-x` 13.3%, `roof+z+y` 0.2%, `eave+z-y` 0.2%, `eave-z-y` 0.1%, `roof-z+y` 0.1%, `roof+x+y` 0.1%, `eave+x-y` 0.1%, `roof-x+y` 0.1%, `eave-x-y` 0.1% |
| roof pitch | **pitched45** (dominant tilt 36.03°) |
| symmetry | axis z @ 28 cells, score 0.4161 (threshold 0.8) → not applied — stays asymmetric |
| footprint | 6 vertices, 1362 cells² over a 48×39 plan |
| masses | 3 body (primary, attached, attached, protrusion) |
| proportions | eave 15 blocks / ridge 33 blocks (eaveFrac 0.4545); storeys 1→15 (out of band), 2→7.5 (out of band), 3→5, 4→3.8 |
