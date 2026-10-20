# Pier 59, Seattle Aquarium Bay Wing, Waterfront Landings: form plan

## SITE

The kit frame is the brief's plot frame. Plot 0 is at x 0..119. Plot 1 is at x 124..172, so local x = kit x − 124. Plot 2 is at x 177..242, so local x = kit x − 177. Plot 3 is at x 247..309, so local x = kit x − 247. z is the same in the kit frame and in each plot. Every coordinate below is in the KIT frame.

- **Orientation is the site orientation.** Do not turn anything.
  - Alaskan Way runs along z on the HIGH-x side. This is the "front".
  - Elliott Bay is on the low-x side. The pier runs diagonally out into it.
  - "North" means low z.
- **Ground.** A cell's ground value g is the y of its surface block. The floor or deck block of a mass is laid AT y = g, and people stand at g+1.
  - Where the ground under a mass is lower than its floor, footings or pilings go down to the ground. Nothing floats.
  - Build only on footprint (#) cells. A mass box below is clipped to its plot's footprint.
- **Diagonal notation (plot 0).** Write d = x − z and s = x + z. A 45° wall is a band of two consecutive d (or s) values. That makes a stair-stepped wall with no gaps.

### Plot 0: Pier 59 (pier shed). The deck is ground 3.

| mass | cells | y |
|---|---|---|
| Pier deck (whole footprint) | every # cell of plot 0, except the low dock | deck at y 3 (spruce_planks) |
| Pilings | every 4th cell along the outer ring of the footprint, plus a cell 1 in from it | stripped_spruce_log y 0..2 under the deck edge, with a dark_oak_planks pile cap at y 3 |
| Low dock (small lobe) | the # cells in x 44..67, z 12..43 | deck at y 2, posts down to the ground (0..2). It joins the main deck by a 2-wide slab ramp at x 44..45, z 30..33 (one half-step) |
| **Shed** | d ∈ [−40, −14] and s ∈ [100, 243], minus the entrance box | walls y 4..17; roof y 17..26 |
| Shed walls | long west wall d ∈ {−40, −39}; long east wall d ∈ {−15, −14}; NW gable s ∈ {100, 101}; SE end s ∈ {242, 243} | y 4..17; gables up to the roof line |
| **Entrance pavilion** (modern glass) | x 100..117, z 131..151 (axis-aligned) | y 4..16; flat roof y 17; parapet y 18 |
| East promenade | the deck between the shed's east wall and the footprint edge (d −13..−3) | rail at y 4 |
| Entrance plaza (land tip) | # cells with s ≥ 244 outside the pavilion | deck y 3, lamp posts |
| Bay-end deck (wide lobe) | # cells with x 0..43, z 0..47 | deck y 3, rail at y 4 round the outer edge |
| Seal pool (raised) | rim x 8..19, z 24..35 | rim y 4..5; water y 4..5 inside x 9..18, z 25..34 |
| Tide pool (raised) | rim x 24..35, z 38..47 | rim y 4..5; water inside x 25..34, z 39..46 |
| Planters | 3x3 boxes at (4,8), (30,16), (14,42), (60,92), (84,116) [x,z of the NW corner] | rim y 4; leaves tree to y 9 |

### Plot 1: the Bay Wing (1980). Ground is 3..5, mostly 4.

| mass | x | z | y |
|---|---|---|---|
| Hall N | 128..169 | 8..11 | floor 4, walls 4..10, roof deck 11 |
| Hall W | 128..133 | 12..29 | floor 4 (footing to 0 on x 124..129), roof deck 11 |
| Hall E | 156..171 | 12..29 | floor 4, roof deck 11 |
| Hall S | 128..171 | 30..39 | floor 4, roof deck 11 |
| Hall S tail | 136..171 | 40..43 | floor 4, roof deck 8 (one step down) |
| Link | 156..173 | 44..61 | floor 4, roof deck 8 |
| Dome hall (lobe) | the # cells of z 62..93 | | floor 4, walls 4..9, roof deck 10 |
| **Underwater dome** | glass hemisphere, centre (146, 10, 80), radius 8 | x 138..154 | z 72..88, y 10..18 |
| Otter pool (on Hall E) | rim 158..169 | 14..27 | rim y 12..13; water inside, y 12..13 |
| Seal pool (on Hall S) | rim 134..149 | 31..38 | rim y 12..13; water inside |
| Viewing deck (Link roof) | 156..173 | 44..61 | deck y 8, rail y 9 |

The open court at x 136..155, z 12..29 is not footprint and stays empty. The halls ring it, and the inner faces are glazed.

### Plot 2: Waterfront Landings North. Ground is 1 (0 on the west edge). It is a C shape: wings to the bay, the spine on Alaskan Way.

| mass | x | z | storeys | roof slab y |
|---|---|---|---|---|
| A: north street block | 221..239 | 12..38 | 6 | 26 |
| B1: north mid | 198..220 | 12..38 | 5 | 22 |
| B2: north bay end | 180..197 | 12..38 | 4 | 18 |
| C: spine (link) | 231..239 | 39..74 | 4 | 18 |
| D: south street block | 221..239 | 75..104 | 6 | 26 |
| E1: south mid | 198..220 | 75..104 | 5 | 22 |
| E2: south bay end | 183..197 | 75..104 | 4 | 18 |
| Penthouse on A | 227..235 | 18..30 | — | y 27..29, flat cap y 30 |
| Penthouse on D | 227..235 | 83..95 | — | y 27..29, flat cap y 30 |

### Plot 3: Waterfront Landings South. Ground is 1 (0 on the west, 2 on the east edge).

| mass | x | z | storeys | roof slab y |
|---|---|---|---|---|
| A: north street block | 291..309 | 9..35 | 6 | 26 |
| B1: north mid | 268..290 | 9..35 | 5 | 22 |
| B2: north bay end | 250..267 | 9..35 | 4 | 18 |
| C: spine | 301..306 | 36..65 | 4 | 18 |
| D: south street block | 289..303 | 69..86 | 6 | 26 |
| E1: south mid | 268..288 | 69..89 | 5 | 22 |
| E2: south bay end | 250..267 | 69..89 | 4 | 18 |
| E3: south tail | 274..300 | 87..95 | 4 | 18 |
| Penthouse on A | 296..304 | 15..27 | — | y 27..29, cap 30 |
| Penthouse on D | 292..300 | 72..82 | — | y 27..29, cap 30 |

On the cells of plots 2 and 3 that sit at ground 0 (the west strips), the brick base runs down one course to y 0. Their floors stay at y 1.

## ROOFS

- **Pier 59 shed.** A long gable roof whose ridge runs on the 45° diagonal d = −27, from s = 100 to s = 243. A PART BUILDS IT BY HAND, because the roof tool only takes rectangles.
  - With e = |d + 27|, for e = 0..14:
    - If e is even, the surface is a full deepslate_tiles block at y = 25 − e/2.
    - If e is odd, there is a full block at y = 25 − (e+1)/2, plus a deepslate_tile_slab (bottom) above it.
  - This gives a half-block-smooth stepped slope of about 35°.
  - e = 14 is the 1-cell eave overhang at y 18. The eave fascia is a dark_oak_planks course under it at y 17.
  - The ridge cap is polished_deepslate at y 26 along d = −27.
  - The roof is 1 thick. The gable triangles under it are wall (the NW gable at s 100..101, and the SE end above the pavilion).
  - Verge: the roof runs 1 cell past each gable (s 99 and s 244) with a dark_oak_planks barge course.
  - **Skylights.** On both slopes, at e = 6..8, cut a 3x3-step glass strip (the RESERVED cells) every 12 steps of s, starting at s = 112. Use light_blue_stained_glass, lit from below.
- **Entrance pavilion.** A flat roof at y 17 of smooth_stone, with a parapet at y 18 in polished_deepslate and an iron_bars rail. It stands in front of the SE shed gable.
- **Bay Wing.** Flat concrete roof decks at y 11 / 8 / 10, used as viewing decks.
  - Smooth_stone deck. The parapet is cut_sandstone_slab at the deck level+1, with an iron_bars rail above it.
  - The glass dome is a hand-built hemisphere: no roof tool.
- **Waterfront Landings.** `modern` preset (flat-parapet-modern) on every block's roof slab. The parapet is 1 high, with smooth_sandstone coping and an iron_bars rail.
  - Lower blocks are terraces seen from the higher ones: B2/E2 terraces at y 18, B1/E1 at y 22.
  - Penthouses get a flat dark cap (polished_deepslate) with a 1-cell overhang.

## FACADES

### Pier 59 shed (pale timber over a dark plinth)
- **Plinth.** y 4 is dark_oak_planks along both long walls.
- **Body.** y 5..16 in birch_planks.
  - Posts are stripped_spruce_log (axis y). They stand on the s values that are multiples of 8, on both wall bands.
  - The head plate is a stripped_spruce_log course at y 16.
  - The mid rail is at y 10 (the shed reads as two storeys).
- **Windows.** Every bay between posts has two windows, one per storey: y 6..8 and y 12..14, 4 cells of s wide, in glass_pane.
  - They are lit warm from inside: a lantern or shroomlight 2 cells inside each window.
- **Murals.** Sea-life mural bays on the EAST wall at s 140..155 and s 196..211, y 5..9, are reserved. There the windows are replaced by a mosaic:
  - background blue_concrete
  - waves cyan_terracotta and light_blue_terracotta
  - fish in yellow_terracotta and white_concrete
  - The mosaic is flush with the wall.
- **NW gable (bay end).** The same timber. It has a large 2-storey loading door opening (glazed) and a round-ish window in the gable at y 19..22.
- **Promenade rail.** spruce_fence at y 4 along the deck edges, with a lamp post (spruce_fence ×3 + lantern) every 8 cells.

### Entrance pavilion (east face x = 117 is the hero front)
- **Base.** y 4 is polished_deepslate.
- **Curtain wall.** y 5..11 is glass in a 2-wide rhythm with smooth_quartz mullions every 3rd z.
- **Sign band.** y 13..15 is a black_concrete fascia, x 117, z 133..149. Banner letters "SEATTLE AQUARIUM" (17 columns), white on blue, centred on z 141.
- **Blue arch mosaic.** At the south end, x 117, z 145..150, y 5..12: an arched panel of light_blue_terracotta, cyan_terracotta and prismarine_bricks (the wave arch from the concept).
- **Canopy.** A spruce slab canopy at y 12 over the doors, 2 proud (x 118..119).
- **North and south faces.** Glass on smooth_quartz, the same rhythm.

### Bay Wing (low concrete and glass)
- **Walls.** smooth_sandstone body with a cut_sandstone string course at roof deck − 1.
- **Glazing.** Ribbon windows of light_blue_stained_glass_pane at y 6..8, the full length of the bay (west and court) faces.
- **Plinth.** stone_bricks at y 4 and down to the ground. Spruce pilings show on the west edge (x 124..129, ground 0..3).

### Waterfront Landings (both blocks, the same language)
- **Base storey.** y 1..5 in bricks (red brick shops). This is the shop storey on the street faces (x 239 for plot 2; x 309 / 306 / 303 for plot 3).
- **String course.** A cut_sandstone_slab (top) course at y 6 runs right round every block.
- **Upper storeys.** smooth_sandstone (pale stucco) from y 6 to the roof slab. A cut_sandstone cornice course sits at the roof slab, 1 proud.
- **Corner bays (the signature).** On the street blocks A and D, each street corner gets a full-height glass bay 5 wide.
  - It is set IN the wall line (nothing passes the plot box), from y 6 to the roof slab: light_blue_stained_glass in smooth_quartz piers, with white_concrete floor bands at each floor level.
  - Positions:
    - plot 2 A: x 239, z 13..17 and z 33..37
    - plot 2 D: x 239, z 76..80 and z 99..103
    - plot 3 A: x 309, z 10..14 and z 30..34
    - plot 3 D: x 303, z 70..74 and z 81..85
  - The bays wrap 3 cells round the corner onto the north/south faces.
- **Balconies.** On the mid blocks (B1/E1) and the spine (C), each upper storey has balconies 2 deep with iron_bars rails. They are recessed INTO the face (loggias 2 deep), not projected.
  - They sit every 6 cells along the face, 4 wide. A glass door pair is in the back of each.
- **Street shops.**
  - Shop bays every 6 cells along the street face: y 2..4 glass, a door per bay at y 2..3.
  - A cyan_terracotta awning (as stairs/slabs) at y 5, 1 proud. It can be outside the box only if inside the plot, otherwise flush.
  - The fascia is above, at y 5.
  - Lit interiors.
- **Bay (west) faces.** The same stucco and window rhythm, plain, with rooftop terrace rails above.

## MATERIALS

| role | block |
|---|---|
| pier deck | spruce_planks |
| pilings, posts | stripped_spruce_log |
| pile caps, plinth, fascia, barge | dark_oak_planks |
| shed walls (pale timber) | birch_planks |
| shed roof | deepslate_tiles + deepslate_tile_slab |
| ridge, pavilion base, parapets | polished_deepslate |
| aquarium concrete | smooth_sandstone (body), cut_sandstone (courses), smooth_stone (decks) |
| aquarium plinth | stone_bricks |
| modern glass | glass, glass_pane |
| blue glass (dome, bays, ribbons) | light_blue_stained_glass, light_blue_stained_glass_pane |
| mullions, bay frames | smooth_quartz |
| floor bands | white_concrete |
| mural / mosaic | blue_concrete, cyan_terracotta, light_blue_terracotta, prismarine_bricks, yellow_terracotta, white_concrete |
| sign board | black_concrete |
| stucco | smooth_sandstone; cornice/coping cut_sandstone, smooth_sandstone_slab |
| brick base | bricks |
| awnings | cyan_terracotta (+ dark_oak_trapdoor valance) |
| rails | spruce_fence (pier), iron_bars (modern) |
| pool rims | smooth_stone; water: water |
| light | lantern (posts, eaves), shroomlight / pearlescent_froglight (behind glass), end_rod (dome ribs) |
| planting | oak_leaves, azalea_leaves (persistent), oak_log trunks |

## OPENINGS

- **Pier shed.**
  - Long walls: windows y 6..8 and y 12..14 at s ≡ 2..5 and s ≡ 10..13 (mod 16), in every bay of both long walls.
  - The mural bays (s 140..155, 196..211, east wall, y 5..9) are not cut.
  - Doors to the promenade: east wall at s 120..121, 176..177 and 224..225, y 5..7 (a double door, 2 cells of s).
  - NW gable: a loading opening along the band s 100..101 at d −30..−24, y 5..12 (glazed). A gable window at d −28..−26, y 19..22.
- **Entrance pavilion.**
  - East face x 117: doors z 137..140 (two double glass doors), y 5..6. The deck before them is level (y 3 deck, floor y 4: one half step via slabs at x 118..119).
  - The curtain glass is everywhere else, y 5..11.
- **Bay Wing.**
  - Ribbon windows y 6..8 on every outer face. A door pair at Link x 173, z 50..51, y 5..6.
  - Dome hall doors at the lobe's NE edge.
- **Landings.**
  - Windows in every storey y (floor+1)..(floor+2), 2 wide, every 3 cells along each face.
  - Shop doors on the street face, one per 6-cell bay. Residential entries are a 3-wide glass door at the centre of each spine (plot 2: x 239, z 55..57; plot 3: x 306, z 49..51).

## RESERVED (the shell leaves these empty)

- Pier 59:
  - the shed skylight strips (see ROOFS)
  - the mural bays on the east wall
  - the sign band cells x 117, z 133..149, y 13..15 (the board is laid, letters later)
  - the arch mosaic panel x 117, z 145..150, y 5..12
  - both raised pool interiors
  - planter boxes
- Bay Wing:
  - the dome hemisphere volume (x 138..154, z 72..88, y 10..18)
  - the otter and seal pool interiors
- Landings:
  - the corner-bay glass panels
  - loggia recesses 2 deep
  - awning cells at y 5 on the street faces
  - penthouse footprints on the roofs

## FLOORS

| mass | floor y | storeys (floor to floor) | interior volume |
|---|---|---|---|
| Pier shed | 4 (deck 3) | ground hall 4..9, mezzanine 10..16 | inside the d −38..−16, s 102..241 band, up to the roof |
| Entrance pavilion | 4 | lobby 4..16, mezzanine floor at 10 | x 101..116, z 132..150 |
| Bay Wing halls | 4 | single storey 4..10 | each hall box minus its walls |
| Dome hall | 4 | 4..9 | lobe minus walls |
| Landings | 1 (shops), then 6, 10, 14, 18, 22 | shops 1..5, flats 4 each | block boxes minus walls; exterior only, so lit shops and windows only |

---
# DESIGNER SECTIONS

## PALETTE
Architect's MATERIALS kept exactly (spruce_planks, stripped_spruce_log, dark_oak_planks, birch_planks, deepslate_tiles, deepslate_tile_slab, polished_deepslate, smooth_sandstone, cut_sandstone, smooth_stone, stone_bricks, glass, glass_pane, light_blue_stained_glass(_pane), smooth_quartz, white_concrete, blue_concrete, cyan_terracotta, light_blue_terracotta, prismarine_bricks, yellow_terracotta, black_concrete, bricks, dark_oak_trapdoor, spruce_fence, iron_bars, water, lantern, shroomlight, pearlescent_froglight, end_rod, oak_leaves, azalea_leaves, oak_log). All checked for 1.21.1.
Shape variants: deepslate_tile_slab, deepslate_tile_stairs, polished_deepslate_slab/stairs/wall, spruce_slab/stairs/door/trapdoor, dark_oak_stairs/slab/fence/door, cut_sandstone_slab/stairs, smooth_sandstone_slab, smooth_stone_slab, smooth_quartz_slab/stairs, brick_stairs, prismarine_brick_stairs/slab, warped_stairs/warped_slab (the teal awning: cyan_terracotta has no stairs), sea_lantern, candle, chain (NOT iron_chain: 1.21.1), hay_block, barrel, spruce_wall_sign. Do not use: pale oak, iron_chain, cyan_terracotta_slab, glass_door.

## VOCABULARY (helpers; all coordinates absolute kit frame)
- deckFill(box|cells, y, mat=spruce_planks): lay planks at y=g of each # cell; below, stripped_spruce_log columns down to ground where g<y.
- pilingRun(cells): stripped_spruce_log axis y y0..2, dark_oak_planks cap y3.
- diagBand(d0,d1,s0,s1,y0,y1,mat): fill cells with d=x-z in [d0,d1] and s=x+z in [s0,s1] (stair-stepped, gapless).
- shedBay(wall, s): birch_planks y5..16, post log at s%8==0, plinth dark_oak y4, head log y16, rail y10, windows from shedWindow.
- shedWindow(wall,s): glass_pane two openings (y6..8,y12..14), 4 wide, shroomlight 2 cells inside at y7 and y13.
- shedRoofSlice(s): per e=0..14 the architect's tile rule; hand-built.
- skylight(s,slope): light_blue_stained_glass 3x3 on the roof cells plus shroomlight below.
- fishMural(wall,s0,s1,y0,y1): background blue_concrete; two sine wave rows of cyan_terracotta / light_blue_terracotta; 3-block fish (yellow_terracotta body, white_concrete eye) every 6 in s.
- doorPair(cell,face): spruce_door lower+upper both cells, same facing, hinge left/right mirrored.
- curtainWall(x,z0,z1,y0,y1): glass, smooth_quartz mullion every 3rd z; also N and S faces.
- aquariumSign: plaque/bannerWord "SEATTLE AQUARIUM" white on blue on black_concrete board, face east, centre z141.
- waveArch: arched panel, light_blue_terracotta field, cyan_terracotta ring, prismarine_bricks keystone, round top via stairs.
- canopy: spruce_slab(top) x118..119 y12 with dark_oak_trapdoor valance, lanterns under.
- lampPost(x,y,z): 3 spruce_fence + lantern on top. railRun: spruce_fence y4.
- poolRim(box,y0,y1): smooth_stone ring, inside water to y1.
- planterTree(x,z): smooth_stone rim, oak_log trunk 4-5, oak_leaves persistent crown wider by 2, azalea_leaves accents.
- hallBox(box,floor,top): smooth_sandstone walls, stone_bricks plinth y4, cut_sandstone string at top-1, smooth_stone roof deck, parapet cut_sandstone_slab + iron_bars.
- ribbon(face,y6..8): light_blue_stained_glass_pane band, warm shroomlight behind.
- glassDome(c,r): shell of light_blue_stained_glass where r-0.7<=dist<=r+0.3 and y>=cy; four end_rod ribs; sea_lantern at base.
- deckRail: smooth_stone deck, cut_sandstone_slab parapet, iron_bars on top.
- stuccoBlock(box,roofY,floors): bricks base y1..5, string course cut_sandstone_slab(top) y6, smooth_sandstone above, cornice cut_sandstone 1 proud at roofY.
- cornerBay(x,z0,z1): 5-wide full-height glass in smooth_quartz piers, white_concrete bands each floor, wrapping 3 round.
- loggia(face,z,y): 2-deep recess (by not placing the face material), iron_bars rail, glass_pane door pair at back.
- shopBay(face,pos): glass y2..4 in smooth_quartz frame, door, lit candle/shroomlight behind. awning(face,pos): warped_stairs (upside-down not needed, facing out) y5 1 proud, dark_oak_trapdoor valance.
- terraceRail: modern parapet, iron_bars; penthouse cap polished_deepslate overhang 1.
- lanternRow(cells): lantern hanging under eaves/canopy; froglight behind windows.

## ROOMS
Exterior only: no interior rooms to furnish. Lit window interiors are done by the facade parts (shroomlight 2 cells inside). Rooms: none.

## ENTRANCE
Main entrance: Entrance pavilion east face, standing cell (119,4,138) outside the doors (x117, z137..140); street cell on Alaskan Way plaza (121,4,138); slab ramp x118..120 from the plaza (deck y3, floor y4: one half step).

## PARTS (each ≤12 min)
1. Pier + pilings + decks (modules parts/pier.mjs): deckFill, pilingRun, low dock, bay-end deck, pools, planters.
2. Pier shed shell and roof (parts/shed.mjs): diagBand walls, posts, windows, shedRoofSlice, skylights, gables.
3. Pavilion, signs, murals, rails, lamps (parts/pavilion.mjs): curtainWall, aquariumSign, waveArch, canopy, fishMural, lampPost.
4. Bay Wing (parts/baywing.mjs): hallBox, ribbon, pools, glassDome, deckRail, piles on west edge.
5. Landings shells (parts/landings.mjs): both plots, stuccoBlock, roofs, penthouses, terraceRail; base down to ground.
6. Landings facade and dusk (parts/landings-facade.mjs): cornerBay, loggia, shopBay, awning, lanternRow, windows.

## Notes
- Do not turn anything; Alaskan Way is high x. Clip every mass to its footprint; build footings to ground, never float.
- Use `chain`, never iron_chain. Recess by not placing the front material.
- Loading order: parts in sequence; later parts never overwrite reserved cells except their owners.
- pier.mjs: planter at (30,16) skipped (3x3 not on footprint); planterTree writes 4 dirt (off-palette, no dirt in palette.json); low-dock ramp = top spruce slabs at y2.
