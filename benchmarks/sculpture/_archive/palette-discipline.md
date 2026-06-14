# Palette discipline — the E-18 guarantee across the 7-subject sweep (T-058-02)

Every color-assigning GLB-voxel build path now snaps within the **augmented design-doc palette** — the
design-doc manifest (the few blocks the model deliberately chose) ∪ **≤K=2 gated secondary** table blocks
(T-058-03), NOT the full 305-block table or a noisy-texture median-cut. This record proves the guarantee:
for each subject the build is run through `assertPaletteDiscipline` (which THROWS on any off-(augmented)
block or a distinct count over design-doc + K), and is compared to the PRE-FIX full-table snap over the
same voxelization.

**Headline:** off-(augmented-palette) = **0** on all 7; distinct ≤ design-doc size + 2 on all 7; largest before→after drop: **mushroom 92 → 6** (full-table → augmented).
**Form IoU is invariant** under the palette change (recolour only — same occupancy → same geometry); the
`form IoU (R1 ref)` column is the committed R1 build's silhouette IoU, unchanged by the tighter palette.

Subjects: 7 (sword excluded — TRELLIS 500'd on the thin blade; see glb/README.md).

| subject | design-doc size | secondary (≤2) | distinct before→after | off-(aug) | cap | distinct ≤ cap | form IoU (R1 ref) | pass |
| ------- | --------------- | -------------- | --------------------- | --------- | --- | -------------- | ----------------- | ---- |
| dancing-man | 5 | 0 | 18 → 5 | 0 | 7 | ✓ | 0.914 | ✓ |
| moai | 4 | 2 | 43 → 5 | 0 | 6 | ✓ | 0.565 | ✓ |
| pineapple | 4 | 0 | 24 → 4 | 0 | 6 | ✓ | 0.907 | ✓ |
| bow-and-arrow | 6 | 2 | 34 → 6 | 0 | 8 | ✓ | 0.473 | ✓ |
| heart | 5 | 2 | 91 → 7 | 0 | 7 | ✓ | 0.877 | ✓ |
| mushroom | 4 | 2 | 92 → 6 | 0 | 6 | ✓ | 0.98 | ✓ |
| koi | 5 | 1 | 71 → 5 | 0 | 7 | ✓ | 0.622 | ✓ |
