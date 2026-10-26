# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# REQUIRED ELEMENTS (Notre-Dame de Paris). Coordinates from plan.md. Parts: P1 massing shell, P2 roofs, P3 west front, P4 chevet+south side+flyers, P5 spire+pinnacles+apostles, P6 glazing, light and grounds.

- [ ] Plinth + ground fit: stone_bricks/polished_andesite from ground (y 1..3) up to y 3 under every mass. P1, `plinthCourse`.
- [ ] Cream limestone walls: smooth_sandstone body, ~10% sandstone low courses, cut_sandstone string courses. P1, `ashlarWall`.
- [ ] Two west towers x0..22 z7..27 / 47..67, y3..98 flat deck y96, balustrade y97..98, corner pinnacles. P1 (masses), P3 (belfry lancets, cornice y95, deck), `lancetOpening`, `balustrade`, `pinnacle`.
- [ ] Four facade buttresses (x0..1, y3..92) with set-offs every 8 (smooth_sandstone_stairs). P3, `setoffButtress`.
- [ ] Three west portals (centre z32..42 y3..22; N z13..21, S z53..61 y3..19): 4 stepped archivolt rings x2→6 of cut_sandstone + stairs, chiseled_sandstone tympanum, sandstone_wall trumeau at z37, small gable to y29. Doors left as open arch (spruce-free: dark_oak_door pair at x6). P3, `portal`.
- [ ] Gallery of Kings: 28 niches 1x3 every 2 blocks z8..66 y32..34 at x2 (recess by NOT placing the front block), king = smooth_sandstone body + chiseled_sandstone head, cut_sandstone_slab hood, upside-down smooth_sandstone_stairs courses y30/y38. P3, `kingNiche`.
- [ ] West rose x3, centre (y49,z37) r7: ring of red pane, field blue, centre purple+yellow, 12 spokes chiseled_sandstone, square cut_sandstone frame with pointed relieving arch. P3 (frame/tracery), P6 (glass), `roseWindow`.
- [ ] Tower lancet pairs, belfry lancets (dark_oak_trapdoor open louvres), Grande Galerie arcade y60..65 colonnettes every 2, chimeras at tower corners y68. P3, `lancetOpening`, `colonnade`, `gargoyle`.
- [ ] Nave+choir: clerestory z27..47 with tall lancets y35..43 per bay, balustrade y45..46. P1, P6, `lancetOpening`, `balustrade`.
- [ ] Aisles, tribunes, chapels per plan bands, round tribune windows y31..33, chapel lancets y6..16, terrace balustrade y19..21. P1, P6.
- [ ] Steep lead roof (deepslate_tiles, ridge polished_deepslate, iron_bars cresting every other cell), nave+choir y45→59, transept y45→57, apse half-cone, tribune/aisle lean-to slabs. P2, `leadRoof`, `ridgeCrest`.
- [ ] Transepts with north and south ROSES (centre x95,y34, r7), portals x92..98 y3..17, gallery y43..45, gable triangle y46..57 with small rose r2 and apex pinnacle y60. P4, P6, `roseWindow`, `portal`.
- [ ] CHEVET: apse r10 clerestory, 2 ambulatory rings, 5 radiating chapels (axial to x185), 6 chevet piers with pinnacles. P4, `ringWall`, `pinnacle`.
- [ ] FLYING BUTTRESSES: every pier (nave 6/side, choir 4/side, chevet 6): 1 block thick arc, upside-down smooth_sandstone_stairs underside, stair coping on top, open air below. P4, `flyer`.
- [ ] Pinnacles on every pier (3x3 base → 1, end_stone_brick_wall spike + lightning_rod finial) and gargoyles y36 (+2 out). P4, `pinnacle`, `gargoyle`.
- [ ] SPIRE x95 z37 octagonal, stages per plan, dark_oak_log frame lines, crocket rings, cross, chain, gold_block rooster y136, lightning_rod y137 (top, exactly). P5, `spireStage`, `octagonRing`.
- [ ] 12 Apostle statues (oxidized_cut_copper + stairs head) on the ridges. P5, `statue`.
- [ ] Sacristy (hall, wing, link, south chapel) with hip/gable lead roofs, lancets, door x144. P4, `leadRoof`, `lancetOpening`.
- [ ] Stained glass in all openings (blue field, purple heads), glowing: shroomlight behind. P6, `glazeOpening`.
- [ ] Dusk light: ochre_froglight floods at pier feet and paving, lanterns on sandstone_wall posts on paths/roofs. P6, `lampPost`, `floodlight`.
- [ ] Grounds: smooth_stone/polished_andesite paving, Square Jean-XXIII garden patch grass/moss/azalea x105..119 z70..79. P6, `pavePatch`.
```

### rooms.json

```json
{"entrance":[-1,3,37],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "wall": ["smooth_sandstone", "sandstone", "cut_sandstone", "cut_sandstone_slab", "chiseled_sandstone"],
    "stone shapes": ["smooth_sandstone_stairs", "smooth_sandstone_slab", "sandstone_wall", "end_stone_bricks", "end_stone_brick_wall"],
    "plinth": ["stone_bricks", "stone_brick_stairs", "polished_andesite"],
    "lead roof": ["deepslate_tiles", "deepslate_tile_stairs", "deepslate_tile_slab", "polished_deepslate", "polished_deepslate_wall", "iron_bars"],
    "spire": ["polished_deepslate", "deepslate_tiles", "dark_oak_log", "dark_oak_trapdoor", "chain", "gold_block", "lightning_rod"],
    "statues": ["oxidized_cut_copper", "oxidized_cut_copper_stairs"],
    "glass": ["blue_stained_glass_pane", "red_stained_glass_pane", "purple_stained_glass_pane", "yellow_stained_glass_pane", "blue_stained_glass", "dark_oak_door"],
    "light": ["ochre_froglight", "shroomlight", "lantern", "chain"],
    "ground": ["smooth_stone", "polished_andesite", "grass_block", "moss_block", "azalea"]
  },
  "objects": ["lantern", "chain", "lightning_rod", "gold_block", "ochre_froglight", "shroomlight", "dark_oak_door", "azalea"]
}
```

### make.sh

```sh
#!/usr/bin/env bash
# Makes build.nbt from scratch: build.mjs writes a temp file, which is moved into place only when the build succeeds.
set -euo pipefail
cd "$(dirname "$0")"
tmp=".build.$$.tmp.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv -f "$tmp" build.nbt
echo "wrote build.nbt"
```

### build.mjs

```js
// Notre-Dame cathedral: lays the rock under the plot, then runs the six parts in plan.md's order and saves the structure.
// Usage: node build.mjs <out.nbt>   (make.sh runs it into a temp file, then moves it to build.nbt)
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, ROCK } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Rock top (plan.md SITE): 3 under the west towers, 2 over the nave, transepts and choir, 1 along the south-east
// choir and the sacristy, 0 at the sacristy's east edge. The choir band (z 27..47) stays at 2 where the SE strip starts.
function groundY(x, z) {
  if (x <= 34) return 3;
  if (x >= 152 && z >= 70) return 0;
  if (z >= 48 && x >= 85 && x <= 170 && !(x >= 86 && x <= 104)) return 1;
  return 2;
}

// The parts in build order; a part whose module is not written yet is skipped (never a failure), so make.sh works
// while the parts are still stubs or missing.
const PARTS = [
  ["masonry shell", "./parts/shell.mjs"],
  ["lead roofs", "./parts/roofs.mjs"],
  ["west front", "./parts/west.mjs"],
  ["chevet, south side and flyers", "./parts/chevet.mjs"],
  ["spire", "./parts/spire.mjs"],
  ["glass, light and grounds", "./parts/finish.mjs"],
];

const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });

// the ground: rock from y 0 up to the rock top of each plot cell
for (let x = 0; x < SITE_SIZE[0]; x++) for (let z = 0; z < SITE_SIZE[2]; z++) {
  const top = groundY(x, z);
  for (let y = 0; y <= top; y++) g.set(x, y, z, ROCK);
}

const list = [];
for (const [name, file] of PARTS) {
  const path = fileURLToPath(new URL(file, import.meta.url));
  if (!existsSync(path)) { console.log(`part ${name}: ${file} not written yet, skipped`); continue; }
  const mod = await import(pathToFileURL(path).href);
  list.push([name, mod.build]);
}

runParts(g, list, { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}: ${g.cells.size} cells`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: palette ids (palette.json), plan.md site coordinates, a seeded rng.

// ---- palette (bare ids, as in palette.json; the build library adds minecraft:) ----

// ---- palette (bare ids, as in palette.json; the build library adds minecraft:) ----
export const SMOOTH_SANDSTONE = "smooth_sandstone";                   // wall body (60%)

export const SANDSTONE = "sandstone";                                 // lower-course ashlar (<=10%)

export const CUT_SANDSTONE = "cut_sandstone";                         // string courses, frames, lintels

export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";               // hoods, sills

export const CHISELED_SANDSTONE = "chiseled_sandstone";               // carving: tympana, tracery, heads, niches

export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";     // mouldings, set-offs, flyers, coping

export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";         // flat coping and deck caps

export const SANDSTONE_WALL = "sandstone_wall";                       // balustrades, colonnettes, posts

export const END_STONE_BRICKS = "end_stone_bricks";                   // pale accent stone

export const END_STONE_BRICK_WALL = "end_stone_brick_wall";           // pinnacles, crockets, spikes

export const STONE_BRICKS = "stone_bricks";                           // plinth course

export const STONE_BRICK_STAIRS = "stone_brick_stairs";               // plinth edge

export const POLISHED_ANDESITE = "polished_andesite";                 // plinth top course, paving, ground

export const DEEPSLATE_TILES = "deepslate_tiles";                     // lead roof field, spire body

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";         // lead roof edges

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";             // lean-to roof edges

export const POLISHED_DEEPSLATE = "polished_deepslate";               // ridges, spire structure

export const POLISHED_DEEPSLATE_WALL = "polished_deepslate_wall";     // spire cross and ridge walls

export const IRON_BARS = "iron_bars";                                 // ridge cresting, cross arms

export const DARK_OAK_LOG = "dark_oak_log";                           // spire frame lines

export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";                 // belfry louvres, spire louvres

export const CHAIN = "chain";                                         // 1.21.1 chain (not iron_chain)

export const GOLD_BLOCK = "gold_block";                               // rooster

export const LIGHTNING_ROD = "lightning_rod";                         // spire tip and pinnacle finials

export const OXIDIZED_CUT_COPPER = "oxidized_cut_copper";             // apostle bodies

export const OXIDIZED_CUT_COPPER_STAIRS = "oxidized_cut_copper_stairs"; // apostle heads

export const BLUE_GLASS_PANE = "blue_stained_glass_pane";             // rose field, lancets

export const RED_GLASS_PANE = "red_stained_glass_pane";               // rose ring

export const PURPLE_GLASS_PANE = "purple_stained_glass_pane";         // rose centre, lancet heads

export const YELLOW_GLASS_PANE = "yellow_stained_glass_pane";         // rose centre

export const BLUE_STAINED_GLASS = "blue_stained_glass";               // solid blue in 1-thick fills

export const DARK_OAK_DOOR = "dark_oak_door";                         // portal doors

export const OCHRE_FROGLIGHT = "ochre_froglight";                     // floodlights in plinth and paving

export const SHROOMLIGHT = "shroomlight";                             // light behind glass

export const LANTERN = "lantern";                                     // hanging and post lamps

export const SMOOTH_STONE = "smooth_stone";                           // paving

export const GRASS_BLOCK = "grass_block";                             // garden, Square Jean-XXIII

export const MOSS_BLOCK = "moss_block";                               // garden

export const AZALEA = "azalea";                                       // garden bushes

export const ROCK = "stone";                                          // rock under the plot (laid by build.mjs, not in the palette)

// ---- site (plan.md SITE: plot blocks) ----
export const SITE_SIZE = [189, 140, 111];                             // x 0..188, y 0..139 (the hard height limit), z 0..110

export const FLOOR_Y = 3;                                             // the common floor line: every plinth runs up to y 3

export const MAIN_AXIS_Z = 37;                                        // the main axis; north/south pairs mirror about it

export const SPIRE_CENTRE = [95, 37];                                 // x, z of the spire and crossing centre

export const SPIRE_TIP = [95, 137, 37];                               // lightning_rod tip: the highest block of the build

export const CHEVET_CENTRE = [150, 37];                               // polar centre (x, z) for the chevet: angle 0 = due east

export const WEST_FRONT_X = 0;                                        // the west front plane (the facade is the west face)

export const CHEVET_X = 150;                                          // the apse and chevet sit at x >= 150

// ---- rng ----
/** rng(seed): a seeded generator (mulberry32) returning floats in [0, 1); the same seed gives the same sequence. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Seven plan.md VOCABULARY helpers: plinthCourse, roseWindow, balustrade, pinnacle, leadRoof, spireStage, floodlight.
// Each takes its position (and facing, where it has one) as arguments and writes only its own footprint, and only into
// air unless { overwrite: true }. Returns { cells, refused }: cells = blocks placed, refused = [x, y, z, block] for every
// write that was not air (or was out of the grid). Block ids are literals from plan.md's PALETTE.

/**
 * Plinth course: stone_bricks through the box, its top layer polished_andesite. box = [x0, y0, z0, x1, y1, z1], from the
 * ground up (the caller gives the ground-to-plinth-top box, so nothing floats).
 */
export function plinthCourse(g, [x0, y0, z0, x1, y1, z1], opts = {})

/**
 * Rose window. centre = [x, y, z] of the rose's centre cell in its glass plane; face = the way it looks out
 * ("north" | "south" | "east" | "west"): the plane is perpendicular to that axis. r = radius in cells. glass: false leaves
 * the disc open for the glazier (tracery, ring and frame are still placed). Panes: yellow centre, purple inner ring,
 * red outer ring (r-1..r), blue field; 12 chiseled spokes; chiseled ring at r+1; square cut_sandstone frame at r+2.
 */
export function roseWindow(g, [cx, cy, cz], face, r, glass = true, opts = {})

/**
 * Balustrade along a straight line = [x0, z0, x1, z1] (it must run along x or z), at height y: sandstone_wall run,
 * end_stone_brick_wall posts every 4 cells and at the far end.
 */
export function balustrade(g, [x0, z0, x1, z1], y, opts = {})

/**
 * Pinnacle on a 3x3 pier top: base 3x3 smooth_sandstone (2 high, from y0), ring course at y0+2 (corners full, edge
 * middles stairs with the solid back outward), end_stone_brick_wall spike up the middle, lightning_rod finial at
 * y0+h-1. h >= 4. Plan.md's tops are y 43 / 44 (pass h so that y0+h-1 is 43 or 44).
 */
export function pinnacle(g, cx, cz, y0, h, opts = {})

/**
 * Lead roof over the 2-D footprint box = [x0, z0, x1, z1], its eave at eaveY (the wall plate; the walls below are the
 * caller's). Gable (opts.ridge "x" | "z", default "x"): pitch 1, a stair per row, polished_deepslate ridge with an iron_bars
 * crest on every other ridge cell. Lean-to (opts.lean "north" | "south" | "east" | "west" = the side the roof is high
 * on): deepslate_tile_slab steps, half a block per cell. Every column is filled solid with deepslate_tiles under the
 * skin. The gable ends are the caller's masonry.
 */
export function leadRoof(g, [x0, z0, x1, z1], eaveY, opts = {})

/**
 * Spire stage: octagonRing for every course from y0 to y1 (dark_oak_log corner lines, a ring unless opts.solid),
 * plus a crocket course at each y in opts.crockets: a ring one cell wider than the stage, upside-down
 * deepslate_tile_stairs facing in. The caller passes one call per plan.md table row. opts: { cut, mat, solid, crockets, overwrite }.
 */
export function spireStage(g, cx, cz, y0, y1, w, opts = {})

/** Floodlight: one ochre_froglight at (x, y, z), its axis along the face it is set into (axis "x" | "y" | "z"). */
export function floodlight(g, x, y, z, axis = "y", opts = {})
```

### vocab/h2.mjs

```js
// plan.md VOCABULARY, second set: ashlarWall, portal, colonnade, gargoyle, ringWall, statue, lampPost.
// Every helper takes the grid first, then its position (and facing where it has one). It writes only into air
// (and only inside its own footprint): an earlier part's block is never replaced. { over: true } replaces instead.
// Block ids are plan.md's PALETTE, checked against 1.21.1.

/**
 * ashlarWall(box, face): smooth_sandstone wall over box = [x0,y0,z0,x1,y1,z1] (inclusive), its outside facing `face`.
 * A cut_sandstone string course every 8 y, cut_sandstone quoins at both ends of the run, ~10% sandstone below y 12.
 */
export function ashlarWall(g, box, face, opts = {})

/**
 * portal(x, z, w, h, face, { rings = 4, y0 }): a pointed doorway in the wall. (x, z) is the centre of the opening on the
 * wall (the face fixes which of the two is the wall's plane), w its width along the wall, h its height from the sill
 * y0 to the apex. Each archivolt ring is one block deeper than the one in front of it (cut_sandstone, the apex
 * courses upside-down smooth_sandstone_stairs). The splay is lined with a cut_sandstone lintel and a chiseled_sandstone
 * tympanum above it, with a sandstone_wall trumeau and two dark_oak_door leaves at the back. y0 is required.
 */
export function portal(g, x, z, w, h, face, { rings = 4, y0, over = false } = {})

/**
 * colonnade(line, y0, y1, step = 2): sandstone_wall colonnettes along line = [x0, z0, x1, z1] (a straight line along x
 * or z), one every `step` cells from its first end and including the last, from y0 up to y1. Each colonnette has an
 * upside-down smooth_sandstone_stairs head at y1 (its back faces `facing`, default south).
 */
export function colonnade(g, line, y0, y1, step = 2, { facing = "south", over = false } = {})

/**
 * gargoyle(x, y, z, dir): a spout projecting two cells out from a wall. (x, y, z) is the first air cell in front of the
 * wall (a sandstone_wall post); the smooth_sandstone_stairs head sits one cell further out, facing `dir` (a face name).
 */
export function gargoyle(g, x, y, z, dir, { over = false } = {})

/**
 * ringWall(cx, cz, r0, r1, y0, y1, arc = [a0, a1], { bays, window, zClip = [4, 69] }): a polar wall round the centre
 * (cx, cz). A cell is in it when its rounded distance from the centre is r0..r1 and its angle (0 = due east, +x, in
 * degrees) lies in arc. bays: the arc is split into this many equal bays and each gets one window, centred in it,
 * window = { y0, y1, width = 3 } (left as air for the glazier: recessed by omission). Cells outside zClip are skipped.
 */
export function ringWall(g, cx, cz, r0, r1, y0, y1, arc = [-180, 180], { bays = 0, window = null, zClip = [4, 69], over = false } = {})

/**
 * statue(x, y, z, facing = "south"): an apostle standing on a ridge, (x, y, z) its feet: an oxidized_cut_copper body
 * with an oxidized_cut_copper_stairs head above it, the head facing `facing`.
 */
export function statue(g, x, y, z, facing = "south", { over = false } = {})

/**
 * lampPost(x, y, z): a lamp on three sandstone_wall posts (from y up), the lantern standing on top at y + 3. One column:
 * the cells beside it stay clear.
 */
export function lampPost(g, x, y, z, { over = false } = {})
```

### vocab/h3.mjs

```js
// Seven plan.md VOCABULARY helpers: lancetOpening, kingNiche, setoffButtress, flyer, octagonRing, glazeOpening, pavePatch.
// Each takes its position (and facing, where it has one) as arguments and writes only its own footprint, and only into
// air unless { overwrite: true }. Returns { cells, refused }: cells = blocks placed, refused = [x, y, z, block] for every
// write that was not air (or was out of the grid). Block ids are literals from plan.md's PALETTE.

/**
 * Pointed lancet in a wall. (x, y, z) = the sill's centre cell in the front layer; face = outward direction of the wall;
 * w = width, h = height (sill row included); glass = a stained pane id (the head rows are purple).
 * Front layer: a sill slab, then upside-down smooth_sandstone_stairs (lip out) round the arch, a 1-block reveal.
 * Recessed 1: the glass sits one block behind the front, and the front cells inside the arch stay air.
 */
export function lancetOpening(g, x, y, z, face, w, h, glass = PANE, { overwrite = false } = {})

/**
 * One statue niche in a Gallery of Kings wall. (x, y, z) = the front cell at the niche's foot; face = outward direction.
 * Recess by omission: the front cells y..y+2 stay air. The king sits one block back: smooth_sandstone body (y, y+1),
 * chiseled_sandstone head (y+2); a cut_sandstone_slab hood at the front, y+3.
 */
export function kingNiche(g, x, y, z, face, { overwrite = false } = {})

/**
 * Buttress block with set-offs. box = [x0, y0, z0, x1, y1, z1] (the base extent); face = the outward direction it
 * projects toward. yList = the set-off heights: at each one the outer layer becomes an upside-down stair course (lip
 * out), and every layer above is one shorter, so the buttress narrows by stairs as it rises.
 */
export function setoffButtress(g, box, face, yList = [], { overwrite = false } = {})

/**
 * One-block-thick flying buttress arc from `from` (pier top) to `to` (clerestory wall), spanning along `axis` ("x" or "z").
 * Rises from from.y to to.y on a quarter-sine: steep off the pier, level into the wall. Each column is an upside-down
 * stair soffit at yU with an upright stair coping at yU + 1, both facing the wall end. Air below the arc.
 */
export function flyer(g, from, to, axis, { overwrite = false } = {})

/**
 * One course of an octagon centred on (cx, cz) at height y. w = the x and z extent (odd); cut = the corner cut in cells
 * along each edge. A ring by default (only the outline cells); { fill: true } for a solid course.
 */
export function octagonRing(g, cx, cz, y, w, cut, mat, { fill = false, overwrite = false } = {})

/**
 * Glazing for an opening: box = [x0, y0, z0, x1, y1, z1] (the opening's air cells), face = outward direction of the wall.
 * Blue panes, with the top headRows rows in purple; each pane joins its neighbours across the wall (never through it).
 */
export function glazeOpening(g, box, face, { glass = PANE, head = PANE_HEAD, headRows = 2, overwrite = false } = {})

/**
 * Paving over air in a box: smooth_stone with polished_andesite flags, one flag in three, on a 2x2 grid. Never writes
 * into ground (only air cells are paved).
 */
export function pavePatch(g, box, { overwrite = false } = {})
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
