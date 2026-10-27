---
from: client
at: 2026-10-27T13:42:04.684Z
---
Agreed: the 5 x 5 reads as a doll's house beside the paintings, and the 7 x 7 town house with its jetty and steep tile roof reads right. Let's run the experiment. Below is what scale costs on our side. The short answer is that the town grid should be fitted to the houses, not the other way round, so I'd add plot shape to your levers.

**What the sim cares about (it doesn't price blocks):**
- **Price:** a home costs a flat 10 emeralds for 2 beds, whatever its size (`home_cost`). Size costs nothing in the economy; we could make the price follow the footprint if bigger houses should be dearer. That's a dial, not a blocker.
- **Beds:** the core assumes 2 beds a home until the census counts them. If bigger houses hold 3 or 4 beds, a two-family town house or an upper floor of lodgers, density holds even with fewer houses. I'll make beds per home come from the kit's metadata (part of C3).
- **Density is the real constraint.** Today's inner walls hold 10 to 20 wards of 14 x 14. Hearthglen has 15 wards and 17 villagers (village tier); a town grows to 50 and a city to 120. Today's 5 x 5 gives about 4 homes a ward. Per 14 x 14 ward:
  - S2 7 x 7: 4 homes if terraced (shared side walls), 2 if detached;
  - S3 9 x 7: 2 homes (back to back is 14 deep);
  - S4 11 x 9: 1 home.

  At 2 beds each, S3 tops out near 60 villagers inside the inner wall, and S4 near 30. Then the gardens between the walls get built over, which the plan expects anyway.
- **Pathing:**
  - Storeys of 5 or 6 are fine.
  - Beds upstairs are fine if the way up is stairs or slabs. No ladders or trapdoors on the way to a bed or workstation: villagers don't climb ladders reliably.
  - Doors 1 or 2 wide, 2 high.
- **Template size:** no hard limit from our placer. The 48 is the structure block's save limit, not the game's; it loads larger `.nbt` files fine. Anything up to about 10,000 blocks places in one tick. Landmarks can be spread over ticks later.
- **Ward size:** a single constant (`TownPlans.WARD`, 20 today, which makes 14-block cells). Lanes, frontages and the GIS export all follow it, so changing it is cheap.

**What I'd add: plot shape (burgage plots).** Real Tudor streets were narrow, deep plots: a house on the street front and a long kitchen garden behind, in widths that vary along the street. In blocks:
- **G1 (today):** a 14-block ward, houses back to back, no back gardens.
- **G2:** a 26-deep ward (`WARD` 32), giving plots 13 deep: a house up to 8 deep at the front and 5 of garden behind. Along the street, plot widths sum to the ward's length in a mix: 5, 7, 9, or a single 14 for a hall or inn. That gives the paintings' rhythm of varied fronts, with gardens and washing lines behind, while keeping density near S2's.

**Proposal for the test street:**
- Your four (S1 to S4) on G1.
- S2 and S3 as a mixed burgage row on G2: 7, 9, 5 and 7 wide, 8 deep, with their gardens.
- One corner plot each.

You send the `.nbt` and `.json` files. I place them on a flat stretch of the study world (a 4-wide lane, the grid's real spacing) and send you the region files with `level.dat`, and you path-trace eye-level and road views. I'll post each option's measured cost with the region files: blocks, placement time, homes and beds per ward, and whether a villager reached every bed in-game.

Meanwhile on our side: the placer (C1) is in and tested. It placed a 5 x 5 test kit facing east, with both beds claimable. Next I'll make frontages take any width and depth and read beds per home from the kit (C3), and add a command to place any kit at a spot for these tests. Your parts batch at today's scale is welcome now, for wiring.
