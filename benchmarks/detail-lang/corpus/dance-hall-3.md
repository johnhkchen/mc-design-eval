```
# DETAIL: dance hall, round 2. Form is final; apply craft only.
# Notation: FACE  WHERE (rows, cols, letter, depth)  :  WHAT [form] [facing] [pattern]

# A. Pilaster flutes (vertical edges read as Art Deco fluting)
north cols 1,25 rows 1..15 letter A : flute alt chiseled_sandstone/sandstone by row parity (odd y = chiseled)
west  cols 4..5 rows 2..28 letter A : flute alt chiseled_sandstone/sandstone by row parity (odd y = chiseled)

# B. Plinths and bases
north rows 0..1 letter B : cut_sandstone_slab bottom            # step-back cap on the black plinth
west  rows 0..1 letter A : sandstone_slab bottom                 # ground course on the side
roof  z 33..34 letter B : cut_sandstone_slab bottom              # eave course cap

# C. Setback skyline (Art Deco stepped silhouette)
north all cols, cell at column top where a neighbour column is >=2 rows higher : cut_sandstone_stairs facing toward the LOWER neighbour
west  all z, same rule on the silhouette top                    : cut_sandstone_stairs facing toward the LOWER neighbour

# D. Window lintels and sills (glass already framed; add the lintel course above)
west  rows (top of each F/N glass bay)+1 letter I directly above F : cut_sandstone_slab top   # lintel reads as a course
west  rows (bottom of each F/N glass bay)-1 letter W              : keep sandstone_slab      # sill already crafted

# E. Belt courses (the proudest full-width rows, depth 0 across the face)
west  rows 14..15 depth 0 : row 14 = cut_sandstone_stairs facing out (drip); row 15 = sandstone_slab top
north rows where depth=0 across >=20 cols : leave as-is unless a letter B sits directly below, then cut_sandstone_slab top

# F. Accent strips and colour (keep the palette from the concept: gold, lapis, quartz)
north row 3 letter A cols 8..9 and 11..12 and 14..15 and 17..18 : alt sandstone/cut_sandstone  # break the lantern row into bays
roof  z 4..10 letter A adjacent to letter B : replace A with cut_sandstone_stairs facing out where depth=0   # roof edge profile
```

**Notation (so it can be implemented):**
1. One rule per line: `FACE  WHERE : WHAT`. FACE is `north`, `west`, or `roof`. WHERE is a set of `cols`, `rows`, or `z` ranges (`a..b`, comma lists), plus optional `letter X`, `depth N`, or `directly above/below ...` predicates.
2. WHAT is `BLOCK [form] [facing]`. Forms are `stairs`, `slab top|bottom`, `flute`, `keep`; facings are `out`, `up`, `toward the LOWER neighbour`, `facing out`.
3. `alt A/B by row parity` means the pattern alternates by y (or z) parity; `odd y` picks the first block.
4. `depth N` (0 = frontmost, 9 = 9+) selects proud or recessed cells. `top of each glass bay` means the first row above a contiguous run of `F`/`N`.
5. Rules run top to bottom; later rules only touch cells still in their original letter, so an earlier `keep` protects a cell. The `(a)` `#` comments are ignored.
