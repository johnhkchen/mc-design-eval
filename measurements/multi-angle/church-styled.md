# Multi-angle same-object gate — church (styled) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-church-styled.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/styled/church/artifact.json` (sha256 `7275e77ba9e7…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | drifted<br>major form @ main nave roof across the whole ridge<br>minor form @ tower cap at the right<br>minor palette @ stone walls and roof coloring |
| +x-z | 135° | yes | pass | drifted<br>major form @ roof over the whole nave and tower<br>major palette @ nave and tower walls<br>minor massing @ right-end tower massing |
| -x-z | 225° | yes | pass | drifted<br>major form @ whole roof across the top<br>major massing @ right-hand end of the building body<br>minor palette @ walls and roof stonework |
| -x+z | 315° | yes | pass | drifted<br>major form @ roof along the whole nave and tower cap<br>major massing @ upper tower / ridge junction<br>minor palette @ stone walls and brown roof color |

## Resemblance aggregate (T-093)
**FAIL** — gaps 12/2; failures: +x+z:drifted, +x-z:drifted, -x-z:drifted, -x+z:drifted

## Kit presence (T-100)
**PASS** — every kit entry present at its grammar sites

Skips (recorded): panel:band0 (no-candidate); course (no-candidate); openings:infill (kit names no treatment for this slot); openings:shutters (kit names no treatment for this slot); openings:door (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence))

## Kit-aware verdict
**FAIL** — resemblance fail ∧ kit presence pass (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)
