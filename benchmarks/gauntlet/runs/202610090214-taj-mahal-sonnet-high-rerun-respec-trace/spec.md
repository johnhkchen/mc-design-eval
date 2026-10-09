# Taj Mahal Build Spec (sheet-measured; sheet wins over stated size)

## 1. Identity
White-marble mausoleum with a central pishtaq iwan, a large onion dome on a drum, four chhatris, and two visible front minarets. It stands on a raised plinth over a red-brick base.

## 2. Footprint and height
Counted from the 59 × 57 trace, with one cell equal to one block. The stated 41 plinth, 25 mausoleum, 40 dome and 34 minaret figures are all too small.
- **Plinth:** 59 wide, so the sheet is about 1.4× the stated size. Square plan, 59 × 59.
- **Mausoleum:** about 39 wide (x10–49) and 39 deep.
- **Dome:** widest point about 20 across at y39–41. The finial tip reaches y56.
- **Minarets:** shafts 4 wide (x3–6), with a footing 6 wide (x2–7). The cap tops at about y38 and the spike tip at y40.
- **Do not squash.** Keep the dome-to-body ratio and the slender minarets.

## 3. Zones, bays and roof
**Vertical zones (y, bottom to top)**
- y0–1: red brick base, full footprint.
- y2–7: plinth, a white marble panelled wall with a top ledge at y7.
- y8–26: mausoleum body, two arched storeys. The lower storey is y8–15 and the upper is y16–22. A cornice and parapet band sits at y23–26.
- y27–36: drum, x21–38 (18 wide). Two black bands sit at y33 and y35. A neck ring sits at y36.
- y37–50: onion dome, bulging to 20 wide at y39–41, then tapering to a crown at y50.
- y51–56: lotus neck, then a gold finial and spike.

**Bays, left to right (x)**
- x0–9: left minaret footing and plinth end.
- x10–21: wing with 2 stacked arches per storey (four arches).
- x22–36: pishtaq, 15 wide, rising to y28.
- x37–48: right wing, mirroring the left.
- x49–58: right minaret footing.

**Roof and top**
- The wings are flat, with a parapet at y26 and tiny pinnacle spires at x10 and x48–49, rising to y34.
- Chhatris sit at x15–20 and x38–44, with bases at y27 and eaves at y31. Each has a domed cap to y35 and a finial to y37.

## 4. Material map

| Region | Block |
|---|---|
| Main white marble (walls, drum, dome, minaret shafts) | `quartz_block` |
| Smooth white fields and ledges, plinth top | `smooth_quartz` |
| Shaded or recessed marble (arch interiors, dome relief ring) | `calcite` |
| Mid-grey panel insets and pilasters | `polished_diorite` |
| Deep arch shadow, inner iwan | `light_gray_concrete` |
| Black calligraphy bands and the pishtaq frame (x23 and x35) | `black_concrete` |
| Red brick base strip (y0–1) | `bricks` |
| Finial, minaret and chhatri spikes | `gold_block` (spike: `lightning_rod`) |
| Windows and lattice in arches | `iron_bars` |
| Stairs and slabs for domes, eaves and ledges | `quartz_stairs` and `quartz_slab` |

## 5. Features (x from the left corner, y from ground)
- **Pishtaq frame:** black band at x23 and x35 from y8 to y27, joined by a top bar at y26–27.
- **Pishtaq arch:** opening x25–34, springing at y16, apex y23, with 2–3 nested stepped arches inside.
  - Inner window of iron bars at x28–31, y12–19.
  - Lower door arch at x28–31, y8–12.
  - Black frame lines around the inner door.
- **Wing arches:** 4 per wing, each 3 wide and 5–6 tall. Lower arches are at y9–14 and upper arches at y17–22. Centres are about x13 and x18 on the left, and x40 and x45 on the right (mirrored).
- **Minarets:** at x3–6 and x52–55. Three balconies, each projecting 1 block, at y14–15, y22–23 and y32–33. Each has a chhatri cap at y33–38.
- **Dome:** a calcite relief oval centred at about x29, y41, about 8 wide and 6 tall. The crown is stepped (stairs and slabs).
- **Finial:** gold block at y51–54, then a spike to y56.
- **Plinth panels:** shallow recessed rectangles every 4 blocks, along the whole length at y3–6.

## 6. Depth plan
- **Plinth:** a 59 × 59 block, with the mausoleum centred. Leave a terrace margin of about 10 blocks per side.
- **Pishtaq:** recess the iwan 5–6 deep behind the face plane. Frame bands stand 1 proud, and each nested arch steps back 1.
- **Wing arches:** recess 2 deep. Parapet and cornice courses project 1.
- **Drum and dome:** round, with radius 10 at the dome's widest point. The drum is 1 proud of the wall behind it.
- **Chhatris:** open pillared lanterns (4 corner posts) with eaves projecting 1.
- **Minarets:** round or octagonal shafts. Balconies project 1.
- **The other three faces:** repeat the front design (4-fold symmetry).
- **Corner minarets:** place all four at the plinth corners, 2 blocks in from the edge.
