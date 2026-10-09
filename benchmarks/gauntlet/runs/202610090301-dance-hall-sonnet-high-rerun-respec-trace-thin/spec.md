# BUILD SPEC: Art Deco Dance Hall

## 1. Identity
Symmetrical Art Deco picture-palace facade. A tall central spire tower is flanked by navy fins. Stepped wing shoulders hold stained-glass bays, and a gold-crested marquee shelters the entrance.

## 2. Footprint and height
- **Trace grid (authoritative): 26 W × 30 H.** The sheet wins over the stated 22 × 16, so the tower is not squashed to 16.
- Footprint **26 wide × 24 deep**. This keeps the stated ~0.9 depth/width ratio.
- Central spire peaks at **y=29**. Wing parapets sit at about y=15. Pilaster tops sit at about y=13.
- Origin: front-left ground corner, x→right, y→up, z→back.

## 3. Zones and bays
**Vertical zones (y):**

| y | Zone |
|---|---|
| 0–1 | Black and navy plinth |
| 2–3 | Entrance doors, dark wing doorways |
| 4–7 | Marquee, canopy and glass base |
| 5–12 | Wing glass bays and tower glass |
| 9–16 | Central stained-glass column |
| 17–19 | Sunburst panel |
| 15–16 | Navy cornice with black end caps |
| 20–29 | Open-arch spire, glass slit, stepped cap |

**Horizontal bays (x):**
- **0–2:** outer pilaster, cut and chiseled sandstone.
- **3–7:** wing bay with white wall and a 2-wide tall window at x=5–6.
- **8–9:** navy fin, running y=8–22 (x=16–17 mirrors it).
- **10:** cream pier.
- **11–14:** central tower and entrance.
- **15:** cream pier.
- **16–17:** navy fin.
- **18–22:** mirrored wing bay.
- **23–25:** mirrored pilaster.

**Roof and top form:**
- The silhouette steps in from full width at y≈15 to x=4–21 and then to x=8–17 at y≈21.
- Above y=22 the tower narrows to x=10–15, then x=11–14, then x=12–13 at the tip.
- The spire is a hollow stepped arch (sandstone frame) around a glass slit with a gold block at y≈26.
- Rear roofs are sandstone terraces stepping up toward the back, each with a white or quartz edge.

## 4. Material map

| Region | Block | Where |
|---|---|---|
| Cream wall piers, spire frame | `smooth_sandstone` | x=10, 15; spire |
| Pilasters, stepped parapets | `cut_sandstone` and `chiseled_sandstone` | x=0–2, 23–25; setbacks |
| Roof terraces | `sandstone` and `cut_sandstone_slab` | rear roofs |
| Fins and cornice navy | `blue_concrete` | x=8–9, 16–17; y=15–16 |
| Black accents, plinth | `black_concrete` (or `blackstone`) | wing cornice ends; y=0–1 |
| White wing walls | `white_concrete` (or `quartz_block`) | x=3–7, 18–22 |
| Gold sunburst, marquee crest | `gold_block` | y=17–19 and the marquee top |
| Central and wing stained glass | `blue_stained_glass`, `light_blue_stained_glass`, `yellow_stained_glass`, `orange_stained_glass` | patchwork panes |
| Marquee jewel band | `terracotta`, `glazed_terracotta`, `prismarine`, `sea_lantern` | marquee fascia, teal diamonds |
| Marquee white panel | `white_concrete` and `sea_lantern` | the sign face |
| Marquee underside | `spruce_planks` | canopy soffit |
| Doors | `dark_oak_door` ×2 pairs | x=11–14 |
| Wing doorways | `black_stained_glass` and `blackstone` | x=4–6 and 19–21 |

## 5. Features (block coordinates)
- **Doors:** a double door pair at x=11–14, y=0–3. A dark oak lintel sits above, with cream pilasters at x=8–9 and 16–17, y=0–4.
- **Marquee:** the fascia spans x=8–17, y=4–7. It projects 3 blocks forward and its gold top steps up toward the centre. The white sign panel is at x=10–15, y=5–6, and the teal diamonds are at x=12–13. The crest steps gold at y=8–9 over x=10–15.
- **Central glass:** a 4-wide, 8-tall patchwork (x=11–14, y=9–16) of blue, tan and green panes.
- **Sunburst:** a gold fan at x=10–15, y=17–19, with a bright core at x=11–14, y=18–19.
- **Wing windows:** a 2×7 glass strip at x=5–6 (mirrored at x=19–20), y=5–12. Above it is a gold ornament at y=13–14 with navy and black cornice caps.
- **Spire:** a 2-wide, 6-tall glass slit at x=12–13, y=22–27, inside a hollow arch.
- **Zig-zag trim:** alternate `chiseled_sandstone` and `cut_sandstone` blocks along each setback edge.

## 6. Depth plan
- **Marquee:** projects +3 at y=4–8 with a sloped gold top. Door recess is −1.
- **Fins:** project +2 at x=8–9 and 16–17. Piers at x=10 and 15 project +1.
- **Pilasters** at x=0–2 and 23–25 project +2.
- **Wing glass** sits recessed −1 behind the white wall plane.
- **Central tower body:** 8 wide × 10 deep. It rises above the main roof, which steps back in three terraces.
- **Side walls:** pilaster piers every 5 blocks and small windows at y≈10–12 above a sandstone base band. Everything is mirrored left-right.
