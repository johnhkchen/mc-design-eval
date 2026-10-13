# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Plan: shop house with back return and kitchen garden (butcher's copy)

A generic red-brick shop house, the kind repeated down any high street: a tall shopfront under a painted
fascia and striped awning, two storeys of the family's home above with white-trimmed sash windows, a steep
dark-slate FRONT GABLE to the street, and a lower two-storey **back return** (rear wing) on the west half that
makes the L. The east half of the plot behind the house is the fenced vegetable garden, reached from the
kitchen's back door and by a side passage with a gate from the street.

Orientation: the street is NORTH (-z), x runs along the street. All coordinates are world. The sockets are in
sockets.json (`sockets layout --face north --at 18,5,6 --units "DS"`) and are never moved.

## SITE

| item | x | y | z | note |
|---|---|---|---|---|
| lot | 0..27 | 0..34 | 0..38 | |
| ground fill | 0..27 | 0..4 | 3..38 | `dirt` (stone y 0..2), solid everywhere except inside the socket boxes and pits |
| lot surface (garden, passage, strips) | 0..27 | 5 | 6..38 | `grass_block` with patches; people stand at y 6 = shop-floor level |
| road | 0..27 | 4 | 0..2 | `andesite`, ground below; people on it stand at y 5 |
| kerb | 0..27 | 5 | 3 | `polished_andesite` |
| pavement | 0..27 | 5 | 4..5 | `smooth_stone`; x 10..18 z 4..5 y 6..8 is the counters' keep-clear (nothing) |
| **main body** (shop + 2 home storeys) | 4..19 | 5..23 walls, roof to ~33 | 5..22 | outer walls x 4 (W), x 19 (E), z 5 (front), z 22 (rear); front wall upstairs 2 thick (z 5..6, y 14..23) |
| shop / tenant unit (A1 + A2) | 10..18 | 5..12 | 6..21 | wall lines x 10, 14, 18; counter edge z 6; fascia line z 5 |
| lobby bay (home entrance + stair) | 5..8 (walls x 4, x 9) | 5..12 | 6..21 | its own 6-wide front bay x 4..9, west of the shop |
| service aisle (keeper route) | 10..13 z 16..21, and 10..18 z 20..21 | 6..12 | | behind back walls A2 z 15 and A1 z 19; ceiling = floor y 13 |
| aisle partitions | x 14 z 19 and x 18 z 19 | 5..12 | | `bricks`, close the gaps beside A1's back wall |
| **back return (rear wing)** | 4..11 | 5..18 walls, roof to ~23 | 22..30 | walls x 4, x 11, z 30; shares the main body's rear wall z 22 |
| chimney E (main, external breast) | 20..21 | 5..31 | 13..14 | own footing on the ground at y 5, against the east wall x 19 |
| chimney S (wing kitchen, external breast) | 7..8 | 5..26 | 31..32 | own footing, against the wing's south gable z 30 |
| side passage | 20..25 | 5 | 6..21 | `dirt_path`/`gravel` mixed, pavement to the garden gate |
| west strip | 0..3 | 5 | 6..21 | grass, a `spruce_fence` along x 1 z 6..21 and z 6 x 1..3 (closes it from the pavement) |
| garden fence | x 26 z 6..37; z 37 x 1..26; x 1 z 22..37; z 22 x 20..25 | 6 | | `spruce_fence`, posts at corners; the house walls close the rest |
| garden gate | 22..23 | 6 | 22 | double `spruce_fence_gate`, facing z (passage → garden) |
| lamp post | 25 | 6..8 fence, lantern 9 | 21 | at the gate, passage side |
| path a (along the back wall) | 15..25 | 5 | 23..24 | `dirt_path`; links keeper door (x 16) and gate |
| path b (spine) | 18..19 | 5 | 25..36 | `dirt_path`, edged with `coarse_dirt` |
| path c (from the back door) | 12..17 | 5 | 27..28 | `dirt_path`, widening to 3 at x 12 (z 26..28) at the door step |
| bed 1 | 13..16 | 5 farmland, 6 crops | 30..35 | water source x 14 z 32 (y 5); carrots / potatoes |
| bed 2 | 21..24 | 5 / 6 | 30..32 | water x 22 z 31; beetroots |
| bed 3 | 21..24 | 5 / 6 | 25..28 | water x 22 z 26; wheat |
| bed 4 (herbs, behind the wing) | 2..9 | 5 / 6 | 34..35 | water x 5 z 34; potatoes; bed edges `spruce_slab` (bottom) on grass round each bed |
| fruit tree | trunk 23 | 6..10 `oak_log` | 35 | crown of persistent `oak_leaves` x 21..25 z 33..37 y 9..13 |
| compost + stores | 12..14 | 6 | 23..24 | `composter` ×2, `barrel`s, against the rear wall (off path a) |
| water butt | 12 | 6 | 29 | `cauldron` (water_cauldron level 3) at the wing corner, under the eave |
| bench | 12 | 6 | 25 | spruce stair facing east, beside the back door |

Socket envelopes (fixed): A1 deep box x 15..17 y 1..11 z 6..18, back wall z 19, pit y 0, hopper 16,5,9;
A2 shallow box x 11..13 y 1..10 z 6..14, back wall z 15, ceiling y 11, hoppers z 9. Wall lines (glass) x 18 and
x 14 at z 6..18 y 1..11, x 10 at z 6..14 y 1..10. Keep clear: x 10..18, y 6..8, z 4..5.

## ROOFS

| roof | form | where | height |
|---|---|---|---|
| main roof | `$MCD roof` preset **shop** (steep front gable to the street), dark-slate mix | footprint x 4..19, z 5..22, `ridgeAxis` z, `front` n, `y` 24 | eaves course y 24 on x 4 / x 19; overhang 2 (spans 16): eaves to x 2 and x 21, verges to z 3 (over the pavement, high above it) and z 24; ridge over x 11.5 at about y 32–33, `ridge` slab |
| side dormers | from the preset (span 13+), one per side slope | centred z 13..14 on W and E slopes (not over chimney E: keep) | in the lower slope |
| main gables (z 5 front, z 22 rear) | `gable: "bricks"` (the wall continues); `verge: "dark_oak"` | triangle y 24..~32 | loft windows kept open (see `keep`) |
| back return roof | `$MCD roof` preset **cottage**, its own roof.json rect | footprint x 4..11, z 23..30 (NOT z 22: the main rear wall stays whole), `ridgeAxis` z, `front` s, `y` 19 | eaves y 19 on x 4 / x 11, overhang 1 (to x 3 / x 12 and z 31); ridge over x 7.5 about y 23, runs into the main rear gable below its verge; `gable: "bricks"` |
| trusses | `"trusses": {"material": "stripped_dark_oak_log"}` on the main roof (open loft over the y 23 ceiling) | | |
| keep (both roof.json) | chimney E x 20..21 z 13..14 y 22..31; chimney S x 7..8 z 31..32 y 18..26; loft windows x 11..12 y 26..27 at z 5 and z 22; wing gable window x 7..8 y 20..21 z 30 | | |

Material: mix `deepslate_tiles` 50 / `cobbled_deepslate` 30 / `polished_deepslate` 20, eave `polished_deepslate`,
ridge `deepslate_tile_slab`. Dark slate over red brick clears the contrast rule. Where the wing roof meets the
main rear wall the slates butt the brick (no flashing part needed); nothing built by hand.

## FACADES

### North (street) front, z 5 — base to top
| zone | y | what | material / depth |
|---|---|---|---|
| plinth | 5..6 | x 4..9 and x 19 at z 5 (not under the open shop front) | base, flush |
| shopfront pilasters | 5..12 | x 9 and x 19 at z 4 (1 proud), `stripped_dark_oak_log` axis y; capital y 12 = `dark_oak_planks` with an upside-down `dark_oak_stairs` at z 3 | shopfront, +1 |
| corner pier W | 5..12 | x 4 z 5, quoins (trim) paired y 7-8, 11-12 | trim, flush |
| open shop front | 6..8 | x 10..18 over the counters, OPEN (no glass, no frame, no pier: wall lines are in the keep-clear) | air (engineer's) |
| fascia (name board) | 9..12 | x 10..18 z 5, one continuous 9 x 4 board (closes A1 / A2 fascia cells) | `red_nether_bricks`, flush; "BUTCHER" in white banner letters at z 4, y 10..12 (`plaque`, `material: null`) |
| fascia consoles | 9..12 | the pilaster capitals at x 9 and x 19 frame the board's ends | shopfront |
| awning | 9 | x 10..18 at z 4 alternating `red_wool` / `white_wool` per column (butcher's stripe), open `dark_oak_trapdoor` valance at z 3 y 9 | +1 / +2, starts at y 9 (≥ y 4 above the shop floor) |
| hanging shop sign | 10 | `dark_oak_hanging_sign` "BUTCHER" at x 20 z 3 on a `dark_oak_fence` arm x 20 z 3..4 y 11 off the x 19 pilaster | accent, outside the keep-clear |
| lobby bay | 6..12 | x 5..8 brick; door x 6..7 (see OPENINGS); hood of `dark_oak_slab` (bottom) x 5..8 z 4 y 9 on two upside-down `dark_oak_stairs` at x 5 and x 8 z 4 y 8; lanterns hanging under the hood ends x 5 and x 8 y 8 at z 3 | joinery, +1 |
| shop cornice | 13 | x 4..19 at z 4: `smooth_quartz_stairs` upside-down facing south (into the wall), over the pilasters too | trim, +1 |
| first floor | 14..17 | brick, 3 windows 2 wide (x 6..7, 11..12, 16..17), glass recessed at z 6 (reveal z 5 air), lintel `smooth_quartz` z 5 y 17 x 5..8 / 10..13 / 15..18 (1 wider each side) | walls; windows −1 |
| string course | 18 | x 4..19 z 5, `smooth_quartz`, flush; sill `smooth_quartz_slab` (top) at z 4 under each 2nd-floor window | trim |
| second floor | 19..22 | same three windows y 19..21, lintels y 22; shutters: open `dark_oak_trapdoor`s at z 4 beside each window (x 5/8, 10/13, 15/18) | windows −1, shutters +1 |
| eaves band | 23 | x 4..19 z 5 `smooth_quartz` flush (gable foot) | trim |
| quoins | 13..23 | x 4 and x 19 at z 5 and on the side faces z 6: `smooth_quartz`, paired 2 high every other pair (y 14-15, 18-19, 22-23) | trim, flush |
| front gable | 24..~32 | brick triangle from the roof tool; loft window x 11..12 y 26..27 glass, `smooth_quartz` sill slab y 25 z 4 and lintel y 28 | walls |

The front is mirror-symmetric about x 11.5 from y 13 up; the shopfront is framed by the two dark-oak pilasters
x 9 / x 19 with the lobby door as a lesser bay on the west.

### East side, x 19 (seen down the passage)
Plinth y 5..6; blank brick at the shop storey (wall line x 18 behind it); windows y 14..16 and y 19..21 at
z 9..10 and z 17..18 (2 wide, glass at x 19, quoin-trim lintel); chimney E breast x 20..21 z 13..14 proud by 2,
`bricks` with a `deepslate_bricks` band at y 29, cap ring of `brick_slab` (top) stepping out 1 (x 19..22,
z 12..15) at y 31 except the flue; `hay_block` y 30 + lit signal `campfire` y 31 at x 21 z 14. Dormer above.

### West side, x 4
Plinth; blank brick to y 12 (lobby); windows y 14..16 and y 19..21 at z 9 and z 18 (1 wide); quoins at both corners.
Side dormer above.

### Rear, z 22 (garden face)
Plinth y 5..6; keeper's door x 16; a small window x 12 y 7..8 lighting the aisle; upstairs windows x 13..14 and
x 16..17 at y 14..16 and y 19..21 with `smooth_quartz` lintels; rear gable with loft window x 11..12 y 26..27.

### Back return (wing), x 4..11 z 22..30
Brick, plinth y 5..6, `smooth_quartz` eaves band y 18 at z 30 and on x 4 / x 11. East face x 11: kitchen window
z 24..25 y 7..9, back door z 27, upstairs windows z 24..25 and z 27..28 y 14..16. South gable z 30: chimney S breast
x 7..8 z 31..32 (`bricks`, band `deepslate_bricks` y 24, `brick_slab` cap ring at y 26 stepping out to x 6..9
z 30..33 on the free sides, `hay_block` y 25 + lit signal `campfire` y 26 at x 8 z 32); windows x 5 and x 10 at
y 14..16; gable window x 7..8 y 20..21 is behind the stack: leave it out (keep is for the stack only). West face x 4:
window z 26..27 y 14..16.

## MATERIALS

| role | block | why |
|---|---|---|
| walls (~60%) | `bricks` | warm red high-street brick, reads red at distance |
| trim (~20%) | `smooth_quartz`, `smooth_quartz_stairs`, `smooth_quartz_slab` | white painted dressings: cornice, string course, lintels, quoins; strong contrast on brick |
| shopfront frame / joinery | `stripped_dark_oak_log` (pilasters), `dark_oak_planks`, `dark_oak_stairs`, `dark_oak_slab`, `dark_oak_door`, `dark_oak_trapdoor`, `dark_oak_fence`, `dark_oak_hanging_sign` | dark painted timber framing the shop and the openings |
| fascia (the tenant's colour) | `red_nether_bricks` | deep butcher's maroon board, white letters |
| awning (tenant accent) | `red_wool` + `white_wool` | red-and-white butcher's stripe |
| base / plinth | `polished_deepslate`, `polished_deepslate_stairs` | dark plinth, ties to the roof |
| roof | `deepslate_tiles` / `cobbled_deepslate` / `polished_deepslate` mix, `deepslate_tile_slab` ridge, `dark_oak` verges | dark slate over red brick |
| chimneys | `bricks`, band `deepslate_bricks`, cap `brick_slab`, `hay_block` + `campfire` | |
| glass | `glass_pane` | |
| street | `andesite` road, `polished_andesite` kerb, `smooth_stone` pavement | |
| ground / garden | `grass_block` with `coarse_dirt`, `podzol` patches; `dirt_path`, `gravel`; `farmland`, `water`; crops `carrots`, `potatoes`, `beetroots`, `wheat`; `spruce_fence`, `spruce_fence_gate`, `spruce_slab` bed edges; `oak_log` + `oak_leaves` (persistent) | |
| shop display (sockets.json) | A1 `pink_terracotta` (pork); A2 stalls `pink_terracotta`, `brown_mushroom_block` (baked chicken), `red_terracotta` (steak); machines in `dark_oak` | written in sockets.json `display` / `wood` |

All ids checked with `$MCD blocks --check` (all known). Reskin = swap walls / trim / fascia+awning / roof; the
fascia, awning, hanging sign and display are the only tenant-specific parts.

## OPENINGS

| opening | x | y | z | size |
|---|---|---|---|---|
| shop front (open counters) | 10..18 | 6..8 | 5 | continuous, the engineer's |
| home front door (double) | 6..7 | 6..7 | 5 | `dark_oak_door` pair facing north, hinges outward; fanlight `glass_pane` y 8 |
| lobby window (stair light) | 6..7 | 10..11 | 5 | 2 x 2, above the hood |
| keeper's door (lobby → aisle) | 9 | 6..7 | 20 | 1 x 2, in the lobby's east wall |
| keeper's rear door (aisle → garden) | 16 | 6..7 | 22 | 1 x 2, step = path a |
| aisle window | 12 | 7..8 | 22 | 1 x 2 |
| lobby → wing door | 6 | 6..7 | 22 | 1 x 2 |
| wing back door (kitchen → garden) | 11 | 6..7 | 27 | 1 x 2, faces east |
| kitchen window | 11 | 7..9 | 24..25 | 2 x 3 |
| first-floor front windows | 6..7, 11..12, 16..17 | 14..16 | glass z 6 | 2 x 3 |
| second-floor front windows | 6..7, 11..12, 16..17 | 19..21 | glass z 6 | 2 x 3 |
| front loft window | 11..12 | 26..27 | 5 | 2 x 2 |
| east windows | 19 | 14..16 and 19..21 | 9..10, 17..18 | 2 x 3 |
| west windows | 4 | 14..16 and 19..21 | 9, 18 | 1 x 3 |
| rear windows | 13..14, 16..17 | 14..16 and 19..21 | 22 | 2 x 3 |
| rear loft window | 11..12 | 26..27 | 22 | 2 x 2 |
| main ↔ wing upstairs door | 7 | 14..15 | 22 | 1 x 2 |
| wing upstairs windows | 11 (z 24..25, 27..28); 5 and 10 (z 30); 4 (z 26..27) | 14..16 | | 2 x 3 east, 1 x 3 others |

## RESERVED

| cells | for |
|---|---|
| socket boxes, pits y 0, back walls (A1 z 19, A2 z 15), A2 ceiling y 11, wall lines x 10/14/18 | runParts / redstone fit-out only |
| keep-clear x 10..18, y 6..8, z 4..5 | nothing at all |
| fascia x 10..18 y 9..12 z 5; letters / awning x 10..18 y 9..12 z 3..4; hanging sign x 20 y 10..11 z 3..4 | shopfront part (decorator + sign writer) |
| service aisle x 10..13 z 16..21 and x 10..18 z 20..21, y 6..12 | clear keeper route, lit (lanterns hung from the y 13 floor) |
| stair flight 1 | x 7..8, steps y 6..12 at z 9..15 rising south (`facing` south), arriving on the y 13 floor at z 16; well open at y 13 over x 7..8 z 10..15 |
| stair flight 2 | x 5..6, steps y 14..17 at z 15..12 rising north, from the y 13 floor at z 16; arrives on y 18 at z 11; well open at y 18 over x 5..6 z 12..16; rail (`dark_oak_fence`) on the open sides above |
| lobby lane | x 5..6 z 6..21 at y 6..8 (door → keeper's door → wing door) |
| loft hatch | x 16 y 23 z 20 (ladder on the rear wall x 16 z 21 y 19..22, trapdoor in the ceiling) |
| chimney stacks | E x 20..21 z 13..14 y 5..31; S x 7..8 z 31..32 y 5..26 (roof keep) |
| fireplaces | main: first-floor hearth only (x 18 is a wall line below y 12), firebox x 18 z 13..14 y 14..15 against the breast, flue through x 19 into chimney E; wing kitchen range x 7..8 z 29 y 6..7 (firebox into the south wall) |
| garden water cells | x 14 z 32, x 22 z 31, x 22 z 26, x 5 z 34 at y 5 (the ground leaves them) |
| loft windows, pilasters x 9 / x 19 z 4 y 5..12, shop cornice z 4 y 13 | later parts stand on / fill these; the shell leaves them |

## FLOORS

| storey | floor block y | interior y | volume |
|---|---|---|---|
| shop storey: shop (sockets + aisle) | 5 | 6..12 | x 10..18 z 6..21 |
| shop storey: lobby / stair hall | 5 | 6..12 | x 5..8 z 6..21 |
| shop storey: wing kitchen + scullery | 5 | 6..12 (beamed ceiling at y 12) | x 5..10 z 23..29 |
| first floor (home: living room front, kitchen-dining via wing) | 13 | 14..17 | main x 5..18 z 7..21; wing x 5..10 z 23..29 (sitting room) |
| second floor (bedrooms: parents front, 2 children rear, bath) | 18 | 19..22 | main x 5..18 z 7..21 |
| loft (storage, open trusses) | 23 (ceiling of the 2nd floor) | 24..~31 | under the main roof, by ladder hatch |
| garden | 5 (surface) | 6 up | x 12..25 z 23..36, plus x 2..10 z 31..36 behind the wing |

Wing ground floor is level with the shop floor (y 5) and the garden (y 5): the back door steps straight onto
path c. The main body's floor above the sockets is y 13 (sockets need 12+), giving a tall shop storey and a
4-row fascia.

---
# DESIGNER SECTIONS

## PALETTE
| role | block | variants |
|---|---|---|
| walls | `bricks` | `brick_stairs`, `brick_slab`, `brick_wall` |
| trim | `smooth_quartz` | `smooth_quartz_stairs`, `smooth_quartz_slab` |
| plinth | `polished_deepslate` | `polished_deepslate_stairs` |
| shopfront/joinery | `stripped_dark_oak_log`, `dark_oak_planks` | `dark_oak_stairs/slab/door/trapdoor/fence/fence_gate/hanging_sign/wall_sign/pressure_plate` |
| fascia | `red_nether_bricks` | letters `white_banner` |
| awning | `red_wool`, `white_wool` | |
| roof | `deepslate_tiles`, `cobbled_deepslate`, `polished_deepslate` | `deepslate_tile_slab`, `deepslate_tile_stairs`, truss `stripped_dark_oak_log` |
| chimney | `bricks`, `deepslate_bricks`, `brick_slab` | `hay_block`, `campfire` (lit, signal_fire true) |
| glass | `glass_pane` | |
| interior floors | shop aisle `stone_bricks`; lobby `spruce_planks`; living/dining/bedrooms `oak_planks`; kitchen `bricks` slabs-free flagstone `stone_bricks`; bath `smooth_quartz`; loft `spruce_planks` | |
| interior furniture | `spruce_*`, `oak_*`, `barrel`, `bookshelf`, `red_bed`, `red_carpet`, `white_carpet`, `furnace`, `smoker`, `blast_furnace`, `crafting_table`, `cauldron`, `candle`, `flower_pot`, `lantern`, `iron_chain` | |
| garden | `grass_block`, `coarse_dirt`, `podzol`, `dirt_path`, `gravel`, `farmland`, `water`, `carrots`, `potatoes`, `beetroots`, `wheat`, `spruce_fence`, `spruce_fence_gate`, `spruce_slab`, `composter`, `barrel`, `water_cauldron`, `oak_log`, `oak_leaves` | |
| street | `andesite`, `polished_andesite`, `smooth_stone` | |
| tenant (swap on reskin) | `red_nether_bricks`, `red_wool`, display blocks | |
All ids checked with `$MCD blocks --check` (only the generic "bed" is not an id: use `red_bed`).

## VOCABULARY
- `brickWall(box, plinth=true)`: `bricks` body, `polished_deepslate` y5..6, openings left as air.
- `quoinPair(x,z,y)`: two `smooth_quartz` blocks stacked, every other pair.
- `cornice(x0,x1,z,y)`: `smooth_quartz_stairs` half top, facing into wall.
- `pilaster(x,z)`: log axis y y5..11, `dark_oak_planks` y12, upside-down `dark_oak_stairs` at z-1.
- `fascia(x0,x1,y0,y1,name,material)`: `red_nether_bricks` board flush z5; `plaque(g,name,{material:null})` at z4; tenant-swappable.
- `awning(x0,x1,z,y,colA,colB)`: alternating wool columns; valance of open trapdoors one out.
- `hangingSign(x,z,y,text)`: fence arm to pilaster + `dark_oak_hanging_sign` text.
- `hood(x0,x1)`: slab bottom on two upside-down stairs, lanterns hanging at ends.
- `sashWindow(face,x,y,w,h)`: pane connections set, recess 1, lintel quartz, top-slab sill.
- `shutterPair(x,y,face)`: open `dark_oak_trapdoor` flat to wall each side.
- `doorPair(x,y,z,facing)`: both halves, matching hinge, `dark_oak_door`.
- `setDisplay(socket, blocks)`, `setWood(wood)`: sockets.json edit.
- `aislePartition`: bricks x14,x18 z19 y5..12.
- `chimneyStack(x,z,base,bandY,hayY,capY)`: 2x2 bricks, band, brick_slab cap one out, hay_block, lit signal campfire.
- `hearth(x,y,z,facing)`: stone floor, lit campfire, upside-down stair lintel, flue.
- `stairFlight(x,z,y0,y1,dir)`: `spruce_stairs` facing = walking-up direction, half bottom, slab stringer, fence rail on open sides with a gap at top.
- `ladderHatch(x,z,y0,y1)`: ladders away from wall, open trapdoor at top.
- `hangLantern(x,y,z)`: lantern hanging=true below a block or iron_chain.
- `gardenBed(x0,z0,x1,z1,waterAt,crop)`: farmland, water cell, crops above, `spruce_slab` bottom border.
- `pathRun(pts,width)`, `fenceRun(pts)`, `gateDouble(x,z,facing)`, `lampPost(x,z)`, `fruitTree(x,z)`, `compostStore`, `waterButt`, `bench`.
- Furniture for designers: `butcherBlock` (log + pressure plate/cleaver), `meatRail` (iron chain + red candles), `settle`, `bunk`, `table(fence+slab)`, `chair(stairs)`.

## ROOMS
(inner air boxes; first-floor y14..17, second y19..22)
1. Lobby / stair hall (ground): [5,6,6,8,12,21], family hall: lane x5..6; doors north double x6..7 z5, keeper's x9 z20, wing x6 z22.
2. Keeper's aisle: [10,6,16,13,12,21] plus [14,6,20,18,12,21]; doors x9 z20 (lobby), x16 z22 rear.
3. Wing kitchen & scullery: [5,6,23,10,12,29]; back door x11 z27, door x6 z22.
4. Stair hall, first floor: [5,14,7,8,17,21] with wells.
5. Living room: [9,14,7,18,17,15]; hearth x18 z13..14; door x9 z~12 to hall.
6. Dining room: [9,14,16,18,17,21]; door x9 z18 to hall.
7. Wing sitting room: [5,14,23,10,17,29]; door x7 z22 y14..15.
8. Second-floor hall: [5,19,7,8,22,16]; landing x5..6.
9. Parents' bedroom: [9,19,7,18,22,11]; door x17 z12 off corridor.
10. Corridor: [9,19,13,18,22,13]; door x9 z13 from hall.
11. Child's room A: [9,19,15,13,22,21]; door x11 z14.
12. Child's room B: [15,19,15,18,22,21]; door x16 z14.
13. Bathroom: [5,19,18,8,22,21]; door x7 z17 y19..20.
14. Loft: [7,24,8,16,27,21] open trusses, ladder x16 z21, hatch 16,23,20.

## PARTS
1. Masonry shell — `parts/shell.mjs`: site fill, street, walls main/wing, floors y13/18/23, partitions, plinth, quoins, strings, openings as air, aisle partitions.
2. Roofs — `parts/roof.mjs`: roof.json main + wing, keeps, trusses, dry-run.
3. Stairs and joinery — `parts/joinery.mjs`: stair flights, wells, rails, ladder, interior doors, glazing, doors, shutters.
4. Shopfront — `parts/shopfront.mjs`: pilasters, fascia + letters, awning, hanging sign, hood, cornice, sockets.json display/wood.
5. Chimneys, hearths, lights — `parts/hearth.mjs`: both stacks, hearths, aisle lanterns, door lanterns.
6. Grounds — `parts/garden.mjs`: all of SITE garden/passage/fence/gate/tree/stores.

## Checklist
- [ ] shell  - [ ] roofs  - [ ] joinery  - [ ] shopfront  - [ ] hearth  - [ ] grounds

## Notes
- Never write into socket boxes, keep-clear x10..18 y6..8 z4..5; run `$MCD sockets check`, `$MCD check`, `$MCD walk --rooms`.
- Leave chimney keep cells; breasts stand on ground footings.
- Reskin: swap walls/trim/fascia/awning/roof/display only.
```

### elements.md

```markdown
# REQUIRED ELEMENTS (butcher's shop house) — coordinates are plan.md's; part = parts/*.mjs

| # | element | construction, block by block | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Redstone shop (ground floor) | sockets A1 deep + A2 shallow left whole; counters/hoppers by runParts; open front y6..8; fascia closes y9..12; back walls z19/z15; aisle partitions `bricks` x14 / x18 z19 | x10..18 y5..12 z5..21 | shell, shopfront | `aislePartition` |
| 2 | Butcher's display | sockets.json `display` A1 pink_terracotta, A2 pink_terracotta,brown_mushroom_block,red_terracotta; `wood` dark_oak all; `fitout.counter` stays | sockets.json | shopfront | `setDisplay` |
| 3 | Shop name board | 9x4 `red_nether_bricks` fascia, "BUTCHER" `plaque` white banner letters, material null | x10..18 y9..12 z5 (letters z4) | shopfront | `fascia` |
| 4 | Striped awning | per column `red_wool`/`white_wool` at z4 y9, open `dark_oak_trapdoor` valance z3 y9; easy swap = tenant colour | x10..18 | shopfront | `awning` |
| 5 | Hanging shop sign | `dark_oak_fence` arm x20 z3..4 y11 off pilaster, `dark_oak_hanging_sign` "BUTCHER" y10 | x20 z3 | shopfront | `hangingSign` |
| 6 | Pilasters + cornice | `stripped_dark_oak_log` axis y x9/x19 z4 y5..11, `dark_oak_planks` y12, upside-down `dark_oak_stairs` z3; `smooth_quartz_stairs` upside-down cornice y13 x4..19 z4 | front | shopfront | `pilaster`, `cornice` |
| 7 | Home entrance (lobby bay) | double `dark_oak_door` x6..7 facing north, fanlight pane y8, hood slab on 2 upside-down stairs, 2 hanging lanterns | x5..8 z4..5 | glazing, shopfront | `doorPair`, `hood` |
| 8 | Brick walls, plinth, quoins, string courses | `bricks`; plinth `polished_deepslate` y5..6; `smooth_quartz` quoins paired, string y18, eaves y23 | all walls | shell | `brickWall`, `quoinPair` |
| 9 | Windows, recessed, sashes | `glass_pane` connected, glass 1 in, `smooth_quartz` lintel + `smooth_quartz_slab` top sill; plan OPENINGS table | all | glazing | `sashWindow` |
| 10 | Shutters (2nd floor) | open `dark_oak_trapdoor` beside each window at z4 | x5/8,10/13,15/18 y19..21 | glazing | `shutterPair` |
| 11 | Roof, dormers, trusses | roof tool, main preset shop + wing preset cottage, dark slate mix, dark_oak verge, trusses stripped_dark_oak_log | plan ROOFS | roof | roof.json |
| 12 | Chimney E + signal smoke | bricks 2x2 stack from y5, `deepslate_bricks` band y29, `brick_slab` top cap y31, `hay_block` y30, lit signal `campfire` y31 at 21,14; flue air | x20..21 z13..14 | hearth | `chimneyStack` |
| 13 | Chimney S (wing) | same, band y24, cap y26, hay y25 + campfire y26 at 8,32 | x7..8 z31..32 | hearth | `chimneyStack` |
| 14 | Hearths | first-floor firebox x18 z13..14 y14..15 (stone floor, lit campfire, upside-down stair lintel, flue into breast); wing range x7..8 z29 y6..7 (lit furnace + smoker, flue to stack S) | | hearth | `hearth` |
| 15 | Stairs between floors | flight 1 `spruce_stairs`... see Vocabulary `stairFlight`; wells, `dark_oak_fence` rails | plan RESERVED | stairs | `stairFlight` |
| 16 | Loft ladder + hatch | `ladder` x16 z21 y19..22 facing north (away from wall), `dark_oak_trapdoor` open at 16,23,20 | | stairs | `ladderHatch` |
| 17 | Back return (L-wing) | brick walls, own cottage roof, kitchen, door x11 z27 | x4..11 z22..30 | shell, roof | |
| 18 | Vegetable garden: 4 beds | `farmland` with water source, crops carrots/potatoes/beetroots/wheat, `spruce_slab` edges | plan SITE | grounds | `gardenBed` |
| 19 | Paths | `dirt_path` a, b, c, `coarse_dirt` edges, passage dirt_path/gravel | | grounds | `pathRun` |
| 20 | Fence + gate | `spruce_fence` perimeter, double `spruce_fence_gate` x22..23 z22 y6 | | grounds | `fenceRun`, `gateDouble` |
| 21 | Lamp post | `spruce_fence` x25 z21 y6..8, `lantern` y9 | | grounds | `lampPost` |
| 22 | Fruit tree | `oak_log` trunk x23 z35 y6..10, persistent `oak_leaves` crown | | grounds | `fruitTree` |
| 23 | Garden furniture | 2 `composter` + `barrel`s x12..14 z23..24; `water_cauldron` level 3 at 12,6,29; `spruce_stairs` bench 12,6,25 facing east | | grounds | `compostStore`, `waterButt`, `bench` |
| 24 | Lighting | lanterns hanging in aisle from y13 floor; each room lit ≥8 | | lighting (hearth part) | `hangLantern` |
| 25 | Street surfaces | road/kerb/pavement, west strip with fence | | shell | |
```

### rooms.json

```json
{"entrance":[6,5,3],"rooms":[{"name":"Lobby stair hall","box":[5,6,6,8,12,21]},{"name":"Keeper's aisle","box":[10,6,16,13,12,21]},{"name":"Wing kitchen and scullery","box":[5,6,23,10,12,29]},{"name":"First-floor stair hall","box":[5,14,7,8,17,21]},{"name":"Living room","box":[9,14,7,18,17,15]},{"name":"Dining room","box":[9,14,16,18,17,21]},{"name":"Wing sitting room","box":[5,14,23,10,17,29]},{"name":"Second-floor hall","box":[5,19,7,8,22,16]},{"name":"Parents' bedroom","box":[9,19,7,18,22,11]},{"name":"Upper corridor","box":[9,19,13,18,22,13]},{"name":"Child's room A","box":[9,19,15,13,22,21]},{"name":"Child's room B","box":[15,19,15,18,22,21]},{"name":"Bathroom","box":[5,19,18,8,22,21]},{"name":"Loft","box":[7,24,8,16,27,21]}]}
```

### palette.json

```json
{"roles":{"ground":["dirt","stone"],"street":["andesite","polished_andesite","smooth_stone","stone_bricks","stone_brick_slab"],"walls":["bricks","brick_stairs","brick_slab","brick_wall"],"trim":["smooth_quartz","smooth_quartz_stairs","smooth_quartz_slab"],"plinth":["polished_deepslate","polished_deepslate_stairs"],"joinery":["stripped_dark_oak_log","dark_oak_planks","dark_oak_stairs","dark_oak_slab","dark_oak_door","dark_oak_trapdoor","dark_oak_fence","dark_oak_fence_gate","dark_oak_hanging_sign","dark_oak_wall_sign","dark_oak_pressure_plate"],"fascia":["red_nether_bricks","white_banner","white_wall_banner"],"awning":["red_wool","white_wool"],"roof":["deepslate_tiles","cobbled_deepslate","polished_deepslate","deepslate_tile_slab","deepslate_tile_stairs","cobbled_deepslate_stairs","cobbled_deepslate_slab","polished_deepslate_slab","deepslate_bricks","dark_oak_planks"],"chimney":["bricks","deepslate_bricks","brick_slab","hay_block","campfire","deepslate_brick_slab"],"glass":["glass_pane"],"floors":["stone_bricks","spruce_planks","oak_planks","bricks","smooth_quartz"],"furniture":["spruce_stairs","spruce_slab","spruce_fence","spruce_trapdoor","oak_stairs","oak_slab","oak_fence","oak_trapdoor","barrel","bookshelf","red_bed","red_carpet","white_carpet","furnace","smoker","blast_furnace","crafting_table","cauldron","candle","red_candle","flower_pot","iron_chain","dark_oak_trapdoor","dark_oak_slab"],"garden":["grass_block","coarse_dirt","podzol","dirt_path","gravel","farmland","water","carrots","potatoes","beetroots","wheat","spruce_fence","spruce_fence_gate","spruce_slab","composter","water_cauldron","oak_log","oak_leaves","spruce_stairs","spruce_trapdoor","barrel","short_grass"],"tenant":["pink_terracotta","brown_mushroom_block","red_terracotta","hay_block"],"added_window_planters":["dark_oak_trapdoor","dark_oak_slab","dirt","oak_leaves","oxeye_daisy","flower_pot"],"lighting_and_sign_supports":["lantern","iron_chain","spruce_fence"]},"objects":["lantern","ladder","campfire","barrel","cauldron","water_cauldron","iron_chain","white_banner","white_wall_banner","dark_oak_hanging_sign","dark_oak_wall_sign","flower_pot","composter","dark_oak_door","dark_oak_trapdoor","dark_oak_slab","dark_oak_stairs","glass_pane","red_wool","white_wool","oxeye_daisy","oak_leaves","oak_log","short_grass","spruce_fence","spruce_fence_gate","spruce_trapdoor","spruce_stairs","spruce_slab","farmland","water","carrots","potatoes","beetroots","wheat","pink_terracotta","brown_mushroom_block","red_terracotta"]}
```

### make.sh

```sh
#!/bin/sh
# Build build.nbt from scratch: write a temp file beside it, then rename it into place only if the build finished.
set -e
cd "$(dirname "$0")"
tmp=$(mktemp ./build.nbt.XXXXXX)
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
trap - EXIT
echo "build.nbt ready"
```

### build.mjs

```js
// SPDX-License-Identifier: AGPL-3.0-or-later
// The shop house: the full lot, the bare ground, then every part in order. Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE, LOT, DIRT, STONE, ANDESITE, POLISHED_ANDESITE, SMOOTH_STONE, GRASS } from "./vocab/base.mjs";
import * as shell from "./parts/shell.mjs";
import * as roof from "./parts/roof.mjs";
import * as joinery from "./parts/joinery.mjs";
import * as shopfront from "./parts/shopfront.mjs";
import * as hearth from "./parts/hearth.mjs";
import * as garden from "./parts/garden.mjs";
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
import * as room12 from "./parts/room-12.mjs";
import * as room13 from "./parts/room-13.mjs";
import * as room14 from "./parts/room-14.mjs";

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(1); }

/** The bare site (plan.md SITE): stone and dirt fill, the road, kerb, pavement and lot surface. Sockets are dug out later. */
function layGround(g) {
  const { x0, x1, z0, z1 } = LOT;
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      // road (z 0..2): andesite at y 4 on dirt; lot (z 3..38): dirt fill to y 4
      for (let y = 0; y <= 2; y++) g.set(x, y, z, STONE);
      if (z <= 2) { g.set(x, 3, z, DIRT); g.set(x, 4, z, ANDESITE); }
      else { g.set(x, 3, z, DIRT); g.set(x, 4, z, DIRT); }
    }
    g.set(x, 5, 3, POLISHED_ANDESITE);                                   // kerb
    for (let z = 4; z <= 5; z++) g.set(x, 5, z, SMOOTH_STONE);           // pavement
    for (let z = 6; z <= z1; z++) g.set(x, 5, z, GRASS);                 // lot surface
  }
}

const g = new Grid(SITE_SIZE);
layGround(g);

runParts(g, [
  ["Masonry shell", shell.build],
  ["Roofs", roof.build],
  ["Stairs, glazing and doors", joinery.build, { carve: true }],
  ["Shopfront", shopfront.build],
  ["Chimneys, hearths and lights", hearth.build],
  ["Grounds and garden", garden.build],
  ["room: Lobby stair hall", room1.build],
  ["room: Keeper's aisle", room2.build],
  ["room: Wing kitchen and scullery", room3.build],
  ["room: First-floor stair hall", room4.build],
  ["room: Living room", room5.build],
  ["room: Dining room", room6.build],
  ["room: Wing sitting room", room7.build],
  ["room: Second-floor hall", room8.build],
  ["room: Parents' bedroom", room9.build],
  ["room: Upper corridor", room10.build],
  ["room: Child's room A", room11.build],
  ["room: Child's room B", room12.build],
  ["room: Bathroom", room13.build],
  ["room: Loft", room14.build],
], { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: palette ids (palette.json only), plan.md's site coordinates, and a seeded rng.

// ---- site (plan.md SITE, FLOORS) -----------------------------------------------------------------------------------

// ---- site (plan.md SITE, FLOORS) -----------------------------------------------------------------------------------
/** Full lot size as grid dimensions: x 0..27, y 0..34, z 0..38. */
export const SITE_SIZE = [28, 35, 39];

/** Street edge is north (-z); the lot runs south to z 38. */
export const LOT = { x0: 0, x1: 27, y0: 0, y1: 34, z0: 0, z1: 38 };

/** Floor-block y of each storey (the top of the floor block; interiors start one above). */
export const FLOOR_Y = { shop: 5, first: 13, second: 18, loft: 23 };

/** Main body (shop + two home storeys): outer walls x 4 (W) and x 19 (E), front z 5, rear z 22. */
export const MAIN = { x0: 4, x1: 19, z0: 5, z1: 22, wallTop: 23 };

/** Back return (rear wing): walls x 4 and x 11, south wall z 30, shares the main rear wall z 22. */
export const WING = { x0: 4, x1: 11, z0: 22, z1: 30, wallTop: 18 };

/** Shop tenant unit (A1 + A2) at the street: wall lines x 10, 14, 18; counter edge z 6; fascia line z 5. */
export const SHOP = { x0: 10, x1: 18, z0: 5, z1: 21 };

/** Keep-clear in front of the counters: nothing is built here. */
export const KEEP_CLEAR = { x0: 10, x1: 18, y0: 6, y1: 8, z0: 4, z1: 5 };

/** Side passage from the pavement to the garden gate. */
export const PASSAGE = { x0: 20, x1: 25, y: 5, z0: 6, z1: 21 };

/** Garden gate: double spruce_fence_gate, x 22..23 at z 22, passage to garden. */
export const GARDEN_GATE = { x0: 22, x1: 23, y: 6, z: 22 };

/** Chimney stacks: E against the east wall x 19, S against the wing's south gable z 30. */
export const CHIMNEY_E = { x0: 20, x1: 21, z0: 13, z1: 14, y0: 5, y1: 31 };

export const CHIMNEY_S = { x0: 7, x1: 8, z0: 31, z1: 32, y0: 5, y1: 26 };

/** Garden water cells (y 5): the ground leaves them. */
export const WATER_CELLS = [[14, 32], [22, 31], [22, 26], [5, 34]];

// ---- palette (palette.json ids only) ---------------------------------------------------------------------------------
// ground and street
export const DIRT = "dirt";

export const STONE = "stone";

export const ANDESITE = "andesite";

export const POLISHED_ANDESITE = "polished_andesite";

export const SMOOTH_STONE = "smooth_stone";

// walls and trim
export const BRICK = "bricks";

export const BRICK_STAIRS = "brick_stairs";

export const BRICK_SLAB = "brick_slab";

export const BRICK_WALL = "brick_wall";

export const QUARTZ = "smooth_quartz";

export const QUARTZ_STAIRS = "smooth_quartz_stairs";

export const QUARTZ_SLAB = "smooth_quartz_slab";

export const PLINTH = "polished_deepslate";

export const PLINTH_STAIRS = "polished_deepslate_stairs";

// shopfront and joinery (dark oak)
export const TIMBER_LOG = "stripped_dark_oak_log";

export const TIMBER = "dark_oak_planks";

export const TIMBER_STAIRS = "dark_oak_stairs";

export const TIMBER_SLAB = "dark_oak_slab";

export const TIMBER_DOOR = "dark_oak_door";

export const TIMBER_TRAPDOOR = "dark_oak_trapdoor";

export const TIMBER_FENCE = "dark_oak_fence";

export const TIMBER_FENCE_GATE = "dark_oak_fence_gate";

export const TIMBER_HANGING_SIGN = "dark_oak_hanging_sign";

export const TIMBER_WALL_SIGN = "dark_oak_wall_sign";

export const TIMBER_PRESSURE_PLATE = "dark_oak_pressure_plate";

// fascia, letters and awning (tenant-swappable)
export const FASCIA = "red_nether_bricks";

export const LETTER_BANNER = "white_banner";

export const LETTER_BANNER_WALL = "white_wall_banner";

export const AWNING_RED = "red_wool";

export const AWNING_WHITE = "white_wool";

// roof
export const ROOF_TILE = "deepslate_tiles";

export const ROOF_COBBLE = "cobbled_deepslate";

export const ROOF_POLISHED = "polished_deepslate";

export const ROOF_SLAB = "deepslate_tile_slab";

export const ROOF_STAIRS = "deepslate_tile_stairs";

export const DEEPSLATE_BRICK = "deepslate_bricks";

// chimneys, hearths and lights
export const HAY = "hay_block";

export const CAMPFIRE = "campfire";

export const LANTERN = "lantern";

export const IRON_CHAIN = "iron_chain";

export const GLASS_PANE = "glass_pane";

// interior floors and furniture
export const FLOOR_STONE = "stone_bricks";

export const FLOOR_SPRUCE = "spruce_planks";

export const FLOOR_OAK = "oak_planks";

export const SPRUCE_STAIRS = "spruce_stairs";

export const SPRUCE_SLAB = "spruce_slab";

export const SPRUCE_FENCE = "spruce_fence";

export const SPRUCE_TRAPDOOR = "spruce_trapdoor";

export const OAK_STAIRS = "oak_stairs";

export const OAK_SLAB = "oak_slab";

export const OAK_FENCE = "oak_fence";

export const OAK_TRAPDOOR = "oak_trapdoor";

export const LADDER = "ladder";

export const BARREL = "barrel";

export const BOOKSHELF = "bookshelf";

export const RED_BED = "red_bed";

export const RED_CARPET = "red_carpet";

export const WHITE_CARPET = "white_carpet";

export const FURNACE = "furnace";

export const SMOKER = "smoker";

export const BLAST_FURNACE = "blast_furnace";

export const CRAFTING_TABLE = "crafting_table";

export const CAULDRON = "cauldron";

export const CANDLE = "candle";

export const RED_CANDLE = "red_candle";

export const FLOWER_POT = "flower_pot";

// garden
export const GRASS = "grass_block";

export const COARSE_DIRT = "coarse_dirt";

export const PODZOL = "podzol";

export const DIRT_PATH = "dirt_path";

export const GRAVEL = "gravel";

export const FARMLAND = "farmland";

export const WATER = "water";

export const CARROTS = "carrots";

export const POTATOES = "potatoes";

export const BEETROOTS = "beetroots";

export const WHEAT = "wheat";

export const SPRUCE_FENCE_GATE = "spruce_fence_gate";

export const COMPOSTER = "composter";

export const WATER_CAULDRON = "water_cauldron";

export const OAK_LOG = "oak_log";

export const OAK_LEAVES = "oak_leaves";

// tenant display (butcher; sockets.json "display")
export const PORK = "pink_terracotta";

export const BAKED_CHICKEN = "brown_mushroom_block";

export const STEAK = "red_terracotta";

// ---- rng -------------------------------------------------------------------------------------------------------------
/** Seeded PRNG (mulberry32): rng(seed)() returns a float in [0, 1); the same seed gives the same sequence. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Helpers for plan.md VOCABULARY (h1 set). Each takes the grid first, then its position; boxes are inclusive
// [x0, y0, z0, x1, y1, z1]. A helper writes only inside its footprint, only into air (gardenBed also replaces
// ground at its soil layer), and never below its footprint. Each returns { placed, refused }: placed is
// [x, y, z, block] per write, refused is writes skipped because the cell was not air.

// A solid wall box: bricks, with a polished_deepslate plinth on its lowest two rows; openings stay air.
export function brickWall(g, box, plinth = true, openings = [])

// A shop pilaster: stripped dark oak log to y1 - 1, a dark oak planks capital at y1, and an upside-down dark oak
// stair on the capital's street side (front = the street direction, the stair's lip points that way).
export function pilaster(g, x, z, { y0 = 5, y1 = 12, front = "north" } = {})

// A hanging shop sign: a dark oak fence arm at y + 1 from (x, z) back to (x, z + 1) (joins the pilaster at x - 1),
// and the hanging sign below the arm's front end. rotation 8 faces north, the street.
export function hangingSign(g, x, z, y, text, { rotation = 8 } = {})

// A pair of open dark oak trapdoors either side of a window: x = the window's west column, y = its bottom row, z = the
// shutter plane. face = the way the facade looks out (north = the street), so each shutter hinges on the wall side.
export function shutterPair(g, x, y, z, face = "north", { width = 2, height = 3 } = {})

// Bricks across the keeper's aisle at each x in xs (one number or an array), y0..y1, at plane z.
export function aislePartition(g, xs, z, { y0 = 5, y1 = 12 } = {})

// A straight spruce stair flight of `width` cells: step i sits at y0 + i, starting at (x, z) and walking in dir (its
// facing is the walking-up direction). stringer: a bottom slab under each step after the first (a solid flight).
// rails: which open sides get a dark oak fence rail at step height + 1, "neg" (x - 1 or z - 1) and/or "pos"; the
// top step gets none, so the arrival stays open. room: the box the flight must fit inside (throws if not).
export function stairFlight(g, x, z, y0, y1, dir, { width = 2, rails = ["neg", "pos"], stringer = true, room = null } = {})

// A ladder on a wall at (x, z), from y0 to y1, facing (away from the wall, north = the wall is south of it), and an
// open dark oak trapdoor one cell out in front of its top (the loft hatch). cut: the hatch may replace a floor cell.
export function ladderHatch(g, x, z, y0, y1, { facing = "north", cut = false, room = null } = {})

// A garden bed: the box (x0..x1, z0..z1) at soil layer y (default 5). Farmland, with a water source at waterAt = [x, z]
// that replaces ground; crop (carrots, potatoes, beetroots, wheat) fully grown above the farmland at y + 1; and a
// ring of bottom spruce slabs at y + 1 round the bed (the border is part of the footprint).
export function gardenBed(g, x0, z0, x1, z1, waterAt, crop, { y = 5 } = {})

// A double spruce fence gate, both leaves facing the same way, in the fence line at y: cells (x, z) and the one
// next to it across the line (x + 1 for a north/south facing gate, z + 1 for east/west).
export function gateDouble(g, x, z, facing = "south", { y = 6 } = {})

// Compost and stores against a rear wall at (x, z), a 3 x 2 block at y (default 6): two composters on the back row
// with barrels between and in front of them. Row 1 is the back row (the one against the wall).
export function compostStore(g, x, z, { y = 6 } = {})
```

### vocab/h2.mjs

```js
// Shop-house vocabulary, batch 2 (plan.md VOCABULARY): quoinPair, fascia, hood, doorPair, chimneyStack,
// ladderHatch, pathRun, lampPost, waterButt. Each helper:
//   - takes its position (and facing) as arguments, in plan.md's order where it gives one; the grid comes first;
//   - writes only the cells of its own footprint, and only into AIR. opts.over: true lets it replace a non-air
//     block in its own footprint (quoins on brick, the surface row of a path, the chimney base on grass). Nothing
//     below the footprint is ever written, so the ground and floor an earlier part laid stay as they are;
//   - returns { placed, refused }: refused lists [x, y, z, block, why] for every write it did not make
//     (not air, outside the grid, or refused by guard()). Report it; never assume a write landed.
// Block states are the ones `mcd states` lists for this version (no waterlogged on these blocks).

/** Two `smooth_quartz` blocks stacked at (x, z), y and y+1: one quoin pair on a corner of brick. Use over: true on brick. */
export function quoinPair(g, x, z, y, opts = {})

/**
 * Shop name board: a solid board x0..x1, y0..y1 at plane z (red_nether_bricks by default), with the name in banner
 * letters on the plane in front of it (z - 1, facing north, read left to right from the street). The letters go
 * only on air; they never replace a block. material: the board block; null keeps the wall as the board.
 */
export function fascia(g, x0, x1, y0, y1, z, name, material = "red_nether_bricks", opts = {})

/**
 * Hood over a door or window: a bottom `dark_oak_slab` row x0..x1 at (y, z), carried on upside-down `dark_oak_stairs`
 * at both ends (y - 1, backs into the wall). Two hanging lanterns sit under the slab's inner cells; each hangs from
 * the slab above it. (plan.md puts the lanterns at the ends in front of the wall; the ends carry the stairs, so the
 * lanterns go to the next cells in, where a block is above them.) facing: the way the hood projects, e.g. "north".
 */
export function hood(g, x0, x1, y, z, facing = "north", opts = {})

/**
 * Double door (two `dark_oak_door` leaves side by side, both halves each) with its face toward `facing`. The leaves
 * are at (x, z) and the next cell along the wall (x + 1 for north/south, z + 1 for east/west). Hinges sit on the outer
 * edges, so the leaves open away from each other. material: the wood (dark_oak by default).
 */
export function doorPair(g, x, y, z, facing = "north", opts = {})

/**
 * Chimney stack on a 2x2 footing at (x..x+1, z..z+1): bricks from `base` up to capY - 1, a `deepslate_bricks` band at
 * bandY, one hay_block at the top corner (x+1, hayY, z+1) with a lit campfire above it (signal fire) at capY, and a
 * `brick_slab` top cap ring one out at capY around the flue. hayY must be capY - 1 (the campfire sits on the hay).
 */
export function chimneyStack(g, x, z, base, bandY, hayY, capY, opts = {})

/**
 * Ladder up a wall at x, z from y0 to y1, facing `facing` (away from the wall, north for a wall on the south side).
 * An open trapdoor hatch sits in the floor at the top, one cell out in front of the ladder (y1 + 1), hinged toward the
 * ladder. The floor cell is left air by the shell (a reserved opening), so the hatch needs no over.
 */
export function ladderHatch(g, x, z, y0, y1, facing = "north", opts = {})

/**
 * A path of `block` (dirt_path) at height y along the polyline pts = [[x, z], ...], `width` cells across, axis-aligned
 * segments only. The width is centred on the line (the extra cell goes to +x / +z). A surface path replaces the lot's
 * grass, so callers pass over: true.
 */
export function pathRun(g, pts, width, y, opts = {})

/** A garden lamp post: `spruce_fence` posts from y up `height` cells (3 by default), a standing lantern on top. */
export function lampPost(g, x, z, y, opts = {})

/** A water butt: a `water_cauldron` at level 3, one cell at (x, y, z). */
export function waterButt(g, x, z, y, opts = {})
```

### vocab/h3.mjs

```js
// Vocabulary, batch 3: cornice, awning, sashWindow, setDisplay, hearth, hangLantern, fenceRun, fruitTree, bench.
// Each takes its position (and facing, where it has one) as arguments and writes only its own footprint. Writes go
// into air only unless the call passes { over: true }. Every call returns { placed, skipped }: placed is the cells it
// wrote, skipped is what it refused and why. Nothing here imports vocab.mjs or the other vocab/ files.

/**
 * Cornice: upside-down smooth_quartz_stairs along x0..x1 at (z, y). `into` is the way the stairs' back faces (into the
 * wall; south for the street front). Plan: x 4..19 at z 4, y 13.
 */
export function cornice(g, x0, x1, z, y, into = "south", opts = {})

/**
 * Striped awning along x0..x1 at (z, y), on the street front: wool alternates colA / colB by column (colour names
 * such as "red" become "red_wool"), with an open dark_oak_trapdoor valance one cell out, at z - 1, same height.
 * Plan: x 10..18, z 4, y 9, colours red / white.
 */
export function awning(g, x0, x1, z, y, colA, colB, opts = {})

/**
 * Sash window in an outer wall, looking out to `face` (north = the street). The opening's first cell is (x, z) on the
 * outer plane, seen from outside: z is the outer plane for a north or south face, x for an east or west face; the run
 * goes along x (north/south faces) or z (east/west faces). Glass sits one cell in from the outer plane, joined to its
 * neighbours. Lintel: smooth_quartz on the outer plane, one wider each side, above. Sill: smooth_quartz_slab top,
 * one cell out, below (opts.sill: false to leave it out). The shell leaves the opening itself as air; the lintel
 * needs the wall cells it sits in, so pass { over: true } once the wall stands. Plan: front windows at z 5, w 2, h 3.
 */
export function sashWindow(g, face, x, y, z, w, h, opts = {})

/**
 * sockets.json "display" for one socket: the inert blocks the shop shows, as an array or a "a,b,c" string. Rewrites the
 * file in place (1-space indent, as sockets.mjs writes it) and touches no other key. The socket must exist.
 * Returns the stored display string.
 */
export function setDisplay(socket, blocks, file = "sockets.json")

/**
 * First-floor hearth on a wall. Firebox: two cells wide, two high, one deep, in the room's edge column. (x, z) is the
 * first column (lower x, or lower z for a north/south-running wall); facing is the way the fire opens into the room
 * (west for the east wall). Stone floor at row y, a lit campfire on it at row y+1, a stone hob beside the fire, and an
 * upside-down brick_stairs lintel at y+2 whose back is on the wall. The flue belongs to the chimney part. The two cells
 * in front of the firebox (rows y and y+1) are the lane and are never written. opts.room = [x0, y0, z0, x1, y1, z1]:
 * when given, the firebox and lane must sit inside it and the lane must be clear, or nothing is written.
 * Plan: x 18, z 13..14, y 14 (living room).
 */
export function hearth(g, x, y, z, facing, opts = {})

/**
 * Hanging lantern at (x, y, z), hung from the block above it (a floor, or an iron_chain): refused, with a reason, when
 * nothing is above. Plan: aisle lanterns at y 12 under the y 13 floor.
 */
export function hangLantern(g, x, y, z, opts = {})

/**
 * Fence along a polyline of [x, z] points at height y. Segments must be axis-aligned. Each post's arms join its
 * neighbours in the run and any solid block beside it at y, so the fence reads as one line. opts.material: spruce by
 * default ("oak" gives oak_fence). Plan: garden fence at y 6.
 */
export function fenceRun(g, pts, y, opts = {})

/**
 * Fruit tree: an oak_log trunk at (x, y..y+4, z) and a 5 x 5 x 5 crown of persistent oak_leaves over x±2, z±2,
 * y+3..y+7. The crown is air-only, so it never overwrites the trunk. Plan: x 23, z 35, y 6.
 */
export function fruitTree(g, x, z, y = 6, opts = {})

/** Garden bench: one spruce stair at (x, y, z) with its facing as given (plan: 12, 6, 25, facing east). */
export function bench(g, x, y, z, facing = "east", opts = {})
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
