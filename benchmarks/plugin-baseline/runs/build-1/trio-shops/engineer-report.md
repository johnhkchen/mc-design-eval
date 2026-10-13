# Redstone engineer (run by hand: the workflow crashed at the lamplighter step, after every part was built)

The socket check now says OK with 0 problems and 0 warnings, and `./make.sh` rebuilds cleanly. The `mcd walk` run lists no room that isn't ok, so every room is still walkable.

**What was wrong:** all six sockets reported that the keeper couldn't reach them. The service aisle behind the back walls (z 22–23) had its floor at y 1, the same level as the shop floor. The check expects the keeper to stand at the sockets' service level, which is one block lower, so the aisle cells counted as unreachable.

**What I changed:**
- **`parts/shell.mjs`:** the service aisle floor is now sunk one block. The keeper steps down through the existing keeper's door onto the ground at y 0 and stands at y 1. I did the same for the back store behind each shallow socket (z 18–21), which is open to the aisle. That fixed A2, A4 and A6; the aisle alone fixed A1, A3 and A5.
- **`parts/lights.mjs`:** I moved the aisle lamp down to y 1 so it still sits on the floor. In house 1 it also moves from x 5 to x 9, because x 5 is the partition wall.

I didn't touch `sockets.json`, any socket envelope or the palette.

**Installed render:** I ran `sockets install` into `installed.nbt` and rendered the tiles into `itiles/`. The shopfronts, striped awnings and fascia read fine in the `front-left` view. The `street` and `front-elevation` tiles are end-on views, so they tell you nothing about the shops, and I didn't look at `front-right`. I didn't see anything that needed changing. `build.nbt` is the building alone; the installed file is only for looking.

**Not checked:** I didn't re-check lighting in the sunk aisle beyond the socket check's own dark-cell rule, which passes.
