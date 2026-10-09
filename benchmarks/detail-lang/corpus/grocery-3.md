```
# GROCERY: FINISHING CRAFT. Form frozen; replace only where listed.
# FACE ROWS COLS : ACTION      (N/W/R; rows y, or z on R; cols = face-local map columns)

# -- CORNICE: drip and moulding --
N y16 c1-5,9-13 where a : becomes smooth_quartz_stairs shape=stairs half=top facing=out   # drip lip
N y15 c1-13 where a     : becomes smooth_quartz_slab shape=slab half=top                  # moulding cap

# -- WINDOWS (3 bays, glass at c3,7,11; shutters at c2,4,6,8,10,12) --
N y12 c3,7,11 where J   : becomes smooth_quartz_slab shape=slab half=bottom              # lintel cap
N y11,y10 where e       : becomes dark_oak_trapdoor shape=trapdoor open=true facing=out  # louvred shutters
N y7 c2-4,6-8,10-12 where a : becomes smooth_quartz_slab shape=slab half=top             # sill ledge

# -- ROOF: tiled field with grid lines (image 2 shows the grid) --
R z4,z8,z12 c2-12 where A : becomes stone_bricks                                        # tile seams
R z1-2 c0-14 where a      : becomes smooth_quartz_slab shape=slab half=top              # parapet ring

# -- LEAVE (documented, no change) --
N y5 c1-4,10-13 where U,V : leave    # awning: wool has no stair/slab form
N y14 c2-4,6-8,10-12 where T : leave # frieze planks already read
```

Notation, for implementation:
1. A line is `FACE ROWS COLS : ACTION`. `N`/`W`/`R` name the face; `y` rows are map rows (top first), and `z` rows are roof rows. Columns are the face-local map columns. Ranges are `2-4`, lists are `2,4,6`, and `all` means every column.
2. `where` filters cells by legend letter (`where J`, `where a,e`) or by depth (`where depth>=3`), which the program reads from the depth map.
3. `becomes BLOCK [shape=slab|stairs|trapdoor] [half=top|bottom] [facing=out|in|left|right] [open=true]` replaces the block in the same cell. `half=top` means upside-down; `facing=out` means the low side of a stair faces outward.
4. Every action is an in-place replacement, so cell count and silhouette stay fixed. Anything that would add or remove a solid is out of scope for this pass.
5. `leave` documents an intentional non-change; `#` starts a comment. Lines are processed in order, and a later line may override an earlier one on the same cell.
