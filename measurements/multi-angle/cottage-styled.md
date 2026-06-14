# Multi-angle same-object gate — cottage (styled) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-cottage-styled.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/styled/cottage/artifact.json` (sha256 `55407a93bd7b…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | drifted<br>major massing @ long wall and roof plane<br>major form @ roof surface continuity<br>minor material zoning @ upper-storey half-timber infill |
| +x-z | 135° | yes | pass | drifted<br>major material zoning @ upper-storey walls (cream timber-frame infill)<br>minor form @ roof ridge / chimney<br>minor palette @ ground-storey stonework |
| -x-z | 225° | yes | pass | drifted<br>major form @ roof<br>minor material zoning @ upper timber-framed walls<br>minor massing @ roof overhang/eaves |
| -x+z | 315° | yes | pass | drifted<br>major massing @ long wall and roof plane<br>major form @ roof surface<br>minor material zoning @ stone base lower edge |

## Resemblance aggregate (T-093)
**FAIL** — gaps 12/2; failures: +x+z:drifted, +x-z:drifted, -x-z:drifted, -x+z:drifted

## Kit presence (T-100)
**PASS** — every kit entry present at its grammar sites

Skips (recorded): openings:door (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence)); openings:light (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence))

## Kit-aware verdict
**FAIL** — resemblance fail ∧ kit presence pass (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)
