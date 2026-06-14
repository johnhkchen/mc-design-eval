# Pattern-book chain — cottage (pattern-book-chain/v1, T-143-02)

Sketch (T-123) → recognized program (T-125, consumed) → seeded realization (pack `rustic`,
declared budget 6 rounds) → workshop revision (T-126) → final build. Replay:
`npm run patternbook:repro` / `npm run patternbook:offline` (byte-identical, no model, no GL).

| stage | receipt |
| --- | --- |
| sketch | `fec1a6691882ec6a…` + sheet `2d7da60946c76828…` |
| recognition | program `a7b60b01857c0c8b…` — draft reproduced byte-identically; asks 1/3 |
| seed | `benchmarks/sculpture/workshop/cottage/program.json` (`a78802b22e0cc087…`), 7803 cells, regularity PASS — MEASURED (T-133) + proportion gate ARMED (T-135): ridge:eave 1.55 / roofShare 0.3548 / aspect 1.1852 vs targets 1.4145 / 0.293 / 1.1852 |
| workshop | **budget-exhausted** after 6/6 rounds — accepted 0, rolled back 3; gate 6✓/1f → 6✓/1f |
| final | `benchmarks/sculpture/workshop/cottage/final-artifact.json` (`3674856616afe774…`) |

Judging is NOT this chain's: the frozen judge runs once per subject from outside the
workshop (`npm run gate:patternbook:cottage`); the T-126 isolation receipt covers this file.
