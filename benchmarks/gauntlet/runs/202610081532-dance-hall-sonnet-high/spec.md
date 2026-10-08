# Art Deco Dance Hall: Build Spec

## 1. Identity
Symmetrical stepped Art Deco dance hall with a central finned tower, a gold marquee over the entrance, and navy/cream/white/gold colouring.

## 2. Footprint and height
- **Footprint:** 22 wide (x0–21, along the street) by 20 deep (z0 at the front plane to z19).
- **Height:** 16 blocks at the spire tip (y0–15).
  - Side wings top out at y8.
  - The pylon cap is at y12.
- **Scale note:** the sheet's pixel proportions imply a taller building, so heights are compressed to the stated 16.

## 3. Zones and bays

**Vertical, bottom to top:**
- y0: black/navy plinth.
- y1–3: entrance level.
- y4–6: marquee face and gold crown.
- y7–10: stained-glass window band.
- y11: gold sunburst.
- y12: pylon cap.
- y13–15: open-arch spire.

**Horizontal, left to right (total 22):**
- x0–1: end piers, with a stepped sand cap at y8.
- x2–5: side bay.
- x6–15: central bay.
  - x6 is a navy fin to y11.
  - x7 is a sand fin to y12.
  - x8 is a white field.
  - x9–12 is the glass window.
  - x13 is white.
  - x14 is a sand fin.
  - x15 is a navy fin.
- x16–19: side bay, mirrored.
- x20–21: end piers.

**Top forms:**
- Wings have a flat parapet at y8 with a stepped zig-zag crest in navy and black.
- The central bay is a stepped pylon.
- The spire is an open arch at x9–12 with legs at x9 and x12. It carries 2-wide yellow glass at x10–11, y13–14, and a 2-wide slab cap at y15.

## 4. MATERIAL MAP

| Region | Block | Where |
|---|---|---|
| Cream wall, piers, fins, cornices | `cut_sandstone` | End piers, fins, stepped crests, spire legs |
| Chiseled panels | `chiseled_sandstone` | Pier faces, band above doors |
| Rear terraces, parapet | `smooth_sandstone` | Rear roof tiers, wing caps |
| White wall field | `white_concrete` | Bays between fins, side walls |
| Navy fins and trim | `blue_concrete` | Outer fins x6 and x15, wing bands, plinth stripe |
| Black accents | `black_concrete` | Plinth, zig-zag ends, side-bay lower window |
| Marquee gold crown | `gold_block` | Stepped marquee top, sunburst, wing rosettes |
| Marquee sign field | `white_concrete` / `smooth_quartz` | Lit panel between ornaments |
| Marquee side ornaments | `glowstone` / `sea_lantern` | Lit panel and marquee jewel blocks |
| Marquee confetti border | `terracotta` / `orange_terracotta` | Marquee bottom and side borders |
| Teal ornaments | `warped_planks` / `prismarine` | Marquee centre diamond and zig-zag |
| Stained glass | mix of `yellow_`, `orange_`, `light_blue_`, `blue_stained_glass` | Central window and side-bay slits |
| Tower slit, lower side windows | `black_stained_glass` | Side-bay lower windows |
| Doors | `dark_oak_door` ×2 | Entrance |
| Door piers | `stripped_birch_log` | Flanking the doors |
| Marquee soffit | `smooth_quartz` | Underside of the canopy |

## 5. Features (x from the left corner, y from the ground, front plane z0)
- **Doors:** a double dark oak door at x9–12, y1–3.
  - Fluted piers flank it at x8 and x13, y1–3.
  - A chiseled sandstone lintel runs along y3.
- **Marquee:**
  - Face: x6–15 (10 wide), y4–5, with white sign panels left and right.
  - Centre: a teal diamond with orange and glowstone jewels.
  - Borders: terracotta confetti.
  - Gold crown: stepped, y6–7, width 8 at the base narrowing to 4 at the top.
- **Central window:** 4 wide at x9–12, y7–10, with a 2×2 checker of stained-glass colours and a sandstone mullion cross at x10–11.
- **Sunburst:** gold at x9–12, y11, as a fan with a 4-wide base and a 2-wide top step.
- **Side bays (x3–4 and x17–18):**
  - Window: stained glass at y3–6.
  - Rosette: a gold 2×1 at y7.
  - Lower window: black glass at y1–2, framed in black and navy.
- **Plinth stripe:** navy band at y0 on the wings, black under the doors.
- **Zig-zag:** navy and black stair blocks at wing tops, x2–5 and x16–19, y7–8.

## 6. Depth plan
- **Marquee:** projects 3 blocks forward (z−3 to z−1). The top is a gold stair ramp descending outward. It is supported by the door piers.
- **Central pylon face:** flush at z0.
- **Window and doors:** recessed 1 block (z1).
- **Fins:** project 1 block (z−1) from the white field.
- **Wing end piers:** project 1 block.
- **Rear roof:** steps down in three sandstone terraces from y8 at z4 to y5 at z19, each terrace a white band edged with navy and sand.
- **Side walls (z4–19):**
  - 2-wide pilaster strips, 1 proud, every 5 blocks.
  - Between them: white concrete with 1×2 glass slits at y3–5.
  - Navy cornice line at y7.
