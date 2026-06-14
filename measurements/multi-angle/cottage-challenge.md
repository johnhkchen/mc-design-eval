# Multi-angle same-object gate — cottage (challenge) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-cottage-challenge.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/challenge/cottage/artifact.json` (sha256 `347def099ef0…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | drifted<br>major form @ overall roof and upper storey<br>major massing @ roof eaves and ridge<br>minor material zoning @ timber-frame upper walls |
| +x-z | 135° | yes | pass | same object<br>minor form @ roof ridge and eaves<br>minor massing @ chimney on the roof |
| -x-z | 225° | yes | pass | drifted<br>major form @ roof<br>minor form @ roof eaves/beams<br>minor material zoning @ lower walls (stone base + cream storey) |
| -x+z | 315° | yes | pass | drifted<br>major form @ roof — far slope and ridge<br>minor massing @ upper timber-frame storey, right gable end<br>minor material zoning @ stone ground floor at building corner |

## Resemblance aggregate (T-093)
**FAIL** — gaps 11/2; failures: +x+z:drifted, -x-z:drifted, -x+z:drifted

## Kit presence (T-100)
**FAIL** — named absences:
- `missing: spruce_planks frame @ 1174/1884 frame-line cells`
- `missing: spruce_planks course @ roof (1 cells)`
- `missing: spruce_fence infill @ openings 1/2/3/4/5/6`
- `missing: spruce_trapdoor shutters @ openings 1/2/3/4/5/6`

Skips (recorded): openings:door (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence)); openings:light (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence))

## Kit-aware verdict
**FAIL** — resemblance fail ∧ kit presence fail (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)
