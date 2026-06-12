# Measured proportions — barn--saltcrag (measured-proportions/v1, T-138-01)

Identity from language, quantity from geometry (E-33 Rule 1): the committed recognition
program keeps the naming; every dimensional parameter below is sourced from the conditioned
sketch's measurements or recorded as a fallback. Conflicts resolve sketch-wins. No judge
runs (T-138-01 owns verdicts). Replay: `npm run measured:repro` byte-identically re-derives
program, artifact and ratios from the committed inputs (no model, no GL).

| dimension (mass) | source | measured → used | residual | note |
| --- | --- | --- | --- | --- |
| footprint.w (*) | **measured** | 48 → 48 | 0 | sketch planDims (registry blocks), endpoint-scaled across masses |
| footprint.d (*) | **measured** | 26 → 26 | 0 | sketch planDims (registry blocks), endpoint-scaled across masses |
| eaveHeight (hall) | **measured** | 10 → 10 | 0 | expressed as 2×5 (schema-bounded factorization) |
| storeyFactorization (hall) | **measured** | 10 → `2x5` | — | recognition read 3x3 |
| pitchClass (hall) | **measured** | 1 → 1 | 0 | tan(dominant tilt) snapped to the nearest pack pitch class |
| ridgeHeight (hall) | **measured** | 21 → 24 | 3 | derived: eave + pitch x half-span + 1 (all constituents sourced above) |

## Conflicts (recognition vs sketch — sketch wins for quantity)

- `footprint.d` (*): recognition 24 vs sketch 26 → **sketch**
- `eaveHeight` (hall): recognition 9 vs sketch 10 → **sketch**
- `storeyHeight.packBand` (hall): recognition "[3, 4]" vs sketch 5 → **sketch** — pack proportions are the fallback tier (S-133); excursion recorded

## Silhouette ratios (standalone diagnostic — S-135 owns the gate metric)

| | ridge:eave | roof share | aspect |
| --- | --- | --- | --- |
| before (benchmarks/sculpture/workshop/barn--saltcrag/program.json) | 2.4444 | 0.5909 | 2 |
| **after** (measured seed) | 2.4 | 0.5833 | 1.8462 |
| target (sketch) | 2.1 | 0.5238 | 1.8462 |

Renders (evidence, never gating):
- `benchmarks/sculpture/measured/view-barn--saltcrag-+x+z.png` (+x+z) sha256 809b05c41bd936e2…
- `benchmarks/sculpture/measured/view-barn--saltcrag-+x-z.png` (+x-z) sha256 64583810e285df1b…
- `benchmarks/sculpture/measured/view-barn--saltcrag--x-z.png` (-x-z) sha256 bb26318540fe8c8a…
- `benchmarks/sculpture/measured/view-barn--saltcrag--x+z.png` (-x+z) sha256 2cf30d1d7736af1c…
