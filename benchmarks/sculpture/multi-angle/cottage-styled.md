# Multi-angle same-object gate — cottage (styled) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-cottage-styled.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/styled/cottage/artifact.json` (sha256 `8385a7a35725…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | drifted<br>major form @ roof across the whole top<br>major massing @ upper storey gable ends<br>minor material zoning @ timber-frame walls vs stone plinth |
| +x-z | 135° | yes | pass | same object<br>minor material zoning @ front gable wall, upper storey<br>minor form @ timber roof eaves |
| -x-z | 225° | yes | pass | same object<br>minor material zoning @ lower walls / stone foundation course<br>minor form @ roof ridge and chimney profile |
| -x+z | 315° | yes | pass | drifted<br>major form @ roof<br>minor form @ overall building edges/eaves<br>minor material zoning @ stone ground-floor base |

## Resemblance aggregate (T-093)
**FAIL** — gaps 10/2; failures: +x+z:drifted, -x+z:drifted

## Kit presence (T-100)
**PASS** — every kit entry present at its grammar sites

Skips (recorded): openings:door (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence)); openings:light (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence))

## Kit-aware verdict
**FAIL** — resemblance fail ∧ kit presence pass (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)
