# Pattern-book chain — barn (pattern-book-chain/v1, T-143-01)

Sketch (T-123) → recognized program (T-125, consumed) → seeded realization (pack `rustic`,
declared budget 6 rounds) → workshop revision (T-126) → final build. Replay:
`npm run patternbook:repro` / `npm run patternbook:offline` (byte-identical, no model, no GL).

| stage | receipt |
| --- | --- |
| sketch | `8a0390e55ed0ef60…` + sheet `912e19e9bc757998…` |
| recognition | program `eb94efa934d59d1d…` — draft reproduced byte-identically; asks 3/3 |
| seed | `benchmarks/sculpture/workshop/barn/program.json` (`de8d79b889e1bf70…`), 11594 cells, regularity PASS — MEASURED (T-133) + proportion gate ARMED (T-135): ridge:eave 2.4 / roofShare 0.5833 / aspect 1.8462 vs targets 2.1 / 0.5238 / 1.8462 |
| workshop | **done** after 4/6 rounds — accepted 1, rolled back 2; gate 7✓/0f → 7✓/0f |
| final | `benchmarks/sculpture/workshop/barn/final-artifact.json` (`c3cdc6c6e706de1a…`) |

Judging is NOT this chain's: the frozen judge runs once per subject from outside the
workshop (`npm run gate:patternbook:barn`); the T-126 isolation receipt covers this file.
