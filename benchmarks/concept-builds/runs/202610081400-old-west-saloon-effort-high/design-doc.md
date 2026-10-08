# The Silver Nugget Saloon: Design Document

## 1. Identity
A sun-bleached grey-board saloon with dark timber piers. Its false front and wraparound balcony make it the loudest silhouette on the street.

## 2. Palette by role
- **Dominant: `polished_andesite`.** It stands in for unpainted clapboard that has gone silver-grey in the desert sun. It fills the wall panels.
- **Supporting: `dark_oak_planks`, `stripped_dark_oak_log` (axis=y) and `dark_oak_fence`.** This is the heavy frontier timber: piers, beams, cornice, balcony rail and hitching rails. Dark timber against pale board gives the frame-and-infill rhythm.
- **Supporting: `spruce_planks`.** It is used for the boardwalk deck, interior floors and batwing doors, in a warmer brown than the frame so people read as walking on something worn.
- **Accent: `lantern`, `birch_planks` and `red_banner`.** The warm light, the signboard and the balcony flag are the only bright notes, so they mark the entrance.

## 3. Massing & roof
There is one 14×16 box, two storeys (y=1–4, floor at y=5, y=6–9). A boardwalk and balcony wrap the front, 3 deep (z=−3…−1).

A low, hidden shed roof of `spruce_slab` at y=10 slopes to the back, with `spruce_stairs` eaves on the long sides. It is lost behind the false front, which rises to y=13 across the full width. This is how a plain box gets a grand face, as in period saloons.

The cornice is a `dark_oak_slab` (type=bottom) at y=14, running x=−1…14 and projecting 1 at the front and sides.

## 4. Facade composition
- **Piers:** `stripped_dark_oak_log` pairs at x=4–5 and x=8–9, running y=1–13. They frame the centre bay and carry the sign's weight visually.
- **Base:** the boardwalk plus a 1-high `dark_oak_planks` skirt (y=1).
- **Middle:**
  - The centre bay is x=6–7, with batwing doors below and a balcony door above.
  - Side bays are x=0–3 and x=10–13, each with a 2×2 `glass_pane` window (x=1–2 and x=11–12) at y=2–3 and again at y=7–8. The windows stack exactly over each other.
- **Top:** the false front (y=10–13) holds the signboard.
- **Sign:** `birch_planks` at x=3–10, y=10–12, framed in `dark_oak_planks`. `oak_wall_sign`s at z=−1 carry the lettering "THE SILVER NUGGET / SALOON".
- **Symmetry:** everything mirrors on x=6.5, so the building reads as confident.

## 5. Depth plan
- **Boardwalk and balcony:** the boardwalk deck is `spruce_planks` at y=0 and the balcony floor is `dark_oak_slab` at y=5, both z=−3…−1. Posts at z=−3, x=1, 5, 8, 12 (`dark_oak_fence`, y=1–4) hold the balcony up.
- **Piers:** proud by 1 (z=−1).
- **Windows:** recessed 1, with the wall omitted at z=0 and `glass_pane` at z=1. Open `dark_oak_trapdoor` shutters (facing outward) frame each one.
- **Doors:** the centre bay is recessed 1.
- **Cornice:** overhangs 1.
- **Sign:** flush.

## 6. Detail & life
- **Batwing doors:** `spruce_trapdoor` (open=true, half=bottom) at x=6 (facing=west) and x=7 (facing=east), y=2–3. The legs stay visible under them, as in a western.
- **Balcony:**
  - `dark_oak_fence` rail at y=6 around the front and both ends.
  - `dark_oak_door` (facing=north, hinge=left) at x=6, y=6–7, with a `red_banner` hung beside it at x=7.
- **Lanterns:** `lantern` (hanging=true) under the balcony at x=3 and x=10, y=4, z=−3, plus one inside each window.
- **Hitching rails:** `dark_oak_fence` runs at z=−3 over x=1–3 and x=10–12 at y=1, with `hay_bale` (axis=x) and a water `cauldron` beside them.
- **Props:** `barrel` (facing=up) stacks at x=0 and x=13, z=−2.
- **Back:** plain `polished_andesite`, one `dark_oak_door` and two windows.
