# Multi-angle same-object gate — cottage (generated) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-cottage-generated.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/generated/cottage/artifact.json` (sha256 `d6bfbd290bca…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | same object<br>minor massing @ roofline chimney<br>minor material zoning @ upper timber-framed walls in shadow under the eaves |
| +x-z | 135° | yes | pass | same object<br>minor form @ roof ridge / apex<br>minor massing @ chimney on the roof |
| -x-z | 225° | yes | pass | drifted<br>major form @ main roof, near slope<br>major massing @ roof shingle coverage<br>minor material zoning @ upper walls and base |
| -x+z | 315° | yes | pass | drifted<br>major form @ roof apex / ridge<br>major massing @ upper roof massing (offset, gapped slabs)<br>minor material zoning @ upper timber-framed wall under eaves |

## Resemblance aggregate (T-093)
**FAIL** — gaps 10/2; failures: -x-z:drifted, -x+z:drifted

## Kit presence (T-100)
**PASS** — every kit entry present at its grammar sites

## Kit-aware verdict
**FAIL** — resemblance fail ∧ kit presence pass (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)
