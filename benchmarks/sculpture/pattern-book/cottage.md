# Pattern-book chain — cottage (pattern-book-chain/v1, T-127-01)

Sketch (T-123) → recognized program (T-125, consumed) → seeded realization (declared budget
6 rounds) → workshop revision (T-126) → final build. Replay:
`npm run patternbook:repro` / `npm run patternbook:offline` (byte-identical, no model, no GL).

| stage | receipt |
| --- | --- |
| sketch | `fec1a6691882ec6a…` + sheet `2d7da60946c76828…` |
| recognition | program `a7b60b01857c0c8b…` — draft reproduced byte-identically; asks 1/3 |
| seed | `benchmarks/sculpture/workshop/cottage/program.json` (`4a0c3ca940e15d0d…`), 4993 cells, conformance PASS |
| workshop | **done** after 6/6 rounds — accepted 5, rolled back 0; gate 6✓/0f → 6✓/0f |
| final | `benchmarks/sculpture/workshop/cottage/final-artifact.json` (`cc9530aa6d562194…`) |

Judging is NOT this chain's: the frozen judge runs once per subject from outside the
workshop (`npm run gate:patternbook:cottage`); the T-126 isolation receipt covers this file.
