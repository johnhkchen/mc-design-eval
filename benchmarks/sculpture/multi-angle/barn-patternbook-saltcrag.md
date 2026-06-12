# Multi-angle same-object gate — barn (patternbook-saltcrag) — T-093-01

![sheet](../../../pr/assets/frames/multi-angle-barn-patternbook-saltcrag.png)

**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.

Artifact: `benchmarks/sculpture/workshop/barn--saltcrag/final-artifact.json` (sha256 `6eedbc874362…`) · zones: concept · contract: +x+z, +x-z, -x-z, -x+z @ 30°, 512², coverage ≥ 0.5, gap budget 2

| view | azimuth | rendered | T-088 coverage | judge verdict |
|---|---|---|---|---|
| +x+z | 45° | yes | pass | same object<br>minor form @ long side wall openings<br>minor massing @ roof pitch relative to wall height |
| +x-z | 135° | yes | pass | same object<br>minor massing @ long side walls<br>minor form @ roof eave overhang |
| -x-z | 225° | yes | pass | same object<br>minor material zoning @ lower stone wall along the long side<br>minor form @ gable-end door and openings |
| -x+z | 315° | yes | pass | same object<br>minor massing @ long wall openings<br>minor form @ roof eave overhang |

## Resemblance aggregate (T-093)
**FAIL** — gaps 8/2; failures: (all):gap-budget

## Kit presence (T-100)
**FAIL** — named absences:
- `missing: cobblestone panel @ band0 (5 cells)`

Skips (recorded): frame (all-flagged); course (all-flagged); openings (no concept-declared apertures supplied)

## Kit-aware verdict
**FAIL** — resemblance fail ∧ kit presence fail (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)
