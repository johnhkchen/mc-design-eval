# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# REQUIRED ELEMENTS (kit frame coordinates; all ids valid in 1.21.1)

| # | element | construction (block by block) | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Pier deck on piles | spruce_planks deck y3 on every # cell of plot 0; stripped_spruce_log pilings (axis y) y0..2 under the edge ring every 4th cell + 1 in, dark_oak_planks cap y3 over each pile | plot 0 footprint | A pier shell | pilingRun, deckFill |
| 2 | Pier shed walls | dark_oak_planks plinth y4; birch_planks y5..16; stripped_spruce_log posts (axis y) at s%8==0; head plate log y16 (axis along wall); mid rail y10 | d -40..-39 / -15..-14, s 100..243 | A | diagBand, shedBay |
| 3 | Shed gable roof, dark grey | deepslate_tiles full + deepslate_tile_slab(bottom) stepped per architect e rule, ridge polished_deepslate y26 on d=-27, eave fascia dark_oak_planks y17, barge course s99/s244 | ridge d=-27, s 99..244 | B roof | shedRoofSlice |
| 4 | Skylights | light_blue_stained_glass 3x3 strips at e 6..8 both slopes every 12 s from s112, lit by shroomlight under | roof | B | skylight |
| 5 | Shed windows, lit | glass_pane two per bay (y6..8, y12..14), 4 wide, shroomlight 2 cells inside each | both long walls | D facade | shedWindow |
| 6 | Sea-life murals | flush mosaic: blue_concrete ground, cyan_terracotta + light_blue_terracotta waves, yellow_terracotta + white_concrete fish | east wall s140..155, s196..211, y5..9 | D | fishMural |
| 7 | Loading door + gable window NW | glazed 2-storey opening s100..101, d-30..-24, y5..12 (glass_pane in dark_oak frame); gable window d-28..-26 y19..22 | NW gable | D | shedWindow |
| 8 | Promenade doors | spruce_door pairs (lower/upper, hinge mirrored) | east wall s120..121,176..177,224..225 | D | doorPair |
| 9 | Entrance pavilion, modern glass | polished_deepslate base y4; glass curtain y5..11 with smooth_quartz mullions every 3rd z; flat smooth_stone roof y17; polished_deepslate parapet y18 + iron_bars | x100..117, z131..151 | A/D | curtainWall |
| 10 | SEATTLE AQUARIUM sign | black_concrete board x117 z133..149 y13..15, white-on-blue banner word via plaque/bannerWord facing east | pavilion east | E signs | aquariumSign |
| 11 | Blue wave arch mosaic | light_blue_terracotta, cyan_terracotta, prismarine_bricks arched panel | x117 z145..150 y5..12 | E | waveArch |
| 12 | Canopy and doors | spruce_slab canopy y12 x118..119; two glass double doors z137..140 y5..6; slab ramp x118..119 | pavilion front | D | canopy |
| 13 | Decking rails and lamps | spruce_fence y4 along edges; lamp post = 3 spruce_fence + lantern every 8 | all pier edges | E | lampPost, railRun |
| 14 | Bay-end pools | smooth_stone rim y4..5, water inside | seal rim x8..19 z24..35; tide x24..35 z38..47 | A | poolRim |
| 15 | Planters and trees | 3x3 smooth_stone rim y4, dirt, oak_log trunk, oak_leaves persistent to y9 | 5 sites per architect | E | planterTree |
| 16 | Low dock | spruce_planks y2, posts to ground, 2-wide slab ramp x44..45 z30..33 | x44..67 z12..43 | A | deckFill |
| 17 | Bay Wing halls | smooth_sandstone walls, cut_sandstone string at deck-1, stone_bricks plinth, smooth_stone roof deck y11/8/10 | plot 1 masses | C wing | hallBox |
| 18 | Ribbon windows | light_blue_stained_glass_pane y6..8 along outer and court faces | plot 1 | C | ribbon |
| 19 | Rooftop seal and otter pools | smooth_stone rim y12..13, water inside | otter 158..169 z14..27; seal 134..149 z31..38 | C | poolRim |
| 20 | Underwater dome | light_blue_stained_glass hemisphere r8 centre (146,10,80), end_rod ribs on 4 meridians, sea_lantern inside | x138..154 z72..88 | C | glassDome |
| 21 | Viewing deck and rails | smooth_stone y8, cut_sandstone_slab parapet + iron_bars | Link 156..173 z44..61 | C | deckRail |
| 22 | Landings blocks | smooth_sandstone stucco y6+, bricks base y1..5 (0 on west strip), cut_sandstone_slab(top) string y6, cut_sandstone cornice | plots 2,3 masses | F, G shells | stuccoBlock |
| 23 | Corner glass bays | light_blue_stained_glass in smooth_quartz piers, white_concrete floor bands | per architect list | H facade | cornerBay |
| 24 | Loggia balconies | 2-deep recess, iron_bars rail, glass door pair at back | B1/E1, spine C every 6 | H | loggia |
| 25 | Shopfronts and awnings | glass y2..4, door per 6 bay, warped_stairs/warped_slab awning y5 + dark_oak_trapdoor valance, lit candles/shroomlight inside | street faces | H | shopBay, awning |
| 26 | Rooftop terraces and penthouses | modern parapet, iron_bars rail, polished_deepslate cap 1 overhang; stepped terraces | roofs | H | terraceRail |
| 27 | Dusk lighting | lanterns on posts/eaves, shroomlight and pearlescent_froglight behind glass, end_rod | all | I lights | lanternRow |
```

### rooms.json

```json
{"entrance":[119,4,138],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{"roles":{"pier_deck":["spruce_planks"],"pilings":["stripped_spruce_log"],"timber_dark":["dark_oak_planks","dark_oak_stairs","dark_oak_slab","dark_oak_fence","dark_oak_door","dark_oak_trapdoor"],"shed_wall":["birch_planks"],"shed_roof":["deepslate_tiles","deepslate_tile_slab","deepslate_tile_stairs"],"ridge_polished":["polished_deepslate","polished_deepslate_slab","polished_deepslate_stairs","polished_deepslate_wall"],"aquarium_body":["smooth_sandstone","smooth_sandstone_slab","cut_sandstone","cut_sandstone_slab"],"aquarium_deck":["smooth_stone","smooth_stone_slab"],"aquarium_plinth":["stone_bricks"],"glass":["glass","glass_pane"],"blue_glass":["light_blue_stained_glass","light_blue_stained_glass_pane"],"mullion":["smooth_quartz","smooth_quartz_slab","smooth_quartz_stairs"],"floor_band":["white_concrete"],"mural":["blue_concrete","cyan_terracotta","light_blue_terracotta","prismarine_bricks","prismarine_brick_stairs","prismarine_brick_slab","yellow_terracotta"],"sign_board":["black_concrete"],"brick":["bricks","brick_stairs"],"awning":["cyan_terracotta","warped_stairs","warped_slab"],"rail":["spruce_fence","iron_bars"],"light":["lantern","shroomlight","pearlescent_froglight","end_rod","sea_lantern","candle","chain"],"planting":["oak_leaves","azalea_leaves","oak_log"],"pool":["water"],"spruce_trim":["spruce_slab","spruce_stairs","spruce_door","spruce_trapdoor","spruce_wall_sign"],"fitting":["hay_block","barrel"],"Pale timber shed walls":["birch_planks","birch_stairs","birch_slab"],"Stucco, aquarium concrete and pool coping":["smooth_sandstone","smooth_sandstone_stairs","smooth_sandstone_slab"],"Brick shop bases and planters":["bricks","brick_stairs","brick_slab","brick_wall"],"Bay frames, cornices and floor bands":["smooth_quartz","smooth_quartz_stairs","smooth_quartz_slab"],"Roof slopes, eaves, ridges and terrace caps":["deepslate_tiles","deepslate_tile_stairs","deepslate_tile_slab","deepslate_tile_wall"],"Windows, dome and pool glazing":["light_blue_stained_glass","light_blue_stained_glass_pane"],"Piles, decking, framing and timber details":["dark_oak_log","dark_oak_planks","dark_oak_stairs","dark_oak_slab","dark_oak_fence","dark_oak_trapdoor"],"Railings and lighting":["iron_bars","lantern","sea_lantern"],"Aquarium mosaic and sign":["cyan_concrete","blue_concrete","light_blue_concrete","white_concrete"],"Shop awnings":["cyan_wool","cyan_carpet"],"Foundations, paving and exterior steps":["stone_bricks","stone_brick_stairs","stone_brick_slab"],"Pools and planting":["water","oak_log","oak_leaves","flower_pot","fern","azalea"]},"objects":["birch_planks","birch_stairs","birch_slab","smooth_sandstone","smooth_sandstone_stairs","smooth_sandstone_slab","bricks","brick_stairs","brick_slab","brick_wall","smooth_quartz","smooth_quartz_stairs","smooth_quartz_slab","deepslate_tiles","deepslate_tile_stairs","deepslate_tile_slab","deepslate_tile_wall","light_blue_stained_glass","light_blue_stained_glass_pane","dark_oak_log","dark_oak_planks","dark_oak_stairs","dark_oak_slab","dark_oak_fence","dark_oak_trapdoor","iron_bars","lantern","sea_lantern","cyan_concrete","blue_concrete","light_blue_concrete","white_concrete","cyan_wool","cyan_carpet","stone_bricks","stone_brick_stairs","stone_brick_slab","water","oak_log","oak_leaves","flower_pot","fern","azalea"]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which is moved into place only when the build succeeds.
set -eu
cd "$(dirname "$0")"
tmp="$(mktemp ./build.nbt.XXXXXX)"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// The Pike Waterfront build: the site grid, its ground under the footprint, then every part in plan order.
// Usage: node build.mjs <out.nbt>   (make.sh gives it a temp file)
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE, groundAt } from "./vocab/base.mjs";

// the bluff and bed under each footprint cell, laid before the parts (so not in palette.json, never reported)
const GROUND = "stone";
// plan order: each part's worker builds its own module; a part whose file is not written yet is skipped, not fatal
const PARTS = [
  ["Pier, pilings and decks", "./parts/pier.mjs"],
  ["Pier shed shell and roof", "./parts/shed.mjs"],
  ["Pavilion, signs and murals", "./parts/pavilion.mjs"],
  ["Bay Wing", "./parts/baywing.mjs"],
  ["Landings shells", "./parts/landings.mjs"],
  ["Landings facades and dusk lighting", "./parts/landings-facade.mjs"],
];

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

const g = new Grid(SITE.size, { dataVersion: SITE.dataVersion });
for (let x = 0; x < SITE.size[0]; x++) for (let z = 0; z < SITE.size[2]; z++) {
  const ground = groundAt(x, z);
  if (ground === null) continue;
  for (let y = 0; y <= ground; y++) g.set(x, y, z, GROUND);
}

const list = [];
for (const [name, file] of PARTS) {
  if (!existsSync(file)) { console.log(`part ${name}: ${file} not written yet, skipped`); continue; }
  const part = await import(file);
  list.push([name, part.build]);
}

runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Palette ids (palette.json), plan.md's site coordinates (kit frame), footprint and ground lookups, and a seeded rng.

// ---- palette: every id in palette.json, named (1.21.1) ----------------------------------------------------------
// pier deck, pilings, timber trim
export const SPRUCE_PLANKS = "spruce_planks";

export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";

export const DARK_OAK_PLANKS = "dark_oak_planks";

export const DARK_OAK_STAIRS = "dark_oak_stairs";

export const DARK_OAK_SLAB = "dark_oak_slab";

export const DARK_OAK_FENCE = "dark_oak_fence";

export const DARK_OAK_DOOR = "dark_oak_door";

export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";

// shed walls and roof
export const BIRCH_PLANKS = "birch_planks";

export const DEEPSLATE_TILES = "deepslate_tiles";

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";

export const POLISHED_DEEPSLATE = "polished_deepslate";

export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab";

export const POLISHED_DEEPSLATE_STAIRS = "polished_deepslate_stairs";

export const POLISHED_DEEPSLATE_WALL = "polished_deepslate_wall";

// aquarium concrete, decks, plinth
export const SMOOTH_SANDSTONE = "smooth_sandstone";

export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";

export const CUT_SANDSTONE = "cut_sandstone";

export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";

export const SMOOTH_STONE = "smooth_stone";

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";

export const STONE_BRICKS = "stone_bricks";

// glass and mullions
export const GLASS = "glass";

export const GLASS_PANE = "glass_pane";

export const LIGHT_BLUE_STAINED_GLASS = "light_blue_stained_glass";

export const LIGHT_BLUE_STAINED_GLASS_PANE = "light_blue_stained_glass_pane";

export const SMOOTH_QUARTZ = "smooth_quartz";

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";

// floor bands, murals, sign board
export const WHITE_CONCRETE = "white_concrete";

export const BLUE_CONCRETE = "blue_concrete";

export const BLACK_CONCRETE = "black_concrete";

export const CYAN_TERRACOTTA = "cyan_terracotta";

export const LIGHT_BLUE_TERRACOTTA = "light_blue_terracotta";

export const YELLOW_TERRACOTTA = "yellow_terracotta";

export const PRISMARINE_BRICKS = "prismarine_bricks";

export const PRISMARINE_BRICK_STAIRS = "prismarine_brick_stairs";

export const PRISMARINE_BRICK_SLAB = "prismarine_brick_slab";

// brick base, awnings, rails
export const BRICKS = "bricks";

export const BRICK_STAIRS = "brick_stairs";

export const WARPED_STAIRS = "warped_stairs";

export const WARPED_SLAB = "warped_slab";

export const SPRUCE_FENCE = "spruce_fence";

export const IRON_BARS = "iron_bars";

// lights, planting, water
export const LANTERN = "lantern";

export const SHROOMLIGHT = "shroomlight";

export const PEARLESCENT_FROGLIGHT = "pearlescent_froglight";

export const END_ROD = "end_rod";

export const SEA_LANTERN = "sea_lantern";

export const CANDLE = "candle";

export const CHAIN = "chain";

export const OAK_LEAVES = "oak_leaves";

export const AZALEA_LEAVES = "azalea_leaves";

export const OAK_LOG = "oak_log";

export const WATER = "water";

// spruce trim and fittings
export const SPRUCE_SLAB = "spruce_slab";

export const SPRUCE_STAIRS = "spruce_stairs";

export const SPRUCE_DOOR = "spruce_door";

export const SPRUCE_TRAPDOOR = "spruce_trapdoor";

export const SPRUCE_WALL_SIGN = "spruce_wall_sign";

export const HAY_BLOCK = "hay_block";

export const BARREL = "barrel";

// ---- site: plan.md's coordinates, kit frame (no turning) --------------------------------------------------------
/** The whole site: grid size [x, y, z] and the 1.21.1 DataVersion. */
export const SITE = { size: [310, 42, 172], dataVersion: 3955 };

/** The four plots: kit-frame x0..x1 and z0..z1; the footprint and ground maps (site.json) are per plot. */
export const PLOTS = {
  0: { name: "Pier 59", x0: 0, x1: 119, z0: 0, z1: 171 },
  1: { name: "Bay Wing", x0: 124, x1: 172, z0: 0, z1: 94 },
  2: { name: "Waterfront Landings North", x0: 177, x1: 242, z0: 0, z1: 110 },
  3: { name: "Waterfront Landings South", x0: 247, x1: 309, z0: 0, z1: 102 },
};

/** Deck levels: pier deck y3 (ground-level planks), pier floor and aquarium floors y4, landings shops y1. */
export const LEVELS = { deck: 3, floor: 4, landingsShop: 1 };

/** Pier 59 shed: d = x - z in [dLo, dHi], s = x + z in [sLo, sHi]; walls y4..17, roof y17..26, ridge d = ridgeD. */
export const SHED = { dLo: -40, dHi: -14, sLo: 100, sHi: 243, wallTop: 17, roofTop: 26, ridgeD: -27, eaveY: 18, eaveE: 14 };

/** Entrance pavilion (modern glass), axis-aligned: y4..16 walls, flat roof y17, parapet y18. */
export const PAVILION = { x0: 100, x1: 117, z0: 131, z1: 151, roofY: 17, parapetY: 18 };

/** Low dock lobe on plot 0: deck y2, posts to ground; 2-wide slab ramp at x44..45, z30..33. */
export const LOW_DOCK = { x0: 44, x1: 67, z0: 12, z1: 43, deckY: 2, ramp: { x0: 44, x1: 45, z0: 30, z1: 33 } };

/** Raised seal and tide pools on the bay end of plot 0: rim y4..5, water y4..5 inside. */
export const SEAL_POOL = { rim: { x0: 8, x1: 19, z0: 24, z1: 35 }, water: { x0: 9, x1: 18, z0: 25, z1: 34 } };

export const TIDE_POOL = { rim: { x0: 24, x1: 35, z0: 38, z1: 47 }, water: { x0: 25, x1: 34, z0: 39, z1: 46 } };

/** Planters on plot 0: 3x3 boxes, given as [x, z] of the NW corner; rim y4, tree to y9. */
export const PLANTERS = [[4, 8], [30, 16], [14, 42], [60, 92], [84, 116]];

/** Bay Wing (plot 1) halls: kit-frame boxes and roof deck y. Court x136..155, z12..29 stays empty. */
export const BAY_HALLS = {
  N: { x0: 128, x1: 169, z0: 8, z1: 11, roofY: 11 },
  W: { x0: 128, x1: 133, z0: 12, z1: 29, roofY: 11 },
  E: { x0: 156, x1: 171, z0: 12, z1: 29, roofY: 11 },
  S: { x0: 128, x1: 171, z0: 30, z1: 39, roofY: 11 },
  Stail: { x0: 136, x1: 171, z0: 40, z1: 43, roofY: 8 },
  Link: { x0: 156, x1: 173, z0: 44, z1: 61, roofY: 8 },
};

/** Bay Wing dome hall: the footprint cells of z62..93, floor y4, walls y4..9, roof deck y10. */
export const DOME_HALL = { z0: 62, z1: 93, floorY: 4, wallTop: 9, roofY: 10 };

/** Glass underwater dome: hemisphere centre, radius; occupies x138..154, z72..88, y10..18. */
export const DOME = { cx: 146, cy: 10, cz: 80, r: 8 };

/** Bay Wing pools on the roofs: otter on Hall E, seal on Hall S; rim y12..13, water inside. */
export const OTTER_POOL = { x0: 158, x1: 169, z0: 14, z1: 27, rimY: 12 };

export const BAY_SEAL_POOL = { x0: 134, x1: 149, z0: 31, z1: 38, rimY: 12 };

/** Landings masses (kit frame): storeys, roof slab y. Penthouses roof at y27..29, flat cap y30. */
export const LANDINGS = [

/** Shop-street corner bays (kit frame x, z range): wrap 3 cells round the corner. */
export const CORNER_BAYS = [

/** Residential entries: a 3-wide glass door at the centre of each spine. */
export const SPINE_ENTRIES = { 2: { x: 239, z0: 55, z1: 57 }, 3: { x: 306, z0: 49, z1: 51 } };

/** Ground value g of kit cell (x, z): the y of its surface block (build the floor at g; fill down to it). null off the footprint. */
export function groundAt(x, z)

/** True when kit cell (x, z) is a footprint (#) cell: build only on these. */
export const onFootprint = (x, z) => ...

// ---- seeded rng ---------------------------------------------------------------------------------------------------
/** rng(seed) returns a function giving floats in [0, 1); the same seed gives the same sequence (mulberry32). */
export function rng(seed)
```

### vocab/h1.mjs

```js
// vocab/h1.mjs: the plan's VOCABULARY helpers, set h1: deckFill, shedBay, skylight, curtainWall, canopy,
// planterTree, glassDome, cornerBay, awning. Kit-frame coordinates, absolute, nothing turned.
//
// Each helper takes the Grid first (the plan's signatures leave it out), then its position and facing. It writes
// only inside its own footprint and only into air, so an earlier part's blocks are refused and reported.
// { replace: true } lets a helper cut through a built layer (a skylight through the roof, a bay through a wall).
// Each returns { cells, refused }: cells as [x, y, z], refused as [x, y, z, block, why].

// ---- deckFill ---------------------------------------------------------------------------------------------------
/**
 * Deck: `mat` (default spruce_planks) on each cell of `area` at y, where area is a box [x0, z0, x1, z1] or a list of
 * [x, z] cells. With piles (default), stripped_spruce_log runs down from y-1 to `ground` (default 0) under each laid
 * cell, stopping at the first solid block (the ground is never written). piles: false for a deck that pilingRun owns.
 */
export function deckFill(g, area, y, mat = "spruce_planks", { piles = true, ground = 0, replace = false } = {})

/**
 * One bay of a long wall: wall ('west' | 'east'), s0 = the bay's post (a multiple of 8). The bay runs s0..s0+7,
 * clipped to the shed. Birch planks y5..16 over a dark_oak plinth at y4; posts (log, axis y) at s % 8 == 0; head
 * log at y16; mid rail log at y10. With windows (default), glass_pane at y6..8 and y12..14 over the 4 cells
 * s % 8 in 2..5, with a shroomlight 2 cells inside each window at y7 and y13. windows: false for a mural bay.
 */
export function shedBay(g, wall, s0, { windows = true, replace = false } = {})

// ---- skylight ---------------------------------------------------------------------------------------------------
/**
 * Skylight on the shed roof: 3 steps of s from s0 by e 6..8 on one slope (slope +1: d > -27, -1: d < -27). Glass
 * fills each roof column (both blocks where e is odd), with a shroomlight under it. The roof's full block at e is
 * at y = 25 - ceil(e/2); the odd-e slab sits above. Lay skylights before the roof (or pass replace) so the
 * roof leaves these cells.
 */
export function skylight(g, s0, slope, { replace = false } = {})

// ---- curtainWall ------------------------------------------------------------------------------------------------
/**
 * Glass curtain wall on the plane p (x for face east/west; z for north/south), its span t0..t1 (z, or x for
 * north/south), heights y0..y1 inclusive. A smooth_quartz mullion every 3rd cell of the span, from t0.
 */
export function curtainWall(g, p, t0, t1, y0, y1, { face = "east", replace = false } = {})

// ---- canopy -----------------------------------------------------------------------------------------------------
/**
 * Canopy over a facade opening: spruce_slab (top) at y, `depth` cells out from the plane, a dark_oak_trapdoor
 * valance under its outer edge at y-1, and a lantern hanging under the slab every 3rd cell of the span. pos is
 * { plane, from, to }: the facade plane and the span it covers. face is the way it projects.
 */
export function canopy(g, face, { plane, from, to }, y, { depth = 2, replace = false } = {})

// ---- planterTree ------------------------------------------------------------------------------------------------
/**
 * Planter at the NW corner (x, z) of a 3x3 box, rim at y (default 4): smooth_stone round, dirt in the middle, an
 * oak_log trunk at y+1..y+4 and an oak crown (2 wide, corners cut) up to y+5, azalea_leaves at the four top
 * corners. All leaves persistent.
 */
export function planterTree(g, x, z, { y = 4, replace = false } = {})

// ---- glassDome --------------------------------------------------------------------------------------------------
/**
 * Hemisphere of light_blue_stained_glass on centre c = [x, y, z] (y is the base row), radius r: a 1-cell shell
 * (r-0.7 .. r+0.3) above the base, four end_rod ribs on the N, S, E and W meridians (up at the crown), and a
 * sea_lantern just inside the base. The inside stays empty. A base cell that is already deck is refused.
 */
export function glassDome(g, [cx, cy, cz], r, { replace = false } = {})

// ---- cornerBay --------------------------------------------------------------------------------------------------
/**
 * Corner bay in the wall plane p of `face` (default east, so p is x), span z0..z1 (5 wide), from y0 (default 6) up
 * to the roof slab `top` (not included; required). Smooth_quartz piers at the span ends and middle,
 * light_blue_stained_glass between, white_concrete floor bands every 4 from y0. wrap: 'north' | 'south' turns the
 * bay round the corner at that end of the span, 3 cells deep onto that face (the same pattern).
 */
export function cornerBay(g, p, z0, z1, { top, y0 = 6, face = "east", wrap = null, replace = false } = {})

// ---- awning -----------------------------------------------------------------------------------------------------
/**
 * Awning over a shopfront: warped_stairs (teal, the palette's stand-in for cyan_terracotta) at y (default 5), in
 * the top half with the back to the wall, `proud` cells out from the plane (default 1), and a dark_oak_trapdoor
 * valance under it at y-1. pos is { plane, from, to }.
 */
export function awning(g, face, { plane, from, to }, { y = 5, proud = 1, replace = false } = {})
```

### vocab/h2.mjs

```js
// vocab/h2.mjs: nine pike-waterfront helpers from plan.md VOCABULARY: pilingRun, shedWindow, fishMural, aquariumSign,
// lampPost, hallBox, deckRail, loggia, terraceRail. Shared conventions:
//  - Positions are KIT-frame coordinates as plan.md writes them (the grid is the kit frame, no offset). Each helper
//    takes its position (and facing where it has one) as arguments, and returns { box, placed, skipped }.
//  - box = the footprint it may write (inclusive). Nothing is written outside it, so nothing goes below box[1].
//  - Air only: a cell that is not air is kept and listed in skipped (ground, floors, and walls an earlier part owns).
//    The one exception is shedWindow's { replace: "birch_planks" }, which cuts glazing into its own shed wall.
//  - Block ids are plan.md PALETTE literals (1.21.1). No leaves, doors or hanging lights in this set.

/**
 * Pilings under the deck edge: cells = [[x, z], ...]. Each is a stripped_spruce_log column at y 0..2 with a
 * dark_oak_planks cap at y 3. Only air is written, so a pile that would stand in ground is kept out and listed.
 * The cap is air-only too: where the deck (laid first) already covers y 3, the deck stays as it is.
 */
export function pilingRun(g, cells)

/**
 * A lit two-storey window in one long shed wall: wall = "west" | "east", s = the first of its 4 cells of s.
 * Glass panes at y 6..8 and y 12..14 in the wall's band, joined to each other; a shroomlight at y 7 and y 13, two
 * cells inside. Air only, so the wall must leave the opening; { replace: "birch_planks" } cuts it from the shed wall.
 */
export function shedWindow(g, wall, s, { replace = null } = {})

/**
 * A flush sea-life mosaic in one long shed wall over s0..s1, y0..y1 (the reserved mural bays): blue_concrete ground,
 * two sine rows of cyan_terracotta and light_blue_terracotta, and a 3-block yellow_terracotta fish (white_concrete eye)
 * every 6 in s. Each s is one wall cell, painted from the top: the fish over the waves over the ground.
 */
export function fishMural(g, wall, s0, s1, y0, y1)

/**
 * The SEATTLE AQUARIUM sign on the pavilion's east face: a black_concrete board at x, y0..y0+2, z zc-8..zc+8, with
 * the banner letters white on blue, hung on the board facing east, in the cell in front of it (x+1, the middle row).
 */
export function aquariumSign(g, x, y0, zc)

/** A lamp post standing on the ground at (x, y, z): three spruce_fence posts from y, and a lantern on top at y+3. */
export function lampPost(g, x, y, z)

/**
 * A Bay Wing hall over the rectangle [x0, z0, x1, z1]: a stone_bricks plinth at floor, smooth_sandstone walls up to
 * top-2, a cut_sandstone string at top-1, a smooth_stone roof deck at top, and the parapet and rail above it. Only
 * the ring and the deck are written: the floor inside belongs to the ground. clip(x, z) keeps it inside its plot.
 */
export function hallBox(g, [x0, z0, x1, z1], floor, top, { clip } = {})

/**
 * A viewing deck over [x0, z0, x1, z1] at y deckY: smooth_stone deck, a cut_sandstone_slab parapet at deckY+1 round
 * its edge, and iron_bars on the parapet at deckY+2. clip(x, z) keeps it inside its mass.
 */
export function deckRail(g, [x0, z0, x1, z1], deckY, { clip } = {})

/**
 * A 2-deep loggia recess in a facade: iron_bars rail across its front at y+1, and a glass_pane door pair against its
 * back wall at y+1..y+2 (two of the four cells along the run). The recess itself is air, left by not placing the face
 * material. face: "east" | "west" (the run goes along z) or "north" | "south" (along x). start = the first of the 4
 * cells along the run (z for east/west, x for north/south). plane = the face's own coordinate (x for east/west, z for
 * north/south). y = the balcony floor (not written).
 */
export function loggia(g, face, start, y, plane)

/**
 * A terrace or roof edge over [x0, z0, x1, z1] at roofY (the roof slab, not written): a 1-high smooth_sandstone parapet
 * with its coping on the ring at roofY+1, and iron_bars on it at roofY+2. penthouse, if given: { box: [x0, z0, x1, z1],
 * cap: y } caps the penthouse with a polished_deepslate slab at y, overhanging it by 1 on every side.
 */
export function terraceRail(g, [x0, z0, x1, z1], roofY, { clip, penthouse } = {})
```

### vocab/h3.mjs

```js
// vocab/h3.mjs: nine helpers from plan.md VOCABULARY: diagBand, shedRoofSlice, doorPair, waveArch, poolRim, ribbon,
// stuccoBlock, shopBay, lanternRow. Coordinates are the KIT frame, absolute, as plan.md writes them (no offset).
//  - Each helper takes its position (and facing where it has one) as arguments and returns { box, placed, skipped }:
//    box = the footprint it may write (inclusive), placed = blocks written, skipped = [x, y, z] cells refused (outside
//    box, outside the grid, or not air unless { overwrite: true }). Nothing outside box is written, so ground, sand and
//    floors an earlier part owns are left alone.
//  - Stairs, slabs, doors and lanterns come from the build library's B helpers (they carry the states).
//  - Ordering: writes are air-only, so a helper that must sit inside a wall another part laid needs { overwrite: true }
//    (shopBay in the landings facade part, after stuccoBlock in the shell part).

/**
 * A gapless 45-degree band: every cell with d = x - z in [d0, d1] and s = x + z in [s0, s1], y0..y1, of block mat.
 * Two consecutive d values make a stair-stepped wall with no gaps.
 */
export function diagBand(g, d0, d1, s0, s1, y0, y1, mat, { overwrite = false } = {})

/**
 * One slice of the Pier 59 shed roof at s, over every cell with d = x - z in [-41, -13] (ridge d = -27, e = |d + 27|).
 * Even e: a full deepslate_tiles block at y 25 - e/2. Odd e: the full block at y 25 - (e+1)/2 plus a deepslate_tile_slab
 * (bottom) on top of it. e = 0 also gets the polished_deepslate ridge cap at y 26; e = 14 gets the dark_oak_planks eave
 * fascia at y 17. The verge slices (s 99 and 244) are the barge course: dark_oak in place of the tiles.
 */
export function shedRoofSlice(g, s, { overwrite = false } = {})

/**
 * A double spruce door: a leaf at [x, y, z] and a second leaf one cell along the wall, each lower and upper half.
 * face = the way the doors face (out of the building). Hinges are mirrored so the pair opens outward. All four cells
 * or none: a blocked half leaves the whole pair out.
 */
export function doorPair(g, [x, y, z], face, { overwrite = false } = {})

/**
 * The blue wave arch: a flush panel in the plane x, from z0 to z1 wide and y0 to y1 high. Field light_blue_terracotta;
 * the straight edges and the foot cyan_terracotta; the round top is prismarine_brick_stairs with each full back facing
 * the centre; the two crown cells are a prismarine_bricks keystone.
 */
export function waveArch(g, x, z0, z1, y0, y1, { overwrite = false } = {})

/**
 * A raised pool: a smooth_stone ring on the rectangle rect = [x0, z0, x1, z1] (inclusive), y0..y1, with water inside
 * it at the same levels (the water stops at y1, the rim's top).
 */
export function poolRim(g, [x0, z0, x1, z1], y0, y1, { overwrite = false } = {})

/**
 * A band of light_blue_stained_glass_pane on a face: the plane is z = plane (north/south faces, running along x) or
 * x = plane (east/west faces, running along z), from..to along the face, y0..y1. A warm shroomlight sits one cell
 * inside, behind every 4th pane, on the middle row.
 */
export function ribbon(g, face, plane, from, to, y0, y1, { overwrite = false } = {})

/**
 * The stucco shell of a Waterfront Landings block: the outer ring of the rectangle rect = [x0, z0, x1, z1] (inclusive),
 * from its ground up to roofY. floors = [shop floor y, first upper floor y]; plan.md puts the string course at the
 * first upper floor alone, so only those two are read. Brick base from the ground to floors[1] - 1, where the ground
 * of a column is ground(x, z) (default floors[0]; pass the ground-0 strips' value); cut_sandstone_slab (top) string
 * course at floors[1]; smooth_sandstone above it; cut_sandstone cornice at roofY. The cornice is not pushed 1 cell
 * proud, since that cell would fall outside the footprint.
 */
export function stuccoBlock(g, [x0, z0, x1, z1], roofY, floors, { overwrite = false, ground = () => ...

/**
 * One shop bay on a street face, five cells along the face from pos. plane = the wall's coordinate (x for east/west
 * faces, z for north/south). smooth_quartz piers at both ends, glass y2..4 between them, a spruce_door (y2..3) in the
 * first cell after the left pier, and a shroomlight one cell inside, behind the glass, lighting the shop.
 */
export function shopBay(g, face, plane, pos, { overwrite = false } = {})

/**
 * Lanterns on the given [x, y, z] cells. Each hangs from the block above it when there is one; otherwise it stands on
 * the block below. A cell with neither is skipped.
 */
export function lanternRow(g, cells, { overwrite = false } = {})
```

## The build library (/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs): outline

### build.mjs (library)

```js
// Authoring builds as CODE: design one bay, tile it; mirror for symmetry; protect function with a guard.
// Coordinate bookkeeping is where design time and errors go — write a short generator script with these helpers
// instead of typing hundreds of coordinates.
//
//   import { load, Grid, guard, tile, mirrorX, B, face } from "<plugin>/tools/src/build.mjs"
//   const g = guard(load("in.nbt"))                 // refuses writes into functional cells (see check.mjs)
//   runParts(g, [["shell", shellPart], ["porch", porchPart]], { palette: "palette.json" })  // later parts only add
//   tile(g, { from: 1, step: 4, count: 5, axis: "z" }, (z) => bay(g, z))
//   g.save("out.nbt")

// ---- directions -------------------------------------------------------------------------------------------------
export const DIRS = { north: [0, 0, -1], south: [0, 0, 1], west: [-1, 0, 0], east: [1, 0, 0] };

export const OPPOSITE = { north: "south", south: "north", east: "west", west: "east", up: "down", down: "up" };

export const face = {
  opposite: (f) => ...
  cw: (f) => ...
  ccw: (f) => ...
  mirrorX: (f) => ...
  mirrorZ: (f) => ...
};

// ---- block helpers: return [block, state] pairs for g.set(x, y, z, ...B.stairs(...)) ----------------------------
// Stairs `facing` = the side of the full-height back; a cornice/bracket lip toward the street uses
// facing = the INWARD direction with half: "top".
export const B = {
  stairs: (mat, facing, half = "bottom", shape = "straight") => ...
  slab: (mat, type = "bottom") => ...
  log: (mat, axis = "y") => ...
  wood: (mat, axis = "y") => ...
  pillar: (block, axis = "y") => ...
  trapdoor: (mat, facing, half = "bottom", open = false) => ...
  door: (mat, facing, half = "lower", hinge = "left") => ...
  fence: (mat) => ...
  wall: (mat) => ...
  pane: (block = "glass_pane") => ...
  lantern: (hanging = false) => ...
  chain: (axis = "y", version26 = true) => ...
  wallTorch: (facing) => ...
  block: (name) => ...
  banner: (color, patterns = [], { wall = true, facing = "north", rotation = 0, legacy = false } = {}) => ...
  sign: (wood = "oak", lines = [], { wall = true, facing = "north", rotation = 0, hanging = false, color = "black", glow = false, back = [], dataVersion = 4189 } = {}) => ...
};

// ---- placement helpers ------------------------------------------------------------------------------------------
/** Call fn(pos, i) for count positions from `from`, `step` apart (the bay rhythm). */
export function tile(_g, { from = 0, step, count, to }, fn)

/** Run `paint(set)` twice: as written, and mirrored across x = cx (x' = 2cx - x), flipping east/west facings. */
export function mirrorX(g, cx, paint)

export function mirrorZ(g, cz, paint)

/** Hollow box: walls (and optional floor/ceiling) of a cuboid. */
export function shell(g, a, b, block, { floor = true, ceiling = true, state } = {})

/** Set a box to air (carving). Air is stored, so it clears the cell when the structure is placed. */
export const carve = (g, a, b) => ...

/** Replace only where the current block matches `from` (a name or a predicate). */
export function replace(g, a, b, from, block, state)

/**
 * Wrap a grid so writes into protected cells are refused (counted, never thrown), so a decor script cannot
 * break function. protect: Set of "x,y,z" — default: the grid's own functional cells and the cells that must stay
 * clear around them (check.mjs functionalCells). `g.refused` lists what was blocked; report it.
 */
export function guard(g, protect)

/**
 * Draw blocks from text, the way Litematica stores a schematic (a palette, then one index per cell): one character per
 * block, a legend for the characters. Far fewer tokens than a set() per block, and the layout is visible as written.
 *   layers(g, [x, y, z], { "#": "oak_planks", "b": ["red_bed", { facing: "south", part: "head" }], "c": "chest" }, [
 *     ["#####", "#b c#", "#b  #"],      // y: rows run along +x, successive rows along +z
 *     ["#####", "#   #", "#   #"],      // y + 1 ...
 *   ])
 * A single layer may be passed as one array of rows. Characters not in the legend (space, ".") are left as they are.
 * Writes go through g.set, so runParts' lock and palette report apply. Returns the number of blocks placed.
 */
export function layers(g, [x0, y0, z0], legend, rowsOrLayers)

/**
 * Run a build's parts in order so each part can only ADD to what earlier parts built: a write into a cell an earlier
 * part placed (air included, so no carving) is refused, counted, never thrown, so a later part can't knock holes in
 * a wall. Cells set before runParts (the ground) stay writable: farmland and paths may replace grass. With a palette
 * (palette.json, or its object: { roles: { role: [blocks] }, objects: [blocks] }), every block placed outside it is
 * reported. Prints one line per part, writes the reports to `report` (default parts-report.json; null for none) and
 * returns them.
 * roof: a roof spec (roof.json, as for `mcd roof --spec`) laid right after the FIRST part (the shell), so every later
 * part builds around the finished roof instead of the roof tool clearing the attic, gables and lofts after them. No
 * file yet (the roof part writes it, maybe in another copy at the same time): skipped with a note, never an error.
 * sockets.json in the working directory (or reserve: a layout or path; null for none) reserves the redstone shops'
 * envelopes: every write into one is refused. A part given { carve: true } (the stair joiner) may cut through earlier parts' floors and ceilings for its
 * stairwells: cells with air straight above or below. Walls stay refused.
 *   runParts(g, [["shell", shell.build], ["stairs", stairs.build, { carve: true }], ["garden", garden.build]],
 *     { palette: "palette.json", roof: "roof.json" })
 */
export function runParts(g, list, { palette, roof, reserve, log = console.log, report = "parts-report.json" } = {})

/** Lettering in a band: plaque(g, "LEAGUE HALL", { at, face, width, height, letter?, material?, frame?, style?, relief? }) */
export const plaque = (g, text, o) => ...

/** A bed, both halves: foot at [x,y,z], the head one step toward facing (the pillow end), same colour and facing.
 *  Both cells must be air (a bed never replaces a wall block); the head goes against a solid wall, never a window or
 *  a door. Returns true when placed, false (placing nothing) when a cell is taken. */
export const bed = (g, [x, y, z], facing, color = "red") => ...

/** A straight flight of stairs a player walks up without jumping: from = the first step's cell (standing on the lower
 *  floor), facing = the way you walk up, to = the y of the UPPER FLOOR's own block layer. The last step is set in that
 *  layer, flush with the floor you step out onto, so a storey of h (floor to floor) takes h steps. Clears 2 blocks of
 *  headroom over every step (cutting the floor above where the flight passes) and hangs an upside-down stair under each
 *  step as a stringer. width runs to the right of facing. Returns { steps, landing: [x,y,z] (feet on the upper floor), notes }. */
export const flight = (g, { from: [x, y, z], facing, to, material = "oak", width = 1, stringer = true }) => ...

/** A hearth and its chimney: the fire at the BOTTOM, smoke up a flue, the stack set INTO the wall so the room loses no
 *  space. Give wall = [x, floor level, z], a cell of the outside wall at the hearth's floor level, and into = the side the
 *  room is on: the campfire goes one cell OUTSIDE the wall (an exterior chimney), the wall cell becomes the hearth's
 *  mouth with a lintel over it, and the flue rises outside the wall with the house wall as its room side. (Or give
 *  at = the campfire's cell and open = the side its mouth faces, for an interior chimney set into a partition.)
 *  top = the flue's last course (1-2 over the roof where it leaves it; the mouth is open above). The flue is a 1 x 1
 *  column of air walled on all four sides at every level: the house wall below the roof, and from the roof up the
 *  chimney's own masonry (never the roof's tiles), or with thin: "iron" | "copper" | a wood, an open trapdoor lying
 *  flat against the flue where there is only air beside it (a slim pipe above the roof). Build it after the roof.
 *  It lays its own footing down to the ground and overwrites what is in its cells: call it directly, never through a
 *  helper that writes only into air (that helper refuses the whole stack over one filled cell). */
export const chimney = (g, { wall, into, at, open = "south", top, material = "bricks", thin = null, lintel = true, roofY }) => ...

/** A window shutter: an open trapdoor in the cell in front of the wall (on the face side), lying flat against it.
 *  face: the way the wall looks (north for a north front); the trapdoor's facing is the face, so it lies on the wall. */
export const shutter = (g, [x, y, z], face, wood = "spruce", { height = 1 } = {}) => ...

/** A word in banner letters hung on a board, in reading order for its face: bannerWord(g, "BUTCHER", { center: [14, 10, 4], face: "north" }). */
export const bannerWord = (g, word, o) => ...

/** The sockets' fit-out (glass wall lines and back walls, spawn-proof pit floor, counters): fitSockets(g, layout, { counter, glass }) */
export const fitSockets = (g, layout, o) => ...

/** A clock face on a tower: clock(g, { center, face, radius?: 2-4, dial?, bezel?, hands?, time?: "10:10", out?: 0|1 }) */
export const clock = (g, o) => ...

/** A shop sign: signboard(g, "BAKERY", { at, face, mode: "wall"|"hanging", width?, height?, wood? }) */
export const signboard = (g, text, o) => ...

/** Banners along a row: bunting(g, { from, to, face, colors?, every?, pattern? }) */
export const bunting = (g, o) => ...

/** A profiled pilaster: pilaster(g, { at, face, height, width?, out?, material?, profile?, shoulder? }) */
export const pilaster = (g, o) => ...

/** An opening surround: surround(g, { at, face, width, height, preset?, trim?, keystone?, reveal?, door?, arch? }) */
export const surround = (g, o) => ...

/** Glazing: glazing(g, { at, face, width, height, preset: grid|shopfront|transom|sidelights, frame?, door? }) */
export const glazing = (g, o) => ...

/** A light fitting: fixture(g, { at, face, mount: bracket|arm|top|hang, lamp? }) */
export const fixture = (g, o) => ...

/** A planter: planter(g, { at, face, width, kind: box|ground, depth?, plants? }) */
export const planter = (g, o) => ...
```

## The toolkit reference (references/toolkit.md)

# Toolkit reference

`MCD="node ${CLAUDE_PLUGIN_ROOT}/tools/bin/mcd.mjs"` — pure Node 20+, no install. First use downloads the
Minecraft client jar for the needed version from Mojang (sha1-verified) into `~/.cache/minecraft-design/`, or
uses `$MC_CLIENT_JAR`, the official launcher's or Prism Launcher's local jars. Nothing copyrighted ships here.

## Coordinates and facing (read this once)

- Files: every command reads a structure `.nbt` or a Litematica `.litematic` (all regions, in one box); `g.save()`
  and `mcd convert` write either, by extension. Block-entity data and entities survive both ways.
- Structure-local: `x` east, `y` up, `z` south. `0 ≤ x < size[0]` etc.
- Conventional front for new builds: **north (−z)**, the street at `z < 0`. `mcd render` auto-detects the front
  from exposed windows/doors; override with `--front n|s|e|w`.
- Walking into a building that faces north, you face **south (+z)**; east (+x) is on your **left**.
- `facing` on blocks:
  - **stairs**: the side of the full-height back. A cornice/bracket whose lip points at the street:
    `half: "top"`, `facing` = the direction *into* the wall. A roof slope rising to the north: `facing: "north"`.
  - **trapdoor**: the side it hinges from when open; closed `half: "top"` sits in the top of the cell.
  - **wall torch / wall sign / wall banner**: the direction it *points out* (away from the wall).
  - **repeater / comparator**: `facing` points toward the *input* (signal flows the opposite way).
  - **logs**: `axis: x|y|z`.
- `mcd states <block>` lists every valid property and value for a block in the target version; `mcd blocks
  --grep <re>` lists valid ids (ids change: 26.x renamed `chain` → `iron_chain`); `mcd blocks --check a,b,c` says
  which ids are real and suggests near names for the rest. Use them instead of guessing.
- `mcd walk build.nbt --rooms rooms.json` floods the cells a player can stand in (jump one up with headroom, drop up
  to three, through doors and gates, up ladders, vines, scaffolding and water columns such as a soul-sand water
  elevator) from the entrance and says, per room box, whether it's reached, unreachable, or
  partly blocked by furniture. rooms.json: `{"entrance": [x,y,z], "rooms": [{"name", "box": [x0,y0,z0,x1,y1,z1]}]}`.
- `mcd rooms build.nbt --rooms rooms.json [--only name,...] [--out rooms.png]` shows every room: a dollhouse view
  (everything above the room cut away, from a front corner) and, for rooms 5+ wide both ways, an eye view inside.
- `layers(g, [x, y, z], legend, rows)` (build library) draws blocks from text the way Litematica stores them: a
  legend of characters, one character per block, rows along +x, successive rows along +z, layer by layer. Use it for any
  layout of many different blocks (a furnished room, a facade panel); it costs a fraction of a set() per block.
  `mcd plan build.nbt --rooms rooms.json [--only name]` prints each room's floor as that grid ('#' wall, 'D' doorway,
  'W' window, 'o' already there, '.' free floor) with the origin to pass to layers().
- `mcd room build.nbt --rooms rooms.json --only "<room>"` is a room designer's one check after each rebuild: the walk
  verdict with the floor cells a player can't reach (marked `x` on the floor grid, which shows the furniture as `o`),
  the light levels at the feet, and lantern spots (hanging under the ceiling where there's headroom, else against a
  wall) that would lift the dark and dim cells to 8+. Exits 1 until the room is walkable with no dark cell.
- `mcd light build.nbt --rooms rooms.json [--only name]` (or `--y <feet y>` for a whole floor level) maps block light
  the way the game spreads it (each source at its vanilla level, one less per block, stopped by full blocks): each
  floor cell's level as 0-9/A-F, with min, mean and the DARK (0, mobs spawn) and dim (1-7) counts. Design lighting
  with it: the renderer has no night.

## Commands

| Command | Does |
|---|---|
| `render <f.nbt> [--out s.png] [--front d] [--ground y] [--cut y] [--eye x,y,z --look x,y,z [--label t]]... [--view "name:x,y,z->x,y,z"]... [--tiles dir]` | The look sheet: 3 street views at eye height, 4 elevations, 2 front-corner isos, optional cutaway and interior eye views. `--view` adds a named exterior camera with sun shadows (e.g. `"downstream:28,14.5,40->31,18,22"`, the iconic view of a house over a waterfall). `--tiles` also writes each view as its own PNG (zoom into one with Read). |
| `compare <before> <after> [--out c.png]` | Before \| after sheets side by side, same cameras. |
| `convert <in> <out>` | Structure `.nbt` ↔ Litematica `.litematic`, by extension (schematic version 7 for 1.20.5+, 6 before). Use `.litematic` for builds over 48 blocks a side, which a structure block can't place in one go. |
| `roof <in.nbt> <out.nbt> --style <s> [--pitch p] [--eave e] [--material m] [--ridge r] [--dormers 2:e] [--pediment n] [--tower x,z,w,h,top] [--chimney x,z] [--keep box] [--spec roof.json]` / `roof <in.nbt> --detect` | Re-roof a build by style name: detects the eave and footprint, strips the old roof, builds the new one (see roofs.md). `--detect` only reports what it found. |
| `check <f.nbt> [after.nbt] [--contract c.json] [--site site.json] [--json]` | (A contract file adds to the automatic redstone protection.) Census, walkability, largest blank surfaces (interior and exterior separately); with two files the FUNCTION report: protected cells unchanged, keep-clear cells clear, warnings for new conductive/triggering/feeding neighbours. `--site` adds the landscape checks (see landscaping.md). Exit 1 on any violation. |
| `info <f.nbt>` | Size, DataVersion → version, census, block entities, functional cell count, unknown block ids. |
| `blocks [--grep re]` / `states <block>` | Valid ids / states for the version. |
| `new <build.mjs> [--from in.nbt] [--size x,y,z] [--out out.nbt]` | Scaffold a generator script wired to the build library (with `--from`, writes are guarded). |
| `concept "<subject>" --out c.png [--size s] [--palette p] [--provider codex\|gemini] [--ref img]... [--model m] [--raw]` | A builder's reference sheet (front elevation + 3/4, one scale, no scene). Codex CLI image tool when installed (ChatGPT plan, no key, ~1 min; `--ref` redraws from a given image), else Gemini (`GEMINI_API_KEY`, Nano Banana 2.1 by default). Measured: this prompt shape matters more than the model; 2–3 candidates across providers, picked against the brief, add useful variety. |
| `assets [--version v]` | Pre-fetch the client jar. |

Version: `--version` › `$MCD_VERSION` › the file's DataVersion › latest release.

Render notes: no light engine (light sources show as blocks, not glow); interior eye views skip sun shadows;
block-entity blocks (chests, signs, beds, banners, heads) render as simple textured boxes; entities (item
frames, armour stands) are not drawn. Keep `--look` inside the build for interior views.

## Build library (`tools/src/build.mjs`)

```js
import { load, Grid, guard, tile, mirrorX, mirrorZ, shell, carve, replace, B, face, DIRS } from ".../tools/src/build.mjs";
const g = guard(load("in.nbt"));          // or: new Grid([w, h, d], { dataVersion })
g.set(x, y, z, ...B.stairs("dark_oak", "south", "top"));   // [block, state] helpers: stairs slab log wood trapdoor door fence wall lantern chain wallTorch pane block
g.fill([x0, y0, z0], [x1, y1, z1], "stone_bricks");
tile(g, { from: 1, step: 4, to: 19 }, (z, i) => bay(z, i));  // the bay rhythm
mirrorX(g, cx, (set) => set(x, y, z, block, state));          // symmetric pair, facings mirrored
shell(g, a, b, "spruce_planks", { floor: true, ceiling: false });
carve(g, a, b);                            // stores air (clears the cell on placement)
replace(g, a, b, "spruce_planks", "stone_bricks");
g.save("out.nbt");                          // never overwrite the input
console.log(g.refused);                     // guarded writes that were refused (report them)
```

Shape brushes (also exported from `build.mjs`): curved forms — `dome`, `cylinder`, `minaret`, `arch` (+ `circleCells`,
`ring`, `disc`, `revolve`) — see `shapes-curved.md`; massing — `setbacks`, `gableRoof`, `hipRoof`, `fins`, `parapet`,
`cornice`, `falseFront`, `stepGable` — see `shapes-massing.md`. Each is `fn(g, opts)`, writes through `g.set` (so
`guard()` still protects function), and returns `{cells, refused, bounds}`.

`guard(grid)` refuses writes into the grid's functional cells and their keep-clear cells (or a set you pass);
it never throws — check `g.refused`. `runParts(g, [["shell", shell.build], ["garden", garden.build]], { palette:
"palette.json" })` runs a build's parts in order so each can only add into air: writes into an earlier part's cells
(air included) are refused and reported, the ground laid before it stays writable, and blocks outside the palette
are reported per part. With `roof: "roof.json"` (a `mcd roof --spec` file) it lays the roof right after the first
part, so later parts build around it instead of the roof tool clearing attics and gables after them; no file yet means
the roof is skipped with a note. A part given `{ carve: true }` as a third element (the stair joiner) may cut through
earlier floors and ceilings (cells with air straight above or below), never walls. `mcd reskin in.nbt out.nbt --swap
spruce=dark_oak,red=blue[,bricks=mud_bricks] [--box ...]` swaps materials on a finished build, form for form, states
kept (a wood or dye word swaps every block named with it; a full block id swaps itself and its stairs, slab and wall);
`mcd variant <run> --name n [--swap ...] [--roof '{json}']` does it into `<run>/variants/n/` with a card, re-running
the build's code when the roof changes. `mcd overworld palette.json [--write]` lists (drops) nether and end blocks. The Grid keeps block-entity NBT (sign text, chest contents) and entities and
writes them back unchanged; cells you don't touch round-trip byte-for-byte.

Grow the box with `g.resize([w, h, d], [dx, dy, dz])` (a shift grows toward −); a shift moves every coordinate,
so re-derive any contract coordinates after shifting.

## Banners, signs and other block entities

Banners, signs, chests, beds, bells, mob heads, decorated pots and shulker boxes are entity-rendered in vanilla, and
`mcd render` draws them with their entity models and textures:
- **Banners:** the cloth in its base colour plus every dyed pattern from the block entity.
- **Signs:** their text, glowing text drawn brighter.
- **Other entity-rendered blocks:** a neutral box, listed under `unknownBlocks` as "entity-rendered, approximated".

Author banners and signs with the build helpers. Each returns `[block, state, nbt]` with valid block-entity NBT
that round-trips through save and load:

```js
g.set(x, y, z, ...B.banner("cyan", [["stripe_center", "white"], ["border", "black"]], { facing: "north" }));   // wall banner
g.set(x, y, z, ...B.banner("red", [["cross", "yellow"]], { wall: false, rotation: 8 }));                       // standing, faces north
g.set(x, y, z, ...B.sign("spruce", ["PERMIT", "OFFICE"], { facing: "north", color: "black", glow: false }));
```
- **Banner patterns:** `stripe_center`, `stripe_top`, `stripe_bottom`, `stripe_left`, `stripe_right`,
  `stripe_middle`, `border`, `curly_border`, `cross`, `straight_cross`, `rhombus`, `circle`, `flower`, `globe`,
  `gradient`, `gradient_up`, `half_horizontal`, `half_vertical`, `triangle_top`, `triangle_bottom`, `bricks`,
  `small_stripes`, `diagonal_left`, `diagonal_right` (the full list is under `textures/entity/banner/`).
- **Colours:** the 16 dye names.
- **NBT format:** banners use the 1.20.5+ `patterns` list (`legacy: true` writes the older `Patterns` /
  `Pattern` / `Color` form). Sign text is written as JSON components below data version 4325 (1.21.5) and as plain
  string components from 1.21.5 on (`dataVersion` option; the grid's default is 1.21.4).
- **Standing `rotation`:** 0 faces south, 4 west, 8 north, 12 east. Wall banners and signs hang on the block behind
  them and face `facing`.

## How things sit: `mcd fit`

`$MCD fit build.nbt --rooms rooms.json` (and the FIT lines of `$MCD room`) lists what a player sees wrong from inside,
each with its cell: anything **on a bottom slab** (half a block of air under it), floor decor **floating** over air,
a **broken bed** (one half, or halves that don't match), a **bed in the wall** (set into the wall line), a **bed
against an opening** (its head at a window, a pane or a door, or at nothing), a **bed backwards** (foot against the
wall, head out in the room), **stairs end short** (a walked flight whose top step is a full block under the floor it
leads to: a jump), a **chimney fire** fault (a campfire on top of a stack, shut in a stack with no
firebox mouth, its smoke blocked before the sky, a flue open at the side, or roof tiles walling the flue), a
**chimney in the room** (a hearth or flue in a room's floor space instead of set into the wall), a **floating shutter** (an open trapdoor with air behind it), **bookshelf overuse** (more
than 3 outside a library, study or office) and a **hallway to nowhere** (a hall with one way in, or a long stretch no
walk between its openings passes). With `street` in rooms.json it also walks the **way in**, street to main door (with `entrances`, each building's or
module's, from the street straight in front of it),
and lists a **steep approach** (a stair or a full-block step on it, more than 3 half-steps without a 2-long landing,
1 wide, or no level cell before the door): the approach standard, `$MCD approach` alone. The shop sockets' boxes are skipped.
Helpers that get it right: `bed(g, [x, y, z], facing, color)` (both halves; refuses a cell that isn't air and returns
false), `flight(g, { from, facing, to, material, width })` (a flight whose last step is in the upper floor's own layer,
headroom cut, stringer under it), `chimney(g, { wall: [x, floorY, z], into, top, material, thin })` (an exterior chimney: the fire
just outside the wall, its mouth cut through it, hay in the floor, a 1 x 1 air flue to the sky, masonry through the
roof, thin trapdoors above it, its own footing; call it directly, never through an air-only helper), `shutter(g, [x, y, z], face, wood, { height })`
(flat on the wall), `bannerWord(g, word, { center, face })` (letters in reading order).

## Review card

One image of a build for a glance or a reviewer (prints one JSON object; non-zero exit and a stderr message on error):

- `mcd card <f.nbt> --out card.png [--tiles dir] [--front n] [--reuse]` — render (close-ups, `MCD_TILE_SCALE=2`) and compose the card (street | front-left, front-right | back, plus the roof close-up row; tiles fit 700x700, white). `--reuse` skips the render when `dir/street.png` exists. `{"card","tiles","views":[...]}`
- `mcd card <f.nbt> --out eye.png --tiles dir --layout eye` — the eye-level card: only what a player sees from the ground (street | down-the-street left, right | back), sky trimmed, so a roof weighs what it weighs in the game.

## Inspection

Cheap, deterministic checks to run after every pass, before judging a render by eye. Each has `--json`.

- **Glance and close-ups** — `$MCD render house.nbt --closeups --tiles tiles/` adds a row of tiles to the sheet: a
  *glance* tile (the street view at 320 px: what reads at a glance) and close-ups at ≥ 12 px per block of the
  entrance (door cells), the eave band, each facade's busiest region, and every small feature visible from outside
  (signs, banners, lanterns, pots, finials). Each tile is labelled with what it frames and its px/block; the JSON lists
  the box and side of each. For any other spot:
  `$MCD zoom house.nbt --at 12,3,0 [--radius 3] [--from n|s|e|w] [--out zoom.png]` (default side: the one with a clear
  line of sight, front first; cells far in front of the spot are left out so they cannot hide it).
- **Change report** — `$MCD diff before.nbt after.nbt --png diff.png [--json] [--fail-empty]`: changed cells by kind
  (added / removed / replaced / state) and block, their groups and boxes, the faces they show on, how many are enclosed
  (never show) or interior-only; with `--png`, changed pixels per standard view and a BEFORE | AFTER pair cropped to
  the change for the two views that changed most. `--fail-empty` exits 1 when nothing changed, when no view shows a
  pixel of the change, or when every changed cell is enclosed — a pass that wrote nothing is a failure, not a no-op.
- **Palette** — `$MCD palette house.nbt`: visible blocks classed into roles by where they sit (walls field, trim and
  edges, roof, base, openings, accents, plants), each with its main materials and measured tone (texture average
  from the client jar). Flags, each with a concrete suggestion: roof in the walls' tone; trim invisible on its wall
  (`trim: stone_bricks on stone_bricks walls -> tuff_bricks or smooth_stone`); an outlier block used a handful of
  times that clashes with everything around it; more than 3 accent colour families; dark detail on a dark ground
  (or light on light).
- **Structure** — `$MCD check house.nbt` now always reports STRUCTURE: floating groups (not connected to the
  lowest layer through face or edge contact), unsupported hanging/mounted blocks (a hanging lantern with nothing
  above, a standing banner or lantern on air, a wall sign with nothing behind), orphans (one block sticking out
  sideways or dangling, touching the build on one face), and enclosed cells (a change there never shows; with two
  files, how many changed cells are enclosed). Report only; the exit code is unchanged.
