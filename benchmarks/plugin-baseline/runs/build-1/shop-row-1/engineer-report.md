# Redstone engineer (run by hand: the workflow crashed at the lamplighter step, after every part was built)

The socket check now reads `OK: 4 sockets; 0 problems, 0 warnings`.

Before the fix, all four sockets had the same warning, that the keeper couldn't reach them. The sockets expect the keeper to stand at y 6, but the aisle floor was at y 6, so the walk found no standing cell there. I lowered the aisle to the shop-floor level:

- **`parts/shell.mjs`:** the aisle floors (x 4..20 z 3..5, plus the x 8..11 and x 16..20 z 6..9 branches) are now smooth_stone on the y 5 ground. Nothing is laid at y 6 there. The two keeper-door openings in the rear wall now sit at y 6..7.
- **`parts/windows.mjs`:** the keeper doors at x 7 and x 15 are placed at y 6. The stair-bay rear door stays at y 7.
- **`parts/yard.mjs`:** the yard cell in front of each keeper door is left unpaved, a step down to the ground course, so the keeper walks in level with the aisle floor. The paving loop skips those two cells.
- **`parts/room-2.mjs`:** the furniture moved down one level so it still sits on the floor. The hanging lanterns stay at y 12 under the ceiling.
- **`parts/room-1.mjs`, `rooms.json`:** the aisle boxes now start at y 6, and the comments say so.

I also ran the installed render (`itiles`) and looked at the street front and elevation views. They read as a plain brick row with a sandstone-trimmed shopfront band, and the aisle change isn't visible from the front.

One thing is left. `walk --rooms` still reports "keeper aisle 1 UNREACHABLE", because that walk starts at the front entrance (23,7,21). The plan walls each tenant's yard off at x 12 (the chimney footing), with gates at z -5, outside the grid. The keeper's way in is that private yard gate, which the walk can't reach from the front. I left it, since moving the chimney or the plan's dividing wall isn't a socket fix. All 15 other rooms are ok, and the socket check, which walks from the site edge, reaches both aisles.

I did not run `mcd blocks --check` through to a verdict. Its output was cut off to the last two lines.
