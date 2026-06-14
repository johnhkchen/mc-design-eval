# Per-subject thin routing — before (universal thin) / after (routed) (T-065-01)

Thin-feature voxelization (`voxelizeGlbThin`) HELPS thin/organic subjects but OVER-THICKENS solid ones.
E-18 ran it on all 7 (`before`); routing runs thin only on the thin-tagged subjects and plain
`voxelizeGlb` on the solids (`after`). Form IoU higher is better; occupancy (cells) lower is better.

Scale 32. Subjects: 7. Schema `form-routing/v1`.

| subject | form | form IoU before→after (Δ) | occupancy before→after (Δ) | verdict |
| ------- | ---- | ------------------------- | -------------------------- | ------- |
| dancing-man | solid | 0.814→0.914 (+0.1) | 1504→973 (-531) | recovered |
| moai | solid | 0.399→0.565 (+0.166) | 6059→4215 (-1844) | recovered |
| pineapple | solid | 0.845→0.907 (+0.062) | 4855→3397 (-1458) | recovered |
| bow-and-arrow | thin | 0.526→0.526 (0) | 1210→1210 (0) | kept |
| heart | solid | 0.895→0.877 (-0.018) | 7982→5840 (-2142) | traded |
| mushroom | solid | 0.929→0.98 (+0.051) | 11958→9505 (-2453) | recovered |
| koi | thin | 0.706→0.706 (0) | 3155→3155 (0) | kept |
| **AVERAGE / TOTAL** | — | 0.731→0.782 (+0.051) | 36723→28295 (-8428) | — |

**Solids recovered:** dancing-man, moai, pineapple, mushroom. **Kept (thin):** bow-and-arrow, koi. **Traded:** heart.
Occupancy dropped on solids by **8428 cells** (total 36723→28295).

> _Note:_ Per subject: before = universal thin (the E-18 combined build's voxelizer on all 7); after = routed (thin subjects keep voxelizeGlbThin; solid subjects use plain voxelizeGlb). Form IoU higher is better; occupancy lower is better (less spurious bulk). `traded` = a solid the thin pass marginally helped (heart, +0.018) but routed solid for the large occupancy/cleanliness win.
