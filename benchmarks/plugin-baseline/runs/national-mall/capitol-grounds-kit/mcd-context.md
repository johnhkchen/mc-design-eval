# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Plan: The Capitol's West Front Grounds (plot 0, landscape)

Module box x 0..184, z 0..124, y 0..32 (world box x 1010..1194, z 622..746; module y 0 = world y 4). North is low z, east is high x. The Capitol's west face is just past x 184, so it is not built here. This is landscape only, with no rooms.
The read from the air, west to east along the axis (z 61): a dark mirror of water, a white plinth with a black horseman, two great green ovals cut by a pale axial walk and ringed by dark tree clumps, then a glowing white two-tier marble terrace stepping up toward the Capitol.

## SITE

**Ground rule (every part).** Every column is solid from y 1 to its mapped height H(x,z): stone below, three courses of dirt, then the surface block at H. The outer 2 cells of every edge (x 0..1, x 183..184, z 0..1, z 123..124) stay exactly at H, with grass or the walk surface. Inside the box, the masses below may raise ground by at most 2. They soften every 1-block step on walks with a slab.
Mapped heights: about 2 from x 0 to 57 (a curved 3 band lies at x 5..24 west of the pool); 3 at Union Square and from x 70 to 112; 4 from x 113 to 131; 5 from x 132 to 146; 6 from x 147 to 158; then 7, 8 and 9..11 up to the Capitol (11 on the central bulge, x 176..184, z 44..80).

| # | Mass | x | y | z | Notes |
|---|------|---|---|---|------|
| 1 | Reflecting pool: basin floor | 20..55 | 1 | 16..109 | smooth stone |
| 1a | Pool: water | 20..55 | 2 | 16..109 | 36 x 94, still water one deep; its long sides run N-S and are straight |
| 1b | Pool: coping ring | 18..57 | 3 (on fill y1..2) | 14..111 | 2 wide; the outer row is full block, the inner row (touching the water) a bottom slab at y 3 forming a lip |
| 1c | Pool: walk round it | 16..17 and 58..59 | at H | 12..113 | 2 wide; the pale walk joins the coping |
| 2 | Union Square plaza (paved) | 60..70 | at H (2..3), levelled to 3 | 10..114 | hard paving, the forecourt of Grant |
| 3 | Grant Memorial platform | 60..66 | 4..6 (top y 6) | 67..89 | white marble, 7 x 23, 3 high; a coping slab at y 7 on the rim except where a group stands |
| 3a | Platform steps | 59 (west), 67 (east) | 4..5 | 74..82 | two bottom slab rows each side: y 4 slab at x 59/67 and a y 5 slab one cell inboard. They stand for the steps; this is a monument, not a doorway |
| 3b | Grant pedestal | 62..64 | 7..11 | 77..79 | white marble shaft. Its top course (y 11) is a dark plinth |
| 3c | Grant equestrian statue | 63 (horse body x 62..64) | 12..15 | 78 (body z 77..79) | dark bronze. The horse is long along x and faces west (head at x 62, y 13..14). The rider is 1 wide at x 63, y 14..15 |
| 3d | Four lions | (61,7,75) (65,7,75) (61,7,81) (65,7,81) | 7..8 | (listed) | one block plus one stair each, dark bronze, couchant on the platform |
| 3e | Cavalry group (north end) | 61..65 | 7..9 | 67..71 | dark bronze mass: three horses charging west on a white base course at y 7 |
| 3f | Artillery group (south end) | 61..65 | 7..9 | 85..89 | dark bronze: a horse team, a gun and a limber, on a white base |
| 4 | Statue P (Peace Monument side) | 62..65 | H+1..H+5 | 62..65 | white pedestal 4x4 at y 4..6, stepping to 2x2 at y 7..8; a white figure at y 9 with a dark bronze top |
| 4a | Statue g | 63 | 4..7 | 48..50 | white plinth 1 x 3 (y 4..5), dark bronze figure at y 6..7 on z 49 |
| 4b | Statue p | 83..85 | 4..7 | 21..24 | white pedestal (y 4..5), dark figure (y 6..7) at (84,6..7,22) |
| 4c | Statue J (Garfield) | 84..85 | 4..8 | 99..100 | white pedestal (y 4..6), dark figure (y 7..8) |
| 5 | Central axial walk | 71..155 | at H (3→6) | 58..64 | 7 wide pale walk with no trees; a 1-row bottom slab at every rise of 1. Its whole length lies open from the pool to the terrace |
| 5a | North curving walk (Pennsylvania Ave) | from (70,30) via (85,24) (100,21) (120,21) (138,25) (150,31) to (155,36) | at H | 3 wide arc | smooth curve through those points, to the north side stair |
| 5b | South curving walk (Maryland Ave) | from (70,94) via (85,100) (100,103) (120,103) (138,99) (150,93) to (155,88) | at H | 3 wide arc | mirror of 5a about z 61.5 |
| 5c | Cross walks | 70..72 along z 10..114; 150..155 along z 14..110 | at H | 3 wide | a walk on the east edge of Union Square, and a walk at the terrace foot that links the arcs |
| 6 | North West Lawn | x 72..149, z 28..56 (oval inside walk 5a and the axis) | at H | | open grass |
| 6a | South West Lawn | x 72..149, z 66..96 | at H | | open grass |
| 6b | Outer tree groves | x 72..156, z 2..22 and z 102..122; also x 2..15 and x 60..70 at z 2..10 and z 115..122 | at H | | the big tree clumps |
| 7 | Olmsted Terrace, Tier 1 (lower) | 159..182 | top y 9 (wall body H..8, paving at 9) | 14..110 | retaining wall face at x 159, 3 high above the lawn (y 6) |
| 7a | Tier 1 north and south return walls | 159..170 | to 9 | z 14 and z 110 | the faces seen from the ends, also with balustrades |
| 7b | Tier 1 balustrade | x 159 (z 14..110) and z 14 / z 110 (x 159..182) | 10 | | broken at every stair opening |
| 8 | Olmsted Terrace, Tier 2 (upper) | 171..182 | top y 11 | 30..94 | wall face at x 171, 2 above Tier 1, with returns at z 30 and z 94 |
| 8a | Tier 2 balustrade | x 171 (z 30..94), z 30 and z 94 (x 171..182) | 12 | | broken at the stairs |
| 9 | Central double staircase, lawn→Tier 1 | 156..158 (steps y 7, 8, 9) | 7..9 | 52..58 and 65..71 | two flights, each 7 wide, that face up east, so the walk forks around the fountain |
| 9a | Central fountain (grotto) | 155..158 basin; niche in the wall at x 159 | 6..9 | 59..64 | white basin at y 6..7 with water at y 7. The wall face over it is a recessed niche (z 60..63, y 7..8). A spout at the head and an urn on each basin corner |
| 9b | Central flights, Tier 1→Tier 2 | 169..170 (steps y 10, 11) | 10..11 | 52..58 and 65..71 | in line with 9 |
| 9c | Upper fountain | 165..169 | 9..10 | 59..64 | white basin raised 1 on Tier 1, water at y 10, a jet column of water source at (167,11,61..62) |
| 10 | North side double staircase | 156..158 | 7..9 | 33..39 | two 3-wide flights (z 33..35 and 37..39) with an urn pier at z 36; it receives walk 5a |
| 10a | South side double staircase | 156..158 | 7..9 | 85..91 | flights z 85..87 and z 89..91, an urn pier at z 88; it receives walk 5b |
| 10b | Side flights, Tier 1→Tier 2 | 169..170 | 10..11 | 34..38 and 86..90 | 5 wide each |
| 11 | Planting beds at the foot of Tier 1 | 155..158 | 7 (bed raised 1) | 15..31, 41..50, 74..83, 93..109 | low clipped hedge with hidden warm floodlights; clear of the stair openings |
| 12 | Urns | on the balustrade piers every 8 cells, on every stair cheek | 11 (Tier 1) / 13 (Tier 2) | | |
| 13 | Lamp posts | along every walk, alternating sides, every 10 cells; on the pool coping every 12 | H+1..H+4 | | |

**Trees.** Big old oaks and elms: a trunk 2x2 or 1x1 of dark oak, 5..7 high, under a round crown of radius 4 (3 for small trees), 5..6 high. The crown tops reach y 13..18. The trunk centres:

| Group | Trunk centres (x, z) |
|-------|---------------------|
| North grove | (78,8) (90,5) (104,9) (117,6) (131,10) (143,6) (152,15) (96,15) (125,16) (140,17) (75,18) |
| South grove | mirror of the north grove: z' = 124 − z (for example (78,116), (152,109)) |
| North lawn edge (framing, outside the open axis) | (110,32) (128,36) (146,42) (86,38) |
| South lawn edge | (110,92) (128,88) (146,82) (86,86) |
| West of pool / Union Square corners | (6,4) (12,118) (65,5) (66,119) (8,40) (8,84) |
| Terrace corners | (156,10) (156,114) |

No crown or trunk may enter the view corridor x 0..184, z 44..80, apart from the pool, the memorial, the statues and the terrace. The corridor holds only grass, walks, water and the monuments.

## ROOFS

No building roofs: the plot is landscape. No `$MCD roof` preset applies.
The only "roofs" are monument caps. Each statue pedestal finishes in a dark slab or stair course. The Grant platform rim takes smooth quartz slabs; the balustrades take smooth quartz slabs. Every part shapes these caps by hand.

## FACADES

**Olmsted terrace, west face (x 159, the hero face from the Mall)**
- Base: a plinth course of polished diorite at y H (6). It is 1 proud, at x 158, wherever there is no stair or bed.
- Body: smooth quartz from y 7 to 8. The joints read as panels: a quartz pillar (axis y) pilaster stands flush every 6 cells (z 14, 20 ... 110).
- Coping: a smooth quartz slab course at y 9 runs 1 proud over the face, at x 158, as the cornice line.
- Balustrade: diorite wall at y 10, on the wall line x 159. Piers are quartz pillars every 8 cells, with an urn on each (decorated pot); the piers stand at the stair cheeks too. A smooth quartz slab rail sits on the walls at y 11 where there is no urn. Where a pier has an urn, the urn rides on the pier top at y 11.
- Tier 2 face (x 171) repeats the order one level up: plinth at y 9, body at y 10, coping slab at y 11 projecting west, balustrade at y 12, slab rail at y 13.
- Grotto niche at the centre (x 159, z 60..63, y 7..8): recessed 1, left open (air), with a quartz pillar on each side and a quartz stair lintel at y 9. The fountain spout comes from it.
- Stairs: the treads are quartz stairs. Each flight has cheek walls of smooth quartz, 1 wide, outside the flight, with their top course following the slope. A pier with an urn caps the foot of every cheek.

**Grant Memorial (seen from the axis and the air)**
- The platform is smooth quartz, with a polished diorite base course at y 4 one proud on all sides and a smooth quartz slab rim at y 7.
- The pedestal is quartz pillar, with a polished blackstone plinth course at y 11.
- Grant, the lions and both end groups are polished blackstone and blackstone stairs. They read as near-black bronze against the white.

**Small statues** have smooth quartz pedestals and polished blackstone figures. P's figure is smooth quartz with a blackstone top, for the Peace Monument's white marble.

**Pool coping**: polished andesite blocks with a smooth stone slab lip, crisp straight long sides along z at x 18..19 and x 56..57.

## MATERIALS

| Role | Block id |
|------|----------|
| Marble walls, platform, pedestals | smooth_quartz |
| Marble trim and coping slabs | smooth_quartz_slab, smooth_quartz_stairs |
| Pilasters, pedestal shafts, piers | quartz_pillar |
| Stair treads (terrace flights) | quartz_stairs |
| Balustrade | diorite_wall |
| Plinth courses | polished_diorite |
| Bronze statues, lions, groups | polished_blackstone, polished_blackstone_stairs, polished_blackstone_wall (legs) |
| Pool coping | polished_andesite, smooth_stone_slab |
| Pool floor | smooth_stone |
| Water | water |
| Olmsted walks, central walk | smooth_sandstone (slabs smooth_sandstone_slab at steps) |
| Union Square plaza | smooth_stone with polished_andesite border bands every 6 |
| Lawn | grass_block |
| Tree soil patches | podzol, rooted_dirt (under crowns only) |
| Fill | dirt, stone |
| Tree trunks | dark_oak_log (axis y) |
| Tree crowns | dark_oak_leaves (mass) + oak_leaves (outer patches), persistent |
| Planting beds | azalea_leaves (hedge), flowering_azalea_leaves (accents), on moss_block |
| Urns | decorated_pot on quartz_pillar |
| Lamp posts | polished_blackstone_wall (2 high) + lantern on top |
| Warm floodlight (hidden) | shroomlight inside hedges and tree crowns, glowstone under the Grant rim slab |
| Fountain basins | smooth_quartz, water |

Every id was checked with `$MCD blocks --check` (all exist in 1.21.1). quartz_brick is not a block; use quartz_bricks if a course needs one.

## OPENINGS

There are no doors or windows. These are the openings each wall part must leave:

| Opening | Where | Size |
|---------|-------|------|
| Tier 1 balustrade gaps (central flights) | x 159, y 10..11, z 52..58 and 65..71 | 7 wide each |
| Tier 1 gaps (side flights) | x 159, y 10..11, z 33..39 and 85..91 | 7 wide |
| Tier 2 balustrade gaps | x 171, y 12..13, z 52..58, 65..71, 34..38, 86..90 | as the flights |
| Grotto niche | x 159, y 7..8, z 60..63 | recessed 1, open |
| Grant platform step gaps | rim slab omitted at x 60 and x 66, z 74..82 | for the steps |

## RESERVED

The shell (the ground and terrace parts) leaves these cells empty for the parts named:

| Cells | For |
|-------|-----|
| x 20..55, y 2, z 16..109 | pool water |
| x 155..158, y 6..7, z 59..64 (basin), x 165..169, y 10, z 59..64 | the fountains' water |
| x 156..158, y 7..9 at z 33..39, 52..58, 65..71, 85..91; x 169..170, y 10..11 at z 34..38, 52..58, 65..71, 86..90 | stair flights: the terrace body stops behind them, at x 159 / x 171 |
| x 62..64, y 7..15, z 77..79; lion cells; x 61..65, y 7..9 at z 67..71 and 85..89 | Grant's statue and the groups, which stand on the platform top (y 6) |
| balustrade pier tops (y 11 / y 13) every 8 cells | urns |
| trunk cells listed under Trees, and the 3x3 around each | trees: no walk or lamp there |
| the corridor z 44..80 above H+1, outside the monuments | nothing at all: keep the view open |

## FLOORS

There are no interiors. These are the levels the parts stand on:

| Level | y |
|-------|---|
| Pool water surface / coping top | 2 / 3 |
| Union Square plaza | 3 |
| Grant platform top / pedestal top / rider top | 6 / 11 / 15 |
| West Lawn | follows H: 3 at x 71, 4 at x 113, 5 at x 132, 6 at x 147..158 |
| Terrace Tier 1 paving | 9 (balustrade 10, rail 11) |
| Terrace Tier 2 paving | 11 (balustrade 12, rail 13) |
| Highest thing | tree crowns y ≤ 18; nothing above y 20 |

**Lighting (no mob spawns).**
- Lamp posts every 10 cells along all walks and the pool coping.
- A shroomlight hidden in every tree crown and every 4th hedge cell of the planting beds. These warm-floodlight the terrace face at dusk.
- Lanterns hang under the coping slab of each Tier 1 and Tier 2 pier.
- Glowstone sits under the Grant platform's rim slabs, at the four corners and the mid-sides.
- Open lawn cells farther than 12 from any light get a lamp post on a 16-block grid along the oval edges, never inside the corridor z 44..80. Inside the corridor, light comes from the central walk's lamps (z 57 and z 65, every 10).
- Check with the light tool: no cell at light 0.


---
# DESIGNER SECTIONS

## PALETTE

Roles keep the architect's block ids exactly. Variants (all checked with `$MCD blocks --check`, none unknown):
- Marble: smooth_quartz, smooth_quartz_slab, smooth_quartz_stairs, quartz_pillar (axis y), quartz_stairs, quartz_slab, quartz_bricks (only if a course needs one).
- Trim: polished_diorite, polished_diorite_slab, diorite_wall (balustrade; connects, set `up`).
- Bronze: polished_blackstone, polished_blackstone_slab, polished_blackstone_stairs, polished_blackstone_wall.
- Pool and plaza: polished_andesite, polished_andesite_slab, smooth_stone, smooth_stone_slab, water.
- Walks: smooth_sandstone, smooth_sandstone_slab (bottom, at each rise), smooth_sandstone_stairs.
- Ground: grass_block, dirt, stone, podzol, rooted_dirt, moss_block, dirt_path (nowhere on main walks).
- Trees and beds: dark_oak_log (axis y), dark_oak_leaves and oak_leaves (persistent true), azalea_leaves, flowering_azalea_leaves (persistent true).
- Decor and light: decorated_pot, lantern (hanging true/false), shroomlight, glowstone.

## VOCABULARY

- `groundColumn(g, x, z, H)`: stone y1..H-4, dirt for 3 courses, grass_block (or the role's surface) at H. Never writes above H. Writes the whole column, overwriting.
- `poolBasin(g)`: smooth_stone y1 over x20..55 z16..109; water source y2 everywhere in that box; all four edges straight. Water must have coping on every side so it cannot flow.
- `copingRing(g)`: ring x18..57 z14..111, 2 wide. Outer row polished_andesite at y3 on fill y1..2; inner row smooth_stone_slab type bottom at y3 (waterlogged false).
- `plazaPaving(g)`: x60..70 z10..114 smooth_stone at y3; every 6th cell in x or z a polished_andesite band.
- `walkStrip(g, x0,z0,x1,z1, surface)`: sets the surface block at H of each column of the box (replacing the grass); where H rises by 1 between two neighbours along the run, the higher cell becomes smooth_sandstone_slab bottom on a column filled to H-1 (slabStep) so the walk climbs in half steps.
- `slabStep(g, x, z, H)`: column filled to H-1 then smooth_sandstone_slab type bottom at y=H.
- `curvedWalk(g, points, width=3)`: Catmull-Rom (or quadratic) through the plan points; stamp a disc of radius 1 (3 wide) at every 0.5 cells; surface smooth_sandstone at H, slabStep on rises.
- `oakTree(g, x, z, h=6, r=4)`: dark_oak_log axis y from H+1 to H+h (2x2 at x..x+1,z..z+1 for big trees), crown: dark_oak_leaves ellipsoid radius r, height 5..6, flattened at the bottom, oak_leaves on the outer shell patches (about 1 in 4), shroomlight one cell inside the crown centre; podzol/rooted_dirt patch radius 2 under it. Crown cells inside the corridor z44..80 are skipped; they must not overwrite walks.
- `hedgeBed(g, x0,z0,x1,z1)`: moss_block at H, azalea_leaves at H+1 (flowering_azalea_leaves every 5th), every 4th cell a shroomlight at H+1 in place of the leaf (the hedge stays 1 high).
- `marbleTier(g, face, z0, z1, x1, topY)`: retaining wall of smooth_quartz from H..topY-1; polished_diorite plinth course at y=H on the face line, 1 proud; body smooth_quartz; smooth_quartz_slab cornice (type top) at topY on the line one proud; paving at topY smooth_quartz (x to x1). Leaves flight reserves empty (the wall is stopped, not cut through).
- `pilaster(g, x, z, y0, y1)`: quartz_pillar axis y flush with the face.
- `balustradeRun(g, line, y, gaps)`: diorite_wall at y along the line with piers every 8 (quartz_pillar at y10 or y12); smooth_quartz_slab type top on the walls at y+1 between piers; no blocks inside `gaps`; a pier at each end of every gap (stair cheeks).
- `urnPier(g, x, y, z)`: quartz_pillar at y, decorated_pot at y+1.
- `terraceFlight(g, {x0,x1,z0,z1,y0,steps,facing:"east"})`: quartz_stairs half bottom facing east, one row per step, solid smooth_quartz under each tread down to H; smooth_quartz cheek walls 1 wide outside both edges, top course a smooth_quartz_stairs following the slope; an urnPier on each cheek foot.
- `fountainBasin(g, x0,z0,x1,z1,y, jet)`: smooth_quartz rim ring at y, floor smooth_quartz at y-1, water source inside at y; with `jet`, water source column 2 high; 4 urns at the rim corners.
- `grottoNiche(g)`: x159 z60..63 y7..8 left as air (recess by exclusion: the front material is not placed), quartz_pillar at z59 and z64 (y7..8), lintel row z60..63 at y9 as smooth_quartz_stairs half top facing west; smooth_quartz back wall at x160.
- `memorialPlatform(g)`: smooth_quartz box x60..66 z67..89 y4..6; polished_diorite base course y4 on the ring x59..67 z66..90 one proud (steps excepted); slab rim y7 smooth_quartz_slab bottom on the perimeter except x60/x66 at z74..82 and under groups; glowstone buried inside at y6 at the four corners and mid-sides, covered by the rim slabs.
- `pedestal(g, x0,z0,x1,z1,y0,y1)`: quartz_pillar shaft, top course polished_blackstone.
- `bronzeHorseman(g, cx, baseY, cz, facing)`: legs polished_blackstone_wall at four cells of the 3x3 corners at baseY; body polished_blackstone row of 3 at baseY+1 with bottom slabs on the sides; head polished_blackstone_stairs facing west at the west end, y+2; tail a wall at the east end y+1; rider polished_blackstone at y+2 centre and polished_blackstone_wall at y+3 (head), a slab hat.
- `lionCouchant(g, x, y, z, toward)`: polished_blackstone at (x,y,z) and polished_blackstone_stairs half bottom at the neighbour toward the pedestal's opposite side (head up), facing away from the statue.
- `cavalryGroup(g)`: white smooth_quartz base y7 on x61..65 z67..71; three horses, each a body of 2 polished_blackstone with a stair head facing west, legs walls, riders a wall; staggered at z 68, 69.5, 71 and heights 8..9.
- `artilleryGroup(g)`: base y7 x61..65 z85..89; two-horse team (2 bodies with stair heads facing west) at z85..86, a limber block + wall wheels at z87, a gun barrel polished_blackstone_wall lying along x at z88..89 y8 (walls lie flat in x) with stair breech.
- `smallStatue(g, x, z, kind)`: plinth smooth_quartz of the plan height at H+1.., figure polished_blackstone (P: smooth_quartz figure with a blackstone top), top slab polished_blackstone_slab.
- `lampPost(g, x, z)`: polished_blackstone_wall at H+1..H+2, lantern hanging false at H+3. Corridor posts at z57/z65 are only 1x1 posts, never taller than H+3.
- `floodlight(g, x, y, z)`: shroomlight hidden inside leaves/hedge; glowstone under slab.

## ROOMS

No rooms: this is open landscape with no interiors. `rooms` is null.

Entrance (a visitor stands where the central walk begins): [71, 4, 61]; street: [60, 4, 61] on the plaza.

## PARTS

1. **Ground and pool** (parts/ground.mjs): groundColumn over the whole box, poolBasin, copingRing, plazaPaving, lawns. Ticks 1, 2, 2a, 3, 9.
2. **Walks** (parts/walks.mjs): walkStrip, slabStep, curvedWalk for 2b, 6, 7, 8. Ticks 2b, 6, 7, 8.
3. **Olmsted terrace** (parts/terrace.mjs): marbleTier x2, pilaster, balustradeRun, urnPier, terraceFlight, fountainBasin, grottoNiche. Ticks 11..15.
4. **Grant Memorial and statues** (parts/grant.mjs): memorialPlatform, pedestal, bronzeHorseman, lionCouchant, cavalryGroup, artilleryGroup, smallStatue. Ticks 4, 4a..4f, 5.
5. **Trees and planting** (parts/trees.mjs): oakTree for every trunk in the Trees table, hedgeBed for plan 11. Ticks 10, 16.
6. **Lamps and lighting** (parts/lamps.mjs): lampPost, floodlight, lanterns under pier coping, glowstone check, light tool pass. Ticks 17, 18, 19.

- [ ] 1 ground  - [ ] 2 walks  - [ ] 3 terrace  - [ ] 4 grant  - [ ] 5 trees  - [ ] 6 lamps

## NOTES

- Order matters: ground writes whole columns first; later parts only write above H or replace the surface block. Never write above y 20.
- Keep the corridor x0..184 z44..80 free above H+1 except the monuments, the terrace and walk lamps. Trees at (146,42) and (86,38),(110,32) have crowns that must be clipped at z43 (and mirrored z81 for the south).
- The plan's tree list puts (156,10) and (156,114) crowns near Tier 1's north/south ends: clip crowns that touch the terrace wall.
- Recess the grotto by not placing the face; never place air over a filled wall.
- Water: place only after the coping ring; fountains inside a rim so they cannot spill.
- Light check: every grass cell must be at light >= 1 from a lamp or shroomlight within range; add posts on the 16-grid outside the corridor.
- Heights: the plan's mapped H beats memory; read the height map per column, never assume the figures in the SITE table.
```

### elements.md

```markdown
# REQUIRED ELEMENTS: Capitol West Front Grounds (plot 0, module box x0..184 z0..124 y0..32)

All coordinates are module coordinates from plan.md. H(x,z) = the mapped ground height. "Vocab" names are defined in plan.md VOCABULARY.

| # | Element | Real construction, block by block | Coordinates | Part | Vocab |
|---|---------|-----------------------------------|-------------|------|-------|
| 1 | Ground to the height map | stone y1..H-4, dirt 3 courses, grass_block at H; outer 2 cells of every edge exactly H | whole box | parts/ground.mjs | groundColumn |
| 2 | Reflecting Pool | smooth_stone floor y1 (fill y1..2 under coping), water y2 (one deep), straight sides | x20..55, z16..109 | ground | poolBasin |
| 2a | Pool coping | outer row polished_andesite full block at y3, inner row smooth_stone_slab (bottom) at y3 touching water; 2 wide ring | x18..57, z14..111 | ground | copingRing |
| 2b | Pool walk | smooth_sandstone at H, 2 wide, joins coping | x16..17, 58..59, z12..113 | walks | walkStrip |
| 3 | Union Square plaza | smooth_stone at y3, polished_andesite border band every 6 cells | x60..70, z10..114 | ground | plazaPaving |
| 4 | Grant Memorial platform | smooth_quartz 7x23, y4..6, polished_diorite base course y4 one proud, smooth_quartz_slab rim y7 (gaps at x60/x66 z74..82), glowstone under rim slabs at corners and mid-sides | x60..66, z67..89 | parts/grant.mjs | memorialPlatform |
| 4a | Platform steps | smooth_quartz_slab bottom: y4 at x59/67 and y5 one cell inboard, z74..82 | as listed | grant | slabStep |
| 4b | Grant pedestal | quartz_pillar 3x3, y7..10; y11 course polished_blackstone | x62..64, z77..79 | grant | pedestal |
| 4c | Grant on horse | see bronzeHorseman: legs blackstone walls y12, body y13, stair head facing west, rider y14..15 | x62..64, y12..15, z77..79 | grant | bronzeHorseman |
| 4d | Four lions | lionCouchant: polished_blackstone block + stair (facing the pedestal) | (61,7,75)(65,7,75)(61,7,81)(65,7,81) | grant | lionCouchant |
| 4e | Cavalry group (north) | three horses charging west on white base y7 | x61..65, z67..71 | grant | cavalryGroup |
| 4f | Artillery group (south) | horse team, gun, limber on white base | x61..65, z85..89 | grant | artilleryGroup |
| 5 | Statues P, g, p, J | smallStatue: quartz pedestal + blackstone figure (P white figure, blackstone top) | per plan 4..4c | grant | smallStatue |
| 6 | Central axial walk | smooth_sandstone 7 wide, bottom slab at each rise of 1; NOTHING above it | x71..155, z58..64 | walks | walkStrip, slabStep |
| 7 | Curving walks (Penn./Maryland) | 3-wide smooth_sandstone arcs through the plan points | plan 5a/5b | walks | curvedWalk |
| 8 | Cross walks | smooth_sandstone 3 wide | x70..72; x150..155 | walks | walkStrip |
| 9 | West Lawns | grass_block at H, open | plan 6/6a | ground | groundColumn |
| 10 | Tree groves & edge trees | dark_oak_log 5..7 high, crown dark_oak_leaves radius 3..4 with oak_leaves patches, persistent, podzol/rooted_dirt patch under | plan Trees table | parts/trees.mjs | oakTree |
| 11 | Olmsted Terrace Tier 1 | smooth_quartz wall, polished_diorite plinth at y6 (x158), quartz_pillar pilaster every 6 z, smooth_quartz_slab cornice y9 at x158, paving y9 | x159..182, z14..110 | parts/terrace.mjs | marbleTier, pilaster |
| 11a | Tier 2 | same order one level up, face x171, paving y11 | x171..182, z30..94 | terrace | marbleTier |
| 12 | Balustrades | diorite_wall y10 (Tier1) / y12 (Tier2), quartz_pillar piers every 8, smooth_quartz_slab rail; broken at stair gaps | plan 7b/8a, OPENINGS | terrace | balustradeRun |
| 13 | Urns | decorated_pot on pier top; on every stair cheek foot | plan 12 | terrace | urnPier |
| 14 | Monumental staircases | quartz_stairs treads, smooth_quartz cheek walls following the slope | plan 9, 9b, 10, 10a, 10b | terrace | terraceFlight |
| 15 | Grotto fountain & upper fountain | smooth_quartz basin, water, niche recess by omission at x159, spout water source, urns | plan 9a, 9c | terrace | fountainBasin, grottoNiche |
| 16 | Planting beds | moss_block base, azalea_leaves hedge, flowering_azalea_leaves accents, shroomlight every 4th cell hidden | plan 11 | trees | hedgeBed |
| 17 | Lamp posts | polished_blackstone_wall x2 + lantern; every 10 along walks, 12 on coping | plan 13 | parts/lamps.mjs | lampPost |
| 18 | Floodlighting (no mob spawns) | shroomlight in crowns/hedges, glowstone under Grant rim, lanterns under pier coping | plan Lighting | lamps | floodlight |
| 19 | Open axis corridor | z44..80 empty above H+1 except pool, memorial, statues, terrace, thin lamp posts | corridor | all | (rule) |
```

### rooms.json

```json
{"entrance":[71,4,61],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "marble": ["smooth_quartz", "smooth_quartz_slab", "smooth_quartz_stairs", "quartz_pillar", "quartz_stairs", "quartz_slab", "quartz_bricks"],
    "trim": ["polished_diorite", "polished_diorite_slab", "diorite_wall"],
    "bronze": ["polished_blackstone", "polished_blackstone_slab", "polished_blackstone_stairs", "polished_blackstone_wall"],
    "pool_plaza": ["polished_andesite", "polished_andesite_slab", "smooth_stone", "smooth_stone_slab", "water"],
    "walks": ["smooth_sandstone", "smooth_sandstone_slab", "smooth_sandstone_stairs"],
    "ground": ["grass_block", "dirt", "stone", "podzol", "rooted_dirt", "moss_block", "dirt_path"],
    "trees": ["dark_oak_log", "dark_oak_leaves", "oak_leaves", "azalea_leaves", "flowering_azalea_leaves"]
  },
  "objects": ["decorated_pot", "lantern", "shroomlight", "glowstone"]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs into a temp file, then moved into place. Runs from any directory.
set -eu
cd "$(dirname "$0")"
tmp="$(mktemp ./build.XXXXXX)"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// The Capitol grounds: the grid at the site size, a stone sub-floor, then the six parts in plan order.
// Usage: node build.mjs <out.nbt>   (make.sh runs it into a temp file and moves the result into place)
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE } from "./vocab/base.mjs";

const PARTS = [
  ["Ground and pool", "parts/ground.mjs"],
  ["Walks", "parts/walks.mjs"],
  ["Olmsted terrace", "parts/terrace.mjs"],
  ["Grant Memorial and statues", "parts/grant.mjs"],
  ["Trees and planting", "parts/trees.mjs"],
  ["Lamps and lighting", "parts/lamps.mjs"],
];

// A part whose file or build() is not written yet builds nothing, so the others can still be built and checked.
async function partBuild(file) {
  const path = fileURLToPath(new URL(file, import.meta.url));
  if (!existsSync(path)) { console.log(`part ${file}: not written yet, builds nothing`); return () => {}; }
  const mod = await import(path);
  if (typeof mod.build === "function") return mod.build;
  console.log(`part ${file}: no build() yet, builds nothing`);
  return () => {};
}

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

const g = new Grid(SITE_SIZE, { dataVersion: 3955 });                        // 1.21.1, the server's version
// the sub-floor: stone under the whole box at y 0; the ground part lays each column from y 1 up to its height
g.fill([0, 0, 0], [SITE_SIZE[0] - 1, 0, SITE_SIZE[2] - 1], "stone");

const list = [];
for (const [name, file] of PARTS) list.push([name, await partBuild(file)]);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });            // no roof preset: roof.json is skipped
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the Capitol grounds build (plan.md): palette ids, site coordinates, a seeded rng.
// Palette: the ids in palette.json, named (roles first, then objects).

// Shared constants for the Capitol grounds build (plan.md): palette ids, site coordinates, a seeded rng.
// Palette: the ids in palette.json, named (roles first, then objects).
export const SMOOTH_QUARTZ = "smooth_quartz";                       // marble walls, platform, pedestals

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";             // marble trim and coping slabs

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";         // marble cornice stairs and cheek tops

export const QUARTZ_PILLAR = "quartz_pillar";                       // pilasters, pedestal shafts, piers

export const QUARTZ_STAIRS = "quartz_stairs";                       // terrace flight treads

export const QUARTZ_SLAB = "quartz_slab";                           // quartz course slabs

export const QUARTZ_BRICKS = "quartz_bricks";                       // a course that needs brick (only if one does)

export const POLISHED_DIORITE = "polished_diorite";                 // terrace plinth courses

export const POLISHED_DIORITE_SLAB = "polished_diorite_slab";       // plinth course slabs

export const DIORITE_WALL = "diorite_wall";                         // terrace balustrades

export const POLISHED_BLACKSTONE = "polished_blackstone";           // bronze figures, lions, group bodies

export const POLISHED_BLACKSTONE_SLAB = "polished_blackstone_slab"; // bronze hats and top slabs

export const POLISHED_BLACKSTONE_STAIRS = "polished_blackstone_stairs"; // bronze heads and lion heads

export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall"; // bronze legs, gun barrel, lamp posts

export const POLISHED_ANDESITE = "polished_andesite";               // pool coping, plaza bands

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";     // plaza band slabs

export const SMOOTH_STONE = "smooth_stone";                         // pool floor, plaza paving

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";               // coping lip (inner row, bottom type)

export const WATER = "water";                                       // pool and fountain water (source blocks)

export const SMOOTH_SANDSTONE = "smooth_sandstone";                 // Olmsted and central walks

export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";       // walk half-steps at each rise

export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";   // walk stairs (rarely)

export const GRASS_BLOCK = "grass_block";                           // lawn surface

export const DIRT = "dirt";                                         // fill under the surface (three courses)

export const STONE = "stone";                                       // fill below the dirt; the sub-floor at y 0

export const PODZOL = "podzol";                                     // tree soil patch, under crowns only

export const ROOTED_DIRT = "rooted_dirt";                           // tree soil patch, under crowns only

export const MOSS_BLOCK = "moss_block";                             // planting bed base

export const DIRT_PATH = "dirt_path";                               // never on the main walks

export const DARK_OAK_LOG = "dark_oak_log";                         // tree trunks (axis y)

export const DARK_OAK_LEAVES = "dark_oak_leaves";                   // tree crowns (persistent)

export const OAK_LEAVES = "oak_leaves";                             // outer crown patches (persistent)

export const AZALEA_LEAVES = "azalea_leaves";                       // hedge beds (persistent)

export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";   // hedge accents (persistent)

export const DECORATED_POT = "decorated_pot";                       // urns on the piers

export const LANTERN = "lantern";                                   // lamp tops and pier lanterns

export const SHROOMLIGHT = "shroomlight";                           // hidden floodlights in crowns and hedges

export const GLOWSTONE = "glowstone";                               // hidden floodlight under the Grant rim

// Site: plan.md's coordinates. Ranges are inclusive cells; y is the module's (module y 0 = world y 4).
export const SITE_SIZE = [185, 33, 125];                           // the module box: x 0..184, y 0..32, z 0..124

export const POOL = { x0: 20, x1: 55, z0: 16, z1: 109 };           // reflecting pool basin (floor y 1, water y 2)

export const POOL_WATER_Y = 2;                                     // reflecting pool water surface

export const COPING_RING = { x0: 18, x1: 57, z0: 14, z1: 111 };    // 2-wide pool coping ring (top y 3)

export const COPING_Y = 3;                                         // coping top, also the plaza paving level

export const PLAZA = { x0: 60, x1: 70, z0: 10, z1: 114 };          // Union Square paving (y 3)

export const GRANT_PLATFORM = { x0: 60, x1: 66, z0: 67, z1: 89 };  // memorial platform (top y 6)

export const GRANT_TOP_Y = 6;                                      // Grant platform top

export const GRANT_PEDESTAL = { x0: 62, x1: 64, z0: 77, z1: 79, y0: 7, y1: 11 }; // pedestal (plinth course y 11)

export const RIDER_TOP_Y = 15;                                     // top of the equestrian statue

export const CENTRAL_WALK = { x0: 71, x1: 155, z0: 58, z1: 64 };   // the open axial walk (7 wide)

export const TERRACE_TIER1 = { x0: 159, x1: 182, z0: 14, z1: 110, top: 9 };  // lower terrace (paving y 9, balustrade 10)

export const TERRACE_TIER2 = { x0: 171, x1: 182, z0: 30, z1: 94, top: 11 };  // upper terrace (paving y 11, balustrade 12)

export const CORRIDOR = { x0: 0, x1: 184, z0: 44, z1: 80 };        // view corridor: monuments, terrace, walk lamps only

export const ENTRANCE = [71, 4, 61];                               // a visitor stands here at the start of the central walk

export const STREET = [60, 4, 61];                                 // the street end, on the plaza

export const TREE_CROWN_MAX_Y = 18;                                // tree crowns reach y 13..18

export const MAX_Y = 20;                                           // nothing is built above this y

// Random: rng(seed) returns a function giving floats in [0, 1), the same sequence every run for one seed (mulberry32).
export function rng(seed)
```

### vocab/h1.mjs

```js
// Helpers from plan.md VOCABULARY (group h1). Each takes its position as arguments and writes only inside the
// footprint it is given (inclusive box [x0, y0, z0, x1, y1, z1] or a region). Writes are refused, never thrown:
//   - default: only into air (a worker's write never lands on ground, sand, floor or another part's block);
//   - top: air or the ground surface block (grass, dirt, stone...) at the cell's own height H, to lay a walk,
//     paving or wall surface over the grass the ground part put there;
//   - own: anything inside the footprint, for the ground-owning helper (groundColumn) and the buried glowstone.
// Every helper returns { placed, refused }, refused being the [x, y, z] cells it did not write, so the caller
// can report them.

/** Ground column: stone y1..H-4, three dirt courses, the surface block at H. Writes the whole column, never above H. */
export function groundColumn(g, x, z, H, surface = "grass_block")

/** Union Square paving at y over the box x0..x1, z0..z1: smooth_stone, with polished_andesite bands every 6 cells. */
export function plazaPaving(g, x0, z0, x1, z1, y = 3)

/**
 * Walk along a curve. points: [[x, z], ...]; heightAt(x, z) = the mapped ground H; region = [x0, z0, x1, z1] bounds the
 * walk. width 3 stamps a 3x3 square at every sample. Surface smooth_sandstone at H; a cell that is one block higher than
 * the cell before it along the run gets a bottom smooth_sandstone_slab at H on a column filled to H-1 (slabStep).
 */
export function curvedWalk(g, points, heightAt, region, width = 3)

/**
 * Marble terrace face. faceX: the wall line (the proud column is faceX-1); the body runs east to x1 and fills from the
 * mapped H up to topY-1, with a smooth_quartz paving at topY. Plinth: polished_diorite at H on the proud column;
 * cornice: smooth_quartz_slab top at topY on it. gaps: [[z0, z1], ...] rows where the terrace body and the face stop
 * (stair flights): only the paving stays. holes: [[z0, z1, y0, y1], ...] face cells left open (a niche) at faceX.
 */
export function marbleTier(g, heightAt, faceX, z0, z1, x1, topY, { gaps = [], holes = [] } = {})

/** Urn on a pier: quartz_pillar at y, decorated_pot at y+1. */
export function urnPier(g, x, y, z)

/**
 * Grotto niche in the terrace face: the front cells at x = faceX, z zA..zB, y yLo..yHi are left as air (recess by
 * exclusion); quartz pillars on both sides, a smooth_quartz_stairs lintel (top, facing west) at yHi+1, and a
 * smooth_quartz back wall at faceX+1.
 */
export function grottoNiche(g, faceX, zA, zB, yLo, yHi)

/**
 * Bronze horseman on a pedestal top at baseY. Centre (cx, cz); facing "west" puts the head at x = cx-1 and the tail at
 * x = cx+1 (east). Legs: polished_blackstone_wall at the four corners; body: polished_blackstone row with bottom slabs
 * on the sides; head: stairs facing `facing` at y+2; rider at y+2 with a wall head at y+3 and a slab hat at y+4.
 */
export function bronzeHorseman(g, cx, baseY, cz, facing = "west")

/**
 * Artillery group on a white base at baseY, footprint x0..x0+4, z0..z0+4: a two-horse team (stair heads facing west) on
 * the two north rows, a limber with wall wheels on the third, and a gun barrel (walls lying along x) on the fourth row
 * with a stair breech at its west end.
 */
export function artilleryGroup(g, x0, baseY, z0)

/**
 * Hidden light. "shroomlight": at (x, y, z), into air or a leaf, only where at least 4 of its 6 neighbours are foliage
 * (inside a crown or a hedge). "glowstone": under a slab or block, so the cell above must be solid; it may replace
 * a solid cell only with buried: true (the platform's rim lights).
 */
export function floodlight(g, x, y, z, kind = "shroomlight", { buried = false } = {})
```

### vocab/h2.mjs

```js
// The plan.md VOCABULARY helpers for the Capitol grounds: poolBasin, walkStrip, oakTree, pilaster, terraceFlight,
// memorialPlatform, lionCouchant, smallStatue. Each takes its position as arguments (and facing where it has one)
// and returns { cells, refused, footprint }: the cells it wrote, the writes it declined with the reason, and the box
// it may write in. Nothing throws on a refused write; a bad call (a flight whose run is not its step count) throws.
//
// Rules every helper keeps:
//   - it writes only inside its footprint;
//   - it writes only into air, except the cells the plan names as replaceable: the ground top H itself (a surface,
//     a soil patch), or the blocks a helper's option lists (a pilaster over the wall face, a glowstone in the platform);
//   - it never writes below a column's ground top H (groundTop: the highest non-air cell at or below y 20). The
//     ground part owns those cells; a helper that needs ground under it reports that instead of filling it.

// A pool basin: still water at y 2 over x0..x1, z0..z1. The floor (y 1) is the ground part's; pass { floor: true }
// to lay smooth_stone over the ground there instead. The coping ring around it must already stand.
export function poolBasin(g, x0, z0, x1, z1, { floor = false } = {})

// A walk strip over x0..x1, z0..z1: the surface at each column's ground top H, and a half-step slab wherever H
// rises by 1 to a neighbour in the strip. Replaces the lawn at H only; the ground below is not touched.
export function walkStrip(g, x0, z0, x1, z1, surface = "smooth_sandstone")

// A big oak at (x, z): a trunk (dark_oak_log, trunk x trunk cells, from H+1 to H+h), a crown of dark_oak_leaves
// (oak_leaves on about one outer cell in four) ellipsoid radius r, with a shroomlight inside it, and a soil patch at
// H (rooted_dirt under the trunk, podzol within 2 of it). Crown cells in clearZ = [z0, z1] are skipped (the corridor).
export function oakTree(g, x, z, h = 6, r = 4, { trunk = r >= 4 ? 2 : 1, clearZ = null } = {})

// A quartz pillar (axis y) at (x, y0..y1, z). By default it replaces only the marble wall cells it stands flush in.
export function pilaster(g, x, z, y0, y1, { replace = ["smooth_quartz"] } = {})

// A monumental flight of steps climbing toward `facing`, from the low end of the run (steps cells long, one tread
// per cell, the first at y0). Quartz stair treads, smooth_quartz solid under each tread down to ground, a 1-wide
// smooth_quartz cheek on both outside edges whose top course is a stair following the slope, and an urn pier on
// each cheek's foot (the low end). Position: x0..x1, z0..z1, with the run along x for east/west, along z for north/south.
export function terraceFlight(g, { x0, x1, z0, z1, y0, steps, facing = "east" })

// A memorial platform: smooth_quartz box x0..x1, z0..z1 from y0 to topY; a polished_diorite base course on the ring
// one cell out at y0 (with stepZ = [za, zb] the ring is slabs there, and inboard y0+1 slabs stand for the steps);
// a smooth_quartz_slab rim at topY+1 on the perimeter except at the steps and inside each `open` box [xa, za, xb, zb]
// (where a group stands); glowstone at topY under the rim at the corners and mid-sides.
export function memorialPlatform(g, { x0, z0, x1, z1, y0, topY, stepZ = null, open = [] })

// A lion couchant: a polished_blackstone body at (x, y, z) and, at the neighbour on the side away from the pedestal,
// a polished_blackstone_stairs head facing away from the statue. toward: the direction from the lion to the pedestal.
export function lionCouchant(g, x, y, z, toward)

export function smallStatue(g, x, z, kind)
```

### vocab/h3.mjs

```js
// The eight plan.md helpers for the Capitol West Front grounds: copingRing, slabStep, hedgeBed, balustradeRun,
// fountainBasin, pedestal, cavalryGroup, lampPost. Each takes its position as arguments and returns how many blocks
// it placed. Blocks and states follow plan.md's PALETTE and VOCABULARY; coordinates are module coordinates.
//
// Placement rule, for every helper: a cell takes a block only if it is air. A write into ground, water, walls or an
// earlier part's block is refused and counted in g.refused (the record guard() keeps), so the ground part's columns
// stay as laid. One exception, bounded to the column's top block: a plan's ground-level surface (a walk slab, a moss
// bed) replaces the top block of its column and nothing below it. Heights come from the grid: the top ground block of
// a column, skipping trees, props and walls.

/** Pool coping: a 2-wide ring x0..x1, z0..z1 at y3. Outer row: polished_andesite on stone fill y1..2. Inner row: a
 * bottom smooth_stone_slab, touching the water. */
export function copingRing(g, x0, z0, x1, z1, { over = false } = {})

/** A walk step at ground height H: dirt filled up to H-1, then a bottom smooth_sandstone_slab at H (over the grass). */
export function slabStep(g, x, z, H)

/** A planting bed x0..x1, z0..z1: moss_block at each ground top H, then azalea leaves at H+1 (flowering every 5th,
 * a shroomlight in place of the leaf every 4th, so the hedge stays one high). */
export function hedgeBed(g, x0, z0, x1, z1)

/** A balustrade along a straight line: line = { axis: "x" | "z", at, from, to } (at is the fixed coordinate). A
 * diorite_wall at y, with quartz_pillar piers at y every 8 from `from`, at `to`, and either side of each gap; a
 * smooth_quartz_slab top rail at y+1 on every wall. gaps = [[a, b], ...] stay open: nothing is placed in them. */
export function balustradeRun(g, line, y, gaps = [], { over = false } = {})

/** A fountain basin x0..x1, z0..z1 with its rim at y: smooth_quartz floor at y-1, a smooth_quartz rim ring at y, still
 * water one deep inside it. jet: a 2-high water column at the centre. A decorated_pot urn on each rim corner. */
export function fountainBasin(g, x0, z0, x1, z1, y, jet = false, { over = false } = {})

/** A pedestal x0..x1, z0..z1: a quartz_pillar shaft from y0 to y1-1, a polished_blackstone top course at y1. */
export function pedestal(g, x0, z0, x1, z1, y0, y1, { over = false } = {})

/** The cavalry group x0..x1, z0..z1 on a white smooth_quartz base at baseY. Three horses charge west, staggered
 * (z offsets 1, 2, 4): each has wall legs at baseY+1, a 2-long polished_blackstone body at baseY+2 with a stair head
 * facing west, and a wall rider at baseY+3. Needs 5 x 5 cells. */
export function cavalryGroup(g, x0, z0, x1, z1, baseY = 7, { over = false } = {})

/** A lamp post at (x, z): a polished_blackstone_wall at H+1..H+2 and a standing lantern at H+3. H is the ground top
 * unless opts.H is given. */
export function lampPost(g, x, z, { H, over = false } = {})
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
