# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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

- [ ] P1 front shell
- [ ] P2 dome pavilion shell
- [ ] P3 giant order
- [ ] P4 stone dressings
- [ ] P5 portico front
- [ ] P6 drum
- [ ] P7 dome
- [ ] P8 lantern
- [ ] P9 glazing
- [ ] P10 lighting

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
```

### elements.md

```markdown
# REQUIRED ELEMENTS: San Francisco City Hall kit

Coordinates come from plan.md (the architect's tables). P1..P10 are the PARTS in plan.md. Helpers are the VOCABULARY in plan.md.
Each element is built from real blocks: columns are `quartz_pillar` shafts with a foot and a capital, balustrades are wall-block balusters under a slab rail, and the cornices are upside-down stairs. No coloured block stands in for any of them.

| # | element (brief / expected) | real construction | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Flat smooth-stone ground, every plot | `smooth_stone` y 0, whole plot | plots 0..3 | P1 | `ground` |
| 2 | Plinth course | `polished_andesite`, 1 proud of the base face, y 1 | every street face (not at the ramps) | P1, P2 | `rusticatedBase` |
| 3 | Rusticated granite base storey | `polished_diorite` courses y 2..9, channel joints at y 4 and y 7 (the face cell left out so `diorite` 1 behind it shows), `smooth_quartz` string course y 9 | wing plane z 2, forward plane z 1, plot 0 at d 2 | P1, P2 | `rusticatedBase` |
| 4 | Tall base windows | 2-wide `gray_stained_glass_pane` y 3..7 set 1 in (reveal open, the cell behind left air), `polished_diorite_slab` sill y 2 one proud, 2 `chiseled_quartz_block` keystones y 8 | plan OPENINGS | P9 glass, P4 sill and keystone | `glassRun`, `baseWindowDressing` |
| 5 | Terrace (loggia floor) | y 9 course from the base face back to the recessed wall, and on through as the floor | all fronts | P1, P2 | `terraceAndFloor` |
| 6 | GIANT ORDER of fluted Doric columns | 2x2: `polished_diorite` foot y 10, `quartz_pillar` (axis y) shaft y 11..32, `smooth_quartz` capital y 33 | wings X 3-4 and 11-12; portico 6 plus 2 flanking pairs; plot 0, 6 per face; corner pavilion 2 in antis per face | P3 | `doricColumn` |
| 7 | Recessed wall of tall windows (2 storeys) | `polished_diorite` 2 thick, y 10..33; glass 1 in, lower y 11..19 and upper y 23..30; `smooth_quartz` lintels y 20 and y 31; `calcite` spandrel y 21 | 4 cells behind the column face | P1, P2 shell; P9 glass | `recessedWall`, `glassRun` |
| 8 | Window sills in the loggia | `polished_diorite_slab` bottom slab y 10 (on the terrace) and top slab y 22, at the cell in front of the reveal | every upper window | P4 | `upperSills` |
| 9 | Loggia (open air between the columns and the wall) | left air by not placing; lanterns stand on the terrace behind the pedestals | z 4..5 (wing), z 3..4 (forward) | P1 leaves it, P10 lights it | `standingLantern` |
| 10 | Entablature: architrave, Doric triglyph frieze, cornice | `smooth_quartz` architrave y 34; `calcite` frieze y 35 with `chiseled_quartz_block` triglyphs where X mod 4 is 0 or 3; `smooth_quartz` crown y 36; upside-down `smooth_quartz_stairs` cornice y 36, 1 proud | all fronts, plot 0 ring, corner pavilion N+E | P1/P2 body, P4 triglyphs and cornice | `entablature`, `triglyphs`, `cornice` |
| 11 | Plain frieze over the portico's six columns | `smooth_quartz` y 35 | x 75..116 | P1 (no triglyphs there) | `entablature` |
| 12 | Attic with small windows | `polished_diorite` y 37..39, 2 thick; 2-wide glass at y 38 over each main window | wings, portico flanks | P1, P9 | `attic`, `glassRun` |
| 13 | Balustrade on top | `diorite_wall` balusters, `polished_diorite_slab` (bottom) rail on top, pedestals (`polished_diorite` + the rail slab) where X mod 4 is 0 or 3 | wing y 40..41 on z 3; portico central y 44..45 on z 12; pavilion y 43..44; plot 0 y 37..38 | P4 | `balustrade` |
| 14 | Flat roof decks, hidden | `smooth_stone` | wing y 39, plot 3 y 42, portico central y 43, plot 0 y 36 (with a hole of radius 18.5) | P1, P2 | `deck` |
| 15 | Pedimented central portico | the forward plane x 67..124 with 6 columns and 2 flanking pairs | plot 1 | P1, P3 | `doricColumn` |
| 16 | Triangular PEDIMENT | raking cornice z 0, rising 1 per 2 (bottom `smooth_quartz_stairs` facing the apex on the outer cell, top `smooth_quartz_slab` on the inner cell); `smooth_quartz` course behind it at z 1; `calcite` tympanum at z 2 filled solid back to z 11 | x 73..118, y 37..48 | P5 | `pediment` |
| 17 | Relief in the pediment | `chiseled_quartz_block` / `quartz_bricks` seated figure, 4 x 6, at x 94..97, y 38..43; reclining groups (`quartz_bricks`, `polished_diorite`) tapering with the rake, all at z 1 standing on the tympanum | plot 1 | P5 | `pedimentRelief` |
| 18 | Low pediment roof | `polished_tuff_stairs` and `polished_tuff_slab` on the 1:2 rake, z 1..11, ridge x 95..96 | plot 1 | P5 | `pediment` |
| 19 | Acroteria | 1 `chiseled_quartz_block` each | apex (95..96, 49, 0); ends (73, 38, 0) and (118, 38, 0) | P5 | `pediment` |
| 20 | Three tall arched doorways | 4-wide openings y 1..8; upside-down `smooth_quartz_stairs` haunches at y 7; `smooth_quartz` voussoir course y 8 with a pair of `chiseled_quartz_block` keystones | x 86..89, 94..97, 102..105, z 1..3 | P5 | `archedDoorway` |
| 21 | Doors at street level | 4 `dark_oak_door` per arch (2 pairs, both halves, facing north, hinges on the outer jambs), transom glass y 4..7 | z 3 | P5 | `archedDoorway` |
| 22 | Slab steps (accessible way in) | `polished_diorite_slab` bottom at z 0, `polished_diorite` full landing z 1..2 (2 long), threshold level with the door | y 1, each arch | P5 | `archedDoorway` |
| 23 | Great windows over the doors | one tall glass opening y 11..30 per intercolumn | x 87..88, 95..96, 103..104, glass z 6 | P1 leaves it, P9 | `glassRun` |
| 24 | Projecting corner pavilion | forward block x 147..174 x 1..30, anta piers rusticated to y 33, `smooth_quartz` pilasters 3 wide, 1 proud, y 10..33 | plot 3 | P1, P3 | `antaPilaster` |
| 25 | Taller pavilion attic with a raised panel | `polished_diorite` y 37..42; `calcite` field with a `chiseled_quartz_block` border 1 proud | N x 157..164, E z 12..19, y 38..41 | P1 attic, P4 panel | `atticPanel` |
| 26 | Plain south and west walls of the pavilion | `polished_diorite` ashlar, flush `smooth_quartz` band y 34..36 | z 30; x 144, z 24..30 | P1 | `plainWall` |
| 27 | Wing bay tiles seamlessly | ends at mid-intercolumn; 1-wide joint glass at X 0 and X 15 (both pane sides connected); hidden party walls z 8..22 | plot 2 (also at x 64, x 127, x 144) | P1, P9 | `glassRun` |
| 28 | Dome pavilion with the giant order on 4 faces | the wing section rotated to each face, 3x3 rusticated corner piers | plot 0, y 1..36 | P2, P3 | `faceFrame` + wing helpers |
| 29 | Hollow rotunda, lit | floor y 1, open up through the deck hole, the drum and the dome's inner shell | plot 0 | P2, P6, P7 | `deck`, `leadDome` |
| 30 | Drum stylobate | `polished_diorite` ring y 37..40 (r 19.5..22.5) with a `smooth_quartz` top course; inner ledge ring 17.5 < r ≤ 19.5 at y 40 | plot 0 | P6 | `ringFill` |
| 31 | Round drum ringed by paired giant columns | `polished_diorite` wall 2 thick (r 18.5..20.5), y 41..70; 16 engaged 2x2 columns, y 41..61 | plot 0 drum table | P6 | `ringFill`, `doricColumn` |
| 32 | Drum windows between the pairs | 8 windows (4 wide on the cardinals, 2 wide on the diagonals), glass y 44..57, a round head of stairs at y 58, slab sill y 43, a `smooth_quartz_stairs` hood at y 59..60 | plot 0 | P6 | `drumWindow` |
| 33 | Drum entablature and stepped attic | architrave/frieze/cornice y 62..64 (cornice at r 22.5); attic step 1 r 21.5 y 65..67 with 8 small windows at y 66 and chiseled urns at y 68 over each pair; step 2 r 20.5 y 68..70 | plot 0 | P6 | `ringFill`, `drumUrn` |
| 34 | Gilded band at the dome's base | `gold_block` ring r 20.5 at y 71 | plot 0 | P7 | `leadDome` |
| 35 | Leaden grey dome with 16 fine ribs | `dome()` hemisphere, r 20.5, height 30, hollow (2 thick), `polished_tuff` with stair edges; 16 meridians in `polished_andesite` (the stairs as `polished_andesite_stairs`, states kept) from y 72 to y 100 | plot 0 | P7 | `leadDome` |
| 36 | Gilded trim on the dome | `gold_block` cartouche at the foot of each rib (y 73); gold ring at y 100 | plot 0 | P7 | `leadDome` |
| 37 | Glowstone in the dome's inner shell | every 3rd inner-shell cell, in rings every 4 courses, staggered | plot 0 | P7 | `leadDome` |
| 38 | Columned lantern | `smooth_quartz` platform disc r 5.5 y 101; 8 `quartz_pillar` 1x1 columns y 102..107 with `gold_block` capitals y 108; open bays with a glass ring at r 4.5; entablature y 109..110; gold band y 111 | plot 0 | P8 | `lanternTemple` |
| 39 | Gilded cupola and finial | `dome()` r 3.5 height 7 in `gold_block` at y 112; finial: 2x2 `gold_block` y 119..124 with a `smooth_quartz` collar y 121; 4 `lightning_rod` y 125 | plot 0 | P8 | `lanternTemple` |
| 40 | No mob spawns: lanterns behind balustrades, in the loggias, on the drum ledge; hanging lanterns under every floor | `lantern` standing (hanging false) on decks, terrace and ledge; `lantern` hanging true on `chain` (axis y) inside; lamp standards on the rotunda floor | all plots | P10 (rotunda floor: its designer) | `standingLantern`, `hangingLantern`, `lampStandard` |
| 41 | Lantern inside the lantern (it glows at night) | hanging `lantern` on a `chain` from the y 109 ceiling | plot 0 | P8 | `hangingLantern` |
| 42 | Every module inside its plot | cornices end at z 0 / x 175; the dome is at most x 11..52 | all | every part | `faceFrame` bounds check |
```

### rooms.json

```json
{"entrance":[95,2,2],"street":null,"entrances":null,"rooms":[{"name":"Rotunda","box":[8,2,8,55,33,55]},{"name":"Portico vestibule","box":[65,2,4,126,8,22]}]}
```

### palette.json

```json
{
  "roles": {
    "ground": ["smooth_stone", "smooth_stone_slab"],
    "plinth": ["polished_andesite", "polished_andesite_stairs", "polished_andesite_slab"],
    "granite": ["polished_diorite", "polished_diorite_stairs", "polished_diorite_slab", "diorite"],
    "shaft": ["quartz_pillar"],
    "quartz": ["smooth_quartz", "smooth_quartz_stairs", "smooth_quartz_slab"],
    "frieze": ["calcite"],
    "carved": ["chiseled_quartz_block", "quartz_bricks"],
    "tuff": ["polished_tuff", "polished_tuff_stairs", "polished_tuff_slab"],
    "gilding": ["gold_block", "lightning_rod"]
  },
  "objects": [
    "gray_stained_glass_pane",
    "dark_oak_door",
    "diorite_wall",
    "lantern",
    "chain",
    "glowstone"
  ]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: node build.mjs writes a temp file, which then replaces build.nbt.
set -e
cd "$(dirname "$0")"
tmp=$(mktemp ./build.XXXXXX)
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// San Francisco City Hall: the site grid, the ground, then every part in plan.md order. Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, PLOTS, SMOOTH_STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Parts in build order: the two rooms last, as the walk-through spaces inside the finished monument.
const PARTS = [
  ["front shell", "parts/front-shell.mjs"],
  ["dome pavilion shell", "parts/pavilion-shell.mjs"],
  ["giant order", "parts/giant-order.mjs"],
  ["stone dressings", "parts/dressings.mjs"],
  ["portico front", "parts/portico.mjs"],
  ["drum", "parts/drum.mjs"],
  ["dome", "parts/dome.mjs"],
  ["lantern", "parts/lantern.mjs"],
  ["glazing", "parts/glazing.mjs"],
  ["lighting", "parts/lighting.mjs"],
  ["room: Rotunda", "parts/room-1.mjs"],
  ["room: Portico vestibule", "parts/room-2.mjs"],
];

const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
for (const p of Object.values(PLOTS)) g.fill([p.x0, 0, p.z0], [p.x1, 0, p.z1], SMOOTH_STONE);

// A part whose file is not there yet is skipped (its worker hasn't written it); a part that exists must build.
const list = [];
for (const [name, module] of PARTS) {
  if (!existsSync(module)) { console.log(`part ${name}: ${module} not written yet, skipped`); continue; }
  list.push([name, (await import(`./${module}`)).build]);
}

runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the City Hall kit: palette block ids, site coordinates from plan.md, and a seeded rng.

// Block ids (palette.json only; chain, not iron_chain, which 1.21.1 lacks)

// Block ids (palette.json only; chain, not iron_chain, which 1.21.1 lacks)
export const SMOOTH_STONE = "smooth_stone";                       // ground and flat decks

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";            // ground-level slab

export const POLISHED_ANDESITE = "polished_andesite";            // plinth course, dome ribs

export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";

export const POLISHED_DIORITE = "polished_diorite";              // granite body: base, recessed walls, attic, drum

export const POLISHED_DIORITE_STAIRS = "polished_diorite_stairs";

export const POLISHED_DIORITE_SLAB = "polished_diorite_slab";    // sills, balustrade rail

export const DIORITE = "diorite";                                // rustication joints

export const DIORITE_WALL = "diorite_wall";                      // balusters

export const QUARTZ_PILLAR = "quartz_pillar";                    // fluted column shafts (axis y)

export const SMOOTH_QUARTZ = "smooth_quartz";                    // capitals, architrave, string courses, lintels

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";      // cornices, hoods, raking cornice

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";

export const CALCITE = "calcite";                                // frieze, spandrels, tympanum, panels

export const CHISELED_QUARTZ_BLOCK = "chiseled_quartz_block";    // triglyphs, keystones, relief, urns, acroteria

export const QUARTZ_BRICKS = "quartz_bricks";                    // relief figures

export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";// glass (connection states set)

export const DARK_OAK_DOOR = "dark_oak_door";                    // both halves

export const POLISHED_TUFF = "polished_tuff";                    // dome shell, pediment roof

export const POLISHED_TUFF_STAIRS = "polished_tuff_stairs";

export const POLISHED_TUFF_SLAB = "polished_tuff_slab";

export const GOLD_BLOCK = "gold_block";                          // gilding: plot 0 at y >= 71 only

export const LIGHTNING_ROD = "lightning_rod";                    // finial point

export const LANTERN = "lantern";                                // hanging true/false

export const CHAIN = "chain";                                    // hanging-lantern chain, axis y

export const GLOWSTONE = "glowstone";                            // dome inner shell only

// Site (plan.md): the full site is 176 x 126 x 64 blocks; plots are inclusive x0..x1 / z0..z1
export const SITE = [176, 126, 64];

export const PLOTS = {
  dome: { x0: 0, z0: 0, x1: 63, z1: 63 },                        // plot 0: dome and pavilion
  portico: { x0: 64, z0: 0, x1: 127, z1: 23 },                   // plot 1: east portico
  wing: { x0: 128, z0: 0, x1: 143, z1: 23 },                     // plot 2: wing bay
  pavilion: { x0: 144, z0: 0, x1: 175, z1: 31 },                 // plot 3: corner pavilion
};

export const DOME_CENTER = 31.5;                                 // dome axis: x and z (dx = x - 31.5)

export const DRUM_RINGS = { inner: 18.5, outer: 20.5 };          // drum wall, round the axis

export const ROTUNDA_BOX = [8, 2, 8, 55, 33, 55];                // inner air of the Rotunda room

export const VESTIBULE_BOX = [65, 2, 4, 126, 8, 22];             // inner air of the Portico vestibule

export const ENTRANCE = [95, 2, 2];                              // the centre door's landing

export const STREET = [95, 1, -1];                               // in front of the centre slab step

// A seeded rng: rng(seed)() returns a float in [0, 1), the same sequence for the same seed
export function rng(seed)
```

### vocab/h1.mjs

```js
// Helpers from plan.md VOCABULARY for the City Hall kit: faceFrame, ringFill, recessedWall, deck, antaPilaster,
// balustrade, glassRun, pediment, drumUrn, standingLantern. Each takes its own position as arguments, writes only the
// cells of its own footprint, and writes only into air: a cell an earlier part owns is refused and reported (never
// overwritten) unless opts.over is set. Every helper returns { placed, refused, box } (box = its footprint).
// Structure-local coordinates: x east, y up, z south; FRONT = north (z low). Block ids are plan.md PALETTE literals.

/**
 * A front written once in (u, d, y) and turned to any face. box = the plot [x0, z0, x1, z1] (or a 6-box, its x and z
 * taken), inclusive. u runs along the face, d is the depth in from the plot's edge on that face.
 * at(u, d) -> [x, z]; dir(token) -> compass ("out" = the face, "in" = into the building, "left"/"right" as seen by
 * someone walking in from the face: on the north face, left is east); along(s) -> compass of increasing (s > 0) or
 * decreasing u.
 */
export function faceFrame(face, box)

/** Fill the ring rIn < r <= rOut about the dome centre, y0..y1. skip(x, y, z) -> true leaves that cell out. */
export function ringFill(g, rIn, rOut, y0, y1, block, skip, opts = {})

/** A smooth_stone course over x0..x1 x z0..z1 at y. opts.hole: cells with r <= hole (about the centre) are left out. */
export function deck(g, x0, z0, x1, z1, y, opts = {})

/**
 * The recessed wall: polished_diorite at d w..w+1, y 10..33. The lintels (y 20, 31) and the spandrel panel (y 21) sit on
 * the face cell d w. opts.windows: the first u of each 2-wide window; opts.tall: each window is open y 11..30 in one piece,
 * otherwise y 11..19 and 23..30. Open cells: d w stays air and d w+1 is left for glassRun (the glazier).
 */
export function recessedWall(g, F, u0, u1, w, opts = {})

/** A 3-wide smooth_quartz pilaster at depth d, y0..y1, with a chiseled_quartz_block capital course at y1. */
export function antaPilaster(g, F, u0, d, y0 = 10, y1 = 33, opts = {})

/**
 * A balustrade on the d line at y: polished_diorite pedestals where u mod 4 is 0 or 3 and at both ends, diorite_wall
 * balusters elsewhere (their sides face the neighbours along the face), and a continuous polished_diorite bottom slab rail
 * at y + 1.
 */
export function balustrade(g, F, u0, u1, d, y, opts = {})

/** Glass panes at depth d, y0..y1, connected on the two along-face sides (east/west on N/S faces, north/south on E/W). */
export function glassRun(g, F, u0, u1, d, y0, y1, opts = {})

/**
 * The triangular pediment over the front from u = left to u = right (inclusive, an odd number of 2-cell pairs), depth 0..depth,
 * base y0. Pair k sits at h = y0 + min(k, n-1-k); the apex pair is the middle one. d = 0: raking cornice (outer cell
 * stairs bottom facing the apex, inner cell slab top) and smooth_quartz apex cells. d = 1: the smooth_quartz course behind.
 * d 2..depth: calcite tympanum under each pair up to h-1. d 1..depth: the tuff roof (outer stairs, inner slab) at y = h, and the
 * ridge with its slab cap at the apex. Acroteria at the ends (y0+1) and on the apex (apexY+1).
 * Note: the course (d 1, y = h) and the roof's first row (d 1, y = h) name the same cells; the course is written first, so the
 * roof's d 1 cells are refused and reported (the course stays).
 */
export function pediment(g, F, opts = {})

/** A chiseled_quartz_block at (x, y, z) with a smooth_quartz slab (bottom) above it. */
export function drumUrn(g, x, z, y = 68, opts = {})

/**
 * A standing lantern at (x, y, z) on a full top face (the block at y - 1). Refused, and reported, unless the cell above
 * is air too (the 2-high clear lane past it). Writes the lantern cell only.
 */
export function standingLantern(g, x, y, z, opts = {})
```

### vocab/h2.mjs

```js
// VOCABULARY part 2 of plan.md: fset, rusticatedBase, entablature, plainWall, triglyphs, baseWindowDressing,
// atticPanel, pedimentRelief, leadDome, hangingLantern. Each takes its position as arguments and writes only into
// air. A cell that is not air is left alone and reported in g.refused, the same list guard() keeps.
// Frame helpers take F, a faceFrame object from plan.md rule 1: F.at(u, d) -> [x, z], F.dir(token) -> compass.

// One write through the face frame. Facing tokens (out | in | left | right) are turned into compass directions.
export function fset(g, F, u, d, y, block, state)

// Rule 5. Plinth polished_andesite at y 1, d p-1. Granite body y 2..9, d p..p+2: quartz string course at y 9 (d p),
// channel joints at y 4 and 7 (d p left out, diorite at d p+1). Each opening {u0, u1, y0, y1} stays open for the
// glazier (d p..p+2 all empty). A door opening also leaves out the plinth.
export function rusticatedBase(g, F, u0, u1, p, { openings = [] } = {})

// Rule 8. Architrave smooth_quartz y 34, frieze calcite y 35, crown smooth_quartz y 36, each from d p to p+5.
// Triglyph cells (y 35, d p) are left empty for triglyphs(). Inside plainFrom..plainTo the frieze at d p is
// smooth_quartz with no triglyphs.
export function entablature(g, F, u0, u1, p, { plainFrom, plainTo } = {})

// Rule 11. Polished_diorite ashlar over the box [x0, y0, z0, x1, y1, z1] (inclusive), with a flush smooth_quartz
// band on the bandY courses (lo..hi inclusive).
export function plainWall(g, box, bandY = [34, 36])

// Rule 14. Chiseled_quartz_block triglyphs at y 35, d p, where u mod 4 is 0 or 3. Cells in skipFrom..skipTo are left out.
export function triglyphs(g, F, u0, u1, p, { skipFrom, skipTo } = {})

// Rule 17. Polished_diorite_slab (bottom) sill at y 2, d p-1, over 2 cells from u0. Chiseled_quartz_block keystones at
// y 8, d p. The keystone cell must be left open in the base's openings (y up to 8), or it is refused.
export function baseWindowDressing(g, F, u0, p)

// Rule 20. Chiseled_quartz_block border ring u0..u1 x y0..y1 standing 1 proud at d-1, with a calcite field at d inside it.
export function atticPanel(g, F, u0, u1, d, y0 = 38, y1 = 41)

// Rule 23. Pediment relief at z, on the tympanum. x0 is the plot's west edge (plot 1: 64); the plot mirrors X <-> 63 - X.
// A cell sits no higher than 2 under its rake pair (y <= h - 2), so the figures are cut off where the rake drops.
export function pedimentRelief(g, { x0, z = 1 })

// Rule 26. The dome (base layer y0, axis cx/cz, radius 20.5, 30 high, hollow 2 thick, polished_tuff, stair edges) is
// built in a scratch grid and copied into g once, swapping as it goes:
//  - gold_block on the outer shell at y0 and at y0+29;
//  - 16 polished_andesite meridians: on each layer y0+1..y0+29, the outer cell nearest each k * 22.5 degrees;
//    the cell at y0+2 becomes gold_block (the cartouche);
//  - glowstone on every 3rd inner cell of the rings y0+3, +7 .. +27, staggered by one per ring.
// The outer shell is a solid cell with an air neighbour above or outward; the inner face has solid on both sides.
export function leadDome(g, { cx, cz, y0 })

// Rule 29. A chain (axis y) of `chain` cells above a lantern hanging: true. The lantern hangs from a solid block
// directly above the chain, so with nothing solid there it throws instead of floating.
export function hangingLantern(g, x, y, z, chain = 0)
```

### vocab/h3.mjs

```js
// H3 vocabulary for the City Hall kit (plan.md VOCABULARY, items 3, 6, 8, 12, 15, 18, 21, 24, 27, 30): ground,
// terraceAndFloor, attic, doricColumn, cornice, upperSills, archedDoorway, drumWindow, lanternTemple, lampStandard.
// Every position and facing is an argument, every write is air-only (an earlier part's cell is left alone), and a
// helper writes only inside the cells its arguments name. Positions in the plan's absolute coordinates; the dome
// centre (cx, cz) is a half-integer, 31.5 in the plan.

/** ground(g, x0, z0, x1, z1): smooth_stone at y 0 over the plot. */
export function ground(g, x0, z0, x1, z1)

/** terraceAndFloor(g, F, u0, u1, p, dBack, y): one smooth_stone course at y, from d p to dBack. The front cell (d p) is
 *  the string course rusticatedBase already placed, so the air-only write leaves it. */
export function terraceAndFloor(g, F, u0, u1, p, dBack, y)

/** attic(g, F, u0, u1, a, y0, y1, { windows, wy, over }): polished_diorite at d a..a+1, y0..y1. windows: [[u0, u1], ...]
 *  open at the rows wy ([lo, hi]); an open cell leaves d a air and d a+1 empty for the glass. over lets it replace filled cells. */
export function attic(g, F, u0, u1, a, y0, y1, { windows = [], wy = [], over = false } = {})

/** doricColumn(g, x0, z0, y0, y1): a 2x2 column on x0..x0+1, z0..z0+1: polished_diorite foot at y0, quartz_pillar shafts
 *  (axis y) to y1-1, smooth_quartz capital at y1. */
export function doricColumn(g, x0, z0, y0, y1)

/** cornice(g, F, u0, u1, d, y, { shapes }): smooth_quartz_stairs, half top, facing into the wall, along u at depth d.
 *  shapes: { [u]: "outer_left" | "outer_right" } for a corner cell where two faces meet. */
export function cornice(g, F, u0, u1, d, y, { shapes = {} } = {})

/** upperSills(g, F, u0, w, yLo, yHi): two cells from u0 at d w-1: a bottom slab at yLo (on the terrace) and a top slab at yHi. */
export function upperSills(g, F, u0, w, yLo, yHi)

/** archedDoorway(g, F, u0, yG): one arch, u0..u0+3 by d 0..3, with its landing at yG (the ground, 1 in the plan).
 *  Two pairs of dark_oak_door (hinges left, right, left, right) at d 3, y yG+1..yG+2; transom glass at y yG+3..yG+6; a
 *  smooth_quartz head course over the passage at yG+7 with chiseled keystones. The passage above the landing stays air. */
export function archedDoorway(g, F, u0, yG)

/** drumWindow(g, cx, cz, angleDeg, width, yG = 44): one window in the drum (plan rule 24). Axis at angleDeg (0 = north,
 *  clockwise), cells within ±width/2 of it. Glass on the inner wall cells for y yG..yG+13 (outer cells stay air), a sill
 *  at yG-1, a round head at yG+14 on the edge cells, a pediment hood at yG+15 with a slab over the middle at yG+16. */
export function drumWindow(g, cx, cz, angleDeg, width, yG = 44)

/** lanternTemple(g, cx, cz, yP): the lantern temple (plan rule 27) on the platform at yP (101 in the plan): platform,
 *  eight posts with gold capitals, a glass ring, a ceiling, a gilded cupola and a finial. Hanging lanterns under the ceiling. */
export function lanternTemple(g, cx, cz, yP)

/** lampStandard(g, x, y, z): a 1x1 lamp on the floor at y: polished_diorite foot, diorite_wall shaft at y+1..y+2 and a
 *  standing lantern at y+3. Writes only its own column, so the cells beside it stay clear for a 2-high lane. */
export function lampStandard(g, x, y, z)
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
