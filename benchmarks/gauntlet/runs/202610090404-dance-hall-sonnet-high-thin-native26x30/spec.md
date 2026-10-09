# Build Spec: Art Deco Dance Hall

## 1. Identity
A symmetrical, stepped Art Deco dance-hall facade. It has tall black-and-white fins, a lapis-and-gold sunburst crown, a glowing marquee, a gold-and-red canopy and stained-glass windows.

## 2. Footprint and height
- **Front: 27 wide × 30 tall.** The trace grid is authoritative, so this overrides the stated 26. Cols 0–26 are the full width, and cols 1–25 are the 25-wide body. Cols 0 and 26 are 1-block ledge stubs at y=15 only.
- Depth is about 24, with a flat roof behind the crown.
- The crown stays tall and narrow. Do not squash it.

## 3. Zones, bays, top form
**Zones (y = height above ground, y=0 is the base course):**
- y0: black base course across the whole width.
- y0–3: entrance and door level.
- y4–6: canopy, with red above gold.
- y7–9: marquee band.
- y7–20: stained-glass windows.
- y15–16: the wing parapet steps in here.
- y17–21: the white pointed arch rises.
- y20–29: the lapis-and-gold crown.

**Bays (x, left to right):**
- 0–3: outer wing. Black fin at x=2, sand piers at x=1 and x=3.
- 4–5: side window bay.
- 6–7: white fin at x=6 with a black recess slot at x=7.
- 8–18: central tower. Glass is x=9–17, with white piers at x=11 and x=15.
- 19–20: mirror of 6–7.
- 21–22: mirror of 4–5.
- 23–26: mirror of 0–3.

**Silhouette from the top:**
- y29: single finial at x=13.
- y28 → y24: the crown widens, from 5 wide at y28 to 13 wide (x=7–19) at y24.
- y24 → y17: it keeps stepping out about 1 block per row to x=4–22.
- y17 → y16: it steps again to x=2–24, then to full width x=1–25.

## 4. Material map
| Region | Block | Where |
|---|---|---|
| Sand wall field | `smooth_sandstone` | wings, step shoulders |
| Tan trim, piers, steps | `cut_sandstone` | x=1,3,23,25 and the silhouette edge |
| Black fins and slots | `black_concrete` | x=2,24; x=7,19 (y8–21); base row |
| White fins and arch | `white_concrete` | x=6,20,8,18 and the arch outline |
| Crown blue | `blue_concrete` | the lapis fields |
| Crown gold | `gold_block` | sunburst rays, chevron zig-zag |
| Crown grey flecks | `gray_concrete` | x=9–10 and 16–17 at y~25 |
| Tall glass (dark panes) | `brown_stained_glass` | central and side windows |
| Tall glass (amber panes) | `yellow_stained_glass` | amber bands inside the windows |
| Marquee glow | `glowstone` | y8, x=9–17 |
| Marquee top row | `orange_concrete` | y9 |
| Marquee bottom row | `brown_concrete` | y7 |
| Marquee end boxes | `sea_lantern` | x=7–8 and 18–19 |
| Canopy top | `red_nether_bricks` | y5 |
| Canopy underside | `gold_block` | y4 |
| Lapis lintels | `blue_concrete` | over doors, x=4–5 and 21–22, y3 and y6 |
| Doors | `dark_oak_door` | side doors |
| Ledge stubs | `dark_oak_stairs` | x=0 and 26, y=15 |

## 5. Features
- **Crown (y20–29):** a lapis field with a gold sunburst at y24–28, fanning from x=13. Below it is a gold chevron zig-zag at y20–23 with the apex at x=13. Then comes the white pointed arch, y17–21, x=9–17, with a stepped peak.
- **Central window:** x=9–17, y10–20, brown and amber panes. White piers at x=11 and x=15 split it into vertical lights.
- **Side windows:** x=4–5 and x=21–22, y7–15, brown with an amber column. Above each sits an olive-tan blank panel at y16–19.
- **Marquee:** x=7–19, y7–9. The glowing strip is x=9–17 at y8, with a checkered orange row above and brown row below. The sea-lantern end boxes run the full 3 rows.
- **Gold accent:** one `gold_block` at x=13, y6, on top of the canopy.
- **Canopy:** x=6–20, y4–5, red over gold.
- **Main entrance:** x=10–16, y0–3, a dark recess with a glimpse of the dance floor and chandeliers behind glass. Use `black_concrete` for the shadowed back wall and a `glowstone` or `chain` + `lantern` chandelier inside.
- **Side doors:** x=4–5 and x=21–22, y0–2, with lapis lintels at y3.
- **Ledge stubs:** x=0 and x=26, y=15, brown stairs.

## 6. Depth plan
Depths are relative to the wall plane, 0 = flush, positive = forward.
- **Fins at x=6 and x=20:** project +2.
- **Fins at x=2 and x=24:** project +1.
- **Sand piers and shoulders:** flush, 0.
- **Black slots at x=7 and x=19:** recessed −1.
- **Central window and arch:** recessed −1. Carve each recess by not placing the front material, not by filling a block behind a solid fill.
- **Side windows:** recessed −1.
- **Entrance recess:** −2.
- **Marquee:** projects +2.
- **Canopy:** projects +3.
- **Crown:** flush with the wall plane, stepping back at each tier by 1.
- **Roof:** flat, set behind the crown, with 1-block parapet steps.
