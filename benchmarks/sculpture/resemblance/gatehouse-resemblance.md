# Resemblance gate — gatehouse (T-076-01)

The E-22 gate: does the build LOOK LIKE its immutable references? The **triptych is the verdict a human
inspects** (Rule 2); the perceptual numbers below only EXPLAIN it.

## Triptych (the verdict) — `concept | mesh | minecraft` (labeled)

![triptych](gatehouse-triptych.png)  `benchmarks/sculpture/resemblance/gatehouse-triptych.png`

## Categorical judge — _offline: not run_

- **verdict:** `(not run)`
- **named gap (Rule 7):** _(none)_
- **rationale:** offline: metered judge not called

## Perceptual diagnostics (Rule 2 — NOT the verdict)

| axis | value | reads against |
| ---- | ----- | ------------- |
| form IoU (vs mesh) | 0.916 | the 3-D form reference |
| form IoU (vs concept) | 0.609 | the concept (approx. 3/4 view) |
| material set agreement | 0.75 | same materials at all? (0..1) |
| material zone agreement | 0.382 | materials in the same places? (0..1) |
| mean zone ΔE | 40.13 | per-cell Lab drift (lower better) |

Build dominant blocks: polished_basalt×5890, deepslate_bricks×1907, cobblestone×961, dark_oak_planks×409, dark_oak_log×86.
Concept snapped blocks: gilded_blackstone, deepslate_bricks, deepslate_copper_ore, iron_block, white_stained_glass, white_stained_glass.

> Honesty: concept is an APPROXIMATE 3/4 view (camera mismatch depresses IoU/zone ΔE); zoning is read
> from render pixels, not 3-D block positions. These are diagnostic — the triptych + judge are the verdict.
