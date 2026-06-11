# Multi-angle same-object gate — barn (generated) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-barn-generated.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/generated/barn/artifact.json` (sha256 `8f33e3af1f45…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | drifted<br>major massing @ walls all around<br>major form @ roof surface<br>minor palette @ stone base and brown roof |
| +x-z | 135° | yes | pass | drifted<br>major form @ near roof slope and ridge<br>major massing @ roof shingle coverage across the whole roof<br>minor form @ upper gable wall, partly open |
| -x-z | 225° | yes | pass | drifted<br>major form @ roof slope facing viewer<br>major massing @ roof shingle surface<br>minor form @ near eave / wall-top junction |
| -x+z | 315° | yes | pass | drifted<br>major form @ both roof slopes — open rafter framing instead of a solid shingled mass<br>major massing @ roof shingle coverage across the whole span<br>minor material zoning @ upper gable/wall infill above the stone base |

## Resemblance aggregate (T-093)
**FAIL** — gaps 12/2; failures: +x+z:drifted, +x-z:drifted, -x-z:drifted, -x+z:drifted

## Kit presence (T-100)
**PASS** — every kit entry present at its grammar sites

Skips (recorded): frame (all-flagged); course (all-flagged); openings:infill (kit names no treatment for this slot); openings:shutters (kit names no treatment for this slot); openings:door (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence))

## Kit-aware verdict
**FAIL** — resemblance fail ∧ kit presence pass (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)
