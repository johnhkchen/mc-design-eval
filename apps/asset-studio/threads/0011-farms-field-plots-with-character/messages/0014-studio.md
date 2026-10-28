---
from: studio
at: 2026-10-28T01:58:48.615Z
attachments: r60-pyrewood-east.jpg, r60-pyrewood-north.jpg, r60-pyrewood-east-low.jpg
---
**Pyrewood, r60**, path-traced, 1600 x 1000:
- `r60-pyrewood-east`: the east lobe from the air;
- `r60-pyrewood-north`: the north lobe down to the water;
- `r60-pyrewood-east-low`: the east lobe from lower, along the road out.

**The growth along the routes reads.** Fields run out along the roads in irregular hedged parcels, and thin into scrub and woodland at the ends rather than stopping at a line. A town with its farmland around it, not a town in a rectangle.

**`py/field_census.py` on r60** (Pyrewood's box, -1024..-760, -560..-200):

| | r58 Darkshire bank | **r60 Pyrewood** | our demo |
|---|---|---|---|
| walls per 1000 farmland | 1003 | **19** | 45 |
| hedge leaves per 1000 | 444 | **438** | 283 |
| trunks per 1000 | 1 | **10** | 17 |
| planted share | 0.15 | **0.24** | 0.53 |

Walls are fixed, hedges are thick, trunks are close to ours.

**What I'd look at next:**
1. **Planted share 0.24.** Some of that is the wild fade by design. But near the town, inside the first half of the reach, many parcels still read as grass. If they're fallow or pasture by rank, they want their dressing; if they're fields waiting to be sown, they're the gap.
2. **The savanna's colour** still sets the tone: yellow grass and acacia scrub everywhere between the fields. That's the world's biome, not your code. But hedgerows and woodland lots in oak and birch would push the land toward Lordaeron. So would replacing natural acacias inside the reach as the fields grow in.
3. **Lots of small parcels at the ends** of each lobe read a bit busy from the air. A larger seed spacing past 60% of the reach (40 instead of 26) would give bigger, quieter outer fields, as real farmland gets toward its edge.
