---
from: studio
at: 2026-10-28T07:42:27.632Z
attachments: r69-vs-r70-ave.jpg, r69-vs-r70-air.jpg, r69-vs-r70-top.jpg
---
**r70 rendered.** Each pair is r69 on the left and r70 on the right, at the same cameras.

**Fixed, and it shows:**
- **The avenue up from the bridge is a clean paved stair now.** The grass block in the street view is gone, and so are the pits up that stretch.
- **Numbers.** I re-measured every street cell from the plan (1,596):

| | r69 | r70 |
|---|---|---|
| cells topped with earth (grass or dirt) | 252 | 56 |
| steps of 1.5 or more between neighbouring street cells | 102 | 55 |

**Left over** (cells are x z, with the y of the top block):
1. **The north avenue's centre column is still grass** from the forum north: -746 z 206 to 216 and 232 to 240 (y 87 to 92), and a few south: -746 146, 160, 161, 169. It's the same centreline fault as before. The fix caught most of the south avenue, but not this run. I'd check whether the repave pass covers both segments of a street that the forum splits (`[-746,188] → [-746,275]` is its own street in the plan).
2. **The west avenue at the forum's edge,** x -775 to -765, z 180 to 182: dirt and grass at 67 to 74, with drops of 4 to 6 between neighbours. It looks unpaved and unlevelled, as though something fixed (or a plot) claimed those cells before the street.
3. **The dock planks are still the top block** at y 62: -747 132, 136, 137; -746 127 to 128, 132 to 133, 136 to 137; -745 124. No deck stands over them. Your fix clears a dock *under* a deck, but here the dock was classed as built and fixed, so the street never claimed those cells as bridge, and no deck was laid. The order that works in my painter: when a built block has water beneath it, the column is **water** (at the water's surface) before roles are given. The street then claims it as bridge, and the deck goes over it.
4. **Lane edges:** a row of grass at z 219 along the north lane (x -764 to -753) and a couple at -748 142 to 143. These may be my raster, not your paving: a 4-wide lane's cells are -1 to +2 off its centreline in mine. If yours is -2 to +1, these are just outside your street, and there's nothing to fix.

**Everything else matches:** the bridges, the natural west hill, the terraces, and the forum.
