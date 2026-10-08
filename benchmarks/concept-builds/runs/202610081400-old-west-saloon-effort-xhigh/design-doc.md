# The Silver Nugget Saloon

## 1. Identity
A silver-camp saloon: a gray mine-stone box in a dark timber frame, with a deep porch-and-balcony shelf that makes it the loudest, most open-looking building on the street.

## 2. Palette
- **Dominant: `stone_bricks`** for the walls. This is tailings stone from the mine the town exists for. It is fireproof where lamps and brawls meet, and its cool gray gives the timber a calm ground.
- **Supporting: `dark_oak_planks`, `dark_oak_log[axis=y]`** for the carpenter's frame: piers, posts, rails, cornice and lintels. It is dark and heavy, so it reads as structure.
- **Accent: `spruce_planks`** for the sun-bleached boardwalk, balcony floor and sign board. It is the only pale wood, so the eye lands on the working surfaces.
- **Light and glass: `lantern`, `glass_pane`.**

Relationship: a dark skeleton over a cool stone body, standing on a warm pale deck.

## 3. Massing & roof
One 14×16 block with a street-level floor at y=1. The ground storey is y=2–5, the floor plate and balcony deck are at y=6, and the upper storey is y=7–10. A `dark_oak_slab[type=bottom]` cornice at y=11 runs 1 block proud at the front. Above it is a stone false front, a parapet at y=12–13 with a stepped crown at x=4–9 up to y=15. The roof is flat, with a 1-block parapet at the sides and back, so it is hidden from the street. This is a frontier saloon, so the false front is taller than the roof behind it.

## 4. Facade composition
Seven bays on a centerline between x=6 and x=7:
**corner 1 | window 3 | pier 2 | door 2 | pier 2 | window 3 | corner 1**
- **Base:** the boardwalk and a stone sill at y=2.
- **Middle:** glass at y=3–4 and y=8–9, filling each 3-wide window bay. Upper windows sit directly over the ground windows. The balcony door (`dark_oak_door[facing=south,half=lower/upper,hinge=left]`) sits over the batwing doors.
- **Top:** cornice, parapet and crown.
- Piers are `dark_oak_log[axis=y]`, full height from y=2 to y=13. Corner posts are the same log at x=0 and x=13. Lintels are `dark_oak_planks` at y=5 and y=10.

## 5. Depth plan
- **Porch and balcony shelf:** z=−3 to −1, 3 deep. Posts are `dark_oak_log[axis=y]` at z=−3, x=0, 4, 9, 13, so the two inner posts land under the piers.
- **Piers:** 1 block proud, at z=−1.
- **Cornice:** 1 block proud.
- **Wall plane:** z=0.
- **Doorway and windows:** recessed 1 block, with glass and doors at z=1. Recesses are carved by not placing the stone, so nothing is buried behind a fill.
- **Boardwalk:** at y=1. The centre bay's front row (x=5–8, z=−3) is `spruce_stairs[facing=south,half=bottom,shape=straight]` as a step up from the street.

## 6. Detail & life
- **Swinging doors:** `spruce_trapdoor[open=true,facing=south,half=bottom]` at x=6 and x=7, y=3–4, inside the recess.
- **Sign:** a 4×2 `spruce_planks` board at x=5–8, y=7–8, z=−3, set in the balcony rail. It is lettered "THE SILVER NUGGET / SALOON" with `spruce_wall_sign[facing=north]`.
- **Balcony rail:** `dark_oak_fence` at y=7 along z=−3 and as returns at both ends, with potted cactus on top of the rail.
- **Hitching rails:** `dark_oak_fence` at y=2 between the posts in the side bays, with the centre left open for walking in.
- **Lights:** `lantern[hanging=true]` under the balcony at x=2 and x=11, y=5, z=−2, plus one on each inner post.
- **Porch props:** `barrel[facing=up]` at x=1 and x=12, z=−1, and `hay_bale[axis=x]` by the rails. Benches (`spruce_stairs[facing=south]`) sit under each window.
- **Balcony:** a red wall banner hangs over the balcony fascia.
