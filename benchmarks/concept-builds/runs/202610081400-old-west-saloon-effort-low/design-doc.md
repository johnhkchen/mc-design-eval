# The Silver Nugget Saloon: Design Document

## 1. Identity
A weathered two-storey frontier saloon with a tall timber false front, a wraparound-feeling boardwalk porch and a railed balcony. It is the liveliest building on the street. Its gray board walls are held in a heavy timber frame.

## 2. Palette by role
- **Dominant: `minecraft:stone_bricks`.** Cool gray planked walls for the first and second floor infill. The concept shows weathered gray siding, and this is the closest cheap block. Dull stone against warm wood makes the timber pop.
- **Supporting: `minecraft:spruce_planks`, `spruce_log` (axis y/x/z), `spruce_stairs`, `spruce_slab`, `spruce_fence`.** This is the frame, boardwalk deck, posts, balcony, rails, cornice and sign board. It is the timber a frontier town would actually haul in. The spruce is dark and reads as aged.
- **Accent: `minecraft:lantern` (hanging), `minecraft:glass_pane`, `minecraft:red_wool`/`blue_wool`/`black_wool` for banners.** Warm light and color on a muted base.
- **Ground: `minecraft:red_sand`, `minecraft:sand`, `minecraft:coarse_dirt`.** This is dusty street, in the concept's orange and cream.

Relationship: cool gray fill, warm dark timber frame, small hot accents of lantern and banner.

## 3. Massing & roof
- **Main block:** 14 × 16 footprint, two storeys of 4 high each, with a floor slab at y=4 and a flat-looking roof at y=8.
- **False front:** the front facade (z=0..1) rises 3 higher to y=11 as a flat parapet across the full 14 width. It hides the roof from the street.
- **Roof:** a low-pitched shed roof behind the parapet made from `spruce_slab` (type bottom), sloping to the rear. The edges are capped with a `spruce_stairs` cornice (facing south, half top) along the top of the false front, stepped out one block. A cornice gives a deliberate crown against the sky.
- **Back:** simpler. Gray fill, one door and two windows, a plain parapet.

## 4. Facade composition
- **Three bays**, divided by four full-height `spruce_log` (axis y) piers at x=0, 4–5, 9–10 and 13. The central bay is wider (x=5..8) and holds the entrance.
- **Base (y=1–3):** center swinging double doors, 2 wide by 3 tall (`spruce_door` pair, open; or `spruce_trapdoor` half-doors at y=1–2 with air above). Flanking each side, two 2×2 `glass_pane` windows over a `stone_bricks` sill.
- **Middle (y=5–7):** the balcony door in the center bay (`spruce_door`), flanked by two windows per side aligned directly above the ground-floor windows.
- **Top (y=8–10):** the sign board is `spruce_planks` 8 wide × 2 tall on the center axis, with `oak_wall_sign` text "THE SILVER NUGGET / SALOON" on top. The piers continue up to the parapet and give a framed panel.

All openings line up vertically to the piers and each other.

## 5. Depth plan
- **Boardwalk porch:** projects 3 blocks (z=−3..−1), a `spruce_planks` deck at y=1 with one step stair down to the street at y=0. It is the largest projection.
- **Porch posts:** `spruce_log` at z=−3 every 3 blocks, going up to carry the balcony.
- **Balcony:** deck of `spruce_slab` at y=4 over the porch, 3 deep, with a `spruce_fence` railing at y=5 on the outer edge and sides.
- **Piers** project 1 block (z=−1) from the wall, and the sign board sits 1 forward of the walls.
- **Recess:** the doors are set back 1 block (z=1) behind the wall plane, and window sills are inset 1 block by omitting the front fill, not by burying blocks.
- **Cornice** overhangs 1 block above the parapet.

## 6. Detail & life
- **Swinging doors:** open `spruce_trapdoor` pairs at z=0, with a lit interior glimpse: `lantern` and `bookshelf` behind the bar at the back wall of the room.
- **Lights:** `lantern` (hanging=true) from the balcony underside at each post, plus two flanking the doors.
- **Hitching rails:** `spruce_fence` runs along z=−5 at the street edge, with `oak_fence_gate` gaps. Add `hay_block`, `barrel` and a `water_trough` (`cauldron` with water) beside the rail.
- **Balcony life:** `red_banner` and `blue_banner` on the front wall above the porch roof, and a `barrel` and `potted_cactus` up top.
- **Street:** a `red_sand` and `coarse_dirt` strip at z=−4..−5, with `sand` patches along the edges.
- **Boardwalk props:** `barrel`, `chest`, a bench from `spruce_stairs` against the wall, and two `potted_dead_bush`.
