# builds/gatehouse/faithful — staged S-171 recognition build

Byte-copies of the committed T-171-01 recognition build, re-named for the corpus-referee crater
(which expects `view-{az}.png`):

- `artifact.json`     ← `benchmarks/sculpture/recognition/gatehouse.artifact.json`
- `view-{az}.png`     ← `benchmarks/sculpture/recognition/view-gatehouse-{az}.png` (4 azimuths)

NOT a new render. Material-faithful stone walls (stone_bricks 46.5%, polished_basalt gone); roof is
still the dark_oak_planks prism (S-172 roof-covering lives on a different pipeline — see
docs/active/work/T-173-01/FINDINGS.md). Used as CRATER_BUILD for the T-173-01 PRIMARY run.
