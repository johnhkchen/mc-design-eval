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
| 0 | seed | — | 1.55 | 0.3548 | 1.1379 | FAIL — roofShare |
| 1 | revise (rolled back) | major: overall silhouette<br>minor: upper storey walls<br>minor: ground storey | 1.55 | 0.3548 | 1.1379 | FAIL — roofShare |
| 2 | revise (rolled back) | major: overall silhouette<br>minor: upper walls<br>minor: ground storey | 1.55 | 0.3548 | 1.1379 | FAIL — roofShare |
| 3 | revise (rolled back) | major: overall silhouette<br>minor: upper storey (white_terracotta)<br>minor: ground storey (stone_bricks base) | 1.55 | 0.3548 | 1.1379 | FAIL — roofShare |
| 4 | revise (rolled back) | major: overall silhouette<br>minor: upper storey walls<br>minor: ground storey base | 1.55 | 0.3548 | 1.1379 | FAIL — roofShare |
| 5 | revise (rolled back) | major: roof vs walls (whole silhouette)<br>minor: upper white_terracotta infill<br>minor: ground-storey plinth | 1.55 | 0.3548 | 1.1379 | FAIL — roofShare |
| 6 | revise (rolled back) | major: roof vs walls (whole silhouette)<br>minor: front wing / cross-gable | 1.55 | 0.3548 | 1.1379 | FAIL — roofShare |

## The named defect

**roofShare 0.3548 vs target 0.293 (sketch) — Δrel 0.2109 > tolerance 0.15.** The build reads as mostly roof: the silhouette's widest layer (jetty + eave overhang) sits low, so the storeys below it are a sliver of the elevation — the squat-storey / shallow read the judge-side coverage rejection and the model's own critique kept describing, now with a number every round could have aimed at.
