```
# DANCE HALL: finishing craft pass. Form frozen; only surfaces change.
# Letters are current blocks. Columns and rows as on each face map.
# GLASS = F N O P R    SOLID = A B I S C K U V W E

ALL FACES  sills and lintels
1  SILL    every GLASS cell: the cell directly below, if A|B|I -> slab top, same material
           (A->sandstone_slab, B->cut_sandstone_slab, I->smooth_quartz_slab)
2  LINTEL  every GLASS cell: the cell directly above, if A|B|I and that cell is not GLASS
           -> slab bottom, same material as in 1

NORTH  door surround and transom
3  JAMB    rows 0-2, cols 10 and 16: A|B|I -> chiseled_sandstone
4  LINTEL  row 3, cols 11-12 and 14-15: A -> cut_sandstone_slab bottom
           (band over the doors; H lanterns at cols 10, 13, 16 stay)

NORTH  tower glass frame
5  FRAME   rows 10-15, cols 11 and 15: I -> chiseled_sandstone

NORTH  pier caps and stepped flanks
6  CAP     cols 1-2 and 24-25: topmost A|B|I cell of each column -> cut_sandstone_stairs
           facing OUT (toward viewer), half bottom
7  FLANK   rows 17-21: outermost B|I cell on each side of the centre pyramid, where the
           cell above it is '.', E, or inset from the row above -> cut_sandstone_stairs
           facing OUT, half bottom

NORTH  wing texture mix
8  MIX     rows 4-14, cols 3-4 and 22-23: I where (row + col) mod 3 == 0 -> chiseled_sandstone

WEST  field texture
9  MIX     rows 1-2 and 4-6, every 3rd B in each row, starting at col 6
           -> chiseled_sandstone

ROOF  skylight curbs
10 CURB    every N cell (skylights at z 14, 18, 22): the B cells orthogonally adjacent
           (N/S/E/W) -> cut_sandstone_slab top

KEEP    E blue bands, K/L/Q/J gold-diamond-emerald canopy, M/T lights, existing U stairs
        and V/W slabs are untouched.
```

**Notation:** Each line is `ID  VERB  WHERE -> WHAT`, grouped under a face heading (ALL FACES, NORTH, WEST, ROOF).
WHERE uses face-local rows (`y` on the wall faces, `z` on the roof) and columns as on the map, with ranges like `1-2` and lists like `11-12 and 14-15`.
Selectors are letter sets (`GLASS`, `SOLID`) plus relations: "directly below/above", "orthogonally adjacent", "topmost of each column", "outermost on each side", "cell above is '.'".
WHAT is `material form [facing] [half]`, where form is `slab|stairs|full`, facing is `OUT` (toward viewer) or a compass direction, and half is `top|bottom`.
`(row + col) mod N` and "every Nth starting at c" express repeats, so a single rule covers many blocks.
Unlisted cells are unchanged, and a `KEEP` line guards blocks that must not be touched.
