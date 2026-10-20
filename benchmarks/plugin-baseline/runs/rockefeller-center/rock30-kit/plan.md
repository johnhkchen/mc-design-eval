# 30 Rockefeller Plaza — architect's plan (FORM)

Coordinates are plot-local: x 0..145 (west Sixth Ave → east Rockefeller Plaza), z 0..53 (north 50th St → south 49th St), y 0 = lowest ground. Hard limits: nothing outside the footprint, nothing above y 245. 1 map cell = 4x4 blocks (col c → x 4c..4c+3, row r → z 4r..4r+3).

## SITE

| item | value |
|---|---|
| Lot | 146 x 54; footprint = every cell except row 0 x0..19 and x144..145, rows 1-2 / 10-12 x144..145, row 13 (z52..53) except x0..15 |
| Ground | west x0..15: y0-1; x16..79: y1; x80..131: y2; x132..145: y3 (north-east corner y3). Every mass is carried DOWN to the ground under it (plinth), never floats |
| Streets | WEST face x0 = Sixth Ave; NORTH face z0 (x20..143) and z4 (x0..19) = 50th St; SOUTH face z51 (x24..143) / z47 (x0..23, onto the forecourt) = 49th St; EAST face x145 = Rockefeller Plaza (the hero front, the narrow end of the slab) |
| Orientation | built as sited, no turning. The tower's principal front is EAST (+x), not north |
| Massing rule | every box below rises from the ground to its top y; the building is the UNION of the boxes. N and S boxes are mirror images about z = 27.5 (z ↔ 55 − z) |

### Masses (x0..x1, z0..z1, top y)

THE TOWER (slab, long axis x, narrow end east). Lower shaft faces are sheer from ground to the first setback.

| id | role | x | z | top y |
|---|---|---|---|---|
| I1 | main shaft, sheer WEST face at x56 | 56..131 | 16..39 | 216 |
| I2 | upper shaft | 60..131 | 16..39 | 222 |
| I3 | Top of the Rock deck 1 (67th) tier | 76..123 | 16..39 | 224 |
| I4 | Top of the Rock deck 2 (69th) tier | 76..119 | 18..37 | 228 |
| C1 | crown: topmost narrow flat roof (70th, deck 3) | 80..135 | 24..31 | 232 |
| F1 | N/S flank, outer 2-block ledge | 68..111 | 12..43 | 212 |
| F2 | N/S flank, inner ledge | 68..111 | 14..41 | 218 |
| F3 | flank east cascade step 1 | 112..119 | 12..43 | 196 |
| F4 | flank east cascade step 2 | 120..127 | 12..43 | 153 |
| F5 | flank east cascade step 3 | 128..131 | 12..43 | 110 |
| F6 | flank east podium | 132..139 | 12..15 and 40..43 | 41 |
| E1 | east-end upper body | 132..139 | 16..39 | 202 |
| E2 | east-end centre spine | 132..143 | 24..31 | 209 |
| E3 | east tier | 140..143 | 16..39 | 163 |
| E4 | plaza front (entrance face x145) | 144..145 | 16..39 | 113 |
| E5 | plaza front centre spine | 144..145 | 24..31 | 170 |
| E6 | plaza-corner shop pavilions | 140..145 | 12..15 and 40..43 | 11 |

Read from the air: a pale slab 24 wide narrowing to 8 at its crown; on the north and south flanks a cascade of 2-block ledges (212 → 218 → 222 → 224 → 228 → 232) and, at the east end of each flank, the big stair-step down to the plaza (218 → 196 → 153 → 110 → 41); the east face itself steps 232 → 209 → 170/113 with its centre spine (z24..31) always the tallest.

THE SIXTH AVENUE WING and low wings

| id | role | x | z | top y |
|---|---|---|---|---|
| W1 | Sixth Ave block (16 storeys) | 0..23 | 4..47 | 58 |
| W1b | its upper setback | 4..19 | 8..43 | 63 |
| W1c | its top setback / mechanical | 8..15 | 16..39 | 66 |
| W2 | central low wing (11 storeys), around the tower base | 24..87 | 4..51 | 41 |
| W2b | setback storey | 44..55 | 8..39 | 45 |
| W2c | stair/mechanical block | 28..35 | 32..47 | 50 |
| W3a | 50th St wing (north) | 88..111 | 4..11 | 36 |
| W3b | 49th St wing (south) | 88..111 | 44..51 | 36 |
| W4a / W4b | lower wings N / S | 112..131 | 4..11 / 44..51 | 23 |
| W5a / W5b | plaza-end shop wings N / S | 132..143 | 4..11 / 44..51 | 10 |
| N1 | 50th St shop podium (3 storeys) | 20..143 | 0..3 | 11 |
| N1m | tower north entrance marquee | 68..79 | 0..3 | 15 |
| P1 | forecourt pavilion | 0..7 | 48..53 | 12 |
| LC | light court (garden at y12 over the lobby) | 60..67 | 36..39 | 12 |
| FC | 49th St forecourt, paved at grade | 8..23 | 48..51, and 0..15 z52..53 outside P1 | ground |

## ROOFS

All roofs are FLAT; this is a setback skyscraper, no pitched roofs anywhere.

| roof | form | how |
|---|---|---|
| Wing roofs W1/W1b/W1c/W2/W2b/W2c/W3/W4/W5/N1 | flat deck, parapet 1 course of white_terracotta above the top y, smooth_sandstone_slab coping | `$MCD roof` preset `modern` (flat-parapet), material forced to white_terracotta parapet; if the contrast rule swaps it, keep white_terracotta and take its coping only |
| Roof gardens | on W2 (y41) in four patches x28..39 z8..19, x60..79 z44..49, x28..43 z20..27, and on N1 (y11) every 12 blocks; on LC (y12) | hand: grass_block/moss_block beds with oak_leaves (persistent) hedges, flowering_azalea, paths of smooth_stone |
| Tower ledges (every setback top) | flat deck 1 course, outer edge a coping of smooth_sandstone_stairs facing out (1 high); against the upper wall a row of shroomlight flush in the deck every 2nd cell (the floodlights) | hand (the `setbacks` helper may be used); cannot be a preset |
| I3 (y224), I4 (y228) decks | Top of the Rock terraces: deck smooth_stone, outer edge glass_pane parapet 2 high (y top+1..+2) on a polished_andesite_slab curb instead of the stair coping; lanterns on the curb every 6 | hand |
| C1 roof (y232) | narrow flat roof deck smooth_stone, glass_pane parapet 2 high round its edge; mechanical penthouse x96..119, z25..30, y233..236 white_terracotta with smooth_sandstone_slab cap; slim mast x107..108, z27..28: iron_bars y237..243 on the penthouse, lightning_rod at y244 | hand |
| Lower tower ledges (y<196) | same coping; shroomlight every 4th cell (they are lighting and anti-spawn) | hand |

Roofs meet only by stepping: each upper box's wall rises sheer from the lower box's deck; no overhangs, no eaves. Every deck is lit (shroomlights / lanterns, at most 6 apart) so nothing spawns.

## FACADES

The whole building uses ONE fluting grammar (both tower and wings), so it reads as a bundle of vertical lines.

Fluting (every face above the ground storey), with layers counted inward from the box's face line:

| layer | even cells (x even on N/S faces, z even on E/W faces) | odd cells |
|---|---|---|
| 0 (face line) | PIER: white_terracotta, continuous to the top | air (the recess) |
| −1 | white_terracotta | window strip: per storey 2 rows glass + 1 row spandrel |
| −2 | white_terracotta | backing: black_concrete behind dark glass; shroomlight behind lit glass |

- Parity is global, so piers line up from tier to tier. The 2 cells at every corner are solid pier (white_terracotta) in layers 0 and −1: solid corners.
- Tower storeys: 3 blocks (glass, glass, spandrel) from y15 to the top; the spandrel course is gray_terracotta. Wings: 4-block storeys (3 glass + 1 spandrel).
- Lit windows: about 1 window in 7, scattered, never whole columns or rows, a few more in the lower 40 storeys. Lit = yellow_stained_glass_pane with shroomlight behind; dark = gray_stained_glass_pane with black_concrete behind.
- Tower base (ground to y14): plinth course polished_andesite at ground (1 course), then the lobby/shop storey y(ground+1)..y14: piers on every 4th cell (x or z ≡ 0 mod 4, they carry the even piers above), shop windows 3 wide between them, glass_pane, polished_blackstone frames and transom at y11, fascia band y12..13 white_terracotta, string course smooth_sandstone_slab (top) at y14.
- Wing base: same, plinth at ground, shop storey ground+1..y8, transom y6, fascia y7, string course y8.
- No cornices: the Art Deco slab ends flat; each setback is marked only by its coping line.
- Crown sign: on the N face of F1 (z12) and the S face (z43), x76..103, y197..209 (13 rows): the GE-era red letters "GE" (block font), red_stained_glass letters on a glowing backing; non-letter cells white_terracotta so the fluted face reads unbroken (see RESERVED).
- Floodlit crown: the shroomlight rows on every ledge from y196 up wash the faces above them warm white.
- East entrance (x144..145, z20..35, y3..27, a 2-deep recessed frame in the plaza face): three portals; glass-block screen; inscription band; Lee Lawrie's WISDOM panel. Details under OPENINGS / RESERVED.
- Flags: a row of 5 wall banners (white, blue, red, yellow, green) on the transom over each main entrance (east, north marquee, Sixth Ave, 49th St).

## MATERIALS

| role | block id |
|---|---|
| limestone body, piers, corners, parapets | white_terracotta |
| copings, string courses, ledge edges | smooth_sandstone_stairs, smooth_sandstone_slab |
| spandrels | gray_terracotta |
| dark window glass | gray_stained_glass_pane |
| lit window glass | yellow_stained_glass_pane |
| window backing dark / lit | black_concrete / shroomlight |
| shop / lobby glass | glass_pane (lit by shroomlight or lanterns inside) |
| bronze framing, transoms, doors' frames | polished_blackstone, polished_blackstone_wall |
| plinth course, deck curbs | polished_andesite, polished_andesite_slab |
| decks | smooth_stone |
| deck parapets (Top of the Rock) | glass_pane |
| floodlights | shroomlight |
| crown sign | red_stained_glass over shroomlight |
| WISDOM panel | gold_block (rays, dividers, crown), yellow_terracotta, light_blue_terracotta (clouds), cyan_terracotta (cloud shade), smooth_quartz (figure), black_terracotta (inscription board) |
| glass-block screen | glass and yellow_stained_glass_pane, shroomlight behind |
| mast | iron_bars, lightning_rod |
| roof gardens | grass_block, moss_block, oak_leaves (persistent), flowering_azalea |
| lamps | lantern on polished_blackstone_wall posts |
| forecourt paving | smooth_stone, polished_andesite |

All checked with `$MCD blocks --check`. Do NOT use chain (the toolkit doesn't know the 1.21.1 id): hang lanterns from blocks or walls. Nothing 1.21.4+.

## OPENINGS

| opening | face | coordinates | size |
|---|---|---|---|
| East main portals (3) | x145 inside the recessed frame (door plane x144) | z21..23, z26..29, z32..34; y3..9 | 3 / 4 / 3 wide, 7 tall; polished_blackstone frames, glass_pane doors, lit lobby behind |
| Glass-block screen over portals | x144 plane | z20..35, y10..13 | 16 x 4 |
| North tower entrance under marquee | z0 | x71..76, y2..8 | 6 x 7 |
| 49th St passage entrance | z51 | x96..103, y2..8 | 8 x 7 |
| Sixth Ave main entrance | x0 | z24..29, y1..8 | 6 x 8 |
| Sixth Ave / 50th / 49th shop doors | every 3rd shop bay | 2 wide x 3 tall in the shop window bay | — |
| Shop windows | all street faces at the base | 3-wide bays between piers on x/z ≡ 0 mod 4, y ground+1..ground+5 (wing) / ..y10 (tower) | per bay |
| Corner pavilion doors E6 | x145 | z13..14 and z41..42, y3..6 | 2 x 4 |
| Office windows | all faces above the base | every odd-parity strip, every storey | 1 wide x 2 tall (tower), 1 x 3 (wings) |

The shell leaves all these as air (doors/glass added later). Approaches: entrances sit level with the pavement (ground ≤1 below), any step is a bottom-slab ramp, never stairs.

## RESERVED

| cells | for | shell does |
|---|---|---|
| x144..145, z20..35, y3..27 | East entrance frame: portals, glass screen (y10..13), inscription band "WISDOM" on black_terracotta (y14..16, banner letters), WISDOM panel (y17..27: figure with dividers, gold rays, clouds; relief cells at x145, background at x144) | leaves AIR; builds white_terracotta reveals at z19 and z36 and the backing wall at x143 |
| N face z12 and S face z43, x76..103, y197..209 | Crown sign "GE" | builds layer −1 as shroomlight over the band, leaves layer 0 AIR; the sign part fills letters (red_stained_glass) and background (white_terracotta) |
| x96..119, z25..30, y233..244 | penthouse + mast | deck only |
| x68..79, z0..3, y12..15 | marquee (lit underside) | leaves air |
| Shop window bays at every base | glazing, lit displays, signs | leaves air |

## FLOORS

| mass | ground floor y | storey levels | interior volume (exterior only: lobbies show through glass) |
|---|---|---|---|
| Tower (I1/E*/F*) | 3 | lobby y3..14 (tall), then offices every 3: 15, 18, … to 222; decks at 224, 228, 232 | lobby x58..143, z18..37, y3..13, lit (shroomlight ceiling); above, hollow behind the backing layer, sealed, lit at ground |
| W1 Sixth Ave block | 1 | shop storey 1..8, then every 4: 9, 13, … 57 | shop depth 6 behind every street face, y1..7 |
| W2 central wing | 1 (x24..79), 2 (x80..87) | 1..8 shop storey, then every 4 to 41 | shop depth 6 behind street faces |
| W3/W4/W5 | 2 (x88..131), 3 (x132..143) | shop storey to y9/10, then every 4 | shop depth 6 behind street faces |
| N1 podium | 1..3 by ground | 1 tall storey to y10, roof garden y11 | shops depth 3, lit |
| P1 pavilion | 0 | 1 storey to y11 | glazed kiosk, lit |

---
# DESIGNER'S SECTIONS (below the architect's; architect's coordinates unchanged)

## PALETTE

All ids are exactly the architect's MATERIALS and all pass `$MCD blocks --check`.

| role | block | variants / states |
|---|---|---|
| limestone body, piers, corners, parapets, fascia | white_terracotta | full block only |
| coping / ledge edge | smooth_sandstone_stairs (facing OUT, half bottom), smooth_sandstone_slab (type top for string courses, bottom for deck caps) | stairs facing = direction away from the tower |
| spandrel | gray_terracotta | full |
| dark window | gray_stained_glass_pane over black_concrete | pane connections: use toolkit `pane()` helper |
| lit window | yellow_stained_glass_pane over shroomlight | |
| shop / lobby glass | glass_pane; screen uses glass | |
| frames, transoms, post | polished_blackstone, polished_blackstone_stairs, polished_blackstone_slab, polished_blackstone_wall | |
| plinth, curb | polished_andesite, polished_andesite_slab (bottom) | |
| decks | smooth_stone (smooth_stone_slab for low copes) | |
| floodlights / interior glow | shroomlight | |
| crown sign | red_stained_glass over shroomlight; non-letter white_terracotta | |
| WISDOM panel | gold_block, yellow_terracotta, light_blue_terracotta, cyan_terracotta, smooth_quartz, black_terracotta | |
| flags | white_wall_banner, blue_wall_banner, red_wall_banner, yellow_wall_banner, green_wall_banner (facing = outward) | use `B.banner` |
| mast | iron_bars, lightning_rod (facing up) | |
| gardens | grass_block, moss_block, oak_leaves (persistent true), flowering_azalea, smooth_stone paths | |
| lamps | lantern (hanging false) on polished_blackstone_wall; `light` blocks level 15 only if a deck cell would stay <8 | |

Not used: chain (use no hanging lanterns on chains), pale oak, anything 1.21.4+.

## VOCABULARY

Parity convention: a face is "N/S" (normal z) when fluting varies along x; "E/W" (normal x) when it varies along z. `d` = depth index from the face line (0 outer, -1, -2 inward).

1. `box(g, [x0,y0,z0,x1,y1,z1], block, {hollow})` — fill; wing/tower shells are hollow with 3-thick walls (layers 0,-1,-2) and a sealed lit interior only at the lobby.
2. `groundDown(g, x0,z0,x1,z1, topY)` — for each footprint cell column fill white_terracotta from the ground height (GROUND map, 4x4 cells) up to y; never leave a gap, never go below ground.
3. `flute(g, face, range, yFrom, yTo, storeyH, spandrelGap)` — builds layer 0/-1/-2 per the architect's fluting table. Even coordinate = white_terracotta at d=0,-1,-2 for all y. Odd coordinate: d=0 air; d=-1 per storey: rows 0..storeyH-2 of the window glass (gray_stained_glass_pane, or yellow when lit), row storeyH-1 gray_terracotta; d=-2 black_concrete (or shroomlight behind a lit pane, and spandrel rows white_terracotta). Corner 2 cells solid pier at d=0,-1 (wall coordinate within 1 of box ends). Tower storey 3 from y15; wing storey 4 from y9.
4. `windowCell(g, x,y,z, lit)` — one 1x2 (tower) / 1x3 (wing) window; `isLit = hash(x*7+y*13+z*31) % 7 == 0` (also lower 40 storeys: % 5), but suppress when the same x column was lit in the adjacent storey (no columns/rows).
5. `shopBay(g, face, at, wallY0, topY, {door})` — piers every 4th cell (x or z ≡ 0 mod 4) white_terracotta at d 0,-1; 3-wide bay: glass_pane y+1..transomY-1 at d=-1 (connected), polished_blackstone frame at jambs and sill (polished_blackstone_slab top), transom row polished_blackstone, fascia 2 rows (tower y12..13) / 1 row (wing y7) white_terracotta, string course smooth_sandstone_slab type top. Behind the glass at d=-2: shroomlight row at the top of the bay every 2nd cell (lit shop); every 3rd bay a 2x3 door (glass_pane doubled with polished_blackstone door frame, air).
6. `ledge(g, box, topY, outDir, step)` — deck: smooth_stone one course at topY over the width of the lower mass beyond the upper wall; outer edge smooth_sandstone_stairs facing outDir (half bottom, shape straight) at topY+1; shroomlight flush in the deck (replacing the deck block) every `step` cells (2 above y196, 4 below) along the upper wall base; corners as outer-corner stairs.
7. `deckParapet(g, box, topY)` — Top of the Rock deck: smooth_stone deck at topY; the outermost ring cell is polished_andesite_slab (type top) at topY (the curb), glass_pane 2 high at topY+1..topY+2 on it (connected); a lantern on the deck beside the curb every 6 cells. Max stays under 245.
8. `mast(g, x,z, y0)` — iron_bars 2x2 y237..243 at x107..108 z27..28, lightning_rod at (107,244,27); lantern on the penthouse slab cap at 4 corners; penthouse white_terracotta walls with 1 pane band.
9. `geSign(g, face, x0,x1,y0,y1)` — block-font "G" (x80..90) and "E" (x93..99), 13 rows y197..209, in red_stained_glass at layer 0 (shroomlight at layer -1 lights them); every other layer-0 cell white_terracotta. Build with the toolkit `plaque` (face north for z12, south for z43) so it reads GE left to right from the street; never by hand.
10. `portal(g, face, centre, width, height)` — opening of the width x height at the door plane, polished_blackstone frame (jambs 1, header 1), glass_pane double doors (inner), shroomlight inside, lit; lintel polished_blackstone_stairs upside-down.
11. `glassScreen(g, x, z0,z1, y0,y1)` — lattice of `glass` blocks with every 4th column/row yellow_stained_glass_pane, polished_blackstone mullions, shroomlight at x143 behind.
12. `wisdomPanel(g)` — 16 wide (z20..35) x 11 tall (y17..27): background x144 yellow_terracotta; x145 relief: gold_block rays radiating from (z27.5, y22) as straight diagonal and vertical lines, light_blue_terracotta clouds at the lower corners with cyan_terracotta shading, smooth_quartz bearded figure (head 2x2, torso 3x5 with a beard row), arm raised holding a 5-long gold_block dividers (compass) diagonal; gold_block crown rim around the panel (z20,z35 columns, y27 row).
13. `marquee(g)` — x68..79 z0..3 y12..15: slab canopy white_terracotta, polished_blackstone_stairs fascia, lit soffit shroomlight every 2nd cell; flagRow beneath at transom.
14. `flagRow(g, face, centre, y)` — 5 wall banners spaced 2 apart in colour order white, blue, red, yellow, green, `facing` outward.
15. `parapet(g, rect, topY)` — white_terracotta course at topY+1 on the rect's edge, smooth_sandstone_slab (bottom) coping at topY+2; shroomlight in the deck every 6 cells.
16. `gardenBed(g, rect, y)` — grass_block base with moss_block patches, 1-high oak_leaves hedge (persistent true) on the border, flowering_azalea 1 in 5, a 2-wide smooth_stone path, a lantern on a polished_blackstone_wall post.
17. `lampPost(g, x,y,z)` — polished_blackstone_wall 2 high with a lantern on top (hanging false).
18. `paving(g, rect)` — chequer of smooth_stone and polished_andesite, ground-flush.

## ROOMS

Exterior only. The sealed lit volumes behind glass are given as rooms so their designers dress what shows through the glass (shop windows and lobby glass), nothing else.

Entrance: [145,3,27] (the middle portal, z26..29, inside the recessed frame; plaza ground y3 is level with the threshold, no ramp needed). Street: [145,3,25] on the plaza edge (level). Floors above the street: none (the ground floor y3 equals the plaza ground at the east end; Sixth Ave doors at ground ≤1 are level: bottom-slab ramp only if the ground differs by 1).

(see rooms list in the answer)

## PARTS

1. **Massing and shell** — `parts/massing.mjs`. Every box in the architect's mass tables as hollow shells (3 thick) with `groundDown` plinths; floors in the lobby (y3) and shop storeys; leave the reserved cells and openings as air; sealed.
2. **Tower facades** — `parts/tower-facade.mjs`. `flute` on all four faces of I1..I4, C1, F1..F5, E1..E5; tower base shop storey with `shopBay` to y14; lit-window scatter.
3. **Wings and shopfronts** — `parts/wings.mjs`. `flute` + `shopBay` on W1..W5, N1, E6, P1; Sixth Ave entrance and 49th St passage portals; wing `parapet`s.
4. **Setbacks, decks and crown** — `parts/crown.mjs`. `ledge` for every setback, `deckParapet` on I3/I4, C1 roof, penthouse, `mast`, floodlights.
5. **GE crown sign** — `parts/ge-sign.mjs`. `geSign` on N and S faces; check it reads GE from the street on both.
6. **East entrance, marquee and flags** — `parts/entrance.mjs`. `portal` x3, `glassScreen`, WISDOM inscription, `wisdomPanel`, `marquee`, `flagRow` over all four entrances.
7. **Roof gardens and grounds** — `parts/grounds.mjs`. `gardenBed` on W2/N1/LC, forecourt `paving`, `lampPost`s, planting; light every deck.
8. **Lamplighting and checks** — `parts/lights.mjs`. Hidden shroomlight/lantern fill so every deck and terrace has light ≥8 within 6 blocks; verify with `$MCD light`; then `$MCD check` (nothing floating, nothing outside the footprint, y ≤245).

Checklist: [x] 1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ] 6 [ ] 7 [ ] 8

## NOTES FOR WORKERS

- Plot-local coords; never place outside the footprint `#` cells, never above y245. Parts 2/3 must write layers 0..-2 only on the shell's wall cells; part 1 leaves the fluting recess cells filled at layer 0 — part 2 carves them by NOT placing (recess by exclusion: no air op), so part 1 builds boxes only to layer -1 and the odd layer-0 cells stay unwritten.
- Do not hand-spell words: use `plaque`/`bannerWord` for GE and WISDOM.
- Sign cells and entrance frame are reserved: other parts must not write there.
- Lit windows ~1 in 7, scattered; floodlights every 2nd ledge cell above y196.
- 1.21.1 only; `chain` not used.
- (massing) Shell = 1-thick white_terracotta wall at layer -3 (4th cell in from exterior, voxel union of all boxes) + roof course on the deep interior (d>=5); layers 0..-2 and the outer 4-wide ring of every roof are left for facade/crown parts. Entrance backing x143 and reveals z19/z36 built. Lone floating in `check` is because facades are not built yet.
- (massing) make.sh: the automatic roof step (roof.json, reroof) throws "Reduce of empty array" (not "no walls found") on this setback massing, and reroof would strip everything above its eave anyway. build.mjs should drop roof.json / pass roof undefined (wings/crown parts own all roofs).
