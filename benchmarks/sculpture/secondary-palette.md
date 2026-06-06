# Gated secondary palette across the 7-subject sweep (E-18 T-058-03)

The design-doc palette (the model's deliberate few blocks) is AUGMENTED with at most K table blocks —
and only when a block is a SUPER-GREAT fit for an underserved, meaningful texture colour (all gates:
underserved `primaryΔE > driftThreshold`, real `coverage ≥ minCoverage`, fit `tableΔE ≤ fitThreshold`,
big-win `gain ≥ gainThreshold`). Most subjects should add 0. `snap ΔE` is the mean per-voxel texture-snap
distance BEFORE (design-doc only) → AFTER (augmented) — the drift the secondary removed. `off-pal` counts
blocks placed outside the augmented palette (0 by construction). Form IoU is invariant (recolouring never
moves a voxel) — rendered + judged to confirm.

Subjects: 7 (sword excluded — TRELLIS 500'd on the thin blade). Total secondary blocks added across the sweep: 9.
Gates: {"k":8,"driftThreshold":12,"minCoverage":0.05,"fitThreshold":6,"gainThreshold":6,"K":2}.

| subject | design-doc | +secondary (block, gain, coverage) | total | snap ΔE before→after | off-pal | form IoU |
| ------- | ---------- | ---------------------------------- | ----- | -------------------- | ------- | -------- |
| dancing-man | 5 | — | 5 | 15.33 → 15.33 | 0 | 0.914 |
| moai | 4 | nether_quartz_ore (gain 20.46, cov 12%); cyan_terracotta (gain 11.84, cov 8%) | 6 | 8.22 → 5.21 | 0 | 0.565 |
| pineapple | 4 | — | 4 | 17.59 → 17.59 | 0 | 0.907 |
| bow-and-arrow | 6 | light_gray_concrete_powder (gain 21.07, cov 13%); black_terracotta (gain 7.04, cov 13%) | 8 | 9.28 → 7.04 | 0 | 0.473 |
| heart | 5 | mycelium (gain 16.27, cov 13%); cyan_terracotta (gain 15.71, cov 13%) | 7 | 13.24 → 10.15 | 0 | 0.877 |
| mushroom | 4 | dead_brain_coral_block (gain 32.74, cov 13%); mossy_stone_bricks (gain 25.53, cov 13%) | 6 | 23.53 → 18.04 | 0 | 0.98 |
| koi | 5 | smooth_red_sandstone (gain 22.38, cov 13%) | 6 | 13.84 → 11.58 | 0 | 0.622 |
