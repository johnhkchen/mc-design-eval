# Multi-angle same-object gate — cottage (patternbook) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-cottage-patternbook.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/workshop/cottage/final-artifact.json` (sha256 `377b65b6617e…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | same object<br>minor material zoning @ upper storey walls<br>minor massing @ overall massing and roof footprint<br>minor palette @ chimney |
| +x-z | 135° | yes | pass | same object<br>minor palette @ rooftop chimney<br>minor material zoning @ upper-storey walls |
| -x-z | 225° | yes | pass | drifted<br>major material zoning @ walls (entire wall surface)<br>major massing @ overall building height vs roof<br>minor palette @ rooftop chimney |
| -x+z | 315° | yes | pass | drifted<br>major massing @ roof vs walls overall<br>major material zoning @ ground storey and wall framing<br>minor palette @ rooftop chimney |

## Resemblance aggregate (T-093)
**FAIL** — gaps 11/2; failures: -x-z:drifted, -x+z:drifted

## Kit presence (T-100)
**FAIL** — named absences:
- `missing: spruce_planks frame @ 110/374 frame-line cells`
- `missing: stone_bricks panel @ band0 (499 cells)`

Skips (recorded): openings (no concept-declared apertures supplied)

## Kit-aware verdict
**FAIL** — resemblance fail ∧ kit presence fail (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)
