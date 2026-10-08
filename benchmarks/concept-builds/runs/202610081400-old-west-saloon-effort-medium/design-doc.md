# The Silver Nugget Saloon: Design Document

## 1. Identity
A silver-gray, two-storey frontier saloon. Its tall timber-framed false front, wraparound-style porch and balcony, and swinging doors make it the liveliest building on the street.

## 2. Palette by role
- **Dominant: `stone_bricks`.** Weathered, sun-silvered clapboard has no gray wood in Minecraft. Stone brick's horizontal courses read as aged siding in the concept. The gray also keeps the timber and sign legible.
- **Supporting: `dark_oak_log` (axis y/x) and `dark_oak_planks`.** This is the structural frame: pilasters, porch posts, beams, cornice and rails. Heavy timber carries the load, so it should look it.
- **Secondary timber: `spruce_planks` and `spruce_slab`.** Warmer and lighter, it is used for the boardwalk deck, balcony floor, sign board and doors. Use is worn pale, while the frame stays dark.
- **Accent: `lantern`, `glass_pane`, `red_banner`.** Warm light against gray, plus one saturated banner at the upper window.
- **Relationship:** gray field, dark frame, warm worn deck. The gray never touches the ground, because the deck separates it from the street.

## 3. Massing & roof
- **Main box:** x 0–13, z 0–15, ground floor y1–4, floor slab y5, upper floor y6–9.
- **False front:** the front wall rises to y12 over z 0–1, flat-topped and 2 blocks above the roof. It is crowned by a `dark_oak_stairs` cornice (half top, facing outward) projecting 1 block at z −1.
- **Roof:** a low gable behind the parapet. The ridge runs along z at x 6–7, in `spruce_stairs` with a 1-block eave overhang on the sides. The back gable end is plain stone brick, which is enough for the back.
- **Porch and balcony:** a single shed volume, z −3 to −1, with its deck at y5. It makes a covered boardwalk below and a railed balcony above.

## 4. Facade composition
- **Base, middle, top:** the base is the boardwalk and porch (y0–4). The middle is the balcony level and upper windows (y5–9). The top is the sign and parapet (y10–12).
- **Centre bay (x 5–8):** flanked by full-height `dark_oak_log` pilasters at x 4 and x 9, running y1–11.
  - Swinging doors are two open `spruce_trapdoor`s at x 6–7, y2, facing −z, with the opening dark behind.
  - A balcony door sits directly above at x 6–7, y6–7.
  - The sign board centres over both.
- **Side bays (x 1–3 and 10–12):** each has a 2×2 glass-pane window at y2–3 and another at y7–8, directly above it. Every window has a dark_oak trapdoor shutter or sill.
- **Alignment:** door, balcony door, sign and parapet peak share one centre axis. The pilasters and porch posts share the same x lines.

## 5. Depth plan
- **Porch:** projects 3 blocks (z −3 to −1). Posts are `dark_oak_log` at x 0, 4, 9 and 13, y1–4, at z −3.
- **Cornice:** projects 1 block over the parapet.
- **Pilasters:** project 1 block from the wall, at z −1.
- **Windows:** recessed 1 block behind the wall face. Bring the stone brick forward and set the panes in the second layer.
- **Balcony rail:** at z −3. Fence posts alternate with `dark_oak_fence` panels.
- **Steps:** two `spruce_stairs` rise at the door from the street at z −4.

## 6. Detail & life
- **Sign:** a 7×2 `spruce_planks` board at y9–10, z −1, ringed by dark_oak trim. It carries the "SILVER NUGGET SALOON" text on `oak_wall_sign`s.
- **Lights:** `lantern`s hang from the porch beam at x 3 and x 10 (y4), and one stands on each balcony corner post.
- **Hitching rails:** `dark_oak_fence` between the street posts, with `hay_block`s as horse feed.
- **Props:** `barrel`s and a `bench` at x 1–2 on the deck, and a `flower_pot` on the balcony rail.
- **Street strip:** `smooth_sandstone` and `red_sand` patches in front (z −4 to −3), with `coarse_dirt` scatter.
