# BUILD SPEC: Art Deco Dance Hall

## 1. Identity
A symmetrical, stepped Art Deco dance hall. A tall central tower of vertical fins and stained glass sits between two lower wings. Each wing has a gold sunburst crown. A lit marquee and a canopy mark the entrance.

## 2. Footprint and height
The sheet and trace win over the stated size. The trace grid is **24 wide × 27 tall** (x = 0–23, y = 0 at ground), so the tower is **27 tall, not 16**. Wings reach **y = 21**. Depth is 20, since the sheet gives no depth measurement. Do not squash height. The slenderness is the design.

## 3. Zones, bays, roof
**Vertical zones (tower):**
- y0–3: entrance base.
- y4: canopy.
- y5–9: marquee.
- y7–19: stained-glass shafts, arched at the top.
- y20–21: dark band.
- y22–26: crown of fins with slits.

**Bays (x):**
- 0: sandstone edge strip.
- 1: quartz fin (wing).
- 2–5: wing window bay (2 and 5 dark glass, 3–4 amber/red glass).
- 6: tall quartz fin, y3–24.
- 7–8: side stained window.
- 9: sand pier.
- 10–13: central window.
- 14: pier.
- 15–16: side stained window.
- 17: quartz fin.
- 18–21: wing, mirrored.
- 22: fin.
- 23: edge.

**Silhouette steps (tower):**
- y26: x9–14.
- y25: x7–16.
- y24: x6–17.
- y22–23: full x6–17 shoulders.
- Wings stop at y21 with a sunburst crown at x2–4 and x19–21.
- The crown sits on a flat quartz-slab roof with stepped parapets.
- Behind the front, the roof drops in three steps toward the rear.

## 4. MATERIAL MAP
| Region | Block |
|---|---|
| Wall field, piers, crown fins, edge strips x0/x23 | `smooth_sandstone` |
| Edge strip texture, plinth y0 | `cut_sandstone` |
| Tall white fins (x1, 6, 17, 22) | `smooth_quartz` |
| Roof | `quartz_slab` |
| Dark wing glass (x2, 5, 18, 21) and crown slits | `black_stained_glass` over `blue_concrete` backing |
| Wing amber/red glass (x3–4, 19–20) | `orange_stained_glass` and `red_stained_glass`, alternating by row |
| Tower side windows (x7–8, 15–16) | `red_stained_glass` with `orange_stained_glass` accents |
| Central window | `purple_stained_glass` and `blue_stained_glass` verticals, `red_stained_glass` core |
| Dark band y20 (x0–6, 17–23) | `nether_bricks` |
| Sunburst centre | `gold_block` |
| Sunburst fan | `gold_block` rays on `blue_concrete` |
| Marquee panel | `sea_lantern` |
| Marquee frame | `red_nether_bricks` and `nether_bricks` |
| Marquee lamp rows | `shroomlight` and `glowstone` |
| Canopy top strip | `gold_block` |
| Canopy edge | `warped_planks` or `prismarine_bricks` |
| Doors/void | `black_concrete` |
| Door sconces | `lantern` |
| Chandelier | `chain` (`iron_chain` on newer versions) and `lantern` |

## 5. Features (x, y)
- **Marquee:** x8–15, y6–9.
  - The sea_lantern panel fills x9–14 at y7–8.
  - A red_nether_brick diamond crown sits on y9, with a peak at x11–12, y10.
  - A shroomlight row runs along y6.
  - The ends are nether_brick shoulders at x8 and x15.
- **Canopy:** x7–16, y4, a gold strip with a teal edge. A sandstone fascia sits at y3 under it.
- **Entrance:**
  - Central doorway: x11–12 (3 wide if wanted), y0–2, black_concrete.
  - Flanks: sandstone pilasters with lanterns at x9 and x14, y2.
  - Doors set in dark reveals at x8 and x15.
- **Central window:** x10–13, y7–19, with a pointed arch.
  - The arch narrows to x11–12 at y18–19.
  - A chain-and-lantern chandelier hangs at x11–12, y14–17.
- **Side windows:** x7–8 and x15–16, y7–19, arched.
- **Wing windows:** x2–5 and x18–21, y4–18, with a sandstone sill at y3.
- **Sunburst crowns:** a gold_block 3×2 at x2–4, y19–20 with fan rays above it on blue_concrete (y21).
- **Crown fins:** sand fins at x7, 10, 13, 16 rise to y24–26. Dark slits sit between them at y22–23 (x8, 11, 12, 15).

## 6. Depth plan
- **Facade plane:** the sandstone wall is at z0.
- **Quartz fins:** project +1 (z–1). Tower fins x6 and x17 project +2.
- **Window glass:** set back 1–2 (z2–3). Carve recesses by not placing front wall blocks.
- **Entrance:** recessed 3 under the canopy.
- **Canopy:** projects 3.
- **Marquee:** projects 2 at z0–2, sitting on the canopy.
- **Sunburst crowns:** project 1.
- **Sides:** fins every 3 blocks (0, 3, 6, …), projecting 1, with 2-wide dark glass slots between them for y3–18.
- **Roof:** stepped setbacks. The tower roof runs 6 deep at y26, then drops to y24 for 6 more, then to y21 for the rest.
