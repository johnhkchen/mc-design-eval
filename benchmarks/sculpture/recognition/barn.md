# Recognition draft — barn (recognition-draft/v1, T-125-01)

The model's reading: Tithe-barn read of one place's vernacular: a single clean rectangular mass (sketch footprint [0,0]-[48,24], a true 48x24 rectangle; mirror score 0.55 is below threshold so I do not declare symmetry, but the long walls are evidently a repeating bay rhythm). The lumpy black mesh outline over the gray occupancy is a steep gable — the side elevation's purple ridge well above the green eave, and the end elevation's triangular peak, both substitute cleanly to roof.gable with ridge along x (the long axis). Eave ~10 blocks, ridge ~21: a tall steep roof, which the concept darkens across its WHOLE field toward the oak, so I read the roof field itself as roof.trim (dark_oak_planks) rather than the lighter sawpit spruce — the barn exception the pack calls out. Walls are stone, not timber-frame: uncoursed rubble fieldstone recessed panels (wall.field.ground -> cobblestone) framed by dressed-quarry piers, quoins, jambs and heads and a continuous base plinth (wall.dressing -> stone_bricks); the gable end above the eave stays the same fieldstone. The two bright golden leaves on the long eave wall are wagon doors (door.wagon -> oak_planks, kept distinct from the dark roof). I regularize the digest's ~5-block storeys to the pack's 3-4 range as 3 storeys of 3 (wall top 9, just under the ~10 eave). No dormers (steep continuous slopes), no chimney (working barn). Sizes from the sketch; rhythm rounded to regular bays.

| | |
| --- | --- |
| model | `claude-opus-4-8` (strong tier, subscription shim) |
| asks | 3 live (budget 3; 3 ledger entries) |
| prompt | `b641cfafc72cefd2…` (committed: barn.prompt.md) |
| masses | barn 48×24×3st |
| elements | barn-shell(1168), barn-plinth(140), barn-roof(8736), barn-head-+z-1-0(2), barn-head-+z-0-0(3), barn-head-+z-1-1(2), barn-head-+z-0-1(3), barn-head-+z-1-2(2), barn-head--z-2-0(2), barn-head--z-2-1(2), barn-head--z-2-2(2), barn-head--z-2-3(2), barn-head-+x-3-0(1), barn-head--x-4-0(1) |
| cells | 10066 (zero mesh cells — realized from the program alone) |
| conformance | **PASS** — courses-even ✓, symmetry-held ✓, openings-rhythm ✓, palette-in-pack ✓, watertight ✓, single-component ✓ |

Renders (evidence, never gating):
- `benchmarks/sculpture/recognition/view-barn-+x+z.png` (+x+z) sha256 3fc3bb64a5e20fd5…
- `benchmarks/sculpture/recognition/view-barn-+x-z.png` (+x-z) sha256 ae0b106bab272647…
- `benchmarks/sculpture/recognition/view-barn--x-z.png` (-x-z) sha256 620b514d8758374a…
- `benchmarks/sculpture/recognition/view-barn--x+z.png` (-x+z) sha256 7ec9ffc271b31e60…

Replay: `npm run recognize:offline` re-derives the artifact byte-identically from the
committed program (E-31 Rule 5). Revision belongs to the workshop (S-126); grading to S-127.
