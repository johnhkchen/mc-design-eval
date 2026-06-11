# Pattern-book chain — barn (pattern-book-chain/v1, T-127-01)

Sketch (T-123) → recognized program (T-125, consumed) → seeded realization (declared budget
6 rounds) → workshop revision (T-126) → final build. Replay:
`npm run patternbook:repro` / `npm run patternbook:offline` (byte-identical, no model, no GL).

| stage | receipt |
| --- | --- |
| sketch | `8a0390e55ed0ef60…` + sheet `912e19e9bc757998…` |
| recognition | program `eb94efa934d59d1d…` — draft reproduced byte-identically; asks 3/3 |
| seed | `benchmarks/sculpture/workshop/barn/program.json` (`5286e8b3200f0158…`), 10066 cells, conformance PASS |
| workshop | **budget-exhausted** after 6/6 rounds — accepted 0, rolled back 5; gate 6✓/0f → 6✓/0f |
| final | `benchmarks/sculpture/workshop/barn/final-artifact.json` (`91ee4b2e7b6dc210…`) |

Judging is NOT this chain's: the frozen judge runs once per subject from outside the
workshop (`npm run gate:patternbook:barn`); the T-126 isolation receipt covers this file.
