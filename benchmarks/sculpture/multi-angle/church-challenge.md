# Multi-angle same-object gate — church (challenge) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-church-challenge.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/challenge/church/artifact.json` (sha256 `0d5db5ac29f2…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | drifted<br>major form @ nave roof<br>minor form @ tower roof/cap<br>minor palette @ walls and roof color zones |
| +x-z | 135° | yes | pass | drifted<br>major form @ nave roof ridge and edges<br>minor material zoning @ tower upper section<br>minor palette @ tower walls |
| -x-z | 225° | yes | pass | unparsed |
| -x+z | 315° | yes | pass | drifted<br>major form @ nave and tower roofs<br>minor form @ upper walls under the eaves |

## Resemblance aggregate (T-093)
**REFUSAL** — unparsed:-x-z (no pass/fail verdict is produced on a partial gate)

## Kit presence (T-100)
**FAIL** — named absences:
- `missing: polished_basalt frame @ 169/544 frame-line cells`

Skips (recorded): panel:band0 (no-candidate); course (no-candidate); openings:infill (kit names no treatment for this slot); openings:shutters (kit names no treatment for this slot); openings:door (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence))

## Kit-aware verdict
**REFUSAL** — unparsed:-x-z (kit presence still reported above)
