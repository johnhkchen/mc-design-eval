# Form sketch — gatehouse

Conditioned form sketch (`form-sketch/v1`): a sketch for recognition, **never a fit target**
(E-31 Rule 3). Check `gatehouse-sheet.png` against the GLB at a glance: gray = conditioned
occupancy, black = raw mesh outline, red = footprint, blue = mirror, green/purple = eave/ridge.

| measure | value |
| --- | --- |
| mesh | 143053 triangles, sha `1afd6fe29f5c…` |
| coarse faces | 100 kept of 2262 regions (target 100); dropped area 29.2% |
| grammar fit | mean snap residual 0.11° |
| orientation shares | `-y` 20.0%, `+z` 20.0%, `-z` 18.1%, `+y` 16.6%, `-x` 13.0%, `+x` 12.3%, `roof+x+y` 0.0%, `roof-x+y` 0.0%, `roof+z+y` 0.0%, `roof-z+y` 0.0%, `eave+x-y` 0.0%, `eave-x-y` 0.0%, `eave+z-y` 0.0%, `eave-z-y` 0.0% |
| roof pitch | **pitched45** (dominant tilt 37.87°) |
| symmetry | axis x @ 20 cells, score 0.8677 (threshold 0.8) → APPLIED, kept low half |
| footprint | 12 vertices, 1517 cells² over a 41×41 plan |
| masses | 1 body (primary, protrusion, protrusion, protrusion, protrusion, protrusion, protrusion, protrusion, protrusion, protrusion, protrusion) |
| proportions | eave 21.3 blocks / ridge 30.7 blocks (eaveFrac 0.6957); storeys 1→21.3 (out of band), 2→10.7 (out of band), 3→7.1 (out of band), 4→5.3 |
