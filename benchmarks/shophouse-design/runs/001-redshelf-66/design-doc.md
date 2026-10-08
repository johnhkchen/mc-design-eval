# Design Document: Yellow Terracotta Twin-Gable Shophouse, 12 × 12

**1. Identity.** A warm yellow terracotta merchant's house with dark oak shopfronts and two steep mud-brick gables, one per shop.

**2. Palette by role**
- **Dominant (given):** `yellow_terracotta` walls; `mud_bricks`, `mud_brick_stairs` and `mud_brick_slab` on the roof.
- **Supporting:** dark oak (`stripped_dark_oak_log`, `dark_oak_planks`, `dark_oak_door`, `dark_oak_trapdoor`). This is the joiner's timber for frames, shutters and floor beams. Its dark brown matches the roof and sets off the yellow.
- **Accent:** `stone_brick_stairs` for the eave cornice. Stone is the one costly dressing a market builder puts where rain hits.
- **Trade colours:** striped wool awnings in `orange_wool`/`white_wool` (left shop) and `blue_wool`/`white_wool` (right shop), so each shop has its own sign colour.

**3. Facade composition**
- **Base (y 1–4):** corner posts of `stripped_dark_oak_log` (axis=y) at x0 and x11, z0. A central pier of terracotta at x5–6, y 1–9, divides the two shops. Both doors sit beside the pier (x4 and x7), as in the concept, and the display windows sit at the outer edges (x1–3 and x8–10).
- **Middle (y 6–8):** one window per bay, centred on the bay (x2–3 and x8–9), with a shutter on each side (x1, x4, x7, x10).
- **Top:** a continuous floor beam of `stripped_dark_oak_log` (axis=x) at y5, z0. Above it, a stone cornice at y9, then the two gables, each set over its own shop.

**4. Depth plan** (nothing goes past z = 0)
- **Shopfronts:** set back 2 cells. Glass and doors at z2; the space at z0–1 is a covered porch under the awning.
- **Upper windows:** set back 1 cell. `glass_pane` at z1, y6–8, with `flower_pot`s (poppy, allium) at z0, y6, resting on the y5 beam.
- **Shutters:** `dark_oak_trapdoor` (facing=north, half=top, open=true) at z0, y6–8. An open trapdoor sits on the back edge of its cell, so the shutters read as recessed panels.
- **Window heads:** `dark_oak_trapdoor` (facing=north, half=top, open=false) at z0, y8, over the window.
- **Cornice:** `stone_brick_stairs` (facing=south, half=top) at z0, y9. The profile cut into the stair gives a corbel shadow without an overhang.

**5. Shopfronts**
- **Doors:** `dark_oak_door` (facing=north; hinge=right at x4, hinge=left at x7) at z2, y1–2.
- **Display windows:** a stall-riser of `dark_oak_planks` at z2, y1, with glass panes at y2–3.
- **Lintel:** `dark_oak_planks` at z2, y3–4, over each opening.
- **Awnings:** wool striped along x at y4, z0–1, filling each opening from wall to wall (x1–4 and x7–10), inside the lot.
- **Signs:** `dark_oak_hanging_sign` (rotation=8) at y3, z0, hung from the awning.

**6. Sides, back, roof**
- **Left (x = 0):** party wall, plain solid terracotta.
- **Right (x = 11):** the cornice continues around the corner (`stone_brick_stairs`, facing=east, half=top). Corner posts at both ends. Two shuttered upper windows at z3–4 and z7–8, set back 1 cell to x10, with shutters facing=west.
- **Back (z = 11):** the front's upper windows and shutters are repeated, with shutters facing=south. Each shop gets a back door at z10, x4 and x7. The cornice faces north.
- **Roof:** two parallel roofs, each 6 wide, with ridges running front to back.
  - Each bay steps up: `mud_brick_stairs` at y10 on the outer columns (facing=east on the left side, facing=west on the right), then at y11 one cell in. The ridge is `mud_bricks` at y12, x2–3 and x8–9, capped with `mud_brick_slab` (type=bottom) at y13.
  - Where the bays meet, the stairs at x5 and x6 form a valley that drains to the yard.
  - Each gable end is yellow terracotta at z0 (and at z11 at the back), with a glazed attic window at x2–3 / x8–9, y10–11, glass set back to z1. This repeats the concept's gable dormers.
