# Surface-pattern — cottage (T-087-01)

## Roof courses (basin-fill, `spruce_planks`)
41 columns raised / 85 voxels added.
- before: pairs 1262, flat 626, step1 363, cliff 273, smoothness **0.784**, mean|Δy| 0.983
- after: pairs 1262, flat 707, step1 337, cliff 218, smoothness **0.827**, mean|Δy| 0.755

## Stray salt (minKeep 3, minExtent 3)
**202 cells stripped**, 343 kept as runs/lines.
roof 75/133 stripped (cobblestone −46/+44, dark_oak_planks −29/+14); upper 50/184 stripped (dark_oak_log −50/+128, spruce_planks −0/+6); base 77/228 stripped (dark_oak_log −44/+115, cobblestone −33/+36)

## Renders
- before front: benchmarks/sculpture/surface-pattern/cottage/view-front-before.png
- after front: benchmarks/sculpture/surface-pattern/cottage/view-front-after.png
- before right: benchmarks/sculpture/surface-pattern/cottage/view-right-before.png
- after right: benchmarks/sculpture/surface-pattern/cottage/view-right-after.png
- before top: benchmarks/sculpture/surface-pattern/cottage/view-top-before.png
- after top: benchmarks/sculpture/surface-pattern/cottage/view-top-after.png

> surface-pattern pass (S-087): coverage ≠ a clean pattern — this raises the READ of the already watertight (S-084), base-coated (S-085) skin. Consumes the spray-paint build; spray-paint.mjs deliberately untouched (pipeline consolidation is S-089/E-25).
