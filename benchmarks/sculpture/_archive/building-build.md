# High-res building build — voxelize @ scales → E-19 clean → keep the best-reading (T-068-01)

The E-20 higher-resolution build. The whole-building GLB (T-067-01, `stone-gatehouse.glb`) voxelized at
a deliberately HIGH scale (markedly more blocks than the ~32-block sculptures), cleaned with the matured
E-19 pipeline (value-true within the design-doc **flat** palette, material-region segmented, stray-pruned),
rendered at the building 3/4 view. A couple of scales tried; the **best-reading** kept (highest form IoU
vs the GLB), **not** the biggest block count — scale↔fidelity is non-monotonic for angular forms.

Subject: building. Scales tried: 48, 64. Schema `building-build/v1`.

| scale | blocks | form IoU | speckle | distinct | off-pal | value ΔE | stray | largest-frac |
| ----- | ------ | -------- | ------- | -------- | ------- | -------- | ----- | ------------ |
| 48 | 22879 | 0.908 | 0.002 | 4 | 0 | 1.65 | 0 | 1 |
| 64 ✓ | 57202 | 0.929 | 0.001 | 4 | 0 | 1.73 | 0 | 1 |

## Chosen scale (AC#1 — best-reading kept, recorded why)

**Scale 64** — scale 64 kept: highest form IoU 0.929 at the HIGHEST scale tried (vs scale 48 @ 0.908) — more resolution still read better; the high-scale regression that bites angular sculptures did not appear up to this ceiling.
Ranking (form IoU): 64@0.929 > 48@0.908.

## Cleanliness (AC#2 — E-19 flat palette, no speckle, single mass)

- off-palette (vs the augmented design-doc palette): **0** (zero ✓)
- speckle: **0.001** (≤ 0.05 E-19 bar ✓)
- distinct blocks: **4** (design-doc flat palette + ≤2 gated secondary)
- principal mass: largest-fraction **1** (single mass, prune a no-op ✓)

> _Note:_ Per scale: voxelize (solid→plain voxelizeGlb) → gated pruneStrays → segmentMaterials under the augmented design-doc flat palette (design-doc + ≤2 secondary). form IoU vs the GLB at the building 3/4 view (higher better); speckle/distinct/off-palette/value ΔE lower better. The BEST-READING scale is kept (highest form IoU), NOT the biggest block count — scale↔fidelity is non-monotonic for angular forms (a building is angular). The GLB lost fine detail upstream (T-067), so absolute IoU is bounded by the reconstruction; the cross-scale comparison is the signal.
