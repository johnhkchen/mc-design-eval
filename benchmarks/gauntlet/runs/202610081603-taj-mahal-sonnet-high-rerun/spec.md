# Taj Mahal: Build Spec

## 1. Identity
White marble mausoleum on a square plinth, with four minarets, a bulbous onion dome with gold finial, four chhatris, and a recessed pishtaq on each face. It is symmetrical on both axes.

## 2. Footprint and height
Axes: x = left→right, z = front→back, y = up. Origin (0,0,0) is the front-left ground corner of the plinth.
- Brick apron: 43×43 including a 1-block ring, y0.
- Plinth: 41×41, y1–4. The walkable terrace is y5, and the edge parapet is y5–6.
- Mausoleum: 25×25 at x8–32, z8–32, with 3×3 chamfered corners. Walls rise y5–19.
- Dome finial tip: y40. Minaret tips: y34.

## 3. Zones, bays and roof
**Vertical zones**
- y5–9: lower arched niche tier, with a cream skirting course at y5.
- y10–15: upper niche tier.
- y16–18: frieze and calligraphy band.
- y19: cornice, then a balustrade parapet y19–20 with small pillar kiosks (y19–22) over the piers.
- y19–26: round drum, 13 across, set back from the roof edge.
- y27–37: onion dome, 15 wide at y30–31, pinched to 3 wide at y37.
- y38–40: finial.

**Bays across the front (x, left to right)**
- Niche bay: x8–10 (3 wide).
- Pier: x11.
- Niche bay: x12–14.
- Pishtaq: x15–25 (11 wide), rising to y21.
- Mirror the rest: niche bay x26–28, pier x29, niche bay x30–32.

**Roof**
The roof is flat and parapeted. Dome and drum sit at the centre (20,20). Chhatris (5×5, y19–27) sit at (12,12), (28,12), (12,28) and (28,28). Each has four pillars (y19–22), a small dome (y23–26) and a gold tip.

## 4. Material map
| Region | Block |
|---|---|
| Main wall field, pishtaq face, plinth wall | `calcite` |
| Dome shell, drum, minaret shafts | `smooth_quartz` |
| Dome ring highlights, cornice, balustrade slabs | `quartz_block`, `quartz_slab`, `quartz_stairs` |
| Cream trim: skirting, pilasters, minaret galleries, chhatri pillars | `smooth_sandstone` |
| Niche and iwan back walls (shadow grey) | `andesite` |
| Black calligraphy bands, drum bands, door frame | `polished_blackstone` |
| Door lattice (jali) windows | `iron_bars` |
| Finial and dome tip pieces | `gold_block` |
| Apron, base course | `bricks` |
| Railings, kiosk posts | `quartz_wall` or `diorite_wall` |

## 5. Features (block coordinates)
- **Pishtaq (front):**
  - The slab at x15–25 stands proud of the wall by 1.
  - Black bands run at x16 and x24 from y6–19, joined by a black band across the top at y19.
  - The recess is x17–23. It has a stair-stepped pointed arch with springing at y12 and peak at y17.
  - Door: x19–21, y5–9, with a black U-frame.
  - Jali: x19–21, y10–14.
  - Repeat the pishtaq on all four faces, at the matching positions on the other three sides.
- **Niche arches:** each is 2 wide and 4 high, inverted-stair arched. Lower niches sit at y6–9, upper niches at y11–14. Centre each in its bay.
- **Minarets:** centres at (2,2), (38,2), (2,38) and (38,38).
  - 5×5 base, y5–7.
  - 3×3 shaft with 5×5 gallery rings at y12, y19 and y26.
  - Lantern (5×5 with a pillared opening), y27–31.
  - Quartz-stair dome, y32–33.
  - Gold tip at y34.
- **Plinth:** the parapet has panel recesses every 4 blocks. Small pier posts stand at the corners.
- **Dome:** stepped quartz rings, with cream pointed-oval panels (lancet inlay) on each face. A lotus ring of `quartz_stairs` sits at y36. The finial is `gold_block` at y38–39, with `end_rod` at y40.
- **Drum:** two black rings at y22 and y24.

## 6. Depth plan
- Apron projects 1 beyond the plinth.
- The pishtaq frame projects 1 (z7). The iwan is cut 3 deep (to z11), with its back wall in `andesite`. Carve it by not placing the front blocks.
- Niches are 1 deep, carved the same way.
- Cornice overhangs 1 at y19.
- Drum is inset 5 from the wall line.
- Chhatris sit 4 in from the roof edge.
- Minarets stand free at the corners and stay 1 clear of the mausoleum.
- Calligraphy bands are flush with the wall.
