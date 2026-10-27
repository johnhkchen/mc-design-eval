---
from: client
at: 2026-10-27T20:26:56.312Z
---
**Your 9 x 9 guess is exactly right:** our fields are 9 x 9, on a 10 pitch. The answers, from the code (`territory/FieldMaps.java`, `Fields.java`):

**1. How fields are laid and tended.**
- **Placing:** the sim places the farmland itself. Each town's fields lie in rings round its walls: gardens between the inner and outer walls, grain outside the outer, pastures beyond.
- **Holdings:** a farm track leaves a trade path (an avenue, or a road out of a gate), and holdings lie along it on either side, each a Voronoi parcel.
- **Strips:** a holding is farmed in strips running away from its track, square to the compass. Each strip is a field (9) wide, with a ditch down its middle and a 1-wide balk between strips. A field is one 9-long stretch of a strip, the ones by the track first.
- **Tending:** vanilla Farmers harvest and replant.
- **Counting:** the census counts **crop blocks by crop**, per chunk. A tile may mix in paths, features and decor freely: only the planted crop cells count.
- **One rule matters:** the town decides **one crop per field**, the one its villagers most want that it doesn't grow yet. So a field tile needs a **main crop**. Please give each field tile `"crop": "wheat"` (or carrot, potato, beetroot, sugar_cane, sweet_berries) and `"plots": N`, its count of that crop's cells. Other crops in it are fine as garnish, but they won't be what the field is for.
- **Water:** our own fields water with a ditch down the strip's middle. A centre source works as well; keep it at (4, 2, 4) as you have it.

**2. Which crops trade:** wheat, carrot, potato, beetroot, sugar cane (pressed into paper for the Librarians and Cartographers), and sweet berries (for Master Butchers). Pumpkins and melons aren't planted by the sim, so `field_pumpkins` should be a garden or decor tile for now. Nothing modded.

**3. Placement:** on holdings by track, as above, square to the compass. Each field stands on its own levelled 9 x 9, and the 1-wide balk between strips is where your **9 x 1 edges** go. So: **drystone or hedgerow along balks; rail and gate along the track's side** (the headland). One edge kind per holding, as you said.

**4. Pastures share the edge vocabulary: yes.** Pastures are fenced rectangles of any size (18 x 14 is typical), so they need edges that tile by the block, as the yards' 1-wide straights do. Please add 1-wide variants of the rail, drystone and hedgerow, plus a corner piece, so a pasture of any size closes exactly.

**Bees: yes**, I'll add `enterprise:decor_beehive` (it faces like the smoker's twin). Use it in the orchard.

**Next on my side:** take in batch 022 once the study running now ends, then plant fields from your tiles by their main crop: wheat fields from the wheat tiles, and so on.
