# Manhattan Bridge kit — architect's plan (form is fixed; later parts may only add into air)

Conventions: all coordinates are LOCAL to each plot (x0..x1, y0..y1, z0..z1, inclusive). y 0 = river surface, dropped by placement: nothing is built at y 0 except the anchorage's solid fill. The bridge axis is z (low z = Manhattan = the module's "north"/front). Deck x = local x - 2 in plot 0, = local x - 5 in plot 4. "Steel" = pale blue-grey; every steel and cable member is 8-connected.

## SITE

The plots stand in the East River and on the Brooklyn shore. There is no ground course: the granite pier and the anchorage are the only things that touch the ground. The faces that matter for the aerial golden-hour view are the long x-faces (±x, up- and down-river), the tower tops, and the deck's top.

### Plot 0 — STEEL TOWER (28 x 12, to y 72)
| mass | x | y | z | notes |
|---|---|---|---|---|
| Pier body | 0..27 | 1..8 | 2..9 | granite |
| Pier rounded ends (cutwaters) | 1..26 / 3..24 | 1..8 | z1,z10 / z0,z11 | stepped plan = rounded ends at both z faces |
| Leg W, lower box | 1..6 | 9..45 | 3..8 | 4 latticed columns + core |
| Leg E, lower box | 21..26 | 9..45 | 3..8 | mirror of W |
| Leg plate (narrowing step) | 1..6 / 21..26 | 46 | 3..8 | solid plate, light_gray_concrete |
| Leg W / E, upper box | 1..6 / 21..26 | 47..66 | 4..7 | narrowed |
| Below-deck X panel | 7..20 | 10..19 | 5..6 | one X: (7,10)->(20,19) and (20,10)->(7,19) |
| Transfer girder (under deck) | 1..26 | 20..21 | 3..8 | the deck rests on it |
| Deck (shared section, offset +2) | 2..25 | 22..31 | 0..11 | exactly as plot 1 |
| Leg columns inside deck band | x1 and x26 only | 22..31 | 3..4, 7..8 | lattice on x1/x26 z5..6; every other leg cell in x2..25 belongs to the deck (the deck threads through the leg) |
| Portal girder = strut y33 | 1..26 | 32..33 | 3..8 | road headroom y30..31 under it |
| Above-deck X panels 1+2 | 7..20 | 34..45 | 5..6 | two stacked Xs: (7,34)->(20,39), (20,34)->(7,39), (7,40)->(20,45), (20,40)->(7,45); y = 34 + round((x-7)*5/13) etc. |
| Strut y46 | 7..20 | 46 | 4..7 | |
| Above-deck X panel 3 | 7..20 | 47..57 | 5..6 | y = 47 + round((x-7)*10/13) and its mirror |
| Strut y58 (tension tie) | 7..20 | 58 | 5..6 | |
| Crown arched cross-girder | 7..20 | 58..66 | 4..7 | solid above its arched soffit |
| Arch soffit (open below) | open cells x8..19 | see below | 4..7 | underside y58 at x7,20; y59 x8,19; y60 x9,18; y61 x10..11,16..17; y62 x12..15; air under the soffit down to the y58 tie |
| Crown cornice | 0..27 | 64..65 | 3..8 | y64 band at z4..7 depth with the leg tops; y65 projects to z3 and z8 over x0..27 |
| Crown top plate | 1..26 | 66 | 4..7 | |
| Leg centre finials | 3..4 / 23..24 | 67..71 | 5..6 | 2x2 |
| Leg corner finials | (1,4)(6,4)(1,7)(6,7) and (21,4)(26,4)(21,7)(26,7) | 67..69 | — | 1x1 |
| Crown centre crest | 13..14 | 67..68 | 5..6 | cartouche |
| Cable saddles | 3, 10, 17, 24 | 63 | 4..7 | |
| Cables in the tower | 3, 10, 17, 24 | 61..62 | 0..11 | see cable rule |

Leg lattice (lower box): the corner columns are 2x2 light_blue_terracotta at (x1..2 | x5..6) x (z3..4 | z7..8). The face bays are x3..4 on the z3 and z8 faces and z5..6 on the x1 and x6 faces. In each 2-cell bay, by y mod 3: 0 = batten (both cells light_gray_concrete), 1 = first cell light_blue_terracotta, 2 = second cell light_blue_terracotta (a zig-zag lacing); bay cells left empty are AIR, recessed 1. The core behind (all leftover cells of x2..5, z4..7) is solid cyan_terracotta, so there is no hollow or dark pocket. The upper box uses the same rule: columns at (x1..2 | x5..6) x (z4 | z7), bays x3..4 on z4/z7 and z5..6 on x1/x6, core x2..5 z5..6. Mirror everything for the E leg (x' = 27 - x).

### Plot 1 — DECK SECTION (24 x 12, y 22..34, tiles along z)
| member | x | y | z |
|---|---|---|---|
| Truss bottom chords | 1, 8, 15, 22 | 22 | 0..11 |
| Truss top chords | 1, 8, 15, 22 | 31 | 0..11 |
| Verticals | 1, 8, 15, 22 | 23..30 | 0 and 6 |
| Warren diagonal, rising | same | z1 y23..24, z2 y25, z3 y26..27, z4 y28, z5 y29..30 | 1..5 |
| Warren diagonal, falling | same | z7 y29..30, z8 y28, z9 y26..27, z10 y25, z11 y23..24 | 7..11 |
| Lower deck plate | 1..22 | 22 | 0..11 |
| Lower floor beams (colour band in the plate) | 1..22 | 22 | 0, 6 |
| Subway track bed, gravel | 2..7 and 16..21 | 23 | 0..11 |
| Subway rails (2 tracks per side, north_south) | 3, 6, 17, 20 | 24 | 0..11 |
| Lower roadway | 9..14 | 23 | 0..11 |
| Upper floor beams | 1..22 | 28 | 0, 6 |
| Upper roadways | 2..7 and 16..21 | 29 | 0..11 |
| Outer walkways (bike path / promenade) | 0 and 23 | 29 | 0..11 |
| Walkway railings: open iron_trapdoor on the outer edge (-x side at x0, +x side at x23), so the cell stays walkable | 0, 23 | 30 | all z except 6 |
| Lamp posts | 0, 23 | post 30..32, lantern 33 | 6 |
| Top lateral struts over the centre | 9..14 | 31 | 0, 6 |
| Suspender anchor points | 1, 8, 15, 22 | 31 (a chord cell) | 0, 3, 6, 9 |
| Upper centre x9..14 at y29 | — | — | AIR (the lower roadway is open to the sky between the inner trusses) |

### Plot 2 — MAIN-SPAN CABLES (24 x 150, to y 66)
Cables on x 1, 8, 15, 22; h(z) = 37 + 26((z+0.5)/156)^2. CABLE RULE (used in every plot): n = round(h). The cable is a full block at y n-1 plus a bottom slab at y n, so its top is never a spawnable full face. Where n steps up to the next z, the slab of the lower cell becomes a bottom stair whose high side faces the higher cell. Bands: at z ≡ 0 (mod 6) the full block is the band block. Suspenders: at z ≡ 0 (mod 3), a 1-wide wall post from y n-2 down to y 32. Nothing else goes in this plot.

### Plot 3 — SIDE-SPAN CABLES (24 x 144, to y 66)
The same cable rule on x 1, 8, 15, 22 with h = 63 - 32t - 12t(1-t), t = (z+6.5)/150.5. Suspenders at z ≡ 0 (mod 3) from y n-2 down to y 32 (z 0..35), y 31 (z 36..107) and y 30 (z 108..143). Omit a suspender where n-2 is below its foot.

### Plot 4 — ANCHORAGE WITH ARCHWAY (34 x 40, to y 40)
| mass | x | y | z | notes |
|---|---|---|---|---|
| Solid fill / footing | 0..33 | 0..8 | 0..39 | plinth course at the full footprint |
| Wall body (plane set in 1) | 1..32 | 9..23 | 1..38 | rusticated, solid behind |
| Pilasters (proud +1, to the footprint line) | z-faces: x0..2, x15..18, x31..33; x-faces: z0..2, z10..11, z28..29, z37..39 | 9..23 | on the face lines x0/x33, z0/z39 | smooth_stone |
| Arch face frame (proud +1) | x0 and x33 | 9..23 | 12..27 | the voussoir field |
| Cornice | full footprint | 24..26 | 0..39 | y24 band in the wall plane, y25 upside-down stairs out to the footprint, y26 smooth_stone top |
| Roof flats beside the deck | 0..4 and 29..33 | top at 26 | 0..39 | |
| Parapets | x0, x33 (all z); z0 and z39 on x0..4 and x29..33 only | 27..28 + coping 29 | — | the deck ends at z0/z39 stay open to join the spans |
| ARCHWAY (air) | 0..33 | 6..13 | 14..25 | vertical jambs |
| Arch head (air) | 0..33 | y14..15 z14..25; y16..17 z15..24; y18 z16..23; y19 z18..21 | — | round arch, crown y19 |
| Plaza floor | 0..33 | 5 | 14..25 | cobbles; solid below |
| Voussoir ring | x0..1 and x32..33 | the 2-cell band around the arch head + jamb quoins z12..13, z26..27 y6..13 | — | |
| Keystone | x0..1, x32..33 | 20..22 | 19..20 | |
| Deck on top | 5..28 | 27 | 0..39 | see FACADES |
| Cable anchor housings | 6, 13, 20, 27 | z0..1 y27..32, z2 y27..31, z3 y27..30, z4 y27..29 | 0..4 | stepped granite humps; the cable eye is at (x,30..31,0) |

## ROOFS

There are no pitched roofs (it is a bridge), so no `$MCD roof` preset applies. Every top is built by hand:
- The tower: a flat steel crown plate at y66, the cornice at y64..65 projecting 1 on both z faces, and the finial skyline at y67..71. This crown is the silhouette that must read.
- The deck: the flat road surface at y29 with the top chords at y31 standing 2 above it like a rail.
- The anchorage: flat granite at y26 with parapets to y29, the deck at y27 and the housings to y32.

## FACADES

**Tower, x-faces (the hero faces up- and down-river)**
- Base: the granite pier (y1..8) with a plinth at y1..2 and coping at y8.
- Below the deck: two laced legs, the below-deck X, and the transfer girder at y20..21 with a light_gray_concrete fascia line at y21.
- Deck band: the outer leg columns frame the deck's truss ends.
- Above the deck: the portal girder (y32..33), the stacked Xs, the strut at y46 and the plate where the legs step in from z3..8 to z4..7, then the third X and the tie at y58.
- Crown: the arched girder with the soffit edge in light_gray_concrete (one cell thick along the arch line, an architrave). Two recessed spandrel panels sit 1 deep at x9..11 and x16..18, y63..64, on the z4 and z7 faces, backed by cyan_terracotta. A centre cartouche of light_gray_concrete sits flush at x13..14, y63..65. Then the cornice (y64..65) and the finials.
- Riveted texture: a light_gray_concrete band course on the columns every 6 y (y 12, 18, 24 ... as the lattice battens fall).

**Tower, z-faces (toward the spans):** the same members in section, with the cables leaving at y61..62.

**Deck:** the outer trusses (x1, x22) are the face: pale chords, a pale vertical every 6 and one diagonal per panel (a strong zig-zag). The inner trusses (x8, x15) are shadow members in cyan_terracotta. The underside plate is cyan_terracotta with light_blue bands at the floor beams.

**Anchorage**
- Base: the plinth at y1..8 in polished_andesite, with a 1-wide ledge at y8 where the wall steps in.
- Wall: y9..23 stone_bricks with channelled rustication. At y 11, 14, 17, 20 the wall-plane cell is left AIR (a groove 1 deep) with polished_andesite behind it; pilasters and the arch frame are not grooved.
- Arch faces (x0, x33): the frame proud +1. Rusticated voussoirs radiate in alternating pairs of polished_andesite and stone_bricks. A chiseled_stone_bricks keystone sits at y20..22. The jamb quoins alternate long (2 deep, into x0..1) and short (1).
- Top: the cornice (y24..26), then the parapets.
- Weathering: cracked/mossy stone bricks at no more than 1 in 10, only in y1..12 and at the corners.

## MATERIALS (all checked valid for 1.21.1)
| role | block |
|---|---|
| Steel, main (legs, chords, X-bracing, crown) | light_blue_terracotta |
| Steel, highlights (battens, struts, soffit line, cartouche, cornice band, plates) | light_gray_concrete |
| Steel, shadow (cores, inner trusses, deck underside, spandrel backs) | cyan_terracotta |
| Leg lacing infill accents | iron_bars (none needed if the lacing rule is followed; allowed for the thin lattice) |
| Cable | polished_diorite, polished_diorite_slab, polished_diorite_stairs |
| Cable band, saddle casting | polished_andesite |
| Suspenders | diorite_wall |
| Finial balls | polished_diorite (2x2x2 at y69..70) with polished_diorite_slab top (y71); pedestal light_blue_terracotta y67, neck andesite_wall y68; corner finials: diorite_wall y67..68, polished_diorite_slab y69 |
| Roads | gray_concrete; lane marks white_concrete (dashes at z0..2 and 6..8) on deck x4 and x19, and on x11..12 of the lower roadway |
| Walkways | smooth_stone |
| Railings | iron_trapdoor (open, flat on the outer edge) |
| Track bed / rails | gravel on the plate / rail |
| Lamp posts | polished_blackstone_wall post + lantern |
| Pier and anchorage body | stone_bricks (granite), with cracked_stone_bricks / mossy_stone_bricks at most 1 in 10 low down |
| Plinth, rustication backs, voussoir alternates | polished_andesite |
| Pilasters, cornice top, curbs | smooth_stone; cornice stairs stone_brick_stairs (upside down); coping smooth_stone_slab |
| Keystone | chiseled_stone_bricks |
| Plaza | cobblestone (70%), mossy_cobblestone (15%), stone_bricks border rows at z14 and z25 and a band every 8 x |
| Anchorage top paving (x13..20) | polished_andesite |

## OPENINGS
- The deck tunnel through the tower: x2..25, y22..31, z0..11 (the deck alone).
- The tower arch soffit: air between the y58 tie and the arch soffit, x8..19.
- The open lacing bays of the legs (1 deep).
- The anchorage ARCHWAY: through x0..33, jambs z14..25 y6..13, head as listed, crown y19.
- Anchorage rustication grooves at y11, 14, 17, 20 (1 deep).
- The cable eyes at (6|13|20|27, 30..31, 0) in the housings.

## RESERVED (the shell leaves these as air for later parts)
- Lanterns:
  - Plot 1: posts at (0|23, 30..33, 6); hanging under the upper road at (4|19, 28, 3) and (4|19, 28, 9); hanging under the beam at (11, 27, 6).
  - Plot 0: (2|25, 31, 6) hanging under the portal girder; lantern posts on the pier top at (1|26, 9..10, 1), (1|26, 9..10, 10), (13, 9..10, 1), (14, 9..10, 10).
  - Plot 4: walkway posts at (5|28, 28..31, 6|14|22|30|38); archway posts at (3|11|22|30, 6..9, 15|24); chains + lanterns from the crown at (8|25, 17..19, 19|20); ledge lanterns on the plinth at y9, every 6 along each face.
- Subway rails at y24 on x3, 6, 17, 20 (in plots 0 and 1).
- Lane-mark cells (part of the road layer).

## FLOORS
| level | y (surface block) | where |
|---|---|---|
| Pier top | 8 | plot 0 |
| Lower deck: subway bed and lower roadway | 23 | plots 0, 1 |
| Upper roadways and walkways | 29 | plots 0, 1 |
| Archway plaza | 5 (clear 6..13 jambs, to 19 at the crown) | plot 4 |
| Anchorage roof flats | 26 | plot 4 |
| Anchorage deck | 27 | plot 4 |

There are no interior rooms (exterior only).

# DESIGNER SECTIONS

## PALETTE
Keep the architect's MATERIALS ids exactly. Shapes: light_blue_terracotta (full only); light_gray_concrete (full); cyan_terracotta (full); polished_diorite + _slab + _stairs (cable); polished_andesite + _slab + _stairs (plinth, bands); diorite_wall, andesite_wall (suspenders, necks); iron_bars (lattice); iron_trapdoor open (railings); gray_concrete, white_concrete, smooth_stone, smooth_stone_slab; gravel, rail; stone_bricks, cracked_/mossy_stone_bricks, stone_brick_stairs/slab, chiseled_stone_bricks; cobblestone, mossy_cobblestone; polished_blackstone_wall; lantern (standing and hanging), chain (axis y). All checked known with $MCD blocks --check.

## VOCABULARY (helpers; each takes g plus origin and writes only inside its plot)
- pier(g): stone_bricks box, plinth polished_andesite y1..2, cutwater steps, coping slab y8, rare cracked/mossy low.
- leg_column(g,x0,x1,zlo,zhi,y0,y1): four corner columns light_blue_terracotta, cyan core, iron_bars lacing diagonals between; light_gray_concrete band every 6 y.
- xbrace(g,x0,y0,x1,y1,z): diagonals y=y0+round((x-x0)*(y1-y0)/(x1-x0)) and mirror on z5..6, 8-connected, light_blue_terracotta.
- truss_panel(g,x,z0): Warren chords y22 and y31, vertical at z0 and z6, one diagonal per 6; x1,22 light_blue/light_gray, x8,15 cyan_terracotta.
- road_bay(g): upper roads y29 gray_concrete with white dashes, walkways smooth_stone, floor beams under (cyan, light_blue bands), gravel+rail at y23/24, lower road.
- railing(g), lamp_post(g,x,y,z): polished_blackstone_wall 3 high + lantern; hanging lanterns under a block.
- crown_arch(g), cornice(g), finial_big(g,x,z): light_blue pedestal y67, andesite_wall neck y68, polished_diorite 2x2x2 y69..70, slab y71; finial_small: diorite_wall y67..68, slab y69.
- cable_run(g,fn): per z, y=round(fn); full polished_diorite at integer y, slab bottom/top for half, stairs on steep slopes; andesite band every 6; keep 8-connected.
- saddle(g), suspender(g,x,z,ytop,ybot): diorite_wall column.
- rustic_wall(g), voussoir_ring(g): alternating polished_andesite / stone_bricks radiating; keystone; plaza(g): cobble mix with stone_brick rows; housing(g).

## ROOMS
None: exterior only.

## PARTS
1. P1 Tower & deck steelwork (parts/tower.mjs, plot 0 and deck plot 1): pier, legs, bracing, girders, trusses, roads.
2. P2 Crown (parts/crown.mjs): arch girder, cornice, finials, saddles.
3. P3 Cables (parts/cables.mjs): plots 2, 3 cables + suspenders, tower cable stubs.
4. P4 Deck fittings (parts/fittings.mjs): railings, lamp posts, lane marks, rails, lanterns.
5. P5 Anchorage (parts/anchorage.mjs): plot 4 whole.
6. P6 Lighting & weathering (parts/light.mjs): floodlights, lanterns on ledges, mossy accents, no dark walkable surface.
Notes: leave y0 empty except anchorage fill; stay within plot heights; keep reserved cells air until their part.
