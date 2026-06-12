# Measured proportions — cottage (measured-proportions/v1, T-133-01)

Identity from language, quantity from geometry (E-33 Rule 1): the committed recognition
program keeps the naming; every dimensional parameter below is sourced from the conditioned
sketch's measurements or recorded as a fallback. Conflicts resolve sketch-wins. No judge
runs (T-138-01 owns verdicts). Replay: `npm run measured:repro` byte-identically re-derives
program, artifact and ratios from the committed inputs (no model, no GL).

| dimension (mass) | source | measured → used | residual | note |
| --- | --- | --- | --- | --- |
| footprint.w (*) | **measured** | 27 → 27 | 0 | sketch planDims (registry blocks), endpoint-scaled across masses |
| footprint.d (*) | **measured** | 32 → 32 | 0 | sketch planDims (registry blocks), endpoint-scaled across masses |
| eaveHeight (main) | **measured** | 19.3 → 20 | 0.7 | expressed as 4×5 (schema-bounded factorization) |
| storeyFactorization (main) | **measured** | 19.3 → `4x5` | — | recognition read 2x4 |
| pitchClass (main) | **measured** | 0.7143 → 1 | 0.2857 | tan(dominant tilt) snapped to the nearest pack pitch class |
| ridgeHeight (main) | **measured** | 27.3 → 31 | 3.7 | derived: eave + pitch x half-span + 1 (all constituents sourced above) |
| eaveHeight (wing) | **measured** | 19.3 → 20 | 0.7 | expressed as 4×5 (schema-bounded factorization) |
| storeyFactorization (wing) | **measured** | 19.3 → `4x5` | — | recognition read 2x4 |
| pitchClass (wing) | **measured** | 0.7143 → 1 | 0.2857 | tan(dominant tilt) snapped to the nearest pack pitch class |
| ridgeHeight (wing) | **measured** | 27.3 → 30 | 2.7 | derived: eave + pitch x half-span + 1 (all constituents sourced above) |

## Conflicts (recognition vs sketch — sketch wins for quantity)

- `footprint.w` (*): recognition 26 vs sketch 27 → **sketch**
- `footprint.d` (*): recognition 28 vs sketch 32 → **sketch**
- `eaveHeight` (main): recognition 8 vs sketch 19.3 → **sketch**
- `storeyHeight.packBand` (main): recognition "[3, 4]" vs sketch 5 → **sketch** — pack proportions are the fallback tier (S-133); excursion recorded
- `eaveHeight` (wing): recognition 8 vs sketch 19.3 → **sketch**
- `storeyHeight.packBand` (wing): recognition "[3, 4]" vs sketch 5 → **sketch** — pack proportions are the fallback tier (S-133); excursion recorded

## Silhouette ratios (standalone diagnostic — S-135 owns the gate metric)

| | ridge:eave | roof share | aspect |
| --- | --- | --- | --- |
| before (benchmarks/sculpture/workshop/cottage/program.json) | 2.25 | 0.5556 | 1.0769 |
| **after** (measured seed) | 1.55 | 0.3548 | 1.1852 |
| target (sketch) | 1.4145 | 0.293 | 1.1852 |

Renders (evidence, never gating):
- `benchmarks/sculpture/measured/view-cottage-+x+z.png` (+x+z) sha256 3c7cc75f40a7377e…
- `benchmarks/sculpture/measured/view-cottage-+x-z.png` (+x-z) sha256 bef2a75bae1db21b…
- `benchmarks/sculpture/measured/view-cottage--x-z.png` (-x-z) sha256 4a4a8dc4db966cc2…
- `benchmarks/sculpture/measured/view-cottage--x+z.png` (-x+z) sha256 771ea201ab255fd7…
