# Main Post, Presidio of San Francisco: architect's plan

All coordinates are BUILD coordinates (one file, x 0..93). A module's local coordinates = build x minus its plot's x0.
Every module is square to the grid: long axis along x, **FRONT faces SOUTH (+z, high z)**, as the brief and the plot
layout require (the template's "front faces north" does not apply: the porches are at high z). Exterior kit: no rooms.

## SITE

- Flat. y 0 = a 1-block ground course of `smooth_stone` under each building's footprint, porches and the Officers'
  Club arcade/courtyard; every other y 0 cell is AIR (the world's grass is under it: a person outside stands at y 0).
- Lawn (the Main Parade Ground) lies to the south of every plot; walks come in from +z.
- One door rule for every module: the porch/floor surface is the y 0 course (feet at y 1); a single row of bottom
  slabs at y 0 in front of the door is the half step from the lawn (rise 1).
- Storey grid shared by the three brick buildings (0.5 block/m): y 1 water table + door sills, storey 1 windows y 2..3,
  y 4 floor band, storey 2 windows y 5..6, y 7 floor band, storey 3 windows y 8..9, roof from y 10.

### Plot 0: Walt Disney Family Museum (x 0..23, z 0..19, max y 13)

| mass | x | y | z |
|---|---|---|---|
| brick main block (walls 1 thick) | 0..23 | 1..9 | 7..14 |
| hipped roof (with dormers, chimneys) | 0..23 | 10..13 | 7..14 |
| white eave cornice (front + back) | 0..23 | 9 | 6 and 15 |
| two-storey porch: deck | 0..23 | 0 | 15..17 |
| porch: lower posts / gallery beam+deck | posts at x 1,5,9,14,18,22 | 1..3 / 4 | 17 (deck 15..17) |
| porch: upper posts / porch roof | same x | 5..6 / 7 | 17 (roof 15..17) |
| entrance ramp (wide, centre) | 10..13 | 0 (bottom slabs) | 18 |
| ramp handrails (black) | 9 and 14 | 0..1 | 18 |
| glass pavilion (modern addition) | 2..21 | 1..6, roof 7 | 1..6 (joins brick back wall z 7) |
| shrubs / lawn edge | 0..8 and 15..23 | 0..1 | 18..19 |
| red banner panels (porch) | 2..7 "DISNEY", 16..21 "MUSEUM" | hang 3..4 | 18 (on the beam at z 17) |

### Plot 1: Montgomery Street barracks (x 24..49, z 0..17, max y 13)

| mass | x | y | z |
|---|---|---|---|
| brick main block | 24..49 | 1..9 | 6..13 |
| hipped roof | 24..49 | 10..13 | 6..13 |
| white eave cornice | 24..49 | 9 | 5 (between wings: x 31..42) and 14 |
| two-storey porch: deck | 24..49 | 0 | 14..16 |
| porch posts (lower 1..3, upper 5..6) | 25, 30, 34, 39, 43, 48 | 1..6 | 16 |
| gallery beam/deck, porch roof | 24..49 | 4 and 7 | 14..16 |
| entrance ramp | 35..38 | 0 | 17 |
| ramp handrails | 34 and 39 | 0..1 | 17 |
| west rear wing (brick) | 24..30 | 1..6 | 0..5 |
| east rear wing (brick) | 43..49 | 1..6 | 0..5 |
| wing hipped roofs | wing x | 7..10 | 0..5 |

### Plot 2: Presidio Officers' Club (x 50..77, z 0..25, max y 10)

| mass | x | y | z |
|---|---|---|---|
| main range, the Comandancia (white stucco; front wall 2 thick z 16..17) | 51..75 | 1..6 | 9..17 |
| range roof (low gable, ridge along x) | 50..76 | 7..9 | 8..18 |
| entrance gable block (front wall 2 thick z 20..21) | 59..67 | 1..7 | 16..21 |
| gable block roof (gable to the lawn, ridge along z at x 63) | 58..68 | 8..10 | 16..22 |
| west arcade | 51..58 | piers 1..3, beam 4, roof 5..6 | 18..21 |
| east arcade | 68..75 | same | 18..21 |
| west rear wing | 51..57 | 1..4, roof 5..7 | 1..8 |
| east rear wing | 69..75 | 1..4, roof 5..7 | 1..8 |
| courtyard (paved y 0, open to sky) | 58..68 | 0 | 1..8 |
| courtyard back wall with arched gate | 58..68 | 1..2, coping 3 | 1 |
| entrance ramp | 62..64 | 0 (bottom slabs) | 22..23 |
| bronze cannons (pointing south) | barrels at x 59 and x 67 | 0 | 23..25 |

### Plot 3: Presidio Visitor Center, Building 210 (x 78..93, z 0..9, max y 9)

| mass | x | y | z |
|---|---|---|---|
| brick block (1½ storeys) | 79..92 | 1..4 | 1..6 |
| hipped roof | 78..93 | 5..8 | 0..7 |
| front dormer | 84..87 | 5..7, lid 8 | 4..6 (+lid to 7) |
| porch deck | 80..91 | 0 | 7..8 |
| porch posts | 81, 84, 87, 90 | 1..2 | 8 |
| red sign band (fascia) | 81..90 | 3..4 | 8 |
| porch roof (continues the main eave) | 80..91 | 5 | 8..9 |
| entrance ramp | 84..87 | 0 (bottom slabs) | 9 |
| flagpole | 93 | 0..8, finial 9 | 9 |
| flag (flies north along the pole's side) | 93 | 7..8 | 7..8 |

## ROOFS

| roof | form / tool | y, pitch, ridge | overhang | notes |
|---|---|---|---|---|
| Museum main | `$MCD roof` style `hip` (civic massing but in red, NOT the slate palette), footprint x 0..23 z 7..14 | y 10, pitch 45, peak y 13 (ridge row z 10..11 back-to-back stairs, `ridge: "none"`) | **0** all sides (plot is full width; an eave at -1 shifts the build) | the eave line is the hand-built white cornice at y 9 instead; `maxHeight` 4 |
| Barracks main | same as museum, footprint x 24..49 z 6..13 | y 10, 45, peak y 13 | 0 | identical roof language |
| Barracks wings | `hip`, footprints x 24..30 z 0..6 and x 43..49 z 0..6 (south end runs into the main wall) | y 7, 45, peak y 10 | 0 (north overhang would leave the plot at z -1) | separate roof call |
| Dormers (museum: 4 at x 3..5, 8..10, 13..15, 18..20; barracks: 4 at x 27..29, 32..34, 39..41, 44..46) | **built by hand by a part** (roof tool must `keep` their boxes air) | brick cheeks y 10..11 on face z 14 (museum) / z 13 (barracks), back to z 12 / z 11; white `smooth_quartz_slab` lid at y 12 over the dormer and 1 proud of its face | lid 1 to the front | keep boxes: x as listed, y 10..12, z 12..15 (museum) / z 11..14 (barracks) |
| Chimneys (cold stacks, roof tool `chimneys`) | museum x 5..6 & 17..18, z 7..8; barracks x 30..31 & 42..43, z 6..7 | y 10..13, `stone_bricks` band at y 12, `brick_slab` cap inside y 13 | | cannot clear the y 13 ridge: they rise out of the back slope (stated blocker: height cap) |
| Officers' Club range | `$MCD roof` preset `temple` without pediment → plain `gable`, `red-tile` look in polished granite, ridgeAxis x | y 7, pitch `half`, peak y 9 (`maxHeight` 3) | 1 all round (x 50..76, z 8..18) | gable ends white stucco (gable = `white_concrete`), thin granite-slab verge |
| Club gable block | `gable`, ridgeAxis z, front s | y 8, `half`, peak y 10 (`maxHeight` 3) | 1 (x 58..68, z to 22) | rides over the range roof: a cross gable one course higher (several heights) |
| Club arcades | **by hand**: lean-to of granite stairs facing north | z 20..21 at y 5, z 18..19 at y 6 | z 21 overhangs the piers | tuck under the range eave (range eave at z 18, y 7) |
| Club wings | `gable`, ridgeAxis z | y 5, `half`, peak y 7 | 1 (north to z 0, sides to x 50/58, 68/76) | lowest roofs of the group |
| Visitor Center | `hip`, footprint x 79..92 z 1..6 | y 5, 45, peak y 8 | 1 (x 78..93, z 0..7) | keep dormer box x 84..87 y 5..8 z 4..7 |
| Visitor Center porch roof | by hand, granite stairs facing north | y 5 at z 8..9 | | continues the main eave outward |
| Museum/barracks porch roofs | by hand, flat: white | y 7, see FACADES | | |
| Museum pavilion | flat, by hand | y 7 | 0 | |

## FACADES

### Barracks (museum and Montgomery St. barracks, identical language)

Front (south) face, base to top:
- y 0: smooth stone course (deck).
- y 1: water table `polished_andesite` (grey stone base course) the full length, broken only by the doors.
- y 2..3, 5..6, 8..9: deep red `bricks`; at the corners quoin-free (plain Army brick).
- y 4 and y 7: floor bands of `bricks` (the gallery beam and porch roof cover them on the front).
- y 9 (z = wall + 1, i.e. museum z 6 & 15, barracks z 5 & 14): white cornice = upside-down `smooth_quartz_stairs`
  facing the wall, full length (barracks rear: between the wings only). This is the white eave line of the photo.
- Windows: single 1-wide, 2-tall sash openings: `glass_pane` in the wall line, a white sill `smooth_quartz_slab` (top)
  one cell proud under each window (on the wall face at y 1/4/7 where the porch decks leave air), heads flush brick.
- Doors: paired doors in the centre bay with a glass transom above.
- Two-storey porch, all white except the floor:
  - lower posts `diorite_wall` y 1..3; gallery beam `smooth_quartz` at y 4 on the front line (fascia), the gallery
    deck `smooth_quartz_slab` (top) at y 4 over the rest of the porch depth.
  - lower front rail: black `polished_blackstone_wall` at y 1 between posts, open at the ramp bay.
  - upper gallery: railing `diorite_wall` at y 5 between posts; upper posts `diorite_wall` y 5..6.
  - porch roof y 7: `smooth_quartz` fascia on the front line, `smooth_quartz_slab` (bottom) behind it.
- Museum banners: two runs of red wall banners with white letters (`bannerWord`), "DISNEY" x 2..7 and "MUSEUM"
  x 16..21, at z 18 y 4 facing south, hung from the gallery beam, so they hang over y 3..4 in front of the lower
  porch. Plus `red_wool` panels in the end bays of the gallery: x 2..4 and x 19..21, z 17, y 5..6 in place of the
  railing (the big red banner panels of the photo, upper level).
- Ends (east/west faces): same courses, 2 windows per storey (museum z 9 and 12; barracks z 8 and 11).
- Back (north) face: same courses and window rhythm above the pavilion/wings.
- Dormers: brick (`bricks`) cheeks, a pair of panes (1 wide at museum/barracks scale: one `glass_pane` centre cell,
  y 10..11), white lid. Depth: face flush with the wall line, lid 1 proud.
- Chimneys: `bricks` 2x2 with a `stone_bricks` band at y 12, solid (cold stacks).

### Museum glass pavilion (back)

- `glass_pane` walls y 1..6 on x 2..21 / z 1..6 perimeter; dark frame `polished_blackstone` mullions every 4th cell
  (x 2, 6, 10, 13, 17, 21 on the north face; z 1, 4, 6 on the ends) and a floor band at y 4 (`polished_blackstone`).
- Flat roof y 7: `polished_blackstone_slab` deck with a `polished_blackstone` edge course. Flush, no ornament.

### Officers' Club

- Walls: `white_concrete` stucco, front walls 2 thick (outer z 17 and z 21, inner z 16 and z 20) so every front window
  is deep-set; other walls 1 thick.
- Base: y 0 smooth stone only; no water table (adobe reads plain).
- Windows: deep-set, dark: `iron_bars` grille in the OUTER wall cell, `gray_stained_glass_pane` in the inner cell.
- Front gable (z 21): centred arched entrance, two tall windows (x 60 and 66), the round window (oculus) centred
  x 63, y 8: a plus of `gray_stained_glass_pane` (x 62..64 at y 8, x 63 at y 7 and y 9) with `smooth_quartz_stairs`
  corners rounding the ring; it sits proud of nothing (flush in the stucco).
- Arcades: square white piers `white_concrete` y 1..3 at z 20 (west x 51, 54, 57; east x 69, 72, 75), arches between
  them = upside-down `smooth_quartz_stairs` at y 3 in the two cells next to each pier (x 52/53, 55/56, 70/71, 73/74;
  the 1-wide x 58 and x 68 openings get a flat `white_concrete` head at y 3), beam `white_concrete` y 4 along z 20,
  red-tile lean-to above (ROOFS).
- Range front behind the arcades: deep-set windows x 53, 55, 71, 73 at y 2..3; doors x 56 and x 70 (y 1..2).
- Gable ends of the range (x 51, x 75) and the wings: plain white, one deep-set window per storey.
- Cannons (bronze, dark): barrel = `polished_blackstone_wall` x 59 and x 67, z 23..25, y 0 (connected, a pipe), breech
  the breech end at z 23, carriage wheels = open `dark_oak_trapdoor` on
  each side (x 58/60 and x 66/68, z 24, y 0), muzzles pointing south.

### Visitor Center

- y 1 `polished_andesite` water table; walls `bricks` y 1..4; y 4 a band of `bricks` under the eave.
- Front windows (z 6): x 80, 82, 89, 91, y 2..3, white sills (`smooth_quartz_slab` top, z 7, y 1).
- Double door x 85..86, y 1..2, z 6, transom `glass_pane` y 3.
- Porch: white posts `diorite_wall` y 1..2 at z 8; fascia band `red_concrete` x 81..90, y 3..4, z 8 carrying the
  sign: `plaque` banner letters "PRESIDIO" (white on red, banners at z 9, y 4) on x 82..89; "VISITOR CENTER" as a
  `signboard` (wall) on the brick front over the door, x 84..87, y 4, z 7.
- Ends: one window per face (z 3..4), y 2..3. Back: windows x 82, 89.
- Flagpole: `iron_bars` x 93, z 9, y 0..8, `lightning_rod` y 9; flag = wool, attached to the pole on its north side:
  `blue_wool` (93, 8, 8), `red_wool` (93, 8, 7), `white_wool` (93, 7, 8), `red_wool` (93, 7, 7).

## MATERIALS

| role | block id |
|---|---|
| ground course (all modules) | `smooth_stone` |
| brick body (barracks, museum, visitor center, chimneys, dormer cheeks) | `bricks` (+ `brick_stairs`/`brick_slab`) |
| water table / base course | `polished_andesite` |
| chimney band | `stone_bricks` |
| red clay-tile roofs (all) | `polished_granite_stairs`, `polished_granite_slab`, `polished_granite` (salmon-red, reads lighter than the brick so roof and wall separate) |
| white trim: cornice, sills, beams, dormer lids, porch roofs | `smooth_quartz`, `smooth_quartz_stairs`, `smooth_quartz_slab` |
| white porch posts and gallery railing | `diorite_wall` |
| black iron rails and handrails | `polished_blackstone_wall` |
| window glass (sash) | `glass_pane` |
| Officers' Club stucco | `white_concrete` |
| Club deep-set glass / grilles | `gray_stained_glass_pane` / `iron_bars` |
| Club doors | `dark_oak_door` |
| barracks / museum / VC doors | `spruce_door` (dark wood) |
| pavilion frame / roof | `polished_blackstone`, `polished_blackstone_slab` |
| banners / sign panels | `red_wall_banner` (white letters), `red_wool`, `red_concrete` |
| cannons | `polished_blackstone_wall`, `polished_blackstone`, `dark_oak_trapdoor` |
| shrubs | `azalea_leaves`, `oak_leaves` (persistent) |
| flag | `blue_wool`, `red_wool`, `white_wool`; pole `iron_bars`, `lightning_rod` |

All checked present by `$MCD blocks --check` (no `chain`/`iron_chain`: use `iron_bars` where a chain would go). Nothing
newer than 1.21.1.

## OPENINGS

Brick walls are 1 thick; window = `glass_pane` in the wall cell. All windows 1 wide x 2 tall unless stated.

| building / face | openings |
|---|---|
| Museum front z 14 | windows x 2,4,6,8,10,13,15,17,19,21 at y 2..3, 5..6, 8..9 (10 per storey); storey-1 x 11..12 = double door y 1..2 + transom y 3 (no window there); storeys 2 and 3 at x 11..12: none (brick pier) |
| Museum back z 7 | windows same x at y 8..9 only (pavilion covers below); door x 11..12 y 1..2 into the pavilion (opening only) |
| Museum ends x 0, x 23 | windows z 9 and z 12 at y 2..3, 5..6, 8..9 |
| Museum dormers (face z 14) | glass x 4, 9, 14, 19 at y 10..11 |
| Museum pavilion | glass walls (see FACADES); door x 11..12, y 1..2 in the north face z 1 (glass doors: `glass_pane` frame left open for a part) |
| Barracks front z 13 | windows x 26,28,30,32,34,39,41,43,45,47 at y 2..3, 5..6, 8..9; double door x 36..37 y 1..2 + transom y 3 |
| Barracks back z 6 (x 31..42 between wings) | windows x 32, 34, 39, 41 at y 2..3, 5..6, 8..9; back door x 36..37 y 1..2 |
| Barracks wings | north faces z 0: windows x 26, 28 / x 45, 47 at y 2..3 and 5..6; outer ends x 24 / x 49: z 2 and 4 same rows |
| Barracks ends x 24, 49 (main block above wings) | windows z 8 and z 11 at y 8..9 (and y 2..3, 5..6 on z 8..13 face portions outside the wings) |
| Barracks dormers (face z 13) | glass x 28, 33, 40, 45 at y 10..11 |
| Club gable block z 21 | arched entrance x 62..64, y 1..3 open (arch: upside-down `smooth_quartz_stairs` at x 62 and 64, y 3); door `dark_oak_door` x 63, z 20, y 1..2; windows x 60 and x 66, y 2..4 deep-set; oculus around (63, 8) |
| Club range front | windows x 53, 55, 71, 73, y 2..3; doors x 56 and x 70, y 1..2 (in z 17, inner cell z 16 open) |
| Club range back z 9 | courtyard door x 63, y 1..2; windows x 60, 66 at y 2..3 |
| Club wings | courtyard faces (x 57, x 69): windows z 3, 6 at y 2..3; outer faces x 51 / x 75 the same |
| Club courtyard gate | x 62..64, y 1..2 in the wall z 1 |
| Visitor Center | door x 85..86 y 1..2 z 6, transom y 3; windows (see FACADES); dormer glass x 85..86, y 6, z 6 |

## RESERVED

Cells the shell leaves AIR (a later part fills them):
- Every window and door cell above, and the transoms.
- Dormer boxes (roof must `keep` them): museum x 3..5, 8..10, 13..15, 18..20, y 10..12, z 12..15; barracks x 27..29,
  32..34, 39..41, 44..46, y 10..12, z 11..14; Visitor Center x 84..87, y 5..8, z 4..7.
- Chimney stacks (roof `keep`): museum x 5..6 & 17..18, z 7..8, y 10..13; barracks x 30..31 & 42..43, z 6..7, y 10..13.
- Banner cells: museum z 18, y 4, x 2..7 and 16..21; Visitor Center z 9, y 4, x 82..89.
- Ramps (bottom slabs) and handrails: museum x 9..14 z 18; barracks x 34..39 z 17; club x 62..64 z 22..23;
  Visitor Center x 84..87 z 9.
- Club oculus ring x 62..64, y 7..9, z 21 and the cannon cells x 58..60 / 66..68, z 23..25, y 0.
- Courtyard centre x 62..64, z 4..6 (a fountain or olive tree, garden part).
- Flagpole x 93, z 7..9, y 0..9.

## FLOORS

| building | levels (floor block y → standing y) | interior volume |
|---|---|---|
| Museum / barracks main | storey 1: floor y 0, stand y 1..3; storey 2: floor y 4, stand 5..6; storey 3: floor y 7, stand 8..9; attic under the hip y 10..12 | museum x 1..22, z 8..13; barracks x 25..48, z 7..12 |
| Museum gallery | deck y 4 (top slab), stand y 5..6 | x 0..23, z 15..17 |
| Museum pavilion | floor y 0, mezzanine floor y 4 (perimeter band), roof y 7 | x 3..20, z 2..5 |
| Barracks wings | floor y 0, upper y 4 (stand 5..6) | x 25..29 / x 44..48, z 1..5 |
| Club range | floor y 0, one tall storey stand y 1..5 | x 52..74, z 10..15 |
| Club gable block | floor y 0, hall stand y 1..6 | x 60..66, z 18..19 |
| Club wings | floor y 0, stand y 1..3 | x 52..56 / x 70..74, z 2..8 |
| Visitor Center | floor y 0, stand y 1..3; half storey in the roof y 4 floor, stand y 5..6 under the dormer | x 80..91, z 2..5 |

Light: every porch bay gets a hanging lantern under the gallery deck (y 3) and under the porch roof (y 6); the arcades a
lantern per bay under the beam; interiors lit to 8+ by the lamplighter so nothing spawns.

---
# DESIGNER'S SECTIONS

## PALETTE

All ids verified with `$MCD blocks --check` (no unknowns), 1.21.1 only. Architect's ids kept exactly.

| role | blocks (with shape variants) |
|---|---|
| ground | `smooth_stone`, `smooth_stone_slab` |
| brick wall | `bricks`, `brick_stairs`, `brick_slab` |
| base/water table | `polished_andesite`, `polished_andesite_slab` |
| chimney band | `stone_bricks` |
| red tile roof | `polished_granite`, `polished_granite_stairs`, `polished_granite_slab` |
| white trim | `smooth_quartz`, `smooth_quartz_stairs`, `smooth_quartz_slab` |
| white posts/rails | `diorite_wall` |
| black rails, cannons | `polished_blackstone_wall`, `polished_blackstone`, `polished_blackstone_slab` |
| glass | `glass_pane`, `gray_stained_glass_pane`, `iron_bars` |
| stucco | `white_concrete` |
| doors | `spruce_door` (barracks/museum/VC), `dark_oak_door` (club), `dark_oak_trapdoor` |
| red signs | `red_wall_banner`, `red_wool`, `red_concrete`, `blue_wool`, `white_wool` |
| plants | `azalea_leaves`, `oak_leaves`, `oak_log` (persistent leaves) |
| light | `lantern` (hanging true/false), `lightning_rod` (flag finial) |

## VOCABULARY

All helpers take `g` (grid) and write absolute build coordinates; they never write outside their plot.

- `groundCourse(g, x0, z0, x1, z1)`: fill y 0 with `smooth_stone`.
- `brickBlock(g, x0,z0,x1,z1, {y1:9|4})`: hollow shell of `bricks` y1..top, y1 row `polished_andesite`, `bricks` bands at y4 and y7 (barracks); leaves openings from the OPENINGS table as air.
- `cornice(g, x0,x1,z, face)`: upside-down `smooth_quartz_stairs` at y9, `facing` toward the wall (north for z south of wall... i.e. facing = the wall side), `half: top`.
- `sashWindow(g, x, y, z, face)`: `glass_pane` at (x,y,z),(x,y+1,z) connected states set; sill `smooth_quartz_slab` type top at (x,y-1,z+1) on the south face if the cell is air, else skip.
- `doubleDoor(g, x, z, facing, wood)`: two doors `half lower/upper`, hinges left/right, same facing out; `glass_pane` transom at y3 both cells.
- `porchBay(g, x, z0, z2)`: `diorite_wall` post at (x,1..3,z2) and (x,5..6,z2), rail `diorite_wall` y5 between posts at z2, gallery beam `smooth_quartz` y4 z2, deck `smooth_quartz_slab` top y4 z0..z1, roof `smooth_quartz` y7 z2, `smooth_quartz_slab` bottom y7 z0..z1; lower rail `polished_blackstone_wall` y1 between posts (open at ramp bay).
- `ramp(g, x0,x1,z)`: `smooth_stone_slab` type bottom at y0 across x0..x1 (the half step), level approach.
- `handrail(g, x, z0, z1)`: `polished_blackstone_wall` y0..1.
- `bannerRun(g, text, x0, x1, z, y)`: `bannerWord` red base, white letters, face south; plus `red_wool` panel block.
- `dormer(g, x0, x2, zFace, depth)`: brick cheeks (x0 and x2) y10..11 from zFace back `depth`, brick back wall, centre `glass_pane` y10..11, `smooth_quartz_slab` lid y12 spanning x0..x2, extending 1 to the front.
- `stack(g, x, z)`: 2x2 `bricks` y10..13, `stone_bricks` at y12, top ring `brick_slab` cap y13 (cold stack, no fire).
- `pavilion(g)`: perimeter `glass_pane` with `polished_blackstone` mullions, y4 band, roof `polished_blackstone_slab` + edge course.
- `stuccoWall(g, box, thick)`: `white_concrete` shell; double thickness on the front walls.
- `arcadeBay(g, xPier0, xPier1)`: piers `white_concrete` y1..3 z20, arch stairs upside-down `smooth_quartz_stairs` y3 facing each side, flat head where 1 wide, beam y4.
- `leanTo(g, x0,x1,z0,z1,y)`: `polished_granite_stairs` facing north stepping up.
- `oculus(g, cx, cy, z)`: plus of `gray_stained_glass_pane`, `smooth_quartz_stairs` corners.
- `grilleWindow(g, x, y, z, depth)`: `iron_bars` outer cell, `gray_stained_glass_pane` inner cell, 1x2.
- `cannon(g, x, z)`: wall barrel z+0..2, breech `polished_blackstone`, open `dark_oak_trapdoor` wheels either side, y0.
- `flagpole(g)`: `iron_bars` x93 z9 y0..8, `lightning_rod` y9, 4 wool flag cells.
- `shrub(g, x, z)`: `oak_leaves`/`azalea_leaves` persistent true, y0 (on ground y0) and y1 mix.
- `hangLantern(g, x, y, z)`: `lantern` hanging true under a solid/slab (beam above).
- `courtyardTree(g, x, z)`: `oak_log` 4 high, persistent `oak_leaves` crown.

## ROOMS

Exterior kit: no rooms. Interior volumes are left empty (architect's FLOORS). Nothing spawn-prone: part P6 puts a `lantern` or light source every ~5 cells in each interior volume (floor y0 upper floors included) so light reaches 8+... interiors are left as thin shell; place one hanging lantern per 6x6 area under the ceiling.

## PARTS

1. **Brick shells and pavilion** (`parts/shells.mjs`, mason): groundCourse for plots 0,1,3; museum block, barracks block + wings, VC block, water table, bands, cornice, pavilion, all openings left air.
2. **Officers' Club shell** (`parts/club.mjs`, stonemason): ground, range, gable block, wings, arcade piers/arches, courtyard + back wall + gate, oculus, openings left air.
3. **Roofs, dormers, chimneys** (`parts/roofs.mjs`, roofer + chimney builder): roof.json for all roofs per ROOFS (granite palette, keep boxes for dormers/stacks), arcade lean-tos, VC porch roof, dormer(), stack().
4. **Porches, ramps, banners** (`parts/porches.mjs`, joiner): porchBay across museum and barracks, VC porch posts and deck, ramps and handrails, bannerRun, red_wool panels.
5. **Glazing, doors, signs, cannons, flag** (`parts/fittings.mjs`, glazier, sign writer): sashWindow, grilleWindow, doubleDoor, archDoor, oculus panes, VC sign + signboard, cannon, flagpole.
6. **Grounds and light** (`parts/grounds.mjs`, gardener, lamplighter): shrubs, lawn edge, courtyard tree, hangLantern at porch bays, arcades, doors, interior lanterns.

Checklist: [x] P1 [ ] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6

## NOTES

- Front faces SOUTH (high z). Everything inside the plot. Don't lift roofs above max y (13/13/10/9).
- Roof overhang 0 on museum/barracks (an eave at -1 shifts the build).
- Leave RESERVED cells air until their part fills them; check `$MCD check` and `$MCD approach` for ramps.
- Nothing newer than 1.21.1.
