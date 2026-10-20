# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# South Mall kit: Smithsonian Castle, Arts & Industries, Freer, Hirshhorn

All coordinates are plot-local, in the kit's frame. x runs along the Mall (east = high x). North = low z = the Mall front. y 0 = each plot's lowest ground: the first course sits on the terrain. Ranges are inclusive. Scale 0.42 blocks/m.
Exterior only. Every interior is hollow over a ground floor of bottom slabs (no spawning). The only interior blocks are the glow blocks behind the windows (see Lighting).

## SITE

| plot | building | box (x, z) | ground | front |
|---|---|---|---|---|
| 0 | Smithsonian Castle | x0..56, z0..20, y0..27 | 0 everywhere | north (z low) to the Mall |
| 1 | Arts & Industries | x61..102, z0..41, y0..22 | 1 almost everywhere: lowest course y1; footings go down to y0 where the map says 0 (SE corner, rows z37..41) | north pavilion on the Mall |
| 2 | Freer Gallery | x107..136, z0..25, y0..16 | 0 | north loggia on the Mall |
| 3 | Hirshhorn | x141..169, z0..30, y0..19 | 0 | round; balcony slot faces north |

### Plot 0: Castle masses (body red sandstone; nine towers)

| mass | x | z | walls y | above |
|---|---|---|---|---|
| Main building (3 storeys) | 14..40 | 8..14 | 0..9 (corbel table course y9) | gable roof y10..14, ridge along x at z11 |
| West range | 7..13 | 8..14 | 0..6 (corbel y6) | gable y7..11, ridge z11 |
| East range | 41..47 | 8..14 | 0..6 (corbel y6) | gable y7..11, ridge z11 |
| West wing (chapel) | 1..6 | 7..15 | 0..8 (corbel y8) | gable y9..12, ridge along z at x3..4, gables N and S |
| East wing | 48..54 | 6..16 | 0..8 (corbel y8) | gable y9..13, ridge along z at x51, gables N and S |
| East wing apse bay | 55..56 | 10..12 | 0..5 | slab roof y6 |
| North entrance porch | 25..28 | 1..2 | 0..3 | slab roof y4 |
| Oriel (on North Tower) | 25..28 | 2 | 5..8 (on porch roof) | slab cap y9 |
| Entrance landing | 25..28 | 0 | y0 paving | approach is level: no steps |
| T1 NORTH TOWER (big square, centre) | 23..30 | 3..8 | 0..15 (corbels y14 proud 1 on N/E/W) | parapet y15 proud 1 (x22, x31, z2), merlons y16 alternating; deck of bottom slabs y15 inside |
| T2 FLAG TOWER (slender, TALLEST) | 28..30 | 5..7 (rises out of T1's SE corner) | 16..18 | parapet ring x27..31 z4..8 at y18 (corbelled), merlons y19 alternating, flagpole of end_rod x29 z6 y19..22 |
| T3 East octagonal tower | 39..42 | 7..10, corners chamfered | 0..14 | ornate parapet y15 (red nether brick wall ring), bottom-slab deck y14 inside, no spire (as in the photo) |
| T4 West tower (front pair, inner) | 12..15 | 7..10 | 0..12 | slate spire y13..16, finial y17 |
| T5 West tower (front pair, outer) | 9..11 | 8..10 | 0..12 | slate spire y13..15, finial y16 |
| T6 NW chapel turret | 2..4 | 6..8 | 0..10 | slate cone y11..14, finial y15 |
| T7 East wing NE tower | 52..54 | 6..8 | 0..12 | slate spire y13..16, finial y17 |
| T8 South Tower (octagonal, front of pair) | 25..28 | 13..16, chamfered | 0..11 | slate spire y12..15, finial y16 |
| T9 Campanile (octagonal, rear of pair) | 25..28 | 17..20, chamfered | 0..13, belfry openings y11..12 | slate spire y14..17, finial y18 |
| Pinnacles (buttress-turrets) | 14..15 and 40 | 15 | 0..10 | red nether brick wall y11, lightning rod y12 |

The silhouette from the Mall, west to east: T6 cone 15, wing gable 12, T5/T4 spires 16/17, main ridge 14, T1 battlements 16 with T2 rising to 19 beside it, T3 parapet 15, range ridge 11, T7 spire 17, wing gable 13. The south pair (T8 16, T9 18) shows above the main ridge behind T1.
Note: T1 and T2 are crenellated, as in the concept photo; T2 is still the tallest. The other seven towers carry steep slate spires, as the brief asks.

Castle grounds:
- North lawn: grass, z0..6 except the porch, and z0..7 in front of the ranges. A gravel/smooth-stone path x25..28 runs z0..0 into the landing.
- Lamp posts: polished granite wall, 2 high, lantern on top, at x20, x34, x8, x46 on z3.
- South lawn: grass z15..20 outside T8/T9, with a parterre of 4 flower beds x16..22 and x31..37, z17..19 (podzol + flowers), edged with smooth stone slab.

### Plot 1: Arts & Industries masses (Greek cross in a square, axes x81 / z20)

| mass | x | z | walls y | above |
|---|---|---|---|---|
| Body square (4 quadrants) | 62..100 | 2..39 | 1..6 (band y3, eave band y6) | quadrant hips y7, single course, nearly flat |
| N–S nave | 77..85 | 0..41 (its ends are the N and S entrance gables) | 1..10, clerestory windows y8..9 | gable y11..15, ridge along z at x81 |
| E–W nave | 61..101 | 16..24 (ends are the W and E entrance gables) | 1..10, clerestory y8..9 | gable y11..15, ridge along x at z20 |
| Rotunda (octagon) | 74..88 | 13..27, chamfer 4 | 1..10 | slate skirt ring y11; drum y11..14 |
| Drum (clerestory, octagon) | 76..86 | 15..25, chamfer 3 | 11..14, windows y12..13 | octagonal pyramid y15..18 |
| Lantern | 80..82 | 19..21 | 19..20, glass all round | slab cap y21, finial y22 |
| Entrance towers (8, flanking each nave end) | N: 77..78 and 84..85 at z0..1; S: same x at z40..41; W: x61..62 at z16..17 and z23..24; E: x100..101 at the same z | | 1..15 | 2x2 pyramid cap y16..17, finial y18 |
| Corner pavilions (4) | 61..65 and 97..101 | 0..4 and 37..41 | 1..7 | pyramid y8..10, finial y11 |
| Entrance landings | none needed: each door sill is at y1 = ground | | | level entry |

Note: the footprint map is blank at x97..101, but the real building is symmetric about x81, so the east half mirrors the west. Ground there is taken as 1, as at x102.

### Plot 2: Freer masses (square palazzo round a court)

| mass | x | z | walls y | above |
|---|---|---|---|---|
| Body ring | 107..135 | 2..25 | 0..4, cornice y5 proud 1 all round (outer and court faces) | low hip y6..7 over the ring (outer and inner hips) |
| Court (open) | 117..125 | 11..18 | — | open to the sky |
| Loggia (centre of north front) | 115..127 | 0..2 | 0..4, cornice y5 | low hip y6 (slab course) |
| Front terrace | 112..114 and 128..129 | 0..1 | y0 smooth stone paving, level with the loggia floor | |
| Court fountain | 120..122 | 14..15 | basin: smooth stone slab rim ring x119..123 z13..16 at y0; water x120..122 z14..15 at y0 | |
| Court trees (4) | (118,12) (124,12) (118,17) (124,17) | | oak log y0..2 | persistent oak leaves y3..4, crown radius 1 (stays under the cornice) |
| Court paving | rest of the court | | y0 smooth stone, with grass squares | |

### Plot 3: Hirshhorn masses (raised hollow drum), centre (155, 15)

| mass | geometry | y |
|---|---|---|
| Drum | ring, outer radius 14.5 (the footprint circle), inner radius 7.5 (the court hole, x148..162 at z15) | 3..9 solid ring; flat roof deck y10 of bottom smooth stone slabs |
| Coping | outermost and innermost ring cells | y10 smooth stone (full block), so the deck reads as a parapet line |
| Underside | — | y3 is the soffit; y0..2 open under the whole drum (the plaza runs through) |
| 4 curved piers | arcs of the ring between radius 9 and 12, centred on the four diagonals (NE, NW, SE, SW), each spanning ±20° (about 7 cells long, 3 thick) | 0..2 (they carry the drum) |
| Court fountain | round basin centred (155,15): rim radius 3 of smooth stone slab at y0, water inside radius 2.5 at y0 | 0 |
| Plaza | the whole plot outside the piers and basin: smooth stone paving at y0 under and round the drum; light grey concrete in rings at radius 16 (corners) | 0 |
| Plaza low wall | along the plot edges x141, x169, z0, z30, where outside the circle: light grey concrete 1 high with smooth stone slab coping; gaps at x153..157 (N, S) and z13..17 (W, E) | 0..1 |
| Sculptures | polished_blackstone and basalt, 1x1 or 2x1, at (143,2) 3 high, (167,2) 2 high, (143,28) 2 high, (166,28) 3 high | 0..2 |

## ROOFS

| roof | form | pitch / height | material | how built |
|---|---|---|---|---|
| Castle main building | gable, ridge along x at z11, overhang 1 (eaves at z7 and z15 over the corbel table) | 1:1, y10..14 | dark-slate palette (deepslate_tiles, deepslate_tile_stairs, deepslate_tile_slab ridge) | `$MCD roof` style gable with ridgeAxis x; the gable ends die into T4 and T3, which are in `keep` |
| Castle ranges | same as the main building, lower | y7..11 | dark-slate | gable, ridgeAxis x; die into the towers and wings |
| Castle wings | gable, ridge along z, verges on the N and S gables, overhang 1 | 1:1; west y9..12, east y9..13 | dark-slate, verge deepslate_tile_stairs | gable, ridgeAxis z; gable triangles in body red_terracotta (wall's job, in `keep`) |
| Castle spires T4, T5, T7, T8, T9 | steep pyramid, a finial on top | `tower-cap`, material deepslate_tiles, capped at the heights above (maxHeight 4; T5 3) | deepslate tiles; finial lightning_rod | preset `tower-cap` per tower rect. T8 and T9 are octagons: give the chamfered rect |
| Castle T6 | cone | `tower-cap`, maxHeight 4 | deepslate tiles | preset |
| Castle T1, T2, T3 | battlements, flat deck | — | red nether brick parapet and merlons over a bottom-slab deck | BY HAND (no roof tool) |
| Castle porch, oriel, apse | flat slab caps | y4, y9, y6 | deepslate_tile_slab | by hand |
| A&I naves (both) | gable, ridge on the axis, the entrance gables to the four sides, overhang 1 with verge | 1:1, y11..15 | custom grey slate: stone_brick_stairs/slab, mixed 1 in 4 with andesite_stairs | `$MCD roof` gable, a cross plan (two rects), valleys at the rotunda. The rotunda is in `keep` |
| A&I quadrants | hip, one course (stairs at the eaves, slab top) | y7 | the same grey slate | roof tool, 4 rects, style hip, maxHeight 1 |
| A&I rotunda | slate skirt ring y11, octagonal pyramid on the drum y15..18 | shallow | the same grey slate | skirt by hand; pyramid via style pyramid (or cone) on the drum rect, maxHeight 4; lantern by hand |
| A&I towers and corner pavilions | small pyramid caps | 2x2: y16..17; 5x5: y8..10 | grey slate; finial lightning_rod | `tower-cap` / pyramid |
| Freer | low hip round the court (outer hips and court-side hips), overhang 0 (the cornice is the shadow line) | 0.5 (half steps: stair, slab), y6..7 | andesite_stairs / andesite_slab / polished_andesite top | roof tool, style hip, footprint = the ring (court in `keep`) |
| Hirshhorn | flat deck | y10 | smooth_stone_slab (bottom) with smooth stone coping | by hand |

## FACADES

### Castle (north face is the hero; the south face is similar and plainer)
- **Base:** plinth course y0, red_nether_bricks, flush.
- **Body:** red_terracotta, with granite as roughly 1 in 12 blocks, set in short horizontal runs (weathered ashlar), never as noise.
- **String course:** at y4 on the main building, ranges and wings: polished_granite_slab, top half, proud 1.
- **Corbel table:** at the eave course (main y9, ranges y6, wings y8): red_nether_brick_stairs upside down, proud 1, on every long face, under the roof eave. The same corbels at y14 on T1 (N, E, W) and y17 on T2 carry the proud parapets.
- **Quoins:** polished_granite at every main-building, wing and tower corner, alternating 2 high and 1 high.
- **Window hoods:** polished_granite_stairs upside down, one over each tall window, read as the round arch.
- **Battlements:** on T1 and T2, red_nether_bricks parapet, merlons in red_nether_brick_wall at every other cell. T3's parapet is a red_nether_brick_wall ring with polished granite corner posts.
- **Tower bands:** a polished_granite slab course one row below each spire's eave, proud 1.
- **North Tower front (z3):** arched door; the oriel above the porch (red_terracotta, corbelled out on upside-down red_nether_brick_stairs at y4); a paired arched window y10..12; the corbelled parapet.
- **Porch:** round arch, red_terracotta. The arch at y3 is an upside-down polished_granite_stairs pair (x26 facing east, x27 facing west) over the opening.

### Arts & Industries (polychrome)
- **Plinth:** y1, polished_andesite.
- **Body:** bricks.
- **Bands:** a yellow_terracotta band at y3 and y6 on every face. On the nave walls and gables, a 2-course light_blue_terracotta band at y10 (under the eave), and a red_terracotta course at y8 under the clerestory sills.
- **Gables:** each entrance gable triangle (y11..15) is bricks with a diamond of yellow_terracotta and light_blue_terracotta round a 1x1 oculus at y13. The verge is stone_brick_stairs.
- **Arches:** orange_terracotta round every arch (big window and doors), as voussoirs.
- **Trim:** quoins at the towers and pavilion corners in alternating yellow_terracotta and bricks. Tower tops get a light_blue_terracotta band at y14.

### Freer
- **Base:** smooth_stone plinth y0.
- **Body:** white_terracotta (pink-grey granite), y1..4.
- **Cornice:** y5, proud 1, smooth_stone_slab (top) on polished_diorite. It runs all round, outer and court faces.
- **Window trim:** polished_diorite sills and lintels round the small square windows, flush.
- **Loggia:** three round arches. Piers polished_diorite; arches upside-down polished_diorite_stairs at y3 on both sides of each opening; spandrels white_terracotta; a smooth stone frieze at y4.

### Hirshhorn
- **Drum:** precast panels in vertical strips 2 wide: white_terracotta (≈70%), smooth_sandstone (≈15%), light_gray_concrete (≈15%), alternating by strip, so it reads as panel joints, not noise.
- **Outer face:** blank except the north balcony slot.
- **Inner court face:** blank y3..7; the continuous window band at y8, black glass set back 1 from the inner face (a dark recessed balcony line); y9 solid; coping y10.
- **Piers:** white_terracotta with light_gray_concrete top course, curved.

## MATERIALS

| role | block |
|---|---|
| Castle body | red_terracotta (granite sparing) |
| Castle trim (quoins, string course, hoods, sills) | polished_granite, polished_granite_stairs, polished_granite_slab |
| Castle accent (plinth, corbels, parapets, merlons) | red_nether_bricks, red_nether_brick_stairs, red_nether_brick_wall |
| Castle roofs, spires | deepslate_tiles, deepslate_tile_stairs, deepslate_tile_slab |
| Castle finials | lightning_rod; flagpole end_rod |
| Castle glass | gray_stained_glass_pane |
| A&I body | bricks |
| A&I bands | yellow_terracotta, light_blue_terracotta, red_terracotta, orange_terracotta (arches) |
| A&I plinth | polished_andesite |
| A&I roofs | stone_brick_stairs, stone_brick_slab, andesite_stairs (1 in 4), stone_bricks |
| A&I glass | glass_pane (clerestory, lantern), gray_stained_glass_pane (big arched windows) |
| Freer body | white_terracotta |
| Freer trim | polished_diorite (+ stairs), smooth_stone, smooth_stone_slab |
| Freer roof | andesite_stairs, andesite_slab, polished_andesite |
| Freer glass | gray_stained_glass_pane |
| Hirshhorn body | white_terracotta, smooth_sandstone, light_gray_concrete |
| Hirshhorn coping, deck, plaza | smooth_stone, smooth_stone_slab |
| Hirshhorn glass | black_stained_glass_pane (the balcony bands) |
| Sculptures | polished_blackstone, basalt |
| Ground | grass_block (lawns), gravel / smooth_stone (paths), podzol (beds), water |
| Light | shroomlight (behind glass, warm), lantern, ochre_froglight (soffits, uplights) |

All checked with `mcd blocks --check`. All exist in 1.21.1.

## OPENINGS

Glass sits in the wall plane; walls are 1 thick. The shell leaves every opening below as air.

### Castle

| face | where | size |
|---|---|---|
| Main N (z8) | x17, 19, 21 and x32, 34, 36 | upper tall y5..8 (1x4); lower y1..2 (1x2) |
| Main S (z14) | x17, 19, 21, 23 and x30, 32, 34, 36, 38 | the same two rows |
| Range N/S (z8, z14) | W: x7; E: x43, 45, 47 | y1..2 and y4..5 |
| West wing W face (x1) | z9, z11, z13 | chapel windows y2..6 (1x5) |
| West wing N gable (z7) | x3..4 | y2..6 (2x5); oculus x3..4 y10 |
| West wing S gable (z15) | x3..4 | y2..5 |
| East wing N gable (z6) | x49..50 (T7 is at x52..54) | y2..6 |
| East wing E face (x54) | z9, z13 | y1..2 and y4..6 |
| Apse (x56 and z10/z12 faces) | x56 z11 | y2..4 |
| T1 door (z3) | x26..27 | y0..2; arch stairs over at y3 |
| Porch front (z1) | x26..27 | y0..2 open, no door |
| Oriel (z2) | x26, x27 | y5..7 (paired lights) |
| T1 front upper (z3) | x26..27 | y10..12 |
| T1 sides (x23, x30) | z5 | slits y6..7 and y11..12 |
| T2 (x30 face and z5 face) | x29 / z6 | slit y16..17 |
| T3 (z7 and x42 faces) | middle cell | slits y4..5, y8..9, y11..12 |
| T4, T5, T7 (north face) | centre cell | slits y5..6, y9..10 |
| T6 (north face z6) | x3 | slit y4..5, y8..9 |
| T8 (east/west/south faces) | middle | slit y5..6, y9..10 |
| T9 belfry (all 4 faces) | middle 2 cells | y11..12 open; louvres of red_nether_brick_wall at y11 |

### Arts & Industries

| face | where | size |
|---|---|---|
| N entrance gable (z0) | big arched window x79..83 | y5..9, top corners y9 arch stairs (orange terracotta voussoirs) |
| | door x80..82 | y1..3 |
| S, W, E entrance gables | the same, mirrored (S z41 x79..83; W x61 z18..22; E x101 z18..22) | the same |
| Body N/S faces (z2, z39) | x64, 67, 70, 73 and x89, 92, 95, 98 | arched y2..4 |
| Body W/E faces (x62, x100) | z6, 9, 12 and z28, 31, 34 | arched y2..4 |
| Nave clerestories (long sides above the quadrant roofs) | every 2nd cell, x63..75 / x87..99 on the E–W nave, z3..12 / z28..38 on the N–S nave | y8..9 |
| Drum | every 2nd cell round it | y12..13 |
| Corner pavilions (outer faces) | centre cell | y2..5 |
| Towers (outer face) | centre | slit y9..11 |

### Freer

| face | where | size |
|---|---|---|
| North (z2) | x109, 111, 113 and x129, 131, 133 | 1x1 at y1 and y3 |
| Loggia arches (z0) | x116..118, x120..122, x124..126 | y0..3; arch corner stairs at y3 |
| Loggia porch | x116..126, z1 | y0..3 air (a covered walk) |
| Main door (z2, behind the loggia) | x120..122 | y0..2, glass doors (glass panes) |
| East, west, south faces | every 3rd cell, starting 2 from each corner | 1x1 at y1 and y3 |
| Court faces | every 2nd cell | 1x1 at y1; y3 pairs |

### Hirshhorn

| face | where | size |
|---|---|---|
| Inner court band | every cell of the inner ring, recessed 1 into the ring | y8, 1 high, continuous |
| North balcony slot | outer ring x150..160, where it faces north (z1..3) | y8, continuous, glass recessed 1 |
| Ground level | open under the drum, y0..2, except at the piers | |

## RESERVED (left empty by the shell; later parts fill them)

| what | cells |
|---|---|
| Castle window glow | one cell inside each window, at the window's centre height: shroomlight |
| Castle flagpole | x29 z6 y19..22 |
| Castle spires and finials | every cell above each tower shaft top, within the tower rect |
| Castle merlons and parapets | T1 ring at y15..16 (x22..31, z2..8); T2 ring at y18..19 (x27..31, z4..8) |
| Castle lamps | lamp posts x8, 20, 34, 46 at z3; a lantern each side of the porch at (24,y2,z1) and (29,y2,z1), on granite wall brackets |
| Castle uplights | ochre_froglight flush at y0, two cells out from every north and south wall, every 6 cells (lawn strip), warm floodlight at the base |
| A&I glow | a shroomlight behind each big arched window and every 3rd body window; the lantern box x80..82 z19..21 y19..20 holds a shroomlight core at (81,y19,20) |
| A&I lamps | a lantern each side of each entrance door, at y3 on the gable face |
| Freer fountain and trees | as listed under SITE |
| Freer lights | a lantern hanging in each loggia bay, from y4 at z1 (x117, 121, 125); lamps in the court corners (granite wall post + lantern) |
| Hirshhorn soffit lights | ochre_froglight set in the soffit y3, every 4 cells on rings of radius 9 and 12 |
| Hirshhorn fountain | basin as listed |
| Hirshhorn plaza lamps | lantern posts every 8 cells along the plaza wall; uplights at the piers' feet |
| Hirshhorn deck | lanterns along the deck, every 6 cells (the deck slabs are spawn-proof anyway) |

## FLOORS (interior volumes; exterior-only build)

| building | floor levels y | volume |
|---|---|---|
| Castle main building | 0, 3, 6 (glow blocks only, no floors needed) | x15..39, z9..13, y0..9 |
| Castle ranges | 0, 3 | x7..13 / x41..47, z9..13, y0..6 |
| Castle wings | 0, 4 | x2..5 z8..14; x49..53 z7..15; y0..8 |
| Castle towers | 0, then the deck at the top shaft course | interiors hollow |
| A&I | ground y1 (bottom slab floor), gallery y5 in the naves | naves y1..10, rotunda y1..14 |
| Freer | 0 and 2.5 (two low storeys; glow only) | ring y0..4 |
| Hirshhorn drum | 3, 5.5, 8 (galleries); the soffit is the y3 course | ring y4..9 |

## LIGHTING

Every lawn, plaza and court cell lies within 7 of a lamp, an uplight or a lit window. Roofs are stairs and slabs, and the decks are bottom slabs, so nothing spawns on them. At dusk the walls glow from below with warm uplights, the windows glow from behind with shroomlight, and the towers stand dark against the sky.

---
# DESIGNER SECTIONS (below the architect's form)

## PALETTE
Architect's MATERIALS kept exactly. Shape variants and extras (all checked with `$MCD blocks --check`, all known):
- Castle body: red_terracotta. Trim: polished_granite, polished_granite_stairs, polished_granite_slab. Accent: red_nether_bricks, red_nether_brick_stairs, red_nether_brick_slab, red_nether_brick_wall. Roofs: deepslate_tiles, deepslate_tile_stairs, deepslate_tile_slab. Finials: lightning_rod; flagpole end_rod. Glass: gray_stained_glass_pane. (No polished_granite_wall exists: lamp posts use red_nether_brick_wall.)
- A&I: bricks, brick_stairs (voussoir fillers), yellow_terracotta, light_blue_terracotta, red_terracotta, orange_terracotta, polished_andesite, stone_bricks, stone_brick_stairs, stone_brick_slab, andesite_stairs, glass_pane, gray_stained_glass_pane.
- Freer: white_terracotta, polished_diorite, polished_diorite_stairs, polished_diorite_slab, smooth_stone, smooth_stone_slab, polished_andesite, andesite_stairs, andesite_slab, gray_stained_glass_pane.
- Hirshhorn: white_terracotta, smooth_sandstone, light_gray_concrete, smooth_stone, smooth_stone_slab, black_stained_glass_pane, polished_blackstone, basalt.
- Ground and plants: grass_block, gravel, podzol, water, oak_log (axis y), oak_leaves (persistent true), poppy, azure_bluet, dandelion.
- Light: shroomlight (behind glass), lantern (hanging true/false by case), ochre_froglight (uplights, soffits), no torches.

## VOCABULARY
Every helper takes plot-local coordinates and writes only inside its plot; openings are air until a glazing helper fills them.
- ashlarWall(box, face): red_terracotta (Castle) / bricks (A&I) / white_terracotta (Freer) wall 1 thick; base course y0 plinth block; in Castle, granite 1 in 12 in horizontal runs of 2-3, never noise.
- stringCourse(box, y, material): slab course (top half) proud 1 all round faces.
- corbelTable(box, y): upside-down red_nether_brick_stairs, facing outward, proud 1 on every long face at y.
- quoins(x,z, y0,y1): polished_granite alternating 2 high / 1 high up a corner column.
- roundArch(x, y, z, width, face): opening of width cells, at its top corners upside-down stairs (polished_granite_stairs castle; polished_diorite_stairs Freer; orange_terracotta stairs A&I) facing inward from each side, keystone course above.
- archedWindow(x, y, z, face, h): h-cell air opening, glass pane (state-connected), sill slab (top) below, upside-down hood stairs on the top, glowCell one cell behind its centre.
- glowCell(x, y, z): shroomlight set one cell inside the wall plane at window centre height (A&I big arches, every 3rd body window).
- slitWindow(x, y, z, face, h): 1 x h air strip with gray_stained_glass_pane.
- gableEnd(box, y0, y1, material): triangle infill of the gable wall in body material, leaving the roof tool's verge outside.
- slateRoof(spec): roof.json for `$MCD roof` (gable / hip / pyramid / tower-cap), deepslate_tile_* (Castle), stone_brick_* + 1 in 4 andesite_stairs (A&I), andesite_* (Freer); overhang and verge as in ROOFS; `keep` lists towers.
- slateSpire(rect, y, height, finial): steep stair-stepped pyramid or cone ring (stairs on the 4 sides, corner stairs shaped, slabs at the top), granite slab band one row under the eave, lightning_rod finial on top.
- octoTower(x0,z0,x1,z1, yTop, chamfer): square footprint with 1-cell chamfered corners, walls ashlar, slits per OPENINGS.
- battlements(rect, y, style): parapet of red_nether_bricks course at y with red_nether_brick_wall merlons at every other cell on y+1, corbel table proud 1 underneath; "ring" style = wall ring with polished_granite corner posts (T3).
- flagpole(x,y,z,h): end_rod column.
- oriel(x0,x1,z,y0,y1): corbelled red_terracotta box with paired lights and slab cap.
- lampPost(x,y,z): 2 red_nether_brick_wall (or polished_blackstone for Hirshhorn) topped by a standing lantern; lampBracket: wall block with lantern hung at side of door.
- uplight(x,z): ochre_froglight flush at y0 in the lawn strip.
- parterre(x0,z0,x1,z1): podzol bed with flowers (poppy, azure_bluet, dandelion), smooth_stone_slab edge.
- polyBand(box, y, material, thickness): terracotta band course flush.
- gableDiamond(cx, y, cz, face): bricks triangle with a yellow_terracotta diamond ringed by light_blue_terracotta round a 1x1 air oculus (glass_pane).
- bigArch(x0,x1,y0,y1,z,face): arched window x79..83 style: gray glass panes, orange_terracotta voussoir stairs at top corners, door below x80..82.
- clerestory(row): glass_pane windows every 2nd cell at y8..9 and y12..13.
- octoRing(cx,cz, r, chamfer, y0, y1): octagonal wall ring.
- lanternCap(x,y,z): 3x3 glass box with shroomlight core, slab cap, lightning_rod.
- cornice(box, y): polished_diorite course with smooth_stone_slab (top) proud 1.
- loggia(x0,x1,z): three arches with diorite piers, smooth_stone frieze, hanging lanterns.
- smallWindow(x,y,z): 1x1 glass pane with polished_diorite sill and lintel.
- fountain(cx,cz,r,y) / roundFountain: smooth_stone_slab rim and water source cells, water at y0 inside the rim.
- courtTree(x,z): oak_log y0..2 axis y, persistent oak_leaves crown radius 1 y3..4.
- drumRing(cx,cz,rOut,rIn,y0,y1): ring by cell-centre distance; precastStrip(i): columns in 2-wide strips picking white_terracotta/smooth_sandstone/light_gray_concrete by index (about 70/15/15).
- curvedPier(cx,cz,r0,r1,angle,span): arc cells 3 thick, white_terracotta with light_gray_concrete top.
- soffitLight(r): ochre_froglight in the y3 soffit every 4 cells along the radius ring.
- balconyBand(r,y): black_stained_glass_pane ring at y8 recessed 1 from the court face; same for the north slot.
- sculpture(x,z,h): polished_blackstone or basalt 1x1/2x1 column.

## ROOMS
Exterior-only kit: every interior is hollow over a ground floor of bottom slabs (nothing spawns on slabs). The only interior blocks are shroomlight glow cells behind windows. No room is furnished and there are no interior designers; `rooms` is empty. Interior volumes per the architect's FLOORS table stand as air.
Way in (all level, no steps): Castle porch (26..27, y0, z0..2); A&I gable doors x80..82 at y1 level with the ground; Freer loggia x120..122; Hirshhorn open under-drum plaza.
Stairs: none.

## PARTS
1. P1 castle-shell (parts/castle-shell.mjs): all Castle masses, tower shafts T1..T9, openings, quoins, string courses, corbels, porch/oriel, glazing.
2. P2 castle-roofs-lights (parts/castle-roofs.mjs): roof.json gables, spires, battlements, flagpole, finials, glow cells, lamps, uplights, lawns, parterre.
3. P3 ai-shell (parts/ai-shell.mjs): Greek cross body, naves, rotunda, drum, towers, pavilions, bands, gables, big arches, doors, windows.
4. P4 ai-roofs-lights (parts/ai-roofs.mjs): roofs, spires, lantern, verges, glow cells, lamps, grounds.
5. P5 freer (parts/freer.mjs): whole Freer including court, cornice, loggia, roof, lights.
6. P6 hirshhorn (parts/hirshhorn.mjs): whole Hirshhorn: drum, piers, band, fountain, plaza, lights.

## Checklist
- [ ] P1  - [ ] P2  - [ ] P3  - [ ] P4  - [ ] P5  - [ ] P6

## Notes for workers
- Never touch the architect's coordinates. Keep every opening air in the shell; glaze in the same part.
- North is low z, east is high x. A&I ground is y1 (footings down to y0 at the SE corner).
- No polished_granite_wall: use red_nether_brick_wall. Only 1.21.1 blocks.
- Light everything: no dark cell; lanterns hung from a block or standing on a block.
- Silhouette over detail: tower heights are the Castle's signature (T2 tallest, y22 top of flagpole).
- Entrances (kit frame): Castle (26,0,1) from street (26,0,0); A&I (81,1,-1) from (81,1,-2); Freer (121,0,1) from (121,0,0); Hirshhorn (155,0,3) from (155,0,0).
```

### elements.md

```markdown
# REQUIRED ELEMENTS (checklist)

Coordinates are the kit's plot-local frame from plan.md. "V:" = vocabulary helper (plan.md VOCABULARY). Parts: P1 castle-shell, P2 castle-roofs-lights, P3 ai-shell, P4 ai-roofs-lights, P5 freer, P6 hirshhorn.

## Plot 0: Castle (P1 masonry, P2 roofs/lights/grounds)
- [ ] Main building x14..40 z8..14 y0..9, red_terracotta body, plinth y0 red_nether_bricks, 3 storeys (string courses y4 granite slab top, proud 1). P1. V: ashlarWall, stringCourse
- [ ] Corbel table at eave y9 (ranges y6, wings y8): upside-down red_nether_brick_stairs proud 1 on every long face. P1. V: corbelTable
- [ ] Tall round-arched windows rows (Openings table): gray_stained_glass_pane 1x4 upper y5..8, 1x2 lower y1..2, polished_granite_stairs upside-down hood above each, granite slab sill; shroomlight glow one cell behind centre. P1 cuts + glazes, P2 glow. V: archedWindow, glowCell
- [ ] West range x7..13, East range x41..47 (y0..6). P1.
- [ ] West chapel wing x1..6 z7..15: chapel windows x1 z9,11,13 y2..6 (1x5), N gable pair x3..4 y2..6 + oculus y10, gables N/S, ridge along z. P1 walls+gable triangles (red_terracotta), P2 roof. V: archedWindow, gableEnd
- [ ] East wing x48..54 z6..16 + apse bay x55..56 z10..12 (slab roof y6). P1/P2.
- [ ] North entrance porch x25..28 z1..2 y0..3: round arch = upside-down polished_granite_stairs x26 facing east, x27 facing west at y3 over a 2-wide opening x26..27 y0..2; slab roof y4 (deepslate_tile_slab); lanterns at (24,2,1) and (29,2,1) on granite brackets. P1 shell, P2 lanterns. V: roundArch, lampBracket
- [ ] Oriel x25..28 z2 y5..8 on corbels (upside-down red_nether_brick_stairs y4), paired lights x26,x27 y5..7, slab cap y9. P1. V: oriel
- [ ] T1 North Tower x23..30 z3..8 y0..15: corbels y14 proud 1 N/E/W, deck of bottom slabs y15, parapet ring y15 (x22..31, z2) with alternating merlons y16 in red_nether_brick_wall; door x26..27 z3 y0..2; paired window y10..12; side slits. P1 shaft, P2 battlements. V: battlements, slitWindow
- [ ] T2 FLAG TOWER x28..30 z5..7 y16..18 (the tallest), parapet ring x27..31 z4..8 at y18 corbelled, merlons y19, end_rod flagpole x29 z6 y19..22; slit y16..17. P2. V: battlements, flagpole
- [ ] T3 East octagonal tower x39..42 z7..10, corners chamfered, y0..14, red_nether_brick_wall ornate parapet y15 with polished_granite corner posts, slits. P1 shaft, P2 parapet. V: octoTower, battlements
- [ ] T4 x12..15 z7..10 and T5 x9..11 z8..10 front pair: shafts y0..12 (P1); slate spires + finials (P2). V: slateSpire, slitWindow
- [ ] T6 NW chapel turret x2..4 z6..8 y0..10 + slate cone y11..14 + finial y15. V: slateSpire (cone)
- [ ] T7 East wing NE tower x52..54 z6..8 y0..12, spire y13..16, finial y17.
- [ ] T8 South Tower (octagonal) x25..28 z13..16 y0..11, spire y12..15, finial y16. V: octoTower
- [ ] T9 Campanile (octagonal) x25..28 z17..20 y0..13, belfry openings y11..12 with red_nether_brick_wall louvres at y11 (air above), spire y14..17, finial y18. V: octoTower
- [ ] Every spire: steep deepslate_tile pyramid/cone (stairs ring stepping in 1 per row, slab top) with lightning_rod finial; granite slab band one row under eave. P2. V: slateSpire
- [ ] Quoins: polished_granite at every corner, alternating 2 and 1 high. P1. V: quoins
- [ ] Gable roofs, dark slate: main y10..14 ridge x z11 (overhang 1); ranges y7..11; wings y7/9..12/13 ridge z with verge. P2 via `$MCD roof`. V: slateRoof
- [ ] Pinnacle buttress-turrets x14..15 and x40 z15 y0..10: red_nether_brick_wall y11, lightning_rod y12. P1/P2.
- [ ] Lighting: lamp posts x8,20,34,46 z3 (red_nether_brick_wall post 2 high + lantern; polished_granite_wall does not exist), ochre_froglight flush uplights every 6 cells two out from N and S walls, shroomlight glow behind every window. P2. V: lampPost, uplight
- [ ] Grounds: grass z0..6 lawn, smooth_stone/gravel path x25..28 z0 into the level landing, south lawn z15..20 and 4 parterre beds x16..22 and x31..37 z17..19 (podzol + poppy/azure_bluet/dandelion edged with smooth_stone_slab), two oak trees optional. P2. V: parterre

## Plot 1: Arts & Industries (P3 shell/facade, P4 roofs/lantern/lights)
- [ ] Brick body x62..100 z2..39 y1..6, polished_andesite plinth y1, yellow_terracotta bands y3 and y6 on every face. P3. V: polyBand
- [ ] N-S nave x77..85 z0..41 and E-W nave x61..101 z16..24, walls y1..10, clerestory windows y8..9 every 2nd cell (glass_pane), red_terracotta course y8, 2-course light_blue_terracotta band y10. P3. V: polyBand, clerestory
- [ ] Four entrance gables (N z0, S z41, W x61, E x101): triangle y11..15 in bricks, diamond of yellow + light_blue terracotta round a 1x1 oculus at y13, stone_brick_stairs verge; big arched window x79..83 y5..9 (gray_stained_glass_pane) framed by orange_terracotta voussoir stairs; door x80..82 y1..3 (glass_pane doors), lanterns each side at y3. P3 shell, P4 verge. V: gableDiamond, bigArch
- [ ] Central rotunda octagon x74..88 z13..27 chamfer 4 y1..10 + slate skirt ring y11; clerestory drum x76..86 z15..25 chamfer 3 y11..14, windows y12..13; octagonal pyramid y15..18. P3 walls, P4 roofs. V: octoRing, slateRoof
- [ ] Lantern x80..82 z19..21 y19..20 glass all round, shroomlight core (81,19,20), slab cap y21, lightning_rod y22. P4. V: lanternCap
- [ ] 8 entrance towers (2x2, y1..15, slit y9..11, light_blue band y14, pyramid cap y16..17, finial y18) and 4 corner pavilions 5x5 y1..7 with pyramid y8..10 + finial y11, quoins in alternating yellow_terracotta/bricks. P3 shafts, P4 caps. V: slateSpire, quoins
- [ ] Body windows arched y2..4 at listed x/z; nave roofs gable y11..15 grey slate (stone_brick_stairs, 1 in 4 andesite_stairs), quadrant hips y7 one course. P3/P4. V: archedWindow, slateRoof
- [ ] Glow: shroomlight behind each big arch and every 3rd body window.

## Plot 2: Freer (P5 all)
- [ ] Ring x107..135 z2..25 y0..4 white_terracotta, smooth_stone plinth y0, court x117..125 z11..18 open. V: ashlarWall
- [ ] Cornice y5 proud 1: smooth_stone_slab top on polished_diorite, outer and court faces. V: cornice
- [ ] Loggia x115..127 z0..2: three round arches x116..118, 120..122, 124..126 y0..3, polished_diorite piers, upside-down polished_diorite_stairs at y3 on both sides of each opening, smooth_stone frieze y4, slab hip y6; main door x120..122 z2 glass panes; lanterns hanging at x117,121,125 y4 z1. V: roundArch, loggia
- [ ] Small square windows 1x1 y1 and y3 with polished_diorite sill/lintel; low hip roof andesite stairs/slab, polished_andesite top. V: smallWindow, slateRoof
- [ ] Court: fountain rim x119..123 z13..16 y0, water x120..122 z14..15; 4 oak trees (log y0..2, persistent leaves y3..4) at (118,12) (124,12) (118,17) (124,17); smooth_stone paving + grass squares; corner lamps. V: fountain, courtTree
- [ ] Front terrace x112..114, x128..129 z0..1.

## Plot 3: Hirshhorn (P6 all)
- [ ] Drum ring centre (155,15) outer r14.5 inner r7.5, solid y3..9, 2-wide strips white_terracotta 70% / smooth_sandstone 15% / light_gray_concrete 15%; roof deck y10 bottom smooth_stone_slab, coping smooth_stone full block on outermost and innermost rings. V: drumRing, precastStrip
- [ ] Four curved piers y0..2, arcs radius 9..12 at NE/NW/SE/SW ±20°, white_terracotta + light_gray_concrete top course. V: curvedPier
- [ ] Open undercroft y0..2 with soffit y3 and ochre_froglight every 4 cells on radii 9 and 12. V: soffitLight
- [ ] Balcony slot: black_stained_glass_pane band at y8 recessed 1 round the inner court face; north outer slot x150..160 z1..3 y8. V: balconyBand
- [ ] Court fountain: smooth_stone_slab rim radius 3, water radius 2.5 at y0. V: roundFountain
- [ ] Plaza: smooth_stone paving + light_gray_concrete rings r16, low walls along plot edges with gaps x153..157 (N,S) and z13..17 (W,E); 4 sculptures polished_blackstone/basalt at (143,2) (167,2) (143,28) (166,28); plaza lantern posts every 8 cells, deck lanterns every 6. V: sculpture, lampPost
```

### rooms.json

```json
{"entrance":[26,0,1],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "castle_body": ["red_terracotta"],
    "castle_trim": ["polished_granite", "polished_granite_stairs", "polished_granite_slab"],
    "castle_accent": ["red_nether_bricks", "red_nether_brick_stairs", "red_nether_brick_slab", "red_nether_brick_wall"],
    "castle_roof": ["deepslate_tiles", "deepslate_tile_stairs", "deepslate_tile_slab"],
    "castle_glass": ["gray_stained_glass_pane"],
    "ai_body": ["bricks", "brick_stairs"],
    "ai_band": ["yellow_terracotta", "light_blue_terracotta", "red_terracotta", "orange_terracotta"],
    "ai_plinth": ["polished_andesite"],
    "ai_roof": ["stone_bricks", "stone_brick_stairs", "stone_brick_slab", "andesite_stairs"],
    "ai_glass": ["glass_pane", "gray_stained_glass_pane"],
    "freer_body": ["white_terracotta"],
    "freer_trim": ["polished_diorite", "polished_diorite_stairs", "polished_diorite_slab", "smooth_stone", "smooth_stone_slab"],
    "freer_roof": ["andesite_stairs", "andesite_slab", "polished_andesite"],
    "hirshhorn_body": ["white_terracotta", "smooth_sandstone", "light_gray_concrete"],
    "hirshhorn_glass": ["black_stained_glass_pane"],
    "sculpture": ["polished_blackstone", "basalt"],
    "ground": ["grass_block", "gravel", "podzol", "water", "smooth_stone", "smooth_stone_slab"],
    "plant": ["oak_log", "oak_leaves", "poppy", "azure_bluet", "dandelion"],
    "light": ["shroomlight", "ochre_froglight"]
  },
  "objects": ["lantern", "lightning_rod", "end_rod"]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build into a temp file, then move it into place. Never fails on a missing part file.
set -e
cd "$(dirname "$0")"
TMP="$(mktemp ./build.nbt.XXXXXX)"
trap 'rm -f "$TMP"' EXIT
node build.mjs "$TMP"
chmod 644 "$TMP"
mv "$TMP" build.nbt
trap - EXIT
```

### build.mjs

```js
// South Mall kit: lays the ground, then runs the six parts in order; saves the build to the path in argv[2].
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE, GROUND_Y, GRASS_BLOCK } from "./vocab/base.mjs";
import * as castleShell from "./parts/castle-shell.mjs";
import * as castleRoofs from "./parts/castle-roofs.mjs";
import * as aiShell from "./parts/ai-shell.mjs";
import * as aiRoofs from "./parts/ai-roofs.mjs";
import * as freer from "./parts/freer.mjs";
import * as hirshhorn from "./parts/hirshhorn.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// 1.21.1 (DataVersion 3955): the server's version; every block in the palette exists there
const g = new Grid(SITE_SIZE, { dataVersion: 3955 });
g.fill([0, GROUND_Y, 0], [SITE_SIZE[0] - 1, GROUND_Y, SITE_SIZE[2] - 1], GRASS_BLOCK);

runParts(g, [
  ["castle shell", castleShell.build],
  ["castle roofs and lights", castleRoofs.build],
  ["A&I shell", aiShell.build],
  ["A&I roofs and lights", aiRoofs.build],
  ["Freer palazzo", freer.build],
  ["Hirshhorn drum", hirshhorn.build],
], { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the South Mall kit: palette ids (palette.json only), plan.md's site coordinates, and a seeded rng.
// Coordinates are in the kit frame (x along the Mall, east = high x; north = low z), as plan.md's SITE table gives them.

// ---- site -------------------------------------------------------------------------------------------------------------

// ---- site -------------------------------------------------------------------------------------------------------------
/** Grid size [x, y, z] for the whole kit: x0..169, y0..27, z0..41. */
export const SITE_SIZE = [170, 28, 42];

/** Lowest course of the terrain under every plot (the ground layer is laid here). */
export const GROUND_Y = 0;

/** Plot boxes (inclusive) from the SITE table. Plot 1's lowest course is y1; its footings reach y0 in the SE corner. */
export const PLOTS = {
  castle: { x0: 0, x1: 56, z0: 0, z1: 20, y0: 0, y1: 27, ground: 0 },
  ai: { x0: 61, x1: 102, z0: 0, z1: 41, y0: 0, y1: 22, ground: 1 },
  freer: { x0: 107, x1: 136, z0: 0, z1: 25, y0: 0, y1: 16, ground: 0 },
  hirshhorn: { x0: 141, x1: 169, z0: 0, z1: 30, y0: 0, y1: 19, ground: 0 },
};

/** Entrances: [x, y, z] of the door's floor cell; the street cell is the one just north of it (z - 1). */
export const ENTRANCE = {
  castle: [26, 0, 1],
  ai: [81, 1, -1],
  freer: [121, 0, 1],
  hirshhorn: [155, 0, 3],
};

// ---- Castle (plot 0) --------------------------------------------------------------------------------------------------
/** Flagpole column: end_rod x29 z6 y19..22. */
export const CASTLE_FLAGPOLE = { x: 29, z: 6, y0: 19, y1: 22 };

/** Tower shafts T1..T9 from the masses table: x0, x1, z0, z1 (inclusive), wall top y (the parapet or spire base). */
export const CASTLE_TOWERS = {
  T1: { x0: 23, x1: 30, z0: 3, z1: 8, top: 15 },
  T2: { x0: 28, x1: 30, z0: 5, z1: 7, top: 18 },
  T3: { x0: 39, x1: 42, z0: 7, z1: 10, top: 14, chamfer: 1 },
  T4: { x0: 12, x1: 15, z0: 7, z1: 10, top: 12 },
  T5: { x0: 9, x1: 11, z0: 8, z1: 10, top: 12 },
  T6: { x0: 2, x1: 4, z0: 6, z1: 8, top: 10 },
  T7: { x0: 52, x1: 54, z0: 6, z1: 8, top: 12 },
  T8: { x0: 25, x1: 28, z0: 13, z1: 16, top: 11, chamfer: 1 },
  T9: { x0: 25, x1: 28, z0: 17, z1: 20, top: 13, chamfer: 1 },
};

// ---- Arts & Industries (plot 1) ---------------------------------------------------------------------------------------
/** Axes of the Greek cross: the N-S nave is on x81, the E-W nave on z20. */
export const AI_AXES = { x: 81, z: 20 };

/** Lantern box x80..82 z19..21, y19..20 glass, slab cap y21, finial y22; shroomlight core at (81, 19, 20). */
export const AI_LANTERN = { x0: 80, x1: 82, z0: 19, z1: 21, y0: 19, y1: 22, core: [81, 19, 20] };

/** Rotunda (octagon, chamfer 4) x74..88 z13..27, drum (chamfer 3) x76..86 z15..25. */
export const AI_ROTUNDA = { x0: 74, x1: 88, z0: 13, z1: 27, chamfer: 4 };

export const AI_DRUM = { x0: 76, x1: 86, z0: 15, z1: 25, chamfer: 3 };

// ---- Freer (plot 2) ---------------------------------------------------------------------------------------------------
/** The open court x117..125 z11..18 (the fountain and trees sit in it). */
export const FREER_COURT = { x0: 117, x1: 125, z0: 11, z1: 18 };

/** Court fountain: water x120..122 z14..15 at y0, rim ring x119..123 z13..16. */
export const FREER_FOUNTAIN = { cx: 121, cz: 14.5, rim: { x0: 119, x1: 123, z0: 13, z1: 16 }, water: { x0: 120, x1: 122, z0: 14, z1: 15 } };

/** Court trees: oak log at these cells, crowns of radius 1 at y3..4. */
export const FREER_TREES = [[118, 12], [124, 12], [118, 17], [124, 17]];

// ---- Hirshhorn (plot 3) -----------------------------------------------------------------------------------------------
/** Drum centre; outer radius 14.5 (the footprint circle), inner radius 7.5 (the court hole). */
export const HIRSHHORN = { cx: 155, cz: 15, rOut: 14.5, rIn: 7.5, deckY: 10, soffitY: 3, balconyY: 8 };

/** Curved piers: arcs between radius 9 and 12, on the four diagonals, each spanning ±20°, at y0..2. */
export const HIRSHHORN_PIER_ANGLES = [45, 135, 225, 315];

/** Plaza low wall gaps: x153..157 (north and south), z13..17 (west and east). */
export const HIRSHHORN_WALL_GAPS = { ns: { x0: 153, x1: 157 }, ew: { z0: 13, z1: 17 } };

/** Sculptures: [x, z, height] (1x1 or 2x1 columns, polished_blackstone and basalt). */
export const HIRSHHORN_SCULPTURES = [[143, 2, 3], [167, 2, 2], [143, 28, 2], [166, 28, 3]];

// ---- rng ----------------------------------------------------------------------------------------------------------------
/** Seeded PRNG (mulberry32): rng(seed)() returns a float in [0, 1); the same seed gives the same sequence. */
export function rng(seed)

// ---- palette (palette.json ids, bare names) -----------------------------------------------------------------------------
// Castle
export const RED_TERRACOTTA = "red_terracotta";

export const POLISHED_GRANITE = "polished_granite";

export const POLISHED_GRANITE_STAIRS = "polished_granite_stairs";

export const POLISHED_GRANITE_SLAB = "polished_granite_slab";

export const RED_NETHER_BRICKS = "red_nether_bricks";

export const RED_NETHER_BRICK_STAIRS = "red_nether_brick_stairs";

export const RED_NETHER_BRICK_SLAB = "red_nether_brick_slab";

export const RED_NETHER_BRICK_WALL = "red_nether_brick_wall";

export const DEEPSLATE_TILES = "deepslate_tiles";

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";

export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";

// Arts & Industries
export const BRICKS = "bricks";

export const BRICK_STAIRS = "brick_stairs";

export const YELLOW_TERRACOTTA = "yellow_terracotta";

export const LIGHT_BLUE_TERRACOTTA = "light_blue_terracotta";

export const ORANGE_TERRACOTTA = "orange_terracotta";

export const POLISHED_ANDESITE = "polished_andesite";

export const STONE_BRICKS = "stone_bricks";

export const STONE_BRICK_STAIRS = "stone_brick_stairs";

export const STONE_BRICK_SLAB = "stone_brick_slab";

export const ANDESITE_STAIRS = "andesite_stairs";

export const ANDESITE_SLAB = "andesite_slab";

export const GLASS_PANE = "glass_pane";

// Freer
export const WHITE_TERRACOTTA = "white_terracotta";

export const POLISHED_DIORITE = "polished_diorite";

export const POLISHED_DIORITE_STAIRS = "polished_diorite_stairs";

export const POLISHED_DIORITE_SLAB = "polished_diorite_slab";

export const SMOOTH_STONE = "smooth_stone";

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";

// Hirshhorn
export const SMOOTH_SANDSTONE = "smooth_sandstone";

export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";

export const BLACK_STAINED_GLASS_PANE = "black_stained_glass_pane";

export const POLISHED_BLACKSTONE = "polished_blackstone";

export const BASALT = "basalt";

// Ground and plants
export const GRASS_BLOCK = "grass_block";

export const GRAVEL = "gravel";

export const PODZOL = "podzol";

export const WATER = "water";

export const OAK_LOG = "oak_log";

export const OAK_LEAVES = "oak_leaves";

export const POPPY = "poppy";

export const AZURE_BLUET = "azure_bluet";

export const DANDELION = "dandelion";

// Light and fittings
export const SHROOMLIGHT = "shroomlight";

export const OCHRE_FROGLIGHT = "ochre_froglight";

export const LANTERN = "lantern";

export const LIGHTNING_ROD = "lightning_rod";

export const END_ROD = "end_rod";
```

### vocab/h1.mjs

```js
// Nine vocabulary helpers from plan.md (VOCABULARY): ashlarWall, roundArch, gableEnd, battlements, uplight, bigArch,
// cornice, courtTree, soffitLight. Placed through the build library; block ids are plan.md's PALETTE, states checked
// against 1.21.1 with `mcd states`.
//
// Contract every helper keeps:
// - takes its position (and a face where it has one) as arguments; nothing is hard-wired to a spot;
// - writes only inside the footprint it computes from its arguments (a write outside throws: a bug in the caller);
// - writes only into air, unless opts.over is true (to cut an opening or dress a wall the shell already built).
//   A refused write (a solid cell without over) is pushed onto g.refused and not placed.
// Faces are the outward face of the wall: north is low z (the Mall front), east is high x.

/**
 * A 1-thick wall: `box` is its footprint, thin along the axis that the face points along (z for north/south, x for
 * east/west). Base course y0 is the plinth; in the castle, polished granite fills runs of three about one cell in
 * twelve (deterministic, so re-running gives the same wall).
 */
export function ashlarWall(g, box, face, kit = "castle", opts = {})

/**
 * A round-arched opening `width` cells wide (>= 2), from (x, y, z) on a wall with outward face `face`. Clears the
 * opening (3 high, y..y+2), upside-down stairs at the two ends of the arch course (y+3) facing in, and a keystone
 * course of the kit's trim above (y+4). Needs over: true to cut a built wall.
 */
export function roundArch(g, x, y, z, width, face, kit = "castle", opts = {})

/**
 * The triangle infill of a gable wall: `box` is the wall (thin along x or z; the triangle spans the other axis), from
 * eave row y0 (full width) up to y1, each row inset one cell per side (pitch 1:1). Air only unless over.
 */
export function gableEnd(g, box, y0, y1, material, opts = {})

/**
 * A parapet on the perimeter of rect [x0, z0, x1, z1] at height y. style "crenel": a red nether brick course at y,
 * merlons (red_nether_brick_wall) on every other ring cell at y+1, and an upside-down corbel under each side cell at
 * y-1 (it lands where the wall stops, so the corbel reads proud). style "ring": a wall ring at y with polished granite
 * corner posts at y and y+1 (T3). Air only unless over.
 */
export function battlements(g, rect, y, style = "crenel", opts = {})

/** A single ochre froglight flush at ground level (y0) in a lawn strip. */
export function uplight(g, x, z, opts = {})

/**
 * The A&I arched window: `a0..a1` along the wall (x for north/south faces, z for east/west), `y0..y1` high, on the
 * plane `plane` (z or x). Gray glass panes, brick stairs as the voussoirs at the top corners, an orange terracotta
 * course above, and the middle columns of plain glass as the door from y1 (ground) to y0-2. Needs over: true.
 */
export function bigArch(g, a0, a1, y0, y1, plane, face, opts = {})

/**
 * A Freer cornice at height y: polished diorite on the perimeter of `box` (the body's outer face), a smooth stone
 * slab (top half) proud 1 all round it. opts.court: the open court [x0, z0, x1, z1] inside the box, which gets the same
 * course on its edge and a slab proud into the court. Air only unless over.
 */
export function cornice(g, box, y, opts = {})

/** A court tree at (x, z): oak log trunk y0..y2 (axis y), a 3x3 crown of persistent oak leaves at y3 and y4. */
export function courtTree(g, x, z, opts = {})

/**
 * Ochre froglights in a soffit at height opts.y (default 3) on the ring of radius r about (cx, cz): every opts.step-th
 * ring cell in angular order (default 4). Needs over: true where the drum's course is already built.
 */
export function soffitLight(g, cx, cz, r, opts = {})
```

### vocab/h2.mjs

```js
// Vocabulary helpers, batch 2: the nine plan.md VOCABULARY names not covered elsewhere.
// Each takes the Grid first, then its position and facing as arguments, and returns { placed, refused }.
// A helper writes only inside its own footprint and only into air. An option (`over`, or a block-named
// `opts.over`) lets it replace the listed blocks. Block ids are plan.md PALETTE literals, checked for 1.21.1.
// Coordinates are plot-local, as in plan.md. Lanterns hang from a block above; flowers sit on podzol.

/** stringCourse(box, y, material): a top-half slab course one cell proud round the outside of a wall box [x0, z0, x1, z1]. */
export function stringCourse(g, box, y, material)

/**
 * archedWindow(x, y, z, face, h, opts): an h-cell glazed opening at (x, y..y+h-1, z) in a 1-thick wall whose outside
 * faces `face` ("north" = the wall's north face). Proud on the outside cell: a top-half slab sill at y-1 and an
 * upside-down hood stair at y+h. A shroomlight glow one cell inside, at the window's centre height.
 * opts: trim (default polished_granite), pane (default gray_stained_glass_pane), glow (default true), sill (default
 * true; pass false where a string course already sits at y-1 and serves as the sill).
 */
export function archedWindow(g, x, y, z, face, h, { trim = "polished_granite", pane = "gray_stained_glass_pane", glow = true, sill = true } = {})

/**
 * slateRoof(spec): the roof.json for `$MCD roof --spec`. Writes nothing; the part lays the roof.
 * spec: { family: "castle" | "ai" | "freer" (default castle), style: "gable" | "hip" | "pyramid" | "tower-cap",
 *         ...any other roof.json key (ridgeAxis, keep, maxHeight, pitch, overhang, material, verge, ridge) }.
 * Pitch is set only for gable and hip; pyramid and tower-cap take their proportions from the roof tool.
 */
export function slateRoof(spec = {})

/** flagpole(x, y, z, h): an end_rod column, h cells from y up. */
export function flagpole(g, x, y, z, h)

/**
 * parterre(x0, z0, x1, z1, opts): a flower bed over the box [x0..x1] x [z0..z1]. The outer ring is smooth_stone_slab
 * (bottom) edging at y; the inside is podzol at y with poppy, azure_bluet and dandelion on it at y+1.
 * opts: y (default 0); over: ground blocks it may replace, e.g. ["grass_block"] (default: air only). A flower is
 * placed only where its podzol went in, so none float.
 */
export function parterre(g, x0, z0, x1, z1, { y = 0, over = [] } = {})

/**
 * clerestory(row): glass panes every `step` cells (default 2) along one wall row at each height in ys (default [8, 9]).
 * row: { along: "x" | "z", from, to, at, ys, step, pane }. `at` is the wall's fixed coordinate: z for along x, x for along z.
 * Writes into the air the shell leaves for the openings.
 */
export function clerestory(g, { along, from, to, at, ys = [8, 9], step = 2, pane = "glass_pane" })

/**
 * loggia(x0, x1, z, opts): a covered walk of three bays. The arches are in the plane z (openings y..y+3); piers of
 * polished_diorite stand every 4 cells from x0 to x1; upside-down polished_diorite_stairs sit at the top corners of
 * each opening (y+3); a smooth_stone frieze runs at y+4 over both rows (z and z+1); a hanging lantern hangs at y+3
 * in each bay centre on the walk row z+1. x1 - x0 must be a multiple of 4 (12 for three bays). opts: y (default 0).
 */
export function loggia(g, x0, x1, z, { y = 0 } = {})

/**
 * drumRing(cx, cz, rOut, rIn, y0, y1): a solid ring of cells whose distance from (cx, cz) is rIn to rOut, from y0 to y1.
 * Cut in 2-wide vertical strips round the ring by arc length. Air only: a cell that already holds a band or an
 * opening is refused, not replaced. Run balconyBand first, so the glass band stays.
 */
export function drumRing(g, cx, cz, rOut, rIn, y0, y1)

/**
 * balconyBand(cx, cz, r, y, opts): one row of black glass on the ring whose cells sit at distance r to r+1 from
 * (cx, cz). Pass r = the drum's inner radius, so the band is recessed 1 into the court face. opts.slot: { box: [x0, z0,
 * x1, z1], rOut }, which also glazes the drum-ring cells in that box (the north balcony slot). Air only: run before
 * drumRing. Each pane joins the band cells beside it.
 */
export function balconyBand(g, cx, cz, r, y, { slot = null, pane = "black_stained_glass_pane" } = {})
```

### vocab/h3.mjs

```js
// plan.md VOCABULARY helpers (h3 group): corbelTable, glowCell, slateSpire, oriel, polyBand, octoRing, smallWindow,
// precastStrip, sculpture. Plot-local coordinates; each helper takes its position (and facing) as arguments and
// writes only its own footprint. Writes go only into air unless opts.replace is true, which lets a band or trim go
// over an existing wall in that same footprint. Nothing is written beside or under a footprint.
// States are explicit: 1.21.1 stairs, slabs and panes take no waterlogged property (mcd states --version 1.21.1).

/** Upside-down red_nether_brick_stairs, one cell proud of the box [x0,z0,x1,z1] on its long faces (or opts.faces), at y. */
export function corbelTable(g, [x0, z0, x1, z1], y, opts = {})

/** Shroomlight one cell inside the wall plane, at the window's centre height. */
export const glowCell = (g, x, y, z, opts = {}) => ...

/**
 * Steep slate spire on the tower rect [x0,z0,x1,z1] whose shaft top is y-1. Each row is the rect inset 1 cell more:
 * stair ring (back inward, corners shaped); once a row is 2 wide or less, or it is the last row, a slab cap. A
 * lightning_rod sits on the cap. A polished_granite slab band, proud 1, runs one row under the eave (y-1).
 * Returns cells written. Rows fall short of `height` when the rect shrinks first (a 4x4 tower gets a 2-row cap).
 */
export function slateSpire(g, [x0, z0, x1, z1], y, height, opts = {})

/**
 * Corbelled bay on the wall at z, x0..x1 by y0..y1: red_terracotta one cell proud of the wall, paired gray glass lights
 * in the middle columns below the top row, upside-down red_nether_brick_stairs corbels at y0-1 (skipped where a roof
 * already sits), a deepslate_tile slab cap at y1+1.
 */
export function oriel(g, x0, x1, z, y0, y1, opts = {})

/** Band course round the perimeter of the rect [x0,z0,x1,z1], `thickness` rows from y, flush with the wall. */
export function polyBand(g, [x0, z0, x1, z1], y, material, thickness = 1, opts = {})

/**
 * Octagonal wall ring centred (cx,cz), half-width r (the box is 2r+1 square), with `chamfer` cells cut from each corner,
 * rows y0..y1. opts.block sets the wall (default bricks).
 */
export function octoRing(g, cx, cz, r, chamfer, y0, y1, opts = {})

/** 1x1 gray glass pane at (x,y,z) in the wall of `face`, with a polished_diorite sill below and lintel above. */
export function smallWindow(g, x, y, z, face = "north", opts = {})

/** Panel material for drum column index i (two columns per strip, so the joints read as strips). */
export const precastMaterial = (i) => ...

/** A column of precast panel material at (x,z), rows y0..y1; the strip is chosen by column index i. */
export function precastStrip(g, x, y0, y1, z, i, opts = {})

/**
 * Column of polished_blackstone (opts.material "basalt", axis y) h high from y at (x,z); opts.width 2 adds the cell
 * to +x. Only the column is written, so the 2-high lane past it stays clear.
 */
export function sculpture(g, x, y, z, h, opts = {})
```

### vocab/h4.mjs

```js
// Vocabulary helpers, part 4 (plan.md VOCABULARY): quoins, slitWindow, octoTower, lampPost, gableDiamond, lanternCap,
// fountain, curvedPier. Every helper takes its position as arguments (and facing where it has one) and writes only its own
// footprint: into air, unless opts.replace is set, which overwrites cells of that footprint and nothing else. Nothing here
// writes ground, sand or floor under its footprint. Blocks are plan.md's PALETTE ids; states are the 1.21.1 names the
// toolkit validates.

/**
 * A corner column of polished_granite at (x, z) from y0 to y1. The 2-high / 1-high stone rhythm is not drawn here: one column
 * cannot show the joints, so the column is continuous and the rhythm needs the face cells of a second pass.
 */
export function quoins(g, x, z, y0, y1, opts = {})

/**
 * A 1 x h slit of gray stained glass in the wall on `face` (north, south, east or west), bottom cell at (x, y, z). The glass
 * joins the solid wall on both sides. The slit is air until this fills it: the shell leaves openings as air (opts.replace
 * cuts through a solid wall first).
 */
export function slitWindow(g, x, y, z, face, h, opts = {})

/**
 * An octagonal tower shaft: the square x0..x1 by z0..z1 with each corner cut by `chamfer` cells, walls one cell thick from
 * y0 (opts.y0, default 0) up to yTop, in opts.material (default red_terracotta, the Castle body). The inside is left as it
 * is (hollow). The slits are glazed by slitWindow after this.
 */
export function octoTower(g, x0, z0, x1, z1, yTop, chamfer, opts = {})

/**
 * A lamp post standing at (x, y, z): two wall blocks at y and y+1 (opts.material, default red_nether_brick_wall; Hirshhorn
 * passes polished_blackstone_wall) and a standing lantern on top at y+2. Three cells, all or none.
 */
export function lampPost(g, x, y, z, opts = {})

/**
 * The diamond in a gable on `face` (north, south, east or west), centred on its oculus at (cx, y, cz). A north or south gable
 * lies in the plane z = cz, an east or west one in x = cx. By Manhattan distance from the oculus: a 1 x 1 glass_pane oculus,
 * light_blue_terracotta round it, and a yellow_terracotta diamond outside that, radius opts.size (default 2). The bricks round
 * it are the gable's triangle infill (gableEnd), not written here.
 */
export function gableDiamond(g, cx, y, cz, face, opts = {})

/**
 * A lantern box on the 3 x 3 centred at (x, z), its bottom course at y: glass_pane walls round the ring at y and y+1, a
 * shroomlight core at the centre of y (the top centre stays air), a slab cap at y+2 (opts.cap, default stone_brick, as
 * stone_brick_slab) and a lightning_rod finial at y+3. Eleven to twenty-seven cells, all or none.
 */
export function lanternCap(g, x, y, z, opts = {})

/**
 * A fountain basin at height y, its rim and water in cells at y. Round: centre (cx, cz), radius r. The rim is smooth_stone_slab
 * at about distance r, the water source (level 0) inside it. Or, with opts.box = [x0, z0, x1, z1] (cx, cz, r unused), a
 * rectangular basin: slab rim round the box, water inside it. Lay the paving round it after this, so the basin's own y cells
 * are still air. All cells, or none.
 */
export function fountain(g, cx, cz, r, y, opts = {})

/**
 * A curved pier: the arc of the ring between radii r0 and r1 round (cx, cz), centred on the compass angle `angle` (degrees, atan2
 * of dz over dx: NE -45, SE 45, SW 135, NW -135) and spanning ±span degrees. Cells from opts.y0 (default 0) to opts.y1 (default
 * 2): opts.material (default white_terracotta) below, opts.cap (default light_gray_concrete) on the top course.
 */
export function curvedPier(g, cx, cz, r0, r1, angle, span, opts = {})
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
