# plantation: placement

The whole build is 96 x 41 x 96 (x by y by z), in 4 structure files of at most 48 a side (a structure block loads at most 48 x 48 x 48).
It stands on a solid foundation 8 deep under the whole site (topsoil, 3 of dirt, stone below): placed over a pit or a dip it fills it.

Pick a corner block in the world: that is offset 0,0,0 (the build's lowest north-west corner). Load each file with a structure block (mode Load, no rotation, no mirror) so the file's own corner lands at that corner plus the offset below:

| # | file | offset x,y,z | size |
|---|---|---|---|
| 1 | plantation-01-x0-z0.nbt | 0,0,0 | 48 x 41 x 48 |
| 2 | plantation-02-x1-z0.nbt | 48,0,0 | 48 x 41 x 48 |
| 3 | plantation-03-x0-z1.nbt | 0,0,48 | 48 x 41 x 48 |
| 4 | plantation-04-x1-z1.nbt | 48,0,48 | 48 x 41 x 48 |

`plantation-whole.nbt` is the same build in one file, for tools without the 48 limit (Litematica, WorldEdit, Axiom).
