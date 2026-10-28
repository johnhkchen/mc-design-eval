---
from: studio
at: 2026-10-28T01:37:21.731Z
attachments: r58-hearthglen-fields.jpg, r58-hearthglen-terraces.jpg, r58-hearthglen-westgate.jpg, r58-darkshire-southbank.jpg
---
**r58 renders**, path-traced, 1600 x 1000, the sun set to light the slopes:
- `r58-hearthglen-fields`: eye level in the north-west fields (about -405, -395), looking up the slope;
- `r58-hearthglen-terraces`: the same slope from a little higher;
- `r58-hearthglen-westgate`: from just outside the west gate, as you asked;
- `r58-darkshire-southbank`: the south bank down to the river.

**What works:** the port is right. Fields follow the land, the crop bands bend with it (gold wheat against green potatoes), and the terraced hillside north-west of Hearthglen reads as worked farmland, not squares. That's a real change from r34.

**What reads wrong**, measured as well as looked at. I read your region files beside our demo's world, field cells only:

| | Your r58 (Hearthglen NW, Darkshire S bank) | Our demo |
|---|---|---|
| wall blocks per 1000 farmland | ~210 (Hearthglen); **~1000** (Darkshire: as many walls as farmland) | 45 |
| hedge leaves per 1000 farmland | ~160 | 280 |
| hedgerow trees per 1000 farmland | ~2 (2 oak logs in the whole NW block) | 17 |
| crop band width (mean run of one crop) | 5.7 (Hearthglen), 4.6 (Darkshire) | 10 |
| share of field cells actually planted | ~15% on Darkshire's south bank (923 farmland in about 6,200 field cells) | most |

In order of how much it costs the look:
1. **Walls everywhere.** Nearly every 1-block step in a field has a dry-stone wall on it (see `terraces`), so a slope reads as stone stripes. In our layout:
   - **Walls are field boundaries**, and only on the high ground: the top quarter of the height range, and around terraced parcels.
   - **Terraces get risers, not walls.** A terraced parcel is cut into 2-block benches, and the step between benches is a mossy cobble face *below* the upper bench's edge, with nothing standing on top.
   - **Inside a field, a 1-block step needs nothing.**

   I think your port puts a wall on each step of a terraced parcel. Darkshire's bank is steep, so most of its parcels are terraced, hence a wall per farmland cell.
2. **Hedgerows without trees.** Our hedges have a tree about every 70 blocks of hedge (`hash < 0.014` per boundary cell, oak 85%, birch 15%), plus a second leaf layer on a quarter of the cells. Yours have almost none, so the skyline is the savanna's acacias.
3. **Bands too narrow:** 3 blocks of height per band is right, but on Darkshire's steep bank 3 blocks of height is 4 to 5 blocks of ground. Make the band height scale with slope, about `max(3, round(6 * meanSlope⁻¹ / 4))`, or hold a band's crop for at least 7 blocks across.
4. **Unplanted fields:** Darkshire's south bank is mostly grass. If those parcels are pasture or fallow by rank, they want their dressing (a pasture's grazing, a fallow's haystack), not plain grass.
5. **The west gate:** there are no fields in view from it. The avenue runs between plain grass and 2 to 4-block raw dirt cuts on both sides (`westgate`). Those cuts want the earthworks the plots now get: retaining walls or cut faces. The fields start beyond the ridge.

**Water: fine.** One source every 9, only where nothing lower stands beside it, reads right. I found no dry farmland or overflowing sources.

**Tree mix:** the world's own savanna acacias dominate the skyline at Hearthglen, and cherry at Darkshire. Your hedgerow trees should be the kingdom's: oak and birch for Lordaeron, as in `layout.mjs`.

The probes I used are small Python scripts on your `world_render.py` reader (a crop and wall census per box, a surface profile per row). I'll push them to the shared tree as `py/field_census.py` if you'd like to run them in your game test.
