# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
Checklist: [ ] P1 [ ] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6.
Notes: exact block ids as above; 1.21.1 only; all roofs overhang 0 grow false; build NMNH dome after drum; call vocab helpers, don't hand-place; run `$MCD check` after each part; every opening stays air until P5; no signs.
```

### elements.md

```markdown
# REQUIRED ELEMENTS (checklist; coordinates from plan.md; part numbers = PARTS in plan.md)

## NMNH (plot 0)
- [ ] Granite block, pale grey-white, 3 storeys: plinth `polished_diorite` y1, rusticated `stone_bricks` y2..3, string `smooth_quartz` y4 (+1 proud), `calcite` body y5..10. P1 shell, P4 facade. Vocab: `ashlarBay`.
- [ ] Octagonal rotunda drum x48..66 z18..36 y12..19 (smooth_quartz/calcite, quartz_pillar corner pilasters, cornice ring y19 quartz_stairs upside-down). P1 (drum), P4 (pilasters, ring). `octagonDrum`.
- [ ] GREEN COPPER DOME, centre (57,20,27) r8 rise 7: `oxidized_copper` shell, 8 `oxidized_cut_copper` ribs, 2 `smooth_quartz` stepped rings at foot, lantern x56..58 z26..28 y27 (glass 4 corners/sides, `lantern` inside, `oxidized_cut_copper_slab` cap y28, `lightning_rod` y29). P3 dome. `domeRibbed`, `lanternCap`.
- [ ] Grand Corinthian portico: 6 columns x49,52,55,59,62,65 z42 y5..10: `quartz_slab` base y5, `quartz_pillar` shaft y6..9, `chiseled_quartz_block` capital y10; entablature y11 smooth_quartz z40..42 + upside-down quartz_stairs cornice. P4 (`corinthianColumn`).
- [ ] Triangular pediment z42 rows y17..22 (smooth_quartz tympanum, quartz_stairs raking cornice both rakes) over cornice y16; thermal half-round window z40 y12..15. P3 roof (`pediment`, `thermalWindow`).
- [ ] Wide steps x50..64 z43..45 (half-step ramp: z43 bottom slab y4, z44 full block y3, z45 bottom slab y3), platform x47..67 z40..42 top y4. P1 platform, P6 steps. `grandSteps`.
- [ ] Wings: hipped red-tile roofs (brick_stairs/granite_stairs, polished_granite_slab ridge), eaves y12 ridge y15 (end pavilions y14/y17), hipped over south/north/central ranges, `mcd roof` hip half pitch. P3 (`redTileHip`).
- [ ] Cornice y11 + balustrade y12 (`diorite_wall` on `smooth_quartz_slab`, quartz dies at pilasters, lantern each die). P4 (`balustrade`).
- [ ] Tall windows between pilasters (z41 y5..9 recessed, sills quartz_slab, lintels), ground windows y2..3. P5 (`tallWindow`).
- [ ] Projecting end pavilions x22..31 / 83..92 with 4 engaged columns each, attic y12..13. P1, P4.
- [ ] Open light courts x32..47, x67..82 z12..32 paved y1 (`smooth_stone`). P1 floors, P6 lamps.
- [ ] 1960s flat wings x0..21 / x93..114 with window slots + coping; north porch with piers; planting beds. P1, P6.
- [ ] Dusk floodlight: two `ochre_froglight` per column base z41 y4, lanterns on dies, steps cheeks, courts. P5/P6 (`floodBase`, `lampPost`).

## NMAH (plot 1)
- [ ] Pink-beige box 6:1, `white_terracotta` panels 3 wide with 1-wide recessed slots y1..7 (gray glass pane, lit every other). P2 (`panelSlotWall`).
- [ ] Deep cornice band y8..9 +1 proud, `smooth_quartz_slab` top underside row. P2 (`corniceBand`).
- [ ] Flat roof y9, stepped-back clerestory penthouse x140..164 z8..20 y10..12 (piers every 3, light_gray glass ribbon). P2 (`penthouse`).
- [ ] Recessed glass south entrance z24 x142..162 y0..5 under 3-deep overhang, doors x150..154, froglight soffit. P2 (`glassFront`).
- [ ] Glass atrium skylight x146..158 z11..17 y12 + froglights glowing below. P2.
- [ ] Terrace steps z28 bottom slabs, west terrace/doors, north loading strip. P2/P6.

## NMAAHC (plot 2)
- [ ] Corona: three tiers each wider than the last (inset 4/3/2 band, lattice, lip), each 1 thick, `waxed_copper_grate` skin, `waxed_cut_copper` lips and corner columns. P3 (`coronaTier`).
- [ ] Brown glass behind lattice with `ochre_froglight` every 3rd cell rows y10,14,18: amber glow. P3.
- [ ] Recessed black glass base inset5 y4..7 with copper mullions; plinth y0..3. P1, P3 (`glassBase`).
- [ ] Porch canopy x192..210 z22..31 y8, 4 `polished_deepslate_wall` posts, two reflecting pools (water y3, smooth_stone coping), entry walk x199..203, doors z21 x199..203. P4 (`porchCanopy`, `reflectingPool`).
- [ ] Landscaped grounds: paving, hedges, trees west/north, lamps every 8. P5/P6 (`oakTree`, `lampPost`).

## Light (all): no dark cells outside; froglights hidden behind glass and in soffits; lanterns on posts. P6.
```

### rooms.json

```json
{"entrance":[57,5,41],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "nmnh-wall": ["calcite"],
    "nmnh-rustic": ["stone_bricks", "stone_brick_slab"],
    "nmnh-plinth": ["polished_diorite"],
    "nmnh-trim": ["smooth_quartz", "smooth_quartz_slab", "quartz_slab", "quartz_stairs"],
    "nmnh-column": ["quartz_pillar", "chiseled_quartz_block"],
    "nmnh-balustrade": ["diorite_wall"],
    "nmnh-roof": ["brick_stairs", "granite_stairs", "polished_granite_slab"],
    "nmnh-dome": ["oxidized_copper", "oxidized_cut_copper", "oxidized_cut_copper_slab", "oxidized_cut_copper_stairs"],
    "nmnh-glass": ["glass_pane", "gray_stained_glass_pane", "glass"],
    "nmnh-door": ["iron_door"],
    "nmah-body": ["white_terracotta"],
    "nmah-deck": ["smooth_stone", "smooth_stone_slab"],
    "nmah-glass": ["gray_stained_glass_pane", "glass_pane", "glass", "light_gray_stained_glass"],
    "nmaahc-lattice": ["waxed_copper_grate"],
    "nmaahc-bronze": ["waxed_cut_copper", "waxed_cut_copper_slab", "waxed_cut_copper_stairs", "waxed_copper_trapdoor"],
    "nmaahc-glass": ["brown_stained_glass", "black_stained_glass"],
    "nmaahc-base": ["polished_deepslate_wall"],
    "walk": ["light_gray_concrete", "smooth_stone"],
    "lawn": ["grass_block", "gravel"]
  },
  "objects": ["lantern", "lightning_rod", "oak_fence", "ochre_froglight", "water", "azalea_leaves", "oak_log", "oak_leaves"]
}
```

### make.sh

```sh
#!/usr/bin/env bash
# Makes build.nbt from scratch: build.mjs writes a temp file, which replaces build.nbt only once the build has succeeded.
set -euo pipefail
cd "$(dirname "$0")"
tmp="$(mktemp ./build-XXXXXX)"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv -f "$tmp" build.nbt
```

### build.mjs

```js
// The three museums on the north Mall (plan.md): the site grid, the ground, then every part in order.
//   node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, NMNH_PLOT, NMAH_PLOT, NMAAHC_PLOT, GRASS_BLOCK, SMOOTH_STONE } from "./vocab/base.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

// The parts in build order (plan.md PARTS). A part whose file isn't written yet is skipped, not an error: the parts are
// built at the same time in separate copies, where the others are still stubs.
const PARTS = [
  ["NMNH shell", "parts/nmnh-shell.mjs"],
  ["NMAH shell and facade", "parts/nmah.mjs"],
  ["Roofs, dome and Corona", "parts/roofs-corona.mjs"],
  ["NMNH facade order", "parts/nmnh-facade.mjs"],
  ["Glazing, doors, lighting", "parts/glaze-light.mjs"],
  ["Grounds and steps", "parts/grounds.mjs"],
];

// Ground value g of a cell (plan.md SITE): the first building course sits at y = g, so the grass top is at g - 1.
// Plot 0 is 1, and 2 under the centre; plot 1 is 0 (nothing laid under it); plot 2 is a mound, 0 at the north edge
// rising to 3 at the south edge.
function groundValue(plot, x, z) {
  if (plot === NMNH_PLOT) return x >= 47 && x <= 67 && z >= 12 && z <= 42 ? 2 : 1;
  if (plot === NMAH_PLOT) return 0;
  return Math.min(3, Math.round((3 * z) / 26));
}

// Lay the ground before the parts: grass on top at the grade, stone under it down to y 0 (the footings start there).
// Only inside the three plots: the gaps between them stay air.
function layGround(g) {
  for (const plot of [NMNH_PLOT, NMAH_PLOT, NMAAHC_PLOT]) {
    for (let x = plot.x0; x <= plot.x1; x++) {
      for (let z = plot.z0; z <= plot.z1; z++) {
        const top = groundValue(plot, x, z) - 1;
        for (let y = 0; y < top; y++) g.set(x, y, z, SMOOTH_STONE);
        if (top >= 0) g.set(x, top, z, GRASS_BLOCK);
      }
    }
  }
}

const list = [];
for (const [name, module] of PARTS) {
  const file = join(here, module);
  const part = existsSync(file) ? await import(pathToFileURL(file).href) : null;
  if (typeof part?.build === "function") list.push([name, part.build]);
  else {
    console.log(`part ${name}: ${module} not written yet, skipped`);
    list.push([name, () => {}]);
  }
}

function buildWith(roof) {
  const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
  layGround(g);
  runParts(g, list, { palette: join(here, "palette.json"), roof });
  return g;
}

// The roof finds the eave from the walls the shell has built. While the shell is still a stub there are none: build
// without the roof then (it is laid once the shell has walls); any other failure is a real one and stops the build.
let g;
try {
  g = buildWith(join(here, "roof.json"));
} catch (e) {
  if (!/detectEave: no walls found/.test(e.message)) throw e;
  console.log("roof: the shell has no walls yet, so the roof is not laid this time");
  g = buildWith(undefined);
}
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the three museums: palette.json's blocks by name, plan.md's site coordinates, a seeded rng.

// ---- palette (palette.json ids only) ------------------------------------------------------------------------------

// ---- palette (palette.json ids only) ------------------------------------------------------------------------------
export const CALCITE = "minecraft:calcite";                                 // NMNH wall body (pale granite)

export const STONE_BRICKS = "minecraft:stone_bricks";                       // NMNH rusticated ground storey

export const STONE_BRICK_SLAB = "minecraft:stone_brick_slab";               // NMNH rustic slab course

export const POLISHED_DIORITE = "minecraft:polished_diorite";               // NMNH plinth course

export const SMOOTH_QUARTZ = "minecraft:smooth_quartz";                     // NMNH and NMAH trim, string courses, attics

export const SMOOTH_QUARTZ_SLAB = "minecraft:smooth_quartz_slab";           // NMNH coping and sills; NMAH band underside

export const QUARTZ_SLAB = "minecraft:quartz_slab";                         // NMNH column bases

export const QUARTZ_STAIRS = "minecraft:quartz_stairs";                     // NMNH cornices, lintels, voussoirs

export const QUARTZ_PILLAR = "minecraft:quartz_pillar";                     // NMNH columns and pilasters (axis y)

export const CHISELED_QUARTZ_BLOCK = "minecraft:chiseled_quartz_block";     // NMNH column capitals

export const DIORITE_WALL = "minecraft:diorite_wall";                       // NMNH balustrade

export const BRICK_STAIRS = "minecraft:brick_stairs";                       // NMNH red-tile roof (hip courses)

export const GRANITE_STAIRS = "minecraft:granite_stairs";                   // NMNH red-tile roof (hip courses)

export const POLISHED_GRANITE_SLAB = "minecraft:polished_granite_slab";     // NMNH red-tile roof (ridge slabs)

export const OXIDIZED_COPPER = "minecraft:oxidized_copper";                 // NMNH dome body

export const OXIDIZED_CUT_COPPER = "minecraft:oxidized_cut_copper";         // NMNH dome ribs

export const OXIDIZED_CUT_COPPER_SLAB = "minecraft:oxidized_cut_copper_slab"; // NMNH lantern cap

export const OXIDIZED_CUT_COPPER_STAIRS = "minecraft:oxidized_cut_copper_stairs"; // NMNH dome foot courses

export const GLASS_PANE = "minecraft:glass_pane";                           // NMNH portico door, thermal window, drum; NMAH entrance

export const GRAY_STAINED_GLASS_PANE = "minecraft:gray_stained_glass_pane"; // NMNH wings; NMAH window slots

export const GLASS = "minecraft:glass";                                     // NMNH lantern sides; NMAH skylight

export const IRON_DOOR = "minecraft:iron_door";                             // NMNH doors

export const WHITE_TERRACOTTA = "minecraft:white_terracotta";               // NMAH wall panels, cornice band, mullions

export const SMOOTH_STONE = "minecraft:smooth_stone";                       // NMAH plinth and roof deck; paving; NMAAHC deck

export const SMOOTH_STONE_SLAB = "minecraft:smooth_stone_slab";             // NMAH deck top; NMAAHC porch canopy top

export const LIGHT_GRAY_STAINED_GLASS = "minecraft:light_gray_stained_glass"; // NMAH penthouse clerestory

export const WAXED_COPPER_GRATE = "minecraft:waxed_copper_grate";           // NMAAHC corona lattice (see-through skin)

export const WAXED_CUT_COPPER = "minecraft:waxed_cut_copper";               // NMAAHC solid bronze edges and corner columns

export const WAXED_CUT_COPPER_SLAB = "minecraft:waxed_cut_copper_slab";     // NMAAHC canopy edge

export const WAXED_CUT_COPPER_STAIRS = "minecraft:waxed_cut_copper_stairs"; // NMAAHC bronze steps

export const WAXED_COPPER_TRAPDOOR = "minecraft:waxed_copper_trapdoor";     // NMAAHC bronze hatches

export const BROWN_STAINED_GLASS = "minecraft:brown_stained_glass";         // NMAAHC glass one cell inside the lattice

export const BLACK_STAINED_GLASS = "minecraft:black_stained_glass";         // NMAAHC base glass curtain and shadow bands

export const POLISHED_DEEPSLATE_WALL = "minecraft:polished_deepslate_wall"; // NMAAHC porch posts

export const WATER = "minecraft:water";                                     // NMAAHC reflecting pools

export const OCHRE_FROGLIGHT = "minecraft:ochre_froglight";                 // warm hidden light (NMNH, NMAH, NMAAHC)

export const LANTERN = "minecraft:lantern";                                 // hanging or standing lights

export const LIGHTNING_ROD = "minecraft:lightning_rod";                     // NMNH lantern top

export const OAK_FENCE = "minecraft:oak_fence";                             // lamp posts

export const LIGHT_GRAY_CONCRETE = "minecraft:light_gray_concrete";         // walks

export const GRAVEL = "minecraft:gravel";                                   // NMNH Mall-side walk, if any

export const GRASS_BLOCK = "minecraft:grass_block";                         // lawn; ground top

export const AZALEA_LEAVES = "minecraft:azalea_leaves";                     // planting beds (persistent)

export const OAK_LOG = "minecraft:oak_log";                                 // tree trunks (axis y)

export const OAK_LEAVES = "minecraft:oak_leaves";                           // tree crowns (persistent)

// ---- site (plan.md SITE, OPENINGS and ROOFS; every coordinate is in the kit's one frame) ----------------------------
export const SITE_SIZE = [216, 46, 46];                                     // the grid: x 0..215, y 0..45, z 0..45

export const NMNH_PLOT = { x0: 0, x1: 114, z0: 0, z1: 45, cap: 37 };        // Plot 0, Natural History: x and z extent, top cap y

export const NMAH_PLOT = { x0: 119, x1: 183, z0: 0, z1: 28, cap: 20 };      // Plot 1, American History: x and z extent, top cap y

export const NMAAHC_PLOT = { x0: 188, x1: 215, z0: 0, z1: 33, cap: 45 };    // Plot 2, African American History and Culture

export const NMNH_AXIS_X = 57;                                              // NMNH symmetry axis (north-south)

export const NMNH_FRONT_Z = 41;                                             // NMNH south range wall face (the Mall front)

export const NMNH_PORTICO_Z = 42;                                           // NMNH portico column line and pediment face

export const NMNH_DRUM = { x0: 48, x1: 66, y0: 12, y1: 19, z0: 18, z1: 36 }; // NMNH rotunda drum (octagon), y 12..19

export const NMNH_DOME_CENTRE = [57, 20, 27];                               // NMNH dome centre (x, y, z); base radius 8, top y 26

export const NMNH_LANTERN = { x0: 56, x1: 58, y0: 27, y1: 28, z0: 26, z1: 28 }; // NMNH 3x3 glazed lantern, slab cap y 28

export const NMNH_STEPS = { x0: 50, x1: 64, y0: 1, y1: 4, z0: 43, z1: 45 }; // NMNH grand steps down to the Mall

export const NMAH_AXIS_X = 152;                                             // NMAH symmetry axis (north-south)

export const NMAH_FRONT_Z = 24;                                             // NMAH south glass front (recessed under the overhang)

export const NMAH_ATRIUM = { x0: 146, x1: 158, y0: 1, y1: 12, z0: 11, z1: 17 }; // NMAH atrium, open from y 1 to the skylight at y 12

export const NMAAHC_CENTRE = [201, 13];                                     // NMAAHC corona centre (x, z); symmetric about x 201, z 13

export const NMAAHC_CORONA = { x0: 188, x1: 214, z0: 0, z1: 26, top: 19 };  // NMAAHC top tier square; roof deck top y 19, coping y 20

export const NMAAHC_FLOOR_Y = 4;                                            // NMAAHC lobby floor (the glass base is y 4..7)

// ---- randomness ----------------------------------------------------------------------------------------------------
/** Seeded PRNG (mulberry32): rng(seed) returns a function giving floats in [0, 1); the same seed, the same sequence. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Part-1 vocabulary from plan.md (VOCABULARY), for the three north-side museums: ashlarBay, balustrade, lanternCap,
// redTileHip, panelSlotWall, glassFront, porchCanopy, lampPost. Each takes its position (and face) as arguments and
// returns { cells, refused, bounds }: cells = every [x, y, z] it placed, refused = every write it held back.
// Writes stay inside the helper's bounds and go only into air; opts.over: true replaces what is there.
// Faces: the side the facade faces (south = +z, the Mall). "out" counts cells outward from the wall line (negative = in).

/**
 * One 4-cell bay of a facade, at the wall line through (x, z) facing `face`. Diorite plinth y1, stone bricks y2..3,
 * a smooth quartz string course y4 (proud by 1), calcite y5..10. The tall window slot is the bay's middle cell:
 * air from y2 to y9 (the ground and main openings), so the bay's window is left for glazing.
 */
export function ashlarBay(g, x, z, face, opts = {})

/**
 * A balustrade along x0..x1 at z: smooth quartz slab rail at y, diorite wall above it at y+1. A die (solid smooth
 * quartz, 2 high at y+1..y+2) stands every 4 cells from x0 (the pilaster bay lines), topped by a standing lantern at y+3.
 */
export function balustrade(g, x0, x1, z, y, opts = {})

/**
 * A 3x3 lantern drum with its cap, on the drum course at y: glass on the ring, a lantern hanging in the middle from the
 * cap, a cut-copper slab cap at y+1, and a lightning rod on the cap at y+2. The footprint is x0..x0+2, z0..z0+2.
 */
export function lanternCap(g, x0, z0, y, opts = {})

/**
 * A hipped red-tile roof over the wall rectangle rect = [x0, z0, x1, z1]: eaves at course `eaves`, no overhang, slab
 * ridge, no grow, built by build.mjs roof(). `ridge` is the ridge height the plan expects; a different top is reported
 * in notes. opts.keep: boxes the roof must not touch (drum, pavilions). The bounds allow the hip to rise to half the
 * short side (at most one block a cell).
 */
export function redTileHip(g, rect, eaves, ridge, opts = {})

/**
 * A run of `length` cells of facade from (x, z) on `face`. Panels are white terracotta 3 wide with 1-wide window slots
 * between them: slots sit every 4 cells from the centre, and the first and last 3 cells are always panels (corners).
 * Each slot is air at the face, with a gray glass pane 1 cell inside it; every other slot has an ochre froglight 2 cells
 * inside, at mid-height. Rows y0..y1 (default 1..7).
 */
export function panelSlotWall(g, x, z, face, length, opts = {})

/**
 * The recessed glass entrance of a facade on the glass plane z (for `face`, default south), from x0 to x1: glass panes
 * y1..5 with white terracotta mullions every 4 cells (from x0, the ends too). Doors (opts.door, default x150..154) are
 * left as the air opening for the glazing part, at y1..2. A smooth quartz soffit at y6 runs 2 out, with an ochre
 * froglight every 4 cells on its outer row; white terracotta side returns sit at x0-1 and x1+1.
 */
export function glassFront(g, x0, x1, z, opts = {})

/**
 * A flat canopy slab over x0..x1, z0..z1 at course y: smooth stone slab (top) deck, waxed cut copper on the edge rows
 * (x0, x1 and z1). Four slender polished deepslate wall posts stand under the front edge (z1) at x0, x0+4, x1-4, x1,
 * y-4..y-1. The canopy runs out from the building (z0) to the front (z1).
 */
export function porchCanopy(g, x0, z0, x1, z1, y, opts = {})

/** A lamp post at (x, y, z): two oak fence posts and a standing lantern on top (it stands on the fence, y+2). */
export function lampPost(g, x, y, z, opts = {})
```

### vocab/h2.mjs

```js
// Helpers for the north-Mall museums (plan.md VOCABULARY): pilaster, octagonDrum, pediment, grandSteps, corniceBand,
// coronaTier, reflectingPool, oakTree. Each takes its position (and facing where it has one) as arguments and returns
// a tally { placed, held }. Writes go only into air: a cell that already holds a block is left alone and counted in
// held, so no helper digs into ground, sand or a floor an earlier part owns. Pass { over: true } to write over a cell.

/** (x, z) is the wall-face cell; the column stands one cell out toward `facing`. Base slab y0, quartz shaft y0+1..y1-1, chiseled capital y1. */
export function pilaster(g, x, y0, y1, z, facing = "south", opts = {})

/**
 * [cx, y, cz] is the centre of the bottom course; r = 9 gives the plan's 19-wide octagon (9-long flats, 5-cell cuts).
 * Walls rise `height` courses (8: y12..19). Base course smooth_quartz, body calcite, quartz_pillar at the eight corners,
 * a 1x5 window slot on each face left as air for the glazing part (the four flats centred; each diagonal at (r-2, r-3)),
 * and an upside-down quartz_stairs cornice ring one cell proud on the top course. Hollow inside.
 */
export function octagonDrum(g, [cx, y, cz], r = 9, opts = {})

/**
 * [bx, y, bz] is the bottom-centre cell of the first row, on the front plane; `facing` is the way the front looks.
 * Rows step in 2 cells a course from halfWidth (10: y17 x47..67) to the apex. Tympanum smooth_quartz; the two rakes are
 * quartz_stairs facing into the tympanum, running `proud` (1) cells out in front of the plane.
 */
export function pediment(g, [bx, y, bz], facing = "south", opts = {})

/**
 * Half steps down from a platform toward the Mall (plan OPENINGS; never stairs). Across x0..x1, from row z0 going
 * `facing` ('south' = +z, 'north' = -z): a bottom slab at course y, a full block at y-1, a bottom slab at y-1.
 */
export function grandSteps(g, x0, x1, z0, y, opts = {})

/**
 * wall = { x0, x1, z0, z1 } is the wall face's rectangle. The band is the ring one cell out round it: at course y a
 * smooth_quartz_slab (top half, the lined underside) and at y+1 white_terracotta. The inside of the wall line stays free.
 */
export function corniceBand(g, { x0, x1, z0, z1 }, y, opts = {})

/**
 * One tier at `inset` (its lattice on the square of half-size 13 - inset); [cx, cz] is the corona's centre. Lattice:
 * waxed_copper_grate sides with waxed_cut_copper corners, for `rows` courses from y. One cell inside it a brown_stained_glass
 * ring, with an ochre_froglight every 3rd cell on its top row (the amber glow). The flare lip, one cell out at inset-1,
 * is a solid waxed_cut_copper ring on the course above the lattice.
 */
export function coronaTier(g, [cx, cz], inset, y, opts = {})

/**
 * Water fills x0..x1, z0..z1 at course waterY, over a basin one course lower (smooth_stone unless opts.basin), with a
 * smooth_stone coping ring one cell out round it on waterY.
 */
export function reflectingPool(g, x0, x1, z0, z1, waterY, opts = {})

/**
 * (x, y, z) is the first trunk cell above the ground: oak_log, axis y, `height` (4 or 5) cells. Crown: two 5x5 courses
 * with the corners cut, a 3x3 course at the trunk top, and a plus-shaped cap one course above it. Every leaf persistent=true.
 */
export function oakTree(g, x, y, z, opts = {})
```

### vocab/h3.mjs

```js
// Helpers for the seven names in plan.md VOCABULARY: corinthianColumn, domeRibbed, thermalWindow, tallWindow, penthouse,
// glassBase, floodBase. Each takes its position as arguments (no spot is hard-wired), writes only inside the footprint
// it returns, and writes only into air unless it is given over: true. Nothing here writes ground, floors or anything
// below its own footprint. Boxes are inclusive, as in plan.md. There are no leaves, and no furniture: plan.md's ROOMS
// are exterior only, so no 2-high clear lane applies.

/** A Corinthian-style column standing on y (its base slab): quartz_slab base, quartz_pillar shaft, chiseled capital.
 *  Six cells high: base y, shaft y+1..y+4, capital y+5. plan.md: base y 5 at each portico column. */
export function corinthianColumn(g, x, y, z, o = {})

/** The green copper dome: a hollow oxidized_copper shell on the bottom-centre [cx, cy, cz], base radius `radius`, rising
 *  `rise` cells. Eight oxidized_cut_copper ribs on the axes and diagonals (the outermost dome cell on each ray, every
 *  layer), and two stepped rings at the foot: smooth_quartz at radius + 1 on row cy, quartz_slab at radius + 0.5 on row
 *  cy + 1. plan.md: centre (57, 20, 27), radius 8, rise 7 (top y 26). */
export function domeRibbed(g, [cx, cy, cz], { radius = 8, rise = 7 } = {})

/** The half-round thermal window in a wall plane through [x, y, z] whose front faces `face` (plan.md: the attic at z 40,
 *  facing south). Glass_pane rows y..y+3, 9 wide on the sill row, 7, 5, 3 above; a quartz_stairs voussoir at each end of
 *  each row, facing into the wall with the lip out. plan.md: x = 57 (centre), y = 12, z = 40. */
export function thermalWindow(g, x, y, z, face = "south", o = {})

/** A tall window: glass_pane `recess` cells behind the wall face, rows y..y+height-1 (default 5 for plan.md's 1 x 5
 *  openings, y 5..9). On the wall face itself: a quartz_slab sill at the bottom row and an upside-down quartz_stairs lintel
 *  at the top row, so the reveal between them stays open. Needs the recess and the reveal cells to be air (the shell
 *  leaves them). plan.md: x = bay centre, y = 5, z = 41 for the south range, face "south". */
export function tallWindow(g, x, y, z, face = "south", { height = 5, recess = 1, over = false } = {})

/** The clerestory penthouse on a flat roof: walls of `height` rows from y (default 10, 2 high) on the box x0..x1, z0..z1.
 *  Piers of white_terracotta every 3 cells and at each corner, light_gray_stained_glass ribbon between. Roof on row
 *  y + height: white_terracotta in a ring 2 wide at the edge, smooth_stone inside it, and glass where `skylight` (an
 *  inclusive [x0, x1, z0, z1]) sits. The inside stays air, so the atrium below can light up. plan.md: x 140..164,
 *  z 8..20, y 10, skylight 146..158 x 11..17. */
export function penthouse(g, { x0, x1, z0, z1, y = 10, height = 2, skylight = null, over = false })

/** The base of the Corona (plan.md: the glass base, inset 5, y 4..7): a ring of black_stained_glass with waxed_cut_copper
 *  mullions every 4 cells and at each corner, on the box x0..x1, z0..z1, rows y0..y1. Ochre_froglight ceiling pads on the
 *  inset-1 interior, every 4 cells, on row y1. `leave` is a list of inclusive boxes [x0, y0, z0, x1, y1, z1] that stay
 *  air (the main doors). plan.md: x 193..209, z 5..21, y 4..7, doors at z 21 x 199..203 y 4..5. */
export function glassBase(g, { x0, x1, z0, z1, y0, y1, leave = [], over = false })

/** Two ochre_froglight floods either side of a column base, on row y, at x - 1 and x + 1 (plan.md: at z 41, y 4, beside
 *  each portico column). They sit in the platform's top row, so the platform needs over: true; without it they are refused. */
export function floodBase(g, x, y, z, o = {})
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
