# Multi-angle same-object gate — barn (generated) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-barn-generated.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/generated/barn/artifact.json` (sha256 `8db2e8d3f4dc…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | drifted<br>major form @ walls and roof all around<br>major massing @ long side wall surface<br>minor material zoning @ roof and wall blocks scattered throughout |
| +x-z | 135° | yes | pass | drifted<br>major form @ roof, top of the building<br>minor form @ long side walls<br>minor material zoning @ wall stonework |
| -x-z | 225° | yes | pass | drifted<br>major massing @ long wall and roof plane<br>major form @ roof surface<br>minor material zoning @ stone wall coursing |
| -x+z | 315° | yes | pass | drifted<br>major massing @ roof across the full ridge<br>major form @ long side and gable walls<br>minor material zoning @ upper wall and roof courses |

## Resemblance aggregate (T-093)
**FAIL** — gaps 12/2; failures: +x+z:drifted, +x-z:drifted, -x-z:drifted, -x+z:drifted

## Kit presence (T-100)
**PASS** — every kit entry present at its grammar sites

Skips (recorded): frame (all-flagged); course (all-flagged); openings:infill (kit names no treatment for this slot); openings:shutters (kit names no treatment for this slot); openings:door (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence))

## Kit-aware verdict
**FAIL** — resemblance fail ∧ kit presence pass (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)
