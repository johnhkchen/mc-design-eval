# T-066-01 — Progress

## Status: implementing (Steps 1–3 done; 4–6 in progress)

Phases Research→Plan complete. Implementing per plan.

## Step log

- **Step 1 — pure assembler + tests** ✅ `src/form/e19-cleanup.mjs` + `…test.mjs` (11 tests). `npm test`
  676/676 green. Commit `feat(E-19 T-066-01): pure e19-cleanup assembler + tests`.
- **Step 2 — runner + package script** ✅ `benchmarks/sculpture/e19-build.mjs` (routed+prune+clean clone of
  e18-remeasure's scaffolding, busy re-score via `occupancyFromArtifact`, marginal-Δ attribution, frame copy),
  `package.json` `e19:build`. Offline path verified. Commit `feat(E-19 T-066-01): e19-build runner …`.
- **Step 3 — live sweep ×7** ✅ all 7 built + rendered + scored; `e19-cleanup.{md,json}` + before/after frames
  written. Commit `feat(E-19 T-066-01): rebuild all 7 …`.

## DEVIATION (Step 3) — prune gate (consolidation finding)

The plan said "compose the three fixes as-is". The first live sweep surfaced a real **routing×prune
interaction**: pineapple form IoU fell **0.907 → 0.811**. Isolated it (rendered routed-unpruned vs
routed-pruned with the same judge): `pruneStrays` was the cause. In E-18 (universal thin) pineapple was one
component, so prune was a no-op; in E-19 **routing sends solids to plain `voxelizeGlb`**, where pineapple's
crown tips disconnect into 11 tiny components (45 cells), and `pruneStrays`' relative floor (minFraction 0.5,
calibrated for moai's gross duplicate masses) **clipped them** → −0.096 IoU on a 1.3%-of-cells removal (the
specks are silhouette-load-bearing crown geometry, not noise).

**Resolution (chosen, in-runner, no frozen-module edit):** a `PRUNE_GATE_FRACTION = 0.9` gate — prune ONLY
when the routed build is a real multi-mass hallucination (`largestFraction < 0.9`). moai (0.52) qualifies;
near-single-mass solids (pineapple 0.987 / heart 0.986 / mushroom 0.998 / koi 0.976) keep their incidental
specks. This separates "stray hallucination" (E-19's target) from "incidental voxelization disconnection"
(load-bearing geometry). Re-ran the sweep: pineapple recovered to **0.907**, heart/mushroom/dancing-man hold
at busy form IoU, **moai keeps its full stray fix (2023→0, frac 0.52→1)**. Documented in the runner header,
the artifact rationale, and the marginal-Δ block. Does NOT touch `pruneStrays` (so e18-remeasure is
unaffected — and would be a no-op there anyway: e18's only sub-0.9 build is moai at 0.519).

## Headline result (e19-cleanup.{md,json})

- **off-palette → 0 on all 7** (busy avg 1149; moai 887 / heart 1174 / mushroom 5981 → 0). Palette discipline.
- **moai strays gone** (2023→0, largest-frac 0.52→1, components 6→1). The stray-geometry headline.
- **form IoU held** (busy avg 0.763 → E-19 0.761; only moai regresses, and its GLB is reference-corrupt).
  Routing recovered the universal-thin solid regressions (dancing-man 0.814→0.914, mushroom 0.929→0.98).
- **distinct held/tighter** (mushroom 6→5); **speckle all ≤ 0.045** (the seg baseline was already
  region-segmented so it was already speckle-low; the big speckle win was vs R1/R2 in E-18).
- **value ΔE rose** (avg 7.19→9.81; moai 14.05, koi 17.55) — the known design-doc-palette discipline cost
  (ablation tautology), reported as a cost not hidden.
- **Headline answer:** yes on colour cleanliness (off-pal 0, speckle ≤ 0.05) with two honest caveats below.

## Status: COMPLETE (Steps 1–6 done)

- **Step 4** ✅ `design-learnings.md` E-19 cleanup section — backlog closed by number (T-062/063/064/065),
  headline answer, two honest caveats, consolidation finding. Commit `docs(E-19 T-066-01): design-learnings
  voxel-cleanup section + E-12 handoff`.
- **Step 5** ✅ E-12 handoff `pr/assets/voxel-cleanup.md` + before/after frames `pr/assets/frames/e19-{moai,
  heart,koi}-{before,after}.png`. Same commit.
- **Step 6** ✅ final `npm test` **676/676 green**; `review.md` written (changes, AC table, test coverage +
  gap, deviation, open concerns).

All 5 acceptance criteria met. Headline: GLB-voxel colour is now as clean as text→JSON on colour cleanliness
(0 off-palette ×7, speckle ≤ 0.05), with two named/honest caveats (value-ΔE tautology, moai's corrupt GLB).
