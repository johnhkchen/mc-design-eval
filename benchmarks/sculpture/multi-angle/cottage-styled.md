# Multi-angle same-object gate — cottage (styled) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-cottage-styled.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/styled/cottage/artifact.json` (sha256 `33ffd0c825a0…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | drifted<br>major massing @ roof versus walls overall<br>minor material zoning @ upper timber-framed storey<br>minor form @ roof slopes and ridge |
| +x-z | 135° | yes | pass | same object<br>minor massing @ roof eaves overhang on the near side<br>minor form @ chimney atop the roof |
| -x-z | 225° | yes | pass | same object<br>minor form @ roof ridge and slopes<br>minor material zoning @ upper-storey timber framing |
| -x+z | 315° | yes | pass | drifted<br>major form @ roof across the whole upper mass<br>major massing @ overall building outline / eaves<br>minor material zoning @ stone ground storey base |

## Resemblance aggregate (T-093)
**FAIL** — gaps 10/2; failures: +x+z:drifted, -x+z:drifted

## Kit presence (T-100)
**PASS** — every kit entry present at its grammar sites

Skips (recorded): openings:door (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence)); openings:light (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence))

## Kit-aware verdict
**FAIL** — resemblance fail ∧ kit presence pass (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)
