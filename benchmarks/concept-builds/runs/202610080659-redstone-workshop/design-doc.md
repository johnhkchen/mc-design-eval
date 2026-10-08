# Redstone Engineer's Workshop: Design Document

**1. Identity.** This is a brick workshop with a dark-oak frame. It has a big open bay at the front so passers-by can watch the part-picker run, and smoking stacks on the roof show the place is working.

**2. Palette by role**
- **Dominant: `bricks`.** A workshop that holds heat, sparks and dust would be built in fired brick. It's the town's sturdy industrial material.
- **Supporting: `dark_oak_log` (axis=y) for posts, and `dark_oak_planks` / `dark_oak_stairs` for beams, hood and cornice.** The structural frame is shown openly, like a millwright's timber.
- **Base: `stone_bricks`.** A 1-high plinth stops cart wheels and wet cobble from wearing away the brick.
- **Accent: `andesite_wall` and `polished_andesite` for the stacks, and `iron_trapdoor` for the vent louvres.** This is the trade's metal and stone. Red comes only from the machine itself (redstone lamps and dust), so the eye is drawn to it.
- **How they relate:** dark timber frames warm brick, and grey metal plus the red machine are the accents inside that frame.

**3. Massing & roof**
- **Main hall:** x 0–10, z 0–13, y 0–11. This covers the tall machine storey and a clerestory mezzanine at y=6.
- **Office wing:** x 11–15, z 0–9, y 0–5, lower and to the east. Its roof is stepped `dark_oak_stairs` (facing=north, half=bottom), rising from the street to its ridge, which meets the hall wall.
- **Hall roof:** flat, hidden behind a parapet. A `dark_oak_planks` cornice runs at y=11, with `dark_oak_stairs` (half=top, upside-down) along its underside.
- **Brick chimney:** at x 13–14, z 10–11, rising to y=15 and narrowing by one block at y=12.

**4. Facade composition**
- **Hall front:** three bays with posts at x=0, 7 and 10.
- **Machine window:** x 1–6, y 2–5, fully open to the street. A brick sill wall at y=1 serves as a sill people can lean on.
- **Bay 2 (x 8–9):** a narrow tall window of `glass_pane`.
- **Office wing:** a `dark_oak_door` (facing=north, hinge=left) at x=13 and a 2×2 window at x 11–12.
- **Base / middle / top:** a stone plinth at y=0, brick from y 1–5, then an upper zone from y 7–10 carrying the sign at x 3–6, y 8–9, centred over the machine window. `iron_trapdoor` vents (open=false, half=bottom, wall-mounted) sit in pairs at x 1–2 and x 8–9.
- **Alignment:** posts line up from the plinth to the cornice. The vents sit directly over the solid bays and never over the opening.

**5. Depth plan**
- **Posts:** project 1 to z=−1, running full height.
- **Machine hood:** a `dark_oak_planks` beam at y=6 projecting 2 (z −1…−2), with stair brackets (half=top) under its ends.
- **Cornice:** projects 1.
- **Machine:** set back 2 (z=2) so the bay reads as a lit stage.
- **Windows:** recessed 1 with brick reveals.
- **Sign:** sits proud by 1.
- **Office door:** recessed 1 under a `dark_oak_slab` (type=top) canopy.

**6. Detail & life**
- **Sign:** a `dark_oak_wall_hanging_sign` reading "REDSTONE ENGINEER · WORKSHOP & PART-PICKING", mounted on a framed board of `spruce_planks`.
- **Lighting:** `lantern` (hanging=true) on chains from the hood, and a `redstone_lamp` row behind the machine that glows when it runs.
- **Stacks:** `andesite_wall` vent stacks on the hall roof with `polished_andesite` caps. Each brick chimney top holds a lit `campfire` (lit=true) so it smokes.
- **Ductwork:** an andesite-wall duct runs down the east wall into the office wing.
- **Street:** a 2-deep `cobblestone` and `stone_bricks` sidewalk (z −1…−2).
- **Props:** `barrel` (facing=up) and crates by the office door, a `chest` of spare parts, and a potted `fern` on the office sill.
- **Back (z=13):** plain brick with one service door, no frame.
