# Multi-angle same-object gate — cottage (challenge) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-cottage-challenge.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/challenge/cottage/artifact.json` (sha256 `dbe9a083461d…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | band0 tuff=0.584<br>band1 smooth_sandstone=0.399<br>roof spruce_planks=0.557 | (judge not called — coverage) |
| +x-z | 135° | yes | pass | drifted<br>major form @ roof<br>minor massing @ roof eaves/overhang<br>minor material zoning @ upper walls vs stone base |
| -x-z | 225° | yes | pass | drifted<br>major form @ roof across the whole top<br>minor material zoning @ upper timber-framed storey walls<br>minor palette @ roof timber/plank coloring |
| -x+z | 315° | yes | pass | same object<br>minor form @ roofline and eaves<br>minor material zoning @ upper timber-frame wall |

## Aggregate
**FAIL** — gaps 8/2; failures: +x+z:coverage, +x-z:drifted, -x-z:drifted
