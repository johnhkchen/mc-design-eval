# Town hall — architect's plan

Identity: a Victorian-Georgian market-town hall. Red brick with white quartz dressings on a grey stone plinth, a grey slate hip roof,
a four-column white portico with a pediment over the main door, and a square brick clock tower behind the portico. Its weathered-copper
spire is the tallest thing in the street. The plan is symmetrical about x = 20.

## SITE

Ground is flat, with the grass top at y = 0. People walk at y = 1. The front faces NORTH (−z), x runs along the street, and the lot is x 0..40, z 0..36.

| mass | x0..x1 | y0..y1 | z0..z1 | notes |
|---|---|---|---|---|
| street (road) | 0..40 | 0 | 0..2 | road surface, laid in the ground course |
| sidewalk | 0..40 | 0 | 3 | paving, laid in the ground course |
| front lawns | 0..14 / 26..40 | 0 | 4..8 | grass, either side of the steps |
| forecourt paving | 15..25 | 0 | 4..5 | under and beside the steps |
| front steps | 16..24 | 1..2 | 4..5 | z 4 tread top at y 1, z 5 tread top at y 2 (stairs facing south, i.e. you walk up toward +z) |
| portico podium | 15..25 | 1..3 | 6..9 | solid; its top at y 3 is the porch floor |
| portico (columns + entablature) | 14..26 | 4..16 | 6..9 | open porch y 4..14; entablature y 15..16 |
| main body | 4..36 | 1..16 | 10..26 | 33 × 17, two storeys on a raised plinth |
| west end pavilion (front) | 4..10 | 1..16 | 9 | the front wall steps 1 proud of the body, full height |
| east end pavilion (front) | 30..36 | 1..16 | 9 | mirror of the west one |
| clock tower shaft | 18..22 | 1..35 | 10..14 | 5 × 5, footing at ground, front face flush in the main front wall z 10; hollow x 19..21 z 11..13 |
| tower spire | 17..23 | 36..41 | 9..15 | copper pyramid; lightning-rod finial at x 20 z 12 y 42..43 |
| west chimney stack | 5..6 | 1..23 | 17..18 | own footing, inside the west wall; cap at y 23 |
| east chimney stack | 34..35 | 1..23 | 17..18 | mirror |
| rear steps | 19..21 | 1..3 | 27..29 | z 27 landing top at y 3, z 28 tread at y 2, z 29 tread at y 1 |
| rear garden | 0..40 | 0 | 27..36 | lawn; gravel path x 19..21 z 30..36 to a back gate at z 36 |
| garden trees | 7..9 / 31..33 | 1..8 | 31..33 | one oak each side (trunk at x 8 / x 32, z 32) |
| flagpoles | 7 / 33 | 1..10 | 6 | fence pole on a stone-brick-wall base, with a banner at the top |
| lamp posts | 14 / 26 | 1..4 | 4 | flank the steps; more lamp posts along the sidewalk at x 2, 38 |

## ROOFS

| roof | form | footprint | y (first course) | pitch | ridge | overhang | material |
|---|---|---|---|---|---|---|---|
| main | `$MCD roof` preset **civic** (a hip, which suits a hall seen from all sides), with `pediment` turned OFF because the portico carries its own | x 4..36, z 10..26 (the 1-cell pavilion projections at z 9 are covered by the eave) | 17 | 45 | ridge along x, about x 12..28 at z 18, top about y 25, slab ridge | 1 on all sides (eave at z 9 / z 27 / x 3 / x 37) | `slate` palette, quartz dentil cornice (`trim: quartz`) |
| main dormers | 2 gable dormers on the north face (centred x 12, x 28) and 3 on the south face (x 12, 20, 28), 3 wide, 2 high, glass | — | — | — | — | — | slate cheeks, quartz-trimmed |
| portico | `$MCD roof` preset **temple** (a low gable to the front with a quartz raking cornice and tympanum) | x 14..26, z 6..10 | 17 | 45 | ridge along z at x 20, apex about y 22 | 1 at the north end, 0 at the back where it meets the main roof | red-tile is the preset default; override it to the `slate` palette so it matches the main roof. Tympanum smooth_quartz, with an oculus |
| tower spire | **pyramid**, steep (2:1), finial | x 18..22 at y 36 (overhang 1 → x 17..23, z 9..15) | 36 | steep | point at x 20 z 12, about y 41 | 1 | `weathered_cut_copper` mixed with `oxidized_cut_copper` and `cut_copper` (the copper palette) |

- Main roof `keep`: tower x 18..22 z 10..14 y 17..35; chimneys x 5..6 z 17..18 y 17..23 and x 34..35 z 17..18 y 17..23. The roof
  closes round all three on every side.
- The portico gable butts the main roof's north slope at z 10; the tower rises out of the main roof just behind the pediment apex.
- The roof's cornice at the eave line (y 16/17) must run unbroken round the body and continue across the portico entablature at
  the same height: one cornice line.

## FACADES

Base, middle and top are the same on every face:

| band | y | material | depth |
|---|---|---|---|
| plinth | 1..2 | polished_andesite | flush |
| plinth cap / water table | 3 | stone_bricks, with stone_brick_stairs (upside down) proud +1 on the front and sides | +1 |
| ground storey | 4..9 | bricks | flush |
| string course (first-floor line) | 10 | smooth_quartz course, with quartz_slab (top half) proud +1 on the front | +1 |
| upper storey | 11..15 | bricks | flush |
| cornice | 16 | quartz_block course; the roof's dentil cornice steps out +1 above it | +1 |

**North (front) face, z 10 (pavilions z 9):**
- **End pavilions** x 4..10 and x 30..36 stand 1 proud (z 9). Quartz quoins (quartz_block, alternating 2-long / 1-short each course,
  y 4..15) at x 4, x 10, x 30, x 36. One 3-wide window per storey, centred.
- **Recessed ranges** x 11..14 and x 26..29 (z 10): one 2-wide window per storey.
- **Portico** x 14..26, z 6..9: four `quartz_pillar` columns (axis y) at z 6, x 15, 18, 22, 25, y 4..14, each on a chiseled_quartz_block
  base at y 4 (the pillar runs y 5..14). The wide middle space x 19..21 frames the door. The entablature is two courses over
  x 14..26 z 6..9: y 15 smooth_quartz architrave, y 16 quartz_block frieze. Its north face (z 6) carries the lettering **TOWN HALL**.
  The pediment above (roof tool, temple) has a smooth_quartz tympanum with an oculus.
- **Behind the portico** (z 10): 2-wide windows at x 16..17 and x 23..24 on both storeys. The main door is at x 19..21 (see
  OPENINGS). Above the door is a 3-wide upper window, a Palladian centrepiece.
- **Window dressings** (all faces): a quartz_slab sill (bottom half) proud +1 under each ground window at y 4. Over each ground window
  at y 9, a flat arch: upside-down quartz_stairs on each side and a chiseled_quartz_block keystone in the centre, flush. Over each
  upper window at y 15, a hood of upside-down quartz_stairs proud +1. The y 10 string course is the upper windows' sill.
- **Main door surround**: upside-down quartz_stairs arch at y 9 over x 19..21 with a chiseled_quartz keystone at x 20, and quartz_pillar
  door jambs are not needed (the columns frame it).
- **Clock tower** above the roof, faces x 18..22 / z 10..14: brick shaft with quartz quoins at the four corners.
  - Quartz band at y 27.
  - **Clock face** on all four sides, y 28..30, 3 × 3 centred on the face: white_concrete. Hands are black_concrete at the centre
    cell (y 29) and the cell above it (y 30). The two-cell frame column either side (the corner quoins) is chiseled_quartz_block.
  - Quartz band at y 31.
  - **Belfry** y 32..34: an opening 3 wide (y 32..33) on each face, with upside-down quartz stairs at y 34 over the outer two cells
    (an arch). Iron bars are not used; the openings stay open.
  - Cornice at y 35: a quartz_block course with upside-down quartz_stairs proud +1 all round. The copper spire sits above.

**West / east faces** (x 4 / x 36): the same bands. Quoins at the corners z 10 and z 26. Windows at z 12..13 and z 22..23 on both storeys.
The chimney breast is inside, so these walls stay plain brick between the windows.

**South (rear) face** (z 26): the same bands. Corner quoins. Six 2-wide windows per storey and a central door.

## MATERIALS

| role | block id |
|---|---|
| wall body (about 60%) | `bricks` |
| dressings: quoins, cornice, bands, entablature | `quartz_block`, `smooth_quartz`, `quartz_stairs`, `quartz_slab`, `chiseled_quartz_block` |
| columns | `quartz_pillar` (axis y) |
| plinth | `polished_andesite`; cap `stone_bricks` / `stone_brick_stairs` |
| front steps and podium faces | `stone_bricks`, treads `stone_brick_stairs` / `smooth_stone_slab` |
| main and portico roof | `slate` palette (cobbled deepslate, deepslate tiles, polished deepslate; blackstone-brick eave; stone-brick ridge) |
| tower spire | `weathered_cut_copper`, `oxidized_cut_copper`, `cut_copper` (verdigris green, the one cool accent) |
| clock face / hands | `white_concrete` / `black_concrete` |
| glass | `glass_pane` |
| doors | `dark_oak_door` |
| chimneys | `bricks` with a `deepslate_bricks` band at y 21, a `stone_brick_slab` cap stepped out 1 at y 23, and a lit `campfire` on top (not a signal fire) |
| bell | `bell` (attachment ceiling) |
| street / sidewalk | `andesite` with `gravel` at the kerb / `smooth_stone` |
| forecourt and paths | `stone_bricks`, `polished_andesite`; rear path `gravel` |
| ground | `grass_block`, `coarse_dirt` patches near trees |
| lamp posts and flagpoles | `dark_oak_fence` on `stone_brick_wall`, `lantern`; `blue_banner` flags |

Every id was checked with `$MCD blocks --check` (all known). The tones read clearly against each other: warm red body, white trim,
mid-grey slate, green copper.

## OPENINGS

All windows are `glass_pane` set in the wall plane. Ground windows are y 5..8 (4 tall) and upper windows y 11..14 (4 tall).

| face | wall plane | openings (x or z range) | storeys |
|---|---|---|---|
| N pavilions | z 9 | x 6..8, x 32..34 (3 wide) | ground y 5..8, upper y 11..14 |
| N ranges | z 10 | x 12..13, x 27..28 (2 wide) | both |
| N behind portico | z 10 | x 16..17, x 23..24 (2 wide) | both |
| N main door | z 10 | x 19..21, y 4..8: `dark_oak_door` at x 20 (y 4..5, facing north) between glass-pane sidelights at x 19 and x 21 (y 4..5), with a 3-wide glass fanlight y 6..8 | ground |
| N centre upper | z 10 | x 19..21, y 11..14 (3 wide) | upper |
| W | x 4 | z 12..13, z 22..23 | both |
| E | x 36 | z 12..13, z 22..23 | both |
| S | z 26 | x 6..7, 11..12, 16..17, 23..24, 28..29, 33..34 | both |
| S rear door | z 26 | x 20, y 4..5 (`dark_oak_door`, facing south) with a glass transom at y 6; the rear steps lead down | ground |
| S centre upper | z 26 | x 19..21, y 11..14 | upper |
| tower belfry | z 10 / z 14 / x 18 / x 22 | 3 wide (x 19..21 or z 11..13), y 32..33, plus the centre cell at y 34 | — |

## RESERVED (the shell leaves these as air)

| what | cells |
|---|---|
| portico columns and bases | x 15, 18, 22, 25; z 6; y 4..14 |
| west fireplace, ground and upper (firebox opening on the stack's east face) | x 6, z 17..18, y 4..5 and y 11..12 (campfire at x 6 y 4 / y 11 against the back at x 5) |
| east fireplace, ground and upper | x 34, z 17..18, y 4..5 and y 11..12 (campfire against the back at x 35) |
| tower interior (stair or ladder to the belfry) | x 19..21, z 11..13, y 4..34 (floor slabs only at y 10 and the belfry floor y 31, each with a 1-cell ladder hole at x 21 z 13) |
| bell | x 20, z 12, y 34 |
| chimney-top campfires | x 5 z 17 y 24; x 34 z 17 y 24 |
| clock faces | the 3 × 3 at y 28..30, centred on each tower face (the shell builds the face blocks itself, no pre-building) |
| lettering | entablature north face z 6, x 15..25, y 15..16 (left as quartz; the sign writer places letters on it) |

## FLOORS

| storey | floor block y | walkable y | ceiling | interior volume |
|---|---|---|---|---|
| ground (raised over the plinth) | 3 | 4..9 | y 10 slab | x 5..35, z 11..25 (minus the chimneys x 5..6 / 34..35 z 17..18; the tower vestibule x 19..21 z 11..13 is the inner porch behind the main door) |
| upper (council chamber floor) | 10 | 11..15 | y 16 ceiling | x 5..35, z 11..25 (minus the chimneys and the tower x 18..22 z 10..14) |
| attic (unused) | 16 | under the roof | — | — |
| tower belfry | 31 | 32..34 | y 35 | x 19..21, z 11..13 |
| porch | 3 (podium top) | 4..14 | y 15 | x 15..25, z 6..9 |

Suggested room logic for the second designer: a central entrance hall x 11..29 behind the door with the grand stair, a clerk's office in
the west (fireplace) and the mayor's office in the east (fireplace) on the ground floor, and a full-width council chamber upstairs
lit by the Palladian window over the portico.


---
# Designer's sections

## PALETTE (ids checked with `$MCD blocks --check`, all known)

| role | block | variants |
|---|---|---|
| wall body | `bricks` | `brick_stairs`, `brick_slab` |
| dressings | `quartz_block`, `smooth_quartz`, `chiseled_quartz_block`, `quartz_pillar` | `quartz_stairs`, `quartz_slab` |
| plinth | `polished_andesite` | `polished_andesite_stairs/slab` |
| water table, steps, podium | `stone_bricks` | `stone_brick_stairs`, `stone_brick_slab`, `stone_brick_wall` |
| treads | `smooth_stone_slab` |  |
| roof | slate palette: `cobbled_deepslate`, `deepslate_tiles`, `polished_deepslate`, blackstone-brick eave, stone-brick ridge | |
| spire | `weathered_cut_copper`, `oxidized_cut_copper`, `cut_copper` | `*_stairs`, `*_slab`, `lightning_rod` |
| clock | `white_concrete`, `black_concrete` | |
| glass | `glass_pane` | |
| doors/wood | `dark_oak_door`, `dark_oak_planks`, `dark_oak_stairs`, `dark_oak_slab`, `dark_oak_log`, `stripped_dark_oak_log`, `dark_oak_fence`, `dark_oak_trapdoor`, `dark_oak_wall_sign` | |
| chimney | `bricks`, `deepslate_bricks`, `stone_brick_slab`, `campfire` (lit, not signal) | |
| light | `lantern`, `iron_chain`, `candle` | |
| interior | `oak_planks` floor (ground), `spruce_planks` (chamber floor), `red_carpet`, `white_carpet`, `bookshelf`, `chiseled_bookshelf`, `lectern`, `barrel`, `flower_pot`, `red_wool`, `bell`, `ladder` | |
| ground | `grass_block`, `coarse_dirt`, `dirt_path`, `andesite`, `gravel`, `smooth_stone`, `oak_log`, `oak_leaves`, `blue_banner` | |

## VOCABULARY

- `quoinColumn(x,z,face,y0,y1)`: quartz_block, alternating 2-long / 1-short per course (course i: long if i%2==0), protruding along the corner.
- `stringCourse(face)`: smooth_quartz y10 flush; front adds quartz_slab type top proud +1 at y10.
- `waterTable()`: stone_bricks y3, upside-down stone_brick_stairs (half top) proud +1 on N and sides.
- `windowBay(face,at,w,y0,h)`: glass_pane h tall w wide in the wall plane, panes with connection states; quartz_slab (bottom) sill proud +1 at y0-1 for ground; wall left as air for panes only.
- `flatArch(face,x0,x1,y)`: upside-down quartz_stairs (half top, facing outward to centre) on each side, `chiseled_quartz_block` keystone centre, flush.
- `windowHood(face,x0,x1,y)`: upside-down quartz_stairs proud +1 across the head of upper windows at y15.
- `mainDoor()`: `dark_oak_door` lower/upper at x20 facing north hinge left, glass_pane sidelights x19,x21 y4..5, fanlight glass y6..8 x19..21, upside-down quartz_stairs arch y9 x19,x21 + chiseled keystone x20.
- `porticoColumn(x)`: chiseled_quartz_block y4, quartz_pillar axis y y5..14 at z6.
- `entablatureBand()`: y15 smooth_quartz, y16 quartz_block, x14..26 z6..9.
- `pedimentOculus()`: tympanum smooth_quartz; oculus: ring of chiseled_quartz_block around a glass_pane at x20 near y19.
- `townHallLetters()`: sign writer `plaque` word "TOWN HALL" on z6 x15..25 y15..16, dark letters on quartz.
- `towerBand(y)`: quartz_block full ring of the shaft at y27, y31, y35; at y35 with upside-down quartz_stairs proud +1 all round.
- `clockFace(face)`: 3x3 white_concrete y28..30; black_concrete at centre y29 and above y30; corners chiseled_quartz_block.
- `belfryOpening(face)`: 3-wide air y32..33; upside-down quartz_stairs at y34 over outer two cells.
- `bellHang()`: `bell` attachment ceiling at x20 y34 z12 under a dark_oak_log beam at y35 axis x.
- `copperSpire()`: roof tool pyramid, copper palette, `lightning_rod` x20 z12 y42..43.
- `dormer(x,face)`: 3 wide 2 high, glass_pane, slate cheeks, quartz-trim stairs.
- `chimneyStack(x,z)`: 2x2 bricks y1..22; deepslate_bricks ring y21; stone_brick_slab cap stepped out 1 at y23; lit campfire (`lit:true`, `signal_fire:false`) on top at y24 in the corner cell.
- `fireplace(x,side)`: firebox 1 wide 2 deep x z17..18 y4..5 and y11..12: stone_bricks floor, lit campfire at the back, upside-down brick_stairs lintel y6/y13.
- `stairFlight(x0,x1)`: stone_brick_stairs facing north half bottom at z24-i, y4+i, i=0..6 across x0..x1, solid brick fill beneath, dark_oak_fence rail on the open side.
- `ladderShaft()`: `ladder` facing north at x21 z13 y4..32; open hole in slabs at y10 and y31.
- `frontSteps()`: stone_brick_stairs facing south at z4 y1 and z5 y2, x16..24.
- `flagpole(x)`: stone_brick_wall y1, dark_oak_fence y2..10, blue_banner hung at top.
- `lampPost(x,z)`: stone_brick_wall y1, dark_oak_fence y2..3, lantern y4.
- `oakTree(x,z)`: oak_log axis y y1..6, persistent oak_leaves crown radius 3, coarse_dirt patch.
- Furniture: `deskSet`(desk of dark_oak_slab on fence post, dark_oak_stairs chair), `benchRow`(dark_oak_stairs run), `bookWall`(bookshelf / chiseled_bookshelf), `dais`(dark_oak_slab raised floor), `councilTable`(ring of dark_oak_slab on stairs), `chandelier`(iron_chain + lantern).

## ROOMS

Ground floor (floor block y3, walkable y4..9). Walls between rooms are `bricks`/`oak_planks` 1 thick.

| room | box | doors |
|---|---|---|
| Vestibule (tower base) | [19,4,11,21,9,13] | front door x20 z10; 2-wide archway x19..20 z14 y4..6 to the hall |
| Entrance hall | [11,4,15,29,9,25] | from vestibule x19..20 z14; arcades into bays; offices by doors x10 z20 and x30 z20; rear door x20 z26; stairs x11..12 and x28..29 |
| Registry bay (W) | [11,4,11,17,9,14] | open to hall along z14/15 x12..16 |
| Waiting bay (E) | [23,4,11,29,9,14] | mirror |
| Clerk's office (W) | [5,4,11,9,9,25] | door x10 z20 y4..5 from hall; fireplace x6 z17..18 |
| Mayor's office (E) | [31,4,11,35,9,25] | door x30 z20; fireplace x34 z17..18 |

Upper floor (floor block y10, walkable y11..15).

| room | box | doors |
|---|---|---|
| Council chamber | [5,11,15,35,15,25] (chimney breasts x5..6, x34..35 z17..18 solid except the firebox; stair wells x11..12 and x28..29 z19..24 at y10 open) | stairs top at z18; doorways x15 z14 and x25 z14 |
| Committee room (W) | [5,11,11,17,15,13] | doorway x15 z14 y11..12 (wall z14) |
| Committee room (E) | [23,11,11,35,15,13] | doorway x25 z14 |
| Clock room (tower) | [19,11,11,21,30,13] | ladder x21 z13 through hole at y10 |
| Belfry | [19,32,11,21,34,13] | ladder through y31 hole; open arches on 4 faces; bell x20 y34 z12 |

Windows are the architect's OPENINGS table. Entrance (cell outside door): [20,4,8] on the porch.

## PARTS

1. **Shell** `parts/shell.mjs` (masonry): plinth, brick walls both storeys, pavilions, podium, floors y3/y10 with stairwell holes, ceiling y16, tower shaft with ladder, interior partitions and doorways, stair flights (`stairFlight`, `ladderShaft`), leaving all OPENINGS and RESERVED air.
2. **Roofs** `parts/roofs.mjs` (roofer): main civic hip, temple portico roof with oculus, dormers, `copperSpire`, keeps for tower and chimneys; `$MCD roof --dry-run`.
3. **Dressings** `parts/dressings.mjs` (mason/carver): quoins, water table, string course, cornice, portico columns + entablature, tower bands, clock faces, belfry arches, bell.
4. **Fittings** `parts/fittings.mjs` (glazier + sign writer): glass panes, sills, arches, hoods, doors, fanlight, rear door, TOWN HALL letters.
5. **Chimneys** `parts/chimneys.mjs`: stacks, bands, caps, campfires, 4 fireboxes.
6. **Grounds** `parts/grounds.mjs`: road, sidewalk, lawns, steps, rear garden, trees, flagpoles, lamp posts, door lanterns.

Checklist: [ ] shell [ ] roofs [ ] dressings [ ] fittings [ ] chimneys [ ] grounds

## Notes for workers
- Keep every RESERVED cell and opening as air in the shell; fittings fill them.
- Roof eave at x3/x37/z9/z27 is on-grid; do not shift. Run `$MCD check` and `$MCD walk build.nbt --rooms rooms.json`.
- Use only palette ids; stairs facing as walked-up direction.
