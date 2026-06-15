# T-061-01 Progress — execution log

**Status: complete.** All 5 plan steps landed; `npm test` 608 green (600 baseline + 8 new). No
deviations from the plan.

## Plan execution log

| Step | What landed | Verify | Commit |
|---|---|---|---|
| 1 | `src/form/e18-scorecard.mjs` + `e18-scorecard.test.mjs` (+ RDSPI artifacts) | `node --test` 8/8 | `feat(E-18 T-061-01): e18-scorecard pure core …` |
| 2 | `benchmarks/sculpture/e18-scorecard.mjs` → `pr/assets/surface-and-thin.md` + `e18-scorecard.json` + 3 composites | ran live; 3/3 stitched; numbers spot-checked vs spine | `feat(E-18 T-061-01): surface-and-thin scorecard + before/after composites …` |
| 3 | `docs/knowledge/design-learnings.md` E-18 section | read-back; numbers match spine | `docs(E-18 T-061-01): design-learnings E-18 section + frames provenance` |
| 4 | `pr/assets/frames/README.md` provenance block | read-back; source paths exist | (same commit as Step 3) |
| 5 | full gate + progress + review | `npm test` 608/608 | (this artifact + review.md) |

## AC evidence

**AC #1 — updated scorecard (`pr/assets/surface-and-thin.md`, `e18-scorecard.json`).** ✅ E-18 combined
vs E-17 R1/R2 per subject across all five axes (form IoU + speckle + distinct + off-palette + value ΔE)
with the marginal Δ each fix bought. The "What each fix bought" table:
- **material segmentation** (E18−R2 speckle): avg **−0.180**, 7/0/0, won-clean.
- **palette discipline** (E18−R2 off-pal): avg **−2791**, 7/0/0, won-discipline (distinct ↓, off-pal → 0).
- **thin voxelization** (E18−R1 form IoU): avg −0.004, 4/0/3, routed tradeoff.

**AC #2 — before/after visuals (`pr/assets/frames/`).** ✅ `speckle-heart.png`, `speckle-koi.png`
(R2 → E18 segmented), `thin-bow-and-arrow.png` (base 4-component → thin 1-component). 1030×512 each,
committed (sources gitignored). Stitched via the pure `montageRow`.

**AC #3 — design-learnings E-18 section.** ✅ The palette-discipline win (distinct ↓, off-pal → 0), the
gradient/speckle win (clean banding vs scatter, −0.18 avg 7/7), the thin gain (bow 0.473 → 0.526, 4→1),
the **form-type-routing rule** (image→3D for bulky/organic; text→JSON for thin/angular; sword the
evidence), and the residual — value ΔE rose (8.67 vs 5.47), form net-flat with 3 solid regressions.

**AC #4 — E-12 handoff (`pr/assets/`).** ✅ The "cleaner materials & the form-routing story" section
appended to `surface-and-thin.md`: the two beats (surface coherence, thin form), the composite index,
the routing rule, and where it slots in the showcase. Self-contained (no reach into gitignored paths).

**AC #5 — `npm test` green.** ✅ 608/608.

## Key insight recorded

The scorecard's attribution baseline matters: **form via R1, speckle/discipline via R2.** Because palette
discipline is already wired into R1 (T-058-02), R1 and E18 share the augmented design-doc palette, so the
E18−R1 form delta is the *thin pass alone* (colour never moves a silhouette). Reading thin against R2
would conflate it with the segmentation recolor. This is why `FIXES` pins each fix to its isolating
baseline rather than a single column.

## Deviations

None. One in-flight test assertion was corrected during Step 1 (discipline fix improves **2/2** in the
fixture, not 1 — both R2 cells had off-pal > 0 dropping to 0); the code was correct, the assertion was
wrong.

## Honesty check

The scorecard and journal both state, in numbers: value ΔE **rose** (E18 8.67 vs R1 5.47) as a real cost
of palette discipline (distinct from R2's by-construction 0); form IoU **net-flat** with 3 solid
regressions shown (dancing-man −0.10, pineapple −0.06, mushroom −0.05); off-palette → 0 named as measured
against the *augmented design-doc* palette. n on every average. Nothing dropped.

## Regen recipe

```
node benchmarks/sculpture/e18-scorecard.mjs          # scorecard + json + 3 composites
node benchmarks/sculpture/e18-scorecard.mjs --no-frames   # md + json only
node --test src/form/e18-scorecard.test.mjs          # pure-core tests
```
Source renders must be present locally (`glb-voxel-clean/`, `e18-build/`, `glb-voxel-thin/` — all
gitignored); regen them via `e18-remeasure.mjs` / `glb-voxel-thin.mjs` if absent.
