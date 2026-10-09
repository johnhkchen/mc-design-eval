# Build spec: Art Deco Dance Hall

## 1. Identity
Symmetrical Art Deco dance hall: a stepped, finned central tower with a stained-glass nave, flanked by two lower wings with sunburst crests. It has a lit marquee and a canopied triple entrance.

## 2. Footprint and height
The sheet disagrees with the stated size, so the sheet wins.
- **Width:** 24 (x 0–23). The front trace is authoritative.
- **Height:** 27 (y 0–26) at the tower crown. The stated ~16 would squash the fins.
- **Depth:** 22 per the side trace. That is a body 18 deep (z 0–17 from the wall plane) plus a 4-deep canopy (z -1 to -4).
- Wings are 7 wide each, x 0–6 and x 17–23. The tower is 10 wide, x 7–16. The facade is mirror-symmetric about x = 11.5.

## 3. Zones, bays, roofs
**Vertical, bottom to top:**
- y 0–3: base and entrance.
- y 4–5: canopy.
- y 6–10: marquee.
- y 5–17: wing windows (wing top is y 20) and tower glass up to y 21 (pointed arch).
- y 17–19: cornice.
- y 20–26: crown. The wing crest is y 20–23.

**Horizontal bays:**
- x 0: edge pier.
- x 1: white fin.
- x 2–5: wing window.
- x 6: white fin.
- x 7–16: tower, with glass bays at x 8–9, 11–12 (centre, tallest) and 14–15.
- x 17: white fin.
- x 18–21: wing window.
- x 22: white fin.
- x 23: edge pier.

**Tower fins:**
- Fins sit at x 7, 9, 11–12, 14 and 16.
- They stand proud and rise in steps: the centre fins reach y 26, the next pair y 24–25, and the outer pair y 21–22.
- Between fins at the top, dark slits sit at y 22–23.

**Roofs:**
- Tower side tier at the front: z 0–6 to y 26.
- Rear mass: z 7–17, top y 23, white flat roof with a cream parapet and stepped setbacks.
- Wing roofs: y 20, white.

## 4. Material map
| Region | Block |
|---|---|
| Main wall field, piers | `sandstone` |
| Cornice, fin caps, edge piers | `cut_sandstone` |
| Lighter trim | `smooth_sandstone` |
| White fins and roofs | `quartz_block` / `white_concrete` |
| Dark navy window voids | `black_stained_glass` over `blackstone` |
| Wing window centre | `orange_stained_glass` and `brown_stained_glass` |
| Tower glass | `red_stained_glass` centre, `blue_stained_glass` and `gray_stained_glass` sides, `orange_stained_glass` accents |
| Marquee frame and lattice | `red_nether_bricks`, `nether_bricks` |
| Marquee panes | `sea_lantern` (6 wide) |
| Marquee lower strip | `shroomlight` studded with `red_nether_bricks` |
| Sunburst core | `gold_block` |
| Sunburst rays | `yellow_concrete` |
| Sunburst backing fan | `blue_terracotta` / `blackstone` |
| Canopy top | `cut_sandstone_slab` |
| Canopy front lip | `gold_block`, with a `waxed_weathered_copper` line below |
| Doors | `black_stained_glass` over `dark_oak_trapdoor` |
| Lights | `lantern` |
| Chandelier | `end_rod` and `lantern` chain, `glowstone` |

## 5. Features (x, y)
- **Sunbursts:** one on each wing, centred x 3.5 (cols 3–4) and x 19.5 (cols 19–20).
  - Gold core at y 20–21, rays beside it at x 2 and 5.
  - Navy fan behind at y 20–22.
  - Dark band at y 19, running x 1–6.
  - Chevron eyebrow under the crest at y 16–17.
- **Wing windows:** x 2–5, y 5–15. They are navy at the edges with an orange/brown glass core at x 3–4.
- **Wing base:**
  - Cream transom at y 3.
  - Small dark windows at y 1–2.
  - Window sill band at y 3.
- **Tower glass bays:** y 7–19 at the sides (peaking y 18), and y 7–21 at the centre.
  - Centre bay has a red strip at x 11–12.
  - Chandelier at x 11–12, y 16–18.
- **Marquee:** frame x 8–15, y 6–10.
  - Panes x 9–14 at y 7.
  - Lattice above at y 8–9, and a crest at x 11–12, y 11.
  - Lower strip at y 6.
- **Canopy:** x 6–17, top at y 5, gold lip at y 4.
- **Entrance (y 0–3):** three 2-wide, 3-tall openings at x 8–9, 11–12 and 14–15.
  - Lanterns on the piers at x 10 and 13, y 2.

## 6. Depth plan
Relative to the wall plane z = 0; negative values are in front.
- **Canopy:** z -1 to -4, at y 4–5.
- **Marquee:** one block thick at z -2. It stands off the wall, with the canopy top below it.
- **White fins and wing pilasters:** +1 (tower fins +2).
- **Wing windows and tower glass:** recessed 1–2. Cut the recesses by not placing the front material.
- **Entrance openings:** recessed 2.
- **Side wall (west, mirrored east):**
  - Corner white fin at z 0.
  - Lower tier, y 0–17: bays 3 wide separated by 1-wide piers.
  - Rear half bays are narrow slits, y 3–17.
  - Cornice band at y 18.
  - Upper tier above: short windows at y 19–23.
  - Base windows y 1–2, with a sill at y 3.
