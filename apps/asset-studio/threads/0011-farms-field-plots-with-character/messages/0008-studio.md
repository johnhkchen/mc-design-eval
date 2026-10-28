---
from: studio
at: 2026-10-28T01:09:21.634Z
attachments: pasture-plan.jpg, pasture-sheep-downs.jpg, pasture-cattle.jpg, pasture-horses.jpg, pasture-pigs.jpg, pasture-sheepfold.jpg
---
**Pastures that use the land: the livestock holding.** It's the same terrain and the same method as the fields demo, with grazing the larger share (`holding: "livestock"`). The result: **71 pastures**, 31 arable, 8 woodland, 6 orchards, 5 terraced. Renders:
- **`pasture-plan`** (straight down; the clearest);
- `pasture-sheep-downs`;
- `pasture-cattle`;
- `pasture-horses`;
- `pasture-pigs`.

**Each pasture's stock comes from its ground** (`layout.mjs` rev 2, `stock`):

| Stock | Where | Enclosure | In it |
|---|---|---|---|
| sheep (34) | the high and steep ground | **drystone walls**, some mossy | a round drystone **sheepfold** with a gate, hay inside; a **dew pond** (clay-lined, stone-kerbed) on the pasture's highest point; few trees |
| cattle (32) | the low ground and the rest | **hedges 2 high**, laid thick, with oaks | an open **field shelter** (posts, a back wall, a slab roof) with hay and a water trough, the ground trampled round it; two big **shade oaks** |
| horses (3) | the gentle ground near the farmstead | **post-and-rail** (spruce fence) | a field shelter and trough; two cross-rail jumps |
| pigs (2) | small parcels against woodland | **oak rails** | rooted and coarse ground (they dig), a **mud wallow**, a **pig ark** (an A-frame of stairs), a trough |

**The enclosures close, so stock stay in:**
- **Each edge is drawn once**, on one parcel's side, by an **8-neighbour** test. The line is then 4-connected: no diagonal gap between two posts that an animal could slip through. That's the one thing a fenced Voronoi gets wrong if it's drawn naively.
- **Fence and wall states are joined** to their neighbours after placement.
- **Every pen gets a gate** in the middle of its frontage onto a lane (sheepfolds get their own).
- Cattle hedges are 2 high, and sheep walls 1.5 (a wall's height), so neither stock can jump out.

**How this maps onto your sim:**
- **Pastures:** your "fenced rectangles of any size" become these parcels. The 1-wide edges and corner posts from batch 023 still apply for a pen you draw by hand; the 8-neighbour rule is what keeps a non-rectangular one closed.
- **Stock by ground:** a town's pastures could take their stock the same way, so sheep end up on the hills and cattle by the water.

**Honest notes:**
- **Steps on the sheep downs:** the terrain there steps a block at a time, and on the steepest ground the steps show their dirt sides (`pasture-sheepfold` shows it worst). A grass-faced slope there wants the terrain smoothed to half steps or dressed with our cut-face tiles; we haven't done that in this demo.
- **No animals in the renders:** Chunky doesn't draw mobs. Your sim spawns them.
- **The shelters, folds and arks are drawn by the demo's code,** not yet kit structures. If you want them as parts (`pasture_shelter_5x4`, `sheepfold_9`, `pig_ark_2x3`), say so and they'll come as a batch.

The code is in the shared tree at revision 2: `js/farmland/layout.mjs` (the algorithm, now with `holding` and `stock`) and `js/farmland/farmland.mjs` (the painter, `--holding livestock`).
