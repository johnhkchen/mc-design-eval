# Multi-angle same-object gate — gatehouse (styled) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-gatehouse-styled.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/styled/gatehouse/artifact.json` (sha256 `e3b89444f3a5…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | drifted<br>major form @ roof — ridge line and slopes<br>major massing @ upper roof edges and chimney-like protrusions<br>minor form @ front doorway / arch opening |
| +x-z | 135° | yes | pass | drifted<br>major form @ roof and upper edges<br>minor massing @ overall silhouette / wall tops<br>minor palette @ stone walls and dark roof / wood trim |
| -x-z | 225° | yes | pass | drifted<br>major form @ roof / upper massing<br>major massing @ overall silhouette vs mesh<br>minor form @ front facade and doorway |
| -x+z | 315° | yes | pass | same object<br>minor form @ roof ridge, upper-left<br>minor form @ corner pilasters / wall surface |

## Resemblance aggregate (T-093)
**FAIL** — gaps 11/2; failures: +x+z:drifted, +x-z:drifted, -x-z:drifted

## Kit presence (T-100)
**PASS** — every kit entry present at its grammar sites

Skips (recorded): openings:infill (kit names no treatment for this slot); openings:shutters (kit names no treatment for this slot); openings:door (kit names no treatment for this slot); openings:light (kit names no treatment for this slot)

## Kit-aware verdict
**FAIL** — resemblance fail ∧ kit presence pass (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)
