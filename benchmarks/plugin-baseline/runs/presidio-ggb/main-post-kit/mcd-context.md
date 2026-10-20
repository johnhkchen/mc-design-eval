# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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

Checklist: [ ] P1 [ ] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6

## NOTES

- Front faces SOUTH (high z). Everything inside the plot. Don't lift roofs above max y (13/13/10/9).
- Roof overhang 0 on museum/barracks (an eave at -1 shifts the build).
- Leave RESERVED cells air until their part fills them; check `$MCD check` and `$MCD approach` for ramps.
- Nothing newer than 1.21.1.
```

### elements.md

```markdown
# Required elements: Main Post kit (coordinates are BUILD coordinates from plan.md)

Parts: P1 brick shells, P2 club shell, P3 roofs and dormers/chimneys, P4 porches/ramps/banners, P5 glazing/doors/signs/cannons/flag, P6 grounds and light.
Vocab names are defined in plan.md VOCABULARY.

| # | element | construction, block by block | coords | part | vocab |
|---|---|---|---|---|---|
| 1 | ground course | `smooth_stone` y 0 under each footprint, porches, arcades, courtyard; all else y 0 air | all modules | P1,P2 | groundCourse |
| 2 | museum brick block | `bricks` walls 1 thick y 1..9, `polished_andesite` water table y 1, bands `bricks` y 4, 7 | x0..23 z7..14 | P1 | brickBlock |
| 3 | raised basement, small windows | y1 water table row; small 1x1 panes at y 1 only where the architect's openings say (none extra: y1 stays andesite except doors) | front/back | P1,P5 | brickBlock |
| 4 | museum 10 sash windows per storey | `glass_pane` 1x2 at y2..3, 5..6, 8..9 on the architect's x list; `smooth_quartz_slab` top sill one proud | z14 | P5 | sashWindow |
| 5 | white eave cornice | upside-down `smooth_quartz_stairs` facing the wall, y9, z6 and z15 (barracks z5/z14) | full length | P1 | cornice |
| 6 | steep red hipped roof | roof tool `hip` pitch 45, `polished_granite` stairs/slab/block, y10..13, overhang 0 | museum x0..23 z7..14 | P3 | roof.json |
| 7 | 4 museum dormers | brick cheeks y10..11, glass_pane centre, `smooth_quartz_slab` lid y12 one proud | x3..5,8..10,13..15,18..20 | P3 | dormer |
| 8 | 2 brick chimneys | `bricks` 2x2 y10..13, `stone_bricks` band y12, `brick_slab` cap y13, cold stacks | x5..6, 17..18 z7..8 | P3 | stack |
| 9 | museum two-storey white porch | `diorite_wall` posts y1..3 and 5..6, `smooth_quartz` beam y4 front line, `smooth_quartz_slab` top deck y4 behind, rail `diorite_wall` y5, roof `smooth_quartz` y7 front + bottom slabs behind | x0..23 z15..17, posts x1,5,9,14,18,22 | P4 | porchBay |
| 10 | porch black rail, ramp, handrails | bottom `smooth_quartz_slab`/smooth_stone slabs y0 ramp x10..13 z18, `polished_blackstone_wall` rails x9,x14 y0..1 | z18 | P4 | ramp, handrail |
| 11 | two red museum banners | `bannerWord` "DISNEY" x2..7, "MUSEUM" x16..21, `red_wall_banner` white letters z18 y4 facing south; `red_wool` panels x2..4, 19..21 z17 y5..6 | z17/18 | P4 | bannerRun |
| 12 | museum glass pavilion (back) | `glass_pane` walls y1..6, `polished_blackstone` mullions and y4 band, `polished_blackstone_slab` roof y7 with edge course | x2..21 z1..6 | P1 | pavilion |
| 13 | museum entrance doors | paired `spruce_door` x11..12 y1..2 z14, transom `glass_pane` y3 | z14 | P5 | doubleDoor |
| 14 | lawn edge, shrubs | `azalea_leaves`/`oak_leaves` persistent y0..1 x0..8, 15..23 z18..19; `grass_block` not placed (y0 stays air) | z18..19 | P6 | shrub |
| 15 | barracks block, wings | same language, x24..49 z6..13 and wings x24..30, x43..49 z0..5; roofs main hip + wing hips | plot 1 | P1,P3 | brickBlock |
| 16 | barracks porch, ramp, doors | as 9, 10, 13; posts x25,30,34,39,43,48; ramp x35..38 z17, rails x34, 39 | z14..17 | P4,P5 | porchBay |
| 17 | barracks dormers, chimneys | as 7, 8 at x27..29,32..34,39..41,44..46; stacks x30..31, 42..43 z6..7 | | P3 | dormer, stack |
| 18 | Officers' Club stucco walls | `white_concrete`, front walls 2 thick z16..17 and z20..21 | plot 2 | P2 | stuccoWall |
| 19 | club red-tile roofs at several heights | range gable y7..9, cross gable y8..10, wings y5..7, arcade lean-tos; `polished_granite` stairs/slabs, white gable ends | | P3 | roof.json, leanTo |
| 20 | oculus (round window) | plus of `gray_stained_glass_pane` x62..64 y8, x63 y7,y9, `smooth_quartz_stairs` corners, z21 | (63,8,21) | P2 | oculus |
| 21 | deep-set windows with iron grilles | `iron_bars` outer cell, `gray_stained_glass_pane` inner cell | architect list | P5 | grilleWindow |
| 22 | arcade, white piers and arches | `white_concrete` piers y1..3 z20, upside-down `smooth_quartz_stairs` arches y3, beam y4 | x51..58, 68..75 | P2 | arcadeBay |
| 23 | arched entrance and door | `dark_oak_door` x63 z20 y1..2; arch stairs x62, 64 y3 | z20..21 | P2,P5 | archDoor |
| 24 | two bronze cannons | `polished_blackstone_wall` barrel z23..25 y0, breech `polished_blackstone` z23... muzzle south, open `dark_oak_trapdoor` wheels x58/60, 66/68 z24 | x59, x67 | P5 | cannon |
| 25 | courtyard | smooth_stone paving y0, back wall z1 with arched gate x62..64, centre planting (oak tree/azalea) x62..64 z4..6 | x58..68 z1..8 | P2,P6 | courtyardTree |
| 26 | Visitor Center | `bricks` y1..4 z1..6, andesite y1 table, hip roof y5..8 overhang 1, dormer x84..87, porch posts `diorite_wall` x81,84,87,90 | plot 3 | P1,P3,P4 | brickBlock |
| 27 | VC red sign panel | `red_concrete` band x81..90 y3..4 z8, "PRESIDIO" banner letters white on red z9 y4 x82..89, `signboard` "VISITOR CENTER" x84..87 y4 z7 | | P5 | plaque |
| 28 | flagpole and flag | `iron_bars` x93 z9 y0..8, `lightning_rod` y9; wool flag at (93,7..8,7..8) | | P5 | flagpole |
| 29 | lighting | `lantern` hanging under gallery deck y3 and porch roof y6 per bay; arcade lantern per bay y3; lanterns by doors; light >=8 in lit spots, no dark cell | | P6 | hangLantern |
| 30 | accessible approaches | bottom slabs y0 in the ramp cells listed in RESERVED | | P4,P5 | ramp |
```

### rooms.json

```json
{"entrance":[12,1,15],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "ground": ["smooth_stone", "smooth_stone_slab"],
    "brick_wall": ["bricks", "brick_stairs", "brick_slab"],
    "base": ["polished_andesite", "polished_andesite_slab"],
    "chimney_band": ["stone_bricks"],
    "red_tile_roof": ["polished_granite", "polished_granite_stairs", "polished_granite_slab"],
    "white_trim": ["smooth_quartz", "smooth_quartz_stairs", "smooth_quartz_slab"],
    "white_post_rail": ["diorite_wall"],
    "black_rail_cannon": ["polished_blackstone_wall", "polished_blackstone", "polished_blackstone_slab"],
    "glass": ["glass_pane", "gray_stained_glass_pane", "iron_bars"],
    "stucco": ["white_concrete"],
    "doors": ["spruce_door", "dark_oak_door", "dark_oak_trapdoor"],
    "red_sign": ["red_wall_banner", "red_wool", "red_concrete", "blue_wool", "white_wool"],
    "plants": ["azalea_leaves", "oak_leaves", "oak_log"],
    "light": ["lantern", "lightning_rod"]
  },
  "objects": []
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: node build.mjs writes a temp file, which then replaces build.nbt.
set -eu
cd "$(dirname "$0")"
tmp=$(mktemp ./.build.XXXXXX)
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv -f "$tmp" build.nbt
```

### build.mjs

```js
// Main Post build: makes the site grid, runs the six parts in plan.md order, saves the .nbt given as argv[2].
// Run from this directory (make.sh does): palette.json and roof.json are read from the working directory.
// The y0 ground is laid by the parts (plan.md SITE: groundCourse per plot), so the grid starts as air.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

// the parts, in the order the plan builds them; a part whose file is not written yet is skipped with a note
const here = dirname(fileURLToPath(import.meta.url));
const PARTS = [
  ["Brick shells and pavilion", "parts/shells.mjs"],
  ["Officers' Club shell", "parts/club.mjs"],
  ["Roofs, dormers, chimneys", "parts/roofs.mjs"],
  ["Porches, ramps, banners", "parts/porches.mjs"],
  ["Glazing, doors, signs, cannons, flag", "parts/fittings.mjs"],
  ["Grounds and light", "parts/grounds.mjs"],
];
const list = [];
for (const [name, module] of PARTS) {
  if (!existsSync(join(here, module))) {
    console.log(`part ${name}: ${module} not written yet, skipped`);
    continue;
  }
  const part = await import(join(here, module));
  list.push([name, part.build]);
}

// the roof is fitted to the shell's walls (above y0), so it is laid only once the first part builds some; a stub
// shell (or a copy without one) has no walls to fit and the roof waits, instead of failing the build
const probe = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
if (list.length) list[0][1](probe);
const roof = [...probe].some((c) => c.pos[1] >= 1) ? "roof.json" : undefined;

// the full site grid (1.21.1 data version: the server's)
const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });

runParts(g, list, { palette: "palette.json", roof });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Palette ids (palette.json only), plan.md site coordinates, and a seeded rng for the Main Post build.

// ---- site: plan.md SITE (build coordinates: x 0..93, y 0..13, z 0..25) ----------------------------------------------

// ---- site: plan.md SITE (build coordinates: x 0..93, y 0..13, z 0..25) ----------------------------------------------
/** Full site grid size [x, y, z] (x 0..93, y 0..13, z 0..25). */
export const SITE_SIZE = [94, 14, 26];

/** Ground course level: the smooth_stone course under each footprint (laid by the parts, see plan.md SITE). */
export const GROUND_Y = 0;

/** Plot rectangles [x0, z0, x1, z1], inclusive: museum, barracks, Officers' Club, Visitor Center. */
export const PLOT_RECTS = { museum: [0, 0, 23, 19], barracks: [24, 0, 49, 17], club: [50, 0, 77, 25], visitorCenter: [78, 0, 93, 9] };

/** Max build height per plot (museum, barracks, club, visitor center): the roof must stay at or below these. */
export const MAX_Y = { museum: 13, barracks: 13, club: 10, visitorCenter: 9 };

/** Water table and door sill course (y 1), shared by the three brick buildings. */
export const WATER_TABLE_Y = 1;

/** Lower floor band of the brick buildings (y 4). */
export const BAND_LOW_Y = 4;

/** Upper floor band of the brick buildings (y 7). */
export const BAND_HIGH_Y = 7;

/** White eave cornice course (y 9). */
export const CORNICE_Y = 9;

/** First roof course of the brick buildings (y 10). */
export const ROOF_BASE_Y = 10;

// ---- palette: plan.md PALETTE, one constant per block id -------------------------------------------------------------
/** Ground course block (plot foundations, porch decks). */
export const SMOOTH_STONE = "smooth_stone";

/** Ground course bottom slab: the half step in front of each door. */
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";

/** Brick body of the barracks, museum, Visitor Center, chimneys and dormer cheeks. */
export const BRICKS = "bricks";

/** Brick stairs (brick body detail). */
export const BRICK_STAIRS = "brick_stairs";

/** Brick slab (chimney caps, brick detail). */
export const BRICK_SLAB = "brick_slab";

/** Water table and base course. */
export const POLISHED_ANDESITE = "polished_andesite";

/** Base course slab. */
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";

/** Chimney band. */
export const STONE_BRICKS = "stone_bricks";

/** Red clay-tile roof block (salmon-red granite). */
export const POLISHED_GRANITE = "polished_granite";

/** Red clay-tile roof stairs. */
export const POLISHED_GRANITE_STAIRS = "polished_granite_stairs";

/** Red clay-tile roof slab. */
export const POLISHED_GRANITE_SLAB = "polished_granite_slab";

/** White trim: cornice fascia, beams, dormer lids, porch roof fascia. */
export const SMOOTH_QUARTZ = "smooth_quartz";

/** White trim stairs: upside-down cornice and arch stairs. */
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";

/** White trim slab: sills, gallery deck, dormer lids. */
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";

/** White porch posts and gallery railing. */
export const DIORITE_WALL = "diorite_wall";

/** Black iron rails and handrails. */
export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall";

/** Dark frame block (pavilion mullions, cannon breech). */
export const POLISHED_BLACKSTONE = "polished_blackstone";

/** Dark frame slab (pavilion roof deck). */
export const POLISHED_BLACKSTONE_SLAB = "polished_blackstone_slab";

/** Window glass (sash). */
export const GLASS_PANE = "glass_pane";

/** Deep-set dark glass in the Officers' Club. */
export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";

/** Grille bars in the Officers' Club outer windows, and the flagpole. */
export const IRON_BARS = "iron_bars";

/** Officers' Club stucco. */
export const WHITE_CONCRETE = "white_concrete";

/** Dark wood doors of the barracks, museum and Visitor Center. */
export const SPRUCE_DOOR = "spruce_door";

/** Dark oak doors of the Officers' Club. */
export const DARK_OAK_DOOR = "dark_oak_door";

/** Open cannon carriage wheels. */
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";

/** Banner with white letters (museum DISNEY and MUSEUM runs). */
export const RED_WALL_BANNER = "red_wall_banner";

/** Red panels and flag field. */
export const RED_WOOL = "red_wool";

/** Red sign band (Visitor Center fascia). */
export const RED_CONCRETE = "red_concrete";

/** Flag canton. */
export const BLUE_WOOL = "blue_wool";

/** Flag star field. */
export const WHITE_WOOL = "white_wool";

/** Persistent shrub leaves. */
export const AZALEA_LEAVES = "azalea_leaves";

/** Persistent shrub and crown leaves. */
export const OAK_LEAVES = "oak_leaves";

/** Courtyard tree trunk. */
export const OAK_LOG = "oak_log";

/** Hanging porch, arcade and interior light. */
export const LANTERN = "lantern";

/** Flagpole finial. */
export const LIGHTNING_ROD = "lightning_rod";

// ---- rng --------------------------------------------------------------------------------------------------------------
/** rng(seed): returns a function giving floats in [0, 1); the same seed always gives the same sequence (mulberry32). */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Main Post kit, helper set h1 (plan.md VOCABULARY): groundCourse, sashWindow, ramp, dormer, stuccoWall, oculus,
// flagpole, courtyardTree. Build coordinates, front faces south (+z).
// Every helper takes its position as arguments, writes only inside its own footprint (an inclusive box), and only
// into air unless opts.over is set. Returns { placed, refused }: refused lists the cells it left alone.

/** Ground course: smooth_stone over y 0 from (x0,z0) to (x1,z1), inclusive. */
export function groundCourse(g, x0, z0, x1, z1, opts = {})

/**
 * Sash window: two glass_pane cells at (x, y..y+1, z) in the wall on `face`, and a smooth_quartz_slab sill (top half)
 * one cell proud of the wall under it, at y-1. The sill is skipped when its cell is not air.
 */
export function sashWindow(g, x, y, z, face = "south", opts = {})

/**
 * Ramp: a single row of bottom smooth_stone_slabs at y 0 across x0..x1 on row z, the half step up from the lawn.
 */
export function ramp(g, x0, x1, z, opts = {})

/**
 * Dormer: brick cheeks at x0 and x2 and a brick back wall at zFace-depth (y 10..11, or opts.y), a centre glass_pane
 * on the front face zFace, and a smooth_quartz_slab lid at y+2 spanning x0..x2 that runs one cell proud of the face.
 * The front faces south (+z), so the dormer runs from zFace back to zFace-depth.
 */
export function dormer(g, x0, x2, zFace, depth, opts = {})

/**
 * Stucco wall: a white_concrete shell over the box [x0,y0,z0,x1,y1,z1] (walls only, the inside is left air). Walls are
 * `thick` cells thick, and the front walls (high z) twice that. Cells listed in opts.open ([x,y,z] each) stay air, for
 * the openings the shell leaves. Pass y0 = 1 so the ground course at y 0 is not touched.
 */
export function stuccoWall(g, [x0, y0, z0, x1, y1, z1], thick = 1, opts = {})

/**
 * Oculus: a round window in the plane z, centred on (cx, cy): a plus of gray_stained_glass_pane, and smooth_quartz_stairs
 * at the four corners, backs to the stucco, upper corners upside down.
 */
export function oculus(g, cx, cy, z, opts = {})

/**
 * Flagpole on the pole cell (x, z): iron_bars from y 0 to 8, a lightning_rod finial at y 9, and a 2x2 wool flag on the
 * north side (z-1 and z-2) at y 7..8. The flag is white, red and blue as in plan.md.
 */
export function flagpole(g, x, z, opts = {})

/**
 * Courtyard tree at (x, z): oak_log trunk at y 1..4 on the paving, and a persistent oak_leaves crown at y 3..6 that
 * stays inside x-1..x+1, z-1..z+1.
 */
export function courtyardTree(g, x, z, opts = {})
```

### vocab/h2.mjs

```js
// Helpers from plan.md VOCABULARY (part P1/P2/P4/P5/P6 pieces): brickBlock, doubleDoor, handrail, stack, arcadeBay,
// grilleWindow, shrub. Every helper takes its own position (and facing) and writes only its own footprint.
// Returns { placed, refused } as h1 does, but all-or-nothing: if any cell of the footprint is out of bounds or not air
// (`{ over: true }` writes over non-air cells too), nothing is written, placed is 0 and refused lists the blocking cells.
// Throws only on bad arguments. Block ids and states are the plan's PALETTE, checked for 1.21.1.

/**
 * A hollow brick shell: the ring of the box x0..x1, z0..z1 from y 1 up to the top course `y1` (9 or 4 in plan.md; the
 * spec's option key, so it is the TOP course, not the water table). y 1 is the polished_andesite water table, the rest
 * bricks. The floor bands at y 4 and 7 are the wall material, so they fall out of the ring. The interior is not touched.
 * `holes`: [x, y, z] cells the OPENINGS table leaves air (windows, doors, transoms); they are skipped, so a door or
 * window placed afterwards finds air there.
 */
export function brickBlock(g, x0, z0, x1, z1, { y1: top = 9, holes = [], over = false } = {})

/**
 * A pair of doors in one opening. The leaves are at (x, z) and one cell further along the wall (+x for a north or
 * south facing, +z for east or west): lower and upper halves at y 1..2, a glass_pane transom at y 3 in both cells.
 * `facing` is the way the doors face OUT (the outward normal, as a vanilla door placed from outside). Seen from
 * outside, the left leaf gets hinge "left" and the right leaf "right", so each swings from its outer edge.
 */
export function doubleDoor(g, x, z, facing, wood = "spruce", { over = false } = {})

/**
 * A black handrail run at column x from z0 to z1 (inclusive): polished_blackstone_wall two high (y 0..1), joined
 * along z to its neighbours in the run. Posts stand on the lawn at y 0; nothing is written under them.
 */
export function handrail(g, x, z0, z1, { over = false } = {})

/**
 * A cold brick stack, 2 x 2 at x..x+1, z..z+1, rising y 10..13: bricks at y 10..11, a stone_bricks band at y 12, and a
 * bottom brick_slab cap in y 13 (it sits on the band, so it is supported). Solid: no fire, no flue.
 */
export function stack(g, x, z, { over = false } = {})

/**
 * One arcade bay in the wall plane z: white_concrete piers at xPier0 and xPier1 (y 1..3), a white_concrete beam at y 4
 * from pier to pier, and an arch of upside-down smooth_quartz_stairs at y 3 in the cells between. The first gap cell
 * faces the west pier and the last faces the east pier (the stairs' back springs from the pier). A one-cell gap gets a
 * flat white_concrete head; any middle cell of a wider gap gets one too. The openings at y 1..2 are left air.
 */
export function arcadeBay(g, xPier0, xPier1, z, { over = false } = {})

/**
 * A deep-set window with an iron grille, 1 wide x 2 tall at x, y..y+1: iron_bars in the outer cell (x, z) and a
 * gray_stained_glass_pane one cell further in. `depth` is the direction INTO the building from the outer cell
 * ("north", "south", "east" or "west"). Connections face the wall line, so the grille reads as set into it.
 */
export function grilleWindow(g, x, y, z, depth, { over = false } = {})

/**
 * A shrub on the lawn, 2 x 2 at x..x+1, z..z+1: an azalea/oak mix of persistent leaves at y 0, with one oak leaf
 * above the north-west cell at y 1. Nothing is written at y 0 outside the leaves; the ground is not touched.
 */
export function shrub(g, x, z, { over = false } = {})
```

### vocab/h3.mjs

```js
// Vocabulary H3 (plan.md VOCABULARY): cornice, porchBay, bannerRun, pavilion, leanTo, cannon, hangLantern.
// Every helper takes its position (and facing, where it has one) as arguments and writes only inside the footprint
// it is given, only into air. opts.over: true lets it overwrite. Returns the number of blocks placed.

/**
 * One cornice course: upside-down smooth_quartz_stairs at y 9 along x0..x1 at z. face is the outward normal of the wall
 * it trims (south for a front at high z): the stairs face into the wall, so the lip points out.
 */
export function cornice(g, x0, x1, z, face, opts = {})

/**
 * One porch bay of span cells from post column x, between the back line z0 and the front line z2 (front = the high z
 * for a porch facing south, the low z for north). Posts (diorite_wall, y 1..3 and 5..6) stand on the front line at x;
 * the cells x+1..x+span-1 carry the railing (y 5) and the lower rail (y 1) between them; gallery beam smooth_quartz at
 * y 4 on the front line; gallery deck smooth_quartz_slab (top) at y 4 behind it; porch roof smooth_quartz at y 7 on
 * the front line with smooth_quartz_slab (bottom) behind. opts: span (1), facing ("south"), rail (true),
 * lowerRail (true: false at a ramp bay).
 */
export function porchBay(g, x, z0, z2, opts = {})

/**
 * A banner word (red wall banners with white letters, one per character, reading left to right from the street) on
 * the row y at z, centred on x0..x1, facing `face` (default south: the banner hangs on the block at z - 1). opts.panels:
 * [[px0, px1, py0, py1], ...] red_wool panels one cell behind the letters (z - 1 facing south).
 */
export function bannerRun(g, text, x0, x1, z, y, opts = {})

/**
 * A flat-roofed glass pavilion over x0..x1, z0..z1 (walls y 1..6, roof y 7). Perimeter glass_pane with its connections,
 * polished_blackstone mullions (default: every 4th cell along each x face, and the z corners) and a polished_blackstone
 * band at y 4; roof polished_blackstone_slab (bottom) with a polished_blackstone edge course. opts.mullions: { x: [...],
 * z: [...] } (x: on the z faces, z: on the x faces); opts.open(x, y, z) -> true leaves that perimeter cell as air (a door).
 */
export function pavilion(g, x0, z0, x1, z1, opts = {})

/**
 * A stepped lean-to of polished_granite_stairs over x0..x1, z0..z1, lowest at its open edge: one stair course per `run`
 * rows (default 2), the stairs' back toward the high side. facing (default "north": the roof rises to the north, its low
 * edge at the high z). The course at the low edge sits at y; the next run of rows sits one higher.
 */
export function leanTo(g, x0, x1, z0, z1, y, opts = {})

/**
 * A bronze-look cannon on the ground course at y 0: breech polished_blackstone at (x, z), barrel of polished_blackstone_wall
 * (a pipe) over the two cells in front of it, open dark_oak_trapdoor wheels either side at z+1. Muzzle toward facing
 * (default "south", the barrel runs to high z). Footprint x-1..x+1, z..z+2 (z-2..z for north).
 */
export function cannon(g, x, z, opts = {})

/** A hanging lantern at (x, y, z). It hangs from the block above: with air above, nothing is placed (returns 0). */
export function hangLantern(g, x, y, z, opts = {})
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
