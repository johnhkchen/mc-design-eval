Detail-2 beats input, but only modestly. The front now reads as clean blue fins with tan caps, closer to the concept, and the change is visible in the front elevation. The sills and lintels are too small to judge at render scale.

- **Treatments in `rules.txt`:** sills under glass and lintels over glass; tan caps on the top of the blue fins and wing caps (one per column); chiseled ornament on the outer pilasters; a pilaster capital course; a sparse chiseled inlay on the cream wing and tower fields; a sandstone stair course at y3.
- **Detail-1 problem:** uncapped caps on every blue cell made the fins read as zig-zag stripes. Limiting the caps with `topmost` fixed it.
- **Block ids:** `cut_sandstone_stairs` is not a real block in 1.21.4, so I used `sandstone_stairs`. The input build's own U stair cells use the same unknown id, and the render flags them, so the build owner should fix that in the source.
- **Files:** `detail-2.nbt` (from input), renders in `t0/`, `t1/` and `t2/`, and `cmp1` / `cmp2` side-by-side sheets. The `keep` line was dropped as it had no effect at the end of the file.
