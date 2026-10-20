# Taipei World Trade Center group: architect's plan (form)

All coordinates are KIT-LOCAL blocks: x = plot offset + local column (plot 0 at x 0, plot 1 at x 93, plot 2 at x 391,
plot 3 at x 570), z = 0 at each plot's north edge, y 0 = lowest ground. North is low z, south high z, east high x.
The footprint maps are the law: every mass below was checked row by row against the # cells. Where a box corner
falls outside the footprint (the ITB diamond), clip it to the # cells, never build past them.
The camera is to the SOUTH-EAST and high up, so south faces, east faces and roofs get the most detail.
Everything is flat-roofed and modern. Light every roof and terrace (a flush light at least every 12 blocks).

## SITE

Ground: flat, 0-5 above y 0 as the GROUND maps give it. Every mass starts with a plinth filled DOWN to that cell's
ground (no floating, no burying). Paving outside the walls but on # cells: `smooth_stone` with `polished_andesite`
bands, set at ground level.

### Plot 0: International Trade Building (x 0..89, z 0..91, max y 205)
Footprint is a tilted square (vertices about N (32,0), E (89,36), S (52,90), W (0,58)). Ground 3 on the west
side, 2 in the middle, 0 on the east side.

| Mass | x | y | z | Notes |
|---|---|---|---|---|
| Plinth / plaza deck | the whole footprint | 0..4 (fill down to ground) | the whole footprint | top at y 4 = plaza; granite edge; clipped to # |
| Lobby podium (north) | 22..59 | 4..14 | 12..19 | 2-storey lit glass lobby, joins the shaft's north face |
| Tower shaft | 18..67 | 4..182 | 20..69 | 50 x 50 square, corners chamfered 6 (diagonal cut: drop the corner triangle of 6 cells each side) |
| Crown step 1 | 20..65 | 183..190 | 22..67 | setback 2 all round, chamfer 5; lit rim at y 190 |
| Crown step 2 | 24..61 | 191..197 | 26..63 | setback 4, chamfer 4; lit rim at y 197 |
| Mechanical penthouse | 34..51 | 198..202 | 36..53 | louvred box |
| Masts and aircraft lights | 35, 50 at z 37, 52 | 203..204 | | four corner posts of the penthouse |
| Plaza planters (garden) | east triangle x 70..85 z 30..46; west triangle x 4..15 z 50..62; south triangle x 30..60 z 72..84 | 4..6 | (clip to #) | box planters 1 high of polished andesite, a tree every 6 (oak log 5, oak leaves crown) |
| Approach ramps | east side x 84..89 z 34..40; north side x 36..44 z 6..11 | 0..4 | | slab ramps (3 slabs, landing 2), 3 wide, up to the y 4 plaza |

### Plot 1: TWTC Exhibition Hall 1 (x 93..386, z 0..274, max y 45)
Ground 2 almost everywhere, 0-1 on the west fringe. Hall floor y 3.

| Mass | x | y | z | Notes |
|---|---|---|---|---|
| Main hall | 156..365 | 0..40 | 35..258 | the big box; plinth y 0..2, walls y 3..36, cornice 37..39, roof deck y 40 |
| North block | 212..372 | 0..36 | 0..34 | same skin, roof deck y 36 (one step lower) |
| South front arcade | 163..365 | 0..24 | 259..265 | free-standing piers under a canopy deck at y 22..24, in front of the hall's south wall |
| Entrance porch | 240..281 | 0..26 | 259..272 | the deep canopy: deck y 23..26, projecting to z 272, on 4 piers |
| West fringe strips (rows z 35..258, x 135..155 where #) | as #, x >= 135 | 0..12 | as # | low service/loading bays, flat roof y 12, gray concrete |
| East fringe (x 366..386 where #) | 366..386 | 0..12 | as # | low service bays, same as west |
| North-west diagonal ramp (x 100..148, z 35..76, the thin diagonal #) | as # | 0..3 | as # | elevated walkway deck at y 3, iron-bar rails, lamp every 10 |
| Roof plant | see ROOFS | 41..44 | | |
| Flagpoles | 244, 250, 256, 262, 268, 274, 280 | 27..38 | 271 | iron_bars poles standing on the porch deck edge; flag = 2 wool blocks at y 36..37 east of the pole top |

### Plot 2: Grand Hyatt Taipei (x 391..566, z 0..115, max y 125)
Ground 3 in the north half, 4 then 5 to the south. Lobby floor y 5.

| Mass | x | y | z | Notes |
|---|---|---|---|---|
| Podium | 403..554 | 0..24 | 16..100 | 4 storeys over the plinth; roof terrace y 24 |
| Porte-cochere forecourt | 440..520 | ground 5 | 101..115 | the drive, paved; canopy below |
| Porte-cochere canopy | 450..510 | 14..16 | 101..112 | flat deck on 4 square piers (3x3) at x 451..453 & 507..509, z 109..111 |
| West wing | 391..402 | 0..14 | 44..67 | low ballroom wing, roof y 14 |
| South-east podium corner | 555..566 | 0..10 | 16..115 where # | low garden terrace wall, planters on top |
| North pavilion | 455..514 | 0..9 | 0..7 | low glass pavilion (garden entry), flat roof y 9 |
| Tower main slab | 430..530 | 24..111 | 46..72 | 101 x 27 slab, long axis along x |
| Crown band | 430..530 | 112..118 | 46..72 | lit crown + sign |
| West step 1 | 418..429 | 24..103 | 48..70 | |
| West step 2 | 408..417 | 24..87 | 52..66 | |
| East step 1 | 531..542 | 24..103 | 48..70 | |
| East step 2 | 543..552 | 24..87 | 52..66 | |
| Penthouse | 460..500 | 119..123 | 52..66 | plant room, aircraft lights at its 4 corners y 124 |

### Plot 3: Taipei International Convention Center (x 570..717, z 0..111, max y 75)
Ground 4 on the west, falling to 1 on the east. Terrace floor y 6.

| Mass | x | y | z | Notes |
|---|---|---|---|---|
| Terrace plinth | 598..713 | 0..6 | 32..95 | raised granite podium, fill to ground |
| Hall body (glass box) | 610..697 | 6..56 | 40..87 | dark glass curtain behind the colonnade |
| Colonnade piers | lines x 604..606 and 699..701; z 34..36 and 89..91 | 6..56 | | 3x3 square piers, centres every 9 (see FACADES) |
| Overhanging roof slab | 600..703 | 57..61 | 32..95 | the deep roof: 4-block fascia, overhangs the piers by 2-4 |
| Attic | 606..697 | 62..67 | 38..89 | setback attic, parapet 68..69 |
| Roof plant | 630..680 | 70..72 | 55..72 | |
| Grand stair (east) | 702..713 | ground 1..6 | 48..79 | 32 wide monumental stair rising west to the terrace; slab ramps at its north and south ends (z 48..50, z 77..79) |
| North annex | 638..689 | 0..28 | 0..31 | service wing, same pier rhythm, roof y 28 |
| West wing | 582..597 | 0..18 | 56..95 | low wing, roof y 18 |
| South wing | 610..713 | 0..16 | 96..111 | low wing, roof y 16 |

## ROOFS

All flat; preset `modern` (flat-parapet-modern: parapet, smooth stone coping, slim cornice, iron-bar rail) by
building type (modern commercial). Overhang 0 except where stated. Roof lights: flush `sea_lantern` set in the deck
on a 12-block grid on every roof and terrace.

| Roof | y (deck) | Form | Notes |
|---|---|---|---|
| ITB crown | 182 / 190 / 197 / 202 | BY HAND (a part builds it): three stepped flat decks, each rim a lit band of `sea_lantern` behind `light_gray_stained_glass` 1 high just under the coping; penthouse 34..51 x 36..53 with `iron_trapdoor` louvres; deck 4 floodlights (`end_rod` upright) per side aimed at the crown | aircraft lights: `redstone_torch` on `polished_andesite` posts at the penthouse corners y 203..204, and on the four step-2 chamfers at y 198 |
| ITB lobby podium | 15 | `modern`, parapet 1, coping `smooth_stone_slab` | planters + lights |
| ITB plaza | 4 | paved deck, planters, lamp posts (fence + lantern) every 10 | |
| Hall main | 40 | `modern`, parapet y 41..42 of `light_gray_concrete`, coping `smooth_stone_slab` | skylight strips: 5 strips along x, each 3 wide, at z 60..62, 100..102, 140..142, 180..182, 220..222, x 170..350, `light_gray_stained_glass` in the deck over a row of `pearlescent_froglight` at y 39 (glows at dusk) |
| Hall plant | 41..44 | 6 AHU boxes, `gray_concrete` with `iron_bars` grilles: x 180..199, 230..249, 280..299 at z 80..92 and z 190..202 | |
| Hall north block | 36 | `modern`, parapet 37..38 | |
| Hall south canopy + porch | 24 / 26 | flat cantilever deck (`cafe`-like), fascia 3 deep of `smooth_quartz`, soffit `smooth_stone` with `ochre_froglight` every 4 | the porch roof is 2 higher than the arcade canopy |
| Hyatt podium terrace | 24 | `modern`, parapet 25 `smooth_sandstone`; planters, `sea_lantern` grid | |
| Hyatt tower + steps | 87 / 103 / 111 | flat decks, coping `smooth_quartz_slab` | step decks are terraces with lights |
| Hyatt crown | 118 | BY HAND: deck 118, crown band y 112..118 (see FACADES), penthouse 119..123 | |
| Hyatt canopy | 16 | flat, fascia `smooth_quartz`, soffit lights | |
| TICC roof slab | 61 | BY HAND: a heavy 5-high slab (y 57..61) overhanging the colonnade; underside (y 57) `smooth_stone` with `pearlescent_froglight` every 6 over the pier walk | |
| TICC attic | 67 | `modern`, parapet 68..69 `smooth_quartz`, iron-bar rail | |
| Low wings (all plots) | as SITE | `modern`, parapet 1 | |

## FACADES

### ITB (all four faces the same; south and east most seen)
- Base y 0..4: plinth of `polished_granite` with a `polished_granite_slab` coping at the plaza edge.
- Lobby y 4..14 (podium + shaft ground storeys): full-height clear `glass` set back 1 behind `brown_terracotta`
  piers every 4 blocks; backing lit (`ochre_froglight` ceiling at y 13).
- Shaft y 15..182: storeys of 5 (spandrel 1 + glass 4), 33 storeys. Spandrel row (y 15, 20, 25 … 180) of
  `brown_terracotta`, flush. Mullions: 1-wide `brown_terracotta` every 3 blocks, proud by 0 (flush) on the faces,
  glass bays 2 wide of `brown_stained_glass`. Behind every glass cell a backing block 1 in: `black_concrete` (dark
  office) or a light: about 12% `ochre_froglight` (warm), 6% `pearlescent_froglight` (cool), scattered in clusters
  of 2-6 bays (whole lit floors in places), never all.
- Chamfer faces: same grid, glass stepped on the diagonal, a `brown_terracotta` mullion at every step.
- Corner piers at each chamfer edge: `brown_concrete` 1 wide, full height, proud by 1.
- Top band y 175..182: one storey of larger dark glass (no mullion every other bay) under a `smooth_stone` cornice
  (y 182, 1 proud) — the recognizable top window band.
- Crown steps: `brown_terracotta` walls with `light_gray_stained_glass` rim lights (see ROOFS).

### Exhibition Hall 1 (south front = Xinyi Road, the main face; east second)
- Plinth y 0..2: `polished_andesite`.
- Pier rhythm on every long face: 2-wide `smooth_stone` piers every 7 blocks (5-wide bays) from y 3 to 36, proud by
  1. On the south face piers at x = 163 + 7k (k = 0..28). Bays: `gray_stained_glass` over `black_concrete` backing,
  with lit bays (`pearlescent_froglight` backing) in 1 of 5, more near the entrance.
- Spandrel bands of `light_gray_concrete` at y 14 and y 25 across the bays (flush, piers run through).
- Frieze y 29..35 on the south face, x 183..345: `light_gray_concrete`, the lettering band (below). Cornice y 36..39:
  `smooth_quartz` 1 proud at y 37, `smooth_stone_slab` coping.
- South arcade: free-standing `quartz_pillar` piers 2x2 at z 263..264 every 7 on the same x rhythm, y 3..21,
  carrying the canopy deck y 22..24.
- Entrance (porch): ground floor glass y 3..20 of `glass` with `ochre_froglight` backing (lit lobby), x 245..276 on
  the hall's south wall z 258.
- North block: same skin, frieze plain.

### Grand Hyatt
- Podium y 0..24: base course `polished_granite` y 0..5; storeys of 5 with continuous window bands; spandrel bands of
  `smooth_sandstone`, glass `gray_stained_glass`; cornice `smooth_quartz` y 24. South wall (z 100) lobby: `glass`
  y 5..14, x 440..520, lit `ochre_froglight` ceiling (y 14); porte-cochere canopy in front.
- Tower y 25..111: horizontal bands: per storey of 5, y+0..+1 `smooth_sandstone` band, y+2..+4 window band of
  `gray_stained_glass`, mullions `cut_sandstone` every 4. Backing: ~25% `ochre_froglight` (warm rooms, the hotel
  glows), ~5% `pearlescent_froglight`, rest `black_concrete`.
- Stepped ends: each step face the same banding; a `smooth_quartz` cornice at each step deck (y 87, 103, 111).
- Crown y 112..118: a lit band — `light_gray_stained_glass` over `sea_lantern` (y 113..114), then the sign band
  y 115..118 of `smooth_sandstone`.

### TICC
- Terrace plinth y 0..6: `polished_granite`, top `polished_granite_slab` lip.
- Colonnade: 3x3 square piers of `quartz_pillar` (axis y) y 6..56; centres every 9: west/east lines at z 39, 48,
  57, 66, 75, 84 (+ corners z 35, 90); north/south lines at x 609, 618 … 699 (+ corners x 605, 700). Base of each
  pier a `smooth_quartz` block course y 6, capital a `smooth_quartz` course y 56.
- Hall body: `black_stained_glass` curtain wall with `gray_concrete` mullions every 3 and transoms every 10 (y 16,
  26, 36, 46); lobby on the east face y 6..20 `glass` with `ochre_froglight` backing.
- Roof slab fascia y 57..61: `smooth_quartz` faces, a `light_gray_concrete` recessed line at y 59 (1 in).
- Attic: `light_gray_concrete` with `smooth_quartz` coping.
- Wings: `light_gray_concrete` with `quartz_pillar` piers every 9, dark glass between.

### Lettering and signs
- Hall south frieze: "TAIPEI WORLD TRADE CENTER" in the 5-row block font, letters `black_concrete` raised 1
  (plaque, material null) on the `light_gray_concrete` frieze, band y 29..35, centred at x 264, face south
  (wall face z 258, letters at z 259).
- Hyatt crown: "GRAND HYATT" in the block font, lit `ochre_froglight` letters on the 7-row band y 112..118 of the
  south face (z 72, letters raised to z 73), centred x 480. The rim light (y 113..114) runs on the other three faces only.
- TICC east attic: "TICC" in banner letters (6-row band y 62..67), black on white, east face x 697 (hung at x 698), centred z 63.

## MATERIALS

| Role | Block |
|---|---|
| ITB glass | `brown_stained_glass` |
| ITB frame / spandrel / mullion | `brown_terracotta` |
| ITB corner piers | `brown_concrete` |
| ITB cornice, coping | `smooth_stone`, `smooth_stone_slab` |
| Bases / plinths | `polished_granite`, `polished_granite_slab` |
| Hall piers | `smooth_stone` |
| Hall body, frieze, spandrels | `light_gray_concrete` |
| Hall arcade columns, TICC piers | `quartz_pillar` |
| Cornices, fascias, copings (pale) | `smooth_quartz`, `smooth_quartz_slab` |
| Hall plinth, paving bands | `polished_andesite` |
| Hall glass | `gray_stained_glass` |
| Hyatt body bands | `smooth_sandstone` |
| Hyatt mullions | `cut_sandstone` |
| Hyatt glass | `gray_stained_glass` |
| TICC glass | `black_stained_glass` |
| TICC mullions, plant | `gray_concrete` |
| Lobby glass | `glass` |
| Dark backing | `black_concrete` |
| Warm window light | `ochre_froglight` |
| Cool window light | `pearlescent_froglight` |
| Roof / rim / skylight light | `sea_lantern` (deck), `light_gray_stained_glass` over it for rims |
| Aircraft light | `redstone_torch` on `polished_andesite` |
| Floodlight | `end_rod` |
| Rails, grilles | `iron_bars` |
| Louvres | `iron_trapdoor` |
| Flags | `red_wool`, `blue_wool`, `white_wool` |
| Paving | `smooth_stone`, `polished_andesite` |
| Trees | `oak_log`, `oak_leaves` (persistent) |
| Street lamps | `stone_brick_wall` post + `lantern` |

No `chain` anywhere (hang lanterns from blocks). All ids above exist in 1.21.1 and pass `$MCD blocks --check`.

## OPENINGS

| Building | Opening | Where | Size |
|---|---|---|---|
| ITB | north lobby doors | podium north face z 12, x 38..43, y 4..8 | 6 wide x 5 high, glass doors, lit |
| ITB | east entrance | shaft east face x 67, z 42..47, y 4..8 | 6 x 5 |
| ITB | south entrance | shaft south face z 69, x 40..45, y 4..8 | 6 x 5 |
| ITB | windows | every glass bay of the shaft grid (y 16..19, 21..24, …) | 2 wide x 4 high |
| Hall | main entrance | south wall z 258, x 245..276, y 3..20 | 32 x 18 lit glass, 8 door pairs at y 3..4 |
| Hall | side entrances | east wall x 365 at z 120..125 and 200..205, y 3..10 | 6 x 8 |
| Hall | loading doors | west fringe bays, every 21 along z, y 0..8 | 5 x 9, `iron_trapdoor`-faced |
| Hall | windows | every pier bay y 3..35 | 5 wide |
| Hyatt | lobby | podium south wall z 100, x 440..520, y 5..14 | lit glass, doors x 476..484 y 5..7 |
| Hyatt | west wing door | x 391, z 54..57, y 3..6 | 4 x 4 |
| Hyatt | window bands | every tower storey y+2..+4 | continuous bands, mullion every 4 |
| TICC | east entrance | glass body east face x 697, z 52..75, y 6..20 | 24 x 15 lit, doors y 6..8 |
| TICC | west door | west wing x 582, z 70..73, y 4..7 | 4 x 4 |
| TICC | curtain wall | all four glass faces | 3-wide panes |

## RESERVED

| Cells | For |
|---|---|
| ITB crown y 183..204 above the shaft | the crown part (shell stops at y 182) |
| ITB planter boxes (SITE) and lamp posts every 10 on the plaza edge | garden part |
| Hall frieze y 29..35, x 183..345, z 259 | the letters (raised 1 in front of the frieze) |
| Hall flagpole cells x 244..280 step 6, z 271, y 27..38 | flags |
| Hall skylight strips (ROOFS) and AHU boxes | roof part |
| Hall arcade pier cells x 163+7k..164+7k, z 263..264, y 3..21 | arcade columns |
| Hyatt crown y 112..124 and sign face z 73 | crown + sign part |
| Hyatt canopy piers x 451..453 & 507..509, z 109..111, y 5..13 | porte-cochere |
| TICC pier cells (colonnade lines, FACADES) y 6..56 | the piers: the glass box shell stays inside them |
| TICC grand stair x 702..713, z 48..79 | stair part |
| TICC roof slab y 57..61 and attic letters x 697 | roof part, sign |
| Window backing cells (1 inside every glass cell, all towers) | the lighting part chooses lit / dark |

## FLOORS

| Building | Floor levels (y) | Interior volume |
|---|---|---|
| ITB | lobby 4 (double height to 14), offices 15, 20, 25 … 180 (5 per storey), crown 183, 191, 198 | shaft interior x 19..66, z 21..68 (hollow behind the backing ring) |
| Hall | 3 (hall floor), roof 40 | x 157..364, z 36..257, y 3..39 (shown only through entrance glass) |
| Hyatt | lobby 5, podium 10, 15, 20, terrace 24; tower 25, 30 … 110; crown 112 | podium x 404..553 z 17..99; slab x 431..529 z 47..71 |
| TICC | terrace 6, hall 6..56 (single great volume), attic 62 | x 611..696, z 41..86 |

---
# DESIGNER'S SECTIONS

## PALETTE
Architect's MATERIALS apply exactly (all ids checked OK for 1.21.1 via `$MCD blocks --check`). Shape variants and extras:
- Granite: `polished_granite`, `polished_granite_slab`, `polished_granite_stairs`. Andesite: `polished_andesite`, `polished_andesite_slab`.
- Pale: `smooth_quartz`, `smooth_quartz_slab`, `smooth_quartz_stairs`, `quartz_pillar` (axis y), `smooth_stone`, `smooth_stone_slab`.
- Hall: `light_gray_concrete`, `light_gray_concrete` slab not needed except `light_gray_concrete` (full only); `gray_stained_glass`, `gray_stained_glass_pane`, `black_concrete`.
- Hyatt: `smooth_sandstone`, `smooth_sandstone_slab`, `cut_sandstone`. TICC: `black_stained_glass`, `black_stained_glass_pane`, `gray_concrete`.
- ITB: `brown_stained_glass`, `brown_terracotta`, `brown_concrete`.
- Lobbies: `glass`, `glass_pane`, `ochre_froglight`. Lights: `sea_lantern`, `pearlescent_froglight`, `end_rod`, `redstone_torch`, `lantern`.
- Misc: `iron_bars`, `iron_trapdoor` (open), `stone_brick_wall`, `oak_log`/`oak_leaves` (persistent true), `red_wool`/`white_wool`/`blue_wool`, `smooth_stone` paving. No `chain`.

## VOCABULARY
- `plinth_fill(g, box, ground, block)`: fill column from each # cell's ground up to box top; never past #; granite coping slab on rim.
- `curtain_bay(g, face, x0, y0, z0, storeys)`: per storey of 5: spandrel row `brown_terracotta` (y+0), then 4 rows of `brown_terracotta` mullion every 3rd cell and `brown_stained_glass` between; one cell behind: `black_concrete`.
- `chamfer_corner(g, cx, cz, dir, size, y0, y1)`: diagonal staircase of `brown_terracotta` steps with glass inside, `brown_concrete` pier at each step edge.
- `window_backing(g, cells, warm=.12, cool=.06)`: choose clusters of 2-6 adjacent bays (some whole floors) to `ochre_froglight` / `pearlescent_froglight`, rest `black_concrete`; deterministic seed.
- `lit_lobby_front(g, face, x0, x1, y0, y1)`: `glass` wall set back 1 behind piers every 4, `ochre_froglight` ceiling row, door gaps 2 wide left open.
- `lit_rim(g, box, y)`: ring of `sea_lantern` 1 high behind `light_gray_stained_glass` just under coping.
- `aircraft_light(g, x, y, z)`: `polished_andesite` post 1 + `redstone_torch` on top.
- `floodlight(g, x, y, z)`: `end_rod` facing up on a deck cell.
- `planter_tree(g, x, y, z)`: `polished_andesite` box ring 1 high filled with `grass_block`/`coarse_dirt`; `oak_log` 5, crown of `oak_leaves` persistent.
- `lamp_post(g, x, y, z)`: `stone_brick_wall` x2 + `lantern` on top (standing).
- `slab_ramp(g, from, dir, width=3)`: bottom slabs `smooth_stone_slab`, 3 steps then 2-long landing; 3 wide.
- `pier_bay(g, x, face)`: 2-wide `smooth_stone` pier y3..36 proud 1; 5-wide bay `gray_stained_glass` over `black_concrete` (1 in 5 `pearlescent_froglight`).
- `arcade_pier(g, x, z)`: 2x2 `quartz_pillar` y3..21.
- `flag_pole(g, x, z, colour)`: `iron_bars` column y27..38; 2 wool cells east at y36..37.
- `skylight_strip(g, x0, x1, z0)`: 3 wide: `light_gray_stained_glass` in deck, `pearlescent_froglight` at y39 below.
- `ahu_box(g, x, z)`: 20x13 `gray_concrete` box 4 high, `iron_bars` grilles on sides, `sea_lantern` top corner.
- `hotel_band(g, face, y0)`: +0..1 `smooth_sandstone`, +2..4 `gray_stained_glass` with `cut_sandstone` mullion every 4, backing per `window_backing` (25% warm).
- `ticc_pier(g, x, z)`: 3x3 `quartz_pillar` y7..55, `smooth_quartz` y6 and y56.
- `grand_stair(g, ...)`: flight rising west of stairs `polished_granite_stairs` facing west, 1 rise per step, 12 wide steps over x702..713, landing at x702 y6; slab ramps at ends.
- `roof_light(g, x, y, z)`: `sea_lantern` flush in deck.

## ROOMS
Exterior-only build; only lit lobbies behind glass are rooms (shallow, 4 deep).
1. ITB north lobby: [22,4,13,59,13,18], double-height lit foyer (mood: warm bronze), a reception desk; in at doors z12 x38..43.
2. ITB east/south lobby: [40,4,62,45,13,68] south entrance foyer, lit; in at z69 x40..45.
3. Hall entrance lobby: [245,3,246,276,20,257] long lit glass concourse, ticket desks; in via z258 x245..276.
4. Hyatt lobby: [440,5,90,520,14,99] grand warm lobby, lounge seating, chandeliers; in via z100 doors x476..484.
5. TICC east lobby: [690,6,52,696,20,75] lit foyer; in via x697 z52..75.

## PARTS
Listed in the `parts` JSON below.
- [x] P1 ITB shell and lobby  - [ ] P2 ITB crown, plaza  - [ ] P3 Hall  - [ ] P4 Hyatt  - [ ] P5 TICC  - [ ] P6 lighting and street

## Notes for workers
- Build each in site orientation, only on # cells; fill each mass down to ground. Never exceed plot height (205/45/125/75).
- No chain; 1.21.1 ids only. Leave openings as air then fill with glass; shell stops at y182 on ITB.
- Roofs: parapet + `sea_lantern` every <=12. No interiors beyond lobbies.
