# Build Spec: Art Deco Dance Hall

## 1. Identity
Symmetrical stepped-and-finned art deco cinema/dance hall. A needle-spired central tower is flanked by lower winged bays, with a gold-and-jewel marquee over a twin-door entrance.

## 2. Footprint and height
The sheet disagrees with the stated 22×20×16, so the sheet wins.
- **Width:** 25 blocks (x=1..25) in a 26-column grid. Column 0 is empty.
- **Axis:** x=13, with everything mirrored about it.
- **Height:** 30 (y=0..29, apex at the top).
- **Depth:** 35 (z=0 is the canopy face, z=34 is the rear).
- **Wall plane:** z=5. Fins and pilasters are proud at z=4. The canopy projects z=0..3.
- **Side silhouette (z from front):**
  - The spire and shoulders run z=4..10 up to y=22–29.
  - The main roof sits at y=20 for z=8..24, with a dark band course at y=19.
  - The roof steps down to y=18 for z=25..27, then y=17 for z=28..34. The rear parapet is y=18.

## 3. Zones and bays

**Vertical zones**
| y | Zone |
|---|---|
| 0–3 | Plinth and entrance lintel (doors y0–2, lintel y3) |
| 4–10 | Marquee band and lower wing walls |
| 11–15 | Wing arches and pediments |
| 16–19 | Wing crests, stepping up toward the fins |
| 7–22 | Fins and tower shaft |
| 22–29 | Spire |

**Horizontal bays (x)**
| x | Bay |
|---|---|
| 1–2 | Outer pilaster |
| 3–7 | Wing (slit at x=5) |
| 8–9 | Blue fin |
| 10–16 | Tower (10 and 16 are tan fins) |
| 17–18 | Blue fin |
| 19–23 | Wing (slit at x=21) |
| 24–25 | Outer pilaster |

**Roof and top edges**
- **Wings:** capped in blue at y=16 for x=4..7 (mirrored at x=19..22). A black zig-zag steps up to y=19 at x=7 (mirrored at x=19).
- **Fins:** blue fins top out at y=21, with a taller cap at x=9 and x=17 (y=22).
- **Spire:** x=11–15 for y=23–26, then x=12–14 for y=27–28, then a single block at x=13, y=29.

## 4. Material map
| Region | Block |
|---|---|
| Pale cream wall fields (tower body, wing walls) | `smooth_quartz` |
| Tan pilasters, fins, lintel, side piers | `cut_sandstone` |
| Shadowed tan edges, side-wall piers | `sandstone` |
| Chiseled ornament, wing pediments | `chiseled_sandstone` |
| Royal-blue fins, wing caps, plinth accents | `blue_concrete` |
| Black plinth, zig-zag, dark roof band | `black_concrete` |
| Gold crest, sunburst, marquee frame | `gold_block` |
| Yellow glow (spire slit, sunburst centre, side lamps) | `glowstone` |
| Marquee white lit panels | `sea_lantern` |
| Marquee teal diamonds | `diamond_block` |
| Marquee green jewels | `emerald_block` |
| Orange marquee ends and speckled fringe | `honeycomb_block` |
| Stained glass (blue, yellow, orange, lime) | `light_blue_`, `yellow_`, `orange_` and `lime_stained_glass` |
| Dark slit windows | `black_stained_glass_pane` |
| Doors | `dark_oak_door` |

## 5. Features
- **Doors:** two `dark_oak_door`s at x=11–12 and x=14–15, y=0–2, with a tan pier at x=13. Dark lintel y=3, x=8..18.
- **Entrance piers:** x=8–9 and x=17–18, y=0..3, `cut_sandstone`, proud at z=4.
- **Marquee:** x=8..18, y=4..8, z=0..3.
  - **Face:** a cream `sea_lantern` panel across x=10–15. Teal and green jewels and orange ends frame it.
  - **Crest:** a gold ziggurat above the face at y=9 (x=9..17), narrowing to x=11..15 at y=10.
  - **Roof:** a stepped gold top that slopes back to the wall.
- **Tower glass:** x=12–14, y=8..16, recessed 2.
  - **Pattern:** a stained mosaic with an orange centre column. Blue sits at the top and a yellow base at y=8–9, widening to x=11..15.
  - **Chandelier:** one `chain` and `lantern` behind the glass.
- **Sunburst:** a gold fan, x=11..15, y=16..20, with a `glowstone` centre at x=13.
- **Spire slit:** x=13, y=23..27, amber glass framed by cream, recessed 1.
- **Wings (mirrored at x=21):**
  - **Slit:** a stained slit at x=5, y=5..11 (blue, yellow, orange gradient), recessed 1.
  - **Pediment:** an arch at y=12–14 with a gold block at x=5, y=14.
  - **Base:** a black base window at x=4..7, y=0–2, with a tan pane at x=5, y=1.
- **Outer pilasters:** x=1–2 and x=24–25, y=0..16, proud 1. Rhythm: `cut_sandstone`, then `sandstone`.
- **Side walls:**
  - **Plinth and band:** a black plinth at y=0, and a tan band at y=9–10.
  - **Windows:** quartz window bays at z=9–15 and z=19–25 for y=8..13, each with a blue-glass mullion at z=11 and z=23.
  - **Clerestory:** y=14–17, with blue panes at z=11, 14, 19 and 22.
  - **Piers:** tan piers with blue slits at z=15–17.
  - **Door and mirroring:** a dark oak door at z=17–18. The other side is a mirror.

## 6. Depth plan
| Element | Offset |
|---|---|
| Marquee | +5 (z=0..3) |
| Fins, pilasters, entrance piers | +1 (z=4) |
| Wall plane | 0 (z=5) |
| Wing and tower wall between fins | 0 |
| Stained glass | −2 |
| Wing slits | −1 |
| Arches | −1 |
| Doors | −1 |
| Spire slit | −1 |

Cream fins are the same depth as the blue ones. Same-colour relief shows only in the depth map, so follow `depth.txt` where it differs.
