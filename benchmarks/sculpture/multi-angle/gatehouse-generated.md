# Multi-angle same-object gate — gatehouse (generated) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-gatehouse-generated.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/generated/gatehouse/artifact.json` (sha256 `80c904c7861f…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | drifted<br>major form @ roof / top of structure<br>major material zoning @ walls (whole body)<br>minor massing @ overall body / interior |
| +x-z | 135° | yes | pass | drifted<br>major form @ roof/top of structure<br>major massing @ overall body — open hollow interior visible<br>minor material zoning @ walls vs roof |
| -x-z | 225° | yes | pass | drifted<br>major form @ roof / top of structure<br>major material zoning @ walls vs roof across the whole body<br>minor massing @ interior / overall body |
| -x+z | 315° | yes | pass | drifted<br>major form @ roof / top of structure<br>major massing @ overall body / interior<br>minor material zoning @ walls vs roof |

## Resemblance aggregate (T-093)
**FAIL** — gaps 12/2; failures: +x+z:drifted, +x-z:drifted, -x-z:drifted, -x+z:drifted

## Kit presence (T-100)
**PASS** — every kit entry present at its grammar sites

Skips (recorded): openings:door (kit names no treatment for this slot); openings:light (kit names no treatment for this slot)

## Kit-aware verdict
**FAIL** — resemblance fail ∧ kit presence pass (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)
