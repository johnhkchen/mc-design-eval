# Shell integrity — gatehouse (T-091-01)

Strip floating debris → repair shell voids → six-direction closure gate, all pure cores behind `npm run shell:gatehouse`. **Reproducible**: double-run byte-identical, artifact sha256 `82247f301ee0ebc3…`.

## Component strip
**1 → 1 components, 0 cells stripped** (sizes: none).
Kept: 57202 cells (largest) (grounded).

## Void repair (minDepth 3)
**11071 cells filled** — +x: 1930 (allow-skipped 0), -x: 1735 (allow-skipped 0), +z: 1755 (allow-skipped 0), -z: 1195 (allow-skipped 0), +y: 4456 (allow-skipped 0).
Declared openings honored: window@+x, door@+x, window@-x, door@-x, window@+z, window@-z.

## Six-direction closure
- before repair: 22069/22203 interior cells exterior-reachable — breaches by direction: +x 117 · -x 1004 · +y 68 · -y 0 · +z 1554 · -z 667
- plug: 503 cells in 1 iteration(s)
- **final: CLOSED** (0/17386 reached; the gate THROWS otherwise)

## Renders
- before front: benchmarks/sculpture/shell-integrity/gatehouse/view-front-before.png
- after front: benchmarks/sculpture/shell-integrity/gatehouse/view-front-after.png
- before +x-z: benchmarks/sculpture/shell-integrity/gatehouse/view-oblique135-before.png
- after +x-z: benchmarks/sculpture/shell-integrity/gatehouse/view-oblique135-after.png
- before -x-z: benchmarks/sculpture/shell-integrity/gatehouse/view-oblique225-before.png
- after -x-z: benchmarks/sculpture/shell-integrity/gatehouse/view-oblique225-after.png
- before top: benchmarks/sculpture/shell-integrity/gatehouse/view-top-before.png
- after top: benchmarks/sculpture/shell-integrity/gatehouse/view-top-after.png

Frames: pr/assets/frames/shell-gatehouse-before.png, pr/assets/frames/shell-gatehouse-after.png

> keep the largest 6-connected component + GROUNDED components (a standing structure — the gatehouse's inner passage — is not debris; floating is what makes debris debris). Kept exceptions are declared above. Deletion has no artifact op, so the strip REBUILDS the artifact in canonical voxel order.

> a cavity is a BASIN in a face's depth field (priority-flood spill levels — the same hydrology as the T-087 course fill, over -depth): pockets ≥ minDepth below their rim are missing mass, filled flush in the owning zone's dominant; depth-1..2 facade relief drains or sits above the floor and is kept; declared openings are never filled.

> GROUND-SOLID six-direction watertightness of the STANDING build (flood seeds from sky + sides; a -y ray exiting the bbox rests on terrain); declared openings are honorary skin; breaches attributed to the shaft's escape direction(s). plugClosure THROWS rather than returning unclosed — the gate cannot be passed by an unclosed shell.
