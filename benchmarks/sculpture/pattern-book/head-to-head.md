# Pattern-book vs metrology-path bests (E-31, T-127-01)

Verdicts quoted as judged (the frozen gate, one run per subject per label); deltas are
arithmetic. Negative gap delta = fewer judged gaps than the metrology best; positive
same-object delta = more views judged the same object.

## cottage

| path | verdict | gaps (count/budget) | same-object | kit presence | per-view |
| --- | --- | --- | --- | --- | --- |
| **patternbook** | FAIL | 11/2 | 2/4 | fail | +x+z same object (minor material zoning@upper storey walls; minor massing@overall massing and roof footprint; minor palette@chimney)<br>+x-z same object (minor palette@rooftop chimney; minor material zoning@upper-storey walls)<br>-x-z drifted (major material zoning@walls (entire wall surface); major massing@overall building height vs roof; minor palette@rooftop chimney)<br>-x+z drifted (major massing@roof vs walls overall; major material zoning@ground storey and wall framing; minor palette@rooftop chimney) |
| **generated** | FAIL | 10/2 | 2/4 | pass | +x+z same object (minor massing@roofline chimney; minor material zoning@upper timber-framed walls in shadow under the eaves)<br>+x-z same object (minor form@roof ridge / apex; minor massing@chimney on the roof)<br>-x-z drifted (major form@main roof, near slope; major massing@roof shingle coverage; minor material zoning@upper walls and base)<br>-x+z drifted (major form@roof apex / ridge; major massing@upper roof massing (offset, gapped slabs); minor material zoning@upper timber-framed wall under eaves) |

Deltas (patternbook − generated): gaps 1, same-object +0.

Sheet (patternbook): `pr/assets/frames/multi-angle-cottage-patternbook.png`
Sheet (generated): `pr/assets/frames/multi-angle-cottage-generated.png`

## barn

| path | verdict | gaps (count/budget) | same-object | kit presence | per-view |
| --- | --- | --- | --- | --- | --- |
| **patternbook** | FAIL | 8/2 | 4/4 | pass | +x+z same object (minor material zoning@long wall openings; minor form@gable apex trim)<br>+x-z same object (minor material zoning@long side wall windows; minor form@roof pitch slightly shallower than concept gable)<br>-x-z same object (minor palette@long roof slope; minor material zoning@side wall openings)<br>-x+z same object (minor massing@long side wall; minor form@wall openings) |
| **generated** | FAIL | 12/2 | 0/4 | pass | +x+z drifted (major massing@walls all around; major form@roof surface; minor palette@stone base and brown roof)<br>+x-z drifted (major form@near roof slope and ridge; major massing@roof shingle coverage across the whole roof; minor form@upper gable wall, partly open)<br>-x-z drifted (major form@roof slope facing viewer; major massing@roof shingle surface; minor form@near eave / wall-top junction)<br>-x+z drifted (major form@both roof slopes — open rafter framing instead of a solid shingled mass; major massing@roof shingle coverage across the whole span; minor material zoning@upper gable/wall infill above the stone base) |

Deltas (patternbook − generated): gaps -4, same-object +4.

Sheet (patternbook): `pr/assets/frames/multi-angle-barn-patternbook.png`
Sheet (generated): `pr/assets/frames/multi-angle-barn-generated.png`

## Chain receipts (pattern-book side)

### cottage — chain receipts
Workshop: **budget-exhausted** after 6/6 rounds (accepted 1, rolled back 1); conformance 6✓/2f → 6✓/2f; seed 7803 cells; recognition asks 1/3.
Generated-path census: spikes 57, ragged rate 0.081.

### barn — chain receipts
Workshop: **done** after 3/6 rounds (accepted 2, rolled back 0); conformance 7✓/0f → 7✓/0f; seed 11594 cells; recognition asks 3/3.
Generated-path census: spikes 175, ragged rate 0.125.
