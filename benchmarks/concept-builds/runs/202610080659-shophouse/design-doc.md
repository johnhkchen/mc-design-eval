# Market Shophouse: "Bakery & Potions"

## 1. Identity
A stone-footed, timber-jettied merchant house. The heavy stone ground floor takes the street's knocks and the fire from the ovens, and above it the family lives in a light, warm half-timbered upper storey.

## 2. Palette by role
- **Dominant, base:** `stone_bricks`. This is the stone a market town quarries for walls that carts and crowds will rub against and that must survive a bakery's ovens.
- **Dominant, upper:** `smooth_sandstone` infill, read as ochre limewash. It is cheap and light, and plaster is what you put on a timber frame.
- **Supporting:** `oak_log` posts, beams and corbels, plus `spruce_stairs`/`spruce_slab` roof shingles. They come from the same local woodland, and the darker roof stays above the lighter frame.
- **Accent:** `green_terracotta` shutters and `stone_brick_stairs` on the gable verge and eave band. Painted shutters signal that people live here, and the stone trim ties the roof back to the base.

The relationship is simple: stone carries the load and wood shapes the building, with green as the one note of colour.

## 3. Massing & roof
- **Ground block:** x 0–11, z 0–11, y 1–4.
- **Upper storey:** y 6–9, jettied 1 block over the street (front plane at z = −1). It sits on a y 5 floor-beam course of `oak_log[axis=x]`.
- **Roof:** a gable with its ridge along x, so the long eave faces the street and the gable ends face along it, as in the concept.
  - `spruce_stairs` climb from y 10 to a ridge at y 16, z 5.
  - The eaves overhang to z = −2 and z = 12.
  - The verges are `stone_brick_stairs` stepped up each gable edge.
  - A `stone_brick_slab[type=bottom]` cornice band runs along both eaves.
- **Chimney:** `stone_bricks` at x 8–9, z 7, rising to y 18 and capped with a `campfire` for smoke. It sits above the bakery oven.

## 4. Facade composition
- **Bays:** a two-bay front. Stone corner piers at x 0 and x 11 and a 2-wide central pier at x 5–6 split it into two shops 4 blocks wide (x 1–4 and x 7–10).
- **Base (ground floor):** each shop has a `spruce_door` at its inner edge and a 3-wide `glass_pane` display above a `spruce_slab` counter.
- **Middle (upper floor):** `oak_log[axis=y]` posts sit directly above the piers at x 0, 5, 6 and 11. Each bay gets one 2×2 window (x 2–3 and x 8–9, y 7–8), centred over its shop, with `green_terracotta` shutters on either side.
- **Top:** gable ends are timber-framed with a collar beam at y 12 and a small window at y 13.

Upper-floor windows line up over the shop bays, and posts line up over the piers.

## 5. Depth plan
- **+1 (jetty):** the whole upper floor projects 1 block. Under the beam course, `oak_stairs[half=top,facing=south]` act as corbels at every post.
- **+2 (awnings and roof):** each shop has a `spruce_slab[type=top]` awning at y 4 running from z −1 to −2. The eave and verge also sit at +2.
- **−1 (shopfronts):** each shopfront is recessed 1 block behind its piers (glass at z = 1). Leave the front stone out of that plane rather than filling it.
- **+1 (window boxes):** `spruce_trapdoor[facing=north,half=top,open=true]` boxes hold `potted_*` flowers.

## 6. Detail & life
- **Signs:** `oak_wall_sign` boards on the y 5 beam read BAKERY and POTIONS.
- **Lights:** `lantern[hanging=true]` hangs under the jetty at each pier.
- **Bakery:** barrels, a `smoker` and stacked hay bales.
- **Apothecary:** a `brewing_stand` on the counter and coloured-glass bottles shown as `purple_stained_glass_pane`.
- **Street front:** planter boxes of `spruce_planks` filled with poppies, dandelions and alliums sit at z −1 by the doors.
- **Sidewalk:** a 2-deep strip at z −2 to −1 mixes `cobblestone` and `stone_bricks`.
- **Back:** plain sandstone with one `oak_log` mid-post and a back door to the yard.
