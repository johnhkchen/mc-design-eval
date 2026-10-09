# BUILD SPEC: Art Deco Dance Hall

## 1. Identity
Symmetrical Art Deco cinema-style dance hall. A tall central tower and stepped shoulders sit over a gold-lit marquee. Lapis-blue fins run up the front, and the flanking wings carry stained-glass slits.

## 2. Footprint and height
The sheet disagrees with the stated 22×20×16, so **the sheet wins**.
- **Front trace:** 28 wide × 28 tall. The main mass is cols 1–26 (26 wide), plus 1-block ledge spikes at col 0 and col 27 around y=11.
- **Side trace:** 33 deep. The canopy takes z=0–3 and the main body is z=4–32.
- **Height:** tower peak at y=27 (28 blocks tall). Do not squash it.
- **Axes:** x=0 is the front-left corner, y=0 is the ground, z=0 is the canopy front. The centre axis lies between x=13 and x=14.

## 3. Zones and bays

**Vertical zones**
- **y0–3 (base and entrance):** black course at y=0, with lapis accents at y=1.
- **y4–8 (marquee band):** the canopy sits here, with a gold lip at y=4.
- **y9–16 (wing windows and central glass):** wing stained-glass slits and the lower central window.
- **y16–20 (shoulder cornice):** black and lapis cornice over the wings, with shoulders stepping up toward the tower.
- **y18–27 (tower):** the sunburst at y=15–17 sits below it, and a tapering spire runs from y=18 to y=27.

**Bays, left to right**
- **x1–3:** pilaster, 3 wide.
- **x4–8:** wing, 5 wide.
- **x9–10:** lapis fin pair.
- **x11–16:** central bay, 6 wide.
- **x17–18:** fin pair.
- **x19–23:** wing.
- **x24–26:** pilaster.

**Roof and top**
- The shoulders step diagonally up from the wing tops at y=15, passing x≈5–8 at y=16–19, to reach the fins at y=22.
- The tower is 8 wide at its base (x10–17) and tapers to 2 wide (x13–14) at y=27, with a gold cap at y=26–27.
- The main roof is flat at y=18–20 behind the tower.
- A 1-thick lapis cornice runs at y=18 along the side walls.
- The roof then steps down toward the rear: y≈16 at z=26–27, y≈13–15 at z=28–32.

## 4. Material map

| Region | Block |
|---|---|
| Tan wall field and pilasters | `cut_sandstone`, with `smooth_sandstone` for lighter courses |
| Shadow tan (reveals, rear tiers) | `sandstone` |
| White wall panels in the wings, tower slits and clerestory | `smooth_quartz` |
| Navy fins and cornice | `lapis_block` (`blue_concrete` for the darkest, inner fin faces) |
| Black base, cornice caps and doorway voids | `black_concrete` |
| Gold sunburst, marquee top steps, spire cap | `gold_block` |
| Marquee amber lip | `yellow_concrete` or `glowstone` |
| Marquee mosaic (orange and cyan) | `orange_concrete`, `light_blue_concrete`, `cyan_terracotta` |
| Marquee white panels | `sea_lantern` |
| Stained-glass windows | pastel stained glass: `light_blue_`, `yellow_`, `orange_` and `tinted_glass` in a checker pattern |
| Doors | `dark_oak_door` |
| Side-wall slit windows | `black_stained_glass_pane` |

## 5. Features, in block coordinates

**Entrance and marquee**
- **Doors:** two dark-oak double doors at x11–12 and x15–16, y0–2, with a central pier at x13–14 and black lintels at y=2.
- **Entrance pilasters:** x8–9 and x18–19, y0–3.
- **Marquee:** x8–19, y4–8, with the amber lip at y=4.
  - y5–7 is the mosaic, with cyan diamonds and white sea-lantern panels at x11–12 and x15–16.
  - y8 is a gold step at x8–19 and y9 is a gold step at x10–17.

**Central bay**
- **Stained glass:** x11–16, y9–18, as a vertical checker. Blue-grey at the top, pastel in the middle, gold at the bottom.
- **Sunburst:** gold fan at x11–16, y15–17, widening upward, with a gold cap at y=17.
- **Tower slits:** quartz at x12 and x15, y21–26, and a gold window slot at x13–14, y24–26.

**Wings**
- **Windows:** tall stained-glass slit at x5–6 (mirrored at x21–22), y5–10, over a black arch at y1–3.
- **Zigzag:** gold nugget at x5, y14, with a chevron of white and sandstone at y12–14. A black and navy diagonal cornice sits on top at y15–16.

**Fins**
- **Outer fins:** lapis at x9 and x18 from y=8 to y=22.
- **Inner fins:** x8 and x19 from y=8 to y=20.

## 6. Depth plan
Depth is measured from the main wall plane at z=4.
- **Canopy:** projects +4, so the marquee front is at z=0. Its steps rise as a stepped pyramid toward the wall.
- **Fins:** project +2 to +3, alternating (inner +2, outer +3). The tower projects +1.
- **Pilasters:** project +1 to +2 at x1–3 and x24–26.
- **Central stained glass:** recessed −2.
- **Wing windows:** recessed −2.
- **Doors:** recessed −2, with an extra −1 for the black arch voids.
- **Wing walls:** flush at 0.

**Side walls** (mirror both sides)
- The cornice and fin edges at the front are lapis, projecting +1 along z=4–7.
- Pilaster columns repeat every ~6 blocks along the length.
- Quartz clerestory slits with black windows run at y=15–17.
- A tan lower wall below.
- The rear steps down in two tiers.

Carve recesses by not placing the front material.
