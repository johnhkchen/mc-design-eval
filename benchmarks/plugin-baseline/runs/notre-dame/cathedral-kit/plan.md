# Notre-Dame de Paris: architect's form plan (plot 0)

Coordinates are plot blocks: x 0..188 (west front at x 0, chevet at high x), z 0..110 (north = low z, the camera's
river side = high z), y 0 = lowest ground. Hard limits: stay inside the FOOTPRINT mask (5x5 cells), nothing above
y 139, spire tip block at y 137 exactly. Main axis = z 37 (every north/south pair below mirrors about z 37).
Polar coordinates for the chevet are around C = (x 150, z 37): r = distance in x/z, angle 0 = due east (+x).

## SITE

Ground (rock top, build down to it): y 3 under the west towers (x 0..34), y 2 over the nave, transepts and choir,
y 1 along the south-east choir (x 85..170, z 45..69) and the sacristy, y 0 at the sacristy's east edge.
Every mass stands on a plinth from its ground up to the common floor line **y 3**; where ground is y 1-2 the plinth
(2 courses) shows. No slab is laid beyond the footprint; the plot has no street, the camera is across the Seine.
The "front" of this building is the WEST face (x 0), not north.

| mass | x | y | z | notes |
|---|---|---|---|---|
| North west tower | 0..22 | 3..98 | 7..27 | flat deck y 96, parapet to y 98 (lidar 97-98) |
| South west tower | 0..22 | 3..98 | 47..67 | mirror of the north tower |
| West centre block (portal, rose, gallery) | 0..22 | 3..66 | 28..46 | top balustrade y 66 between the towers |
| Facade buttresses (4, full height) | 0..2 | 3..92 | 7..9, 25..27, 47..49, 65..67 | proud of the facade plane x 2 by 2; stop under the tower parapet |
| Nave clerestory (central vessel) | 23..85 | 3..45 | 27..47 | wall plate y 45, ridge y 59 on z 37 |
| Nave inner aisle + tribune | 23..85 | 3..37 | 19..26 / 48..55 | tribune roof y 33 (outer edge) to 37 (against the clerestory) |
| Nave outer aisle | 23..85 | 3..29 | 11..18 / 56..63 | lean-to roof y 24 (outer) to 29 |
| Nave side chapels | 23..85 | 3..21 | 5..10 / 64..69 | chapels between the buttress piers, roof top y 21 |
| Nave buttress piers (6 per side) | 31..32, 40..41, 49..50, 58..59, 67..68, 76..77 | 3..38 (+pinnacle to 43) | 4..10 / 64..70→clip 69 | outer piers, 2 thick in x, 6 long in z; pinnacle 3x3 → 1 on top |
| Crossing | 86..104 | 3..45 | 27..47 | carries the spire; walls are the transept/nave walls |
| North transept arm | 86..104 | 3..45 | 1..26 | gable face at z 1, ridge y 57 on x 95; porch x 86..104, z 0 (portal splay) |
| South transept arm | 86..104 | 3..45 | 48..69 | gable face at z 69 (camera side), ridge y 57 |
| Transept corner buttresses | 84..86, 104..106 | 3..50 (+pinnacle 55) | 0..3 / 66..69 | flank each rose gable |
| Choir clerestory | 105..149 | 3..45 | 27..47 | ridge y 59 on z 37 |
| Choir double aisles + tribune | 105..149 | as nave | 11..26 / 48..63 | same bands and heights as the nave |
| Choir chapels | 105..149 | 3..21 | 5..10 / 64..69 | between piers |
| Choir buttress piers (4 per side) | 113..114, 122..123, 131..132, 140..141 | 3..38 (+pinnacle 44) | 4..10 / 64..69 | flyers spring from these |
| Apse (hemicycle clerestory) | r ≤ 10, x ≥ 150 | 3..45 | | half-cylinder wall r 10, half-cone roof to y 59 |
| Inner ambulatory + tribune ring | r 11..17, x ≥ 150 | 3..36 | | roof y 32 outer to 36 inner |
| Outer ambulatory ring | r 18..24, x ≥ 150 | 3..27 | | roof y 23 outer to 27 inner |
| Radiating chapels ring | r 25..32, x ≥ 150 | 3..20 | | 5 chapels (centred at angles -72, -36, 0, 36, 72); axial chapel (angle 0) reaches r 35 = x 185 |
| Chevet piers (6) | at angles -90+18, -54, -18, 18, 54, 90-18 → r 26..33, 2 wide tangential | 3..38 (+pinnacle 44) | | between the chapels; clip to z 4..69 |
| Sacristy link (cloister gallery) | 120..144 | 1..12 | 70..84 | low gallery, ridge y 13-14 along x |
| Sacristy hall | 125..154 | 0..17 | 85..99 | neo-Gothic hall, roof to y 24 |
| Sacristy west wing | 115..124 | 1..14 | 80..99 | lower wing, roof to y 16 |
| Sacristy south chapel | 135..149 | 1..18 | 100..109 | gable to the south, ridge y 26 along z on x 142 |
| South transept buttress stub | 105..109 | 1..12 | 70..72 | low pier with a lantern (fills footprint cell) |

Footprint spots left as ground (paved): z 0..3 along the nave north side, the strip x 110..119 z 70..74,
anything inside the mask the masses above do not cover. Pave with `smooth_stone` + `polished_andesite` flags; garden
patches (`grass_block`, `moss_block`, a few `azalea` bushes) only on the south-east beside the sacristy link
(x 105..119, z 70..79 inside the mask): the edge of Square Jean-XXIII.

## ROOFS

All main roofs are lead: `deepslate_tiles` field, `deepslate_tile_stairs`/`_slab` edges, ridge of
`polished_deepslate` with an `iron_bars` cresting 1 high every other cell (the lead ridge crest). No preset matches a
Gothic cathedral (`church` is a stave tier): use the roof tool with `style: "gable"`, steep, then hand-build the rest.

| roof | form | eave (wall plate) | ridge | pitch | overhang | built by |
|---|---|---|---|---|---|---|
| Nave + choir | one continuous gable, ridge along x on z 37, from x 23 (meets the west centre block's back) to x 149 | y 45 on z 27 and z 47 | y 59, x 23..150 | 1.4 (14 up over 10) | 1 at the eaves (stair course z 26 / 48 at y 45), none at the west end (it dies into the centre block) | roof tool, `ridgeAxis: x`, `pitch: 1.4`, `overhang: 1`, footprint x 23..149 z 27..47, `y: 45`, `keep` the crossing x 86..104 |
| Transept | gable, ridge along z on x 95 | y 45 on x 86 and x 104 | y 57, z 1..69 | 1.33 | 1 at the eaves, gables are masonry (z 1 and z 69) | roof tool, `ridgeAxis: z`, footprint x 86..104 z 1..69 minus the nave/choir band; the transept ridge meets the nave roof's slope (valleys at x 86/104) |
| Crossing | the four slopes meet under the spire base | | | | | hand: fill so no hole remains between the nave ridge y 59, the transept ridge y 57 and the spire base |
| Apse | half-cone (7 hipped facets) from the choir ridge end x 150 y 59 down to the r 10 wall plate y 45, pitch 1.4 | y 45 | y 59 | 1.4 | 1 | hand (`cone`/`hip` brush, half) |
| Tribune roofs | lean-to against the clerestory, lead slabs | outer y 33 | inner y 37 | ~0.6 | 0 | hand |
| Outer aisle roofs | lean-to | outer y 24 | inner y 29 | ~0.7 | 0 | hand |
| Chapels (nave, choir, chevet) | flat lead terrace with a stone balustrade; chevet chapels get a small hipped cap each (y 18 → 21) | y 18 | 21 | | 0 | hand |
| Ambulatory rings (chevet) | conical lean-to rings | outer y 23 / 32 | inner 27 / 36 | | 0 | hand |
| West towers | FLAT deck (`smooth_sandstone_slab` y 96) with an open balustrade y 97..98 and short corner pinnacles to y 98 | | | | | facade part |
| West centre block | flat terrace behind the Grande Galerie, y 66 | | | | | facade part; the nave roof's west gable (y 45..59) shows behind it, masonry, sandstone |
| Sacristy hall | hip roof, `deepslate_tiles`, ridge along x on z 92 | y 17 | y 24 | 1.0 | 1 | roof tool `style: hip` |
| Sacristy south chapel | gable, ridge along z on x 142, gable to the south | y 18 | y 26 | 1.1 | 1, verge stone | roof tool |
| Sacristy wing + link | gable along their long axis | y 14 / 11 | 16 / 14 | 1 | 1 | roof tool |

THE SPIRE (hand-built, octagonal, centred on x 95, z 37; dark lead `polished_deepslate` + `deepslate_tiles`, oak
frame lines in `dark_oak_log`):
| stage | y | octagon width (x and z extent) | form |
|---|---|---|---|
| Base / socle | 52..60 | 11 (x 90..100, z 32..42), corners cut 3 | solid lead, sits in the crossing roof |
| Lower open stage | 61..76 | 9 (x 91..99, z 33..41), corners cut 2 | 8 tall gabled lancet openings (1 wide, y 63..72, `dark_oak_trapdoor` louvres), 8 slim corner pinnacles to y 80 |
| Needle | 77..132 | 7 (77..90), 5 (91..106), 3 (107..122), 1 (123..132) | every course a ring; crocket ring of `deepslate_tile_stairs` (upside-down, out 1) at y 84, 98, 112, 124 |
| Cross + rooster | 133..137 | 1 | y 133-134 `polished_deepslate_wall`, y 134 arms `iron_bars` x 94..96, y 135 `chain`, y 136 `gold_block` (the rooster), **y 137 `lightning_rod` = the tip and the highest block of the build** |
| Apostles | 60..62 | | 4 groups of 3 statues in verdigris (`oxidized_cut_copper` body + `oxidized_cut_copper_stairs` head), one group per roof arm, standing on the ridges stepping out from the base: west x 88, 86, 84; east x 102, 104, 106 (z 37, on ridge y 59 → statues y 60..61); north z 30, 28, 26 and south z 44, 46, 48 (x 95, on ridge y 57 → y 58..59) |

## FACADES

Depth convention: "proud +n" = n blocks in front of the wall plane; "-n" = recessed.

WEST FRONT (plane x 2; the four buttresses at x 0..1 proud +2, full height to y 92). Three vertical divisions
(north tower / centre / south tower), five horizontal stages:
| stage | y | content |
|---|---|---|
| Plinth | 3..4 | `stone_bricks` 2 courses at the buttress feet only (the portals open to the parvis) |
| Portals | 3..29 | three deep pointed portals, splayed by stepped archivolts (each ring -1 deeper, 4 rings: x 2→6), tympanum `chiseled_sandstone` with a lintel band of `cut_sandstone`, trumeau post (`sandstone_wall`) in the middle of the doors; small gable over each arch to y 29 |
| Gallery of Kings | 31..37 | continuous band of 28 niches (1 wide, 3 tall, -1) every 2 blocks z 8..66, each with a king (`smooth_sandstone` body + `chiseled_sandstone` head); `cut_sandstone_slab` hood over; string course `smooth_sandstone_stairs` (upside-down, +1) at y 30 and y 38 |
| Rose stage | 39..59 | Virgin's gallery: `sandstone_wall` balustrade proud +1 at y 39 across the front; WEST ROSE in the centre (centre y 49, z 37, radius 7, glass at x 3, tracery ring and 12 spokes of `chiseled_sandstone`, framed by a square of `cut_sandstone` with pointed relieving arch); each tower a pair of tall lancets (3 wide, y 42..56, -2, glazed dark) under one pointed arch |
| Grande Galerie | 60..68 | pierced gallery across the full width: slim `sandstone_wall` colonnettes every 2 blocks at x 2, air 2 deep behind, pointed heads; top balustrade at y 66 over the centre; chimeras (gargoyle stairs +2) at the tower corners at y 68 |
| Belfry | 69..95 (towers only) | each tower, every face (W, N/S, E above the roofs): TWO tall lancet openings 4 wide y 71..91, -3 deep, `dark_oak_trapdoor` louvres inside; corner buttresses +1 with set-offs every 8 (`smooth_sandstone_stairs`); a cornice of upside-down stairs at y 95 |
| Top | 96..98 | flat deck, open balustrade (`sandstone_wall`), corner pinnacles to y 98 |

SOUTH SIDE (the camera face, plane per band; bay rhythm = the pier positions above):
| element | where | detail |
|---|---|---|
| Chapel wall | z 69 (nave 23..85, choir 105..149) | plinth y 1..4 `stone_bricks`; one tall lancet per bay (3 wide, y 6..16, -1); balustrade y 19..21 on top |
| Buttress piers | listed above | `smooth_sandstone`, set-offs (stairs) at y 18 and y 30, tabernacle niche -1 at y 32..35, pinnacle (`end_stone_brick_wall` spike to y 43/44 on a 3x3 → 1 stack with a `lightning_rod` finial); a gargoyle (`smooth_sandstone_stairs` + `sandstone_wall`, +2 outward) at y 36 |
| Tribune wall | z 55 above the outer aisle roof | small round-headed window per bay y 31..33 |
| Clerestory | z 47 | one tall lancet per bay (3 wide, y 35..43, -1) under a pointed `cut_sandstone` hood; balustrade y 45..46 along the eave + a gargoyle at every pier line |
| FLYING BUTTRESSES | every pier, both sides of nave and choir | ONE block thick (in x), an arc from the pier's top (z 66, y 38) up to the clerestory (z 48, y 43), underside a curve of upside-down `smooth_sandstone_stairs`, top a sloping coping (`smooth_sandstone_stairs`), clear air under it over the aisle roofs; mirror on the north (z 8 → z 26) |
| South transept gable | z 69, x 86..104 | portal (St Stephen) 7 wide y 3..17, -3 splay; SOUTH ROSE centre (x 95, y 34, z 69), radius 7, glass at z 68; pierced gallery y 43..45; gable triangle y 46..57 with a small rose (radius 2, y 51) and a pinnacle on the apex to y 60; corner buttresses with pinnacles to y 55 |
| North transept gable | z 1 | same as south (cloister portal), NORTH ROSE centre (x 95, y 34, z 1), radius 7, glass at z 2 |

CHEVET (camera's main subject): seven radial bays. Chapel walls r 32 with one lancet each (3 wide, y 6..15);
ambulatory and tribune ring walls each with a window per bay; apse clerestory r 10 with seven tall lancets
(3 wide, y 35..43). **Flyers**: from each chevet pier top (r 30, y 38) one block thick along the radius up to the apse
wall plate (r 11, y 44): spans of ~19 blocks, airy, the dominant line of the hero view; every pier crowned by a
pinnacle to y 44. A pierced balustrade runs round the apse eave at y 45..46. Gargoyles at every pier at y 36.

Light stone hierarchy (all faces): plinth `stone_bricks`/`polished_andesite` (darker base) → body `smooth_sandstone`
with ~10% `sandstone` courses near the ground → string courses `cut_sandstone` / `smooth_sandstone_stairs` → carving
(tympana, rose tracery, crockets, niches) `chiseled_sandstone` → pinnacles and balustrades `end_stone_brick_wall` and
`sandstone_wall` (the paler grey-cream reads as fresh carved stone).

## MATERIALS

| role | block id |
|---|---|
| wall body (60%) | `smooth_sandstone` |
| ashlar variation, lower courses (≤10%) | `sandstone` |
| string courses, frames, lintels | `cut_sandstone`, `cut_sandstone_slab` |
| carving: tympana, rose tracery, statues' heads, niches | `chiseled_sandstone` |
| mouldings, set-offs, flyers, coping | `smooth_sandstone_stairs`, `smooth_sandstone_slab` |
| balustrades, colonnettes | `sandstone_wall` |
| pinnacles, crockets (paler accent) | `end_stone_brick_wall`, `end_stone_bricks` |
| plinth / base | `stone_bricks`, `polished_andesite` |
| roof field (lead) | `deepslate_tiles`, `deepslate_tile_stairs`, `deepslate_tile_slab` |
| ridges, spire structure | `polished_deepslate`, `polished_deepslate_wall` |
| ridge cresting | `iron_bars` |
| spire frame lines, louvres | `dark_oak_log`, `dark_oak_trapdoor` |
| apostles | `oxidized_cut_copper`, `oxidized_cut_copper_stairs` |
| rooster / cross | `gold_block`, `chain` (1.21.1 id), `lightning_rod` (tip) |
| roses | `blue_stained_glass_pane` (field), `red_stained_glass_pane` (ring), `purple_stained_glass_pane` + `yellow_stained_glass_pane` (centre) |
| lancets | `blue_stained_glass_pane` with `purple_stained_glass_pane` heads |
| belfry openings | `dark_oak_trapdoor` (open, louvre) |
| warm floodlight | `ochre_froglight` (flush in the plinth and paving), `shroomlight` behind glass |
| lamps | `lantern` (hanging under cornices, on `sandstone_wall` posts) |
| paving / garden | `smooth_stone`, `polished_andesite`, `grass_block`, `moss_block`, `azalea` |

All checked with `$MCD blocks --check ... --version 1.21.1`: known. Do NOT write `iron_chain` (26.x name).

## OPENINGS

| opening | face | coordinates | size |
|---|---|---|---|
| West central portal (Last Judgement) | x 2 (splay to x 6) | z 32..42, y 3..22 (pointed apex y 22), doors at x 6 | 11 wide; doors 2 x 4 each side of the trumeau z 37 |
| West north portal (Virgin) | x 2 → 6 | z 13..21, y 3..19 | 9 wide |
| West south portal (St Anne) | x 2 → 6 | z 53..61, y 3..19 | 9 wide |
| West rose | x 2..3 | centre (y 49, z 37), r 7: y 42..56, z 30..44 | 15 dia |
| Tower lancet pairs (rose stage) | x 2, -2 | north z 10..12 & 22..24; south z 50..52 & 62..64; y 42..56 | 3 x 15 each |
| Grande Galerie arcade | x 2, open 2 deep (x 3..4) | z 7..67, y 60..65 | arcade |
| Belfry lancets | each tower face | west face of N tower z 9..12 & 22..25, y 71..91 (south tower mirror z 49..52, 62..65); north/south faces x 4..7 & 15..18; east faces as west | 4 x 21, louvred |
| Kings' niches | x 2, -1 | every 2 blocks z 8..66, y 32..34 | 1 x 3 |
| South transept portal | z 69, -3 | x 92..98, y 3..17 | 7 wide |
| North transept portal | z 1, -3 | x 92..98, y 3..17 | 7 wide |
| South rose | z 68..69 | centre (x 95, y 34), r 7: x 88..102, y 27..41 | 15 dia |
| North rose | z 1..2 | centre (x 95, y 34), r 7 | 15 dia |
| Gable roses (small) | z 1 / z 69 | centre (x 95, y 51), r 2 | 5 dia |
| Chapel lancets | z 5 / z 69 and chevet r 32 | one per bay, centred between piers, y 6..16 | 3 wide |
| Tribune windows | z 18 / 56 (nave+choir), chevet r 17 | one per bay, y 31..33 | 3 x 3 |
| Clerestory lancets | z 27 / 47, apse r 10 | one per bay, y 35..43 | 3 x 9 |
| Sacristy | hall south face z 99 + chapel z 109 | 3 lancets each (2 wide, y 4..12); door x 140..141, y 1..3 on the link's east face x 144 | |

## RESERVED (the shell leaves these empty; later parts fill them)

- Portal splays and tympana: x 2..6 inside each portal outline (archivolt part).
- Kings' niches (x 2, y 32..34) and the Grande Galerie air x 3..4, y 60..65 (facade part).
- All rose and lancet outlines above (glazier), plus the 1-block reveal in front of the glass.
- Flyer arcs: the air volume between every pier top and the clerestory (x = pier x, z 11..26 / 48..63, y 30..44
  and the chevet radials): no aisle/tribune roof may rise into a flyer's path; aisle roofs stop 1 below.
- Spire volume: x 90..100, z 32..42, y 52..137; the crossing roof stops at its socle.
- Apostle stands: the ridge cells listed in ROOFS (statues stand on the ridge top).
- Pinnacle tops: 3x3 above each pier top (y 39..44), gargoyle cells +2 out at y 36.
- Floodlight sockets: one `ochre_froglight` cell at each pier foot in the plinth face (y 3, outside face) and four
  set into the paving 3 cells in front of the west portals (only inside the mask).

## FLOORS (exterior-only build; interior is a lit void that glows through the glass)

| volume | floor y | ceiling (vault crown) | x / z | use |
|---|---|---|---|---|
| Nave central vessel | 3 | 42 | x 23..85, z 28..46 | open; hang `lantern`s on `chain`s down the centre line every 6 |
| Crossing + transept arms | 3 | 42 | x 87..103, z 2..68 | open; lanterns behind both roses so they glow |
| Choir + apse | 3 | 42 | x 105..159, z 28..46 / r ≤ 9 | open; candles/lanterns |
| Aisles (inner, outer) | 3 | 18 | z 11..26 / 48..63 | lanterns every bay |
| Tribunes | 22 | 32 | over the inner aisles | lanterns every bay |
| Chapels | 3 | 16 | z 6..10 / 64..68, chevet r 25..31 | one lantern each |
| West tower bases | 3 | 28; belfry floors y 40, y 69 | x 3..21 | dark, lantern each floor |
| Sacristy | 1 | 15 | x 126..153, z 86..98 | lanterns |
| Walkable roofs (tribune, aisle terraces, tower decks y 96, Galerie y 60, centre terrace y 66) | | | | lantern on a `sandstone_wall` post every 8 blocks so nothing spawns |

---
# DESIGNER'S SECTIONS

## PALETTE (ids as MATERIALS; all valid in 1.21.1)

| role | blocks |
|---|---|
| wall | smooth_sandstone, sandstone (lower), cut_sandstone, cut_sandstone_slab, chiseled_sandstone |
| stone shapes | smooth_sandstone_stairs, smooth_sandstone_slab, sandstone_wall, end_stone_bricks, end_stone_brick_wall |
| plinth | stone_bricks, stone_brick_stairs, polished_andesite |
| lead roof | deepslate_tiles, deepslate_tile_stairs, deepslate_tile_slab, polished_deepslate, polished_deepslate_wall, iron_bars |
| spire | polished_deepslate, deepslate_tiles, dark_oak_log, dark_oak_trapdoor, chain, gold_block, lightning_rod |
| statues | oxidized_cut_copper, oxidized_cut_copper_stairs |
| glass | blue/red/purple/yellow_stained_glass_pane (+ blue_stained_glass in 1-thick fills), dark_oak_door |
| light | ochre_froglight, shroomlight, lantern (hanging true/false), chain |
| ground | smooth_stone, polished_andesite, grass_block, moss_block, azalea |

## VOCABULARY
- `plinthCourse(box)`: stone_bricks y plinth, top course polished_andesite, down to ground (no floating).
- `ashlarWall(box, face)`: smooth_sandstone; 10% sandstone below y 12; cut_sandstone string course every 8 y and quoins at corners.
- `lancetOpening(x,y,z,face,w,h,glass)`: pointed arch: top rows narrowing by 1 each side using upside-down smooth_sandstone_stairs; sill slab; panes blue with purple at the head; recessed 1.
- `roseWindow(centre,face,r,glass)`: disc of panes (ring red at r-1..r, field blue, centre purple+yellow r≤1), 12 chiseled_sandstone spokes, ring of chiseled_sandstone at r+1, square cut_sandstone frame.
- `portal(x,z,w,h,face,rings=4)`: pointed void, each archivolt ring one block deeper (cut_sandstone + stairs), tympanum chiseled_sandstone, lintel cut_sandstone, trumeau sandstone_wall, dark_oak_door pair.
- `kingNiche(x,y,z)`: 1x3 recess (front not placed), smooth_sandstone body + chiseled_sandstone head, cut_sandstone_slab hood.
- `balustrade(line,y)`: sandstone_wall run, posts end_stone_brick_wall every 4.
- `colonnade(line,y0,y1,step=2)`: sandstone_wall colonnettes, upside-down stair heads.
- `setoffButtress(box,yList)`: smooth_sandstone narrowing by stairs at set-offs.
- `pinnacle(cx,cz,y0,h)`: 3x3 smooth_sandstone to 2 high, stairs ring, end_stone_brick_wall spike, lightning_rod finial; keep to stated y 43/44.
- `gargoyle(x,y,z,dir)`: smooth_sandstone_stairs + sandstone_wall, +2 outward.
- `flyer(from,to,axis)`: one-block-thick arc of smooth_sandstone_stairs (upside-down underside, upright coping), rise ~5, span per plan, air below.
- `leadRoof(...)`: deepslate_tiles with deepslate_tile_stairs edges, polished_deepslate ridge, iron_bars crest every other cell; slabs for lean-tos.
- `ringWall(r0,r1,y0,y1,arc)`: polar wall, windows per bay, clip to z 4..69 and the footprint.
- `octagonRing(cx,cz,y,w,cut,mat)`: one course of an octagon.
- `spireStage(...)`: stacks octagonRing per plan table, dark_oak_log corner lines, crocket stairs upside-down.
- `statue(x,y,z)`: oxidized_cut_copper body + oxidized_cut_copper_stairs head.
- `glazeOpening(box,face)`, `floodlight(x,z)`: ochre_froglight flush in plinth/paving; `lampPost(x,y,z)`: sandstone_wall x3 + lantern; `pavePatch(box)`: smooth_stone/polished_andesite mix.

## ROOMS
Exterior-only. Interior voids carry light so glass glows. No walkable furnished rooms; one lit void:
Nave/crossing/choir (see FLOORS), for lanterns only.

## PARTS (build order)
1. P1 Masonry shell (parts/shell.mjs): plinths, all masses per MASSES table incl. apse/rings/chapels/sacristy walls, leaving reserved cells.
2. P2 Lead roofs (parts/roofs.mjs): roof tool for nave/choir, transept, sacristy; hand lean-tos, apse cone, crossing fill.
3. P3 West front (parts/west.mjs): towers' detail, portals, kings, rose, galleries, belfries, decks.
4. P4 Chevet, south side, flyers (parts/chevet.mjs): ring windows, piers, flyers, pinnacles, gargoyles, transept gables+roses.
5. P5 Spire (parts/spire.mjs): per table, apostles, tip y137.
6. P6 Glass, light, grounds (parts/finish.mjs): glazing, shroomlight, froglights, lanterns, paving, garden.

## NOTES
- Never exceed footprint or y139; tip lightning_rod at (95,137,37) exactly. Use `chain`, not iron_chain. Recess by omission. Run `$MCD check` after each part.
- P1 shell done (parts/shell.mjs): own helpers, hollow 1-thick walls; west front x2..6 thick (portals/niches/rose/lancets left as air), belfry 4 thick with louvre voids, floors y40/59/69, cap y66, deck y96. FOOTPRINT mask clips x0..4 z5..9 and x95..99 z0..4 (north gable centre partly absent). Piers y4..38 built (pinnacles P4). Transept gables built as masonry z1/z69.
