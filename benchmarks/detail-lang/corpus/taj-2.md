```
# TAJ MAHAL: FINISHING CRAFT (form final; craft only)
# Coordinates: FACE rows cols as printed on the maps. Roof: z rows, x cols.

# --- NORTH (front elevation) ---

N1 plinth niches: for each calcite niche (rows 3-5, cols 4k+3..4k+5, k=0..13):
   row 5 centre col  -> quartz_stairs facing north   (pointed head)
   row 5 side cols   -> quartz_slab bottom
   rows 3-4          -> keep C (recess stays)

N2 dome drip: row 36 cols 20-38 (smooth quartz under the black band at row 35)
   -> smooth_quartz_slab top, overhang 1 out from the wall (drip ledge)

N3 flank cornices: row 26 cols 10-21 and 38-49 (B above each D spandrel panel)
   -> quartz_slab top, out 1 (cornice over panel)
   rows 24-25 D panels -> keep, they are the inset

N4 window sills: each 3-wide calcite run at row 9 (cols 12-14, 17-19, 39-41, 44-46)
   -> quartz_slab top, out 1 (sill projects); keep CHC shafts as they are

N5 gate lintel: row 27 F band cols 23-35 -> keep
   row 28 cols 23-35 B directly above -> quartz_stairs facing south (inverted,
   shoulder of the iwan head). Centre 3 cols (cols 27-31) -> quartz_slab top instead.

N6 corner pilasters: cols 2-6 and 52-56 rows 9-30 (B piers)
   the outermost col (2 and 56) -> quartz_pillar axis y, every 4th row from row 29 down

# --- ROOF (z rows, x cols) ---

R1 minaret caps: corner blocks z 1-7 and z 51-57, x 1-7 and x 51-57
   z 1 and z 7 edges (the B rows) -> quartz_slab top
   keep the K lightning rods at (z 4, x 4), (z 4, x 54), (z 54, x 4), (z 54, x 54)

R2 drum band: z 8 and z 50 I runs (x 8-50) -> quartz_stairs facing outward
   black F run at z 8 cols 22-36 -> keep

R3 dome ribs: z 9-49 central B field, the vertical I lines at x 9 and x 49
   -> keep (already stairs); add quartz_slab top on z 22 and z 36 B runs
   cols 14-44 (coping over the gallery)

# --- Materials / rules ---
- Dark trims: F black_concrete only on existing F cells; never add new F.
- Calcite C panels stay calcite; never convert C to quartz.
- Any stair/slab op must check neighbours: only place where the target cell is B, D, or I, and skip cells marked '.' or K.
- Any `out 1` ledge must have sky/air in front of it, not solid; otherwise skip and log.

---
Notation: FACE + row/col ranges, with `for each` loops for repeated patterns (k=0..n).
`-> block form facing` names the target: a form (stairs, slab, pillar) plus a block letter/name.
`top`/`bottom` picks the slab half; `out N` means project N blocks off the wall face.
`keep` marks cells that must not change; `ROOF` uses z,x and not row,col.
Rules after the arrow are guards: match the cell's current letter, skip '.' or K, and log skips.
