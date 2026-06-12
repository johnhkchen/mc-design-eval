# Steep pitch — barn--saltcrag (steep-pitch/v1, T-134-01)

One parameter moved through one seam: every gable roof re-aimed at the style's steepest
declared class via `roof.gable.steep` (mixed full-block/stair courses), before/after seeded by
the same compile. No judge runs (T-138-01 owns verdicts); renders are evidence, never gating.

## Demand (recorded honestly — E-33)

- concept (the contract): `benchmarks/sculpture/runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png`
- sketch (mesh-derived, TRELLIS-flattened): class `pitched45`, tilt 45°
- pack classes [2, 1, 0.5] → realized class **2** on: hall

## Before → after

- roofs before: hall-roof: eave 9, ridge 21, pitch 1
- roofs after: hall-roof: eave 9, ridge 33, pitch 2
- cells 10117 → 17605; after conformance PASS (courses-even included)
- determinism: derivation ran twice, byte-identical (seed shas recorded)

| | ridge:eave | roof share | aspect |
| --- | --- | --- | --- |
| before (committed program seed) | 2.4444 | 0.5909 | 2 |
| **after** (steepened seed) | 3.7778 | 0.7353 | 2 |
| target (sketch — see demand note) | 2.1 | 0.5238 | 1.8462 |

Renders (the gate azimuths, evidence):
- `benchmarks/sculpture/steep-pitch/view-barn--saltcrag-before-+x+z.png` (before +x+z) sha256 e42ca5e7f38ff35a…
- `benchmarks/sculpture/steep-pitch/view-barn--saltcrag-before-+x-z.png` (before +x-z) sha256 5ca2d630e0cb7bdf…
- `benchmarks/sculpture/steep-pitch/view-barn--saltcrag-before--x-z.png` (before -x-z) sha256 ea1bca149d8a39a0…
- `benchmarks/sculpture/steep-pitch/view-barn--saltcrag-before--x+z.png` (before -x+z) sha256 52bfda322e1d4ed2…
- `benchmarks/sculpture/steep-pitch/view-barn--saltcrag-after-+x+z.png` (after +x+z) sha256 51062b737b0a6aca…
- `benchmarks/sculpture/steep-pitch/view-barn--saltcrag-after-+x-z.png` (after +x-z) sha256 0a68a0df89ee44c2…
- `benchmarks/sculpture/steep-pitch/view-barn--saltcrag-after--x-z.png` (after -x-z) sha256 a15a4df042d35a00…
- `benchmarks/sculpture/steep-pitch/view-barn--saltcrag-after--x+z.png` (after -x+z) sha256 30c182f6d764b72e…
