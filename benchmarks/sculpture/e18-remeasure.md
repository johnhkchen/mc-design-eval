# E-18 combined remeasure — thin-preserved + material-segmented vs R1/R2 (T-060-01)

Per subject the **combined** glb-voxel build (`voxelizeGlbThin` → `segmentMaterials`) is scored on five
axes against the E-17 **R1** (glb-voxel) and **R2** (material-clean) baselines. Cells read **R1→R2→E18**.
`thin` = the no-dropped-thin diagnostic (26-connected components, surface-only cells the thin pass added).
Lower is better for speckle / distinct / off-pal / value ΔE; higher for form IoU.

Scale 32. Subjects: 7.

| subject | form IoU | speckle | distinct | off-pal | value ΔE | thin |
| ------- | -------- | ------- | -------- | ------- | -------- | ---- |
| dancing-man | 0.91→0.91→0.81 | 0.11→0.03→0.02 | 5→5→5 | 0→973→0 | 11.19→0→13.82 | comp 1, +531 |
| moai | 0.56→0.56→0.4 | 0.17→0.06→0 | 5→5→4 | 0→4096→0 | 1→0→1.32 | comp 3, +1844 |
| pineapple | 0.91→0.91→0.85 | 0.11→0.04→0.01 | 4→5→4 | 0→2939→0 | 8.71→0→8.43 | comp 1, +1458 |
| bow-and-arrow | 0.47→0.47→0.53 | 0.11→0.03→0 | 6→8→6 | 0→352→0 | 1.1→0→8.04 | comp 1, +697 |
| heart | 0.88→0.88→0.9 | 0.15→0.05→0.01 | 7→7→7 | 0→1323→0 | 4.62→0→8 | comp 1, +2142 |
| mushroom | 0.98→0.98→0.93 | 0.06→0.03→0.02 | 6→7→6 | 0→8614→0 | 7.17→0→4.14 | comp 1, +2453 |
| koi | 0.62→0.62→0.71 | 0.13→0.06→0.03 | 5→8→5 | 0→1237→0 | 4.53→0→16.35 | comp 1, +991 |
| **AVERAGE** | 0.76→0.76→0.73 | 0.12→0.04→0.01 | 5.43→6.43→5.29 | 0→2790.57→0 | 5.47→0→8.59 | — |

## Regressions / no-change (E18 not strictly better than a baseline)

- **dancing-man** form IoU vs R1: Δ -0.1 (worse).
- **dancing-man** distinct vs R1: Δ 0 (no-change).
- **dancing-man** off-pal vs R1: Δ 0 (no-change).
- **dancing-man** value ΔE vs R1: Δ 2.63 (worse).
- **dancing-man** form IoU vs R2: Δ -0.1 (worse).
- **dancing-man** distinct vs R2: Δ 0 (no-change).
- **dancing-man** value ΔE vs R2: Δ 13.82 (worse).
- **moai** form IoU vs R1: Δ -0.17 (worse).
- **moai** off-pal vs R1: Δ 0 (no-change).
- **moai** value ΔE vs R1: Δ 0.32 (worse).
- **moai** form IoU vs R2: Δ -0.17 (worse).
- **moai** value ΔE vs R2: Δ 1.32 (worse).
- **pineapple** form IoU vs R1: Δ -0.06 (worse).
- **pineapple** distinct vs R1: Δ 0 (no-change).
- **pineapple** off-pal vs R1: Δ 0 (no-change).
- **pineapple** form IoU vs R2: Δ -0.06 (worse).
- **pineapple** value ΔE vs R2: Δ 8.43 (worse).
- **bow-and-arrow** distinct vs R1: Δ 0 (no-change).
- **bow-and-arrow** off-pal vs R1: Δ 0 (no-change).
- **bow-and-arrow** value ΔE vs R1: Δ 6.94 (worse).
- **bow-and-arrow** value ΔE vs R2: Δ 8.04 (worse).
- **heart** distinct vs R1: Δ 0 (no-change).
- **heart** off-pal vs R1: Δ 0 (no-change).
- **heart** value ΔE vs R1: Δ 3.38 (worse).
- **heart** distinct vs R2: Δ 0 (no-change).
- **heart** value ΔE vs R2: Δ 8 (worse).
- **mushroom** form IoU vs R1: Δ -0.05 (worse).
- **mushroom** distinct vs R1: Δ 0 (no-change).
- **mushroom** off-pal vs R1: Δ 0 (no-change).
- **mushroom** form IoU vs R2: Δ -0.05 (worse).
- **mushroom** value ΔE vs R2: Δ 4.14 (worse).
- **koi** distinct vs R1: Δ 0 (no-change).
- **koi** off-pal vs R1: Δ 0 (no-change).
- **koi** value ΔE vs R1: Δ 11.82 (worse).
- **koi** value ΔE vs R2: Δ 16.35 (worse).
