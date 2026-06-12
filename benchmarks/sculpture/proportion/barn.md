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
| 0 | seed | — | 2.4 | 0.5833 | 1.7143 | pass |
| 1 | revise (rolled back) | major: +z long wall, wagon doors (x15-17, x30-32)<br>minor: overall silhouette / roof<br>minor: long-wall bay rhythm<br>minor: gable end | 2.4 | 0.5833 | 1.7143 | pass |
| 2 | revise | major: roof / gable silhouette<br>minor: gable end wall<br>minor: +z facade windows | 2.0833 | 0.52 | 1.8462 | pass |
| 3 | revise (rolled back) | major: +z front wall, right wagon doorway (x30–32)<br>minor: Wall panels (both long walls)<br>minor: Silhouette aspect<br>minor: Gable end | 2.0833 | 0.52 | 1.8462 | pass |
| 4 | done | minor: long walls (windows)<br>minor: aspect ratio | 2.0833 | 0.52 | 1.8462 | pass |

## The named defect

No whole-object ratio ends beyond tolerance — the chain's proportions match the declared targets.
