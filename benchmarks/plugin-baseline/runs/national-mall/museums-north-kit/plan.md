# Plan: three museums on the north side of the Mall (form, by the architect)

## SITE

- Frame: one kit, plots along x as the brief gives them (plot 0 x 0..114, plot 1 x 119..183, plot 2 x 188..215). Every coordinate below is in this frame. North = low z, east = high x.
- **Front faces SOUTH (+z, the Mall)** for all three; the template's "front faces north" does not apply here. x runs along the Mall. The backs (z 0) face Constitution Avenue.
- Ground: "ground value g" means the first building course is at y = g. Every mass fills its footing down to y 0 (no floating, no burying). Plots 0 and 1 are near flat (plot 0: 1, 2 under the centre; plot 1: 0). Plot 2 sits on a mound at 4 (lower, 0-2, at its north-west corner, 3 at its south edge): the NMAAHC floor is y 4 and its terrace walls step down to the lower ground.
- Leave the cells outside each footprint map untouched. Nothing above the caps (plot 0 y 37, plot 1 y 20, plot 2 y 45).
- Every roof uses `overhang: 0` and `grow: false` on these plots, so no eave grows off the grid and shifts the build.

### Plot 0: National Museum of Natural History (granite Beaux-Arts, green dome, red roofs)

The original 1910 block (x 22..92) is a ring of ranges round two light courts, with a central N-S range under the rotunda. The 1960s flat-roofed wings (x 0..21, x 93..114) sit set back from the Mall. Symmetric about **x 57**.

| mass | x | y | z | notes |
|---|---|---|---|---|
| South range (Mall front) | 22..92 | 1..12 | 33..41 | wall face z 41; cornice y 11, balustrade y 12 |
| West end pavilion | 22..31 | 1..13 | 8..42 | south face projects to z 42 (+1); attic y 12..13 |
| East end pavilion | 83..92 | 1..13 | 8..42 | mirror of the west one |
| North range | 25..88 | 1..12 | 3..11 | back front, wall face z 3 |
| North entrance porch | 49..64 | 1..4 | 0..2 | low terrace porch, piers x 49..52 and x 61..64 at z 0, steps between |
| Central N-S range | 48..66 | 1..12 | 12..32 | under and behind the rotunda |
| South pavilion | 47..67 | 1..16 | 33..39 | front wall z 39; attic y 12..15; cornice y 16 |
| Portico platform | 47..67 | 1..4 | 40..42 | solid podium, top surface on y 4; columns stand on it |
| Portico columns | see RESERVED | 5..10 | 42 | 6 columns, entablature y 11 at z 40..42 |
| Pediment | 47..67 | 17..22 | 42 face | apex x 57 y 22 (see ROOFS) |
| Rotunda drum (octagon) | 48..66 | 12..19 | 18..36 | centre x 57 z 27, flat sides 9 long, cut corners 5 on the diagonal |
| Dome | 49..65 | 20..26 | 19..35 | low dome, base radius 8, centre (57, 20, 27) |
| Lantern | 56..58 | 27..28 | 26..28 | 3x3 glazed lantern, slab cap y 28 |
| West light court (open) | 32..47 | ground (y 1) | 12..32 | open to sky, paved floor y 1 |
| East light court (open) | 67..82 | ground (y 1) | 12..32 | open to sky |
| Grand steps | 50..64 | 1..4 | 43..45 | half-step ramp from the platform down to the Mall (OPENINGS) |
| West 1960s wing | 0..21 | 1..10 | 8..29 | flat roof, coping y 11 |
| East 1960s wing | 93..114 | 1..10 | 8..28 | flat roof, coping y 11 |
| East wing north annex | 97..113 | 1..6 | 6..7 | low service block, flat |
| Planting beds | 0..13 z 30..31; 14..18 z 30 | 1 | | low hedges (box: `azalea_leaves` persistent), lamp at each end |

### Plot 1: National Museum of American History (pink marble late-modern box)

Long, low, symmetric about **x 152**. Proportion about 6:1 (63 long, 10 high), the real one.

| mass | x | y | z | notes |
|---|---|---|---|---|
| Podium / plinth course | 121..183 | 0 | 1..27 | one course, full footprint (main box) |
| Main box walls | 122..182 | 0..7 | 2..26 | panel-and-slot walls, faces 1 inside the cornice line |
| Cornice band (attic) | 121..183 | 8..9 | 1..27 | projects +1 on all four sides over the walls |
| Roof deck | 122..182 | 9 | 2..26 | flat, inside the band |
| Clerestory penthouse | 140..164 | 10..12 | 8..20 | stepped back 6 from the north and south fronts |
| Atrium skylight | 146..158 | 12 | 11..17 | glass roof in the penthouse, lit below |
| South entrance recess | 142..162 | 0..5 | 24..26 | glass front set back at z 24; the cornice band and wall above y 6 carry over it as a 3-deep overhang |
| South terrace step | 121..162 | 0 | 28 | bottom-slab terrace step along the front |
| West entrance terrace | 119..120 | 0 | 15..18 | slab terrace to a west door |
| North loading block | 165..183 | 0..5 | 0 | thin low wall/canopy strip, flat top y 5 |

### Plot 2: National Museum of African American History and Culture (bronze Corona)

Symmetric about **x 201, z 13**. The corona's top tier fills the square x 188..214, z 0..26; "inset k" below = k cells in from that square on all four sides.

| mass | inset | x | z | y |
|---|---|---|---|---|
| Plinth / terrace | 0 | 188..214 | 0..26 | 0..3 (footing to ground; top surface y 3) |
| Glass base (recessed) | 5 | 193..209 | 5..21 | 4..7 |
| Tier 1: shadow band | 4 | 192..210 | 4..22 | 8 |
| Tier 1: lattice | 3 | 191..211 | 3..23 | 9..10 |
| Tier 1: flare lip | 2 | 190..212 | 2..24 | 11 |
| Tier 2: shadow band | 3 | 191..211 | 3..23 | 12 |
| Tier 2: lattice | 2 | 190..212 | 2..24 | 13..14 |
| Tier 2: flare lip | 1 | 189..213 | 1..25 | 15 |
| Tier 3: shadow band | 2 | 190..212 | 2..24 | 16 |
| Tier 3: lattice | 1 | 189..213 | 1..25 | 17..18 |
| Tier 3: flare lip | 0 | 188..214 | 0..26 | 19 |
| Roof coping ring | 0 | 188..214 | 0..26 | 20 (slab) |
| Roof deck | 1 | 189..213 | 1..25 | 19 |

Each tier is a shell 1 thick. Its lattice is the outer skin, and the dark glass and lights sit 1 cell inside it (see FACADES). Each tier steps out 1 as it rises (band, then lattice, then lip), so every tier reads as tilting outward and the whole corona widens upward with a shadow line between tiers.

| other mass | x | y | z | notes |
|---|---|---|---|---|
| Porch canopy | 192..210 | 8 | 22..31 | flat, 1 slab thick, runs out of the south face under tier 1 |
| Canopy posts | 192, 210 at z 31; 196, 206 at z 31 | 4..7 | | 4 slender posts |
| Porch floor | 189..213 | 3 (top) | 22..32 | paving at the floor level |
| Reflecting pool W | 193..198 | 2..3 | 26..30 | water at y 3, basin y 2 |
| Reflecting pool E | 204..209 | 2..3 | 26..30 | mirror |
| Entry walk | 199..203 | 3 | 22..32 | between the pools to the doors |
| Grounds | ring outside the base, x 188..214 z 0..26 at y 3, and x 189..214 z 27..32 | 3 | | paving under the overhang, planted beds at the four corners outside the base, low trees on the west and north |
| South edge steps | 190..213 | 3 | 32..33 | half step down to ground 3 |

## ROOFS

| roof | form | where | height | material / tool |
|---|---|---|---|---|
| NMNH ranges (south, north, central N-S north of drum z 12..17) | low hip, pitch `half` (slab steps, ~27°), behind the balustrade | each range rect | eaves y 12 inside the balustrade, ridge y 15 (south and north ranges, 9 deep) | `mcd roof --style hip --material red-tile --pitch half --overhang 0 --ridge slab --grow false`, footprint = the range rects, `keep` = drum, pavilion and end-pavilion boxes. Preset by type is `temple` (red tile, museum); the hip form is chosen because the real wing roofs are hipped |
| NMNH end pavilions | hip, pitch `half` | x 22..31 / 83..92, z 8..42 | eaves y 14, ridge y 17 | red-tile, as above; they read 2 higher than the ranges |
| NMNH south pavilion | low front gable (temple), ridge N-S along x 57 | x 47..67, z 36..42 | eaves y 16, ridge y 22 | `temple` preset (red-tile, quartz raking cornice, tympanum `smooth_quartz`, no oculus), pediment face south. The north end dies into the drum at z 36 |
| NMNH pediment | by hand (part) if the preset can't place it at z 42 over the portico | z 42, y 17..22 | rows: y 17 x 47..67, y 18 x 49..65, y 19 x 51..63, y 20 x 53..61, y 21 x 55..59, y 22 x 57 | raking cornice of `quartz_stairs` along both rakes, projecting 1 (z 43 is open air over the steps, so it may hang there), tympanum `smooth_quartz` |
| NMNH dome | low dome, stepped base rings | centre (57, 20, 27) | base radius 8, top y 26 | `dome()` brush, profile low (rise 7 on radius 8), block `oxidized_copper`, 8 ribs `oxidized_cut_copper` on the axes and diagonals; 2 stepped rings at its foot: y 20 radius 9 and y 21 radius 8.5 in `smooth_quartz` / `quartz_slab` |
| NMNH lantern | glazed 3x3 drum, slab cap | x 56..58, z 26..28 | y 27, cap y 28 | `oxidized_cut_copper_slab` cap, `glass` sides, `lantern` inside, `lightning_rod` on top at y 29 |
| NMNH 1960s wings, annex, north porch | flat | their rects | deck y 10, coping y 11 | `smooth_stone` deck, `smooth_quartz_slab` coping |
| NMAH main roof | flat, behind the cornice band | x 122..182 z 2..26 | y 9 | `smooth_stone` deck; `modern` preset if it is used, with no rail |
| NMAH penthouse | flat with a glass skylight | x 140..164 z 8..20 | y 12 | `white_terracotta` roof ring 2 wide, `glass` skylight x 146..158 z 11..17 |
| NMAAHC | flat deck in the coping ring | inset 1 | y 19 deck, y 20 coping | built by the corona part, not `mcd roof` |
| NMAAHC porch canopy | flat cantilever slab | x 192..210 z 22..31 | y 8 | `smooth_stone_slab` (top) deck, `waxed_cut_copper` fascia on its edge rows (x 192, 210, z 31) |

The roofs meet as follows. The NMNH range hips stop against the end pavilions' attics and against the drum. The pavilion gable dies into the drum face at z 36. No roof on the light courts.

## FACADES

### NMNH south front (z 41/42), the hero face
Base, middle and top, all three light grey-white:
- **Plinth** y 1: `polished_diorite`, full length, 0 proud.
- **Rusticated ground storey** y 2..3: `stone_bricks` read as rusticated granite, wall plane.
- **String course** y 4: `smooth_quartz`, +1 proud (a shadow line). It runs over the platform at the pavilion.
- **Main order** y 5..10. Bays are 4 wide on a rhythm from x 57 outward: a **pilaster** column of `quartz_pillar` (axis y), +1 proud on the bay lines x 57±4n, then a **tall window** 1 wide, y 5..9, recessed 1, between pairs of pilasters. The range wall body is `calcite`.
- **Entablature / cornice** y 11: `smooth_quartz` frieze, then `quartz_stairs` upside down +1 proud at the top of y 11 (a strong cornice).
- **Balustrade** y 12: `diorite_wall` on a `smooth_quartz_slab` rail line, set on the cornice line, with solid `smooth_quartz` dies at every pilaster.
- **End pavilions** (x 22..31, x 83..92) at z 42: 4 engaged columns `quartz_pillar` at x 23, 26, 27, 30 (west) and x 84, 87, 88, 91 (east), +1 proud. Their windows sit in the 2 central bays. Attic y 12..13 is solid `smooth_quartz` (no balustrade), with a cornice of `quartz_stairs` at y 13.
- **South pavilion**: front wall z 39 (behind the portico) in `calcite`, with a door bay at x 56..58. The **portico** is 6 `quartz_pillar` columns, 1 thick, at z 42, y 5..10, on the platform, each with a `chiseled_quartz_block` capital at y 10 and a `quartz_slab` base. The entablature over the columns, y 11, z 40..42, is `smooth_quartz` with `quartz_stairs` cornice. The **attic** y 12..15 at z 40 (set back 2 from the columns: z 41..42 at y 12..15 stays air, so the pediment base above reads as projecting over a shadow) carries a **thermal (half-round) window** in the middle: glass on y 12 x 53..61, y 13 x 54..60, y 14 x 55..59, y 15 x 56..58, with `quartz_stairs` voussoirs round it. The cornice y 16 at z 40..42 and the pediment above, at z 42, on top. The pediment rests on the cornice: the cornice y 16 spans z 40..42 x 47..67 and carries it, so the attic is open beneath at z 41..42 only between y 12 and 15. The **steps** fan out in front.
- **Drum** y 12..19: `smooth_quartz` and `calcite`. A 1-wide `quartz_pillar` pilaster at each octagon corner, +0 (flush). One window per face, slot 1 wide, y 13..17, recessed, lit behind. Cornice ring y 19 `quartz_stairs` +1 proud.
- **Dome**: green copper, ribs on 8 axes, lantern on top.

### NMNH other faces
- **East and west faces** of the end pavilions and the 1960s wings carry the same base, string course and cornice lines.
- **North range face** (z 3): same order, plainer. Pilasters only at the pavilion corners, windows every 4 cells.
- **Court faces**: plain `calcite`, windows every 3 cells, cornice only.
- **1960s wings**: `calcite` body, plinth y 1 `polished_diorite`, string y 4. Vertical window slots 1 wide, y 5..9, every 3 cells, recessed 1. Coping y 11 `smooth_quartz_slab`. No pilasters: they read as quieter add-ons.

### NMAH (plot 1)
- **Plinth** y 0: `smooth_stone`, the terrace edge.
- **Wall** y 0..7 (faces x 122, x 182, z 2, z 26). It alternates, along each face, **stone panels 3 wide** (`white_terracotta`, flush) with **window slots 1 wide**, y 1..7, recessed 1, glazed `gray_stained_glass_pane` (lit `ochre_froglight` 2 behind every other slot).
  - On the south face the rhythm runs from x 152 outward: slot on x 152±4n, panels between.
  - North face: same rhythm.
  - East and west faces: slots on z 14±4n.
  - Corners solid (3 wide).
- **Cornice band** y 8..9: `white_terracotta` +1 proud on all sides, its underside row y 8 lined with `smooth_quartz_slab` (top) for a crisp shadow edge. This band is the signature: deep and unbroken.
- **South entrance**: the glass front at z 24, x 142..162, y 0..5. It is `glass_pane` with `white_terracotta` mullions every 4 (x 142, 146, 150, 154, 158, 162), doors at x 150..154 y 1..2, and warm light behind. The soffit of the overhang, at y 6, z 25..26, is `smooth_quartz` with `ochre_froglight` set into it every 4 cells. Its side returns (x 141, x 163, z 24..26) are `white_terracotta`.
- **Penthouse** y 10..11: `white_terracotta` piers every 3 cells with a `light_gray_stained_glass` clerestory ribbon between, lit inside. Roof ring y 12.
- **West door** at x 122, z 15..17 (glass doors, 3 wide, y 1..2).

### NMAAHC (plot 2)
- **Glass base** y 4..7 at inset 5: `black_stained_glass` curtain with `waxed_cut_copper` mullions every 4 cells, lit inside (`ochre_froglight` ceiling pads every 4 cells, inset 6, y 7).
- **Corona lattice** (rows "lattice" and "flare lip", outer skin at their inset):
  - The skin is `waxed_copper_grate`, the see-through bronze lattice.
  - The flare lip rows (y 11, 15, 19) and every corner column are `waxed_cut_copper`: a solid bronze edge that draws each tier's outline.
  - 1 cell inside the skin there is a glass layer of `brown_stained_glass`, with an `ochre_froglight` every 3rd cell in rows y 10, 14, 18. Amber glows through the grate at dusk.
- **Shadow bands** (y 8, 12, 16): `black_stained_glass` at their inset, recessed 1 behind the tier lip above.
- **Porch**: the canopy edge `waxed_cut_copper`; the underside lit with `ochre_froglight` every 4 cells set into the y 8 slab line. The posts are `polished_deepslate_wall`.
- **Pools**: `water` at y 3 with a `smooth_stone` coping ring.

## MATERIALS

Checked with `$MCD blocks --check`: all exist in 1.21.1 (copper grate and copper trapdoor came in 1.21).

| building | role | block |
|---|---|---|
| NMNH | wall body (pale granite) | `calcite` |
| NMNH | rusticated ground storey | `stone_bricks` |
| NMNH | plinth | `polished_diorite` |
| NMNH | trim, cornice, string courses, attics | `smooth_quartz`, `quartz_stairs`, `smooth_quartz_slab` |
| NMNH | columns, pilasters | `quartz_pillar` (axis y), capitals `chiseled_quartz_block` |
| NMNH | balustrade | `diorite_wall` |
| NMNH | ranges' roof (red tile) | `red-tile` palette: `brick_stairs`/`granite_stairs`/`polished_granite_slab` |
| NMNH | dome | `oxidized_copper`; ribs `oxidized_cut_copper`; lantern cap `oxidized_cut_copper_slab` |
| NMNH | glass | `gray_stained_glass_pane` (wings); `glass_pane` (portico door, thermal window, drum) |
| NMAH | body, panels, band (pink-beige marble) | `white_terracotta` |
| NMAH | plinth, roof deck | `smooth_stone` |
| NMAH | band underside, soffit | `smooth_quartz_slab`, `smooth_quartz` |
| NMAH | slots | `gray_stained_glass_pane` |
| NMAH | entrance, skylight | `glass_pane`, `glass` |
| NMAH | clerestory | `light_gray_stained_glass` |
| NMAAHC | lattice | `waxed_copper_grate` |
| NMAAHC | solid bronze edges | `waxed_cut_copper`, `waxed_cut_copper_slab` |
| NMAAHC | glass behind the lattice | `brown_stained_glass` |
| NMAAHC | base glass, shadow bands | `black_stained_glass` |
| NMAAHC | roof deck, canopy | `smooth_stone`, `smooth_stone_slab` |
| all | warm hidden light | `ochre_froglight` (behind glass, in soffits), `lantern` |
| all | ground paving | `smooth_stone` (plazas), `light_gray_concrete` (walks), `gravel` (Mall-side walk south of NMNH steps, if any) |
| all | lawn and planting | `grass_block`, `azalea_leaves` (persistent), oak trees |

Colour scheme: three distinct reads. Grey-white with a green dome and red roofs, then pink-beige, then bronze. Keep all three; don't swap any of them.

## OPENINGS

Shells leave these as air. Later parts add the glass, doors and lights.

| building | opening | where | size |
|---|---|---|---|
| NMNH | south tall windows | z 41, y 5..9, in each bay between pilasters: x 57±4n±2 (x 25, 29, 33 … 89, skipping the pavilion x 47..67) | 1 x 5 |
| NMNH | south ground-storey windows | z 41, y 2..3, under each tall window | 1 x 2 |
| NMNH | end pavilion windows | z 42, x 24..25 and 28..29 (W), x 85..86 and 89..90 (E), y 5..9 | 2 x 5 each |
| NMNH | main door | z 39, x 56..58, y 5..8 | 3 x 4 (glass doors) |
| NMNH | side doors in pavilion | z 39, x 51..52 and x 62..63, y 5..7 | 2 x 3 |
| NMNH | thermal window | z 40, y 12..15 (stepped as in FACADES) | half round, 9 wide |
| NMNH | drum windows | each of the 8 faces, centred, y 13..17 | 1 x 5 |
| NMNH | north door | z 3, x 55..59, y 2..4 | 5 x 3 |
| NMNH | north range windows | z 3, every 4 cells x 27..87, y 5..9 | 1 x 5 |
| NMNH | wing slots | 1960s wings, all faces, every 3 cells, y 5..9 | 1 x 5 |
| NMNH | grand steps (approach) | x 50..64, z 43..45 | 15 wide. Half steps down from the platform top (surface 5.0): z 43 bottom slab y 4 (4.5), z 44 full block y 3 (4.0), z 45 bottom slab y 3 (3.5), then the ground (3..4). Never stairs. |
| NMAH | slots | all four faces, y 1..7, on the rhythm in FACADES | 1 x 7 |
| NMAH | south glass front | z 24, x 142..162, y 0..5 (doors x 150..154, y 1..2) | 21 x 6 |
| NMAH | west doors | x 122, z 15..17, y 1..2 | 3 x 2 |
| NMAH | north doors | z 2, x 150..154, y 1..2 | 5 x 2 |
| NMAAHC | main doors | south base face z 21, x 199..203, y 4..5 | 5 x 2 |
| NMAAHC | base glass | the whole base ring y 4..7 at inset 5, except corner columns and mullions every 4 | |

## RESERVED

The shell leaves these empty; the named part fills them.

| what | cells | filled by |
|---|---|---|
| NMNH portico columns | x 49, 52, 55, 59, 62, 65; z 42; y 5..10 (base slab y 5, capital y 10) | portico part |
| NMNH pilasters (proud) | z 42 on the south range bay lines x 57±4n (x 25 … 89, outside x 46..68), y 5..10 | facade part (they stand in front of the z 41 wall) |
| NMNH portico void | x 47..67, z 40..41, y 5..10 (porch under the entablature); x 47..67, z 41..42, y 12..15 (shadow under the pediment) | stays air, apart from floodlights at the column bases |
| NMNH dome + lantern | sphere-cap above the drum, x 49..65, y 20..28, z 19..35 | dome part |
| NMNH light courts | x 32..47 and x 67..82, z 12..32, y 1..37 | stay open; only paving and lamps at y 1 |
| NMNH steps | x 50..64, z 43..45 | approach part |
| NMAH entrance recess | x 142..162, z 25..26, y 0..5 | stays air (the overhang), paving at y 0 |
| NMAH skylight | x 146..158, z 11..17, y 12 | glazed by the penthouse part |
| NMAAHC base ring under the corona | inset 0..4 round the base, y 4..7 | stays air (the overhang shadow) apart from paving and lights at y 3 |
| NMAAHC pools | x 193..198 and x 204..209, z 26..30, y 2..3 | landscape part (water) |
| NMAAHC canopy posts | (192, 31), (196, 31), (206, 31), (210, 31), y 4..7 | porch part |

## FLOORS

Exterior only: there are no rooms. The levels below are nominal, for lit windows and the light seen through glass.

| building | level | y | volume |
|---|---|---|---|
| NMNH | ground storey | 1 (floor) | ranges, y 1..3 |
| NMNH | main floor | 4 | ranges, y 5..10; portico platform top y 4 |
| NMNH | rotunda | 4 | drum interior radius 7 at y 5..19, open up into the dome |
| NMNH | 1960s wings | 1, 4, 7 | y 1..10 |
| NMAH | ground | 0 | main box y 0..7 |
| NMAH | atrium | 0 | x 146..158 z 11..17, open from y 1 to the skylight at y 12 (light it: `ochre_froglight` on its floor edges and glass, glowing up) |
| NMAAHC | lobby | 4 | glass base y 4..7, inset 5 |
| NMAAHC | corona galleries | 8, 12, 16 | each tier's shell, 1 cell of glass and light inside the lattice |

Lighting: no dark cell outside.
- **NMNH**: a `lantern` on every balustrade die facing south. Two `ochre_froglight` floods set into the platform at each column base, z 41, y 4, which wash the portico at dusk. Lanterns on posts every 8 along the steps' cheeks and the courts. Light inside every lit window.
- **NMAH**: soffit lights, plus lanterns on the terrace every 8.
- **NMAAHC**: froglights behind the lattice. Lanterns under the overhang every 6 round the base, and in the grounds every 8.

# DESIGNER SECTIONS (below the architect's form)

## PALETTE (all ids verified with `$MCD blocks --check`, none unknown)
Architect's MATERIALS kept exactly. Shape variants:
- NMNH: wall `calcite`; rustic `stone_bricks`, `stone_brick_slab`; plinth `polished_diorite`; trim `smooth_quartz`, `smooth_quartz_slab`, `quartz_slab`, `quartz_stairs`, `quartz_pillar`(axis y), `chiseled_quartz_block`; balustrade `diorite_wall`; roof `brick_stairs`, `granite_stairs`, `polished_granite_slab`; dome `oxidized_copper`, `oxidized_cut_copper`, `oxidized_cut_copper_slab`, `oxidized_cut_copper_stairs`, `lightning_rod`; glass `glass_pane`, `gray_stained_glass_pane`, `glass`; doors `iron_door`.
- NMAH: `white_terracotta`, `smooth_stone`, `smooth_stone_slab`, `smooth_quartz`, `smooth_quartz_slab`, `gray_stained_glass_pane`, `glass_pane`, `glass`, `light_gray_stained_glass`.
- NMAAHC: `waxed_copper_grate`, `waxed_cut_copper`, `waxed_cut_copper_slab`, `waxed_cut_copper_stairs`, `waxed_copper_trapdoor`, `brown_stained_glass`, `black_stained_glass`, `polished_deepslate_wall`, `water`.
- Light/ground: `ochre_froglight`, `lantern` (hanging or standing on fence/wall post), `oak_fence`, `smooth_stone`, `light_gray_concrete`, `gravel`, `grass_block`, `azalea_leaves` (persistent true), `oak_log`/`oak_leaves` (persistent true).
- Leave openings as air in the shell; the facade part glazes them.

## VOCABULARY
- `ashlarBay(x,z,face)`: plinth diorite y1, stone_bricks y2..3, quartz string y4, calcite y5..10 with window slot air.
- `pilaster(x,y0,y1,z)`: quartz_pillar axis y, +1 proud, quartz_slab base, chiseled capital.
- `corinthianColumn(x,z)`: quartz_slab bottom y5, quartz_pillar y6..9, chiseled_quartz_block y10.
- `balustrade(x0,x1,z,y)`: smooth_quartz_slab rail y12 line, diorite_wall above, smooth_quartz die every pilaster bay topped by standing lantern.
- `octagonDrum(c,r)`: 9-long flat sides, 5 diagonal cuts, smooth_quartz/calcite, corner pilasters, 1x5 window slots, cornice ring.
- `domeRibbed()`: `dome()` brush oxidized_copper, 8 oxidized_cut_copper ribs on axes/diagonals, 2 quartz rings.
- `lanternCap()`: 3x3 glass drum with lantern inside, cut-copper slab cap, lightning rod.
- `pediment()`, `thermalWindow()`: rows per plan ROOFS/FACADES.
- `redTileHip(rect,eaves,ridge)`: `mcd roof` hip, red-tile, overhang 0, ridge slab, grow false.
- `grandSteps()`: half-step ramp per OPENINGS (never stairs).
- `tallWindow(x,z,face)`: glass_pane recessed 1, quartz_slab sill, quartz_stairs upside-down lintel.
- `panelSlotWall(face)`: 3 white_terracotta panels, 1 slot recessed, gray pane, froglight 2 behind every other slot.
- `corniceBand()`, `penthouse()`, `glassFront()`: as FACADES NMAH.
- `coronaTier(inset,y)`: ring of waxed_copper_grate with waxed_cut_copper corners/lip, brown glass ring 1 inside, froglight every 3rd cell.
- `glassBase()`, `porchCanopy()`, `reflectingPool(x0,x1)`: per plan.
- `floodBase(x,z)`: two ochre_froglight set in the platform beside a column base.
- `lampPost(x,y,z)`: oak_fence x2 + lantern standing on top.
- `oakTree(x,z)`: oak_log axis y 4-5 high, persistent oak_leaves crown wider by 2, not a sphere.

## ROOMS
Exterior only. Three light volumes seen through glass; interior designers only light them.

## PARTS (6; see JSON) and Notes
1. NMNH shell. 2. NMAH shell+facade. 3. Roofs, dome and corona. 4. NMNH facade (portico, pilasters, balustrade, pediment). 5. Glazing, doors, lighting. 6. Grounds, steps, lamps.
Checklist: [x] P1 [ ] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6.
Notes: exact block ids as above; 1.21.1 only; all roofs overhang 0 grow false; build NMNH dome after drum; call vocab helpers, don't hand-place; run `$MCD check` after each part; every opening stays air until P5; no signs.
NMNH shell notes: ranges/pavilions/central/wings solid to y11 (wings y10 smooth_stone deck, coping y11 left to roofs); platform y1..4 only: entablature y11 z40..42 and cornice y16 left to P4; south bay windows at x35,39,43,71,75,79 (ashlarBay at z41, recess z40 air); gaps x47..52/62..67 z33..36 at y12+ beside drum left open; north porch beam y4 x53..60 z0..2; courts paved smooth_stone.
