# Pattern-book chain — barn--saltcrag (pattern-book-chain/v1, T-132-01)

Sketch (T-123) → recognized program (T-125, consumed) → seeded realization (pack `saltcrag`,
declared budget 6 rounds) → workshop revision (T-126) → final build. Replay:
`npm run patternbook:saltcrag:repro` / `npm run patternbook:saltcrag:offline` (byte-identical, no model, no GL).

| stage | receipt |
| --- | --- |
| sketch | `8a0390e55ed0ef60…` + sheet `912e19e9bc757998…` |
| recognition | program `de83dafbfd90f52a…` — draft reproduced byte-identically; asks 1/3 |
| seed | `benchmarks/sculpture/workshop/barn--saltcrag/program.json` (`d962934d0acf4718…`), 10117 cells, conformance PASS |
| workshop | **done** after 4/6 rounds — accepted 1, rolled back 2; gate 6✓/0f → 6✓/0f |
| final | `benchmarks/sculpture/workshop/barn--saltcrag/final-artifact.json` (`6eedbc874362d200…`) |

Judging is NOT this chain's: the frozen judge runs once per subject from outside the
workshop (`npm run gate:patternbook:barn:saltcrag`); the T-126 isolation receipt covers this file.
