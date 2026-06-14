# Multi-angle same-object gate — gatehouse (challenge) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-gatehouse-challenge.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/challenge/gatehouse/artifact.json` (sha256 `e4467844ffb4…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | different object<br>major form @ roofline / overall upper massing<br>major massing @ front entrance (the arched doorway)<br>major material zoning @ facade surfaces |
| +x-z | 135° | yes | pass | drifted<br>major form @ roof and upper structure<br>minor form @ walls and facade openings<br>minor palette @ overall stone-and-dark-trim coloring |
| -x-z | 225° | yes | pass | different object<br>major form @ roof / upper mass<br>major massing @ overall building footprint and silhouette<br>major material zoning @ front face — columned portico vs plain arched wall |
| -x+z | 315° | yes | pass | drifted<br>major form @ perimeter walls<br>minor form @ roof eaves<br>minor massing @ overall body |

## Aggregate
**FAIL** — gaps 12/2; failures: +x+z:different object, +x-z:drifted, -x-z:different object, -x+z:drifted
