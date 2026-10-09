```
# FACE north: rows = y (top first), cols = left-to-right as seen from outside
# FACE west: rows = y, cols = z; ROOF: rows = z (front first), cols = x

# 1. CORNICE (north + west share the profile)
north rows 15 where a,A -> slab(smooth_stone) half top facing out
west  rows 15 where a,A -> slab(smooth_stone) half top facing out
north rows 12 where c -> stairs(quartz) facing out half bottom   # corbels read as brackets

# 2. WINDOW HEADS AND SILLS (north)
north rows 12 cols 3,7,11 where J -> slab(quartz) half bottom    # lintel over each window bay
north rows 7 where a -> slab(smooth_stone) half top facing out   # sill ledge projects

# 3. AWNINGS (north, both bays: cols 1-4 and 10-13). Striped stairs stand in for slanted wool.
north rows 4-5 cols 1-4,10-13 where U -> stairs(red_sandstone) facing out half top
north rows 4-5 cols 1-4,10-13 where V -> stairs(quartz) facing out half top

# 4. STOREFRONT
north row 3 cols 6-8 where O -> slab(dark_oak) half top facing out   # dark valance over door
north rows 1-2 cols 4,10 where M -> mix(glass_pane 100)              # keep glass, no change
north row 0 where A -> slab(stone) half bottom                       # plinth course

# 5. BRICK TEXTURE (north piers keep the brick field from reading flat)
north rows 8-13 cols 1,5,9,13 where J -> mix(bricks 85, stone_bricks 15, seed=piers)

# 6. ROOF COPING (rim only; skylight trapdoors kept)
roof z 0 where a,A,V,a -> slab(quartz) half top facing out
roof z 0 except b

# 7. WEST CHIMNEY STACK
west rows 8-12 cols 11 where f -> wall(cobblestone)

---
Notation (for implementers):
1. A rule is `FACE rows R cols C where LETTERS -> FORM modifiers`. Omit `where` to take every cell in the range; `except X` drops letters from the selection.
2. R and C accept a single value (`7`), a list (`1,5,9`), a range (`1-4`), or a mix. `ROOF z` means rows are z and cols are x; `west` cols are z.
3. FORM is one of `block(mat)`, `slab(mat) half top|bottom`, `stairs(mat) facing out|in|left|right half top|bottom`, `wall(mat)`, `mix(mat weight, ...)`, or `lantern`. `out` means the face's outward normal (north faces north, west faces west).
4. Rules run top to bottom. Each one selects from the current state, so a later rule can match a cell an earlier rule changed. Cells already converted by an earlier rule are skipped.
5. Materials are Minecraft block names with the `minecraft:` prefix stripped. Stairs in red_sandstone and quartz stand in for slanted red and white wool, since wool has no stair or slab form.
