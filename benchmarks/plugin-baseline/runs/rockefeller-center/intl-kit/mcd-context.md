# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Rockefeller Center, Fifth Avenue front — architect's plan

Three modules, each in its OWN LOCAL frame (x 0 = west edge of the plot, z 0 = north edge, y 0 = its lowest ground).
Kit offsets: plot 0 local = kit x 0..83; plot 1 local x 0..53 = kit x 88..141; plot 2 local x 0..53 = kit x 146..199.
Manhattan grid square to the axes: north = low z, south = high z, **Fifth Avenue = EAST (high x)** — the principal
fronts face EAST, not north. Built in site orientation; nothing turned.

Conventions: "deck" = the roof block course; "coping" = the parapet's top course (1 above the deck unless said).
Ground course = the block at y = GROUND value of the cell (paving, plinth); people walk at GROUND+1.
Storey module (all three plots, same so the ensemble reads as one complex): spandrel rows at y 7,10,13,…(y ≡ 1 mod 3),
glass rows the two above each (y ≡ 2, 0 mod 3). Ground storey y 2..6 (shop glass y 2..5, bronze fascia y 6).

## SITE

### Plot 0 — International Building, Fifth Ave wings, Atlas (local x 0..83, z 0..54, max y 155)
Ground 0 west of x ≈ 37, 1 east of it (one 2 at x 74..75 z 16..17: pave over at 2, flush). Lot is the footprint map;
cut corners: x 0..3 z 0..1, x 0..1 z 2..3; SW notch x 0..19 z 46..49, x 0..21 z 50..51, x 0..29 z 52..54;
**forecourt notch x 72..83 z 20..35 is OFF the footprint (city sidewalk/plaza): build nothing there.**
Streets: 51st St along z 0 (north), 50th St along z 54 (south), Fifth Ave along x 83 (east).

| mass | x | z | y (ground..deck / coping) | what |
|---|---|---|---|---|
| T1 tower core | 0..61 | 18..37 | G..141 / 142 | 41-storey slab, full height, long along x |
| T2N / T2S slabs | 0..39 | 12..17 / 38..43 | G..131 / 132 | flanking slabs, first setback |
| T3N / T3S steps | 40..47 | 12..17 / 38..43 | G..104 / 105 | second step east |
| T4N / T4S steps | 48..53 | 12..17 / 38..43 | G..58 / 59 | third step east |
| PH penthouse | 14..47 | 22..33 | 142..147 / 148 | low limestone penthouse on T1 (top y 148 < 155) |
| A west low | 4..29 z0..1, 2..29 z2..3, 0..19 z4..7 | 0..7 | G..6 / 7 | two-storey shop block on 51st St |
| B north mid | 0..23 | 8..11 | G..35 / 36 | ten-storey block against T2N |
| B' south mid | 0..23 z44..45 + 20..23 z46..47 | 44..47 | G..35 / 36 | its twin against T2S |
| C1 north podium | 30..83 z0..11 + 20..29 z4..11 (minus B) | 0..11 | G..22 (street cornice) | six-storey street block, 51st St |
| C2 north wing (International Bldg North) | 62..83 | 12..19 | G..22 | Fifth Ave wing, its south face frames the forecourt |
| D1 south podium | footprint in x 20..83 z 44..54 minus B' | 44..54 | G..22 | six-storey street block, 50th St (stepped SW edge follows footprint) |
| D2 south wing (Palazzo d'Italia) | 62..83 | 36..43 | G..22 | Fifth Ave wing, north face frames the forecourt |
| SN setback storey north | 32..81 z2..11, 22..31 z6..11, 62..81 z12..17 | — | 23..25 glass, deck 26 / coping 27 | set back 2 from every street/forecourt face |
| SS setback storey south | 62..81 z38..43, 26..81 z44..49, 32..81 z50..52 | — | 23..25, deck 26 / 27 | same, south |
| IN / IS inner bands | 24..57 | 8..11 / 44..47 | 26..28 / coping 29 | one more step up beside the tower (lidar 29) |
| E entrance portal | 58..62 | 20..35 | G..17 / 18 | monumental limestone portal, face at x 62; T1 rises behind from y 19 |
| F Atlas forecourt (open to sky) | 63..71 | 20..35 | paving y 1 | granite paving, Atlas on the axis z 27.5 |
| GN roof garden north | 58..81 | 2..17 | on deck 26 | International Bldg North garden |
| GS roof garden south | 58..81 | 38..52 | on deck 26 | Palazzo d'Italia garden |

ATLAS (in F, facing EAST to Fifth Ave, axis z 27/28):
| part | cells | material |
|---|---|---|
| plinth | x 64..70, z 24..31, y 2..5 (y 2 base course, y 5 cap course stepping in 0) | polished_deepslate base, polished_andesite body, smooth_stone cap |
| figure (kneeling on right knee, facing +x, back bent, arms up) | envelope x 65..69, z 25..30, y 6..15; torso x 66..68 z 26..29 y 9..13; head x 67..68 z 27..28 y 13..14 bowed toward +x; forward knee/foot at x 69; arms from shoulders (z 25 and z 30, y 13) up to hands at y 14..15 under the sphere | brown_terracotta (dark bronze body), waxed_weathered_cut_copper highlights on shoulders/thighs (≤20%) |
| armillary sphere (rings, 1 block thick, hollow) | centre (x 67, y 16, z 27.5); extent x 63..71, y 12..20, z 23..32 | waxed_exposed_cut_copper rings |
| — ring 1 meridian (faces Fifth Ave) | circle in the y–z plane at x 67 | |
| — ring 2 equator | ellipse in the x–z plane at y 16 | |
| — ring 3 meridian | circle in the x–y plane at z 27 and 28 | |
| — ring 4 ecliptic band | tilted ring through the centre, low at z 23 (y 13), high at z 32 (y 19), 1 wide | waxed_exposed_copper (slightly different tone) |
| — axis | straight line through the centre from (67,12,24) to (67,20,31), stub 1 beyond each ring end | waxed_exposed_cut_copper, lightning_rod as the end stubs |
| pylons (granite) | x 66..68, z 20..21 and z 34..35, y 2..17, coping slab at y 17 | polished_andesite, polished_deepslate base course y 2 |
| uplights | ochre_froglight flush in the paving at (63,1,23) (63,1,32) (71,1,23) (71,1,32) and at the foot of each pylon (69,1,20) (69,1,35) | |

### Plot 1 — British Empire Building (local x 0..53, z 0..18, max y 50)
Ground 0..2 rising east (east end on Fifth Ave = 2; garden face z 18: x 0..17 = 0, x 18..41 = 1, x 42..53 = 2).
North face z 0 on 50th St; SOUTH face z 18 on the Channel Gardens; EAST end x 53 on Fifth Ave.

| mass | x | z | y | what |
|---|---|---|---|---|
| S body (six storeys) | 0..53 | 0..18 | G..22 | street block; cornice band y 22 |
| ledges (terraces) | 0..53 z 0..1 and z 17..18; 52..53 z 2..16 | — | deck 22 / coping 23 | 2-wide planted ledge round the setback |
| U east setback storey | 26..51 | 2..16 | 23..25 glass, deck 26 / coping 27 | "deeper setback top storey"; roof garden on it |
| PH east penthouse | 26..33 | 5..13 | 27..30 / 31 | small stair/lift house |
| W west tall | 0..25 | 2..16 | 23..33 / 34 | rises to lidar 34 |
| W2 west top | 0..25 | 4..14 | 34..36 / 37 | top step (lidar 36..37) |
| GB roof garden | 34..51 z 2..16 + 26..33 z 2..4 and z 14..16 | — | on deck 26 | lawns, hedges, beds, gravel paths, small trees |
| E entrance (Fifth Ave) | 51..53 | 6..12 | 3..17 | recessed door bay + gilded panel (see OPENINGS) |

### Plot 2 — La Maison Française (local x 0..53, z 0..18, max y 50)
Ground 0..2 rising east (garden face z 0: x 0..17 = 0, x 18..41 = 1, x 42..53 = 2).
NORTH face z 0 on the Channel Gardens; south face z 18 on 49th St; EAST end x 53 on Fifth Ave.
Massing IDENTICAL to plot 1 (the twins): same table, same coordinates (it is symmetric in z about z 9), so the
two read as a matched pair across the gardens. Only the ornament differs (FACADES).

## ROOFS
All roofs are FLAT (Art Deco setback skyscraper and its low buildings): `$MCD roof` style `flat-parapet`
(preset family `modern` WITHOUT its iron-bar rail; no rail anywhere — these roofs show a clean limestone coping).
The shell builds each deck + parapet with its mass; no pitched roof anywhere.
| roof | deck y | coping y | surface | lighting (ochre_froglight flush in the deck) |
|---|---|---|---|---|
| T1 core | 141 | 142 | smooth_stone; PH on it | row along the foot of PH every 3, 1 in from the parapet every 6 |
| PH | 147 | 148 | smooth_stone; 4 floodlight blocks at corners | floodlit crown: froglights at the PH corners |
| T2N/T2S | 131 | 132 | smooth_stone | row along the foot of T1's wall every 3 (floodlights the crown) |
| T3 | 104 | 105 | smooth_stone | along the foot of T2 every 3 |
| T4 | 58 | 59 | smooth_stone | along the foot of T3 every 3 |
| B, B' | 35 | 36 | smooth_stone | every 6 |
| A | 6 | 7 | smooth_stone, 2 vents | every 6 |
| podium ledges (2-wide round SN/SS) | 22 | 23 | grass_block + hedge line | lantern on fence post every 6 |
| SN/SS west of x 58 | 26 | 27 | gravel with planters | every 6 |
| IN/IS | 28 | 29 | smooth_stone | every 6 |
| GN/GS gardens | 26 | 27 | garden (below) | lanterns on posts every 6 along paths |
| E portal | 17 | 18 | smooth_stone | 2 froglights lighting T1's face |
| plot 1/2 ledges | 22 | 23 | grass + hedge | lanterns every 6 |
| plot 1/2 U garden | 26 | 27 | garden | lanterns every 6 |
| plot 1/2 PH | 30 | 31 | smooth_stone | 1 per corner |
| plot 1/2 W / W2 | 33 / 36 | 34 / 37 | smooth_stone | every 6 |
Roofs meet by abutment: a lower deck runs flat into the higher mass's wall; the coping runs only on open edges.
Every deck must reach light > 0 everywhere (no spawning): froglights or lanterns at most 12 apart.

ROOF GARDENS (GN, GS, plot 1/2 GB), by hand (no roof tool): deck = grass_block with ~1 in 8 moss_block patches; a
1-tall hedge of persistent azalea_leaves along the inner side of the coping; a gravel path ring 1 in from the hedge,
with a cross path on the long axis (2 wide); 4 rectangular flower beds (poppy, allium, cornflower, oxeye daisy,
tulips) in the quadrants; 2 small trees per garden (oak_log 3 tall + persistent oak_leaves crown 5 wide, flowering
azalea_leaves accents); fence-post + lantern every 6 along the paths. Nothing above y 32 on plots 1/2, above y 31 on GN/GS.

## FACADES
Principle (all faces of all masses): continuous vertical limestone PIERS from the plinth to the parapet, flush at
the face plane; between them recessed WINDOW STRIPS (recess 1): glass pane rows and dark spandrel rows stacked so
the strip reads as one dark vertical stripe. No horizontal bands except: plinth course, bronze fascia over the
shops (y 6), the six-storey cornice band (y 22), and each setback's parapet band. Restraint: Deco, not Baroque.

Rhythm: along x — piers on x ≡ 0 (mod 3), strips on x ≡ 1,2 (2 wide); along z — as listed per face. The last
column of every mass is a 2-wide corner pier (overrides the rhythm).
Tower east faces (z 18..37 core): corners z 18..19 and 36..37, piers z 20,23,26,29,32,35, strips 21-22,24-25,
27-28,30-31,33-34 (symmetric about z 27.5). Slab ends (T2–T4, z 12..17 / 38..43): corner piers at both ends,
pier at the middle, strips 13-14 and 15-16 (39-40 and 41-42).
Fifth Ave wing faces x 83: north wing z 0..19 — corners z 0..1, 18..19, piers 2,5,8,11,14,17, strips 3-4 … 15-16;
south wing z 36..54 — corners 36..37, 53..54, piers 38,41,44,47,50, strips 39-40 … 51-52.
Forecourt faces (C2 at z 19, D2 at z 36, x 63..83): piers x ≡ 0, strips x ≡ 1,2.
Plot 1/2 long faces: corners x 0..1 and 52..53, strips 2-3, 5-6, … 50-51, piers 4,7,…,49.
Plot 1/2 east end x 53: corners z 0..1, 17..18; side strips z 3-4 and 14-15 with piers 2,5 and 13,16; centre bay
z 6..12 = entrance.

| element | position | depth | material |
|---|---|---|---|
| plinth course | y = GROUND course, all faces | flush | polished_andesite |
| piers | full height | face plane (0) | smooth_sandstone |
| corner piers | 2 wide at every mass corner | 0 | smooth_sandstone, cut_sandstone every 4th course (quiet quoin) |
| window glass | strip cells on glass rows | −1 | glass_pane |
| behind glass | the cell behind each pane (−2) | — | ochre_froglight if LIT, gray_concrete if dark |
| spandrels | strip cells on spandrel rows | −1 | polished_deepslate |
| shopfronts | every strip bay of the ground storey on street + garden faces, y 2..5 | −1 glass, piers stay | glass_pane, lit back: ochre_froglight ceiling at y 6 behind the fascia, a display row at y 2 |
| bronze fascia / shop frame | y 6 across each shop bay, and the mullion cells | −1 | waxed_exposed_cut_copper |
| six-storey cornice band | y 22, all podium/plot 1-2 street faces | 0 (flush), slab coping y 23 on ledges | cut_sandstone, smooth_sandstone_slab coping |
| setback parapets | top course of each mass | 0 | smooth_sandstone, coping smooth_sandstone_slab (bottom) on decks with 1-high parapet |
| crown band T1 | y 139..142 all round, no windows | 0 | smooth_sandstone with cut_sandstone at the pier heads (y 139) |
| portal E (face x 62) | piers z 20..21, 24..26, 29..31, 34..35, y 2..17; lintel band y 16..17 z 20..35; coping y 18 | piers 0; window recess −2 (glass at x 60) | smooth_sandstone piers; lintel chiseled_sandstone at z 24..26 and 29..31 (pier heads), cut_sandstone else |
| portal windows | z 22..23, 27..28, 32..33, y 7..15 | glass at x 60 (−2), bronze mullion frame at x 61 edges | glass_pane; lobby behind lit (ochre_froglight ceiling y 16 inside x 50..59) |
| gilded relief panels | over each portal door: z 22..23, 27..28, 32..33, y 4..6, in the x 61 plane | −1 | gold_block + yellow_terracotta Deco pattern (rays/zigzag) |
| plot 1 east relief panel (British Empire) | x 53, z 6..12, y 11..17 (7×7) | 0, framed by a bronze border ring at x 53 | gold_block field with yellow_terracotta figures; waxed_exposed_cut_copper frame |
| plot 1 coat of arms | x 53, z 8..10, y 9..10 | 0 | gold_block, red_terracotta and blue_terracotta quarters |
| plot 2 east relief panel (France) | x 53, z 6..12, y 11..17 | 0 | gold_block + yellow_terracotta figures (two figures, rays), bronze frame |
| plot 2 emblem | x 53, z 8..10, y 9..10 | 0 | gold_block fleur-de-lis on blue_terracotta |
| plot 1/2 above panel | z 6..12, y 18..21 | 0 | solid smooth_sandstone (blank attic over the entrance) |
| shop name boards | fascia y 6 (sign writer, banner letters, material null) | — | on waxed_exposed_cut_copper |
| wall lamps | each side of every door at y 5, on the pier | +1 | lantern on a fence arm |

LIT WINDOWS: about 25% of glass bays (whole 2×2 window = one bay) lit, chosen irregularly (hash of x,y,z), a
little denser in the lower 15 storeys of T1 and in the setback storeys; never a whole floor lit.
Lobbies and shopfronts: ALL lit.

## MATERIALS
| role | block |
|---|---|
| limestone body, piers, parapets | smooth_sandstone |
| limestone trim: cornice band, quoin courses, lintel | cut_sandstone |
| carved accents (pier heads, portal lintel heads) | chiseled_sandstone |
| coping | smooth_sandstone_slab |
| plinth, Atlas pylons, plinth body | polished_andesite |
| dark base courses, spandrels | polished_deepslate |
| glass | glass_pane |
| dark office behind glass | gray_concrete |
| lit office / lobby / shop light | ochre_froglight |
| bronze (frames, fascias, doors' surround) | waxed_exposed_cut_copper |
| Atlas figure | brown_terracotta, waxed_weathered_cut_copper highlights |
| Atlas sphere rings / ecliptic / axis ends | waxed_exposed_cut_copper / waxed_exposed_copper / lightning_rod |
| gilding | gold_block, yellow_terracotta |
| heraldic colour (plots 1/2 only) | red_terracotta, blue_terracotta |
| roof decks | smooth_stone |
| forecourt paving | polished_andesite with smooth_stone joints every 3 |
| garden | grass_block, moss_block, gravel, azalea_leaves, flowering_azalea_leaves, oak_log, oak_leaves (persistent), flowers |
| doors | dark_oak_door in waxed_exposed_cut_copper frames (reads bronze) |
| roof/garden lamps | lantern on oak_fence posts (no chains: the toolkit's chain id is not the 1.21.1 `chain`; hang from iron_bars instead) |
All exist in 1.21.1 (checked with `$MCD blocks --check`; no pale oak, no 1.21.4+ blocks).

## OPENINGS
Plot 0
| opening | where | size |
|---|---|---|
| main entrance doors (3 pairs) | x 60 plane, z 22..23, 27..28, 32..33, y 2..3 | 2 wide × 2 tall each; the gilded panel sits above them at x 61, y 4..6 |
| portal tall windows | x 60, same z, y 7..15 | 2 × 9 |
| wing shop doors, Fifth Ave | x 83: z 9..10 (north wing), z 45..46 (south wing), y 2..3 | 2 × 2, floor y 1 = ground, level |
| shop doors 51st St | z 0: x 37..38, 52..53, 67..68, y 2..3 (A: x 13..14 at z 0, y 1..2) | 2 × 2 |
| shop doors 50th St | z 54: x 37..38, 52..53, 67..68, y 2..3 | 2 × 2 |
| shop windows | every strip bay of the ground storey on z 0, z 54, x 83, and A's z 0 face, y 2..5 (A: y 1..4) | 2 × 4 |
| office windows | every strip, every glass-row pair, all masses, all faces above the ground storey | 2 × 2 |
| setback storey windows | strips of SN/SS, y 23..25 | 2 × 3 |
Plot 1 and plot 2 (identical coordinates)
| opening | where | size |
|---|---|---|
| Fifth Ave entrance | recess x 51..53, z 7..11; doors (pair + side lights) at x 51, y 3..4 (floor 2 = ground 2, level); tall glass x 51 y 5..8 above the doors; bronze frame ring at x 52 | 5 × 6 opening |
| shop windows, garden face (plot 1 z 18, plot 2 z 0) and street face (plot 1 z 0, plot 2 z 18) | every strip bay, y 3..5 (x ≥ 18) / y 2..5 (x ≤ 17, floor 1) | 2 × 3/4 |
| shop doors, garden face | x 44..45 and x 26..27 (2 slab ramp cells at x 26..27, ground 1 → floor 2) y 3..4 | 2 × 2 |
| shop doors, street face | x 44..45, y 3..4 | 2 × 2 |
| office windows | every strip, glass pairs (8,9)…(20,21); setback storey y 23..25; W y 23..24, 26..27, 29..30; W2 y 34..35 | 2 × 2 / 2 × 3 |
Later parts only ADD into air: the shell leaves every opening above as air (glass, doors, panels go in later).

## RESERVED (shell leaves empty)
| cells | for |
|---|---|
| plot 0 F: x 63..71, z 20..35, y 2..21 (above paving) | Atlas, plinth, pylons, sphere (sphere's top y 20 stands above the portal coping) |
| plot 0 paving uplight cells listed under ATLAS | ochre_froglight |
| plot 0 portal recess x 60..61, z 22..23, 27..28, 32..33, y 2..15 | doors, gilded panels (x 61, y 4..6), glass |
| plot 0 lobby x 50..59, z 22..33, y 2..15 (interior air, lit ceiling y 16) | lit lobby seen through glass |
| plot 0 gardens GN, GS: deck y 26 cells + y 27..31 | soil, hedges, beds, trees, lamps |
| plot 0 behind-glass cells (−2 from face) on every strip | lit/dark back blocks |
| plot 0 shop interiors: 3 deep behind every ground-storey bay, y 2..6 | lit displays |
| plot 1/2 entrance recess x 51..53, z 6..12, y 3..17 | doors, glass, coat of arms (y 9..10), relief panel (y 11..17) |
| plot 1/2 garden GB cells y 26..31; ledge cells y 22..24 | gardens, hedges, lamps |
| plot 1/2 shop interiors: 3 deep behind ground-storey bays | lit shops |

## FLOORS (exterior only: no rooms; levels for the window rhythm and the lit glimpses)
| plot / mass | floors (floor block y) |
|---|---|
| plot 0 ground storey (all masses) | y 1 (plinth y 0 where ground is 0); storey air y 2..6 |
| plot 0 podium, T1–T4, B | y 7, 10, 13, 16, 19, then every 3 (22, 25, …) to the decks |
| plot 0 SN/SS setback storey | y 22, air 23..25, deck 26 |
| plot 0 A | floor y 0, air 1..5, deck 6 |
| plot 0 lobby (behind portal) | floor y 1, air y 2..15, ceiling y 16 |
| plot 1/2 ground storey | y 2 for x ≥ 18, y 1 for x ≤ 17 (plinth below); air to y 6 |
| plot 1/2 upper | y 7, 10, 13, 16, 19; setback storey 22 (air 23..25, deck 26); W 22, 25, 28 (deck 33); W2 deck 36 |
Interiors are closed hollow volumes, unreachable; only the shop/lobby slices behind glass are furnished and lit.

# DESIGNER'S SECTIONS

## PALETTE (architect's ids kept; all checked with `$MCD blocks --check`: only `chain` is unknown, and it is not used)
| role | base | variants |
|---|---|---|
| limestone | smooth_sandstone | smooth_sandstone_stairs, smooth_sandstone_slab, sandstone_wall |
| trim | cut_sandstone | cut_sandstone_slab, chiseled_sandstone |
| plinth / pylons | polished_andesite | polished_andesite_stairs, polished_andesite_slab |
| dark base / spandrel | polished_deepslate | polished_deepslate_stairs, polished_deepslate_slab |
| glass | glass_pane | (set N/S/E/W connection states) |
| office dark / lit | gray_concrete / ochre_froglight | — |
| bronze | waxed_exposed_cut_copper | _stairs, _slab; waxed_exposed_copper, waxed_weathered_cut_copper |
| Atlas | brown_terracotta | waxed_weathered_cut_copper; lightning_rod |
| gilding | gold_block, yellow_terracotta | red_terracotta, blue_terracotta |
| roof decks | smooth_stone | smooth_stone_slab, smooth_stone_stairs |
| garden | grass_block, moss_block, gravel, dirt_path | azalea_leaves, flowering_azalea_leaves, oak_leaves (persistent), oak_log (axis y), flowers poppy/allium/cornflower/oxeye_daisy/red_tulip/white_tulip |
| doors | dark_oak_door | in waxed_exposed_cut_copper frame |
| lamps | lantern | oak_fence post, iron_bars arm; candle (lit) for shop displays |

## VOCABULARY
- `pier_strip_face(g, {face, from, to, y0, y1, pierMod, litSeed})`: piers smooth_sandstone flush on x≡0 mod 3 (per architect's FACADES), strips recessed 1: glass_pane on y≡2,0 mod 3, polished_deepslate on y≡1 mod 3; cell behind pane (-2) ochre_froglight if hash(x,y,z)%4==0 (never a whole floor) else gray_concrete; 2-wide corner piers, cut_sandstone every 4th course.
- `crown_band(g, box)`: smooth_sandstone y139..142 no windows, cut_sandstone at pier heads y139.
- `deck_light(g, cells)`: ochre_froglight flush in smooth_stone deck at the listed spacing.
- `portal_bay(g, {z0})`: pier columns y2..17, lintel y16..17 (chiseled_sandstone at pier heads), recess x60..61.
- `deco_panel(g, {x,z0,z1,y0,y1,face})`: gold_block field, yellow_terracotta stepped zigzag (diagonal rays from centre bottom), border waxed_exposed_cut_copper.
- `emblem(g, {x,z0..z2,y0,y1,kind})`: 3x2: british = gold + red/blue terracotta quarters; french = blue_terracotta field with gold fleur-de-lis (centre column + 2 side petals).
- `bronze_door(g, {x,z,y,face})`: dark_oak_door lower/upper, hinge pair, frame of waxed_exposed_cut_copper, lantern each side on fence arm.
- `shop_bay(g, {face, a, b})`: glass_pane y2..5, waxed_exposed_cut_copper fascia y6, froglight ceiling y6 behind, display row y2 of candle(lit)/smooth_stone.
- `lit_bay(g,...)`: the froglight/gray_concrete pick above.
- `plinth(g, c)`: y2 polished_deepslate, y3..4 polished_andesite, y5 smooth_stone slab cap ring.
- `atlas_figure(g, c)`: per architect's envelope: kneeling legs, torso, bowed head, raised arms; brown_terracotta with ≤20% weathered cut copper.
- `ring_circle(g, centre, plane, r, mat)` / `ring_ellipse(...)`: 1-thick rasterised ring, hollow; `ring_tilted` for the ecliptic.
- `pylon(g, x0,z0)`: 3x2 column, base y2 deepslate, coping slab y17.
- `uplight(g, x,z)`: ochre_froglight flush at y1.
- `roof_garden(g, box, deckY, seed)`: as architect's ROOF GARDENS recipe (grass 1/8 moss, hedge, gravel ring + 2-wide cross, 4 beds, 2 trees, lamp posts every 6).
- `lamp_post(g,x,y,z)`: oak_fence ×2 + lantern on top (standing).
- `ledge_planter(g, box)`: grass_block + 1 azalea hedge, lantern post every 6.
- `vent(g,x,y,z)`: smooth_stone_stairs pair + iron_bars.

## ROOMS
Exterior only: no walkable rooms. Lit slices behind glass are furnished by the facade parts (shop_bay, lit lobby), not by room designers. Lobby (x50..59 z22..33 y2..15) is closed air with a froglight ceiling at y16 and a gold_block/polished_andesite floor strip visible through the portal glass.

Way in: forecourt paving at y1 level, 2 wide slab rim not needed (doors at ground, level). Street = Fifth Ave sidewalk (84,1,27) just outside the notch; entrance = (72,1,27) before Atlas, doors at x60.
Note: the forecourt notch x72..83 z20..35 is off the footprint; the player route is notional.

## PARTS (each ≤12 min)
1. Massing shell (parts/shell.mjs): all masses, decks, parapets, plinth; leave openings and reserved cells. P0 first, then P1 and P2 same module.
2. Portal and forecourt (parts/portal.mjs): E portal, paving, pylons, plinth, lobby ceiling.
3. Atlas (parts/atlas.mjs): figure, sphere, uplights.
4. Facades and fittings (parts/facades.mjs): piers/strips, glass, lit bays, shopfronts, fascia, doors, panels, emblems, name boards.
5. Roofs, gardens, lighting (parts/roofs.mjs): decks lit, roof gardens GN/GS/GB, ledges, lamp posts, vents, crown floodlights.
6. Final check (parts/finish.mjs): `$MCD check`, no floating, light >0 everywhere, fix dark cells.

## NOTES FOR WORKERS
- Never touch the architect's sections or the forecourt notch x72..83 z20..35.
- Local frames per plot; offsets in the header. Respect max y (P0 155, P1/P2 50).
- Lanterns hang from iron_bars, never `chain`. Leaves persistent.
- Letters via plaque only. Windows: set pane connections.
```

### elements.md

```markdown
# REQUIRED ELEMENTS (checklist; coordinates are plan.md local frames; P0/P1/P2 = plots)

| # | element | construction (blocks) | where | part | vocab |
|---|---|---|---|---|---|
| 1 | International Building tower T1 + setbacks T2/T3/T4 | hollow shell, smooth_sandstone piers every 3rd column, glass_pane strips recessed 1, polished_deepslate spandrels, crown band y139..142 | P0 per mass table | 1 shell, 3 facade | pier_strip_face, crown_band |
| 2 | Penthouse + floodlit crown | PH smooth_sandstone walls x14..47 z22..33 y142..147, smooth_stone deck 147, slab coping 148, ochre_froglight at 4 corners | P0 | 1, 5 | deck_light |
| 3 | Fifth Ave wings C2 / D2 with roof gardens | six-storey piers+strips to y22, cornice cut_sandstone y22, setback storey SN/SS, deck 26, garden GN/GS | P0 x62..83 | 1, 2, 5 | roof_garden |
| 4 | Entrance portal E | smooth_sandstone piers z20..21,24..26,29..31,34..35 y2..17; lintel y16..17; coping y18; chiseled heads | P0 x58..62 | 2 | portal_bay |
| 5 | Gilded Deco relief panels over doors | gold_block field, yellow_terracotta zigzag/rays, x61 y4..6 at z22..23, 27..28, 32..33 | P0 | 4 | deco_panel |
| 6 | Doors and tall lobby glass | dark_oak_door pairs in waxed_exposed_cut_copper frames x60 y2..3; glass_pane x60 y7..15; lit lobby ochre_froglight ceiling y16 | P0 | 4 | bronze_door, lit_bay |
| 7 | ATLAS figure | kneeling brown_terracotta body, weathered cut copper highlights, on 3-step plinth (polished_deepslate / polished_andesite / smooth_stone) | P0 x64..70 z24..31 y2..15 | 3 | atlas_figure, plinth |
| 8 | Armillary sphere | 4 crossing rings of waxed_exposed_cut_copper (+ecliptic waxed_exposed_copper), axis with lightning_rod stubs, hollow, centre (67,16,27.5) | P0 | 3 | ring_circle, ring_ellipse |
| 9 | Granite pylons | polished_andesite x66..68 z20..21 and z34..35 y2..17, polished_deepslate base y2, smooth_stone_slab coping y17 | P0 | 3 | pylon |
| 10 | Atlas uplights | ochre_froglight flush in paving at listed cells | P0 forecourt | 3 | uplight |
| 11 | Forecourt paving | polished_andesite, smooth_stone joint lines every 3, y1 | P0 x63..71 z20..35 | 3 | paving |
| 12 | Shopfronts, lit | glass_pane y2..5, bronze fascia y6, ochre_froglight behind, display row y2 | P0 z0, z54, x83; P1/P2 faces | 4 | shop_bay |
| 13 | Shop name boards | banner letters on fascia (plaque, material null) | fascias | 4 | plaque |
| 14 | Dusk windows | ~25% bays ochre_froglight behind glass, rest gray_concrete | all faces | 4 | lit_bay |
| 15 | Roof decks lit | froglights flush per plan ROOFS table; no dark deck cell | all roofs | 5 | deck_light |
| 16 | British Empire Bldg body, setback storey, W/W2 | P1 per mass table | P1 | 1, 3 | pier_strip_face |
| 17 | La Maison Francaise (twin) | same coordinates, ornament differs | P2 | 1, 3 | pier_strip_face |
| 18 | P1/P2 roof gardens | grass/moss deck, azalea hedge, gravel paths, 4 flower beds, 2 oak trees, lantern posts | P1/P2 GB | 5 | roof_garden |
| 19 | P1/P2 Fifth Ave entrance, relief panel, coat of arms/fleur-de-lis | recess x51..53 z7..11; 7x7 gold panel x53 z6..12 y11..17 with bronze frame; emblem y9..10 | P1/P2 | 4 | deco_panel, emblem |
| 20 | Ledges with hedges | grass + azalea hedge on y22 ledge, lantern posts | P1/P2, P0 podium | 5 | ledge_planter |
| 21 | Lamp posts / wall lamps | oak_fence + lantern; lantern on fence arm beside each door y5 | doors, decks | 5 | lamp_post |
| 22 | Street plinth | polished_andesite at GROUND course all faces | all | 1 | — |
| 23 | Vents/roof mechanical (A roof) | 2 smooth_stone_stairs blocks + iron_bars grille | P0 A | 5 | vent |
```

### rooms.json

```json
{"entrance":[72,1,27],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "limestone": [
      "smooth_sandstone"
    ],
    "trim": [
      "cut_sandstone",
      "chiseled_sandstone"
    ],
    "coping": [
      "smooth_sandstone_slab"
    ],
    "plinth": [
      "polished_andesite"
    ],
    "dark": [
      "polished_deepslate"
    ],
    "glass": [
      "glass_pane"
    ],
    "office_dark": [
      "gray_concrete"
    ],
    "lit": [
      "ochre_froglight"
    ],
    "bronze": [
      "waxed_exposed_cut_copper",
      "waxed_exposed_copper",
      "waxed_weathered_cut_copper"
    ],
    "atlas": [
      "brown_terracotta",
      "waxed_weathered_cut_copper",
      "lightning_rod"
    ],
    "gilding": [
      "gold_block",
      "yellow_terracotta"
    ],
    "heraldic": [
      "red_terracotta",
      "blue_terracotta"
    ],
    "roof": [
      "smooth_stone"
    ],
    "paving": [
      "polished_andesite",
      "smooth_stone"
    ],
    "garden": [
      "grass_block",
      "moss_block",
      "gravel",
      "dirt_path",
      "azalea_leaves",
      "flowering_azalea_leaves",
      "oak_leaves",
      "oak_log",
      "poppy",
      "allium",
      "cornflower",
      "oxeye_daisy",
      "red_tulip",
      "white_tulip"
    ],
    "door": [
      "dark_oak_door"
    ],
    "lamp": [
      "lantern",
      "oak_fence",
      "iron_bars",
      "candle"
    ]
  },
  "objects": [
    "smooth_sandstone_stairs",
    "smooth_sandstone_slab",
    "sandstone_wall",
    "cut_sandstone_slab",
    "polished_andesite_stairs",
    "polished_andesite_slab",
    "polished_deepslate_stairs",
    "polished_deepslate_slab",
    "waxed_exposed_cut_copper_stairs",
    "waxed_exposed_cut_copper_slab",
    "smooth_stone_slab"
  ]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which is moved into place only when the build succeeds.
set -eu
cd "$(dirname "$0")"
tmp="build.$$.tmp.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv -f "$tmp" build.nbt
```

### build.mjs

```js
// Rockefeller Center, Fifth Avenue front: lays the ground, then every part in plan.md's order, and saves the build.
// usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, PLOT_ORIGIN, PLOT_SIZE, onLot, groundAt, PLINTH } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// the parts, in plan.md's order
const PARTS = [
  ["massing shell", "parts/shell.mjs"],
  ["portal and forecourt", "parts/portal.mjs"],
  ["Atlas and armillary sphere", "parts/atlas.mjs"],
  ["facades and fittings", "parts/facades.mjs"],
  ["roofs, gardens and lighting", "parts/roofs.mjs"],
  ["final check", "parts/finish.mjs"],
];

// a part whose file is not there yet (another copy mid-write) builds nothing, so the make never fails on it
const list = [];
for (const [name, file] of PARTS) {
  if (!existsSync(file)) { console.log(`part ${name}: ${file} missing, building nothing`); list.push([name, () => {}]); continue; }
  list.push([name, (await import(`./${file}`)).build]);
}

// the ground: plinth course at each cell's ground y, solid below it (kit coordinates; plots 1 and 2 are offset)
function layGround(g) {
  for (let p = 0; p < PLOT_ORIGIN.length; p++) {
    const [ox, oz] = PLOT_ORIGIN[p], [sx, sz] = PLOT_SIZE[p];
    for (let lx = 0; lx < sx; lx++)
      for (let lz = 0; lz < sz; lz++) {
        if (!onLot(p, lx, lz)) continue;
        for (let y = 0; y <= groundAt(p, lx, lz); y++) g.set(ox + lx, y, oz + lz, PLINTH);
      }
  }
}

function makeSite(roof) {
  const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
  layGround(g);
  runParts(g, list, { palette: "palette.json", roof });
  return g;
}

let g;
try {
  g = makeSite("roof.json");
} catch (e) {
  // the roof hangs on the massing shell's walls: while the shell has none (a stub, or not written yet) build without it
  if (!/detectEave: no walls found/.test(e.message)) throw e;
  console.log("roof: no walls yet (the massing shell is empty), building without the roof");
  g = makeSite(undefined);
}
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: palette ids (all in palette.json), plan.md's site coordinates, a seeded rng.
// Site coordinates are KIT coordinates (the whole grid) unless a name says local; plot p's local (0, 0) is PLOT_ORIGIN[p].

// ---- palette: every id here is in palette.json ----
// limestone body, piers, parapets

// ---- palette: every id here is in palette.json ----
// limestone body, piers, parapets
export const LIMESTONE = "smooth_sandstone";

// limestone stair, for the stepped portal and quoins
export const LIMESTONE_STAIRS = "smooth_sandstone_stairs";

// limestone slab, the parapet coping
export const LIMESTONE_SLAB = "smooth_sandstone_slab";

// limestone wall
export const LIMESTONE_WALL = "sandstone_wall";

// trim: cornice band, quoin courses, lintels
export const TRIM = "cut_sandstone";

// trim slab
export const TRIM_SLAB = "cut_sandstone_slab";

// carved accents: pier heads, portal lintel heads
export const CARVED = "chiseled_sandstone";

// plinth course, pylons, plinth body, forecourt paving
export const PLINTH = "polished_andesite";

// plinth stair
export const PLINTH_STAIRS = "polished_andesite_stairs";

// plinth slab
export const PLINTH_SLAB = "polished_andesite_slab";

// dark base courses and spandrels
export const DARK = "polished_deepslate";

// dark stair
export const DARK_STAIRS = "polished_deepslate_stairs";

// dark slab
export const DARK_SLAB = "polished_deepslate_slab";

// window glass
export const GLASS = "glass_pane";

// dark office behind glass
export const OFFICE_DARK = "gray_concrete";

// lit office, lobby and shop light
export const LIT = "ochre_froglight";

// bronze: frames, fascias, door surrounds
export const BRONZE = "waxed_exposed_cut_copper";

// bronze stair
export const BRONZE_STAIRS = "waxed_exposed_cut_copper_stairs";

// bronze slab
export const BRONZE_SLAB = "waxed_exposed_cut_copper_slab";

// copper rings of the armillary sphere, ecliptic band
export const COPPER = "waxed_exposed_copper";

// weathered copper: Atlas shoulder and thigh highlights (≤20%)
export const COPPER_WEATHERED = "waxed_weathered_cut_copper";

// Atlas figure body (dark bronze)
export const ATLAS_BODY = "brown_terracotta";

// armillary end stubs
export const LIGHTNING_ROD = "lightning_rod";

// gilded relief fields
export const GOLD = "gold_block";

// Deco pattern on gilding
export const YELLOW = "yellow_terracotta";

// heraldic quarters (plots 1 and 2 only)
export const RED = "red_terracotta";

// heraldic quarters and the French field
export const BLUE = "blue_terracotta";

// roof decks and forecourt joints
export const ROOF_DECK = "smooth_stone";

// deck slab
export const ROOF_SLAB = "smooth_stone_slab";

// garden soil
export const GRASS = "grass_block";

// garden moss patches (about 1 in 8)
export const MOSS = "moss_block";

// garden gravel paths
export const GRAVEL = "gravel";

// garden path edge
export const DIRT_PATH = "dirt_path";

// garden hedges
export const AZALEA = "azalea_leaves";

// garden flowering accents
export const AZALEA_FLOWERING = "flowering_azalea_leaves";

// garden tree crowns (persistent)
export const OAK_LEAVES = "oak_leaves";

// garden tree trunks (axis y)
export const OAK_LOG = "oak_log";

// garden flower beds
export const POPPY = "poppy";

// garden flower beds
export const ALLIUM = "allium";

// garden flower beds
export const CORNFLOWER = "cornflower";

// garden flower beds
export const OXEYE_DAISY = "oxeye_daisy";

// garden flower beds
export const RED_TULIP = "red_tulip";

// garden flower beds
export const WHITE_TULIP = "white_tulip";

// entrance doors, in bronze frames
export const DOOR = "dark_oak_door";

// lamps (hung from iron_bars, never chain)
export const LANTERN = "lantern";

// lamp posts
export const FENCE = "oak_fence";

// lantern arms and hangers
export const IRON_BARS = "iron_bars";

// lit shop displays
export const CANDLE = "candle";

// ---- site: plan.md's coordinates ----
// the whole site grid: kit x 0..199, y 0..155, z 0..54
export const SITE_SIZE = [200, 156, 55];

// kit [x, z] of each plot's local (0, 0): plot 0 (International Building), plot 1 (British Empire), plot 2 (La Maison Française)
export const PLOT_ORIGIN = [[0, 0], [88, 0], [146, 0]];

// local [x, z] extent of each plot's bounding box
export const PLOT_SIZE = [[84, 55], [54, 19], [54, 19]];

// highest block y of each plot
export const PLOT_MAX_Y = [155, 50, 50];

// the entrance cell before Atlas (the street is just outside the notch)
export const ENTRANCE = [72, 1, 27];

// the armillary sphere's centre, kit coordinates
export const ATLAS_CENTRE = [67, 16, 27.5];

// the forecourt: open to sky, paving at y 1, Atlas on the axis z 27.5
export const FORECOURT = { x0: 63, x1: 71, z0: 20, z1: 35, y: 1 };

// the E portal: piers y 2..17, coping y 18, face at x 62
export const PORTAL = { x0: 58, x1: 62, z0: 20, z1: 35, y0: 2, y1: 18 };

// the lobby behind the portal: closed air, lit ceiling at y 16
export const LOBBY = { x0: 50, x1: 59, z0: 22, z1: 33, y0: 2, y1: 15, ceilingY: 16 };

// the Atlas plinth: kit cells x 64..70, z 24..31, y 2..5
export const PLINTH_BOX = { x0: 64, x1: 70, z0: 24, z1: 31, y0: 2, y1: 5 };

// deck y of each roof (coping is one above, per plan.md ROOFS)
export const DECK = { T1: 141, PH: 147, T2: 131, T3: 104, T4: 58, B: 35, A: 6, PODIUM: 22, SETBACK: 26, INNER: 28, PORTAL: 17, PLOT_PH: 30, PLOT_W: 33, PLOT_W2: 36 };

// spandrel rows: y ≡ 1 (mod 3), i.e. 7, 10, 13 …
export const isSpandrelRow = (y) => ...

// glass rows: the two above each spandrel row (y ≡ 0 or 2, mod 3)
export const isGlassRow = (y) => ...

// Is the local cell [lx, lz] of plot p on the lot (the footprint map, with its cut corners and the off-lot forecourt notch)?
export function onLot(p, lx, lz)

// The ground course y of local cell [lx, lz] of plot p (the block at that y is the paving/plinth; people walk at y + 1).
export function groundAt(p, lx, lz)

// Seeded rng: rng(seed)() returns a float in [0, 1). Same seed, same sequence, every run.
export function rng(seed)

// Position hash in [0, 1) for irregular choices that must not change between runs (lit windows: hash3(x, y, z) < 0.25).
export function hash3(x, y, z)
```

### vocab/h1.mjs

```js
// Helpers from plan.md VOCABULARY: pier_strip_face, deck_light, deco_panel, bronze_door, lit_bay, atlas_figure,
// ring_ellipse, uplight, lamp_post, vent. Block ids are literals from plan.md's PALETTE, checked at 1.21.1, with one
// exception: plan.md's smooth_stone_stairs is not a 1.21.1 block, so vent uses stone_stairs (the same grey stone).
// Every helper takes the grid g, then its position (and facing) as arguments, and returns { placed, refused }.
// It writes only its own footprint, and only into air: a cell an earlier part already filled is refused and listed,
// never overwritten, unless opts.overwrite is true. The two flush lights (deck_light, uplight) sit IN a surface, so
// they may also replace that one surface block (smooth_stone deck, polished_andesite / smooth_stone paving); the
// block under them is never touched.

/**
 * A facade run on one face: smooth_sandstone piers flush at the face plane, glass strips recessed 1 (glass rows, with
 * polished_deepslate spandrel rows between), and a lit or dark block 2 in behind each pane.
 * face: the outward side (north|south|east|west); at: the face plane (x for east/west, z for north/south);
 * from..to: the run along the face (z for east/west, x for north/south); y0..y1: the height.
 * pierMod: the pier columns' residue mod 3 (0, 1 or 2): plan.md's tower east faces are 2, the plot long faces 1.
 * Two-wide corner piers at both ends, with cut_sandstone every 4th course. Lit bays are 2x2 windows (one pick per bay),
 * and a storey row of two or more bays is never all lit.
 */
export function pier_strip_face(g, { face, at, from, to, y0, y1, pierMod = 0, litSeed = 0 }, opts = {})

/** Flush ochre_froglight lights in a deck or paving, one per listed cell [x, y, z] (y is the surface course). */
export function deck_light(g, cells, opts = {})

/**
 * A Deco gilded panel in the plane x, spanning z0..z1 by y0..y1: a waxed_exposed_cut_copper border, a gold_block field,
 * and yellow_terracotta rays stepping out at 45 degrees from the bottom centre. face (east|west) is the side it faces.
 */
export function deco_panel(g, { x, z0, z1, y0, y1, face }, opts = {})

/**
 * A double bronze door at (x, y, z): dark_oak_door leaves at z and z+1 (x and x+1 on a north or south face), both halves;
 * a waxed_exposed_cut_copper frame around the pair (jambs beside it, lintel at y+2); and a lantern on an oak_fence post
 * one cell out from the wall beside each side (post y+2, lantern y+3). face: the side the door faces (outward).
 */
export function bronze_door(g, { x, y, z, face }, opts = {})

/** One behind-glass cell at (x, y, z): ochre_froglight when lit, gray_concrete when dark. opts.lit forces it (lobbies, shops). */
export function lit_bay(g, x, y, z, { lit, seed = 0, overwrite = false } = {})

/**
 * The kneeling Atlas per the architect's envelope. c = { x, y, z } is the envelope's low corner (plot 0: x 65, y 6, z 25,
 * spanning x 65..69, y 6..15, z 25..30). Brown_terracotta body, head bowed toward +x, arms up to the sphere, and
 * waxed_weathered_cut_copper on the shoulders and thigh tops (about 4% of the figure).
 */
export function atlas_figure(g, { x, y, z }, opts = {})

/**
 * A hollow ring one block thick: an ellipse with radii ra and rb centred on centre = [x, y, z], in the plane "xy", "xz" or
 * "yz" (ra along the plane's first axis, rb along its second). Points are sampled densely and rounded, so no gaps.
 */
export function ring_ellipse(g, [cx, cy, cz], plane, ra, rb, mat = "waxed_exposed_cut_copper", opts = {})

/** An ochre_froglight flush in the paving at (x, z); y defaults to 1, the paving course. The block under it is never touched. */
export function uplight(g, x, z, { y = 1, overwrite = false } = {})

/** A lamp post standing on the cell (x, y, z): two oak_fence posts (y, y+1) and a standing lantern on top (y+2). */
export function lamp_post(g, x, y, z, opts = {})

/**
 * A roof vent with its base at (x, y, z): a pair of stone_stairs along x at y (their full-height back toward `facing`),
 * and an iron_bars grille on top of the pair at y+1.
 */
export function vent(g, x, y, z, { facing = "north", overwrite = false } = {})
```

### vocab/h2.mjs

```js
// Vocabulary helpers from plan.md VOCABULARY (first group): crown_band, portal_bay, emblem, shop_bay, plinth, ring_circle,
// pylon, roof_garden, ledge_planter. Palette ids are literals; nothing is imported from vocab.mjs or the other vocab/ files.
// Every helper takes the grid first, then its position (and facing, where it has one), then an optional opts object, and
// returns { placed, skipped, clipped, box }: box is the footprint [x0, y0, z0, x1, y1, z1] it may write, and skipped counts
// cells it left alone because they were not air (opts.replace: true overwrites them, still inside the footprint). A write
// outside the footprint throws, so nothing is ever placed under it: ground, sand and floors an earlier part owns stay as
// they are. Helpers whose position is an object take `replace` inside that object.

/**
 * Crown band of a tower mass: smooth_sandstone round the perimeter of box, y0..y1, no windows; cut_sandstone pier heads on
 * the bottom course y0. Interior cells are not touched (the hollow shell stays as the mass built it).
 */
export function crown_band(g, box, opts = {})

/**
 * Entrance portal bay on the face plane x (the E portal sits on x 62), spanning z0..z0+15 from y0. smooth_sandstone piers
 * over y0..y0+13 at the pier columns (z0+0..1, +4..6, +9..11, +14..15); the door and window columns (+2..3, +7..8, +12..13)
 * stay air for the later parts. A 2-high lintel over the whole span (y0+14..15): chiseled_sandstone over the pier heads,
 * cut_sandstone elsewhere. A smooth_sandstone_slab coping at y0+16. Defaults (z0 20, y0 2) are the plan's E portal.
 */
export function portal_bay(g, { x, z0 = 20, y0 = 2, replace = false } = {})

/**
 * Coat of arms on the face plane x, 3 wide (z0..z2) by 2 tall (y0..y1). kind "british": a gold cross column with red and
 * blue terracotta quarters. kind "french": a blue_terracotta field with a gold fleur-de-lis (centre column and two side
 * petals on the top row).
 */
export function emblem(g, { x, z0, z2, y0, y1, kind, replace = false } = {})

/**
 * A shopfront on one face of a ground storey. face is the wall's outward direction; plane is the face coordinate (z for
 * north/south, x for east/west); a..b is the bay's span along the face, inclusive (x for north/south, z for east/west).
 * Depth 1 (recessed one cell): glass_pane y2..5 on the strip columns (pier(t) columns stay as they are), joined to the
 * neighbouring strip panes; a waxed_exposed_cut_copper fascia at y6. Depth 2 (behind): an ochre_froglight ceiling at y6 and
 * a display row at y2 of lit candles alternating with smooth_stone. Nothing is written above the display row, so a 2-high
 * lane stays clear in front of it.
 */
export function shop_bay(g, { face, plane, a, b, y0 = 2, pier = (t) => ...

/**
 * Atlas plinth c = { x0, z0, x1, z1, y0 = 2 }: polished_deepslate base course at y0, polished_andesite body at y0+1..2, and
 * the cap at y0+3: smooth_stone inside (the figure stands on it), a smooth_stone_slab ring round the edge.
 */
export function plinth(g, { x0, z0, x1, z1, y0 = 2, replace = false } = {})

/**
 * A hollow ring one block thick: a circle of radius r about centre [cx, cy, cz] (half-integers allowed), lying in the plane
 * normal to `plane` ('x': the y-z plane, 'y': x-z, 'z': x-y). `at` is the normal coordinate of its first layer (default: the
 * centre rounded down) and `thick` the number of layers (the Atlas meridians are 2 thick at z 27..28). Writes exactly the
 * ring's cells; the footprint is their bounding box.
 */
export function ring_circle(g, centre, plane, r, mat, { at, thick = 1, replace = false } = {})

/**
 * Granite pylon, 3 wide (x0..x0+2) by 2 deep (z0..z0+1), from y0 (the plan's y 2..17): polished_deepslate base course at y0,
 * polished_andesite shaft to y0+14, smooth_stone_slab coping at y0+15.
 */
export function pylon(g, x0, z0, y0 = 2, opts = {})

/**
 * A planted roof garden on a flat deck. box = [x0, z0, x1, z1] is the deck inside the coping; deckY is the deck's grass top
 * (nothing above deckY+5 is written: 26 gives y 31). Long axis runs along x unless the box is taller than wide. Layout, by
 * inset from the coping: grass with about 1 in 8 moss_block; inset 1 a 1-tall persistent azalea hedge (flowering accents);
 * inset 2 a gravel path ring, plus a 2-wide gravel cross path along the long axis; inset 3 oak fence posts with lanterns
 * every 6 along the long sides; four flower beds in the quadrants (inset 4, clear of the cross path); two small oak trees
 * (3-log trunks, persistent crowns 5 wide) standing in the gap column between the beds. seed varies moss and flowers.
 */
export function roof_garden(g, [x0, z0, x1, z1], deckY, seed = 0, opts = {})

/**
 * A planted ledge: box = [x0, y0, z0, x1, y0+3, z1] with y0 the ledge's deck. grass_block at y0 over the box; a 1-tall
 * persistent azalea hedge at y0+1 on the row one in from the edge the coping runs along (edge: "north" = low z, "south" =
 * high z, "west" = low x, "east" = high x); a lantern post (oak_fence x2, lantern on top) every 6 along that row.
 */
export function ledge_planter(g, [x0, y0, z0, x1, y1, z1], { edge = "north", replace = false } = {})
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
