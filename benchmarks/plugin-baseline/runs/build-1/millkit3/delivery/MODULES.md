# millkit3: modules

8 modules on a 12 x 20 plot grid (x along the lane, z from the lane's far edge back). Each file is one plot, 12 wide, 36 high, 20 deep, on a solid foundation: load them side by side along x, 12 apart, all at the same y and z, in any order and any count. Mirror a module in the structure block (Mirror: Left/Right) for variety; rotate a whole row to face another lane.

| # | file | blocks |
|---|---|---|
| 0 | millkit3-00-double-shotgun.nbt | 3522 |
| 1 | millkit3-01-creole-cottage.nbt | 3348 |
| 2 | millkit3-02-foursquare.nbt | 3699 |
| 3 | millkit3-03-queen-anne-cottage.nbt | 3817 |
| 4 | millkit3-04-gable-front-and-wing.nbt | 3417 |
| 5 | millkit3-05-mule-barn.nbt | 3285 |
| 6 | millkit3-06-bake-oven-yard.nbt | 3160 |
| 7 | millkit3-07-company-duplex.nbt | 3914 |

`millkit3-whole.nbt` is the sample row as built (96 x 36 x 20).

## Mixing with the first two kits (millkit, millkit2)

Same plot grid and lane: the lane's top surface is at y 11 of every module file in all three kits, the lane at z 0..4,
plots 12 wide. Load a module from any kit at the same y and z, 12 apart along x. This kit's files are 20 deep like
millkit2 (millkit's are 19), and 36 high (the Queen Anne tower and the duplex stacks); place every kit from the lane
side (same z) and it lines up.
