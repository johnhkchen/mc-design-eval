# Shell integrity — cottage (T-091-01)

Strip floating debris → repair shell voids → six-direction closure gate, all pure cores behind `npm run shell:cottage`. **Reproducible**: double-run byte-identical, artifact sha256 `3e07184693f00bb6…`.

## Component strip
**23 → 1 components, 126 cells stripped** (sizes: 54, 3, 20, 2, 2, 1, 4, 1, 1, 2, 4, 1, 5, 1, 1, 1, 1, 1, 7, 1, 7, 6).
Kept: 6312 cells (largest) (grounded).
Ticket pins: {"components":23,"strippedCells":126,"keptComponents":1} — asserted in the runner.

## Void repair (minDepth 3)
**1126 cells filled** — +x: 455 (allow-skipped 0), -x: 199 (allow-skipped 0), +z: 368 (allow-skipped 10), -z: 82 (allow-skipped 0), +y: 22 (allow-skipped 0).
Declared openings honored: window@+x, window@-x.

## Six-direction closure
- before repair: 2483/2490 interior cells exterior-reachable — breaches by direction: +x 594 · -x 248 · +y 78 · -y 0 · +z 557 · -z 102
- plug: 338 cells in 1 iteration(s)
- **final: CLOSED** (0/2152 reached; the gate THROWS otherwise)

## Renders
- before front: benchmarks/sculpture/shell-integrity/cottage/view-front-before.png
- after front: benchmarks/sculpture/shell-integrity/cottage/view-front-after.png
- before +x-z: benchmarks/sculpture/shell-integrity/cottage/view-oblique135-before.png
- after +x-z: benchmarks/sculpture/shell-integrity/cottage/view-oblique135-after.png
- before -x-z: benchmarks/sculpture/shell-integrity/cottage/view-oblique225-before.png
- after -x-z: benchmarks/sculpture/shell-integrity/cottage/view-oblique225-after.png
- before top: benchmarks/sculpture/shell-integrity/cottage/view-top-before.png
- after top: benchmarks/sculpture/shell-integrity/cottage/view-top-after.png

Frames: pr/assets/frames/shell-cottage-before.png, pr/assets/frames/shell-cottage-after.png

> keep the largest 6-connected component + GROUNDED components (a standing structure — the gatehouse's inner passage — is not debris; floating is what makes debris debris). Kept exceptions are declared above. Deletion has no artifact op, so the strip REBUILDS the artifact in canonical voxel order.

> a cavity is a BASIN in a face's depth field (priority-flood spill levels — the same hydrology as the T-087 course fill, over -depth): pockets ≥ minDepth below their rim are missing mass, filled flush in the owning zone's dominant; depth-1..2 facade relief drains or sits above the floor and is kept; declared openings are never filled.

> GROUND-SOLID six-direction watertightness of the STANDING build (flood seeds from sky + sides; a -y ray exiting the bbox rests on terrain); declared openings are honorary skin; breaches attributed to the shaft's escape direction(s). plugClosure THROWS rather than returning unclosed — the gate cannot be passed by an unclosed shell.
