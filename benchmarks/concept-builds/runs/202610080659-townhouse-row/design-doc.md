# Canal Row — Design Document

**1. Identity.** Three merchants' houses on a working quay. They share one stone ground storey and one eaves line, and above that each house shows its own trade in timber, brick or flat-roofed frame.

**2. Palette by role**
- **Dominant:** `stone_bricks`, used for the shared ground storey and the quay edge. The canal floods and carts scrape, so the base has to be masonry. This stone is what ties the row together.
- **Supporting:** `oak_planks` (house A, plus infill on house C) and `bricks` (house B). Oak is the timber merchant's own stock. Brick is fired from canal clay and shows a wealthier owner.
- **Framing:** `spruce_log` (axis=y) for posts and `stripped_spruce_log` (axis=x) for beams. Dark spruce frames the light oak, the same relation as ink drawn over paper.
- **Accent:** `terracotta` for the stepped-gable face on B, and one dye per door (blue, green, red).
- **Paving:** `cobblestone` / `stone_brick_slab` on the street. Rubble stone is cheap and meant to be walked on, not looked at.

**3. Massing & roof.** The houses sit at x 0–6 (A, 7 wide), x 7–12 (B, 6 wide) and x 13–19 (C, 7 wide), each 10 deep. Floors are at y = 0, 5 and 9, and the shared cornice is at y = 13.
- **A:** a front-facing gable 7 wide, with the ridge running along z. The roof is `spruce_stairs` (facing=east/west, half=bottom) laid in courses, with `oak_stairs` on the verge. The eaves overhang by 1.
- **B:** a stepped Dutch gable 6 wide, rising in 1-block steps to a 2-wide crown at y = 18. Each step is capped with `brick_slab` (type=bottom). The roof behind it is `brick_stairs`.
- **C:** a flat roof at y = 13 with a 1-high `stone_brick_wall` parapet. It carries a 3×3 `spruce_planks` pergola on `spruce_fence` posts over a `grass_block` garden. With nowhere left to build on a canal plot, the owner gardens upward.

**4. Facade composition.** Each house has three bays.
- **Base (y 1–4):** stone bricks. Each door is a 2-high `*_door` (facing=north, hinge per bay) in the centre bay, set in a doorway with a `spruce_trapdoor` lintel. A single `glass_pane` window sits in each side bay.
- **Middle (y 5–12):** two windows per storey, stacked directly above the ground-floor side bays. A and C use `spruce_log` corner posts with a `stripped_spruce_log` floor beam at y = 9. On B, `bricks` run right to the corners.
- **Top:** gable or parapet above the y = 13 line.
- **Shared datums:** a `stone_brick_slab` string course along the whole row at y = 5, and every house's eaves or parapet at y = 13.

**5. Depth plan**
- **Recessed:** doors and windows sit 1 block in from the wall face. The jambs read as wall thickness, not paint.
- **Projecting:** the corner posts on A and C stand 1 block proud of the infill. B's gable steps project ½ via slabs. Upside-down `stone_brick_stairs` (half=top, facing=south) make a corbel course under the y = 5 string course.
- **Sidewalk:** z = −1 to −2 at street level (`stone_brick_slab`), then at z = −3 a `stone_brick_wall` coping as the quay lip.

**6. Detail & life**
- **Lamps:** three `lantern`s hung on `dark_oak_fence` posts at z = −2, one at each party line, as in the concept.
- **Signs:** one `spruce_wall_sign` (facing=north) per shop beside its door. A's reads "TIMBER" and C's reads "CHANDLER".
- **Window boxes:** `potted_` flowers on `spruce_trapdoor` sills (open=false, half=top) under the second-floor windows. Use red on C to echo its door.
- **Hoist beam:** a `spruce_fence` beam sticking out of A's gable apex, with a `chain` hanging from it. That is how goods reach the attic.
- **Moored at the quay:** two `barrel`s and a `crafting_table` crate stack by B's door.
- **Back:** plain oak and brick walls with one window per floor. The roofs carry over unchanged.
