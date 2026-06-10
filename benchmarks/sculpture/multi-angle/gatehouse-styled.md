# Multi-angle same-object gate — gatehouse (styled) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-gatehouse-styled.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/styled/gatehouse/artifact.json` (sha256 `3ea1c65bd03a…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | drifted<br>major form @ roofline along the top<br>major massing @ overall building mass and footprint<br>minor material zoning @ front and side walls |
| +x-z | 135° | yes | pass | drifted<br>major form @ roof / ridge line<br>minor massing @ upper walls and eaves<br>minor palette @ stone base and dark-wood trim |
| -x-z | 225° | yes | pass | different object<br>major massing @ overall building mass<br>major form @ roof — the gabled pitched roof of the concept/mesh<br>major form @ walls and entrance — should be a closed stone box with an arched door, instead reads as open colonnaded ruin |
| -x+z | 315° | yes | pass | different object<br>major massing @ overall building body<br>major form @ walls — open colonnade of vertical columns instead of solid stone walls<br>major form @ roof and ridge |

## Resemblance aggregate (T-093)
**FAIL** — gaps 12/2; failures: +x+z:drifted, +x-z:drifted, -x-z:different object, -x+z:different object

## Kit presence (T-100)
**PASS** — every kit entry present at its grammar sites

Skips (recorded): openings:infill (kit names no treatment for this slot); openings:shutters (kit names no treatment for this slot); openings:door (kit names no treatment for this slot); openings:light (kit names no treatment for this slot)

## Kit-aware verdict
**FAIL** — resemblance fail ∧ kit presence pass (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)
