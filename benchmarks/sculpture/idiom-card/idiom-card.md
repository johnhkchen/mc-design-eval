# Idiom render card (T-124-01)

Verdict: **PASS** — gate pass, unmapped 0, 20 construct realizations (20 specs).

| plot | idiom | origin | size |
|---|---|---|---|
| gable-ridge-z | roof.gable | 0,1,0 | 9×5×6 |
| gable-ridge-x | roof.gable | 13,1,0 | 6×5×9 |
| hip | roof.hip | 23,1,0 | 9×5×12 |
| pyramid | roof.pyramid | 36,1,0 | 7×4×7 |
| arch | arch | 0,1,16 | 7×2×1 |
| head-flat | head.flat | 11,1,16 | 5×1×1 |
| stairs-walk | course.stairs | 20,1,16 | 4×4×2 |
| slab-course | course.slab | 28,1,16 | 1×1×4 |
| dormer-px | dormer | 33,1,16 | 3×4×3 |
| dormer-nx | dormer | 40,1,16 | 3×4×3 |
| dormer-pz | dormer | 0,1,24 | 3×4×3 |
| dormer-nz | dormer | 7,1,24 | 3×4×3 |
| chimney-bare | chimney | 14,1,24 | 1×5×1 |
| chimney-crown | chimney | 19,1,24 | 4×6×4 |
| chimney-slab | chimney | 27,1,24 | 2×5×1 |
| jetty-xp | jetty | 33,1,24 | 7×2×1 |
| jetty-xn | jetty | 0,1,32 | 7×2×1 |
| jetty-zp | jetty | 11,1,32 | 1×2×7 |
| jetty-zn | jetty | 16,1,32 | 1×2×7 |
| plinth | plinth | 21,1,32 | 7×2×5 |

Renders (the pattern book's regression sheet):
- `benchmarks/sculpture/idiom-card/view-card-+x+z.png` (+x+z) sha256 91b0b928d3becbe6…
- `benchmarks/sculpture/idiom-card/view-card-+x-z.png` (+x-z) sha256 83dcdb0bc8c5ae14…
- `benchmarks/sculpture/idiom-card/view-card--x-z.png` (-x-z) sha256 adcc31a402a1760d…
- `benchmarks/sculpture/idiom-card/view-card--x+z.png` (-x+z) sha256 b44bb2a2f35d4f22…
- `benchmarks/sculpture/idiom-card/view-card-front.png` (front) sha256 9f61bf93fc3d549c…

Pass idioms (timber-frame, opening-dressing, hollow, floorplan) are name-registered build
transforms — exercised by their own suites, not carded (they need full build context).
