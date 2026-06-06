# E-18 combined remeasure — thin-preserved + material-segmented vs R1/R2 (T-060-01)

Per subject the **combined** glb-voxel build (`voxelizeGlbThin` → `segmentMaterials`) is scored on five
axes against the E-17 **R1** (glb-voxel) and **R2** (material-clean) baselines. Cells read **R1→R2→E18**.
`thin` = the no-dropped-thin diagnostic (26-connected components, surface-only cells the thin pass added).
Lower is better for speckle / distinct / off-pal / value ΔE; higher for form IoU.

Scale 32. Subjects: 7.

| subject | form IoU | speckle | distinct | off-pal | value ΔE | thin |
| ------- | -------- | ------- | -------- | ------- | -------- | ---- |
| dancing-man | 0.91→0.91→0.81 | 0.53→0.28→0.15 | 18→5→5 | 366→319→0 | 2.1→0→0 | comp 1, +531 |
| moai | 0.56→0.56→0.59 | 0.64→0.25→0.16 | 43→5→5 | 853→0→0 | 1.22→0→0 | comp 3, +1844 |
| pineapple | 0.91→0.91→0.85 | 0.55→0.25→0.11 | 24→5→4 | 2272→2003→0 | 4.38→0→4.73 | comp 1, +1458 |
| bow-and-arrow | 0.47→0.47→0.53 | 0.71→0.37→0.05 | 34→8→5 | 365→164→0 | 3.8→0→0 | comp 1, +697 |
| heart | 0.88→0.88→0.9 | 0.69→0.34→0.1 | 91→7→6 | 4063→2831→0 | 5.91→0→3.41 | comp 1, +2142 |
| mushroom | 0.98→0.98→0.93 | 0.52→0.3→0.14 | 92→7→6 | 4212→2300→0 | 6.44→0→1.29 | comp 1, +2453 |
| koi | 0.62→0.62→0.71 | 0.72→0.35→0.17 | 71→8→6 | 1646→586→0 | 7.87→0→0 | comp 1, +991 |
| **AVERAGE** | 0.76→0.76→0.76 | 0.62→0.3→0.13 | 53.29→6.43→5.29 | 1968.14→1171.86→0 | 4.53→0→1.35 | — |

## Regressions / no-change (E18 not strictly better than a baseline)

- **dancing-man** form IoU vs R1: Δ -0.1 (worse).
- **dancing-man** form IoU vs R2: Δ -0.1 (worse).
- **dancing-man** distinct vs R2: Δ 0 (no-change).
- **dancing-man** value ΔE vs R2: Δ 0 (no-change).
- **moai** distinct vs R2: Δ 0 (no-change).
- **moai** off-pal vs R2: Δ 0 (no-change).
- **moai** value ΔE vs R2: Δ 0 (no-change).
- **pineapple** form IoU vs R1: Δ -0.06 (worse).
- **pineapple** value ΔE vs R1: Δ 0.35 (worse).
- **pineapple** form IoU vs R2: Δ -0.06 (worse).
- **pineapple** value ΔE vs R2: Δ 4.73 (worse).
- **bow-and-arrow** value ΔE vs R2: Δ 0 (no-change).
- **heart** value ΔE vs R2: Δ 3.41 (worse).
- **mushroom** form IoU vs R1: Δ -0.05 (worse).
- **mushroom** form IoU vs R2: Δ -0.05 (worse).
- **mushroom** value ΔE vs R2: Δ 1.29 (worse).
- **koi** value ΔE vs R2: Δ 0 (no-change).

> _Value-ΔE note:_ R2 snaps to the GLB's own texture palette (the value-ΔE reference), so its value ΔE is ~0 by construction — a 0 there carries no signal. E18 uses a TIGHTER fixed palette (k=6), so its value ΔE can be nonzero: a small, real cost of palette discipline, not a tautology. Speckle / distinct / off-palette carry the primary discrimination.
