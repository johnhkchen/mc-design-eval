# Proportion witness — barn (proportion-witness/v1, T-135-01)

The proportion-vs-concept check (S-135) run over the committed workshop chain, round by
round, with the declared targets the chain never had. Deterministic end to end: prefix
replay of the committed ledger, orthographic silhouettes, no model, no GL, no judge runs.
Reproduce: `npm run proportion:repro`.

## Declared targets

- concept segmentation: coverage 0.5148 → NOT segmentable (full illustrated scene) — the conditioned sketch is the recorded fallback for every height ratio
- ridge:eave **2.1 (sketch)**, roof share **0.5238 (sketch)**, aspect **1.8462 (sketch)**; tolerance 0.15 (relative)

## The chain, measured per round

| round | action | critique issues | ridge:eave | roof share | aspect | proportion gate |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | seed | — | 2.4444 | 0.5909 | 1.8462 | FAIL — ridgeToEave |
| 1 | revise (rolled back) | major: roof field<br>minor: long walls (+z/-z)<br>minor: gable apex vent | 2.4444 | 0.5909 | 1.8462 | FAIL — ridgeToEave |
| 2 | revise (rolled back) | major: +z facade, large openings at x15-17 and x30-32<br>minor: roof field<br>minor: +x gable end | 2.4444 | 0.5909 | 1.8462 | FAIL — ridgeToEave |
| 3 | revise (rolled back) | major: +z facade large openings (x15, x30)<br>major: long-wall bays<br>minor: overall mass / roof | 2.4444 | 0.5909 | 1.8462 | FAIL — ridgeToEave |
| 4 | revise (rolled back) | major: +z long wall, door bays at x15-17 and x30-32<br>minor: +z/-z field walls<br>minor: gable ends (±x triangles) | 2.4444 | 0.5909 | 1.8462 | FAIL — ridgeToEave |
| 5 | revise (rolled back) | major: +z facade, big bays at x15 and x30<br>minor: +z / -z long walls<br>minor: gable rake (+x end) | 2.4444 | 0.5909 | 1.8462 | FAIL — ridgeToEave |
| 6 | revise (rolled back) | major: +z long wall, x15-17 & x30-32 ground openings<br>minor: +z facade overall<br>minor: gable end | 2.4444 | 0.5909 | 1.8462 | FAIL — ridgeToEave |

## The named defect

**ridgeToEave 2.4444 vs target 2.1 (sketch) — Δrel 0.164 > tolerance 0.15.** The build reads as mostly roof: the silhouette's widest layer (jetty + eave overhang) sits low, so the storeys below it are a sliver of the elevation — the squat-storey / shallow read the judge-side coverage rejection and the model's own critique kept describing, now with a number every round could have aimed at.
