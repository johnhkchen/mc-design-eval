# R-seg — GLB-voxel material-region segmentation across the 7-subject sweep (E-18 T-058-01)

Each R2 (material-clean) build re-materialed by REGION: a tight fixed palette is extracted from the GLB's own
baseColor texture (E-10 CIE-Lab), occupied cells grown into contiguous same-material regions (connected
components by ΔE), off-colour singletons absorbed, each region filled with ONE palette block, and gradients
banded as solid steps along the gradient axis (a HARD band — nearest palette step per cell — minimises
within-region speckle; an ordered-Bayer dither is opt-in via `dither`). Rendered at SCULPTURE_VIEW_3Q and scored vs the
GLB silhouette. `distinct` = blocks in the manifest; `speckle` = fraction of face-adjacent cell pairs that
differ (lower = cleaner); `off-palette` = blocks placed outside the fixed palette (R-seg is 0 by construction).
Form IoU is expected to hold (R-seg never moves a voxel).

Subjects: 7 (sword excluded — TRELLIS 500'd on the thin blade; see glb/README.md).

| subject | occupancy | regions | distinct R2→seg | speckle R2→seg | off-palette R2→seg | form IoU R2→seg |
| ------- | --------- | ------- | --------------- | -------------- | ------------------ | --------------- |
| dancing-man | 973 | 5 | 5 → 5 | 0.275 → 0.151 | 973 → 0 | 0.914 → 0.914 |
| moai | 4215 | 5 | 5 → 5 | 0.248 → 0.097 | 4096 → 0 | 0.565 → 0.565 |
| pineapple | 3397 | 4 | 5 → 4 | 0.25 → 0.126 | 2939 → 0 | 0.907 → 0.907 |
| bow-and-arrow | 513 | 6 | 8 → 6 | 0.366 → 0.228 | 352 → 0 | 0.473 → 0.473 |
| heart | 5840 | 7 | 7 → 7 | 0.343 → 0.144 | 1323 → 0 | 0.877 → 0.877 |
| mushroom | 9505 | 6 | 7 → 6 | 0.301 → 0.153 | 8614 → 0 | 0.98 → 0.98 |
| koi | 2164 | 5 | 8 → 5 | 0.35 → 0.184 | 1237 → 0 | 0.623 → 0.622 |
