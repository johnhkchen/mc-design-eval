# Proportion witness — cottage (proportion-witness/v1, T-135-01)

The proportion-vs-concept check (S-135) run over the committed workshop chain, round by
round, with the declared targets the chain never had. Deterministic end to end: prefix
replay of the committed ledger, orthographic silhouettes, no model, no GL, no judge runs.
Reproduce: `npm run proportion:repro`.

## Declared targets

- concept segmentation: coverage 0.9673 → NOT segmentable (full illustrated scene) — the conditioned sketch is the recorded fallback for every height ratio
- ridge:eave **1.4145 (sketch)**, roof share **0.293 (sketch)**, aspect **1.1852 (sketch)**; tolerance 0.15 (relative)

## The chain, measured per round

| round | action | critique issues | ridge:eave | roof share | aspect | proportion gate |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | seed | — | 4.5 | 0.7778 | 1.0357 | FAIL — ridgeToEave, roofShare |
| 1 | revise | major: upper storey (white_terracotta band)<br>major: roof vs walls overall mass<br>minor: roof eave / gable verge<br>minor: upper-storey windows<br>minor: white infill color | 4.5 | 0.7778 | 1.0357 | FAIL — ridgeToEave, roofShare |
| 2 | revise | major: upper storey walls (all faces)<br>major: main roof eaves<br>minor: window surrounds<br>minor: overall proportion | 4.5 | 0.7778 | 1.0357 | FAIL — ridgeToEave, roofShare |
| 3 | revise | major: upper storey, all facades<br>minor: roof mass (all views)<br>minor: chimney | 4.5 | 0.7778 | 1.0357 | FAIL — ridgeToEave, roofShare |
| 4 | revise | major: upper storey (cream walls, all faces)<br>minor: roof vs walls overall<br>minor: roof field color<br>minor: ground storey stone | 4.5 | 0.7778 | 1.0357 | FAIL — ridgeToEave, roofShare |
| 5 | revise | major: wing upper storey (+x face, x=25)<br>minor: -z (south) upper facade<br>minor: overall upper storey<br>minor: roof | 4.5 | 0.7778 | 1.0357 | FAIL — ridgeToEave, roofShare |
| 6 | done | minor: roof vs upper storey<br>minor: timber studs<br>minor: wing roof | 4.5 | 0.7778 | 1.0357 | FAIL — ridgeToEave, roofShare |

## The named defect

**ridgeToEave 4.5 vs target 1.4145 (sketch) — Δrel 2.1813 > tolerance 0.15.** The build reads as mostly roof: the silhouette's widest layer (jetty + eave overhang) sits low, so the storeys below it are a sliver of the elevation — the squat-storey / shallow read the judge-side coverage rejection and the model's own critique kept describing, now with a number every round could have aimed at.
