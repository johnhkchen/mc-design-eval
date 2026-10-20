# Golden Gate Bridge kit (1937): south tower + suspension span, 0.5 blocks/m

## SITE

A kit of four modules (plots along x; every coordinate is LOCAL to its module). The bridge runs north-south along z (north = low z). y 0 = the water surface: nothing at y 0, no ground course; every cell not listed stays air. Minecraft 1.21.1 blocks only.

Shared cross-section (each plot's own x; plot 0 adds +16):

| role | y | x (plots 1-3) | x (plot 0) |
|---|---|---|---|
| railing + lamp level (stand y 39) | 39 | 0, 14 | 16, 30 |
| road surface | 38 | 3..11 | 19..27 |
| sidewalks | 38 | 1..2, 12..13 | 17..18, 28..29 |
| edge girder | 38 | 0, 14 | 16, 30 |
| deck plate (closed underside of road) | 37 | 1..13 | 17..29 |
| truss top chord | 37 | 0, 14 | 16, 30 |
| Warren diagonals | 35..36 | 0, 14 | 16, 30 |
| floor beams | 35 | 1..13 | 17..29 |
| bottom chord + lateral bracing | 34 | 0..14 | 16..30 |

Warren pattern on each outer face (period 4, tiles every 16): z mod 4 = 1 -> y 35; = 2 -> y 36; = 3 -> y 35; = 0 -> open (node on the bottom chord). Floor beams at z mod 4 = 0, each with a shroomlight at its centre cell (x 7; plot 0 x 23). Lateral bracing at y 34 (diamonds in plan): line A x = 1 + round(z*12/7) for z 0..7, x = 13 - round((z-8)*12/7) for z 8..15, line B x = 14 - A; fill the run between consecutive z so each line is unbroken.

### Plot 0: south tower, x 0..46, z 0..23, y 1..116

| mass | x | y | z |
|---|---|---|---|
| fender ring (elliptical, 2 thick) | 0..46 | 1..3 | 0..23 |
| pier | 11..35 | 1..5 | 5..18 |
| west leg stage S1 | 14..18 | 6..54 | 8..15 |
| west leg stage S2 | 14..18 | 55..79 | 9..14 |
| west leg stage S3 | 15..18 | 80..104 | 10..13 |
| west leg stage S4 | 15..18 | 105..112 | 10..13 |
| east leg (mirror x' = 46 - x) | S1/S2 28..32, S3/S4 28..31 | same | same |
| bottom tie beam | 19..27 | 6..7 | 10..13 |
| X cross brace (two diagonals, 4 deep) | 19..27 | 8..27 | 10..13 |
| lower portal strut (carries the deck) | 19..27 | 28..33 | 10..13 |
| deck (cross-section above) z 0..7 and 16..23 | 16..30 | 34..39 | 0..7, 16..23 |
| deck through the portal (road + floor beams only, bearing on legs) | 19..27 | 34..38 | 8..15 |
| strut 1 | 19..27 | 55..60 | 10..13 |
| strut 2 | 19..27 | 72..77 | 10..13 |
| strut 3 | 19..27 | 90..95 | 10..13 |
| top strut | 19..27 | 106..112 | 10..13 |
| top strut crown | 19..27 / 21..25 | 113 / 114 | 10..13 / 11..12 |
| west walkway platform (y 38) | 12..18 | 38 | 6..7 and 16..17 |
| west walkway along leg | 12..13 | 38 | 8..15 |
| east walkway (mirror) | 28..34 / 33..34 | 38 | as west |
| walkway edge girder + railing outline | x 16 z 0..5 -> z 5 row x 11..16 -> x 11 z 5..18 -> z 18 row x 11..16 -> x 16 z 18..23 (east mirror x 30 / 35) | 38 girder, 39 railing | |
| walkway corbels | 12..13 | 37 | 8, 11, 12, 15 |

- Fender ring: a cell (x, z) is ring if inside ((x-23)/23.5)^2 + ((z-11.5)/12)^2 <= 1 and outside ((x-23)/21.5)^2 + ((z-11.5)/10)^2 <= 1. Air (the sea) between ring and pier.
- X brace: diagonal 1 cells at x = 19 + round((y-8)*8/19) for y 8..27, diagonal 2 at x = 46 - that; each cell 4 deep (z 10..13); where consecutive y jump 2 in x, fill the gap cell.
- Strut haunches (Art Deco stepped portal corners) under each of struts 1-3 and the top strut: row bottom-1: x 19..20 and 26..27; row bottom-2: x 19 and 27 (z 10..13).
- Tower top caps (west; east mirror x' = 46 - x): y 112 leg top course with x 16 left OPEN (z 10..13); y 113 x 15, 17, 18 (x 16 open) = saddle housing walls; y 114 x 15..18 z 10..13 solid = saddle housing roof over the cable groove; y 115 x 16..17 z 11..12 (glowstone at x 16, orange_terracotta at x 17); y 116 red_stained_glass at x 16 z 11..12 = red aircraft warning light. East: groove x 30, y 115 x 29..30 (glowstone x 30), y 116 x 30.

### Plot 1: deck section, x 0..14, z 0..15, y 34..44 only

The shared cross-section, z 0..15, tiling end to end (every layer is continuous through z 0 and z 15). Suspender anchor brackets: x 0 and x 14, z 0, 4, 8, 12, y 38..39 (orange_concrete). Lamps (pair) at x 1 and x 13, z 8: y 39 orange_terracotta base, y 40..41 red_sandstone_wall shaft, y 42 lantern standing on it. Lane lines in the road: x 7 yellow_concrete continuous; x 5 and x 9 white_concrete dashes at z 0..3 and 8..11. Keep x 0 / x 14, y 40..44 clear everywhere (suspenders land there).

### Plot 2: main-span cables, x 0..14, z 0..248, y 40..116

Only the two cables (x 0, x 14) and suspenders. f(z) = 41.9 + 0.00069 (z+72)^2; base = floor(f). Cable body full block at (x, base, z); if f - base >= 0.5 add a bottom smooth_red_sandstone_slab at base+1. Slope < 1 everywhere, so one body cell per z is already 8-connected. Cable bands: at z mod 4 = 0 the body block is orange_concrete. Suspenders: z = 0, 4, ..., 248, both lines, red_stained_glass_pane from y 40 up to base-1. Checks: z 0 -> 45 + slab 46; z 248 -> 112 + slab 113.

### Plot 3: side-span cables, x 0..14, z 0..231, y 36..116

Only the cables and suspenders. u = z + 0.5; z 0..171: f = 112.8 - 0.6475u + 0.001165u^2, same body/slab/band rule as plot 2 (z 0 -> 112 + slab; z 171 -> 36). z 172..231: body level at y 36, no slab, bands at z mod 4 = 0; z 231 ends against the anchorage pylon (other kit). Suspenders at z 12, 16, ..., 168 only, from the bottom y (z 12..43: 40; 44..75: 39; 76..107: 38; 108..139: 37; 140..171: 36) up to base-1; none where bottom > base-1.

## ROOFS

No roof (not a building): no `$MCD roof` preset. The tower's roofs are the hand-built stepped caps and the saddle housings (plot 0, listed above). Every setback ledge left by a stage step (S1->S2 at y 55 on z 8 and z 15; S2->S3 at y 80 on x 14 / x 32 and z 9 / z 14) is covered with a bottom smooth_red_sandstone_slab course (a shadow line, and nothing spawns on a bottom slab).

## FACADES

Tower legs (every face): riveted-cell fluting by exclusion. Ribs flush, panels recessed 1 (front cell left out, red_terracotta behind).
- S1 north/south faces (z 8 / z 15): ribs x 14, 16, 18; recesses x 15, 17. West/east faces (x 14 / x 18; east leg x 28 / x 32): ribs z 8, 10, 13, 15; recesses z 9, z 11..12, z 14.
- S2 north/south (z 9 / z 14): recesses x 15, 17. Side faces: ribs z 9, 11, 12, 14; recesses z 10, 13.
- S3/S4 north/south (z 10 / z 13): recess x 16..17 (east x 29..30). Side faces: recess z 11..12.
- Recesses run only between band courses; bands are solid orange_concrete courses at y 6..7 (plinth), 53..54, 78..79, 103..104, 111. Faces against the deck, walkways and struts stay solid where they meet.
- Struts 1-3 and top strut, north face z 10 and south face z 13: recessed frame x 21..25 over the strut's inner rows (strut 1 y 56..59, 2 y 73..76, 3 y 91..94, top y 107..111), front cell out, red_terracotta behind; inside it a raised panel back at the face, orange_concrete, x 22..24 over the middle rows (y 57..58, 74..75, 92..93, 108..110). Strut tops: shroomlight flush at x 23 z 11..12 (y 60, 77, 95; top strut on the crown at y 114).
- Lamp panels: shroomlight set in the legs' inner faces x 18 and x 28, z 11..12, y 40..41 (lights the portal roadway).
- Pier: light_gray_concrete body y 1..4, polished_andesite top course y 5. Fender: light_gray_concrete y 1..2, polished_andesite y 3.
- Deck: orange_terracotta chords and girders, red_terracotta diagonals and deck plate, orange_concrete brackets; railing red_sandstone_wall at y 39 along the girders between brackets (connects into one orange rail).

## MATERIALS

| role | block |
|---|---|
| steel body (legs, struts, chords, girders, cable body) | orange_terracotta |
| recess backs, truss diagonals, deck plate, X brace | red_terracotta |
| highlights: bands, raised strut panels, brackets, cable bands | orange_concrete |
| accent (sparingly: lower portal strut faces) | red_concrete |
| shaping slabs/stairs (cable half-steps, ledges, corbels) | smooth_red_sandstone_slab, smooth_red_sandstone_stairs |
| railing, lamp shafts | red_sandstone_wall |
| suspender ropes | red_stained_glass_pane |
| road | gray_concrete |
| lane lines | yellow_concrete (centre), white_concrete (dashes) |
| sidewalks, walkways | light_gray_concrete |
| pier / fender body | light_gray_concrete |
| pier / fender top course | polished_andesite |
| lamps | lantern |
| hidden lights | shroomlight |
| aircraft warning light | glowstone under red_stained_glass |

No wool, no copper, no chain. All ids pass `$MCD blocks --check`.

## OPENINGS

- Portal roadway: clear x 19..27, y 39..52, z 8..15 (strut 1 haunches start at y 53).
- Cable grooves: x 16 and x 30, y 112..113, z 10..13 open through the tower top.
- Below deck: everything between the legs not in the X brace, tie or lower strut is air.

## RESERVED

- Plot 0: x 16 and x 30, y 112..113 (all z) left empty for the cables.
- Plot 1: x 0 and x 14, y 40..44 (all z) clear for the suspenders; brackets at z 0, 4, 8, 12 are their seats.
- Plots 2/3: nothing but cables and suspenders; no deck, no railing.

## FLOORS

| level | y | where |
|---|---|---|
| road / sidewalk surface (people stand at 39) | 38 | plot 0 x 16..30 (+ walkways x 11..18, 28..35), plot 1 x 0..14 |
| pier top | 5 | plot 0 x 11..35, z 5..18 |
| fender top | 3 | plot 0 ring |

Lighting: deck lamps at z 8 (plot 1), walkway lamps (as plot 1 lamps) at plot 0 (12,6), (12,17), (34,6), (34,17); lanterns on the pier top at (11,5), (23,5), (35,5), (11,18), (23,18), (35,18), y 6; lanterns on the fender top y 4 at (0,11), (46,12), (23,0), (23,23), (3,7), (43,7), (3,16), (43,16), (15,1), (31,1), (15,22), (31,22).

## PALETTE

Every id passes `$MCD blocks --check`. Roles as MATERIALS above, plus variants:
- steel: orange_terracotta; backs/diagonals: red_terracotta; highlights: orange_concrete; accent: red_concrete
- shaping: smooth_red_sandstone_slab (type bottom), smooth_red_sandstone_stairs
- rails/lamp shafts: red_sandstone_wall (connected states set by neighbours; up true on posts)
- ropes: red_stained_glass_pane (connection states along neighbours: vertical ropes stay as thin posts, no side connections)
- road gray_concrete; lines yellow_concrete, white_concrete; sidewalks/pier/fender light_gray_concrete; top course polished_andesite
- light: lantern (hanging false), shroomlight, glowstone, red_stained_glass
No wool, no pale oak, no iron_chain.

## VOCABULARY

- legStage(g, side, y0, y1, x0, x1, z0, z1): solid orange_terracotta box of the stage; side "west" or "east" mirrors x' = 46 - x.
- fluteFace(g, face, y0, y1, ribs, recesses): for each recess column/row, place red_terracotta one cell behind the face line and leave the front cell air; ribs stay orange_terracotta. Only between band courses.
- bandCourse(g, y, box): orange_concrete full course across the leg box.
- portalStrut(g, yBottom, yTop, haunches): orange_terracotta box x 19..27 z 10..13; haunch rows under it (bottom-1 x 19..20, 26..27; bottom-2 x 19, 27); recessed frame x 21..25 on z 10 and 13 (front out, red_terracotta behind), orange_concrete panel x 22..24; shroomlight at x 23 z 11..12 on top.
- xBrace(g): two red_terracotta diagonals, x = 19+round((y-8)*8/19) and mirrored 46-x, z 10..13, fill x gaps.
- fenderRing(g): ellipse test from plan.md, light_gray_concrete y 1..2, polished_andesite y 3.
- saddleCap(g, side): y112 course with groove open, y113 walls, y114 roof, y115 glowstone + orange_terracotta, y116 red_stained_glass.
- deckSection(g, xOff, z0, z1): full cross-section from the SITE table (xOff 0 or 16): rows by role, Warren pattern by z mod 4, floor beams + shroomlight at z mod 4 = 0, lateral bracing lines A and B at y 34 filled between z; railing wall y 39; brackets orange_concrete at z%4=0 on x 0/14.
- walkway(g, side): light_gray_concrete y 38 platforms and strip, corbels y 37 (smooth_red_sandstone_stairs upside down), girder x 16 outline with railing y 39.
- deckLamp(g, x, z): y39 orange_terracotta, y40..41 red_sandstone_wall, y42 lantern standing.
- cableCell(g, x, z, f): base=floor(f): full block at base (orange_concrete if z%4==0 else orange_terracotta); if f-base>=0.5 a bottom smooth_red_sandstone_slab at base+1.
- suspender(g, x, z, yBottom, yTop): red_stained_glass_pane column.
- lanternAt(g, x, y, z): lantern on a solid block.

## ROOMS

None: a bridge, no interiors. Walkable surfaces: deck road/sidewalk y 38 (stand 39), walkways, pier top y 5, fender top y 3.

## PARTS

1. Tower massing (parts/tower.mjs): fender, pier, legs S1..S4, tie, X brace, lower strut, struts + haunches + crown, saddle caps.
2. Tower skin (parts/tower-skin.mjs): fluting by exclusion, bands, strut frames/panels, ledge slabs, lamp panels.
3. Deck (parts/deck.mjs): plot 1 whole section, plus plot 0 deck through the tower and walkways.
4. Cables (parts/cables.mjs): plots 2 and 3 cables and suspenders.
5. Lights and trim (parts/trim.mjs): lamps, lanterns, check nothing spawns.

## Notes for workers

- Plots 1-3 are local x 0..14; plot 0 deck is +16. Keep y 0 empty and nothing above stated heights.
- Keep x 16 and x 30 y 112..113 open in plot 0. Keep x 0/14 y 40..44 clear in plot 1.
- Deck section must tile: every layer continuous at z 0 and z 15.
- Cable must be 8-connected; verify by listing cells per z.
- Recesses are made by NOT placing the front block.
