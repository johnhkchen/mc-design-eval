# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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

Checklist: [ ] 1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ] 6 [ ] 7 [ ] 8

## NOTES FOR WORKERS

- Plot-local coords; never place outside the footprint `#` cells, never above y245. Parts 2/3 must write layers 0..-2 only on the shell's wall cells; part 1 leaves the fluting recess cells filled at layer 0 — part 2 carves them by NOT placing (recess by exclusion: no air op), so part 1 builds boxes only to layer -1 and the odd layer-0 cells stay unwritten.
- Do not hand-spell words: use `plaque`/`bannerWord` for GE and WISDOM.
- Sign cells and entrance frame are reserved: other parts must not write there.
- Lit windows ~1 in 7, scattered; floodlights every 2nd ledge cell above y196.
- 1.21.1 only; `chain` not used.
```

### elements.md

```markdown
# REQUIRED ELEMENTS — 30 Rockefeller Plaza (plot-local coords from plan.md; y0 = lowest ground)

Part numbers refer to PARTS in plan.md. Vocab names refer to VOCABULARY in plan.md.

- [ ] **E01 Massing, union of boxes I1..I4, C1, F1..F6, E1..E6, W1..W5, N1, P1, LC** — solid white_terracotta shell boxes carried down to ground (plinth, no floating); N/S mirror about z=27.5. Part 1. Vocab: `box`, `groundDown`.
- [ ] **E02 Fluted piers + recessed window strips on every face above the base** — global parity: even x (N/S faces) / even z (E/W faces) = white_terracotta pier at layer 0, -1, -2; odd = air at layer 0, glass strip at layer -1, backing at -2. 2-cell solid corners. Tower storey 3 (glass, glass, gray_terracotta spandrel) from y15; wings 4 (3 glass + spandrel). Parts 2 (tower), 3 (wings). Vocab: `flute`, `windowCell`.
- [ ] **E03 Lit-window scatter** — ~1 in 7 windows yellow_stained_glass_pane with shroomlight behind, never whole columns/rows, a few more below storey 40; rest gray_stained_glass_pane over black_concrete. Parts 2, 3. Vocab: `windowCell` (hash-based `isLit`).
- [ ] **E04 Tower setback cascade** — N/S ledges 212→218→222→224→228→232, east cascade 196→153→110→41, each ledge a 1-course smooth_stone deck, outer edge smooth_sandstone_stairs facing out. Parts 1, 4. Vocab: `ledge`.
- [ ] **E05 Floodlights** — shroomlight flush in the deck against the upper wall, every 2nd cell (ledges y>=196), every 4th (lower). Part 4. Vocab: `ledge`.
- [ ] **E06 Top of the Rock decks (I3 y224, I4 y228)** — smooth_stone deck, glass_pane parapet 2 high on a polished_andesite_slab curb, lantern on curb every 6. Part 4. Vocab: `deckParapet`.
- [ ] **E07 Crown C1 roof y232 + penthouse + mast** — smooth_stone deck, glass_pane parapet 2 high; penthouse x96..119 z25..30 y233..236 white_terracotta, smooth_sandstone_slab cap; mast x107..108 z27..28 iron_bars y237..243, lightning_rod y244 (one rod, at x107 z27, y244). Lantern on penthouse cap. Part 4. Vocab: `mast`.
- [ ] **E08 Red "GE" crown sign** — N face z12 and S face z43, x76..103, y197..209: block-font letters in red_stained_glass, layer -1 shroomlight backing (shell), non-letter cells white_terracotta. Part 5 (sign). Vocab: `plaque`/`geSign`.
- [ ] **E09 East entrance: three portals** — recessed frame x144..145 z20..35 y3..27; portals z21..23, z26..29, z32..34, y3..9: polished_blackstone frames, glass_pane doors (door plane x144), lit lobby shroomlight behind; reveals white_terracotta at z19, z36. Part 6. Vocab: `portal`.
- [ ] **E10 Glass-block screen** — x144, z20..35, y10..13: `glass` with yellow_stained_glass_pane accents in a lattice, shroomlight behind at x143. Part 6. Vocab: `glassScreen`.
- [ ] **E11 WISDOM inscription band** — black_terracotta board x144..145 z20..35 y14..16; "WISDOM" banner letters (white) via `plaque`/`bannerWord` facing east. Part 6.
- [ ] **E12 Lee Lawrie WISDOM relief** — x144 background / x145 relief, z20..35, y17..27: yellow_terracotta sky, gold_block rays fanning from the centre (z27..28, y22), light_blue + cyan_terracotta clouds, smooth_quartz bearded figure (torso z26..29) with gold_block dividers arm spanning and gold crown. Part 6. Vocab: `wisdomPanel`.
- [ ] **E13 Flags / banners** — row of 5 wall banners (white, blue, red, yellow, green) on the transom over each main entrance (east, north marquee, Sixth Ave, 49th St). Part 6, 7. Vocab: `flagRow`.
- [ ] **E14 Shop base all round** — plinth polished_andesite at ground; piers every 4th cell; 3-wide glass_pane bays, polished_blackstone frames, transom, white_terracotta fascia band, smooth_sandstone_slab (top) string course; shops lit by shroomlight inside. Tower base to y14 (fascia y12..13), wings to y8 (transom y6, fascia y7). Parts 2, 3. Vocab: `shopBay`.
- [ ] **E15 Tower north entrance + marquee** — N entrance x71..76 y2..8 under marquee x68..79 z0..3 y12..15: white_terracotta slab with a lit underside (shroomlight flush in soffit every 2nd cell), polished_blackstone fascia. Part 6. Vocab: `marquee`.
- [ ] **E16 Sixth Ave main entrance + 49th St passage entrance** — x0 z24..29 y1..8; z51 x96..103 y2..8; polished_blackstone frames, glass_pane double leaves, lit. Parts 3, 6. Vocab: `portal`.
- [ ] **E17 Wing parapets and roofs** — W1..W5, N1 flat decks, 1-course white_terracotta parapet, smooth_sandstone_slab coping, lit by shroomlight in deck every 6. Part 3. Vocab: `parapet`.
- [ ] **E18 Roof gardens** — W2 y41 patches x28..39 z8..19, x60..79 z44..49, x28..43 z20..27; N1 y11 every 12 blocks; LC y12: grass_block/moss_block beds, oak_leaves persistent hedges, flowering_azalea, smooth_stone paths, a lantern per patch. Part 7. Vocab: `gardenBed`.
- [ ] **E19 Forecourt FC + pavilion P1** — paving smooth_stone/polished_andesite chequer; P1 glazed lit kiosk x0..7 z48..53 y0..12, flat roof, parapet. Parts 1, 7.
- [ ] **E20 Street lighting** — lantern on polished_blackstone_wall post at each main entrance and every ~10 blocks along street faces at grade (inside plot only). Part 7. Vocab: `lampPost`.
- [ ] **E21 Anti-spawn** — every deck and ledge lit (<=6 apart); `$MCD light` shows no dark deck cell.
```

### rooms.json

```json
{"entrance":[145,3,27],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "limestone": ["white_terracotta"],
    "coping": ["smooth_sandstone_stairs", "smooth_sandstone_slab"],
    "spandrel": ["gray_terracotta"],
    "windowDark": ["gray_stained_glass_pane", "black_concrete"],
    "windowLit": ["yellow_stained_glass_pane", "shroomlight"],
    "shopGlass": ["glass_pane", "glass"],
    "bronze": ["polished_blackstone", "polished_blackstone_stairs", "polished_blackstone_slab", "polished_blackstone_wall"],
    "plinth": ["polished_andesite", "polished_andesite_slab"],
    "deck": ["smooth_stone", "smooth_stone_slab"],
    "sign": ["red_stained_glass"],
    "wisdom": ["gold_block", "yellow_terracotta", "light_blue_terracotta", "cyan_terracotta", "smooth_quartz", "black_terracotta"],
    "mast": ["iron_bars", "lightning_rod"],
    "garden": ["grass_block", "moss_block", "oak_leaves", "flowering_azalea"],
    "lamp": ["lantern"]
  },
  "objects": ["white_wall_banner", "blue_wall_banner", "red_wall_banner", "yellow_wall_banner", "green_wall_banner"]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which replaces build.nbt only once the build finished.
set -eu
cd "$(dirname "$0")"
tmp="build.nbt.tmp.$$"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// 30 Rockefeller Plaza: lay the ground, then run every part in plan.md's order. Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, inLot, groundLevel } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

const PARTS = [
  ["Massing and shell", "./parts/massing.mjs"],
  ["Tower facades", "./parts/tower-facade.mjs"],
  ["Wings and shopfronts", "./parts/wings.mjs"],
  ["Setbacks, decks and crown", "./parts/crown.mjs"],
  ["GE crown sign", "./parts/ge-sign.mjs"],
  ["East entrance, marquee and flags", "./parts/entrance.mjs"],
  ["Roof gardens and grounds", "./parts/grounds.mjs"],
  ["Lamplighting and checks", "./parts/lights.mjs"],
];

// A part whose file is missing or fails to load (its worker is still writing it) is left empty, not fatal.
// A part that throws keeps what it placed and says so.
async function loadPart(name, file) {
  let build;
  try { ({ build } = await import(file)); } catch (e) {
    console.log(`part ${name}: not loaded (${String(e.message).split("\n")[0]}); left empty`);
    return () => {};
  }
  return (g) => {
    try { build(g); } catch (e) { console.log(`part ${name}: FAILED (${String(e.message).split("\n")[0]}); kept what it placed`); }
  };
}

// Ground: stone below the walk level, a smooth stone skin at it, only inside the lot.
function ground() {
  const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
  for (let x = 0; x < SITE[0]; x++) for (let z = 0; z < SITE[2]; z++) {
    if (!inLot(x, z)) continue;
    const walk = groundLevel(x, z);
    for (let y = 0; y < walk; y++) g.set(x, y, z, y === walk - 1 ? "smooth_stone" : "stone");
  }
  return g;
}

const parts = [];
for (const [name, file] of PARTS) parts.push([name, await loadPart(name, file)]);
const run = (roof) => {
  const g = ground();
  runParts(g, parts, { palette: "palette.json", roof });
  return g;
};
// The roof is laid right after the massing part, and the toolkit needs walls to roof: while the massing is still a
// stub there are none, so the build goes on without the roof rather than failing.
let g;
try { g = run("roof.json"); } catch (e) {
  if (!/no walls found/.test(e.message)) throw e;
  console.log("roof: no walls yet (massing not built); this build has no roof");
  g = run(undefined);
}
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Palette, site coordinates and a seeded rng for 30 Rockefeller Plaza (plan.md). Palette ids are palette.json's only.

// ---- palette (named constants; ids match palette.json) ----

// ---- palette (named constants; ids match palette.json) ----
export const LIMESTONE = "white_terracotta";              // body, piers, corners, parapets, fascia

export const COPING_STAIRS = "smooth_sandstone_stairs";   // ledge edges, copings (face outward)

export const COPING_SLAB = "smooth_sandstone_slab";       // string courses, deck caps

export const SPANDREL = "gray_terracotta";                // window spandrel course

export const WINDOW_DARK = "gray_stained_glass_pane";     // dark window glass (over BACKING_DARK)

export const BACKING_DARK = "black_concrete";             // behind dark glass

export const WINDOW_LIT = "yellow_stained_glass_pane";    // lit window glass (over SHROOMLIGHT)

export const SHROOMLIGHT = "shroomlight";                 // lit backing, floodlights, interior glow

export const SHOP_PANE = "glass_pane";                    // shop and lobby glass

export const GLASS = "glass";                             // glass-block screen

export const BRONZE = "polished_blackstone";              // frames, transoms, door frames

export const BRONZE_STAIRS = "polished_blackstone_stairs";

export const BRONZE_SLAB = "polished_blackstone_slab";

export const BRONZE_WALL = "polished_blackstone_wall";    // lamp posts

export const PLINTH = "polished_andesite";                // plinth course, deck curbs, paving

export const PLINTH_SLAB = "polished_andesite_slab";

export const DECK = "smooth_stone";                       // decks, paving

export const DECK_SLAB = "smooth_stone_slab";

export const SIGN_RED = "red_stained_glass";              // GE letters

export const GOLD = "gold_block";                         // WISDOM rays, dividers, crown

export const YELLOW_TERRACOTTA = "yellow_terracotta";     // WISDOM background

export const LIGHT_BLUE_TERRACOTTA = "light_blue_terracotta"; // WISDOM clouds

export const CYAN_TERRACOTTA = "cyan_terracotta";         // WISDOM cloud shade

export const SMOOTH_QUARTZ = "smooth_quartz";             // WISDOM figure

export const BLACK_TERRACOTTA = "black_terracotta";       // WISDOM inscription board

export const IRON_BARS = "iron_bars";                     // mast

export const LIGHTNING_ROD = "lightning_rod";             // mast tip

export const GRASS = "grass_block";                       // garden beds

export const MOSS = "moss_block";

export const OAK_LEAVES = "oak_leaves";                   // hedges (persistent)

export const AZALEA = "flowering_azalea";

export const LANTERN = "lantern";                         // hanging false; never chain

export const BANNERS = {                                  // flags, facing outward

// ---- site (plot-local blocks; y 0 = lowest ground) ----
export const SITE = [146, 246, 54];                       // grid size x, y, z

export const CAP_Y = 245;                                 // nothing above this y

export const MIRROR_Z = 27.5;                             // N and S boxes mirror: z <-> 55 - z

export const GE_SIGN = { x: [76, 103], y: [197, 209], z: [12, 43] };   // N face z12, S face z43

export const WISDOM = { x: [144, 145], y: [3, 27], z: [20, 35] };      // east entrance frame

export const PORTAL_Z = [[21, 23], [26, 29], [32, 34]];   // east portals (x145, y3..9)

export const MARQUEE = { x: [68, 79], y: [12, 15], z: [0, 3] };

export const PENTHOUSE = { x: [96, 119], y: [233, 236], z: [25, 30] };

export const MAST = { x: [107, 108], y: [237, 244], z: [27, 28] };

// Walk level (the y the feet stand on) at a column: solid ground fills below it, plinths rise from it.
export function groundLevel(x, z)

// Footprint (the lot): false outside it. Blocks x, z; 4x4-block cells (row r = z 4r..4r+3).
export function inLot(x, z)

// ---- seeded rng: rng(seed)() returns a float in [0, 1) (mulberry32; same seed, same sequence) ----
export function rng(seed)
```

### vocab/h1.mjs

```js
// VOCABULARY helpers 1 (plan.md): box, flute, shopBay, deckParapet, geSign, glassScreen, marquee, parapet, lampPost.
// Each takes its own position (and face or facing) as arguments and writes only inside the footprint it is given.
// It writes only into air unless { over: true }, which a dressing helper needs to sit on a shell it was built over.
// Refused cells are returned (placed / refused), never thrown.

/** box(g, [x0,y0,z0,x1,y1,z1], block, { hollow, over }): a solid box; hollow: true (3 thick) or n = a shell n thick on every face. */
export function box(g, b, block, { hollow = false, over = false } = {})

/** flute(g, face, [a0, a1], yFrom, yTo, storeyH, spandrelGap = 1, { over, lowerBelow = 135 }): the fluted grammar on one face.
 *  Even cells are piers (white_terracotta on layers 0, -1, -2); odd cells are recesses (nothing on layer 0), a glass strip on
 *  -1 and a backing on -2. Storeys are storeyH rows from yFrom; the top spandrelGap rows of each are spandrel. The two cells
 *  at each end are solid pier on layers 0 and -1. */
export function flute(g, face, [a0, a1], yFrom, yTo, storeyH, spandrelGap = 1, { over = false, lowerBelow = 135 } = {})

/** shopBay(g, face, at, wallY0, topY, { door, over, fascia }): one 3-wide shop bay, cells at+1..at+3, with the pier at `at`.
 *  Shop storey wallY0..transom with a polished_blackstone sill and transom, glass_pane on -1, shroomlight behind on -2; fascia of
 *  `fascia` rows (default 2 at the tower base, topY >= 13, else 1) of white_terracotta, and a smooth_sandstone_slab (top) string
 *  course at topY. door: a 2 wide x 3 tall air opening (framed in polished_blackstone) in the bay. */
export function shopBay(g, face, at, wallY0, topY, { door = false, over = false, fascia } = {})

/** deckParapet(g, [x0, z0, x1, z1], topY, { over, lanternEvery = 6 }): a Top of the Rock deck. smooth_stone at topY; the outer
 *  ring is a polished_andesite_slab (top) curb with glass_pane two high on it; a lantern on the deck just inside the curb every
 *  lanternEvery cells. */
export function deckParapet(g, [x0, z0, x1, z1], topY, { over = false, lanternEvery = 6 } = {})

/** geSign(g, face, x0, x1, y0, y1, { over }): the red GE on a north or south face (face = { side, line }). Layer -1 is shroomlight
 *  over the band, layer 0 a white_terracotta board; plaque sets the letters in red_stained_glass, reading GE from outside. */
export function geSign(g, face, x0, x1, y0, y1, { over = false } = {})

/** glassScreen(g, x, z0, z1, y0, y1, { over }): a glass-block screen on the plane x. glass; yellow_stained_glass_pane on every 4th
 *  column and row; a polished_blackstone frame round the edge; shroomlight behind it at x - 1 on every 4th column. */
export function glassScreen(g, x, z0, z1, y0, y1, { over = false } = {})

/** marquee(g, [x0,y0,z0,x1,y1,z1], facing, { over }): a canopy over an entrance. white_terracotta on the top row; a
 *  polished_blackstone_stairs fascia along the facing edge under it; a lit soffit, shroomlight on every 2nd cell. */
export function marquee(g, b, facing, { over = false } = {})

/** parapet(g, [x0, z0, x1, z1], topY, { over }): a flat roof's edge. white_terracotta course at topY+1 round the rectangle's edge,
 *  smooth_sandstone_slab (bottom) coping at topY+2; shroomlight in the deck (at topY, inside the edge) every 6 cells. */
export function parapet(g, [x0, z0, x1, z1], topY, { over = false } = {})

/** lampPost(g, x, y, z, { over }): a polished_blackstone_wall post two high with a lantern on top. */
export function lampPost(g, x, y, z, { over = false } = {})
```

### vocab/h2.mjs

```js
// VOCABULARY helpers 2 (plan.md): groundDown, windowCell, ledge, mast, portal, wisdomPanel, flagRow, gardenBed, paving.
// Each takes its own position (and face, where it has one) as arguments and writes only inside the footprint it is given.
// It writes only into air unless { over: true }. Refused cells are returned (placed / refused), never thrown.

/** White_terracotta plinth from the ground up to topY under every column of x0..x1, z0..z1 (carried down, no gap). */
export function groundDown(g, x0, z0, x1, z1, topY, { ground = groundTop, over = false } = {})

/**
 * One window on a face: the d=0 cell (face.line, along a, at y) is the recess and stays air. Glass rows at d=-1
 * (gray pane over black_concrete, or yellow pane over shroomlight when lit), a spandrel row above them.
 * glass: 2 for a tower storey (3 high), 3 for a wing storey (4 high).
 */
export function windowCell(g, face, a, y, lit, { glass = 2, over = false } = {})

/**
 * A setback deck. box = the lower mass (its y is ignored: the deck is course topY), upper = [x0, z0, x1, z1], the wall
 * rising from it; the deck is the ring of the box beyond that wall. Deck smooth_stone at topY; the outer edge (the side
 * facing outDir) gets smooth_sandstone_stairs facing outDir at topY+1; shroomlight replaces the deck every `step`
 * cells along the upper wall's base. (Outer corners are plain stairs, not outer-corner shapes.)
 */
export function ledge(g, box, topY, outDir, step, { upper = null, over = false } = {})

/**
 * The crown mast on the 2x2 footprint whose corner is (x, z): iron_bars y0..y0+6, lightning_rod on top at y0+7.
 * pent = [x0, z0, x1, z1] (optional) is the penthouse under it: white_terracotta walls y0-4..y0-1 with a glass_pane
 * band at y0-3 (corners solid), a smooth_sandstone_slab bottom cap at y0 (not under the mast), and a lantern on each
 * cap corner. Needs the C1 deck under it (the caller's).
 */
export function mast(g, x, z, y0, { pent = null, over = false } = {})

/**
 * An opening width x height on a face, centred on along-face coordinate a, bottom row y0 (the plane cells, depth 0).
 * polished_blackstone jambs, an upside-down polished_blackstone_stairs lintel on the top row, glass_pane doors inside,
 * and a shroomlight one cell behind the middle (the lit lobby). Footprint includes that one inner cell.
 */
export function portal(g, face, a, y0, width, height, { over = false } = {})

/**
 * The 16 x 11 WISDOM panel: yellow_terracotta background on the face line (a0..a0+15, y0..y0+10), the gold, quartz
 * and terracotta relief one cell outside it. An approximation of the plan's motif (rays, clouds, figure, dividers, rim).
 */
export function wisdomPanel(g, face, a0, y0, { over = false } = {})

/**
 * Five wall banners in colour order, 2 apart along the face, centred on along-face coordinate a, at y. Each hangs
 * on the face line (depth 0) from one cell outside it (depth 1 by default), facing out.
 */
export function flagRow(g, face, a, y, { depth = 1, over = false } = {})

/**
 * A roof bed on rect = [x0, z0, x1, z1] with its base at y: grass_block with moss patches; a 1-high oak_leaves hedge
 * (persistent) on the border; a 2-wide smooth_stone path across the middle (open to the hedge at both ends); flowering
 * azalea 1 in 5 inside; a polished_blackstone_wall post beside the path with a lantern on top. The path lane stays
 * clear 2 high. Needs at least 4 cells in z for the path and post.
 */
export function gardenBed(g, rect, y, { over = false } = {})

/** Chequer of smooth_stone and polished_andesite on rect = [x0, z0, x1, z1] at level y (the caller's ground line). */
export function paving(g, rect, y, { over = false } = {})
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
