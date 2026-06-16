# Recognition draft — gatehouse (recognition-draft/v1, T-171-01)

The model's reading: A small square stone gatehouse, one tall hall under a steep gable. The concept is grey throughout: coursed dressed-stone wall fields with rough rubble quoins running the corners, a single dark-timber-surrounded arched passage on the gable end, and a pair of narrow slit windows on the eave-side wall. Roof reads dark (whole-roof darkened toward oak, as the barn does) with a lighter stone eave/verge course banding the edges. The sketch confirms a near-square ~15-block footprint with mirror symmetry on x, eave ~21 blocks and a tall roof (eave fraction 0.70); the corner notches in the footprint polygon are the projecting rubble quoins, not separate masses. Per material precedence the concept inverts the rubble/dressed default — field is coursed stone (wall.dressing), corners are rubble (wall.field.ground). Ridge runs x so the arched gable end faces -x and the slope-and-window eave sides face ±z. One clean rectangular mass; protrusions in the digest are quoins. Pitch read 37.87°/rise~1.25 → pitchClass 1; no dormers or chimney visible.

| | |
| --- | --- |
| model | `claude-opus-4-8` (strong tier, subscription shim) |
| asks | 1 live (budget 3; 1 ledger entries) |
| prompt | `95e9b4583c2d2b95…` (committed: gatehouse.prompt.md) |
| masses | hall 15×15×4st |
| elements | hall-shell(1064), hall-roof(1215), hall-head--x-0-0(4), hall-head-+z-1-0(1), hall-head-+z-1-1(1), hall-head--z-2-0(1), hall-head--z-2-1(1) |
| cells | 2287 (zero mesh cells — realized from the program alone) |
| conformance | **PASS** — courses-even ✓, symmetry-held ✓, openings-rhythm ✓, palette-in-pack ✓, watertight ✓, single-component ✓ |

Renders (evidence, never gating):
- `benchmarks/sculpture/recognition/view-gatehouse-+x+z.png` (+x+z) sha256 f4a1fdf767ea3618…
- `benchmarks/sculpture/recognition/view-gatehouse-+x-z.png` (+x-z) sha256 69e82f4e5ca74fb6…
- `benchmarks/sculpture/recognition/view-gatehouse--x-z.png` (-x-z) sha256 51dce4909387fdf2…
- `benchmarks/sculpture/recognition/view-gatehouse--x+z.png` (-x+z) sha256 1aaad8071bd3621f…

Replay: `npm run recognize:offline` re-derives the artifact byte-identically from the
committed program (E-31 Rule 5). Revision belongs to the workshop (S-126); grading to S-127.
