# Fixture test-card (T-097-01)

Verdict: **PASS** — gate pass, unmapped 0, read-back 25/25.

| row | block | state | pos | read-back |
|---|---|---|---|---|
| trapdoor-north-open | spruce_trapdoor | facing=north half=bottom open=true | 0,1,0 | ok |
| trapdoor-south-open | spruce_trapdoor | facing=south half=bottom open=true | 3,1,0 | ok |
| trapdoor-west-open | spruce_trapdoor | facing=west half=bottom open=true | 6,1,0 | ok |
| trapdoor-east-open | spruce_trapdoor | facing=east half=bottom open=true | 9,1,0 | ok |
| trapdoor-closed-bottom | spruce_trapdoor | facing=north half=bottom open=false | 12,1,0 | ok |
| trapdoor-closed-top | spruce_trapdoor | facing=north half=top open=false | 15,1,0 | ok |
| fence-post | oak_fence | (default) | 0,1,3 | ok |
| fence-ew | oak_fence | east=true west=true | 3,1,3 | ok |
| fence-ns | oak_fence | north=true south=true | 6,1,3 | ok |
| fence-corner-ne | oak_fence | north=true east=true | 9,1,3 | ok |
| fence-tee-new | oak_fence | north=true east=true west=true | 12,1,3 | ok |
| stairs-north | stone_brick_stairs | facing=north half=bottom shape=straight | 0,1,6 | ok |
| stairs-south | stone_brick_stairs | facing=south half=bottom shape=straight | 3,1,6 | ok |
| stairs-west | stone_brick_stairs | facing=west half=bottom shape=straight | 6,1,6 | ok |
| stairs-east | stone_brick_stairs | facing=east half=bottom shape=straight | 9,1,6 | ok |
| stairs-east-top | stone_brick_stairs | facing=east half=top shape=straight | 12,1,6 | ok |
| slab-bottom | oak_slab | type=bottom | 0,1,9 | ok |
| slab-top | oak_slab | type=top | 3,1,9 | ok |
| slab-double | oak_slab | type=double | 6,1,9 | ok |
| door-closed-lower | spruce_door | facing=east half=lower hinge=left open=false | 0,1,12 | ok |
| door-closed-upper | spruce_door | facing=east half=upper hinge=left open=false | 0,2,12 | ok |
| door-open-lower | spruce_door | facing=east half=lower hinge=left open=true | 3,1,12 | ok |
| door-open-upper | spruce_door | facing=east half=upper hinge=left open=true | 3,2,12 | ok |
| lantern-standing | lantern | hanging=false | 0,1,15 | ok |
| lantern-hanging | lantern | hanging=true | 3,1,15 | ok |

Renders (regression reference):
- `benchmarks/sculpture/fixture-card/view-card-+x+z.png` (+x+z) sha256 f324cee83a516442…
- `benchmarks/sculpture/fixture-card/view-card-+x-z.png` (+x-z) sha256 6fd021cf36532c68…
- `benchmarks/sculpture/fixture-card/view-card--x-z.png` (-x-z) sha256 f6c12f20457e958c…
- `benchmarks/sculpture/fixture-card/view-card--x+z.png` (-x+z) sha256 e7fdc544969c9a19…
- `benchmarks/sculpture/fixture-card/view-card-front.png` (front) sha256 08933faf73160f64…

Named residuals (lens, not placement):
