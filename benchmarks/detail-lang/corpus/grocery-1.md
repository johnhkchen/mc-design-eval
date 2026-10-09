```
# FINISHING PASS: grocery store. FORM is final; add craft only.
# Letters = map legend. Rows/cols as printed. "out" = facing away from the wall.
# Rules apply in order; later rules override earlier ones; anything unlisted stays.

FACE north
 N1  cornice lip      rows y15 cols 0-14   letter a         -> quartz_stairs half=top facing=out
 N2  cornice ends     rows y15 cols 0,14   letter a         -> quartz_slab half=top
 N3  parapet tread    rows y16 cols 1-5,9-13 letter a       -> quartz_slab half=bottom
 N4  parapet cap      rows y17 cols 6-8    letter a         -> quartz_slab half=top
 N5  quoins           cols 1,13 rows y13,y11,y9 letter J    -> smooth_quartz
 N6  sill course      rows y7 cols 1-13    letter a         -> quartz_slab half=bottom
 N7  hood lips        rows y12 cols 3,7,11 letter J         -> quartz_slab half=top
 N8  shutters         rows y10-y11 letter e                 -> dark_oak_trapdoor open=true
 N9  sign shelf       rows y5 cols 5-9     letter T         -> dark_oak_slab half=bottom
 N10 brick mix        field J, rows y8-y13, cells where (col+row) mod 7 == 0 -> mossy_stone_bricks
 N11 doorway reveal   rows y1-y3, cells with depth>=3 whose neighbour on the left or right has depth<=1
                      -> stripped_dark_oak_log axis=y
 N12 awning           any letter U or V in rows y4-y5 -> keep (no wool stairs in vanilla)

FACE west
 W1  chimney stack    col 12 rows y8-y12   letter f         -> cobblestone_wall
 W2  chimney cap      col 12 row y13       letter J         -> stone_brick_slab half=top

FACE roof (cols = x, rows = z, front edge z0)
 R1  front drip       row z0 letters a,V                    -> quartz_slab half=top
 R2  tile grid        field A, z3-z12, x1-13; where x mod 4 == 2 OR z mod 4 == 3
                      -> stone_bricks
 R3  skylight         z0 cols 6-8 letter b                  -> keep (vent)

Notation: a rule is  NAME  WHERE  LETTER  ->  BLOCK  [state=value].
WHERE is FACE + rows (y or z) + cols (x or z on the roof) + optional depth/mod filter.
Ranges are lo-hi and comma lists; "mod" rules pick cells by (col+row) or col/row arithmetic.
Verbs are implicit: "->" replaces the letter; "keep" makes a rule a no-op for that cell.
```

Notation: each rule names a face, row or column ranges, the source letter (or depth filter), and a target block with state. Comma lists and `lo-hi` ranges let one line cover many cells, and `mod` filters give deterministic texture mixes without listing cells. Depth filters (`depth>=3`, `depth<=1`) pick out recesses and jambs from the depth map. Rules run top to bottom, so later rules can override earlier ones. Anything not named stays as it is. Vanilla has no wool stairs or slabs, so the awning is left as plain wool stripes; the awning and roof grid are the two places where the concept is only approximated.
