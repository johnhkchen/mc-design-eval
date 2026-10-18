# San Francisco City Hall: four-module kit (architect's form)

Scale 1.4 blocks/m. Minecraft 1.21.1 blocks only (all ids below checked with `mcd blocks --check --version 1.21.1`).
Every module: ground y 0 = `smooth_stone` over its whole plot; the building starts at y 1. FRONT = north (z low).
Nothing leaves its plot: cornices project at most to the plot's front edge (z 0, or x 175 on the corner pavilion's east).

## SITE

### The one section every front shares (the "wing section")
Two planes, so the portico and corner pavilion project 1 block ahead of the wings.

| element | wing plane (wings; the portico's and pavilion's end strips) | forward plane (portico x 67..124, pavilion x 147..175) |
|---|---|---|
| plinth course, y 1 | z 1 (1 proud of base) | z 0 |
| rusticated base storey, y 1..9 | face z 2, solid z 2..4 | face z 1, solid z 1..3 |
| terrace (top of base), y 9 | z 2..5 | z 1..4 |
| giant columns (2 x 2), y 10..33 | z 2..3 | z 1..2 |
| loggia (air between column and wall), y 10..33 | z 4..5 | z 3..4 |
| recessed wall, y 10..33 (2 thick) | z 6..7 (glass at z 7) | z 5..6 (glass at z 6) |
| entablature, y 34..36 (solid, front face) | z 2..7 | z 1..6 |
| cornice (upside-down stairs), y 36 | z 1 | z 0 |
| attic wall, y 37..39 (2 thick) | z 3..4 | z 2..3 |
| balustrade, y 40..41 | on z 3 | on z 2 |
| flat roof deck (top course) | y 39, from attic back to the rear wall | same |

Column x-rhythm everywhere: 2-wide shafts on an 8-block spacing, 6-wide intercolumns, a 2-wide window centred in each.

### Plot 0: the dome and its pavilion (x 0..63, z 0..63, to y 125)
Dome axis at x 31.5, z 31.5 (even widths: half centre, half radii).

| mass | x | y | z |
|---|---|---|---|
| ground | 0..63 | 0 | 0..63 |
| plinth course (all four sides) | ring at x 1 / x 62, z 1 / z 62 | 1 | ring |
| square pavilion (outer face of base) | 2..61 | 1..36 | 2..61 |
| corner piers (rusticated to the entablature, 3x3) | 2..4 and 59..61 | 1..33 | 2..4 and 59..61 |
| giant columns, each face, 6 per face | north/south faces: x 11-12, 19-20, 27-28, 35-36, 43-44, 51-52 at z 2..3 (north) and z 60..61 (south); east/west faces: same numbers as z at x 60..61 (east) and x 2..3 (west) | 10..33 | |
| recessed walls | z 6..7 / z 56..57 / x 6..7 / x 56..57 | 10..33 | |
| entablature ring | outer 2..61, 6 deep | 34..36 | |
| cornice | stairs on the x 1 / x 62 / z 1 / z 62 lines | 36 | |
| roof deck (flat) | 2..61 | 36 (top course of entablature) | 2..61 |
| roofline balustrade | on the x 2 / x 61 / z 2 / z 61 lines | 37..38 | |
| drum stylobate (solid ring, 3 thick) | round r 22.5 (x 9..54), inner r 19.5 | 37..40 | (z 9..54) |
| drum wall (round, 2 thick) | r 20.5 (x 11..52), inner face r 18.5 | 41..70 | (z 11..52) |
| drum paired columns (16, 2x2, engaged) | see table below | 41..61 | |
| drum entablature ring | r 22.5 outer, to r 18.5 | 62..64 | |
| drum attic, step 1 (small windows) | r 21.5 | 65..67 | |
| drum attic, step 2 (top course) | r 20.5 | 68..70 | |
| gilded band at the dome's base | r 20.5 ring, 1 course | 71 | |
| dome (hollow, outer shell 1 + inner shell 1) | r 20.5 (42 across, x 11..52) | 71..100 (height 30) | |
| lantern platform | r 5.5 disc (x 26..37) | 101 | |
| lantern colonnade (8 columns, open bays) | ring r 5.5 | 102..108 | |
| lantern entablature + gilded band | r 5.5 / r 6.5 cornice | 109..111 | |
| gilded cupola | r 3.5 dome (x 28..35) | 112..118 | |
| finial | 2x2 at x 31..32, z 31..32 | 119..125 | |

Drum column cells (2x2 each, pairs either side of every 45°; angle from north, clockwise):

| pair | column A | column B |
|---|---|---|
| NNE 22.5° | x 37..38 z 10..11 | x 40..41 z 11..12 |
| ENE 67.5° | x 50..51 z 21..22 | x 51..52 z 24..25 |
| ESE 112.5° | x 51..52 z 37..38 | x 50..51 z 40..41 |
| SSE 157.5° | x 40..41 z 50..51 | x 37..38 z 51..52 |
| SSW 202.5° | x 24..25 z 51..52 | x 21..22 z 50..51 |
| WSW 247.5° | x 11..12 z 40..41 | x 10..11 z 37..38 |
| WNW 292.5° | x 10..11 z 24..25 | x 11..12 z 21..22 |
| NNW 337.5° | x 21..22 z 11..12 | x 24..25 z 10..11 |

Interior: one rotunda. The deck (y 34..36) is open over a disc r 18.5 under the drum, so the floor at y 1 looks
straight up through the drum into the dome's inner shell.

### Plot 1: the east portico (x 64..127, z 0..23, to y 52). Local X = x - 64 (mirror: X <-> 63 - X)

| mass | x | y | z |
|---|---|---|---|
| end strips at the wing plane (join the wings) | 64..66 and 125..127 | 1..41 | 2..23 |
| projecting portico block (forward plane) | 67..124 | 1..41 | 1..23 |
| paired flanking columns (2x2) | 67-68, 70-71 and 120-121, 123-124 | 10..33 | 1..2 |
| six giant columns (2x2) | 75-76, 83-84, 91-92, 99-100, 107-108, 115-116 | 10..33 | 1..2 |
| entablature + cornice | 64..127 (planes per section) | 34..36 | |
| pediment (tympanum + raking cornice) | base 73..118 | 37..48 (apex at x 95..96) | 0..11 |
| pediment roof (low gable, ridge along z at x 95..96) | 73..118 | 37..48 | 1..11 |
| central attic block behind the pediment | 73..118 | 37..43, balustrade 44..45 | 12..23 |
| flank attics (as the wings) | 64..72, 119..127 | 37..41 | planes per section |
| entrance ramps (3) | 86..89, 94..97, 102..105 | 1 | 0..2 |
| arched doorways (3) | same x | 1..8 | 1..3 |
| rear wall | 64..127 | 1..41 | 23 |

Pediment rake: 1 up per 2 across. Cells pair (x 73-74) at y 37, (75-76) y 38, ... (93-94) y 47, apex (95-96) y 48,
then down again to (117-118) y 37. Raking cornice and horizontal cornice at z 0; tympanum face at z 2 (recessed 2);
relief figures at z 1 standing on the tympanum. An acroterion (1 chiseled block) on the apex at y 49 and at both
lower ends (x 73, x 118, y 38).

### Plot 2: the wing bay (x 128..143, z 0..23, to y 41). Local X = x - 128; it tiles end to end along x.

| mass | x | y | z |
|---|---|---|---|
| wing section, wing plane | 128..143 | 1..41 | 1..23 |
| giant columns (2x2) | 131-132, 139-140 | 10..33 | 2..3 |
| rear wall | 128..143 | 1..39 | 23 |
| x ends | plain end walls inside, x 128 and x 143, z 8..22 only (hidden party walls); the front zone z 1..7 runs straight through so the joint reads seamless | 1..39 | 8..22 |

The ends of the bay are the middle of an intercolumn (3 cells to the nearest column on each side), so two bays side by
side give the same 6-wide intercolumn and a whole 2-wide window across the joint.

### Plot 3: the corner pavilion (x 144..175, z 0..31, to y 44)

| mass | x | y | z |
|---|---|---|---|
| west strip at the wing plane (joins the last wing bay) | 144..146 | 1..41 | 2..23 |
| projecting pavilion block (forward plane on the north, east face at x 174) | 147..174 | 1..44 | 1..30 |
| NE corner anta pier (3x3, to the entablature) | 172..174 | 1..33 | 1..3 |
| NW anta pier | 147..149 | 1..33 | 1..3 |
| SE anta pier | 172..174 | 1..33 | 28..30 |
| north face: pair of columns in antis | 156-157, 164-165 | 10..33 | 1..2 |
| north recessed wall | 150..171 | 10..33 | 5..6 |
| east face: pair of columns in antis | x 173..174 | 10..33 | 10-11, 20-21 |
| east recessed wall | x 169..170 | 10..33 | 4..27 |
| entablature | north z 1..6, east x 169..174 | 34..36 | |
| cornice | north at z 0 (x 147..175), east at x 175 (z 0..30) | 36 | |
| tall attic | north face z 2..3, east face x 172..173 | 37..42 | |
| balustrade | on z 2 / x 173 | 43..44 | |
| plain south wall | 144..174 | 1..42 | 30 (ground at z 31) |
| plain west wall behind the wing | 144 | 1..42 | 24..30 |

## ROOFS

No pitched roof shows except the portico's pediment: a Beaux-Arts palace reads as flat roofs hidden behind
balustrades. Parts build every roof by hand (no `$MCD roof` preset fits a flat deck behind a balustrade plus a dome).

| roof | form | where | material |
|---|---|---|---|
| wing, portico flanks, corner pavilion | flat deck behind the attic and balustrade, invisible from the street | wing y 39; pavilion y 42; plot 0 y 36 | `smooth_stone` |
| portico pediment | low gable, 1:2 (the pediment's own rake), ridge along z at x 95..96, y 48, from z 1 to z 11; its back gable at z 11 is a plain calcite triangle against the attic block | plot 1 | `polished_tuff_stairs` on the slopes, `polished_tuff_slab` ridge |
| central attic behind the pediment | flat | y 43 | `smooth_stone` |
| dome | `dome()` brush (shapes-curved), profile hemisphere, `height: 30`, centre [31.5, 71, 31.5], radius 20.5, `hollow: true`, edge stairs, shell `polished_tuff` with `polished_tuff_stairs`/`_slab`; 16 ribs: every 22.5° from north, the outer shell cells on that meridian swapped to `polished_andesite` (stairs where the shell is stairs), from y 72 to y 100 | plot 0 | lead grey |
| lantern cupola | `dome()` radius 3.5 at [31.5, 112, 31.5], height 7, edge "none" | plot 0 | `gold_block` |

## FACADES

### Wing bay (the unit of every front), bottom to top
| zone | y | what | depth | material |
|---|---|---|---|---|
| plinth | 1 | a darker course | 1 proud of the base | `polished_andesite` |
| rusticated base | 2..9 | granite courses; channel joints at y 4 and y 7 (the face cell left out, the joint 1 deep) except across windows | face at the section's base plane | `polished_diorite`, joints show `diorite` behind |
| base windows | 3..7 | tall windows; slab sill at y 2 one proud; keystone at y 8 | glass 1 in | `gray_stained_glass_pane`, sill `polished_diorite_slab`, keystone `chiseled_quartz_block` |
| base top / terrace edge | 9 | string course | flush | `smooth_quartz` |
| column foot | 10 | 2x2 block | | `polished_diorite` |
| fluted shafts | 11..32 | giant Doric order | 4 proud of the wall | `quartz_pillar` axis y |
| capital (abacus) | 33 | 2x2 | | `smooth_quartz` |
| recessed wall | 10..33 | 2 storeys of tall windows between the columns | 4 behind the column face | `polished_diorite` |
| lower windows | 11..19 | 2 wide, sill slab at y 10 in the loggia, lintel `smooth_quartz` y 20 | glass 1 in | |
| spandrel panel | 20..22 | a sunk panel of `calcite` 2 wide at y 21, framed | flush | `calcite` |
| upper windows | 23..30 | 2 wide, sill y 22, lintel y 31 | glass 1 in | |
| architrave | 34 | | front face | `smooth_quartz` |
| frieze | 35 | Doric triglyphs: `chiseled_quartz_block` at local X 0,3,4,7,8,11,12,15; metopes `calcite` | flush | |
| cornice | 36 | upside-down stairs, 1 proud, the full length | | `smooth_quartz_stairs` (crown course `smooth_quartz`) |
| attic | 37..39 | small square windows 2 wide at y 38 over each main window | 1 behind the frieze | `polished_diorite`, glass `gray_stained_glass_pane` |
| balustrade | 40..41 | pedestals (full block + slab) over every column axis and at local X 7..8; balusters `diorite_wall` at y 40 between; rail `polished_diorite_slab` (bottom) at y 41 | on the attic face | |

### Portico (plot 1)
- Same zones as the wing, on the forward plane, but the base storey carries the three ARCHED DOORWAYS instead of
  windows: openings 4 wide (x 86..89, 94..97, 102..105), round heads of upside-down `smooth_quartz_stairs` at y 7
  (outer cells) and a solid voussoir course y 8 with a `chiseled_quartz_block` keystone pair; a plain `polished_diorite`
  pier between the arches. No base windows elsewhere on the portico: the end bays x 67..85 and 106..124 carry the
  rusticated wall with one base window each centred under the upper windows (x 79..80, x 111..112).
- Upper windows centred in each intercolumn: x 79..80, 87..88, 95..96, 103..104, 111..112. The narrow gaps x 72..74
  and 117..119 (between the flanking pairs and the six) stay plain wall with a `calcite` sunk panel; x 64 and x 127 are
  single glass columns that complete the wing bays' joint windows.
- Over the central three intercolumns (x 85..106) the lower windows become one tall opening each (y 11..30, 2 wide),
  read as the great windows over the doors.
- Entablature as the wing, carried across the whole module; over the six columns (x 75..116) the frieze is a plain
  `smooth_quartz` band (no triglyphs, no lettering): the portico's frieze reads calmer than the wings'.
- PEDIMENT (y 37..48): tympanum `calcite` at z 2; relief at z 1: a central seated figure (`chiseled_quartz_block` /
  `quartz_bricks`, 4 wide x 6 high at x 94..97, y 38..43) and two reclining figure groups each side tapering with the
  rake (`quartz_bricks`, `polished_diorite`), all inside the triangle, never touching the raking cornice. Raking cornice
  `smooth_quartz_stairs` facing outward-up, at z 0, with a `smooth_quartz` course under it at z 1.
- Central attic block behind (z 12..23, y 37..43): attic wall face z 12, small windows, balustrade y 44..45 as the wing's.

### Dome pavilion (plot 0), four identical faces
- Wing section on all four faces (base face 2 in from the plot edge), six columns per face, 3x3 rusticated corner piers.
- Windows: x (or z) 7..8, 15..16, 23..24, 31..32, 39..40, 47..48, 55..56 on each face, in the base and both upper storeys.
- Roofline: entablature y 34..36 then a balustrade y 37..38 (no attic): the drum rises directly behind it.

### Drum (plot 0)
| zone | y | what | material |
|---|---|---|---|
| stylobate | 37..40 | solid ring, top course `smooth_quartz` | `polished_diorite` |
| paired columns | 41..61 | 16 engaged columns (cells above): foot y 41 `polished_diorite`, shaft y 42..60 `quartz_pillar`, capital y 61 `smooth_quartz` | |
| drum wall | 41..61 | 8 tall windows, one on each 45° axis between the pairs (N, NE, E ...): 4 wide on the cardinal axes (N: x 30..33 at z 11..12, likewise rotated to E x 51..52 z 30..33, S, W), 2 wide on the diagonals; y 44..57 with a round head of stairs at y 58, sill slab y 43, a pedimented hood (`smooth_quartz_stairs`) at y 59..60 | `polished_diorite`, glass `gray_stained_glass_pane` |
| entablature | 62..64 | architrave `smooth_quartz`, frieze `calcite`, cornice stairs at r 22.5 | |
| attic step 1 | 65..67 | 8 small windows (2 wide, y 66) on the same axes; a `chiseled_quartz_block` urn/pedestal over each column pair at y 68 | `polished_diorite` |
| attic step 2 | 68..70 | plain course, top `smooth_quartz` | |
| gilded band | 71 | the dome's base ring | `gold_block` |

### Dome and lantern
- Dome shell `polished_tuff` (lead grey, faint green), ribs `polished_andesite` (paler lines), gilded trim: a
  `gold_block` cartouche (1 cell) at the foot of every rib at y 73 and a gold ring at y 100 under the lantern.
- Lantern: platform y 101 `smooth_quartz` disc r 5.5; 8 columns `quartz_pillar` (1x1) on the ring r 5.5 at 45°, y 102..108,
  with `gold_block` capitals at y 108; between them open bays (air, the light shows), a glass ring of
  `gray_stained_glass_pane` 1 in (r 4.5) y 103..107; entablature y 109..110 `smooth_quartz`, gold band y 111;
  gilded cupola y 112..118; finial: 2x2 `gold_block` y 119..124 with a `smooth_quartz` collar at y 121, four
  `lightning_rod` at y 125 (the gilded point).

### Corner pavilion (plot 3)
- North and east: wing zones on the forward plane; 3-wide anta piers rusticated to y 9, faced above with a flat
  pilaster (`smooth_quartz`, 1 proud, 3 wide, y 10..33) on each street face; two columns in antis per face.
- Windows north: x 152..153, 160..161, 168..169. East (glass at x 169, reveal x 170): z 6..7, 15..16, 24..25.
  West strip: glass at x 144 (completes the last wing bay's joint window).
- Taller attic y 37..42: a raised central panel on each face (north x 157..164, east z 12..19, y 38..41,
  `calcite` with a `chiseled_quartz_block` border), small windows either side; balustrade y 43..44.
- South (z 30) and the west return behind the wings (x 144, z 24..30): plain `polished_diorite` ashlar, a plain
  `smooth_quartz` band at y 34..36 continuing the entablature line flush, no columns, no cornice projection.

## MATERIALS

| role | block id |
|---|---|
| ground | `smooth_stone` |
| plinth course | `polished_andesite` |
| granite body, base, recessed walls, attic, drum | `polished_diorite` (rustication joints show `diorite`) |
| column shafts (fluted) | `quartz_pillar` (axis y) |
| column foot | `polished_diorite` |
| capitals, architrave, string courses, lintels | `smooth_quartz` |
| cornices, sills, hoods, raking cornice | `smooth_quartz_stairs`, `smooth_quartz_slab`, `polished_diorite_slab` |
| frieze, panels, tympanum | `calcite` |
| triglyphs, keystones, relief, urns | `chiseled_quartz_block`, `quartz_bricks` |
| balusters / rail | `diorite_wall` / `polished_diorite_slab` |
| glass (reads dark against the pale stone) | `gray_stained_glass_pane` |
| doors (bronze-dark) | `dark_oak_door` |
| dome shell | `polished_tuff`, `polished_tuff_stairs`, `polished_tuff_slab` |
| dome ribs | `polished_andesite`, `polished_andesite_stairs` |
| gilding (dome and lantern ONLY) | `gold_block`; finial point `lightning_rod` |
| flat roof decks | `smooth_stone` |
| portico roof slopes | `polished_tuff_stairs`, `polished_tuff_slab` |
| light | `lantern` (behind balustrades, in the loggias, in the drum), `glowstone` (inner dome shell) |

## OPENINGS

All doors are on plot 1. Glass is set 1 into its 2-thick wall (the cell given is the glass; the cell in front is the reveal).

| module | opening | x | y | z |
|---|---|---|---|---|
| plot 1 | 3 arched doorways, 4 `dark_oak_door` each (2 pairs, hinges mirrored, facing north) | 86..89, 94..97, 102..105 | 2..3 | 3 |
| plot 1 | transom glass over each door | same | 4..6 (+ 87..88 etc. at y 7) | 3 |
| plot 1 | entrance ramp: bottom slab `polished_diorite_slab` | same | 1 | 0 |
| plot 1 | landing, full blocks `polished_diorite` (2 long) | same | 1 | 1..2 |
| plot 1 | base windows | 79..80, 111..112 | 3..7 | 2 |
| plot 1 | upper windows (lower / upper storey) | 79..80, 87..88*, 95..96*, 103..104*, 111..112 (*one tall opening y 11..30) | 11..19, 23..30 | 6 |
| plot 1 | joint glass columns (wing plane) | 64, 127 | 3..7, 11..19, 23..30 | 3 (base), 7 |
| plot 1 | attic windows | 79..80, 111..112 on the flanks; 87..88, 103..104 on the central attic face | 38 (flanks) / 39..40 (central) | 3 / 12 |
| plot 2 | base windows | 135..136; 128 and 143 (joint halves) | 3..7 | 3 |
| plot 2 | lower windows | 135..136; 128, 143 | 11..19 | 7 |
| plot 2 | upper windows | same | 23..30 | 7 |
| plot 2 | attic windows | same | 38 | 4 |
| plot 0 | windows on every face (per face: 7..8, 15..16, 23..24, 31..32, 39..40, 47..48, 55..56) | base y 3..7, lower y 11..19, upper y 23..30 | glass at 3 / 7 (north), 60 / 56 (south), likewise x on east/west |
| plot 0 | drum windows | 8, on the 45° axes; N x 30..33 at z 11..12 (glass at z 12) | 44..58 | |
| plot 0 | drum attic windows | 8, same axes, 2 wide | 66 | |
| plot 0 | lantern bays | between the 8 columns | 103..107 | ring r 4.5 glass |
| plot 3 | base, lower, upper windows north | 152..153, 160..161, 168..169 | 3..7 / 11..19 / 23..30 | 2 / 6 |
| plot 3 | same, east | x 173 (base) / x 169 (upper) | 3..7 / 11..19 / 23..30 | 6..7, 15..16, 24..25 |
| plot 3 | joint glass column | 144 | 3..7, 11..19, 23..30 | 3 / 7 |
| plot 3 | attic windows (glass 1 in) | north x 152..153, 168..169 | 39..40 | glass z 3 |
| plot 3 | attic windows east | glass at x 172 | 39..40 | 6..7, 24..25 |

## RESERVED (the shell leaves these empty; later parts place them)

| what | cells |
|---|---|
| every giant column, all modules | the 2x2 cells listed under SITE, y 10..33 (plot 0 drum: y 41..61) |
| pilasters on the corner pavilion's anta piers (pier face z 1 / x 174) | north x 147..149 and 172..174 at z 0; east z 1..3 and 28..30 at x 175; y 10..33, `smooth_quartz` |
| relief in the pediment | z 1, inside the triangle above y 37 (plot 1) |
| triglyphs and keystones | the frieze cells listed (shell lays the frieze course in `calcite` everywhere else) |
| gilded band, ribs, lantern, finial | plot 0, y 71 ring and everything at y 101+ (the dome part builds them after the shell) |
| entrance ramps and landings | plot 1, x 86..89/94..97/102..105, y 1, z 0..2 (no plinth course there) |
| lantern spots | the loggia floor (y 10) behind each balustrade pedestal; the drum's inner ledge at y 41 |

## FLOORS (interiors are empty monument halls, only floors and light)

| module | level | floor block y (walk y) | interior volume |
|---|---|---|---|
| plot 0 | rotunda floor | 1 (2) | x 8..55, z 8..55, open to the dome's inner shell (y 98) through the drum, r 18.5 |
| plot 0 | ring gallery at the deck | 36 (37) | between the deck edge and the drum's inner face is outside; inside the drum, a ledge 1 wide at y 40 |
| plot 1 | vestibule / ground | 1 (2) | x 65..126, z 4..22, y 2..8 |
| plot 1 | piano nobile | 9 (10) | x 65..126, z 7..22, y 10..20 |
| plot 1 | upper storey | 21 (22) | y 22..33 |
| plot 1 | attic | 33 (34) | y 34..38 flanks, y 34..42 central |
| plot 2 | ground | 1 (2) | x 128..143, z 5..22, y 2..8 |
| plot 2 | piano nobile | 9 (10) | z 8..22, y 10..20 |
| plot 2 | upper | 21 (22) | z 8..22, y 22..33 |
| plot 2 | attic | 33 (34) | z 5..22, y 34..38 |
| plot 3 | same levels as plot 2 | 1, 9, 21, 33 | x 145..168, z 7..29 (east wall inside x 168) |

Light: lanterns hanging under every floor at a 6-block grid, in each loggia (standing on the terrace at the pedestal
spots), behind every balustrade on the decks every 6 cells, on the drum ledge every 4 cells round, and a `glowstone`
cell every 3rd block in the dome's inner shell (staggered rings every 4 courses).

---
# DESIGNER SECTIONS (the architect's sections above are unchanged)

## PALETTE
The architect's MATERIALS keep their ids exactly. All ids below were checked with `mcd blocks --check --version 1.21.1`, and none is unknown. `iron_chain` does NOT exist in 1.21.1, so use `chain`.

| role | ids (shape variants) |
|---|---|
| ground, flat decks, interior floors | `smooth_stone`, `smooth_stone_slab` |
| plinth course, dome ribs | `polished_andesite`, `polished_andesite_stairs`, `polished_andesite_slab` |
| granite body (base, recessed walls, attic, drum, column feet, piers) | `polished_diorite`, `polished_diorite_stairs`, `polished_diorite_slab`; rustication joints `diorite` |
| balusters | `diorite_wall` (rail `polished_diorite_slab` bottom) |
| column shafts | `quartz_pillar` (axis y; the drum's lantern columns too) |
| capitals, architrave, string courses, lintels, crown, platform | `smooth_quartz`, `smooth_quartz_stairs`, `smooth_quartz_slab` |
| frieze, spandrels, tympanum, panels | `calcite` |
| triglyphs, keystones, relief, urns, acroteria | `chiseled_quartz_block`, `quartz_bricks` |
| glass | `gray_stained_glass_pane` (connection states set) |
| doors | `dark_oak_door` (both halves) |
| dome shell, pediment roof | `polished_tuff`, `polished_tuff_stairs`, `polished_tuff_slab` |
| gilding (plot 0 at y 71+ ONLY) | `gold_block`; finial point `lightning_rod` |
| light | `lantern` (hanging true/false), `chain` (axis y), `glowstone` (dome inner shell only) |

No other block may appear. Gold and tuff are allowed only on plot 0 at y ≥ 71, plus the tuff on the pediment roof.

## VOCABULARY
Conventions: the dome centre is 31.5, so for cell (x, z) use dx = x − 31.5, dz = z − 31.5, r = √(dx² + dz²), and "ring a..b" means a < r ≤ b. Rings are taken per cell; there is no anti-aliasing.
Face frames: a front is written once in (u, d, y) and turned to any face. **u** runs along the face, **d** is the depth in from the plot's edge on that face, and y is world y.
Stair facings are written as `out` (toward the street on that face) or `in` (toward the building), and `faceFrame` turns them into compass directions.

1. `faceFrame(face, box)` → `{ at(u, d) -> [x, z], dir(token) -> "north"|... }`. Faces: north `x = u, z = z0 + d`; south `x = u, z = z1 − d`; east `z = u, x = x1 − d`; west `z = u, x = x0 + d`. `out` is the face's own direction.
2. `fset(g, F, u, d, y, block, state)`: one write through the frame, turning `facing: "out"|"in"|"left"|"right"`. Every helper below writes through it.
3. `ground(g, x0, z0, x1, z1)`: `smooth_stone` at y 0.
4. `ringFill(g, rIn, rOut, y0, y1, block, skip?)`: fills the cells of ring rIn..rOut about (31.5, 31.5) from y0 to y1. `skip(x, y, z)` returns true for cells to leave out (windows, columns).
5. `rusticatedBase(g, F, u0, u1, p, { openings })`, where p is the base face's d: plinth `polished_andesite` y 1 at d p−1. Body y 2..9 at d p..p+2: `polished_diorite`, except at y 4 and y 7, where the face cell (d p) is left out and `diorite` goes at d p+1 (a channel joint). y 9 at d p is `smooth_quartz` (the string course). Each opening `{u0, u1, y0, y1}` leaves d p and d p+2 as air and d p+1 empty for the glazier (the joints stop at window edges). Openings marked `{door: true}` also leave out the plinth.
6. `terraceAndFloor(g, F, u0, u1, p, dBack, y)`: one solid `smooth_stone` course at y from d p to dBack. Its front cell (d p) is `smooth_quartz` and is already given by rule 5. This course is the terrace, the floor under the recessed wall and the interior floor.
7. `recessedWall(g, F, u0, u1, w, { windows, tall })`, where w is the d of the wall's outer face: `polished_diorite` at d w..w+1, y 10..33. Each window column pair leaves y 11..19 and y 23..30 open (d w air, d w+1 for the glass). The rest: `smooth_quartz` lintel at y 20 and y 31 (d w), a `calcite` panel at y 21 (d w), `polished_diorite` at y 22. A `tall` window leaves y 11..30 open in one piece.
8. `entablature(g, F, u0, u1, p, { plainFrom, plainTo })`: y 34 `smooth_quartz`, y 35 `calcite`, y 36 `smooth_quartz` crown, each from d p to p+5. The triglyph cells (y 35, d p, where u mod 4 is 0 or 3) are LEFT EMPTY for `triglyphs`. Between plainFrom and plainTo, y 35 at d p is `smooth_quartz`, with no triglyph cells.
9. `attic(g, F, u0, u1, a, y0, y1, { windows, wy })`: `polished_diorite` at d a..a+1, y0..y1. Window columns at y `wy` (1 or 2 rows) leave d a air and d a+1 empty for the glass.
10. `deck(g, x0, z0, x1, z1, y, { hole })`: a `smooth_stone` course. With `hole: 18.5`, cells with r ≤ 18.5 are left out.
11. `plainWall(g, box, bandY = [34, 36])`: `polished_diorite` ashlar with a flush `smooth_quartz` band on the bandY courses.
12. `doricColumn(g, x0, z0, y0, y1)`: a 2x2 at x0..x0+1, z0..z0+1. `polished_diorite` foot at y0, `quartz_pillar` (axis y) from y0+1 to y1−1, `smooth_quartz` capital at y1. Fronts use y 10..33; the drum uses 41..61.
13. `antaPilaster(g, F, u0, d, y0 = 10, y1 = 33)`: a `smooth_quartz` strip 3 wide (u0..u0+2) at d (the reserved z 0 / x 175 cells) from y0 to y1, with a `chiseled_quartz_block` capital course at y1.
14. `triglyphs(g, F, u0, u1, p, { skipFrom, skipTo })`: `chiseled_quartz_block` at y 35, d p, where u mod 4 is 0 or 3. Plots 1..3 use local X = x − 64·k for their u; plot 0 uses u = x or z. The pattern is the same on every plot.
15. `cornice(g, F, u0, u1, d, y)`: `smooth_quartz_stairs` with `half: "top"` and `facing: "in"` (the back against the wall, the lip toward the street), along d. Where two faces meet at a corner, use an outer-corner stair (`shape: "outer_left"`/`"outer_right"`, then check with a render).
16. `balustrade(g, F, u0, u1, d, y)`: at y, `polished_diorite` pedestals where u mod 4 is 0 or 3, and `diorite_wall` balusters elsewhere. At y+1 a continuous `polished_diorite_slab` (bottom) rail. Corners and ends are pedestals.
17. `baseWindowDressing(g, F, u0, p)`: 2 cells, u0..u0+1. A `polished_diorite_slab` (bottom) sill at y 2, d p−1, standing on the plinth. `chiseled_quartz_block` keystones at y 8, d p (2 cells).
18. `upperSills(g, F, u0, w)`: a `polished_diorite_slab` (bottom) at y 10, d w−1, standing on the terrace, and a `polished_diorite_slab` (top) at y 22, d w−1, 2 cells each.
19. `glassRun(g, F, u0, u1, d, y0, y1)`: `gray_stained_glass_pane` in every cell, with the two along-face connections (east/west on N/S faces, north/south on E/W faces) set `true` and the other two `false`. Joint columns (x 64, 127, 128, 143, 144) connect on both sides too, because the neighbour module completes them.
20. `atticPanel(g, F, u0, u1, d, y0 = 38, y1 = 41)`: a `chiseled_quartz_block` border ring u0..u1 × y0..y1 standing 1 proud at d−1, with a `calcite` field inside it at d.
21. `archedDoorway(g, x0)`: x0..x0+3, z 0..3. At y 1: `polished_diorite_slab` (bottom) at z 0, and `polished_diorite` at z 1..3 (the landing, plus the threshold under the door). Doors at z 3, y 2..3: `dark_oak_door` lower/upper, `facing: "north"`, x0 hinge left and x0+1 hinge right, x0+2 left and x0+3 right (two pairs with their hinges on the outer jambs). Check with `mcd states dark_oak_door` and a render, and flip if a leaf opens into its neighbour. Transom: `glassRun` at z 3, y 4..6 across x0..x0+3, and y 7 at x0+1..x0+2. Head: `smooth_quartz_stairs` `half: "top"` at y 7 on x0 (`facing: "west"`) and x0+3 (`facing: "east"`), at z 1 (the face) and z 2, which gives the curve. y 8 at z 1..2 is `smooth_quartz`, with `chiseled_quartz_block` keystones at x0+1..x0+2, z 1. At y 1..7, z 1..2 the passage is air.
22. `pediment(g)`: rake heights: pair i (x 73+2i, 74+2i), i = 0..11, sits at h = 37+i. The apex pair x 95..96 is at h = 48, and the right half mirrors it (X ↔ 63−X). At z 0, the raking cornice: the outer cell of each pair gets `smooth_quartz_stairs` bottom, facing the apex (east on the left rake, west on the right), and the inner cell gets `smooth_quartz_slab` type top. The apex cells are `smooth_quartz`. At z 1, `smooth_quartz` in the same cells (the course behind). The tympanum is `calcite` at z 2 for every y from 37 to h−1 under each pair, filled solid back to z 11; z 1 in front of it stays air for the relief. Roof at z 1..11, y = h on each pair: the outer cell is `polished_tuff_stairs` bottom facing the apex, and the inner cell is `polished_tuff_slab` top. The ridge x 95..96, y 48, z 1..11 is `polished_tuff`, with a `polished_tuff_slab` bottom on top at y 49. The back at z 11 is calcite under the roof. Acroteria: `chiseled_quartz_block` at (95, 49, 0), (96, 49, 0), (73, 38, 0) and (118, 38, 0).
23. `pedimentRelief(g)`: all at z 1, standing on the tympanum's floor line (y 37 is the entablature crown). Centre: a seated figure x 94..97, y 38..43: throne `quartz_bricks` y 38..39 at x 94..97; body `chiseled_quartz_block` y 40..42 at x 95..96; shoulders `quartz_bricks` y 41 at x 94 and 97; head `chiseled_quartz_block` y 43 at x 95..96. Each side (mirror X ↔ 63−X): a standing figure at x 90..91, y 38..42 (`quartz_bricks` body, `chiseled_quartz_block` head at y 42); a kneeling figure at x 85..86, y 38..40; a reclining figure at x 77..82, y 38..39 (a long `quartz_bricks` body, a `polished_diorite` drapery fold at y 38 under it, a `chiseled_quartz_block` head at x 78, y 39). Keep every cell at least 1 below the rake (y ≤ h−2 under its pair).
24. `drumWindow(g, angleDeg, width)`: on the axis at angle (0 = north, clockwise), the wall cells (ring 18.5..20.5) within ±width/2 of the axis line. Glass at the inner cell (r ≤ 19.5), outer cell air, y 44..57. Sill: `smooth_quartz_slab` bottom at y 43 on the outer ring 20.5..21.5. Round head at y 58: `smooth_quartz_stairs` top on the two edge cells, facing outward from the opening. Hood: `smooth_quartz_stairs` bottom at y 59 rising to the centre (a pediment), and a `smooth_quartz_slab` at y 60 over the middle, on ring 20.5..21.5. Cardinal windows are 4 wide (N x 30..33, glass z 12); diagonal windows are 2 wide, the 2 cells nearest the 45° line.
25. `drumUrn(g, x, z)`: at y 68 on ring 20.5..21.5, between each column pair: a `chiseled_quartz_block`, with a `smooth_quartz_slab` (bottom) at y 69.
26. `leadDome(g)`: run `dome()` into a SCRATCH `Grid` of the same size: `{ center: [31.5, 71, 31.5], radius: 20.5, profile: "hemisphere", height: 30, hollow: true, thickness: 2, block: "polished_tuff", edge: "stairs" }` (stairs and slabs as `polished_tuff_stairs`/`_slab`). Copy every cell into g ONCE, swapping as it goes. **Outer shell at y 71** (the lowest layer, r > 19.5) → `gold_block` (the band). **Ribs**: for each layer y 72..100 and each meridian k·22.5°, the outer-shell cell whose angle atan2(dx, −dz) is nearest the meridian → `polished_andesite` (a stair becomes `polished_andesite_stairs` with its states kept, a slab `polished_andesite_slab`). **Cartouche**: that rib cell at y 73 → `gold_block`. **Ring y 100**: every outer cell at y 100 → `gold_block`. **Inner shell**: in rings at y 74, 78, 82, 86, 90, 94 and 98, every 3rd inner cell around → `glowstone`, the start shifted by 1 on each ring (stagger). The rest is `polished_tuff`. The top must leave the r ≤ 5.5 disc at y 100 closed (the lantern platform stands on it).
27. `lanternTemple(g)`: platform: a `smooth_quartz` disc r ≤ 5.5 at y 101. Columns 1x1 `quartz_pillar` y 102..107 with `gold_block` capitals at y 108, at (29,27), (34,27), (36,29), (36,34), (34,36), (29,36), (27,34), (27,29). Glass ring 3.5..4.5 at y 103..107 (`glassRun`-style connections round the ring); the rest of the bays are air. y 102 ring 3.5..4.5 is `smooth_quartz` (the sill). y 109 is a `smooth_quartz` disc r ≤ 5.5. At y 110, a `smooth_quartz` ring 3.5..5.5, plus cornice `smooth_quartz_stairs` top facing in on ring 5.5..6.5. y 111 is a `gold_block` disc r ≤ 5.5. Cupola: `dome()` `{ center: [31.5, 112, 31.5], radius: 3.5, height: 7, block: "gold_block", edge: "none" }`. Finial: x 31..32, z 31..32, `gold_block` at y 119..124, except y 121 in `smooth_quartz` (the collar), with 4 `lightning_rod` at y 125. Inside: `hangingLantern` from the y 109 ceiling at (31,108,31) and (32,108,32), with no chain.
28. `standingLantern(g, x, y, z)`: `lantern` `hanging: "false"` on a full top face.
29. `hangingLantern(g, x, y, z, chain = 0)`: `chain` (axis y) cells above it, then `lantern` `hanging: "true"`, hung under a solid block.
30. `lampStandard(g, x, y, z)`: `polished_diorite` at y, `diorite_wall` at y+1..y+2, `lantern` (hanging false) at y+3. For the rotunda floor and the deck corners.

## ROOMS
A monument, so the rooms have no furniture. Each room's designer may lay a floor inlay and lamps only; light every walkable cell to 8 or more.

| room | box (inner air) | purpose | ways in |
|---|---|---|---|
| Rotunda (plot 0) | [8, 2, 8, 55, 33, 55]. The base storey also reaches out to x/z 5..58 at y 2..8. Above y 33 it opens up through the deck hole (r 18.5) into the drum and the dome (y 98). | The great domed hall: a vast, solemn grey-and-white space looking up into the glowing dome. Key pieces: a floor medallion at y 1 under the dome's axis (a `polished_andesite` ring r 9..10 and a `calcite` ring r 4..5 around a `chiseled_quartz_block` 2x2 centre), and 8 `lampStandard`s on the r 14 circle at the 45° axes. Keep the centre clear. | No door inside the kit: the rotunda is entered from the wings when the modules are placed on the site. Inside the module it is a sealed, lit hall. |
| Portico vestibule (plot 1) | [65, 2, 4, 126, 8, 22] | The entrance hall behind the three arched doors: a low, bright, cool stone hall. Key pieces: a `calcite`/`polished_andesite` paving band leading in from each door to z 12, and hanging lanterns on a 6-grid under the y 9 floor. Nothing on the floor in front of the doors. | The 3 doors at x 86..89, 94..97 and 102..105, z 3, y 2..3 (from the landings at z 1..2). |

The upper floors (plots 1..3, y 9/21/33) and the plot 2/3 halls are closed, unvisited interiors behind glass. P10 lights them; they have no designer and no stairs (a monument shell). The entrance is the centre door: the player stands on its landing at [95, 2, 2]. The street is [95, 1, −1], in front of the centre slab step (the placement's street; the kit's ground starts at z 0).

## PARTS (10)
runParts order. P1 runs alone. P2..P10 then run at once in their own copies, each writing only into its own cells (listed), so they never clash. A cell left empty for another part is left empty by NOT placing it (never write air). Every part checks: `mcd check build.nbt`, and a render of its own plot.

1. **front shell**, `parts/front-shell.mjs` (stonemason). `ground` on all 4 plots (x 0..175, the full depth of each plot). Plots 1, 2 and 3 masonry with `faceFrame("north")` (plot 3 east too): `rusticatedBase`, `terraceAndFloor` (y 9), `recessedWall`, `entablature` (plain over x 75..116), `attic`, `deck`; interior floors at y 1, 21 and 33 (`smooth_stone`, ground plan per FLOORS); rear walls (z 23; plot 3 z 30); hidden party walls at x 64, 127, 128, 143 and 144, z 8..22 (plot 3: x 144, z 8..30); the end strips at the wing plane; the portico's central attic block x 73..118, z 12..23, y 37..43, with a deck at y 43 and attic windows left open (x 87..88 and 103..104, y 39..40, z 12 face); plot 3's taller attic (y 37..42, deck y 42), anta piers rusticated to y 33, and `plainWall` south and west. LEAVE EMPTY: every column and pilaster cell, every glass cell, triglyph cells, cornice cells (y 36 at the front edge), balustrade rows, the door openings x 86..89/94..97/102..105 at y 1..8, z 0..3 (no plinth there), and the whole pediment zone x 73..118, y 37..49, z 0..11. Ticks elements 1–5, 7, 11, 12, 14, 24 (body), 26, 27.
2. **dome pavilion shell**, `parts/pavilion-shell.mjs` (stonemason). Plot 0 y 1..36 on all 4 faces: `faceFrame` per face (u 5..58 between the corner piers), with `rusticatedBase` p 2, `terraceAndFloor` y 9 (d 2..5 only: the rotunda has no upper floors), `recessedWall` w 6, and `entablature` p 2 (a ring 6 deep). Rusticated corner piers 3x3 at x/z 2..4 and 59..61, y 1..33 (joints as the base). Rotunda floor `smooth_stone` y 1 over x/z 5..58. `deck` y 36 over x/z 2..61 with `hole: 18.5`. Windows per plot 0 OPENINGS, left open. LEAVE EMPTY: the columns, glass, triglyphs, the cornice ring at d 1, and the balustrade at y 37..38. Ticks 2, 3, 5, 7, 10 (body), 14, 28, 29 (floor).
3. **giant order**, `parts/giant-order.mjs` (stonemason, column setter). `doricColumn` for every front column (y 10..33): plot 0 (6 per face, 24), plot 1 (6 + 4 flanking), plot 2 (2), plot 3 (2 north + 2 east). `antaPilaster` on plot 3's anta pier faces at the reserved cells: north x 147..149 and 172..174 at z 0; east z 1..3 and 28..30 at x 175. Ticks 6, 15, 24 (pilasters), 28.
4. **stone dressings**, `parts/dressings.mjs` (stone carver). Across plots 0..3: `triglyphs` (not over x 75..116), `cornice` y 36 (wing plane z 1, forward plane z 0, plot 0 on the x 1/62, z 1/62 lines, plot 3 north z 0 and east x 175, corners as outer stairs), `balustrade` (wings and flanks y 40 on the attic's d line; portico central attic y 44 on z 12; plot 3 y 43 on z 2 / x 173; plot 0 y 37 on the x/z 2 and 61 lines), `baseWindowDressing` under and over every base window, `upperSills` in front of every upper window, `atticPanel` on plot 3 (N x 157..164, E z 12..19). Ticks 4 (sills, keystones), 8, 10, 13, 25.
5. **portico front**, `parts/portico.mjs` (stonemason and carver). `archedDoorway` ×3 (x 86, 94, 102), `pediment`, `pedimentRelief`, all in plot 1's empty zones. Check `mcd approach build.nbt --from 95,1,-1 --to 95,2,2`. Ticks 16–22.
6. **drum**, `parts/drum.mjs` (stonemason). Plot 0 y 37..70. Stylobate `ringFill(19.5, 22.5, 37, 40, polished_diorite)` with a `smooth_quartz` top at y 40, plus the inner ledge `ringFill(17.5, 19.5, 37, 40)`. Drum wall `ringFill(18.5, 20.5, 41, 70)` skipping the 16 column cells (from the architect's table; those are `doricColumn` 41..61, standing proud) and the window cells. `drumWindow` ×8 (cardinals 4 wide, diagonals 2 wide), including their glass. Entablature y 62 `smooth_quartz` ring 18.5..22.5, y 63 `calcite` ring 18.5..22.5, y 64 `smooth_quartz` ring 18.5..21.5 plus `smooth_quartz_stairs` top facing in on 21.5..22.5. Attic step 1 `ringFill(18.5, 21.5, 65, 67)` with a 2-wide window open at y 66 on each axis (glass on its inner cell). `drumUrn` ×8 over the pairs. Step 2 `ringFill(18.5, 20.5, 68, 70)`, with a `smooth_quartz` top at y 70. Ticks 30–33.
7. **dome**, `parts/dome.mjs` (leadworker and gilder). `leadDome` (y 71..100). Ticks 34–37.
8. **lantern**, `parts/lantern.mjs` (gilder). `lanternTemple` (y 101..125). Ticks 38, 39, 41.
9. **glazing**, `parts/glazing.mjs` (glazier). `glassRun` into every window glass cell on plots 0..3 per OPENINGS: base y 3..7 (d p+1), lower y 11..19 and upper y 23..30 (d w+1), the portico's tall openings y 11..30, attic windows, and the joint columns. Not the drum, lantern or door transoms. Ticks 4, 7, 12, 23, 27 (glass).
10. **lighting**, `parts/lighting.mjs` (lamplighter). `standingLantern` on the terrace (y 10) at every pedestal axis in each loggia; on every deck 2 cells behind the balustrade every 6 cells (wing y 40, plot 3 y 43, portico central y 44, plot 0 y 37); on the drum ledge y 41 every 4 cells round the ring (17.5..18.5); `hangingLantern` on a 6-grid under every interior floor and deck (y 8, 20, 32, 38; plot 3 also y 41); and lanterns on chains hanging from the deck underside round the rotunda's deck hole (r 19..20) at y 35, every 6 cells. Check `mcd light build.nbt --y <feet y>` on each level and clear every dark walkable cell, outside ledges included (the terrace, the y 37 crown in front of the attic, the decks). Ticks 9, 40.

- [x] P1 front shell
- [x] P2 dome pavilion shell
- [x] P3 giant order
- [x] P4 stone dressings
- [x] P5 portico front
- [x] P6 drum
- [x] P7 dome
- [x] P8 lantern
- [x] P9 glazing
- [x] P10 lighting

## Notes for workers
- **Stay in your plot and your cells.** runParts refuses writes into an earlier part's cells, air included. Leave other parts' cells empty by not placing anything there; never `carve` them.
- **One section, many faces.** Write plot 0's faces with `faceFrame` and the same wing helpers; check the south and west faces in a render against the north (the mirror must not shift by one: south glass at z 60/56, west glass at x 3/7).
- **Tiling test (P1, P9):** place two copies of plot 2 side by side (x + 16) in a scratch grid and render. The joint has to read as one 2-wide window under a pair of pedestals, with no seam.
- **Cornice stairs:** `half: "top"`, `facing` INTO the wall. Render a close-up of a corner.
- **Fractional centre 31.5:** use dx = x − 31.5 everywhere, with no rounding. The drum and dome must look symmetric N/S and E/W in a top view.
- **Dome:** build it in a scratch grid and copy once with the swaps, because a part never writes the same cell twice. The ribs must read as fine paler lines on the grey (render from the street at ~60 blocks).
- **Gold** appears only on plot 0 at y ≥ 71. Nothing on the fronts is gold.
- **1.21.1:** use `chain`, not `iron_chain`. No pale oak, no newer blocks.
- **Accessible way in:** at each arch, a slab at z 0, then a full-block landing at z 1..2 at the door's threshold level. There are no stairs on the way in.
- P1 note: east windows of plot 3 at z 6..7 are omitted (north window x168..169 owns cell x169,z6); x169..170 z4 filled; piers solid polished_diorite y10..33 (NE x172..174 z1..6, NW x147..149 z1..6, SE x169..174 z28..30); y36 smooth_stone z7..11 x73..118 supports the pediment back; portico flank attics have no windows (x79/111 lie inside the pediment span).
