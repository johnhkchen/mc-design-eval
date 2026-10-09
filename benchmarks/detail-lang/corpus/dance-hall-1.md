```
DETAIL dance-hall-round-2
MATERIALS: cut_sandstone, sandstone, smooth_quartz, chiseled_sandstone; keep all other letters as built.

FACE NORTH
  # door lintel: sandstone band over the three door bays; lanterns stay
  row 3 cols 9-17: A -> slab sandstone top
  row 3 cols 10,13,16: H -> keep
  # door reveals: stone jambs beside the doors
  rows 1-2 cols 9-10, 16-17: A -> keep
  # wall field texture: a chiseled course every 6th row between the pilasters
  rows 4-22 cols 3-6, 19-22 where row % 6 == 4 and letter I -> chiseled_sandstone
  # pilaster edges: sandstone outer strips stay plain; quartz inner fields get chiseled jambs
  rows 5-14 cols 4,6,20,22: I -> chiseled_sandstone

FACE WEST
  # window lintels: a projecting slab over each window bay (F/T/F at cols 10-12, 22-24)
  row 13 cols 9-13, 21-25: I -> slab cut_sandstone top out
  # window jambs: chiseled reveals either side of each bay
  rows 9-12 cols 9,13,21,25: I -> chiseled_sandstone
  # cornice: keep the existing slab band at row 15 and stair course at row 14
  row 15 cols 6-32: W -> keep
  # sills: keep existing row 8 slabs; sill nosing on the glass bays at cols 16-17
  row 8 cols 15-17: R -> keep

FACE ROOF
  # parapet coping: stone slab top along both long edges
  cols 1, 25 rows 11-32: W -> keep
  # skylight rims: slab frame around each light (cols 9-16 rows 13-23 where N)
  rows 13,15,17,19,21,23 cols 9-16 adjacent to N: B -> slab cut_sandstone top
  # central bay: keep the stair crown at z=4; chiseled course across the front zone
  row 27 cols 8-18: A -> chiseled_sandstone

NOTATION (for the implementer)
- Header: `FACE <NORTH|WEST|ROOF>`; each rule is `<rows> <cols>: <letters> [where <cond>] -> <form> <block> [top|bottom|out|keep]`. Rows/cols are inclusive map indices as printed on each face; `keep` means leave cells untouched.
- Selectors: comma-separated lists and `a-b` ranges; `letters` filters the current glyphs, so a rule only touches cells that already hold those letters.
- `where` conditions: `row % n == k` (course rhythm), `below=X|above=X|adjacent=X` (neighbour glyph), `edge` (touches air or a different material).
- Forms: `slab` (half block; `top`/`bottom`), `stair` (`out` faces away from the wall; `top` puts the step on top), `block` (plain full block), `keep` (no change). Block names are legend letters or full minecraft ids.
- Patterns repeat over the selected cells, so one line covers a whole course, jamb set, or band; order matters because later rules see earlier results.
- Units are cells, not blocks; the executor should reject a rule whose selector matches zero cells rather than silently passing.
