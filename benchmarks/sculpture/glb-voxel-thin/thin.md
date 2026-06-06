# Thin-feature-preserving voxelization — before/after (E-18 T-059-01)

Each thin-form subject voxelized two ways: `base` = voxelizeGlb (center-only parity, E-16) vs
`thin` = voxelizeGlbThin (solid ∪ conservative-shell SAT). Both colored value-true from the GLB's own
surface, rendered at SCULPTURE_VIEW_3Q, scored by silhouette IoU vs the GLB's own silhouette.
`components` = 26-connected voxel components (lower/equal = fewer severed fragments).

Subjects: 2. Sword excluded — TRELLIS produced no GLB on the thinnest subject (T-061 routing finding).

| subject | base IoU | thin IoU | ΔIoU | base occ | thin occ | thin-only | base comps | thin comps |
| ------- | -------- | -------- | ---- | -------- | -------- | --------- | ---------- | ---------- |
| bow-and-arrow | 0.473 | 0.526 | +0.053 | 513 | 1210 | 697 | 4 | 1 |
| koi | 0.622 | 0.707 | +0.085 | 2164 | 3155 | 991 | 1 | 1 |

ΔIoU > 0 = the recovered thin surface lifts the silhouette toward the GLB. The conservative trace can
only ADD true-surface cells, so a rise (or no change) is expected; the magnitude is the finding.
