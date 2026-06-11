# Pattern-book vs metrology-path bests (E-31, T-127-01)

Verdicts quoted as judged (the frozen gate, one run per subject per label); deltas are
arithmetic. Negative gap delta = fewer judged gaps than the metrology best; positive
same-object delta = more views judged the same object.

## cottage

| path | verdict | gaps (count/budget) | same-object | kit presence | per-view |
| --- | --- | --- | --- | --- | --- |
| **patternbook** | FAIL | 0/2 | 0/4 | fail | +x+z coverage-rejected<br>+x-z coverage-rejected<br>-x-z coverage-rejected<br>-x+z coverage-rejected |
| **generated** | FAIL | 10/2 | 2/4 | pass | +x+z same object (minor massing@roofline chimney; minor material zoning@upper timber-framed walls in shadow under the eaves)<br>+x-z same object (minor form@roof ridge / apex; minor massing@chimney on the roof)<br>-x-z drifted (major form@main roof, near slope; major massing@roof shingle coverage; minor material zoning@upper walls and base)<br>-x+z drifted (major form@roof apex / ridge; major massing@upper roof massing (offset, gapped slabs); minor material zoning@upper timber-framed wall under eaves) |

Deltas (patternbook − generated): gaps -10, same-object -2.

> ⚠ patternbook: 4 view(s) coverage-rejected — the judge was never called there, so this row's gap count under-states the divergence; read the per-view column, not the arithmetic.

Sheet (patternbook): `pr/assets/frames/multi-angle-cottage-patternbook.png`
Sheet (generated): `pr/assets/frames/multi-angle-cottage-generated.png`

## barn

| path | verdict | gaps (count/budget) | same-object | kit presence | per-view |
| --- | --- | --- | --- | --- | --- |
| **patternbook** | FAIL | 8/2 | 4/4 | pass | +x+z same object (minor material zoning@long wall windows; minor form@roof eave overhang)<br>+x-z same object (minor form@roof pitch / apex; minor material zoning@long wall openings (windows))<br>-x-z same object (minor massing@roof; minor form@long wall windows)<br>-x+z same object (minor form@roof ridge and pitch; minor material zoning@long wall openings (windows vs concept's doored stone wall)) |
| **generated** | FAIL | 12/2 | 0/4 | pass | +x+z drifted (major massing@walls all around; major form@roof surface; minor palette@stone base and brown roof)<br>+x-z drifted (major form@near roof slope and ridge; major massing@roof shingle coverage across the whole roof; minor form@upper gable wall, partly open)<br>-x-z drifted (major form@roof slope facing viewer; major massing@roof shingle surface; minor form@near eave / wall-top junction)<br>-x+z drifted (major form@both roof slopes — open rafter framing instead of a solid shingled mass; major massing@roof shingle coverage across the whole span; minor material zoning@upper gable/wall infill above the stone base) |

Deltas (patternbook − generated): gaps -4, same-object +4.

Sheet (patternbook): `pr/assets/frames/multi-angle-barn-patternbook.png`
Sheet (generated): `pr/assets/frames/multi-angle-barn-generated.png`

## Chain receipts (pattern-book side)

### cottage — chain receipts
Workshop: **done** after 6/6 rounds (accepted 5, rolled back 0); conformance 6✓/0f → 6✓/0f; seed 4993 cells; recognition asks 1/3.
Generated-path census: spikes 57, ragged rate 0.081.

### barn — chain receipts
Workshop: **budget-exhausted** after 6/6 rounds (accepted 0, rolled back 5); conformance 6✓/0f → 6✓/0f; seed 10066 cells; recognition asks 3/3.
Generated-path census: spikes 175, ragged rate 0.125.
