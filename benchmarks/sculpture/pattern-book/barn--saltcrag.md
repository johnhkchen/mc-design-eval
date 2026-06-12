# Pattern-book chain — barn--saltcrag (pattern-book-chain/v1, T-143-01)

Sketch (T-123) → recognized program (T-125, consumed) → seeded realization (pack `saltcrag`,
declared budget 6 rounds) → workshop revision (T-126) → final build. Replay:
`npm run patternbook:saltcrag:repro` / `npm run patternbook:saltcrag:offline` (byte-identical, no model, no GL).

| stage | receipt |
| --- | --- |
| sketch | `8a0390e55ed0ef60…` + sheet `912e19e9bc757998…` |
| recognition | program `de83dafbfd90f52a…` — draft reproduced byte-identically; asks 1/3 |
| seed | `benchmarks/sculpture/workshop/barn--saltcrag/program.json` (`07e0b9f0a38f2193…`), 11645 cells, regularity PASS — MEASURED (T-133) + proportion gate ARMED (T-135): ridge:eave 2.4 / roofShare 0.5833 / aspect 1.8462 vs targets 2.1 / 0.5238 / 1.8462 |
| workshop | **done** after 2/6 rounds — accepted 1, rolled back 0; gate 7✓/0f → 7✓/0f |
| final | `benchmarks/sculpture/workshop/barn--saltcrag/final-artifact.json` (`5185c878ce5e649f…`) |

Judging is NOT this chain's: the frozen judge runs once per subject from outside the
workshop (`npm run gate:patternbook:barn:saltcrag`); the T-126 isolation receipt covers this file.
