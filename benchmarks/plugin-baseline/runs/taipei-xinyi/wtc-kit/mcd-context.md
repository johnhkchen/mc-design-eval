# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
- [ ] P1 ITB shell and lobby  - [ ] P2 ITB crown, plaza  - [ ] P3 Hall  - [ ] P4 Hyatt  - [ ] P5 TICC  - [ ] P6 lighting and street

## Notes for workers
- Build each in site orientation, only on # cells; fill each mass down to ground. Never exceed plot height (205/45/125/75).
- No chain; 1.21.1 ids only. Leave openings as air then fill with glass; shell stops at y182 on ITB.
- Roofs: parapet + `sea_lantern` every <=12. No interiors beyond lobbies.
```

### elements.md

```markdown
# REQUIRED ELEMENTS (kit-local coords from plan.md; vocab names in VOCABULARY)

Parts: P1 itb-shell, P2 itb-crown-grounds, P3 hall, P4 hyatt, P5 ticc, P6 night-lighting.

## ITB (plot 0)
- [ ] Plinth/plaza y0..4, granite edge, clipped to #: `polished_granite` fill to ground, `polished_granite_slab` coping, `smooth_stone`/`polished_andesite` paving. P1, `plinth_fill`.
- [ ] Tower shaft 18..67 x 20..69, y4..182, chamfer 6: spandrel row `brown_terracotta` at y15,20..180; mullions `brown_terracotta` every 3; 2-wide `brown_stained_glass` bays; backing 1 in. P1, `curtain_bay`, `chamfer_corner`.
- [ ] Corner piers `brown_concrete` proud 1, full height. P1, `chamfer_corner`.
- [ ] Top window band y175..182 larger dark glass + `smooth_stone` cornice y182 proud 1. P1.
- [ ] Lobby podium 22..59 x 12..19, y4..14: `glass` behind `brown_terracotta` piers every 4, `ochre_froglight` ceiling y13; doors N z12 x38..43, E x67 z42..47, S z69 x40..45 (y4..8). P1, `lit_lobby_front`.
- [ ] Crown steps y183..190 / 191..197, lit rims `sea_lantern` behind `light_gray_stained_glass`; penthouse 34..51 x 36..53 y198..202 with `iron_trapdoor` louvres; 4 corner masts `redstone_torch` on `polished_andesite` y203..204 + on step-2 chamfers y198; 4 `end_rod` floodlights per side on deck. P2, `lit_rim`, `aircraft_light`, `floodlight`.
- [ ] Plaza planters (3 triangles per SITE) with oak trees every 6, lamp posts every 10, approach slab ramps E x84..89 z34..40 and N x36..44 z6..11. P2, `planter_tree`, `lamp_post`, `slab_ramp`.
- [ ] Window lighting scatter (12% warm, 6% cool, clusters). P6, `window_backing`.

## Exhibition Hall 1 (plot 1)
- [ ] Main hall box 156..365 x 35..258 y0..40, north block 212..372 x 0..34 roof y36, fringes, NW diagonal walkway y3 with `iron_bars` rails. P3.
- [ ] Pier rhythm: 2-wide `smooth_stone` piers every 7 proud 1 (south x=163+7k), `gray_stained_glass` bays over `black_concrete`/lit `pearlescent_froglight` 1 in 5; spandrels `light_gray_concrete` y14, y25. P3, `pier_bay`.
- [ ] Cornice y36..39 `smooth_quartz` + `smooth_stone_slab`, parapet y41..42. P3.
- [ ] South arcade piers `quartz_pillar` 2x2 z263..264, y3..21, canopy y22..24. P3, `arcade_pier`.
- [ ] Entrance porch 240..281 z259..272 deck y23..26 on 4 piers, `smooth_quartz` fascia, `smooth_stone` soffit with `ochre_froglight` every 4; lit glass lobby x245..276 y3..20, 8 door pairs (`iron_door`-free: glass-pane doors via `glass` gaps y3..4). P3.
- [ ] Lettering "TAIPEI WORLD TRADE CENTER" on frieze y29..35, centred x264, raised to z259, `black_concrete`, via `plaque`. P3.
- [ ] Flags: 7 `iron_bars` poles x244..280 step 6 at z271, y27..38; flags `red_wool`/`white_wool`/`blue_wool` 2 blocks east of pole top y36..37. P3, `flag_pole`.
- [ ] Roof: 5 skylight strips (`light_gray_stained_glass` over `pearlescent_froglight` y39), 6 AHU boxes `gray_concrete` + `iron_bars`, `sea_lantern` 12-grid. P3, `skylight_strip`, `ahu_box`.

## Grand Hyatt (plot 2)
- [ ] Podium 403..554 x 16..100 y0..24 (`polished_granite` base, `smooth_sandstone` spandrels, `gray_stained_glass` bands, `smooth_quartz` cornice y24). P4, `hotel_band`.
- [ ] Tower slab 430..530 x 46..72 y24..111 + stepped ends (W 418..429, 408..417; E 531..542, 543..552) with quartz cornice at y87,103,111. P4.
- [ ] Banding per storey of 5 (+0..1 `smooth_sandstone`, +2..4 glass, `cut_sandstone` mullion every 4), 25% warm backing. P4, `hotel_band`, P6.
- [ ] Crown y112..118: `light_gray_stained_glass` over `sea_lantern` y113..114, sign band y115..118; "GRAND HYATT" lit `ochre_froglight` letters on south z73 centred x480; penthouse 460..500 y119..123 + 4 red aircraft lights y124. P4, `plaque`, `aircraft_light`.
- [ ] Lobby z100 x440..520 y5..14 lit glass, doors x476..484 y5..7; porte-cochere canopy y14..16 on 4 piers 3x3, paved drive. P4, `lit_lobby_front`.
- [ ] West wing, SE terrace wall with planters, north glass pavilion. P4.

## TICC (plot 3)
- [ ] Terrace plinth 598..713 x 32..95 y0..6 `polished_granite` + slab lip. P5.
- [ ] Colonnade of 3x3 `quartz_pillar` piers y6..56, `smooth_quartz` base y6 and capital y56. P5, `ticc_pier`.
- [ ] Black glass curtain 610..697 x 40..87 y6..56, `gray_concrete` mullions every 3, transoms y16,26,36,46. P5.
- [ ] Roof slab y57..61 overhang, `smooth_quartz` faces, recessed `light_gray_concrete` line y59, soffit `smooth_stone` + `pearlescent_froglight` every 6. P5.
- [ ] Attic y62..67, parapet y68..69, roof plant 630..680 y70..72. P5.
- [ ] "TICC" banner letters east attic (hung x698), via `plaque`/banner. P5.
- [ ] Grand stair east x702..713 z48..79 (slab/stair monumental, slab ramps both ends) up to y6; lit lobby x697 z52..75 y6..20. P5, `grand_stair`.
- [ ] North annex, west wing, south wing. P5.

## Common
- [ ] Every roof and terrace lit: flush `sea_lantern` at least every 12. P6 + each part. `roof_light`.
- [ ] Street lamps `stone_brick_wall` + `lantern` along Xinyi Road frontage. P6, `lamp_post`.
```

### rooms.json

```json
{"entrance":[41,4,72],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "itb_glass": ["brown_stained_glass"],
    "itb_frame": ["brown_terracotta"],
    "itb_pier": ["brown_concrete"],
    "stone_coping": ["smooth_stone", "smooth_stone_slab"],
    "granite_base": ["polished_granite", "polished_granite_slab", "polished_granite_stairs"],
    "hall_body": ["light_gray_concrete"],
    "hall_glass": ["gray_stained_glass", "gray_stained_glass_pane"],
    "quartz_column": ["quartz_pillar"],
    "pale_trim": ["smooth_quartz", "smooth_quartz_slab", "smooth_quartz_stairs"],
    "paving": ["polished_andesite", "polished_andesite_slab"],
    "hyatt_band": ["smooth_sandstone", "smooth_sandstone_slab"],
    "hyatt_mullion": ["cut_sandstone"],
    "ticc_glass": ["black_stained_glass", "black_stained_glass_pane"],
    "ticc_mullion": ["gray_concrete"],
    "lobby_glass": ["glass", "glass_pane"],
    "dark_backing": ["black_concrete"],
    "warm_light": ["ochre_froglight"],
    "cool_light": ["pearlescent_froglight"],
    "roof_light": ["sea_lantern"],
    "rim_glass": ["light_gray_stained_glass"],
    "aircraft_light": ["redstone_torch"],
    "floodlight": ["end_rod"],
    "rail": ["iron_bars"],
    "louvre": ["iron_trapdoor"],
    "flag": ["red_wool", "white_wool", "blue_wool"],
    "lamp_post": ["stone_brick_wall", "lantern"],
    "tree": ["oak_log", "oak_leaves"],
    "planter": ["grass_block", "coarse_dirt"]
  },
  "objects": ["dirt"]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: node build.mjs writes a temp file, which is moved into place only when it succeeded.
set -eu
cd "$(dirname "$0")"
tmp="build.$$.tmp.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv -f "$tmp" build.nbt
```

### build.mjs

```js
// Taipei WTC group kit: lays the site (grid + ground from site.json), runs the six parts in order, saves to argv[2].
// Usage: node build.mjs <out.nbt>   (make.sh runs it to a temp file, then moves it into place)
import { existsSync, readFileSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSION, GROUND_FILL, PLANTER_TOP, SITE } from "./vocab/base.mjs";

const PARTS = [
  ["ITB shell and lobby", "parts/itb-shell.mjs"],
  ["ITB crown and plaza", "parts/itb-crown.mjs"],
  ["Exhibition Hall 1", "parts/hall.mjs"],
  ["Grand Hyatt", "parts/hyatt.mjs"],
  ["TICC", "parts/ticc.mjs"],
  ["Dusk lighting and street", "parts/lighting.mjs"],
];

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// A part whose module file is not there yet is skipped with a note, so one missing part never breaks the build.
const list = [];
for (const [name, file] of PARTS) {
  if (!existsSync(file)) {
    console.log(`part ${name}: ${file} missing, skipped`);
    list.push([name, () => {}]);
    continue;
  }
  const mod = await import(new URL(file, import.meta.url).href);
  list.push([name, mod.build]);
}

const g = new Grid([SITE.x, SITE.y, SITE.z], { dataVersion: DATA_VERSION });

// Ground: on every footprint cell (#) dirt from y 0 up to the cell's ground height, grass on top; air above.
const site = JSON.parse(readFileSync(new URL("./site.json", import.meta.url), "utf8"));
let columns = 0;
for (const plot of site.plots) {
  plot.footprint.forEach((row, r) => [...row].forEach((ch, c) => {
    const h = plot.ground[r][c];
    if (ch !== "#" || !h) return;
    for (let dx = 0; dx < plot.cell; dx++) for (let dz = 0; dz < plot.cell; dz++) {
      const x = plot.x0 + c * plot.cell + dx, z = plot.z0 + r * plot.cell + dz;
      if (!g.inBounds(x, 0, z)) continue;
      for (let y = 0; y < h; y++) g.set(x, y, z, y === h - 1 ? PLANTER_TOP : GROUND_FILL);
      columns++;
    }
  }));
}
console.log(`ground: ${columns} columns laid from site.json`);

runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: palette ids (palette.json only), site coordinates (plan.md), and a seeded rng.
// All ranges below are INCLUSIVE cell ranges in kit-local blocks, as plan.md writes them.

/** Data version of the server (Minecraft 1.21.1); build.mjs passes it to the Grid. */
export const DATA_VERSION = 3955;

// ---- palette: glass, frames and piers ------------------------------------------------------------------------------
/** ITB glass bays and back-lit glass. */
export const ITB_GLASS = "brown_stained_glass";

/** ITB spandrels, mullions and chamfer steps. */
export const ITB_FRAME = "brown_terracotta";

/** ITB full-height corner piers. */
export const ITB_PIER = "brown_concrete";

/** Cornices, coping and the top band's stone edge (full block). */
export const STONE_COPING = "smooth_stone";

/** Cornices, coping and paving bands (slab). */
export const STONE_COPING_SLAB = "smooth_stone_slab";

/** Plinths and bases (full block). */
export const GRANITE = "polished_granite";

/** Plinth coping at edges (slab). */
export const GRANITE_SLAB = "polished_granite_slab";

/** Monumental stair treads (grand stair). */
export const GRANITE_STAIRS = "polished_granite_stairs";

/** Hall body, frieze and spandrel bands. */
export const HALL_BODY = "light_gray_concrete";

/** Hall window bays. */
export const HALL_GLASS = "gray_stained_glass";

/** Hall window panes (glass_pane shape). */
export const HALL_GLASS_PANE = "gray_stained_glass_pane";

/** Hall arcade columns and TICC colonnade piers (axis y). */
export const QUARTZ_PILLAR = "quartz_pillar";

/** Pale cornices, fascias and copings (full block). */
export const PALE_QUARTZ = "smooth_quartz";

/** Pale copings (slab). */
export const PALE_QUARTZ_SLAB = "smooth_quartz_slab";

/** Pale stair treads. */
export const PALE_QUARTZ_STAIRS = "smooth_quartz_stairs";

/** Hall plinth and paving bands (full block). */
export const PAVING = "polished_andesite";

/** Paving bands (slab). */
export const PAVING_SLAB = "polished_andesite_slab";

/** Hyatt body bands (full block). */
export const SANDSTONE = "smooth_sandstone";

/** Hyatt body bands (slab). */
export const SANDSTONE_SLAB = "smooth_sandstone_slab";

/** Hyatt window mullions. */
export const CUT_SANDSTONE = "cut_sandstone";

/** TICC curtain-wall glass. */
export const TICC_GLASS = "black_stained_glass";

/** TICC curtain-wall panes (glass_pane shape). */
export const TICC_GLASS_PANE = "black_stained_glass_pane";

/** TICC mullions, transoms and plant. */
export const TICC_MULLION = "gray_concrete";

/** Lit lobby glass. */
export const LOBBY_GLASS = "glass";

/** Lobby glass panes. */
export const LOBBY_GLASS_PANE = "glass_pane";

/** Dark office backing behind every glass cell. */
export const DARK_BACKING = "black_concrete";

// ---- palette: light and detail ---------------------------------------------------------------------------------------
/** Warm window backing and lit lobby ceilings. */
export const WARM_LIGHT = "ochre_froglight";

/** Cool window backing, hall skylight glow. */
export const COOL_LIGHT = "pearlescent_froglight";

/** Flush roof and terrace lights, crown lit rims (under the rim glass). */
export const ROOF_LIGHT = "sea_lantern";

/** Glass laid over sea_lantern for the lit crown rims. */
export const RIM_GLASS = "light_gray_stained_glass";

/** Aircraft warning lights (on a polished_andesite post). */
export const AIRCRAFT_LIGHT = "redstone_torch";

/** Floodlights on the crown decks. */
export const FLOODLIGHT = "end_rod";

/** Railings and grilles. */
export const RAIL = "iron_bars";

/** Crown and penthouse louvres. */
export const LOUVRE = "iron_trapdoor";

/** Flag cloth. */
export const FLAG_RED = "red_wool";

/** Flag cloth. */
export const FLAG_WHITE = "white_wool";

/** Flag cloth. */
export const FLAG_BLUE = "blue_wool";

/** Lamp post base. */
export const LAMP_POST = "stone_brick_wall";

/** Lamp post head (standing). */
export const LAMP = "lantern";

/** Planter and plaza tree trunks. */
export const TREE_LOG = "oak_log";

/** Planter and plaza tree crowns (persistent). */
export const TREE_LEAVES = "oak_leaves";

/** Planter top (grass). */
export const PLANTER_TOP = "grass_block";

/** Planter soil (coarse dirt). */
export const PLANTER_SOIL = "coarse_dirt";

/** Ground fill under the site surface, laid by build.mjs. */
export const GROUND_FILL = "dirt";

// ---- site -----------------------------------------------------------------------------------------------------------
/** Full site grid size in blocks: x 0..717, y 0..205, z 0..274. */
export const SITE = { x: 718, y: 206, z: 275 };

/** Each plot's inclusive bounds and tallest height (plan.md SITE). x0 is the plot's offset along x. */
export const PLOT = {
  itb: { x0: 0, x1: 89, z0: 0, z1: 91, maxY: 205 },
  hall: { x0: 93, x1: 386, z0: 0, z1: 274, maxY: 45 },
  hyatt: { x0: 391, x1: 566, z0: 0, z1: 115, maxY: 125 },
  ticc: { x0: 570, x1: 717, z0: 0, z1: 111, maxY: 75 },
};

/** Main masses as [x0, y0, z0, x1, y1, z1], inclusive (plan.md SITE tables). */
export const MASS = {
  itbPlinth: [0, 0, 0, 89, 4, 91],
  itbLobby: [22, 4, 12, 59, 14, 19],
  itbShaft: [18, 4, 20, 67, 182, 69],
  itbCrown1: [20, 183, 22, 65, 190, 67],
  itbCrown2: [24, 191, 26, 61, 197, 63],
  itbPenthouse: [34, 198, 36, 51, 202, 53],
  hallMain: [156, 0, 35, 365, 40, 258],
  hallNorth: [212, 0, 0, 372, 36, 34],
  hallArcade: [163, 0, 259, 365, 24, 265],
  hallPorch: [240, 0, 259, 281, 26, 272],
  hyattPodium: [403, 0, 16, 554, 24, 100],
  hyattSlab: [430, 24, 46, 530, 111, 72],
  hyattCrown: [430, 112, 46, 530, 118, 72],
  hyattPenthouse: [460, 119, 52, 500, 123, 66],
  ticcPlinth: [598, 0, 32, 713, 6, 95],
  ticcHall: [610, 6, 40, 697, 56, 87],
  ticcRoof: [600, 57, 32, 703, 61, 95],
  ticcAttic: [606, 62, 38, 697, 67, 89],
  ticcStair: [702, 1, 48, 713, 6, 79],
};

// ---- rng --------------------------------------------------------------------------------------------------------------
/** rng(seed) returns a function giving floats in [0, 1); the same seed always gives the same sequence (mulberry32). */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Helpers from plan.md VOCABULARY (part 1): plinth_fill, chamfer_corner, lit_lobby_front, aircraft_light, planter_tree,
// slab_ramp, arcade_pier, skylight_strip, hotel_band, grand_stair. Kit-local coordinates; every position, facing and
// span is an argument. Same contract as h2.mjs, which the workers also use:
//   - writes only its own footprint, and only into air; a block id in `opts.over` may also be replaced.
//   - all or nothing: if any footprint cell is blocked (or outside the grid), nothing is written. The result says
//     why: { ok, placed, blocked: [[x, y, z]] }.
// Where plan.md's signature has no plane or span (lit_lobby_front, hotel_band), they are arguments here.

/**
 * Plinth under a mass. box = [x0, y0, z0, x1, y1, z1] (y1 = the plinth top). `ground` is a flat level, or a function
 * (x, z) => level, with null off the footprint: that is what makes a cell a # cell. Each # cell is filled from its
 * ground up to y1; the rim cells (next to a non-# cell) get a `block` slab on top instead of a full block.
 */
export function plinth_fill(g, box, ground, block, { over = [] } = {})

/**
 * Chamfered corner of a square shaft. (cx, cz) is the outer corner cell, dir = nw | ne | sw | se (the corner), size = the
 * cut (6: the cells with a + b < 6 are dropped, a + b = 6 is the staircase). Steps: brown_terracotta at each spandrel
 * row (y0 must be one: y0, y0+5, ...) and every third step; brown_stained_glass between; brown_concrete corner piers
 * at both ends of the diagonal, full height y0..y1.
 */
export function chamfer_corner(g, cx, cz, dir, size, y0, y1, { over = [] } = {})

/**
 * Lit lobby behind a glass front. The wall plane is `at` (the outer face of the piers); the glass is set back one
 * cell behind it. Piers of brown_terracotta every 4 cells along the span (x0..x1), y0..y1. Glass y0..y1-1 with an
 * ochre_froglight row at y1 (the lit ceiling). `doors` = [[a, b], ...] spans left open to doorHeight (default 5).
 */
export function lit_lobby_front(g, face, x0, x1, y0, y1, at, { doors = [], doorHeight = 5, over = [] } = {})

/** Aircraft warning light: a polished_andesite post at (x, y, z) with a redstone_torch on top. */
export function aircraft_light(g, x, y, z, { over = [] } = {})

/**
 * Planter box with a tree, centred on (x, z), bed level y. A 5 x 5 box 1 high: polished_andesite rim, grass_block soil
 * inside. Oak trunk 5 high on the soil; persistent oak_leaves crown from y+3 to y+6.
 */
export function planter_tree(g, x, y, z, { over = [] } = {})

/**
 * Slab ramp climbing in direction dir (north | south | east | west) from the low corner `from` = [x, y, z] (y = the
 * first air level above the ground). `width` cells across (toward +x for north/south, +z for east/west). `rise` in
 * blocks, default 1.5 (one flight: 3 smooth_stone_slab steps and a 2-long landing). `maxLen` = cells the run has: the
 * ramp throws instead of climbing past its footprint.
 */
export function slab_ramp(g, from, dir, width = 3, { rise = 1.5, maxLen = Infinity, over = [] } = {})

/** One arcade column: 2 x 2 quartz_pillar (axis y) at (x, z), min corner, from y0 to y1 (plan: 3..21). */
export function arcade_pier(g, x, z, { y0 = 3, y1 = 21, over = [] } = {})

/**
 * Skylight strip: light_gray_stained_glass 3 wide (z0..z0+2) from x0 to x1 in the deck at deckY (default 40), with a
 * row of pearlescent_froglight under its middle at deckY-1. The deck is solid, so pass over: [its block id].
 */
export function skylight_strip(g, x0, x1, z0, { deckY = 40, over = [] } = {})

/**
 * One storey (5 high, y0..y0+4) of a hotel tower face. The span is from..to along the face, the outer plane `at`.
 * +0..1 smooth_sandstone; +2..4 gray_stained_glass with a cut_sandstone mullion every 4 cells; behind each glass bay
 * one cell in a black_concrete backing, 25% ochre_froglight (deterministic per cell, not clustered).
 */
export function hotel_band(g, face, y0, from, to, at, { over = [] } = {})

/**
 * Grand stair in the box [x0, yLow, z0, x1, yHigh, z1]. It climbs in direction `facing` (the high side): one
 * polished_granite_stairs step per cell from the low end until the terrace level yHigh, then flat granite. The `ramp`
 * cells at each end of the width are slab ramps (the owner's standard). Throws if a ramp does not fit the box.
 */
export function grand_stair(g, facing, box, { ramp = 3, over = [] } = {})
```

### vocab/h2.mjs

```js
// Helpers from plan.md VOCABULARY (part 2): curtain_bay, window_backing, lit_rim, floodlight, lamp_post, pier_bay,
// flag_pole, ahu_box, ticc_pier, roof_light. Kit-local coordinates; every position and facing is an argument.
//
// Rules every helper keeps (workers rely on them):
//   - writes only its own footprint, and only into air; a cell in `opts.over` (block ids) may also be replaced.
//   - all or nothing: if any footprint cell is blocked, or a standing piece has no solid cell under it, nothing is
//     written. The result says why: { ok, placed, blocked: [[x,y,z]], unsupported: [[x,y,z]] }.
//   - nothing is written below the footprint (ground, sand and deck belong to earlier parts).

/**
 * Curtain wall bay for one face: per storey of 5, a brown_terracotta spandrel row, then 4 rows of brown_terracotta
 * mullions every 3rd cell with brown_stained_glass between, and a black_concrete backing one cell inside each glass.
 * (x0, z0) is the start corner on the wall plane (x0 on east/west, z0 on north/south); the run is opts.length cells
 * (default 50, the ITB shaft face). Returns the backing cells too, for window_backing().
 */
export function curtain_bay(g, face, x0, y0, z0, storeys, opts = {})

/**
 * Lit / dark choice for tower backing cells (the cells curtain_bay leaves as black_concrete): clusters of 2-6 adjacent
 * cells (now and then a whole floor) take ochre_froglight (warm) or pearlescent_froglight (cool) until the shares are
 * met, the rest stay black_concrete. Deterministic: the seed is a hash of the cells (or opts.seed).
 */
export function window_backing(g, cells, warm = 0.12, cool = 0.06, opts = {})

/**
 * Crown rim: on the box [x0, z0, x1, z1] at height y, the outer ring is light_gray_stained_glass and the ring one cell in
 * is sea_lantern, so the light sits behind the glass. The interior is left alone.
 */
export function lit_rim(g, box, y, opts = {})

/** Deck floodlight: an end_rod facing up at (x, y, z). The cell below must be solid (the deck). */
export function floodlight(g, x, y, z, opts = {})

/** Street lamp: two stone_brick_wall posts and a standing lantern on top, at (x, y, z). Needs solid ground below. */
export function lamp_post(g, x, y, z, opts = {})

/**
 * One pier and bay unit, 7 cells along the face from `x` (x on north/south faces, z on east/west faces): a 2-wide
 * smooth_stone pier proud 1 outward, then a 5-wide gray_stained_glass bay on the wall plane with black_concrete one
 * cell inside (pearlescent_froglight when opts.lit). opts.plane is the wall-plane coordinate (required: z on
 * north/south faces, x on east/west); opts.y0 / opts.y1 default to 3 / 36.
 */
export function pier_bay(g, x, face, opts = {})

/**
 * Flag pole at (x, z): iron_bars from deck+1 to deck+12 (deck defaults to 26, the porch deck top), standing on the deck.
 * A 2 x 2 wool flag east of the top: colour red, white or blue.
 */
export function flag_pole(g, x, z, colour, opts = {})

/**
 * Hall plant box at (x, z): 20 x 13 x 4 of gray_concrete, iron_bars grilles on the middle two rows of each side, and a
 * sea_lantern at the top north-west corner. Bottom at opts.y (default 41: the Hall deck is y 40). Needs the deck below.
 */
export function ahu_box(g, x, z, opts = {})

/**
 * TICC colonnade pier at (x, z), 3 x 3: a smooth_quartz base course at y (default 6), quartz_pillar (axis y) from
 * y+1 to y+49, and a smooth_quartz capital at y+50 (56). Needs the terrace below the base.
 */
export function ticc_pier(g, x, z, opts = {})

/** Roof light: sea_lantern at (x, y, z), set in the deck's top row on the solid cell below. */
export function roof_light(g, x, y, z, opts = {})
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
