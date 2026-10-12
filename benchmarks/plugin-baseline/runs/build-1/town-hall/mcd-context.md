# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# Required elements — Town hall

Coordinates from plan.md. "Part" = the PARTS entry that builds it; "Vocab" = helper in plan.md VOCABULARY. Every object is built block by block.

| # | Element | Construction | Coordinates | Part | Vocab |
|---|---|---|---|---|---|
| 1 | Brick body, two storeys on plinth | `bricks` walls y4..9 and 11..15, polished_andesite y1..2, stone_bricks y3 with upside-down stone_brick_stairs proud +1, smooth_quartz string y10 with top quartz_slab proud +1 on front, quartz_block cornice y16 | x4..36, z10..26 (pavilions z9) | 1 shell, 3 dressings | quoinColumn, stringCourse |
| 2 | Four-column portico | podium stone_bricks y1..3 x15..25 z6..9; 4 `quartz_pillar` axis y (y5..14) on chiseled_quartz_block base y4 at x15,18,22,25 z6; entablature y15 smooth_quartz, y16 quartz_block, x14..26 z6..9 | see plan | 3 dressings | portico column, entablatureBand |
| 3 | Pediment with oculus | roof tool `temple`, slate, smooth_quartz tympanum; oculus = 3x3 ring: chiseled_quartz_block centre-ring with a glass_pane eye at apex-1, x20 | x14..26 z6..10, y17..22 | 2 roofs | pedimentOculus |
| 4 | TOWN HALL lettering | `plaque(g,"TOWN HALL",{at:[15,15,6],face:"north",width:11,height:2,letter:"black_concrete"... use dark: `polished_andesite`})` on the entablature north face; fallback 1-row wall signs `dark_oak_wall_sign` | z6, x15..25, y15..16 | 4 fittings | townHallLetters |
| 5 | Main door + fanlight | `dark_oak_door` x20 y4..5 facing north (both halves), glass_pane sidelights x19,x21 y4..5, 3-wide glass_pane fanlight y6..8, upside-down quartz_stairs arch y9 with chiseled keystone x20; stone step | z10, x19..21 | 4 fittings | mainDoor |
| 6 | Windows, all faces | glass_pane set per OPENINGS, quartz_slab sill (bottom) proud +1 at y4 (ground), flat arch at y9, upper hood at y15 | OPENINGS table | 4 fittings | windowBay, flatArch, windowHood |
| 7 | Clock tower | brick shaft x18..22 z10..14 y17..35 (hollow x19..21 z11..13), quartz quoins corners, bands y27, y31, cornice y35 with upside-down quartz_stairs proud +1 | see plan | 1 shell (shaft), 3 dressings (bands) | towerBand |
| 8 | Clock faces (4) | 3x3 white_concrete y28..30 centred on each face, black_concrete hands at centre y29 and cell above y30; chiseled_quartz_block frame columns | z10 x19..21; z14; x18 z11..13; x22 | 3 dressings | clockFace |
| 9 | Belfry + bell | 3-wide openings y32..33 each face, upside-down quartz_stairs arch y34 over outer two cells; `bell` attachment ceiling at x20 y34 z12 hung under a dark_oak_slab/log beam y35 | belfry x19..21 z11..13 | 3 dressings | belfryOpening, bellHang |
| 10 | Copper spire + finial | `$MCD roof` pyramid steep, copper palette (weathered/oxidized/cut copper), `lightning_rod` x20 z12 y42..43 | x17..23 z9..15 y36..41 | 2 roofs | copperSpire |
| 11 | Hip slate roof, dentil cornice | `$MCD roof` civic, slate palette, quartz trim, keeps for tower and chimneys | x4..36 z10..26 y17.. | 2 roofs | — |
| 12 | Dormers (2 N, 3 S) | gable dormers 3 wide 2 high, glass_pane, slate cheeks, quartz trim | N x12,x28; S x12,20,28 | 2 roofs | dormer |
| 13 | Chimney stacks (2) | bricks 2x2 own footing y1..23, deepslate_bricks band y21, stone_brick_slab cap y23 stepped out 1, lit `campfire` y24 (hay under NOT used) | x5..6 z17..18; x34..35 | 5 chimneys | chimneyStack |
| 14 | Fireplaces (4) | firebox x6/x34 z17..18 y4..5, y11..12: stone_bricks floor, lit campfire against back, upside-down brick_stairs lintel | see RESERVED | 5 chimneys | fireplace |
| 15 | Grand stairs | two straight flights in the hall x11..12 and x28..29, z24->18, dark_oak... `stone_brick_stairs` facing north, rail `dark_oak_fence` | hall | 1 shell | stairFlight |
| 16 | Tower ladder | `ladder` facing north at x21 z13 y4..32 with holes in y10 and y31 slabs | tower | 1 shell | ladderShaft |
| 17 | Front steps + forecourt | stone_brick_stairs facing south y1 (z4), y2 (z5) x16..24; forecourt stone_bricks/polished_andesite | z4..5 | 6 grounds | frontSteps |
| 18 | Rear steps, door, garden | door x20 z26 facing south, glass transom y6; steps z27..29; gravel path x19..21 z30..36; back gate dark_oak_fence_gate z36 | plan | 4 fittings, 6 grounds | rearDoor |
| 19 | Street, sidewalk, lawns | andesite road z0..2 with gravel kerb, smooth_stone sidewalk z3, grass lawns | plan | 6 grounds | — |
| 20 | Flagpoles (2) | stone_brick_wall base y1, dark_oak_fence to y10, blue_banner at top | x7,x33 z6 | 6 grounds | flagpole |
| 21 | Lamp posts | dark_oak_fence on stone_brick_wall, lantern on top | x14,26 z4; x2,38 z3 | 6 grounds | lampPost |
| 22 | Oaks (2) | oak_log axis y trunk, persistent oak_leaves crown, coarse_dirt patch | x8,x32 z32 | 6 grounds | oakTree |
| 23 | Interior: hall, offices, council chamber | by the room designers | ROOMS | rooms | furniture helpers |
| 24 | Door lanterns | lanterns each side of main door on fence arms | x18, x22 z9 y7 | 6 grounds / 4 fittings | doorLantern |
```

### rooms.json

```json
{"entrance":[20,4,8],"rooms":[{"name":"Vestibule","box":[19,4,11,21,9,13]},{"name":"Entrance hall","box":[11,4,15,29,9,25]},{"name":"Registry bay","box":[11,4,11,17,9,14]},{"name":"Waiting bay","box":[23,4,11,29,9,14]},{"name":"Clerk's office","box":[5,4,11,9,9,25]},{"name":"Mayor's office","box":[31,4,11,35,9,25]},{"name":"Council chamber","box":[5,11,15,35,15,25]},{"name":"Committee room west","box":[5,11,11,17,15,13]},{"name":"Committee room east","box":[23,11,11,35,15,13]},{"name":"Clock room","box":[19,11,11,21,30,13]},{"name":"Belfry","box":[19,32,11,21,34,13]}]}
```

### palette.json

```json
{"roles":{"wall":["bricks","brick_stairs","brick_slab"],"dressing":["quartz_block","smooth_quartz","smooth_quartz_stairs","smooth_quartz_slab","chiseled_quartz_block","quartz_pillar","quartz_stairs","quartz_slab"],"plinth":["polished_andesite","polished_andesite_stairs","polished_andesite_slab"],"stone":["stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall","smooth_stone_slab"],"roof":["cobbled_deepslate","cobbled_deepslate_stairs","cobbled_deepslate_slab","deepslate_tiles","deepslate_tile_stairs","deepslate_tile_slab","polished_deepslate","polished_deepslate_stairs","polished_deepslate_slab","polished_blackstone_bricks","polished_blackstone_brick_stairs","polished_blackstone_brick_slab"],"spire":["weathered_cut_copper","weathered_cut_copper_stairs","weathered_cut_copper_slab","oxidized_cut_copper","oxidized_cut_copper_stairs","oxidized_cut_copper_slab","cut_copper","cut_copper_stairs","cut_copper_slab","lightning_rod"],"clock":["white_concrete","black_concrete"],"glass":["glass_pane"],"wood":["dark_oak_door","dark_oak_planks","dark_oak_stairs","dark_oak_slab","dark_oak_log","stripped_dark_oak_log","dark_oak_fence","dark_oak_fence_gate","dark_oak_trapdoor","dark_oak_wall_sign"],"chimney":["bricks","deepslate_bricks","stone_brick_slab","campfire"],"light":["lantern","iron_chain","candle"],"interior":["oak_planks","spruce_planks","red_carpet","white_carpet","bookshelf","chiseled_bookshelf","lectern","barrel","flower_pot","red_wool","bell","ladder"],"ground":["grass_block","coarse_dirt","dirt_path","andesite","gravel","smooth_stone","oak_log","oak_leaves","blue_banner","cobblestone","dandelion","oxeye_daisy"],"added metal details":["iron_bars","polished_blackstone_wall"]},"objects":["campfire","lantern","candle","iron_chain","lightning_rod","dark_oak_door","dark_oak_trapdoor","dark_oak_wall_sign","dark_oak_fence","dark_oak_fence_gate","blue_banner","bell","ladder","lectern","barrel","flower_pot","red_carpet","white_carpet","bookshelf","chiseled_bookshelf","red_wool","oak_log","oak_leaves","dark_oak_log","stripped_dark_oak_log","white_concrete","black_concrete","glass_pane","iron_bars","polished_blackstone_wall","stone_brick_wall","stone_brick_slab","stone_brick_stairs","quartz_pillar","smooth_quartz_stairs","smooth_quartz_slab","dandelion","oxeye_daisy"]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which replaces build.nbt only once it is complete.
set -e
cd "$(dirname "$0")"
TMP="build.$$.tmp.nbt"
trap 'rm -f "$TMP"' EXIT
node build.mjs "$TMP"
mv "$TMP" build.nbt
```

### build.mjs

```js
// Builds the town hall: the ground course, then every part in plan order, saved to the path given as argv[2].
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE, GROUND_Y, GRASS_BLOCK } from "./vocab/base.mjs";
import * as shell from "./parts/shell.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as dressings from "./parts/dressings.mjs";
import * as fittings from "./parts/fittings.mjs";
import * as chimneys from "./parts/chimneys.mjs";
import * as grounds from "./parts/grounds.mjs";
import * as room1 from "./parts/room-1.mjs";
import * as room2 from "./parts/room-2.mjs";
import * as room3 from "./parts/room-3.mjs";
import * as room4 from "./parts/room-4.mjs";
import * as room5 from "./parts/room-5.mjs";
import * as room6 from "./parts/room-6.mjs";
import * as room7 from "./parts/room-7.mjs";
import * as room8 from "./parts/room-8.mjs";
import * as room9 from "./parts/room-9.mjs";
import * as room10 from "./parts/room-10.mjs";
import * as room11 from "./parts/room-11.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

const lawn = (g) => g.fill([0, GROUND_Y, 0], [SITE_SIZE[0] - 1, GROUND_Y, SITE_SIZE[2] - 1], GRASS_BLOCK);

// The roof reads its eave from the walls, so runParts would throw while the shell is still a stub. Lay it only once
// the shell has built something above ground; until then it is left out, as runParts does for a missing roof.json.
const probe = lawn(new Grid(SITE_SIZE));
shell.build(probe);
const walled = [...probe].some((c) => c.pos[1] > GROUND_Y);
if (!walled) console.log("roof: left out, the shell has no walls yet");

const g = lawn(new Grid(SITE_SIZE));

runParts(g, [
  ["Masonry shell", shell.build],
  ["Roofs", roofs.build],
  ["Dressings", dressings.build],
  ["Fittings and lettering", fittings.build],
  ["Chimneys and hearths", chimneys.build],
  ["Grounds", grounds.build],
  ["room: Vestibule", room1.build],
  ["room: Entrance hall", room2.build],
  ["room: Registry bay", room3.build],
  ["room: Waiting bay", room4.build],
  ["room: Clerk's office", room5.build],
  ["room: Mayor's office", room6.build],
  ["room: Council chamber", room7.build],
  ["room: Committee room west", room8.build],
  ["room: Committee room east", room9.build],
  ["room: Clock room", room10.build],
  ["room: Belfry", room11.build],
], { palette: "palette.json", roof: walled ? "roof.json" : undefined });

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the town hall: the palette's block ids, the site's coordinates, and a seeded rng.
// Block ids mirror palette.json (roles and objects); the grid is x 0..40, y 0..43, z 0..36.

// ---- site ---------------------------------------------------------------------------------------------------------

// ---- site ---------------------------------------------------------------------------------------------------------
export const SITE_SIZE = [41, 44, 37]; // grid size: x 0..40, y 0..43 (the spire finial), z 0..36

export const GROUND_Y = 0; // the grass top; the ground course is this y

export const WALK_Y = 1; // the y a person stands on outside

export const AXIS_X = 20; // the symmetry line of the plan (x)

export const FRONT_Z = 10; // the main front wall plane, north face (pavilions stand at z 9)

export const REAR_Z = 26; // the main rear wall plane, south face

export const BODY_X0 = 4; // the main body's west edge (x)

export const BODY_X1 = 36; // the main body's east edge (x)

export const PORTICO_Z0 = 6; // the portico's north face (z), where the columns and lettering stand

export const TOWER_X0 = 18; // the clock tower shaft's west edge (x)

export const TOWER_X1 = 22; // the clock tower shaft's east edge (x)

export const TOWER_Z0 = 10; // the clock tower shaft's north edge (z), flush with the front wall

export const TOWER_Z1 = 14; // the clock tower shaft's south edge (z)

export const GROUND_FLOOR_Y = 3; // the ground storey's floor block (walkable 4..9)

export const UPPER_FLOOR_Y = 10; // the upper storey's floor block (walkable 11..15)

export const CEILING_Y = 16; // the top of the main body (cornice course)

export const ROOF_Y = 17; // the first course of the main roof

// ---- palette: structural roles -----------------------------------------------------------------------------------
export const BRICKS = "bricks"; // wall body

export const BRICK_STAIRS = "brick_stairs"; // brick lintels and wall stairs

export const BRICK_SLAB = "brick_slab"; // brick caps

export const QUARTZ_BLOCK = "quartz_block"; // quoins, cornice course and frieze

export const SMOOTH_QUARTZ = "smooth_quartz"; // string course, architrave and tympanum

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs"; // the roof's quartz cornice lip

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab"; // quartz slab courses

export const CHISELED_QUARTZ_BLOCK = "chiseled_quartz_block"; // keystones, column bases and clock frames

export const QUARTZ_PILLAR = "quartz_pillar"; // portico columns (axis y)

export const QUARTZ_STAIRS = "quartz_stairs"; // arches, hoods and cornice lips

export const QUARTZ_SLAB = "quartz_slab"; // window sills and string course caps

export const POLISHED_ANDESITE = "polished_andesite"; // the plinth

export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs"; // plinth stairs

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab"; // plinth slabs

export const STONE_BRICKS = "stone_bricks"; // water table, steps and podium

export const STONE_BRICK_STAIRS = "stone_brick_stairs"; // front steps and the water table lip

export const STONE_BRICK_SLAB = "stone_brick_slab"; // chimney caps

export const STONE_BRICK_WALL = "stone_brick_wall"; // flagpole and lamp post bases

export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // step treads

export const COBBLED_DEEPSLATE = "cobbled_deepslate"; // slate roof body

export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs"; // slate roof edges

export const COBBLED_DEEPSLATE_SLAB = "cobbled_deepslate_slab"; // slate roof slabs

export const DEEPSLATE_TILES = "deepslate_tiles"; // slate roof tiles

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs"; // slate roof tile stairs

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab"; // slate roof tile slabs

export const POLISHED_DEEPSLATE = "polished_deepslate"; // slate roof accents

export const POLISHED_DEEPSLATE_STAIRS = "polished_deepslate_stairs"; // slate roof accent stairs

export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab"; // slate roof accent slabs

export const POLISHED_BLACKSTONE_BRICKS = "polished_blackstone_bricks"; // the roof's eave course

export const POLISHED_BLACKSTONE_BRICK_STAIRS = "polished_blackstone_brick_stairs"; // eave stairs

export const POLISHED_BLACKSTONE_BRICK_SLAB = "polished_blackstone_brick_slab"; // eave slabs

export const WEATHERED_CUT_COPPER = "weathered_cut_copper"; // spire, verdigris green

export const WEATHERED_CUT_COPPER_STAIRS = "weathered_cut_copper_stairs"; // spire stairs

export const WEATHERED_CUT_COPPER_SLAB = "weathered_cut_copper_slab"; // spire slabs

export const OXIDIZED_CUT_COPPER = "oxidized_cut_copper"; // spire, the bluer green

export const OXIDIZED_CUT_COPPER_STAIRS = "oxidized_cut_copper_stairs"; // spire stairs, oxidized

export const OXIDIZED_CUT_COPPER_SLAB = "oxidized_cut_copper_slab"; // spire slabs, oxidized

export const CUT_COPPER = "cut_copper"; // spire, the raw copper

export const CUT_COPPER_STAIRS = "cut_copper_stairs"; // spire stairs, raw

export const CUT_COPPER_SLAB = "cut_copper_slab"; // spire slabs, raw

export const LIGHTNING_ROD = "lightning_rod"; // the spire finial at x20 z12

export const WHITE_CONCRETE = "white_concrete"; // clock faces

export const BLACK_CONCRETE = "black_concrete"; // clock hands

export const GLASS_PANE = "glass_pane"; // windows, sidelights and the fanlight

export const DARK_OAK_DOOR = "dark_oak_door"; // the main and rear doors

export const DARK_OAK_PLANKS = "dark_oak_planks"; // wood trim and benches

export const DARK_OAK_STAIRS = "dark_oak_stairs"; // benches and chairs

export const DARK_OAK_SLAB = "dark_oak_slab"; // desks and tables

export const DARK_OAK_LOG = "dark_oak_log"; // the bell beam

export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log"; // stripped beams

export const DARK_OAK_FENCE = "dark_oak_fence"; // rails, lamp posts and flagpoles

export const DARK_OAK_FENCE_GATE = "dark_oak_fence_gate"; // the back gate

export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor"; // clock works and shelves

export const DARK_OAK_WALL_SIGN = "dark_oak_wall_sign"; // signage

export const DEEPSLATE_BRICKS = "deepslate_bricks"; // the chimney band at y21

export const CAMPFIRE = "campfire"; // lit chimney tops and fireboxes

export const OAK_PLANKS = "oak_planks"; // the ground-storey floor

export const SPRUCE_PLANKS = "spruce_planks"; // the council chamber floor

export const RED_CARPET = "red_carpet"; // the runner

export const WHITE_CARPET = "white_carpet"; // rugs

export const BOOKSHELF = "bookshelf"; // bookwalls

export const CHISELED_BOOKSHELF = "chiseled_bookshelf"; // bookwalls, chiseled

export const LECTERN = "lectern"; // the mayor's lectern

export const BARREL = "barrel"; // storage

export const FLOWER_POT = "flower_pot"; // plants

export const RED_WOOL = "red_wool"; // soft red accents

export const BELL = "bell"; // the belfry bell

export const LADDER = "ladder"; // the tower ladder

export const LANTERN = "lantern"; // lamps, door lanterns and the chandeliers

export const IRON_CHAIN = "iron_chain"; // the chandelier chains and the bell hang

export const CANDLE = "candle"; // table light

export const GRASS_BLOCK = "grass_block"; // the lawns and rear garden

export const COARSE_DIRT = "coarse_dirt"; // the patches near the trees

export const DIRT_PATH = "dirt_path"; // paths

export const ANDESITE = "andesite"; // the road

export const GRAVEL = "gravel"; // the kerb and the rear path

export const SMOOTH_STONE = "smooth_stone"; // the sidewalk

export const OAK_LOG = "oak_log"; // the garden trees' trunks

export const OAK_LEAVES = "oak_leaves"; // the garden trees' crowns

export const BLUE_BANNER = "blue_banner"; // the flags on the flagpoles

// ---- rng ----------------------------------------------------------------------------------------------------------
/** A seeded PRNG: rng(seed)() returns a float in [0, 1), the same sequence every run for the same seed. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Town hall vocabulary, batch 1: the nine helpers plan.md names (quoins, window bays, main door, pediment oculus, clock
// face, spire finial, fireplace, front steps, oak tree). Each takes the grid first, then its position (and facing where
// it has one), then an opts object. Coordinates are the grid's (x east, y up, z south); faces are north|south|east|west.
//
// Writes go only into air unless opts.over is true (a dressing that replaces a wall course). A refused cell is listed in
// the result, never thrown. Each helper returns { cells, refused }: blocks written, and [x, y, z, block] for cells it left.

/**
 * Quartz quoins on a corner at (x, z): course i (y0 + i) is long, two cells from the corner along the wall, when i is
 * even, and short (the corner cell only) when odd. `face` is the way the wall runs from the corner.
 */
export function quoinColumn(g, x, z, face, y0, y1, opts = {})

/**
 * A glass_pane window `w` wide and `h` tall, starting at along-wall position `at`, in the wall plane `plane`.
 * opts.sill: a quartz_slab sill (bottom half) proud one cell out of the wall, at y0 - 1.
 */
export function windowBay(g, face, plane, at, w, y0, h, opts = {})

/**
 * The main door on the wall plane `plane`, centred on along-wall position `cx`: dark_oak_door (both halves, lower at
 * y0), glass sidelights either side for y0..y0+1, a 3-wide glass fanlight at y0+2..y0+4, and a flat arch at y0+5 of
 * upside-down quartz stairs with a chiseled keystone over the centre.
 */
export function mainDoor(g, cx, plane, face, y0, opts = {})

/**
 * The temple gable's tympanum on the front plane `plane` (z): a smooth_quartz triangle from the base course baseY up to
 * the apex apexY, with an oculus centred at (cx, cy): a chiseled_quartz_block ring round a glass_pane eye.
 */
export function pedimentOculus(g, cx, plane, baseY, apexY, cy, opts = {})

/**
 * A 3x3 clock face on a tower wall (plane `plane`), centred on along-wall position `at`, rows y0..y0+2. White dial,
 * chiseled corners, and black hands on the centre column at y0+1 and y0+2.
 */
export function clockFace(g, face, plane, at, y0 = 28, opts = {})

/**
 * The spire's lightning-rod finial: two rods at (cx, y0..y0+1, cz), facing up. The copper pyramid under them is the
 * roof tool's (`$MCD roof`, pyramid, copper palette), not written here.
 */
export function copperSpire(g, cx, cz, y0 = 42, opts = {})

/**
 * A fireplace firebox in the wall on side `side` (west or east, the side the back wall is on): the opening at x, two
 * cells deep from z0, two cells high from y0. A lit campfire sits at the back, a stone_bricks hearth beside it, and a
 * lintel of two upside-down brick stairs closes the top at y0 + 2.
 */
export function fireplace(g, x, z0, side, y0, opts = {})

/**
 * Two flights of stone_brick_stairs climbing toward `facing` (north or south) across x0..x1: the first tread at
 * (x, y0, z0), the second one step on at (x, y0 + 1, z0 + one cell toward `facing`).
 */
export function frontSteps(g, x0, x1, z0, y0, facing, opts = {})

/**
 * An oak at (x, z): a six-cell log trunk from y0 (axis y), and a radius-3 crown of persistent oak_leaves centred on the
 * fifth trunk cell. Writes nothing at y0 or below, so the ground stays with the grounds part.
 */
export function oakTree(g, x, z, y0 = 1, opts = {})
```

### vocab/h2.mjs

```js
// The eight h2 helpers from plan.md VOCABULARY: stringCourse, flatArch, porticoColumn, townHallLetters, belfryOpening,
// dormer, stairFlight, flagpole. Same contract as h1: each takes the build grid first (a Grid, or a guard/runParts view),
// then the position the plan gives it (facing where it has one), then an optional { over }. Coordinates are absolute,
// inclusive, x east, y up, z south. Walls are named by face: the plane is the wall's z (north/south) or x (east/west),
// and a run along the wall is x0..x1 (z0..z1 on east/west). Every write goes through place(): it lands only into air,
// so a helper can't cut into an earlier part's cells or the ground under it. { over: true } writes into anything inside
// the helper's own cells instead (a flush arch laid into a built wall, an opening carved through one). Each returns
// { placed, skipped, box }, where box is the footprint it wrote into.

/**
 * stringCourse(g, face, plane, x0, x1, y = 10): smooth_quartz across the run at y, flush with the wall. On the front
 * (north, the default for proud) a quartz_slab top half sits one block proud of the course. Writes into air only.
 */
export function stringCourse(g, face, plane, x0, x1, y = 10, { proud = face === "north", over = false } = {})

/**
 * flatArch(g, face, plane, x0, x1, y): the flat arch over an opening, flush in the wall at y. The two ends are upside-down
 * quartz_stairs facing outward (away from the centre); an odd span gets a chiseled_quartz_block keystone in the middle.
 * The arch sits in the wall the shell built, so the dressing part passes { over: true } to lay it on the brick.
 */
export function flatArch(g, face, plane, x0, x1, y, { over = false } = {})

/**
 * porticoColumn(g, x, z, { base = 4, top = 14 }): one portico column on the front plane at (x, z). A chiseled_quartz_block
 * base at y = base, a quartz_pillar (axis y) from base + 1 to top. Writes into air only (the porch is open).
 */
export function porticoColumn(g, x, z, { base = 4, top = 14, over = false } = {})

/**
 * townHallLetters(g, face, plane, x0, x1, y0, { text, height = 2 }): the lettering on the entablature face, a 1-row wall
 * sign centred on the band (plan's "sign writer" fallback). The band is 2 rows, too short for block letters, and the
 * banner style would repaint the band's quartz, so the sign goes on the wall in front of it and the band keeps its
 * blocks. The sign is air-only in front of the wall; its back block must already be there.
 */
export function townHallLetters(g, face, plane, x0, x1, y0, { text = "TOWN HALL", height = 2 } = {})

/**
 * belfryOpening(g, face, plane, x0, x1, y0 = 32, { over }): a belfry opening on one face, cleared to air at y0..y0+1 across
 * the run, with the centre cell at y0+2 also clear (the bell hangs behind it). Upside-down quartz_stairs over the two ends
 * at y0+2 make the arch. Carving the shaft wall takes { over: true }.
 */
export function belfryOpening(g, face, plane, x0, x1, y0 = 32, { over = false } = {})

/**
 * dormer(g, face, plane, cx, y, { over }): the front of a gable dormer centred on cx, its window bottom at y. A 3 x 2
 * glass_pane window, deepslate_tiles cheeks two out on each side, and a quartz_stairs hood (upside-down, lip toward the
 * street) across the top at y + 2. The dormer is one plane deep: the roof round it is the roof part's. Air only unless over.
 */
export function dormer(g, face, plane, cx, y, { over = false } = {})

/**
 * stairFlight(g, x0, x1, z0, y0, { dir, steps, rail }): a straight flight across x0..x1 that climbs toward dir (north or
 * south). Step i is stone_brick_stairs at (x, y0 + i, z0 + i * step), facing dir; each step is backed by bricks down to
 * the floor. rail: "east" or "west" puts a dark_oak_fence post one above each step on that edge, the open side, and
 * leaves the other column as a clear lane. Air only unless over.
 */
export function stairFlight(g, x0, x1, z0, y0, { dir = "north", steps = 7, rail = "none", over = false } = {})

/**
 * flagpole(g, x, z, { base = 1, top = 10 }): a flagpole on the front plane at (x, z). A stone_brick_wall foot at base, a
 * dark_oak_fence shaft from base + 1 to top, and a standing blue_banner on the top post. Air only unless over.
 */
export function flagpole(g, x, z, { base = 1, top = 10, over = false } = {})
```

### vocab/h3.mjs

```js
// Hand-placed details from plan.md VOCABULARY: waterTable, windowHood, entablatureBand, towerBand, bellHang,
// chimneyStack, ladderShaft, lampPost. Each takes its position (and facing) as arguments, places blocks through the
// build library, and returns { placed, skipped }: skipped counts cells already built, which are left alone.
//
// Writes stay inside the footprint the caller gives, and only into air, unless opts.over is set: a flush dressing laid
// into a wall the shell already built (a band, an arch, the tower's cornice ring) needs { over: true }; a proud piece
// (a hood, a water table's stairs, the tower cornice's lips) and furniture stay air-only. Nothing is written below the
// y the caller gives, so ground, sand and floor are never touched. Leaves are persistent=true; a hanging light
// (bell) hangs from the block above it.
//
// Coordinates: x east, y up, z south. For a face (north/south/east/west), `plane` is the wall-plane coordinate
// (z for north and south, x for east and west), and `x0`/`x1` run along the face (x for north/south, z for east/west).
// "Proud" cells sit `proud` steps outward from the plane (north is −z).

/**
 * Plinth cap / water table: stone_bricks ring at y on the box x0..x1, z0..z1, with upside-down stone_brick_stairs proud
 * +1 on the north, west and east sides (their backs to the wall, so the lip reads).
 */
export function waterTable(g, { x0, x1, z0, z1, y = 3 }, opts = {})

/**
 * Hood over an upper window: upside-down quartz_stairs proud +1 across x0..x1 at y, backs into the wall.
 * face, plane: the wall the window is in (plane 10 for the front range, 9 for a pavilion).
 */
export function windowHood(g, { face, x0, x1, y, plane }, opts = {})

/**
 * Entablature over a portico: smooth_quartz architrave at y, quartz_block frieze at y + 1, solid across x0..x1, z0..z1.
 */
export function entablatureBand(g, { x0, x1, z0, z1, y = 15 }, opts = {})

/**
 * A quartz_block course round the clock tower shaft (the ring of the box x0..x1, z0..z1) at y. proud: upside-down
 * quartz_stairs one cell outside the ring on all four sides, the cornice's lip.
 */
export function towerBand(g, { x0, x1, z0, z1, y, proud = false }, opts = {})

/**
 * A bell hung from a ceiling attachment at (x, y, z), under a dark_oak_log beam at y + 1 three long along `axis`
 * (centred on the bell). Leaves y - 1 and below clear, so a 2-high lane stays under it.
 */
export function bellHang(g, { x, y, z, axis = "x", facing = "north" }, opts = {})

/**
 * A 2x2 chimney stack at x0..x0+1, z0..z0+1: bricks from base to cap - 1, a deepslate_bricks band at cap - 2, a
 * stone_brick_slab cap at cap stepped out 1 on every side, and a lit campfire (not a signal fire) on the corner cell
 * (x0, z0) one above the cap.
 */
export function chimneyStack(g, { x0, z0, base = 1, cap = 23 }, opts = {})

/**
 * A ladder up the column (x, z) from y0 to y1, facing `facing` (the wall it leans on is the opposite side). holes: the
 * floor y's to clear at this column first (the one exception to air-only: a floor left with a ladder hole).
 */
export function ladderShaft(g, { x, z, y0, y1, facing = "north", holes = [] }, opts = {})

/**
 * A lamp post on the column (x, z): stone_brick_wall base at y, dark_oak_fence at y + 1 and y + 2, a standing lantern
 * at y + 3 on the fence.
 */
export function lampPost(g, { x, z, y = 1 }, opts = {})
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
 *   runParts(g, [["shell", shell.build], ["garden", garden.build]], { palette: "palette.json", roof: "roof.json" })
 */
export function runParts(g, list, { palette, roof, log = console.log, report = "parts-report.json" } = {})

/** Lettering in a band: plaque(g, "LEAGUE HALL", { at, face, width, height, letter?, material?, frame?, style?, relief? }) */
export const plaque = (g, text, o) => ...

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
  to three, through doors and gates) from the entrance and says, per room box, whether it's reached, unreachable, or
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
the roof is skipped with a note. `mcd overworld palette.json [--write]` lists (drops) nether and end blocks. The Grid keeps block-entity NBT (sign text, chest contents) and entities and
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
