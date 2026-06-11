# Recognition draft — cottage (recognition-draft/v1, T-125-01)

The model's reading: An English yeoman's cross-gabled cottage. Two perpendicular gable wings meet at a front corner with a stone chimney rising from the valley. The concept overrides the rustic rubble default: the GROUND storey is crisp coursed dressed stone (ashlar → wall.dressing), and the UPPER storey is cream lime-plaster infill (wall.infill.upper) carried in a near-black coppice-oak half-timber frame (timber-frame treatment) that jetties out over the stone base — classic Tudor oversailing. Roof is warm sawpit plank courses (roof.field) with the darker oak fascia banding (roof.trim) at eave and verge; gable ends show the cream infill. Shuttered lattice windows (dark-oak trapdoor reveals) appear both storeys; a boarded spruce door sits in a dressed-stone reveal at ground; brick-capped fieldstone chimney. The sketch read 4 storeys (~4.8 blocks) and a 27-block height — mesh noise; the concept plainly reads two storeys, so I substitute a regular 2-storey shell at storeyHeight 4. I decompose the L/T footprint into a long main mass (ridge along z) and a shorter cross wing protruding +x (ridge along x) so the two gables stand perpendicular as seen. Pitch read 35.5° rounds to the pack's single pitch class. Mirror score 0.54 is below threshold (asymmetric L) — no symmetry declared.

| | |
| --- | --- |
| model | `claude-opus-4-8` (strong tier, subscription shim) |
| asks | 1 live (budget 3; 1 ledger entries) |
| prompt | `de71f2c551c02ab3…` (committed: cottage.prompt.md) |
| masses | main 18×28×2st, wing 8×15×2st |
| elements | main-shell(683), main-plinth(88), main-jetty--x(42), main-jetty--z(27), main-roof(3080), main-chimney(21), main-head--x-1-0(1), main-head--x-0-0(1), main-head--x-1-1(1), main-head--x-2-0(1), main-head--x-2-1(1), main-head-+z-3-0(1), main-head--z-4-0(1), wing-shell(330), wing-plinth(42), wing-jetty-+x(23), wing-roof(648), wing-head-+x-0-0(1), wing-head-+x-1-0(1) |
| cells | 4993 (zero mesh cells — realized from the program alone) |
| conformance | **PASS** — courses-even ✓, symmetry-held ✓, openings-rhythm ✓, palette-in-pack ✓, watertight ✓, single-component ✓ |

Renders (evidence, never gating):
- `benchmarks/sculpture/recognition/view-cottage-+x+z.png` (+x+z) sha256 48f43989464776df…
- `benchmarks/sculpture/recognition/view-cottage-+x-z.png` (+x-z) sha256 54956a8d537b9cac…
- `benchmarks/sculpture/recognition/view-cottage--x-z.png` (-x-z) sha256 9de6fa229450f64a…
- `benchmarks/sculpture/recognition/view-cottage--x+z.png` (-x+z) sha256 22e61b28226812fd…

Replay: `npm run recognize:offline` re-derives the artifact byte-identically from the
committed program (E-31 Rule 5). Revision belongs to the workshop (S-126); grading to S-127.
