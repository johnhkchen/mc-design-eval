# Multi-angle same-object gate — gatehouse (styled) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-gatehouse-styled.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/styled/gatehouse/artifact.json` (sha256 `a8b4c58e3571…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | drifted<br>major form @ roof — the build's roof is broken, stepped and lumpy with protruding blocks instead of one clean ridge-to-eave pitch<br>major massing @ right end / overall outline — extra protruding masses and a ragged outline break the clean single rectangular box of the references<br>minor material zoning @ front archway — the dark door/arch reads but is partly obscured and less centered than the concept |
| +x-z | 135° | yes | pass | drifted<br>major form @ roof<br>major palette @ walls<br>minor massing @ overall building mass |
| -x-z | 225° | yes | pass | drifted<br>major form @ roof across the whole top<br>major massing @ right-hand end of the building<br>minor palette @ walls and roof stonework |
| -x+z | 315° | yes | pass | drifted<br>major form @ overall roof and walls<br>major massing @ roof ridge and eaves<br>minor form @ top corners and parapet |

## Resemblance aggregate (T-093)
**FAIL** — gaps 12/2; failures: +x+z:drifted, +x-z:drifted, -x-z:drifted, -x+z:drifted

## Kit presence (T-100)
**PASS** — every kit entry present at its grammar sites

Skips (recorded): openings:infill (kit names no treatment for this slot); openings:shutters (kit names no treatment for this slot); openings:door (kit names no treatment for this slot); openings:light (kit names no treatment for this slot)

## Kit-aware verdict
**FAIL** — resemblance fail ∧ kit presence pass (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)
