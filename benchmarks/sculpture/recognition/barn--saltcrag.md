# Recognition draft — barn--saltcrag (recognition-draft/v1, T-132-01)

The model's reading: A long single-mass barn under one steep gable. The sketch's clean 48×24 rectangle and ridge-along-x read directly as a rectangular hall, eave ~10 / total ~21 → a true 45° pitch (pitchClass 1, rise=run). The 'lumpy' end-elevation triangle with green eave / purple ridge is recognized as a plain gable end, not a literal mesh — substituted clean. Concept evidence overrides the saltcrag rubble default for the ground: the working face is undressed grey fieldstone (wall.field.ground=cobblestone) panelled between squared dressed-stone pilasters and quoins (wall.dressing.quoin=stone_bricks), seated on a single dressed plinth course, exactly the stone-brick base band in the picture. Walls run stone uniformly to the eave, so the upper band stays fieldstone rather than the pack's boarded loft, and the gable triangle is infilled in the same stone with a single tall slit vent high in the apex. The roof is the signature tarred dark-oak shingle (roof.field=dark_oak_planks) capped along the most-beaten ridge by a bought slate course (roof.ridge=deepslate_tiles). Two plain tarred deal doors on the eave-side long wall, spanned by salvaged driftwood lintels (opening.lintel=spruce_log). No chimney or dormers are present — it is an unheated working barn. Mirror is across the ridge (recorded, below the sketch's 0.8 threshold so not asserted).

| | |
| --- | --- |
| model | `claude-opus-4-8` (strong tier, subscription shim) |
| asks | 1 live (budget 3; 1 ledger entries) |
| prompt | `c354a3f407807e11…` (committed: barn.prompt.md) |
| masses | hall 48×24×3st |
| elements | hall-shell(1236), hall-plinth(140), hall-roof(8736), hall-head-+z-0-0(2), hall-head-+z-0-1(2), hall-head--x-1-0(1) |
| cells | 10117 (zero mesh cells — realized from the program alone) |
| conformance | **PASS** — courses-even ✓, symmetry-held ✓, openings-rhythm ✓, palette-in-pack ✓, watertight ✓, single-component ✓ |

Renders (evidence, never gating):
- `benchmarks/sculpture/recognition/view-barn--saltcrag-+x+z.png` (+x+z) sha256 e42ca5e7f38ff35a…
- `benchmarks/sculpture/recognition/view-barn--saltcrag-+x-z.png` (+x-z) sha256 5ca2d630e0cb7bdf…
- `benchmarks/sculpture/recognition/view-barn--saltcrag--x-z.png` (-x-z) sha256 ea1bca149d8a39a0…
- `benchmarks/sculpture/recognition/view-barn--saltcrag--x+z.png` (-x+z) sha256 52bfda322e1d4ed2…

Replay: `npm run recognize:offline` re-derives the artifact byte-identically from the
committed program (E-31 Rule 5). Revision belongs to the workshop (S-126); grading to S-127.
