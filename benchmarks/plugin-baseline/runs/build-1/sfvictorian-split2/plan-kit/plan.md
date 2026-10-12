# Plan: sfvictorian-split2: San Francisco Italianate painted lady

Identity: an 1880s SF Italianate row house. A narrow teal false front with gold fish-scale bands and a burgundy frieze, a deep cream
bracketed cornice and a small pedimented parapet, all over a dark sea-green garage base. A full-height angled bay fills the west half,
and a cream stair climbs on the east to a recessed porch with two columns. Neighbours press close on both sides (ochre downhill to the
west, pale blue uphill to the east). Behind the house: a kitchen deck and a long garden.

Lot x0..15, z0..49, y0..20. The front faces NORTH (z0 is the sidewalk), and x runs along the street. Ground surface is y0 (you stand
on y1). All ranges are inclusive.
HARD RULE: later parts only ADD into air. The shell leaves every OPENING and RESERVED cell as air.

## SITE
| mass | x | y | z | notes |
|---|---|---|---|---|
| sidewalk | 0..15 | 0 | 0..1 | z0 `polished_andesite` curb, z1 `smooth_stone` |
| street lamp | 0 | 1..4 | 1 | `polished_blackstone_wall` y1..3, `lantern` y4 |
| driveway | 1..6 | 0 | 2..6 | `polished_andesite`, under the bay's overhang |
| front garden | 7..8 | 0 | 3..6 | RESERVED for a `podzol` bed + flowers; ground part leaves it |
| iron fence | 6..8 | 1 | 2 / x6 z3..6 | posts `polished_blackstone_wall` at (6,1,2) and (6,1,6); `iron_bars` between: x7..8 z2 and x6 z3..5 |
| front stair | 10..13 | 0..4 | 2..6 | solid `dark_prismarine` fill; treads z2 top y1, z3 y2, z4 y3, landing z5..6 at y4 (`smooth_quartz_stairs` facing=south for the treads, full `smooth_quartz` blocks on the landing) |
| stair cheek walls | 9 and 14 | 1..5 | 2..6 | `dark_prismarine`, stepped (top = tread y + 1), `smooth_quartz_slab` cap; newels at (9,z2),(14,z2): `quartz_pillar` y1..2, `lantern` y3 |
| main body | 1..14 | 0..16 | 7..32 | party walls x1, x14; front wall z7; back wall z32; see FLOORS |
| angled bay | 1..6 | 3..17 | 4..6 | wall cells per course y4..15: z5 x2..5, and the diagonals (1,z6),(6,z6); interior z6 x2..5 is room; corbels y3; cap y16; cornice y17 |
| porch recess | 10..13 | 4..8 | 7..9 | floor y4 (continues the landing), open front at z7, side walls x9 and x14 (z8..9), back (door) wall z10, ceiling = the y8 slab |
| false front | 1..14 | 17..20 | 7 | parapet y18, coping y19, pediment x5..10 up to y20 |
| west neighbour | 0 | 0..14 | 7..32 | `yellow_terracotta` y0..13, `smooth_quartz_slab` cap y14 (downhill house, lower) |
| east neighbour | 15 | 0..17 | 7..32 | `light_blue_terracotta` y0..16, `smooth_quartz_slab` cap y17 (uphill house, higher: this shows the slope) |
| roof | 0..15 | 17..19 | 7..33 | see ROOFS |
| back deck | 2..13 | 0..5 | 33..37 | floor y4 `spruce_planks`; posts `spruce_log` y0..3 at x2, x7, x13 on z37 (and at z33 against the wall only if needed); `spruce_fence` rail y5 around z37 and x2/x13, with a gap at x11..13 z37 |
| deck stair | 11..13 | 0..3 | 38..40 | `spruce_stairs` facing=north: z38 y3, z39 y2, z40 y1 (solid `spruce_planks` under); foot at z41 |
| patio under deck | 2..13 | 0 | 33..37 | `smooth_stone` |
| back garden | 1..14 | 0 | 38..48 | `grass_block`; path `polished_andesite` x11..12 z41..48 |
| garden tree | 4 | 1..7 | 44 | `oak_log` trunk y1..4; `flowering_azalea_leaves`/`oak_leaves` crown x2..6 z42..46 y4..7 |
| vegetable bed | 7..9 | 0 | 44..47 | RESERVED (farmland + one water cell at (8,0,45)); `spruce_planks` edging is the ground part's |
| garden fences | 0 & 15 / 0..15 | 1..2 | 33..49 / 49 | `spruce_fence` along x0, x15 (z33..49) and z49 (x0..15) |

## ROOFS
Building type: SF Italianate row house with a false front. Preset `shop` (gable end to the street, ridge along z), held LOW so the
false front hides it from the street:
`roof(g, [[1,7,14,32]], "shop", { y:17, pitch:"half", maxHeight:3, overhang:1, material:"dark-slate", gable:"bamboo_mosaic",
ridge:"crest", dormers:{count:0}, chimneys:[{at:[1,12],size:1,material:"bricks"},{at:[1,21],size:1,material:"bricks"}],
keep:[{from:[0,16,3],to:[15,21,7]}] })`
- Low gable, pitch half (0.5). The eaves are at y17 over x0 and x15 (above both neighbours' caps); the ridge is at y19, along x7..8 from
  z8 to z33.
- Overhang 1 on the sides (x0, x15) and the back (z33, a shelter over the deck). The front has none: the `keep` box guards the cornice
  and false front at z3..7.
- The back gable end (z32, y17..19) is filled with gold fish-scale `bamboo_mosaic`. Under the back eave, a `smooth_quartz_stairs`
  half=top course at z33.
- The front gable end sits behind the parapet and is never seen. The roof part must not build anything at z ≤ 7.
- Chimneys rise 2 above the ridge in the west party wall (fireplaces for the parlour and dining room).
- If the dry run warns ROOF_BIG_PLANE, accept it with `--why "concept: low hidden gable behind an Italianate false front"`. If
  `shop` refuses the low pitch, build the same thing with style `gable`, `ridgeAxis:"z"`, and the same options.
- Built by hand (facade part, not the roof tool): the false front, the cornice, the pediment and the bay cap.

## FACADES

### Front (north) face, from the street
| zone | y | what / where | depth | material |
|---|---|---|---|---|
| base (garage level) | 0..3 | z7 x1..14; garage door opening x2..5; small window x8 y2 | flush z7 | `dark_prismarine` |
| bay corbels | 3 | under the bay: z5 x2..5 and (1,3,6),(6,3,6) | proud, carrying the bay | `smooth_quartz_stairs` half=top facing=south |
| belt course | 4 | z7 x7..9 + bay skirt z5 x2..5, (1,4,6),(6,4,6) | flush | `crimson_planks` (burgundy skirt) |
| siding, main floor | 5..7 | z7 x7..9; porch side walls; bay walls | flush | `warped_planks` (teal; plank grain reads as horizontal siding) |
| fish-scale band 1 | 8 | z7 x1..14 (incl. the porch head x10..13) + all bay wall cells | flush | `bamboo_mosaic` (gold) |
| siding, 2nd floor | 9..11 | z7 x7..14 + bay | flush | `warped_planks` |
| fish-scale band 2 | 12 | as band 1 | flush | `bamboo_mosaic` |
| siding, top floor | 13..15 | z7 x7..14 + bay | flush | `warped_planks` |
| frieze | 16 | z7 x1..14 + bay cap (solid deck z5..6 x1..6) | flush | `crimson_planks` |
| cornice brackets | 16 | z6 at x7, 9, 11, 13; z4 at x2, 5 (bay); (0..) none on the neighbours | +1 | `smooth_quartz_stairs` half=top facing=south (the bay's at z4: the same) |
| cornice | 17 | z6 x7..14 solid `smooth_quartz`; crown z5 x7..14 `smooth_quartz_stairs` half=top facing=south. Over the bay: z5 x1..6 and (1,17,6),(6,17,6) solid `smooth_quartz`, crown z4 x1..6 the same stairs | +1 / +2 (the crown) | cream |
| parapet | 18 | z7 x1..14: `warped_planks` posts at x1, x5, x10, x14; `bamboo_mosaic` panels between | flush | teal + gold |
| coping | 19 | `smooth_quartz_slab` (bottom) on x1..4 and x11..14 at z7 | flush | cream |
| pediment | 19..20 | y19 x6..9 `bamboo_mosaic`; rakes (5,19,7) stairs facing=east, (10,19,7) facing=west; y20 (6,20,7) stair facing=east, (9,20,7) facing=west, x7..8 `chiseled_quartz_block` keystone pair | proud z6 rake: also `smooth_quartz_stairs` at (5..10,19,6) as a drip | `smooth_quartz_stairs` |
| bay corner posts | 4..15 | (2,y,5), (5,y,5): the shell builds them | flush in the bay face | `quartz_pillar` (axis y) |
| east corner pilaster | 4..15 | (14,y,6) | +1 | `quartz_pillar` |
| window hoods (2nd floor) | 12 | over x9: (8,12,6) stair facing=east, (9,12,6) `smooth_quartz_slab` top, (10,12,6) stair facing=west; the same over x12 (x11..13) | +1 | `smooth_quartz_stairs` / slab |
| window hoods (top floor) | 15 | over x9 and x12: `smooth_quartz_slab` top at (9,15,6), (12,15,6) | +1 | cream |
| bay window hoods | 8 and 12 | z4 x3..4 `smooth_quartz_slab` top (over the front lights, sitting under the band's level) | +1 | cream |
| sills | under each window | `smooth_quartz_slab` top, one cell proud (z6 for the wall, z4 for the bay front) | +1 | cream |
| porch columns | 5..7 | (10,y,7), (13,y,7) (RESERVED) | in the old wall plane | `quartz_pillar`; the capitals at y7 are `chiseled_quartz_block` |
| porch head | 8 | z7 x10..13 is part of band 1 (gold); under it, (11,7,7),(12,7,7) `smooth_quartz_stairs` half=top facing=south as a small arch spring | 0 | gold + cream |
| porch back wall | 5..7 | z10 x10..13 `warped_planks` with the door | recessed −3 | teal |
| front door | 5..6 | (11..12,5..6,10) `crimson_door` pair (hinges outward), transom (11..12,7,10) `glass_pane` | −3 | burgundy |
| garage door | 1..3 | x2..5 z7: the facade part fills the opening with closed `crimson_trapdoor`s (vertical, facing=north, open=true) | flush | burgundy |
| roof crest | ridge | iron-bar crest seen over the parapet | | `iron_bars` |

Rhythm: the bay (x1..6) and the porch bay (x7..14) form two vertical bays. The bay carries three lights per storey (two front, two
diagonal: four cells in all). The east bay carries one tall window at x8 on the main floor and a pair (x9, x12) on each upper floor,
centred on x10.5, over the porch. The cream lines are the bay posts, the pilaster at x14 and the cornice. The gold lines are the two
bands and the parapet panels. They are the one strong horizontal and vertical set; add no other bands.

### Back (south) face z32
| zone | y | what | material |
|---|---|---|---|
| base | 0..3 | z32 x1..14 | `dark_prismarine` |
| body | 4..15 | bands at y8, y12 (`bamboo_mosaic`), siding `warped_planks`, frieze y16 `crimson_planks` | as front |
| gable | 17..19 | fish-scale `bamboo_mosaic` (roof part) | gold |
| trim | | `smooth_quartz_slab` sills and top-slab hoods over each window, at z33 | cream |

## MATERIALS (all checked with `mcd blocks --check`: known in 26.3)
| role | block id(s) | why / reading at distance |
|---|---|---|
| body siding (dominant ~45%) | `warped_planks`, `warped_slab`, `warped_stairs` | saturated teal: reads teal, not grey (do NOT use `cyan_terracotta`, which renders grey) |
| fish-scale accent (~12%) | `bamboo_mosaic`, `bamboo_mosaic_slab`, `bamboo_mosaic_stairs` | gold-yellow, its small-block pattern reads as shingles |
| burgundy accent (~6%) | `crimson_planks`, `crimson_door`, `crimson_trapdoor`, `crimson_stairs`, `crimson_slab` | deep magenta-red frieze, doors |
| cream trim (~15%) | `smooth_quartz`, `smooth_quartz_stairs`, `smooth_quartz_slab`, `quartz_pillar`, `chiseled_quartz_block` | bright cream against the teal: high contrast |
| base (~10%) | `dark_prismarine`, `dark_prismarine_slab`, `dark_prismarine_stairs` | dark sea-green masonry base, darker than the body |
| party walls (inside), partitions | `birch_planks` | light interior, never seen from the street |
| neighbours | `yellow_terracotta` (W), `light_blue_terracotta` (E) | other painted houses, ochre and pale blue |
| roof | `dark-slate` palette (deepslate tiles), `iron_bars` crest, `bricks` chimneys | dark grey lid, well away from the teal in tone |
| glass | `glass_pane` | every window |
| ironwork | `iron_bars`, `polished_blackstone_wall`, `lantern` | fence, newels, lamp |
| street / ground | `polished_andesite`, `smooth_stone`, `grass_block`, `podzol`, `coarse_dirt` | sidewalk, drive, gardens |
| deck | `spruce_planks`, `spruce_log`, `spruce_fence`, `spruce_stairs` | weathered brown deck |
| garden | `oak_log`, `oak_leaves`, `flowering_azalea`, `rose_bush` | tree, shrubs |

## OPENINGS (the shell leaves them as air; a later part fills glass and doors)
| face | where (x, y, z) | size w×h | what |
|---|---|---|---|
| front base | x2..5, y1..3, z7 | 4×3 | garage door (crimson trapdoors) |
| front base | (8, 2, 7) | 1×1 | cellar light |
| bay, main | x3..4 y5..7 z5; (1,5..7,6); (6,5..7,6) | 2×3 + 1×3 + 1×3 | parlour bay lights |
| bay, 2nd | x3..4 y9..11 z5; (1,9..11,6); (6,9..11,6) | as above | front bedroom bay |
| bay, top | x3..4 y13..14 z5; (1,13..14,6); (6,13..14,6) | 2×2, 1×2, 1×2 | top room bay |
| front, main | (8, 5..7, 7) | 1×3 | parlour side light |
| porch front | x10..13, y5..7, z7 | open, except the columns | porch mouth |
| front door | x11..12, y5..6, z10; transom x11..12 y7 z10 | 2×2 + 2×1 | entry |
| front, 2nd | (9, 9..11, 7), (12, 9..11, 7) | 1×3 each | bedroom / hall |
| front, top | (9, 13..14, 7), (12, 13..14, 7) | 1×2 each | top room |
| back base | (3, 1..2, 32) door; x7..8 y2..3 z32 window | 1×2; 2×2 | garden store under the deck |
| back, main | x3..4 y5..7 z32; x11..12 y5..7 z32 | 2×3 each | kitchen windows |
| back, kitchen door | x7..8 y5..6 z32 + transom y7 | 2×2 + 2×1 | French doors onto the deck |
| back, 2nd | x3..4 y9..11 z32; x7..8 y9..11 z32 | 2×3 each | back bedroom |
| back, 2nd | (11, 10..11, 32) | 1×2 | bathroom |
| back, top | x7..8 y13..15 z32 | 2×3 | top room |

## RESERVED (the shell leaves them empty)
| cells | for |
|---|---|
| (10,5..7,7), (13,5..7,7) | porch columns |
| (1,5..6,11..13) | parlour fireplace firebox, recessed into the west party wall; backed by the neighbour wall x0 |
| (1,5..6,20..22) | dining fireplace, the same |
| y4 floor at x12..13 z21..23 | stair well, garage level to main floor (treads x12..13: z23 y1, z22 y2, z21 y3, arriving y4 at z20) |
| y8 floor at x12..13 z12..14 | the long hall stair along the east party wall (treads z12 y5, z13 y6, z14 y7, arriving y8 at z15) |
| y12 floor at x12..13 z17..19 | stair to the top room (treads z17 y9, z18 y10, z19 y11, arriving y12 at z20) |
| x2..13 y13..19 z8..31 | top room, open to the roof (no ceiling at y16; the roof part keeps it hollow) |
| (7..8,0,3..6) | front garden bed |
| (7..9,0,44..47) | vegetable bed |
| (1,16..21,12), (1,16..21,21) | chimney stacks (roof part) |

## FLOORS
| level | floor slab y | air y | interior volume | notes |
|---|---|---|---|---|
| garage / base | 0 (`smooth_stone`) | 1..3 | x2..13, z8..31 | garage x2..9 z8..20; laundry/store behind; stair up at x12..13 z20..23 |
| main (parlour) | 4 (`dark_oak_planks`) | 5..7 | x2..13 z8..31 + bay z6 x2..5; the porch x10..13 z7..9 is outside (wall at z10) | parlour x2..9 z8..16 + bay (fireplace W z12); entry hall x10..13 z11..22 with the stair at x12..13; dining x2..9 z17..23 (fireplace W z21); kitchen x2..13 z24..31, door to the deck |
| 2nd (bedrooms) | 8 (`spruce_planks`) | 9..11 | x2..13 z7..31 (front wall z7 at this level) + bay | front bedroom x2..11 z8..15 + bay; landing x12..13 z15..20; bathroom with clawfoot tub x9..13 z24..31 (window x11); back bedroom x2..8 z24..31 |
| top (under the roof) | 12 (`birch_planks`) | 13..15, open to y19 | x2..13 z8..31 + bay | one long room under the low gable, the bay as a window seat; stair arrives at z20 |
| wall plate | 16 | | the perimeter only | frieze course outside |
| roof | 17..19 | | | ridge y19 along x7..8 |


---
# DESIGNER SECTIONS (below the architect's; the architect's text above is unchanged)

## PALETTE (every id checked with `mcd blocks --check`: all known; `painting`, `chain`, `sink` are NOT blocks: use `iron_chain` if a chain is wanted)
| role | ids |
|---|---|
| teal body | `warped_planks`, `warped_slab`, `warped_stairs` |
| gold shingle | `bamboo_mosaic`, `bamboo_mosaic_slab`, `bamboo_mosaic_stairs` |
| burgundy | `crimson_planks`, `crimson_slab`, `crimson_stairs`, `crimson_door`, `crimson_trapdoor` |
| cream trim | `smooth_quartz`, `smooth_quartz_slab`, `smooth_quartz_stairs`, `quartz_pillar`, `chiseled_quartz_block`, `quartz_stairs`, `quartz_slab` |
| sea-green base | `dark_prismarine`, `dark_prismarine_slab`, `dark_prismarine_stairs` |
| interior structure | `birch_planks`, `birch_stairs`, `birch_slab`, `birch_fence`, `birch_door`, `birch_trapdoor`; floors `smooth_stone` (garage level), `dark_oak_planks` (main), `spruce_planks` (2nd), `birch_planks` (top) |
| masonry | `bricks`, `brick_stairs`, `brick_slab`, `netherrack`, `fire` |
| roof | `deepslate_tiles`, `deepslate_tile_stairs`, `deepslate_tile_slab` (the roof tool's `dark-slate`), `iron_bars`, `bricks` |
| neighbours | `yellow_terracotta`, `light_blue_terracotta` |
| glass | `glass_pane`, `white_stained_glass_pane` |
| iron & light | `iron_bars`, `polished_blackstone_wall`, `lantern`, `soul_lantern`, `iron_chain`, `end_rod` |
| ground | `polished_andesite`, `smooth_stone`, `grass_block`, `podzol`, `coarse_dirt`, `farmland`, `water` |
| deck | `spruce_planks`, `spruce_log`, `spruce_fence`, `spruce_stairs`, `spruce_slab`, `spruce_trapdoor` |
| plants | `oak_log`, `oak_leaves`, `flowering_azalea_leaves`, `flowering_azalea`, `rose_bush`, `azure_bluet`, `allium`, `poppy`, `lilac`, `peony`, `wheat`, `carrots`, `short_grass`, `tall_grass`, `flower_pot`, `potted_fern` |
| furniture (rooms) | `bookshelf`, `lectern`, `crafting_table`, `furnace`, `smoker`, `blast_furnace`, `barrel`, `chest`, `cauldron`, `water_cauldron`, `hopper`, `loom`, `cartography_table`, `smithing_table`, `stonecutter`, `grindstone`, `decorated_pot`, `jukebox`, `white_bed`, `red_bed`, `blue_bed`, `cyan_bed`, carpets `red_carpet`, `white_carpet`, `blue_carpet`, `green_carpet`, `purple_carpet`, `light_gray_carpet`, `magenta_carpet`, `brown_carpet`, `yellow_carpet`, wool `white_wool`, `red_wool`, `cyan_wool`, `candle`, `brewing_stand`, `item_frame`, `dark_oak_stairs/slab/fence/trapdoor/door/pressure_plate`, `oak_stairs/slab/planks`, `spruce_pressure_plate`, `daylight_detector`, `iron_block`, `iron_trapdoor`, `iron_door` |

Palette ratio on the street face: teal 45, cream 15, gold 12, base sea-green 10, burgundy 6.

## VOCABULARY (helpers in `vocab.mjs`; `g` = the build grid; facing/half/axis are block states; x/y/z absolute)
- `frontWallZone(y)` -> block for a wall course on the street/back faces: y0..3 `dark_prismarine`; y4 `crimson_planks`; y8 and y12 `bamboo_mosaic`; y16 `crimson_planks`; else `warped_planks` (y5..7, 9..11, 13..15). The bay uses the same function.
- `fishScaleBand(g, y, cells)` -> `bamboo_mosaic` along cells (list of [x,z]); a gold band reads as shingles.
- `sashWindow(g, {x0,x1,y0,y1,z})` -> fills the box with `glass_pane` (pane only; 3-high windows get a meeting rail: the middle row y0+1 is `smooth_quartz_slab` type=bottom, matching elements.md #15).
- `sill(g, x0, x1, y, z)` -> `smooth_quartz_slab` type=top at (x,y-1,z), proud cell (z6 on the front, z4 on the bay front, z33 back). `y` = the window's bottom row.
- `hood(g, x0, x1, y, z, ornate)` -> over the top row: ornate = stair facing=east half=top at x0-1, slab type=top at x0..x1, stair facing=west half=top at x1+1 (all at (·,y,z) where y = the row above the window's top); plain = slab only.
- `bracket(g, x, y, z)` -> `smooth_quartz_stairs` half=top facing=south at (x,y,z).
- `corniceRun(g, x0, x1, y, zSolid, zCrown)` -> solid `smooth_quartz` z=zSolid; crown `smooth_quartz_stairs` half=top facing=south at zCrown (one cell toward the street).
- `corbel(g, x, y, z)` -> `smooth_quartz_stairs` half=top facing=south.
- `column(g, x, y0, y1, z)` -> `quartz_pillar` axis=y from y0..y1-1, capital `chiseled_quartz_block` at y1.
- `archSpring(g, x0, x1, y, z)` -> `smooth_quartz_stairs` half=top facing=south, x0..x1.
- `parapet(g, x0, x1, y, z, posts)` -> posts `warped_planks` at the x list, panels `bamboo_mosaic` elsewhere; coping `smooth_quartz_slab` type=bottom at y+1 on the given x ranges.
- `pediment(g)` -> exactly the architect's pediment row (rake stairs, bamboo_mosaic y19 x6..9, keystone `chiseled_quartz_block` x7..8 y20, drip stairs).
- `bayCourse(g, y)` -> the bay wall ring at height y: z5 x2..5 (x2 and x5 `quartz_pillar` axis=y, x3..4 frontWallZone(y)), diagonals (1,y,6) and (6,y,6) frontWallZone(y).
- `garageDoor(g)` -> `crimson_trapdoor` facing=north open=true half=bottom at x2..5, y1..3, z7.
- `doorPair(g, x, y, z, facing)` -> `crimson_door` lower+upper (half=lower/upper) hinge=left at x, hinge=right at x+1, both facing, open=false.
- `frontStair(g)` -> fill `dark_prismarine` x10..13 under the treads; treads `smooth_quartz_stairs` facing=south half=bottom at z2 y1, z3 y2, z4 y3; `smooth_quartz` landing y4 z5..6; cheeks x9, x14 `dark_prismarine` up to (tread y+1) and `smooth_quartz_slab` type=bottom on top.
- `newel(g, x, z)` -> `quartz_pillar` y1..2, `lantern` hanging=false y3.
- `stairRun(g, x0, x1, zStart, yStart, dir, n, mat)` -> n stair blocks in `mat` (e.g. `birch_stairs`) facing=dir rising each step by 1, plus a solid `birch_planks` fill under each step down to the floor.
- `neighbour(g, x, hStone, capY, stone)` -> column of terracotta x, z7..32, y0..hStone, cap `smooth_quartz_slab` at capY.
- `roofCall(g)` -> the single `roof(...)` call in ROOFS.
- `chimney(g, x, z)` -> `bricks` y16..21 at (x,*,z), `brick_slab` type=bottom y22.
- `ironFence(g)` -> posts `polished_blackstone_wall` at (6,1,2), (6,1,6); `iron_bars` x7..8 z2 and x6 z3..5.
- `streetLamp(g)` -> `polished_blackstone_wall` (0,1..3,1), `lantern` (0,4,1).
- `gardenBed(g)` -> `podzol` (7..8,0,3..6), `rose_bush` lower (7,1,4) + upper (7,2,4), `azure_bluet` (8,1,4), `allium` (8,1,5), `flowering_azalea` (7,1,6), `poppy` (7,1,3).
- `deck(g)` -> floor y4 `spruce_planks` x2..13 z33..37; posts `spruce_log` axis=y y0..3 at (2,37),(7,37),(13,37); rail `spruce_fence` y5 on z37 x2..10, x2 z33..37, x13 z33..37 except the gap; patio `smooth_stone` y0.
- `deckStair(g)` -> `spruce_stairs` facing=north half=bottom at z38 y3, z39 y2, z40 y1 x11..13 with `spruce_planks` under; foot cell z41.
- `gardenTree(g)` -> `oak_log` axis=y (4,1..4,44), crown: sphere radius ~2.5 centred (4,5.5,44) of `oak_leaves` persistent=true with a few `flowering_azalea_leaves`.
- `vegBed(g)` -> `farmland` (7..9,0,44..47) with `water` at (8,0,45), `wheat` age=7 above on 3 rows, `carrots` on the 4th; edging by the ground part.
- `fireplace(g, z)` -> (interior, by the room designers): surround at x1..3: `bricks`; hearth `brick_slab` type=bottom at (2,5,z..z+2); firebox cells (1,5..6,z..z+2): `netherrack` at y5 with `fire` at y6; mantel `smooth_quartz_slab` type=top at (2,7,z..z+2); flue is the chimney stack above (P3).
- `clawfootTub(g, x, y, z, axis)` -> `quartz_stairs` at both ends facing outward half=bottom, `quartz_slab` type=bottom between, 2-long.
- `bed(g, x, y, z, color, facing)` -> `<color>_bed` head+foot; `nightstand` = `barrel`; `wardrobe` = two `dark_oak_trapdoor` closed above two `barrel`s; `desk` = `dark_oak_slab` top on `dark_oak_fence` legs.
- `sofa(g, x, y, z, len, facing)` -> `dark_oak_stairs` row facing the room; `table` = `dark_oak_fence` post + `dark_oak_pressure_plate` top; `chair` = `dark_oak_stairs` + `dark_oak_trapdoor` back; `rug` = carpets; `bookwall` = `bookshelf` stacks; `lampPost` = `birch_fence` + `lantern`; `stove` = `smoker` + `blast_furnace`; `counter` = `smooth_stone` slab on `barrel`; `windowSeat` = `birch_slab` bench under panes with `red_carpet`.

## ROOMS
Interior walls (partitions, built by P2 in `birch_planks`,): main floor: x9 (z10..23, y5..7), z16 (x2..8), z24 (x2..13); doorways (clear 2-3 tall, framed plainly): parlour-hall (9,5..7,14..15), parlour-dining (4..5,5..7,16), dining-hall (9,5..7,19..20), dining-kitchen (4..5,5..7,24), hall-kitchen (10..11,5..7,24). Garage level: x10 (z8..19, y1..3), z20 (x2..13); doorways garage-cellar (10,1..2,12), garage-laundry (6..7,1..2,20). 2nd floor: x11 (z8..14), z11 (x12..13) seals the stair well's north, z16 (x2..10), x10 (z17..23), z24 (x2..13), x9 (z25..31); 2nd-floor doorway cells: bedroom-landing (11,9..10,15) with a `birch_door`, study-landing (10,9..10,20), study-back bedroom (4,9..10,24), landing-bathroom (12,9..10,24). Top floor has no partitions. Holes: y4 x12..13 z21..23; y8 x12..13 z12..14; y12 x12..13 z17..19. A `birch_fence` railing guards the well rims: (11,5,21..23) and the hole edge at the top-floor (11,13,17..19).

### Stairs (blocks go in P2)
- Garage<->main: x12..13, `birch_stairs` facing=north: z23 y1, z22 y2, z21 y3 (fill under); foot at z24 (laundry), arrival z20 on the main floor.
- Main<->2nd: x12..13, `birch_stairs` facing=south: z12 y5, z13 y6, z14 y7 (fill under); foot z11 in the hall, arrival z15 on the 2nd floor.
- 2nd<->top: x12..13, `birch_stairs` facing=south: z17 y9, z18 y10, z19 y11 (fill under); foot z16, arrival z20 on the top floor.
- Front: the architect's front stair to the porch.

Rooms are listed in the JSON `rooms`. Summary (inner air boxes [x0,y0,z0,x1,y1,z1]):
| level | room | box | floor |
|---|---|---|---|
| garage | Garage | [2,1,8,9,3,19] | smooth_stone |
| garage | Cellar workshop | [10,1,8,13,3,19] | smooth_stone |
| garage | Laundry & store (holds the stair to the main floor) | [2,1,21,13,3,31] | smooth_stone |
| main | Front porch | [10,5,7,13,7,9] | smooth_quartz |
| main | Entry hall (holds the hall stair) | [10,5,11,13,7,23] | dark_oak_planks |
| main | Front parlour (+ bay alcove [2,5,6,5,7,6]) | [2,5,8,8,7,15] | dark_oak_planks |
| main | Dining room | [2,5,17,8,7,23] | dark_oak_planks |
| main | Kitchen | [2,5,25,13,7,31] | dark_oak_planks |
| 2nd | Front bedroom (+ bay alcove [2,9,6,5,11,6]) | [2,9,8,10,11,15] | spruce_planks |
| 2nd | Upper landing (holds the top stair) | [11,9,15,13,11,23] | spruce_planks |
| 2nd | Study/nursery | [2,9,17,9,11,23] | spruce_planks |
| 2nd | Back bedroom | [2,9,25,8,11,31] | spruce_planks |
| 2nd | Bathroom | [10,9,25,13,11,31] | spruce_planks |
| top | Top room, attic studio (+ bay seat [2,13,6,5,15,6]) | [2,13,8,13,16,31] | birch_planks |

The windows are the architect's OPENINGS; P5 fills them.

## PARTS (build in this order; P1 alone first, then the rest may run in parallel and merge in this order)
1. **P1 shell** `parts/shell.mjs` (massing, walls, floors, ground): sidewalk, drive, ground y0 (`smooth_stone` floor y0 inside, grass etc. stay P6), main body walls x1, x14 (y0..16 `birch_planks` interior face is not needed: use `dark_prismarine` y0..3, `warped_planks` above), front z7 and back z32 with `frontWallZone`, floors y4/y8/y12 with the three holes, the bay (bayCourse for y4..15, floors/cap z5..6 x1..6 at y4,8,12,16 and the y16 deck, leaving every OPENING and the bay mouth z7 x2..5 y5..15 and the RESERVED cells as air), porch recess walls and ceiling, neighbours (`neighbour`), y16 wall plate. Ticks 1,2,6,10,19,23,26,27,35 (shell part).
2. **P2 stairs & partitions** `parts/stairs.mjs`: `frontStair`, `newel`, the three interior `stairRun`s, partitions and doorway frames from ROOMS, fireplace surrounds (bricks) around the RESERVED firebox cells, well railings. Ticks 4,5,31,32.
3. **P3 roof** `parts/roof.mjs`: `roofCall`, back gable `bamboo_mosaic`, back-eave `smooth_quartz_stairs` half=top, `iron_bars` crest along the ridge, two `chimney`s. Never write at z <= 7. Ticks 21,22,18.
4. **P4 front facade** `parts/facade.mjs`: corbels, bay posts and crown/cornice, cornice with brackets, frieze, `parapet`, `pediment`, pilaster x14 z6, porch `column`s and `archSpring`, `hood`s and `sill`s on the front. Ticks 7,8,11,12,13,14,16,17,18,20.
5. **P5 openings** `parts/openings.mjs`: `sashWindow` into every OPENING (front and back), `garageDoor`, `doorPair` front door and French doors (x7..8 y5..6 z32, `crimson_door`, with `glass_pane` transom), back door (3,1,32) `crimson_door`, back sills/hoods at z33, cellar light. Ticks 3,9,15,17,35.
6. **P6 site** `parts/site.mjs`: `ironFence`, `streetLamp`, `gardenBed`, `deck`, `deckStair`, patio, back garden grass and path, `gardenTree`, `vegBed`, garden fences. Ticks 24,25,28,29,30.

### Checklist
- [ ] P1 shell  - [ ] P2 stairs & partitions  - [ ] P3 roof  - [ ] P4 front facade  - [ ] P5 openings  - [ ] P6 site

### Notes for workers
- Later parts only ADD into air: never overwrite a shell block; if a cell is taken, skip it and note it.
- Entry: the player stands at (11,5,9) in the porch and walks south through the door pair at z10.
- Keep every doorway and OPENING clear; interior designers rely on the partitions and doorways in ROOMS.
- Stairs `facing` = the side of the tall back: ascent direction. Check each stair run by walking it: `mcd walk build.nbt --rooms rooms.json`.
- Roof: the roof stays hollow over the top room (no ceiling at y16); if `shop` refuses the low pitch use style `gable`.
- Do not add colours: five only (teal, gold, burgundy, cream, sea-green) plus the roof grey.
