# Shaped vocabulary — cottage (T-105-01)

Opening heads fitted from the component record (Rule 1: errors recorded, misses named) and rebuilt under the T-102 cage, behind `npm run shaped:cottage`. **Reproducible**: double-run byte-identical, artifact sha256 `33b1ca02f258…`.

## Heads — 0 arch · 0 flat · 6 noop · 2 named-miss

- **og-0[0] @ +x** flat (noop) rmse 0, level=6; carved 0, filled 0
- **og-1[0] @ +x** flat (noop) rmse 0, level=14; carved 0, filled 0
- **og-2[0] @ +x** none rmse 0.707; carved 0, filled 0; findings: flat-out-of-tolerance
- **og-3[0] @ +x** flat (noop) rmse 0, level=3; carved 0, filled 0
- **og-4[0] @ -x** flat (noop) rmse 0, level=6; carved 0, filled 0
- **og-5[0] @ -x** flat (noop) rmse 0, level=14; carved 0, filled 0
- **og-6[0] @ -x** none rmse 0.707; carved 0, filled 0; findings: flat-out-of-tolerance
- **og-7[0] @ -x** flat (noop) rmse 0, level=3; carved 0, filled 0

## Roof-plane construction legality (S-104's input)

- **roof-0**: stair LEGAL (-x, Δ0.156, voxelFit); slab no
- **roof-1**: stair no (glb-fit-unusable,pitch-not-stairRun-legal); slab no
- **roof-2**: stair LEGAL (+z, Δ0.241, voxelFit); slab no
- **roof-3**: stair LEGAL (-z, Δ0.016, voxelFit); slab no
- **roof-4**: stair no (glb-fit-unusable,pitch-not-stairRun-legal); slab no
- **roof-5**: stair no (glb-fit-unusable,pitch-not-stairRun-legal); slab LEGAL (Δ0.139)
- **roof-6**: stair LEGAL (+x, Δ0.117, voxelFit); slab no
- **roof-7**: stair no (glb-fit-missing,pitch-not-stairRun-legal); slab no

## Cage

- accepted 1, rejected 0
- IoU baseline: +x+z 0.9273 · +x-z 0.893 · -x-z 0.941 · -x+z 0.9425
- IoU final: +x+z 0.9273 · +x-z 0.893 · -x-z 0.941 · -x+z 0.9425
- protect: chimney ridgeY=24 (3 cols); 8 opening regions in the closure allow-list

## Renders

- before -x-z: benchmarks/sculpture/shaped/cottage/view--x-z-before.png (unmapped 0)
- before +x+z: benchmarks/sculpture/shaped/cottage/view-+x+z-before.png (unmapped 0)
- after -x-z: benchmarks/sculpture/shaped/cottage/view--x-z-after.png (unmapped 0)
- after +x+z: benchmarks/sculpture/shaped/cottage/view-+x+z-after.png (unmapped 0)

Frames: pr/assets/frames/shaped-cottage-before.png · pr/assets/frames/shaped-cottage-after.png
