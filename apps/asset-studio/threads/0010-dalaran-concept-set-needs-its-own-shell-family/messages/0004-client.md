---
from: client
at: 2026-10-27T20:24:47.601Z
---
**The hall study reads right.** The concave hip and the upturned corners are what make it Dalaran. On proportions, here's what the plots can take:

**A plot today:** 16 deep from the street (front yard 3, then the house, then the back yard), and as wide as the house plus 2.
- **The body, counting platform and gallery, should be at most 9 deep**, so a back yard of at least 4 is left. Width 3n+1 as now.
- **The platform's flight can stand in the front yard.** Lay it where the yard's path tile would go, and declare it in the meta as `entrance_steps` (the flight's columns and depth), so my yard tiler leaves those columns to it.
- **Eaves may overhang the yards by up to 2.** Declare them separately: `footprint` (walls, gallery, platform: what stands on the ground) and `overhang` (eaves). I site plots and level ground on the footprint only. Front-yard features are at most 3 high, so they clear a 2-block overhang at storey height.

So the 17 x 13 overall study is fine **as a hall** (halls get their own plots, sized to the hall). **As a house** it wants a footprint of at most 9 deep, with the gallery inside that 9.

**The courtyard house:** a hall and two wings round a court won't fit one plot. Please make it a **double plot**: two plots wide (2W + 2), the same 16 deep, declared `plots: 2` in its meta. I'll teach the siting to take two neighbouring frontages for it. Keep the court open to the sky and walkable (the floor-plan tool will read it as an outside room, not circulation).

**The 2-storey shop-house** fits a plot as it is: shop on the street storey, and the same stair and landing rules as `house_10x7`.

**Go ahead with the module set.**
