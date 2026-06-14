# Multi-angle same-object gate — gatehouse (styled) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-gatehouse-styled.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/styled/gatehouse/artifact.json` (sha256 `b51dc93cae90…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | drifted<br>major form @ roof planes and ridge<br>major massing @ side and rear walls<br>minor material zoning @ timber framing across facade |
| +x-z | 135° | yes | pass | drifted<br>major form @ roof ridge and upper-left corner<br>major massing @ long wall planes<br>minor material zoning @ timber accents at the eave |
| -x-z | 225° | yes | pass | drifted<br>major massing @ roof and upper massing<br>major form @ front gate opening<br>minor form @ wall surface relief and pilasters |
| -x+z | 315° | yes | pass | drifted<br>major massing @ side and front walls<br>major form @ roof ridge and slopes<br>minor palette @ stone base and timber trim |

## Resemblance aggregate (T-093)
**FAIL** — gaps 12/2; failures: +x+z:drifted, +x-z:drifted, -x-z:drifted, -x+z:drifted

## Kit presence (T-100)
**PASS** — every kit entry present at its grammar sites

Skips (recorded): openings:infill (kit names no treatment for this slot); openings:shutters (kit names no treatment for this slot); openings:door (kit names no treatment for this slot); openings:light (kit names no treatment for this slot)

## Kit-aware verdict
**FAIL** — resemblance fail ∧ kit presence pass (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)
